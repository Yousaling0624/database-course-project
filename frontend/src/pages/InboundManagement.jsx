import React, { useState, useEffect } from 'react';
import { Plus, Package, Truck, Calendar, Search } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';

export default function InboundManagement({ showToast }) {
    const [inbounds, setInbounds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Selections for Modal
    const [medicines, setMedicines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [formData, setFormData] = useState({ medicine_id: '', supplier_id: '', quantity: '', price: '' });

    const fetchInbounds = async () => {
        try {
            const data = await api.getInbounds();
            setInbounds(data);
        } catch (err) {
            if (showToast) showToast('获取入库记录失败', 'error');
        }
    };

    const fetchSelections = async () => {
        try {
            const [meds, sups] = await Promise.all([api.getMedicines(''), api.getSuppliers()]);
            setMedicines(meds);
            setSuppliers(sups);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        fetchInbounds();
    }, []);

    const handleOpenModal = () => {
        fetchSelections();
        setIsModalOpen(true);
    }

    const handleSubmit = async () => {
        if (!formData.medicine_id || !formData.supplier_id || !formData.quantity || !formData.price) {
            if (showToast) showToast('请填写完整信息', 'error');
            return;
        }

        try {
            await api.createInbound({
                medicine_id: parseInt(formData.medicine_id),
                supplier_id: parseInt(formData.supplier_id),
                quantity: parseInt(formData.quantity),
                price: parseFloat(formData.price)
            });
            if (showToast) showToast('入库登记成功');
            setIsModalOpen(false);
            setFormData({ medicine_id: '', supplier_id: '', quantity: '', price: '' });
            fetchInbounds();
        } catch (err) {
            if (showToast) showToast('入库失败', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800">入库管理</h2>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-slate-900/10"
                    >
                        <Plus size={16} className="mr-2" />
                        新建入库单
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4">药品名称</th>
                                <th className="px-6 py-4">供应商</th>
                                <th className="px-6 py-4">入库数量</th>
                                <th className="px-6 py-4">进货单价</th>
                                <th className="px-6 py-4">入库时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {inbounds.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        <div className="flex items-center">
                                            <Package size={16} className="mr-2 text-slate-400" />
                                            {item.medicine?.name || '未知药品'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center">
                                            <Truck size={14} className="mr-2 text-slate-300" />
                                            {item.supplier?.name || '未知供应商'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-emerald-600 font-medium">+{item.quantity}</td>
                                    <td className="px-6 py-4 text-slate-700 font-mono">¥{item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">
                                        {new Date(item.inbound_date).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {inbounds.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        暂无入库记录
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
                title="新建入库单"
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
        </div>
    );
}
