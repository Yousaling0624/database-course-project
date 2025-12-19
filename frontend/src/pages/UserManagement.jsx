import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, User, Shield } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

export default function UserManagement({ showToast }) {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', real_name: '', phone: '', role: 'staff' });
    const [editingId, setEditingId] = useState(null);

    const fetchUsers = async (page = 1) => {
        try {
            const res = await api.getUsers(page, 10);
            if (res.data) {
                setUsers(res.data);
                if (res.meta) setMeta(res.meta);
            } else {
                setUsers(res);
            }
        } catch (err) {
            console.error(err);
            if (showToast) showToast('获取员工列表失败', 'error');
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, []);

    const handlePageChange = (newPage) => {
        fetchUsers(newPage);
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.updateUser(editingId, formData);
                if (showToast) showToast('员工信息更新成功');
            } else {
                await api.createUser(formData);
                if (showToast) showToast('新员工添加成功');
            }
            setIsModalOpen(false);
            setFormData({ username: '', password: '', real_name: '', phone: '', role: 'staff' });
            setEditingId(null);
            fetchUsers();
        } catch (err) {
            console.error(err);
            if (showToast) showToast(editingId ? '更新失败' : '添加失败', 'error');
        }
    };

    const handleEdit = (user) => {
        setFormData({
            username: user.username,
            password: '', // Don't fill password
            real_name: user.real_name,
            phone: user.phone,
            role: user.role
        });
        setEditingId(user.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除该员工吗？')) return;
        try {
            await api.deleteUser(id);
            if (showToast) showToast('员工删除成功');
            fetchUsers();
        } catch (err) {
            if (showToast) showToast('删除失败', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col card-hover">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <User size={20} className="text-teal-600" />
                        员工管理
                    </h2>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ username: '', password: '', real_name: '', phone: '', role: 'staff' });
                            setIsModalOpen(true);
                        }}
                        className="btn-primary flex items-center justify-center whitespace-nowrap w-full sm:w-auto"
                    >
                        <Plus size={16} className="mr-2" />
                        添加员工
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4 whitespace-nowrap">用户名</th>
                                <th className="px-6 py-4 whitespace-nowrap">姓名</th>
                                <th className="px-6 py-4 whitespace-nowrap">联系电话</th>
                                <th className="px-6 py-4 whitespace-nowrap">角色</th>
                                <th className="px-6 py-4 whitespace-nowrap">入职时间</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">{user.username}</td>
                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{user.real_name || '-'}</td>
                                    <td className="px-6 py-4 text-slate-500 font-mono whitespace-nowrap">{user.phone || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {user.role === 'admin' ? <Shield size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
                                            {user.role === 'admin' ? '管理员' : '员工'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleEdit(user)} className="text-teal-600 hover:text-teal-800 font-medium text-xs">编辑</button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">删除</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={meta.page}
                totalPages={meta.total_pages}
                onPageChange={handlePageChange}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "编辑员工" : "添加新员工"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            disabled={!!editingId}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{editingId ? '重置密码 (留空不修改)' : '密码'}</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">真实姓名</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                value={formData.real_name}
                                onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
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
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">角色</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-white"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="staff">普通员工</option>
                            <option value="admin">管理员</option>
                        </select>
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
