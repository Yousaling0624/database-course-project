import React, { useState, useEffect } from 'react';
import { Plus, Package, Truck, RotateCcw, Search } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

export default function InboundManagement({ showToast }) {
    const [inbounds, setInbounds] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedReturnItem, setSelectedReturnItem] = useState(null);
    const [returnReason, setReturnReason] = useState('');

    // Selections for Modal
    const [medicines, setMedicines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [formData, setFormData] = useState({ medicine_id: '', supplier_id: '', quantity: '', price: '' });
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    // Get user role from localStorage
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'staff';

    const fetchInbounds = async (page = 1, keyword = '') => {
        try {
            const res = await api.getInbounds(keyword || searchTerm, page, 10);
            setInbounds(res.data || res);
            if (res.meta) setMeta(res.meta);
        } catch (err) {
            if (showToast) showToast('获取入库记录失败', 'error');
        }
    };

    const fetchSelections = async () => {
        try {
            const [medsRes, supsRes] = await Promise.all([api.getMedicines(''), api.getSuppliers('')]);
            setMedicines(medsRes.data || medsRes);
            setSuppliers(supsRes.data || supsRes);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInbounds(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handlePageChange = (newPage) => {
        fetchInbounds(newPage);
    };

    const handleOpenModal = () => {
        fetchSelections();
        setEditingId(null);
        setFormData({ medicine_id: '', supplier_id: '', quantity: '', price: '' });
        setIsModalOpen(true);
    }

    const handleSubmit = async () => {
        if (!formData.medicine_id || !formData.supplier_id || !formData.quantity || !formData.price) {
            if (showToast) showToast('请填写完整信息', 'error');
            return;
        }

        try {
            if (editingId) {
                await api.updateInbound(editingId, {
                    medicine_id: parseInt(formData.medicine_id),
                    supplier_id: parseInt(formData.supplier_id),
                    quantity: parseInt(formData.quantity),
                    price: parseFloat(formData.price)
                });
                if (showToast) showToast('入库记录更新成功');
            } else {
                await api.createInbound({
                    medicine_id: parseInt(formData.medicine_id),
                    supplier_id: parseInt(formData.supplier_id),
                    quantity: parseInt(formData.quantity),
                    price: parseFloat(formData.price)
                });
                if (showToast) showToast('入库登记成功');
            }
            setIsModalOpen(false);
            setFormData({ medicine_id: '', supplier_id: '', quantity: '', price: '' });
            setEditingId(null);
            fetchInbounds(searchTerm);
        } catch (err) {
            if (showToast) showToast(editingId ? '更新失败' : '入库失败', 'error');
        }
    };

    const handleEdit = (item) => {
        fetchSelections();
        setFormData({
            medicine_id: item.medicine_id,
            supplier_id: item.supplier_id,
            quantity: item.quantity,
            price: item.price
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这条入库记录吗？库存将自动调整。')) return;
        try {
            await api.deleteInbound(id);
            if (showToast) showToast('入库记录删除成功');
            fetchInbounds(searchTerm);
        } catch (err) {
            if (showToast) showToast('删除失败', 'error');
        }
    };

    // Return Handlers
    const handleReturnClick = (item) => {
        setSelectedReturnItem(item);
        setReturnReason('');
        setIsReturnModalOpen(true);
    };

    const handleSubmitReturn = async () => {
        if (!returnReason.trim()) {
            if (showToast) showToast('请填写退货原因', 'error');
            return;
        }
        try {
            await api.createPurchaseReturn({
                inbound_id: selectedReturnItem.id,
                reason: returnReason
            });
            if (showToast) showToast('采购退货处理成功');
            setIsReturnModalOpen(false);
            fetchInbounds(searchTerm);
        } catch (err) {
            if (showToast) showToast('退货失败: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col card-hover">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Package size={20} className="text-teal-600" />
                        入库管理
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                placeholder="搜索药品/供应商/单号..."
                                className="input-field pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="btn-primary flex items-center justify-center whitespace-nowrap"
                        >
                            <Plus size={16} className="mr-2" />
                            新建入库单
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4 whitespace-nowrap">药品名称</th>
                                <th className="px-6 py-4 whitespace-nowrap">供应商</th>
                                <th className="px-6 py-4 whitespace-nowrap">入库数量</th>
                                <th className="px-6 py-4 whitespace-nowrap">进货单价</th>
                                <th className="px-6 py-4 whitespace-nowrap">入库时间</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {inbounds.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Package size={16} className="mr-2 text-slate-400" />
                                            {item.medicine_name || item.medicine?.name || '未知药品'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Truck size={14} className="mr-2 text-slate-300" />
                                            {item.supplier_name || item.supplier?.name || '未知供应商'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-emerald-600 font-medium whitespace-nowrap">+{item.quantity}</td>
                                    <td className="px-6 py-4 text-slate-700 font-mono whitespace-nowrap">¥{item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                                        {new Date(item.inbound_date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            {userRole === 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-teal-600 hover:text-teal-800 font-medium text-xs"
                                                    >
                                                        编辑
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-500 hover:text-red-700 font-medium text-xs"
                                                    >
                                                        删除
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleReturnClick(item)}
                                                className="text-orange-500 hover:text-orange-700 font-medium text-xs flex items-center gap-1"
                                            >
                                                <RotateCcw size={14} />
                                                退货
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {inbounds.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        暂无入库记录
                                    </td>
                                </tr>
                            )}
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
                title={editingId ? "编辑入库记录" : "新建入库单"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">选择药品</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-white"
                            value={formData.medicine_id}
                            onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
                        >
                            <option value="">请选择药品...</option>
                            {medicines.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.spec})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">选择供应商</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-white"
                            value={formData.supplier_id}
                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        >
                            <option value="">请选择供应商...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">入库数量</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">进货单价 (¥)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                            确认入库
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Return Modal */}
            <Modal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                title="采购退货"
            >
                <div className="space-y-4">
                    <div className="bg-orange-50 p-3 rounded-lg flex items-start gap-2">
                        <RotateCcw className="text-orange-600 mt-0.5" size={16} />
                        <div>
                            <p className="text-sm font-medium text-orange-800">退货确认</p>
                            <p className="text-xs text-orange-600 mt-1">
                                您正在处理药品 <b>{selectedReturnItem?.medicine_name}</b> 的入库退货。
                                <br />
                                数量: {selectedReturnItem?.quantity}
                                <br />
                                确认后库存将相应减少。
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">退货原因</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                            rows="3"
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="请输入退货原因..."
                        ></textarea>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            onClick={() => setIsReturnModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmitReturn}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium shadow-md shadow-orange-500/20"
                        >
                            确认退货
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

