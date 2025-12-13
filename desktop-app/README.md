# 康源医药销售管理系统 - 桌面版

## 前提条件

1. **MySQL 数据库**：确保 MySQL 已安装并运行
2. **Node.js**：需要安装 Node.js 18+ 来运行 Electron

## 数据库配置

默认连接配置：
- 地址: `127.0.0.1:3306`
- 用户名: `root`
- 密码: `root`
- 数据库: `pharma_db`

如需修改，设置环境变量 `DSN`：
```
DSN=用户名:密码@tcp(地址:端口)/数据库名?charset=utf8mb4&parseTime=True&loc=Local
```

## 快速开始

### 方法 1：直接运行（开发模式）

```bash
# 进入目录
cd desktop-app

# 安装依赖
npm install

# 启动应用
npm start
```

### 方法 2：打包成安装程序

```bash
# 进入目录
cd desktop-app

# 安装依赖
npm install

# 打包
npm run build

# 安装程序在 release 目录
```

## 目录结构

```
desktop-app/
├── main.js          # Electron 主进程
├── preload.js       # 预加载脚本
├── package.json     # 项目配置
├── backend/
│   └── pharma-backend.exe  # Go 后端
└── dist/            # 前端静态文件
    ├── index.html
    └── assets/
```

## 云端数据库

如需连接远程 MySQL，修改 `main.js` 中的 DSN：

```javascript
DSN: 'user:password@tcp(远程IP:3306)/pharma_db?charset=utf8mb4&parseTime=True&loc=Local'
```

## 默认账号

- 管理员: `admin` / `password`
- 员工: `zhangsan` / `password` (及其他50个员工)
