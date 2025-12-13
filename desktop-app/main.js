const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;

// Path to backend executable
const getBackendPath = () => {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'backend', 'pharma-backend.exe');
    }
    return path.join(__dirname, 'backend', 'pharma-backend.exe');
};

// Wait for backend to be ready
const waitForBackend = (url, timeout = 30000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkServer = () => {
            http.get(url, (res) => {
                resolve(true);
            }).on('error', () => {
                if (Date.now() - startTime > timeout) {
                    reject(new Error('Backend startup timeout'));
                } else {
                    setTimeout(checkServer, 500);
                }
            });
        };

        checkServer();
    });
};

// Start backend process
const startBackend = () => {
    const backendPath = getBackendPath();
    console.log('Starting backend from:', backendPath);

    backendProcess = spawn(backendPath, [], {
        env: {
            ...process.env,
            DSN: process.env.DSN || 'root:root@tcp(127.0.0.1:3306)/pharma_db?charset=utf8mb4&parseTime=True&loc=Local'
        }
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
};

// Create main window
const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: '康源医药销售管理系统',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Remove menu bar
    mainWindow.setMenuBarVisibility(false);

    // Load the frontend
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        // In development, load from dist folder
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.whenReady().then(async () => {
    // Start backend
    startBackend();

    // Wait for backend to be ready
    try {
        await waitForBackend('http://localhost:8080/api/dashboard/stats');
        console.log('Backend is ready');
    } catch (err) {
        dialog.showErrorBox('启动失败', '后端服务启动失败，请确保MySQL数据库已运行。\n\n详细信息：' + err.message);
        app.quit();
        return;
    }

    // Create window
    createWindow();
});

app.on('window-all-closed', () => {
    // Kill backend process
    if (backendProcess) {
        backendProcess.kill();
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Clean exit
app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
