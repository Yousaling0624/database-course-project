import React, { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import * as api from '../api';

export default function SystemMaintenance({ showToast }) {
    const [backupData, setBackupData] = useState(null);
    const [restoreFile, setRestoreFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleBackup = async () => {
        setLoading(true);
        try {
            const data = await api.backupDatabase();
            setBackupData(data);

            // Download as JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('数据备份成功，文件已下载', 'success');
        } catch (err) {
            showToast('备份失败: ' + err.message, 'error');
        }
        setLoading(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    setRestoreFile(data);
                } catch (err) {
                    showToast('无效的备份文件', 'error');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) {
            showToast('请先选择备份文件', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.restoreDatabase(restoreFile);
            showToast('数据恢复成功', 'success');
            setRestoreFile(null);
            setShowConfirm(false);
        } catch (err) {
            showToast('恢复失败: ' + err.message, 'error');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">系统维护</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Download className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">数据备份</h2>
                            <p className="text-sm text-slate-500">导出所有数据到 JSON 文件</p>
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
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? '备份中...' : '立即备份'}
                        </button>
                    </div>
                </div>

                {/* Restore Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
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
                                accept=".json"
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
                                            已选择备份文件
                                        </span>
                                    ) : (
                                        '点击选择备份文件 (.json)'
                                    )}
                                </p>
                            </label>
                        </div>

                        {restoreFile && (
                            <div className="bg-slate-50 rounded-xl p-4 text-sm">
                                <p className="text-slate-600">备份时间: {new Date(restoreFile.backup_time).toLocaleString()}</p>
                                <p className="text-slate-500 mt-1">
                                    包含: {restoreFile.users?.length || 0} 用户, {restoreFile.medicines?.length || 0} 药品,
                                    {restoreFile.customers?.length || 0} 客户, {restoreFile.suppliers?.length || 0} 供应商
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={!restoreFile || loading}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            恢复数据
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
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
