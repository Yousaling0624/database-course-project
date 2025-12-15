import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle, Server, RefreshCw } from 'lucide-react';
import * as api from '../api';

export default function SystemMaintenance({ showToast }) {
    const [backupData, setBackupData] = useState(null);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreFileName, setRestoreFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Database config state
    const [dbConfig, setDbConfig] = useState({
        host: 'mysql',
        port: 3306,
        user: 'root',
        password: '',
        database: 'pharma_db'
    });
    const [dbConnected, setDbConnected] = useState(false);
    const [dbLoading, setDbLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);


    // Load database config and status on mount
    useEffect(() => {
        loadDatabaseStatus();
        loadDatabaseConfig();
    }, []);

    const loadDatabaseStatus = async () => {
        try {
            const status = await api.getDatabaseStatus();
            setDbConnected(status.connected);
        } catch (err) {
            console.error('Failed to get database status:', err);
        }
    };

    const loadDatabaseConfig = async () => {
        try {
            const config = await api.getDatabaseConfig();
            setDbConfig({
                host: config.host || '127.0.0.1',
                port: config.port || 3306,
                user: config.user || 'root',
                password: '', // Never pre-fill password from masked response
                database: config.database || 'pharma_db'
            });
        } catch (err) {
            console.error('Failed to get database config:', err);
        }
    };

    const handleTestConnection = async () => {
        setDbLoading(true);
        setTestResult(null);
        try {
            const result = await api.testDatabaseConfig(dbConfig);
            setTestResult({ success: true, message: result.message || '连接成功' });
            showToast('数据库连接测试成功', 'success');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || '连接失败';
            setTestResult({ success: false, message: errorMsg });
            showToast('连接测试失败: ' + errorMsg, 'error');
        }
        setDbLoading(false);
    };

    const handleSaveConfig = async () => {
        setDbLoading(true);
        try {
            const result = await api.updateDatabaseConfig(dbConfig);
            if (result.success) {
                showToast('数据库配置已保存并连接成功', 'success');
                setDbConnected(true);
                setTestResult({ success: true, message: '配置已保存' });
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || '保存失败';
            showToast('保存失败: ' + errorMsg, 'error');
            setTestResult({ success: false, message: errorMsg });
        }
        setDbLoading(false);
    };

    const handleBackup = async () => {
        if (!dbConnected) {
            showToast('请先连接数据库', 'error');
            return;
        }
        setLoading(true);
        try {
            // Request SQL file directly from backend
            const response = await fetch('/api/system/backup', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('备份失败');

            const sqlContent = await response.text();
            const blob = new Blob([sqlContent], { type: 'application/sql' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('数据备份成功，SQL文件已下载', 'success');
        } catch (err) {
            showToast('备份失败: ' + err.message, 'error');
        }
        setLoading(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.sql')) {
                showToast('请选择 .sql 格式的备份文件', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setRestoreFile(event.target.result);
                setRestoreFileName(file.name);
            };
            reader.readAsText(file);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) {
            showToast('请先选择备份文件', 'error');
            return;
        }
        if (!dbConnected) {
            showToast('请先连接数据库', 'error');
            return;
        }

        setLoading(true);
        try {
            // Send SQL content as plain text
            const response = await fetch('/api/system/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: restoreFile
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || '恢复失败');

            showToast('数据恢复成功', 'success');
            setRestoreFile(null);
            setRestoreFileName('');
            setShowConfirm(false);
        } catch (err) {
            showToast('恢复失败: ' + err.message, 'error');
        }
        setLoading(false);
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800">系统维护</h1>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${dbConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {dbConnected ? '数据库已连接' : '数据库未连接'}
                    </span>
                </div>
            </div>

            {/* Database Configuration Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Server className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">数据库配置</h2>
                        <p className="text-sm text-slate-500">配置 MySQL 数据库连接</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">主机地址</label>
                        <input
                            type="text"
                            value={dbConfig.host}
                            onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            placeholder="127.0.0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">端口</label>
                        <input
                            type="number"
                            value={dbConfig.port}
                            onChange={(e) => setDbConfig({ ...dbConfig, port: parseInt(e.target.value) || 3306 })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            placeholder="3306"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">数据库名</label>
                        <input
                            type="text"
                            value={dbConfig.database}
                            onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            placeholder="pharma_db"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
                        <input
                            type="text"
                            value={dbConfig.user}
                            onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            placeholder="root"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
                        <input
                            type="password"
                            value={dbConfig.password}
                            onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {testResult && (
                    <div className={`mb-4 px-4 py-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <div className="flex items-center gap-2">
                            {testResult.success ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                            <span>{testResult.message}</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleTestConnection}
                        disabled={dbLoading}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} className={dbLoading ? 'animate-spin' : ''} />
                        测试连接
                    </button>
                    <button
                        onClick={handleSaveConfig}
                        disabled={dbLoading}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                        {dbLoading ? '保存中...' : '保存并连接'}
                    </button>
                </div>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Backup Section */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Download className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">数据备份</h2>
                            <p className="text-sm text-slate-500">导出所有数据到 SQL 文件</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <h3 className="font-medium text-blue-800 mb-2">备份内容</h3>
                            <ul className="text-sm text-blue-600 space-y-1">
                                <li>• 用户/员工信息</li>
                                <li>• 药品信息</li>
                                <li>• 客户信息</li>
                                <li>• 供应商信息</li>
                                <li>• 入库记录</li>
                                <li>• 销售记录</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleBackup}
                            disabled={loading || !dbConnected}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? '备份中...' : '立即备份'}
                        </button>
                    </div>
                </div>

                {/* Restore Section */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <Upload className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">数据恢复</h2>
                            <p className="text-sm text-slate-500">从备份文件恢复数据</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="text-orange-600 mt-0.5" size={18} />
                                <div>
                                    <h3 className="font-medium text-orange-800">警告</h3>
                                    <p className="text-sm text-orange-600">恢复数据将覆盖现有数据，此操作不可撤销！</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                            <input
                                type="file"
                                accept=".sql"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="restore-file"
                            />
                            <label htmlFor="restore-file" className="cursor-pointer">
                                <Database className="mx-auto text-slate-400 mb-2" size={32} />
                                <p className="text-sm text-slate-500">
                                    {restoreFile ? (
                                        <span className="text-green-600 flex items-center justify-center gap-1">
                                            <CheckCircle size={16} />
                                            已选择: {restoreFileName}
                                        </span>
                                    ) : (
                                        '点击选择备份文件 (.sql)'
                                    )}
                                </p>
                            </label>
                        </div>

                        {restoreFile && (
                            <div className="bg-slate-50 rounded-xl p-4 text-sm">
                                <p className="text-slate-600">文件名: {restoreFileName}</p>
                                <p className="text-slate-500 mt-1">
                                    大小: {(restoreFile.length / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={!restoreFile || loading || !dbConnected}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            恢复数据
                        </button>
                    </div>
                </div>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold">确认恢复数据？</h3>
                        </div>
                        <p className="text-slate-600 mb-6">
                            此操作将删除所有现有数据并从备份文件恢复。请确保您已备份当前数据。
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleRestore}
                                disabled={loading}
                                className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                            >
                                {loading ? '恢复中...' : '确认恢复'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
