import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, User, Calendar } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

export default function Sales({ showToast }) {
    const [sales, setSales] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Selections
    const [medicines, setMedicines] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [formData, setFormData] = useState({ medicine_id: '', customer_id: '', quantity: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [showPrescriptionOnly, setShowPrescriptionOnly] = useState(false);

    const fetchSales = async (keyword = '', type = '') => {
        try {
            // If type logic is needed (e.g. only passing '处方药' when checkbox checked)
            const typeFilter = showPrescriptionOnly ? '处方药' : '';
            // Allow overriding if needed, otherwise use state
            const finalType = type || typeFilter;

            const data = await api.getSales(keyword, finalType);
            setSales(data);
        } catch (err) {
            if (showToast) showToast('获取销售记录失败', 'error');
        }
    };

    const fetchSelections = async () => {
        try {
            const [meds, custs] = await Promise.all([api.getMedicines(''), api.getCustomers('')]);
            setMedicines(meds);
            setCustomers(custs);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            const typeFilter = showPrescriptionOnly ? '处方药' : '';
            fetchSales(searchTerm, typeFilter);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, showPrescriptionOnly]);

    const handleOpenModal = () => {
        fetchSelections();
        setIsModalOpen(true);
    }

    const handleSubmit = async () => {
        if (!formData.medicine_id || !formData.customer_id || !formData.quantity) {
            if (showToast) showToast('请填写完整信息', 'error');
            return;
        }

        try {
            await api.createSale({
                medicine_id: parseInt(formData.medicine_id),
                customer_id: parseInt(formData.customer_id),
                quantity: parseInt(formData.quantity)
            });
            if (showToast) showToast('销售登记成功');
            setIsModalOpen(false);
            setFormData({ medicine_id: '', customer_id: '', quantity: '' });
            fetchSales(searchTerm);
        } catch (err) {
            console.error(err);
            if (showToast) showToast('销售失败: ' + (err.response?.data?.error || '库存不足或未知错误'), 'error');
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
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
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
                                </tr>
                            ))}
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        暂无销售记录
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
                title="新建销售订单"
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
        </div>
    );
}
