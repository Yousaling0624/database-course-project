import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Pill, ClipboardList, Factory } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

export default function Inventory({ showToast }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Pagination & Filter State
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    // Initial load from URL params - read synchronously in state init
    const getInitialFilter = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('filter') === 'low_stock' ? 'low_stock' : 'all';
    };
    const [filterStatus, setFilterStatus] = useState(getInitialFilter);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', price: '', stock: '', spec: '', manufacturer: '' });
    const [editingId, setEditingId] = useState(null);

    // Adjust Stock Modal State
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedAdjustItem, setSelectedAdjustItem] = useState(null);
    const [adjustFormData, setAdjustFormData] = useState({ new_stock: '', reason: '' });

    const fetchData = async (page = 1, filter = filterStatus) => {
        try {
            const res = await api.getMedicines(searchQuery, page, 10, filter);
            if (res.data) {
                setData(res.data);
                setMeta(res.meta || { page: 1, limit: 10, total: 0, total_pages: 0 });
            } else if (Array.isArray(res)) {
                setData(res);
            } else {
                console.error("Invalid data format:", res);
                setData([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [searchQuery, filterStatus]);

    const handlePageChange = (newPage) => {
        fetchData(newPage);
    };

    const handleSupplierClick = (manufacturer) => {
        navigate(`/suppliers?keyword=${encodeURIComponent(manufacturer)}`);
    };

    const handleAddMedicine = async () => {
        if (!formData.name) return;
        try {
            if (editingId) {
                await api.updateMedicine(editingId, {
                    ...formData,
                    price: parseFloat(formData.price) || 0,
                    stock: parseInt(formData.stock) || 0,
                });
                if (showToast) showToast('药品信息更新成功');
            } else {
                await api.createMedicine({
                    ...formData,
                    code: formData.code || `M${Math.floor(Math.random() * 9000) + 1000}`,
                    type: 'OTC',
                    price: parseFloat(formData.price) || 0,
                    stock: parseInt(formData.stock) || 0,
                });
                if (showToast) showToast('新药品入库成功');
            }
            setIsModalOpen(false);
            setFormData({ name: '', code: '', price: '', stock: '', spec: '', manufacturer: '' });
            setEditingId(null);
            fetchData(meta.page);
        } catch (err) {
            if (showToast) showToast('操作失败', 'error');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            code: item.code,
            price: item.price,
            stock: item.stock,
            spec: item.spec,
            manufacturer: item.manufacturer
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    }

    const handleDelete = async (id) => {
        if (!window.confirm("确定删除该药品吗？")) return;
        try {
            await api.deleteMedicine(id);
            if (showToast) showToast("已删除");
            fetchData();
        } catch (e) {
            if (showToast) showToast("删除失败", "error");
        }
    }

    // Stock Adjustment Handlers
    const handleAdjustClick = (item) => {
        setSelectedAdjustItem(item);
        setAdjustFormData({ new_stock: item.stock, reason: '' });
        setIsAdjustModalOpen(true);
    };

    const handleSubmitAdjust = async () => {
        if (adjustFormData.new_stock === '' || adjustFormData.new_stock < 0) {
            if (showToast) showToast('请输入有效的库存数量', 'error');
            return;
        }
        if (!adjustFormData.reason.trim()) {
            if (showToast) showToast('请输入盘点原因', 'error');
            return;
        }

        try {
            await api.adjustStock({
                medicine_id: selectedAdjustItem.id,
                new_stock: parseInt(adjustFormData.new_stock),
                reason: adjustFormData.reason
            });
            if (showToast) showToast('库存盘点更新成功');
            setIsAdjustModalOpen(false);
            fetchData();
        } catch (err) {
            if (showToast) showToast('盘点更新失败: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col card-hover">
            {/* 工具栏 */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Pill size={20} className="text-teal-600" />
                    库存明细
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setFilterStatus(filterStatus === 'low_stock' ? 'all' : 'low_stock')}
                        className={`btn-secondary flex items-center justify-center whitespace-nowrap w-full sm:w-auto ${filterStatus === 'low_stock' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}`}
                    >
                        <ClipboardList size={16} className="mr-2" />
                        {filterStatus === 'low_stock' ? '显示全部' : '仅看缺货/预警'}
                    </button>
                    <div className="relative w-full sm:w-auto flex-1 sm:min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索药品名称/编号..."
                            className="input-field pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', code: '', price: '', stock: '', spec: '', manufacturer: '' });
                            setIsModalOpen(true);
                        }}
                        className="btn-primary flex items-center justify-center whitespace-nowrap w-full sm:w-auto"
                    >
                        <Plus size={16} className="mr-2" />
                        新建药品
                    </button>
                </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <th className="px-6 py-4 whitespace-nowrap">药品编号</th>
                            <th className="px-6 py-4 whitespace-nowrap">药品信息</th>
                            <th className="px-6 py-4 whitespace-nowrap">分类</th>
                            <th className="px-6 py-4 whitespace-nowrap">价格</th>
                            <th className="px-6 py-4 whitespace-nowrap">库存状态</th>
                            <th className="px-6 py-4 whitespace-nowrap">生产厂家</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                        {Array.isArray(data) && data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 text-slate-500 font-mono whitespace-nowrap">{item.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-slate-800">{item.name}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{item.spec}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'OTC' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">
                                    ¥{item.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <span className={`font-medium ${item.stock < 50 ? 'text-red-600' : 'text-slate-600'}`}>
                                            {item.stock}
                                        </span>
                                    </div>

                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden" title={`库存: ${item.stock}`}>
                                        <div
                                            className={`h-full rounded-full ${item.stock < 50 ? 'bg-red-500' : 'bg-teal-500'}`}
                                            style={{ width: `${Math.min((item.stock / 100) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                    {item.manufacturer && (
                                        <button
                                            onClick={() => handleSupplierClick(item.manufacturer)}
                                            className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                                            title="点击查看供应商信息"
                                        >
                                            <Factory size={14} />
                                            {item.manufacturer}
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                    <button onClick={() => handleAdjustClick(item)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">盘点</button>
                                    <button onClick={() => handleEdit(item)} className="text-teal-600 hover:text-teal-800 font-medium text-xs">编辑</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">删除</button>
                                </td>
                            </tr>
                        ))}
                        {(!Array.isArray(data) || data.length === 0) && (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                    没有找到相关药品
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={meta.page}
                totalPages={meta.total_pages}
                onPageChange={handlePageChange}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "编辑药品" : "新药入库登记"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">药品名称</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="例如：布洛芬胶囊"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">生产厂家</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            value={formData.manufacturer}
                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">单价 (¥)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">库存数量</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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
                            onClick={handleAddMedicine}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md shadow-teal-600/20"
                        >
                            {editingId ? '保存修改' : '确认入库'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Adjust Stock Modal */}
            <Modal
                isOpen={isAdjustModalOpen}
                onClose={() => setIsAdjustModalOpen(false)}
                title="库存盘点"
            >
                <div className="space-y-4">
                    <div className="bg-indigo-50 p-3 rounded-lg flex items-start gap-2">
                        <ClipboardList className="text-indigo-600 mt-0.5" size={16} />
                        <div>
                            <p className="text-sm font-medium text-indigo-800">盘点药品: {selectedAdjustItem?.name}</p>
                            <p className="text-xs text-indigo-600 mt-1">
                                当前系统库存: <b>{selectedAdjustItem?.stock}</b>
                                <br />
                                请输入实际盘点后的库存数量，系统将自动记录差异。
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">实际库存数量</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={adjustFormData.new_stock}
                            onChange={(e) => setAdjustFormData({ ...adjustFormData, new_stock: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">盘点差异原因</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                            rows="2"
                            value={adjustFormData.reason}
                            onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                            placeholder="例如：药品过期销毁、遗失、录入错误等..."
                        ></textarea>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            onClick={() => setIsAdjustModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmitAdjust}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md shadow-indigo-600/20"
                        >
                            确认盘点
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
