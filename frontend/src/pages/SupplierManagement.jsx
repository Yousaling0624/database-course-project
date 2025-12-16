import React, { useState, useEffect } from 'react';
import { Search, Plus, Truck, Phone, MapPin } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

export default function SupplierManagement({ showToast }) {
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', contact: '', phone: '' });
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    const fetchSuppliers = async (keyword = '') => {
        try {
            const data = await api.getSuppliers(keyword);
            setSuppliers(data);
        } catch (err) {
            if (showToast) showToast('获取供应商列表失败', 'error');
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchSuppliers(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.updateSupplier(editingId, formData);
                if (showToast) showToast('供应商信息更新成功');
            } else {
                await api.createSupplier(formData);
                if (showToast) showToast('新供应商添加成功');
            }
            setIsModalOpen(false);
            setFormData({ name: '', contact: '', phone: '' });
            setEditingId(null);
            fetchSuppliers(searchTerm);
        } catch (err) {
            if (showToast) showToast(editingId ? '更新失败' : '添加失败', 'error');
        }
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, contact: item.contact, phone: item.phone });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除该供应商吗？')) return;
        try {
            await api.deleteSupplier(id);
            if (showToast) showToast('供应商删除成功');
            fetchSuppliers(searchTerm);
        } catch (err) {
            if (showToast) showToast('删除失败', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col card-hover">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Truck size={20} className="text-teal-600" />
                        供应商管理
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                placeholder="搜索供应商/联系人..."
                                className="input-field pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', contact: '', phone: '' });
                                setIsModalOpen(true);
                            }}
                            className="btn-primary flex items-center justify-center whitespace-nowrap"
                        >
                            <Plus size={16} className="mr-2" />
                            添加供应商
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4 whitespace-nowrap">供应商名称</th>
                                <th className="px-6 py-4 whitespace-nowrap">联系人</th>
                                <th className="px-6 py-4 whitespace-nowrap">联系电话</th>
                                <th className="px-6 py-4 whitespace-nowrap">合作时间</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {suppliers.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Truck size={16} className="mr-2 text-slate-400" />
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{item.contact || '-'}</td>
                                    <td className="px-6 py-4 text-slate-500 font-mono whitespace-nowrap">{item.phone || '-'}</td>
                                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleEdit(item)} className="text-teal-600 hover:text-teal-800 font-medium text-xs">编辑</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">删除</button>
                                    </td>
                                </tr>
                            ))}
                            {suppliers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        暂无供应商信息
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
                title={editingId ? "编辑供应商" : "添加供应商"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">供应商名称</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">联系人</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                value={formData.contact}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
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
