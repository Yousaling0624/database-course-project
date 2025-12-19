import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, User, RotateCcw, Search } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

import Pagination from '../components/Pagination';

export default function Sales({ showToast }) {
    const [sales, setSales] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedReturnItem, setSelectedReturnItem] = useState(null);
    const [returnReason, setReturnReason] = useState('');

    // Selections
    const [medicines, setMedicines] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [formData, setFormData] = useState({ medicine_id: '', customer_id: '', quantity: '' });
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [showPrescriptionOnly, setShowPrescriptionOnly] = useState(false);

    // Get user role from localStorage
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'staff';

    const fetchSales = async (page = 1, keyword = '', type = '') => {
        try {
            const typeFilter = showPrescriptionOnly ? '处方药' : '';
            const finalType = type || typeFilter;
            // Use current searchTerm if keyword not provided (or rely on effect)
            const search = keyword || searchTerm;

            const res = await api.getSales(search, finalType, page, 10);
            if (res.data) {
                setSales(res.data);
                setMeta(res.meta);
            } else {
                setSales(res);
            }
        } catch (err) {
            if (showToast) showToast('获取销售记录失败', 'error');
        }
    };

    const fetchSelections = async () => {
        try {
            const [medsRes, custsRes] = await Promise.all([api.getMedicines(''), api.getCustomers('')]);
            // Handle new paginated response format
            setMedicines(medsRes.data || medsRes);
            setCustomers(custsRes.data || custsRes);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSales(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, showPrescriptionOnly]);

    const handlePageChange = (newPage) => {
        fetchSales(newPage);
    };

    const handleOpenModal = () => {
        fetchSelections();
        setEditingId(null);
        setFormData({ medicine_id: '', customer_id: '', quantity: '' });
        setIsModalOpen(true);
    }

    const handleSubmit = async () => {
        if (!formData.medicine_id || !formData.customer_id || !formData.quantity) {
            if (showToast) showToast('请填写完整信息', 'error');
            return;
        }

        try {
            if (editingId) {
                await api.updateSale(editingId, {
                    medicine_id: parseInt(formData.medicine_id),
                    customer_id: parseInt(formData.customer_id),
                    quantity: parseInt(formData.quantity)
                });
                if (showToast) showToast('销售记录更新成功');
            } else {
                await api.createSale({
                    medicine_id: parseInt(formData.medicine_id),
                    customer_id: parseInt(formData.customer_id),
                    quantity: parseInt(formData.quantity)
                });
                if (showToast) showToast('销售登记成功');
            }
            setIsModalOpen(false);
            setFormData({ medicine_id: '', customer_id: '', quantity: '' });
            setEditingId(null);
            fetchSales(meta.page);
        } catch (err) {
            console.error(err);
            if (showToast) showToast(editingId ? '更新失败' : '销售失败: ' + (err.response?.data?.error || '库存不足或未知错误'), 'error');
        }
    };

    const handleEdit = (item) => {
        fetchSelections();
        setFormData({
            medicine_id: item.medicine_id,
            customer_id: item.customer_id,
            quantity: item.quantity
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这条销售记录吗？库存将自动恢复。')) return;
        try {
            await api.deleteSale(id);
            if (showToast) showToast('销售记录删除成功');
            fetchSales(meta.page);
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
            await api.createSalesReturn({
                sale_id: selectedReturnItem.id,
                reason: returnReason
            });
            if (showToast) showToast('退货处理成功');
            setIsReturnModalOpen(false);
            setIsReturnModalOpen(false);
            fetchSales(meta.page);
        } catch (err) {
            if (showToast) showToast('退货失败: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col card-hover">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-teal-600" />
                        销售订单
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                placeholder="搜索订单号/药品/客户..."
                                className="input-field pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-teal-200 transition-colors w-full sm:w-auto justify-center sm:justify-start">
                            <input
                                type="checkbox"
                                id="prescriptionOnly"
                                checked={showPrescriptionOnly}
                                onChange={(e) => setShowPrescriptionOnly(e.target.checked)}
                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
                            />
                            <label htmlFor="prescriptionOnly" className="text-sm text-slate-600 select-none cursor-pointer font-medium">
                                只看处方药
                            </label>
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="btn-primary flex items-center justify-center whitespace-nowrap w-full sm:w-auto"
                        >
                            <Plus size={16} className="mr-2" />
                            新建订单
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4 whitespace-nowrap">订单编号</th>
                                <th className="px-6 py-4 whitespace-nowrap">药品名称</th>
                                <th className="px-6 py-4 whitespace-nowrap">客户</th>
                                <th className="px-6 py-4 whitespace-nowrap">销售数量</th>
                                <th className="px-6 py-4 whitespace-nowrap">总价</th>
                                <th className="px-6 py-4 whitespace-nowrap">销售时间</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {sales.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 font-mono whitespace-nowrap">{item.order_id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {item.medicine_name || item.medicine?.name || '未知药品'}
                                            {item.medicine_type && (
                                                <span className={`px-2 py-0.5 rounded text-xs border ${item.medicine_type === '处方药'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-green-50 text-green-600 border-green-100'
                                                    }`}>
                                                    {item.medicine_type}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User size={14} className="mr-2 text-slate-300" />
                                            {item.customer_name || item.customer?.name || '未知客户'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-blue-600 font-medium whitespace-nowrap">{item.quantity}</td>
                                    <td className="px-6 py-4 text-slate-800 font-bold whitespace-nowrap">¥{item.total_price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                                        {new Date(item.sale_date).toLocaleString()}
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
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        暂无销售记录
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
                title={editingId ? "编辑销售订单" : "新建销售订单"}
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
                                <option key={m.id} value={m.id} disabled={m.stock <= 0}>
                                    {m.name} (库存: {m.stock}) - ¥{m.price}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">选择客户</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-white"
                            value={formData.customer_id}
                            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                        >
                            <option value="">请选择客户...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">销售数量</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                            确认销售
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Return Modal */}
            <Modal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                title="销售退货"
            >
                <div className="space-y-4">
                    <div className="bg-orange-50 p-3 rounded-lg flex items-start gap-2">
                        <RotateCcw className="text-orange-600 mt-0.5" size={16} />
                        <div>
                            <p className="text-sm font-medium text-orange-800">退货确认</p>
                            <p className="text-xs text-orange-600 mt-1">
                                您正在处理订单 <b>{selectedReturnItem?.order_id}</b> 的退货。
                                <br />
                                药品: {selectedReturnItem?.medicine_name} × {selectedReturnItem?.quantity}
                                <br />
                                确认后库存将自动恢复。
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

