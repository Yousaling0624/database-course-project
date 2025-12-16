import React, { useState, useEffect } from 'react';
import { Pill, ShoppingCart, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import * as api from '../api';

export default function Dashboard() {
    const [stats, setStats] = useState({ total_stock: 0, month_sales: 0, low_stock: 0, top_selling: [], sales_trend: [] });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const s = await api.getStats();
                setStats(s);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="库存总量" value={stats.total_stock} trend="实时" icon={Pill} color="blue" />
                <StatCard title="本月销售" value={`¥ ${stats.month_sales}`} trend="实时" icon={ShoppingCart} color="emerald" />
                <StatCard title="临期/缺货预警" value={stats.low_stock} trend="需要补货" icon={AlertCircle} color="amber" isAlert={stats.low_stock > 0} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Medicines */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full card-hover">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-rose-500" />
                        热销药品排行 (Top 5)
                    </h3>
                    <div className="flex-1 space-y-4">
                        {stats.top_selling && stats.top_selling.length > 0 ? (
                            stats.top_selling.map((item, index) => (
                                <div key={index} className="relative">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{item.name}</span>
                                        <span className="text-slate-500">销量: {item.total_sold}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${(item.total_sold / stats.top_selling[0].total_sold) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-400 py-8">暂无销售数据</div>
                        )}
                    </div>
                </div>

                {/* Weekly Sales Trend */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full card-hover">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart2 size={20} className="text-blue-500" />
                        近7日销售趋势
                    </h3>
                    <div className="flex-1 flex items-end justify-between gap-2 h-48 pt-4">
                        {stats.sales_trend && stats.sales_trend.length > 0 ? (
                            (() => {
                                const maxRev = Math.max(...stats.sales_trend.map(d => d.total_revenue)) || 1;
                                return stats.sales_trend.map((day, index) => (
                                    <div key={index} className="flex flex-col items-center gap-2 group flex-1">
                                        <div className="relative w-full flex justify-center">
                                            <div
                                                className="w-full max-w-[30px] bg-blue-100 group-hover:bg-blue-200 rounded-t-md transition-all duration-500 relative group-hover:scale-y-105 origin-bottom"
                                                style={{ height: `${(day.total_revenue / maxRev) * 150}px` }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    ¥{day.total_revenue.toFixed(0)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500 scale-90 sm:scale-100 whitespace-nowrap">
                                            {new Date(day.sale_day).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}
                                        </span>
                                    </div>
                                ));
                            })()
                        ) : (
                            <div className="w-full text-center text-slate-400 py-8 text-sm">暂无趋势数据</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
                <h3 className="text-lg font-bold text-slate-800 mb-4">欢迎使用康源医药管理系统</h3>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    请从左侧菜单选择相应的功能模块进行操作。系统支持药品入库、销售管理、库存查询以及基础数据维护。
                </p>
            </div>
        </div>
    );
}
