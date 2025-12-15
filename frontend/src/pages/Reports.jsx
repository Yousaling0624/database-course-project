import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, Package, DollarSign, Download, Calendar } from 'lucide-react';
import * as api from '../api';

export default function Reports({ showToast }) {
    const [activeTab, setActiveTab] = useState('financial');
    const [financialData, setFinancialData] = useState(null);
    const [inventoryData, setInventoryData] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [inboundData, setInboundData] = useState(null);
    const [reportType, setReportType] = useState('daily');
    const [loading, setLoading] = useState(false);

    const fetchFinancialReport = async () => {
        setLoading(true);
        try {
            const data = await api.getFinancialReport(reportType);
            setFinancialData(data);
        } catch (err) {
            showToast('获取财务报表失败', 'error');
        }
        setLoading(false);
    };

    const fetchInventoryReport = async () => {
        setLoading(true);
        try {
            const data = await api.getInventoryReport();
            setInventoryData(data);
        } catch (err) {
            showToast('获取库存报表失败', 'error');
        }
        setLoading(false);
    };

    const fetchSalesReport = async () => {
        setLoading(true);
        try {
            const data = await api.getSalesReport();
            setSalesData(data);
        } catch (err) {
            showToast('获取销售报表失败', 'error');
        }
        setLoading(false);
    };

    const fetchInboundReport = async () => {
        setLoading(true);
        try {
            const data = await api.getInboundReport();
            setInboundData(data);
        } catch (err) {
            showToast('获取入库报表失败', 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'financial') fetchFinancialReport();
        else if (activeTab === 'inventory') fetchInventoryReport();
        else if (activeTab === 'sales') fetchSalesReport();
        else if (activeTab === 'inbound') fetchInboundReport();
    }, [activeTab, reportType]);

    const tabs = [
        { id: 'financial', label: '财务统计', icon: DollarSign },
        { id: 'inventory', label: '库存报表', icon: Package },
        { id: 'sales', label: '销售报表', icon: TrendingUp },
        { id: 'inbound', label: '入库报表', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">报表中心</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-white rounded-xl p-2 shadow-sm overflow-x-auto whitespace-nowrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all flex-shrink-0 ${activeTab === tab.id
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Financial Report */}
            {activeTab === 'financial' && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <h2 className="text-lg font-semibold">财务统计</h2>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setReportType('daily')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg ${reportType === 'daily' ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}
                            >
                                当日统计
                            </button>
                            <button
                                onClick={() => setReportType('monthly')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg ${reportType === 'monthly' ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}
                            >
                                当月统计
                            </button>
                        </div>
                    </div>

                    {financialData && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 sm:p-6 text-white shadow-lg shadow-green-500/20">
                                <p className="text-green-100 text-sm font-medium">销售收入</p>
                                <p className="text-2xl sm:text-3xl font-bold mt-1">¥{financialData.sales_income?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs sm:text-sm text-green-200 mt-2 bg-white/10 inline-block px-2 py-0.5 rounded-lg">{financialData.sales_count} 笔订单</p>
                            </div>
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 sm:p-6 text-white shadow-lg shadow-orange-500/20">
                                <p className="text-orange-100 text-sm font-medium">采购支出</p>
                                <p className="text-2xl sm:text-3xl font-bold mt-1">¥{financialData.purchase_cost?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs sm:text-sm text-orange-200 mt-2 bg-white/10 inline-block px-2 py-0.5 rounded-lg">{financialData.purchase_count} 次入库</p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 sm:p-6 text-white shadow-lg shadow-blue-500/20">
                                <p className="text-blue-100 text-sm font-medium">毛利润</p>
                                <p className="text-2xl sm:text-3xl font-bold mt-1">¥{financialData.gross_profit?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs sm:text-sm text-blue-200 mt-2 bg-white/10 inline-block px-2 py-0.5 rounded-lg">{reportType === 'daily' ? '今日' : '本月'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Inventory Report */}
            {activeTab === 'inventory' && inventoryData && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-6">库存报表</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-slate-500">总库存</p>
                            <p className="text-2xl font-bold text-blue-600">{inventoryData.total_stock}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-slate-500">库存总值</p>
                            <p className="text-2xl font-bold text-green-600">¥{inventoryData.total_value?.toFixed(2)}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-4">
                            <p className="text-slate-500">低库存药品</p>
                            <p className="text-2xl font-bold text-yellow-600">{inventoryData.low_stock_items?.length || 0}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4">
                            <p className="text-slate-500">缺货药品</p>
                            <p className="text-2xl font-bold text-red-600">{inventoryData.out_of_stock_items?.length || 0}</p>
                        </div>
                    </div>

                    <h3 className="font-medium mb-3">全部药品库存</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">药品名称</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">编码</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">库存</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">单价</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">库存价值</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventoryData.medicines?.map(med => (
                                    <tr key={med.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 whitespace-nowrap">{med.name}</td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{med.code}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs ${med.stock === 0 ? 'bg-red-100 text-red-600' :
                                                med.stock < 50 ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-green-100 text-green-600'
                                                }`}>
                                                {med.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">¥{med.price?.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">¥{(med.price * med.stock).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sales Report */}
            {activeTab === 'sales' && salesData && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-6">销售报表</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-slate-500">总销售额</p>
                            <p className="text-2xl font-bold text-green-600">¥{salesData.total_amount?.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-slate-500">总销售量</p>
                            <p className="text-2xl font-bold text-blue-600">{salesData.total_quantity} 件</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">订单号</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">药品</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">客户</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">数量</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">金额</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">日期</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {salesData.records?.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">{sale.order_id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{sale.medicine?.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{sale.customer?.name || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{sale.quantity}</td>
                                        <td className="px-4 py-3 text-green-600 whitespace-nowrap">¥{sale.total_price?.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Inbound Report */}
            {activeTab === 'inbound' && inboundData && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-6">入库报表</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-slate-500">总入库金额</p>
                            <p className="text-2xl font-bold text-blue-600">¥{inboundData.total_amount?.toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-slate-500">总入库数量</p>
                            <p className="text-2xl font-bold text-purple-600">{inboundData.total_quantity} 件</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">药品</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">供应商</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">数量</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">单价</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">金额</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 whitespace-nowrap">日期</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inboundData.records?.map(inb => (
                                    <tr key={inb.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 whitespace-nowrap">{inb.medicine?.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{inb.supplier?.name || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{inb.quantity}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">¥{inb.price?.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-blue-600 whitespace-nowrap">¥{(inb.price * inb.quantity).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(inb.inbound_date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    );
}
