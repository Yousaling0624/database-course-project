import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, User, Phone } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

export default function CustomerManagement({ showToast }) {
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchCustomers = async () => {
        try {
            const data = await api.getCustomers();
            setCustomers(data);
        } catch (err) {
            if (showToast) showToast('获取客户列表失败', 'error');
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.updateCustomer(editingId, formData);
                if (showToast) showToast('客户信息更新成功');
            } else {
                await api.createCustomer(formData);
                if (showToast) showToast('新客户添加成功');
            }
            setIsModalOpen(false);
            setFormData({ name: '', phone: '' });
            setEditingId(null);
            fetchCustomers();
        } catch (err) {
            if (showToast) showToast(editingId ? '更新失败' : '添加失败', 'error');
        }
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, phone: item.phone });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除该客户吗？')) return;
        try {
            await api.deleteCustomer(id);
            if (showToast) showToast('客户删除成功');
            fetchCustomers();
        } catch (err) {
            if (showToast) showToast('删除失败', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800">客户管理</h2>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', phone: '' });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-slate-900/10"
                    >
                        <Plus size={16} className="mr-2" />
                        添加客户
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4">客户姓名</th>
                                <th className="px-6 py-4">联系电话</th>
                                <th className="px-6 py-4">注册时间</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {customers.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        <div className="flex items-center">
                                            <User size={16} className="mr-2 text-slate-400" />
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono">
                                        <div className="flex items-center">
                                            <Phone size={14} className="mr-2 text-slate-300" />
                                            {item.phone || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(item)} className="text-teal-600 hover:text-teal-800 font-medium text-xs">编辑</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">删除</button>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                        暂无客户信息
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "编辑客户" : "添加新客户"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">客户姓名</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md shadow-teal-600/20"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
