import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, BarChart2, Trophy, Calendar, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

export default function SalesAnalysis() {
    const location = useLocation();
    const navigate = useNavigate();
    const chartContainerRef = useRef(null);
    const [activeSection, setActiveSection] = useState(location.state?.activeSection || 'trend');
    const [trendData, setTrendData] = useState([]);
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Date range & Sorting states
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [tempDates, setTempDates] = useState({ start: startDate, end: endDate });
    const [sortConfig, setSortConfig] = useState({ column: 'total_sold', order: 'DESC' });

    const fetchData = async (start = startDate, end = endDate, sortBy = sortConfig.column, orderBy = sortConfig.order) => {
        setLoading(true);
        try {
            const [trend, ranking] = await Promise.all([
                api.getSalesTrendAnalysis(start, end),
                api.getTopSellingAnalysis(start, end, sortBy, orderBy, 100)
            ]);

            // Fill gaps for trend data
            const trendMap = {};
            trend.forEach(item => {
                const dateStr = new Date(item.sale_day).toISOString().split('T')[0];
                trendMap[dateStr] = item;
            });

            const startObj = new Date(start);
            const endObj = new Date(end);
            const diffTime = Math.abs(endObj - startObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const completeTrend = [];
            for (let i = 0; i < diffDays; i++) {
                const d = new Date(startObj);
                d.setDate(startObj.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                completeTrend.push({
                    sale_day: dateStr,
                    total_revenue: trendMap[dateStr]?.total_revenue || 0,
                    order_count: trendMap[dateStr]?.order_count || 0,
                    total_quantity: trendMap[dateStr]?.total_quantity || 0,
                    total_profit: trendMap[dateStr]?.total_profit || 0
                });
            }

            setTrendData(completeTrend);
            setRankingData(ranking);
        } catch (err) {
            console.error('Failed to fetch analysis data:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleQuery = () => {
        setStartDate(tempDates.start);
        setEndDate(tempDates.end);
        fetchData(tempDates.start, tempDates.end, sortConfig.column, sortConfig.order);
    };

    const handleSort = (column) => {
        let newOrder = 'DESC';
        if (sortConfig.column === column && sortConfig.order === 'DESC') {
            newOrder = 'ASC';
        }
        setSortConfig({ column, order: newOrder });
        fetchData(startDate, endDate, column, newOrder);
    };

    const [hoveredDay, setHoveredDay] = useState(null);

    // Auto-scroll to the right when trend section is loaded or active
    useEffect(() => {
        if (!loading && activeSection === 'trend' && chartContainerRef.current) {
            const container = chartContainerRef.current;
            container.scrollLeft = container.scrollWidth;
        }
    }, [loading, activeSection, trendData]);

    const filteredRanking = rankingData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const maxRevenue = Math.max(...trendData.map(d => d.total_revenue)) || 1;
    const displayDay = hoveredDay || trendData[trendData.length - 1] || {};

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">销售深度分析</h1>
                        <p className="text-slate-500 text-sm">查看业务增长趋势与药品销售表现</p>
                    </div>
                </div>
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                    <button
                        onClick={() => setActiveSection('trend')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'trend' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        销售趋势
                    </button>
                    <button
                        onClick={() => setActiveSection('ranking')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'ranking' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        药品排行
                    </button>
                </div>
            </div>

            {/* Date Picker Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Calendar size={18} className="text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700 whitespace-nowrap">分析时段</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="date"
                        value={tempDates.start}
                        onChange={(e) => setTempDates({ ...tempDates, start: e.target.value })}
                        className="flex-1 sm:w-40 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-slate-400">至</span>
                    <input
                        type="date"
                        value={tempDates.end}
                        onChange={(e) => setTempDates({ ...tempDates, end: e.target.value })}
                        className="flex-1 sm:w-40 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <button
                    onClick={handleQuery}
                    className="w-full sm:w-auto px-6 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    查询分析
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            ) : (
                <>
                    {/* Trend Section */}
                    {activeSection === 'trend' && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all overflow-hidden">
                            {/* Sticky Top Detail Board */}
                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                    <div className="mb-2 lg:mb-0">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                                            <BarChart2 size={24} className="text-emerald-500" />
                                            时段收支趋势 ({trendData.length}日)
                                        </h3>
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            <Calendar size={16} />
                                            {startDate} 至 {endDate}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-6 gap-y-4 w-full border-t border-slate-100 pt-6">
                                    <div className="flex flex-col p-4 bg-white/50 border border-slate-100/50 rounded-xl shadow-sm">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">当前分析日期</span>
                                        <span className="text-lg font-black text-slate-700">{displayDay.sale_day || '-'}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl shadow-sm">
                                        <span className="text-[10px] text-emerald-600/70 font-bold uppercase mb-1 tracking-wider">当日总营收</span>
                                        <span className="text-xl font-black text-emerald-600">¥{displayDay.total_revenue?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-teal-50/30 border border-teal-100/50 rounded-xl shadow-sm">
                                        <span className="text-[10px] text-teal-600/70 font-bold uppercase mb-1 tracking-wider">当日订单量</span>
                                        <span className="text-xl font-black text-teal-600">{displayDay.order_count || '0'} <span className="text-xs font-normal opacity-70">笔</span></span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl shadow-sm">
                                        <span className="text-[10px] text-emerald-600/70 font-bold uppercase mb-1 tracking-wider">合计销售件数</span>
                                        <span className="text-xl font-black text-emerald-500">{displayDay.total_quantity || '0'} <span className="text-xs font-normal opacity-70">件</span></span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-amber-50/30 border border-amber-100/50 rounded-xl shadow-sm">
                                        <span className="text-[10px] text-amber-600/70 font-bold uppercase mb-1 tracking-wider">估算成交毛利</span>
                                        <span className="text-xl font-black text-amber-500">¥{(displayDay.total_profit || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-amber-50/30 border border-amber-100/50 rounded-xl shadow-sm">
                                        <span className="text-[10px] text-amber-600/70 font-bold uppercase mb-1 tracking-wider">预期毛利率</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-amber-600">
                                                {displayDay.total_revenue > 0 ? ((displayDay.total_profit / displayDay.total_revenue) * 100).toFixed(1) : '0.0'}
                                            </span>
                                            <span className="text-sm font-bold text-amber-600/70">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="h-[400px] overflow-x-auto pb-4 no-scrollbar border-b border-slate-100 pt-8 scroll-smooth"
                                ref={chartContainerRef}
                            >
                                <div className="flex items-end justify-between min-w-max h-full px-6 gap-2">
                                    {trendData.map((day, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col items-center gap-3 group flex-1 cursor-crosshair"
                                            onMouseEnter={() => setHoveredDay(day)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        >
                                            <div className="relative w-full flex justify-center h-full items-end pb-1">
                                                <div
                                                    className={`w-4 sm:w-6 rounded-t-md transition-all duration-300 relative origin-bottom shadow-sm ${(hoveredDay && hoveredDay.sale_day === day.sale_day)
                                                        ? 'bg-emerald-500 scale-y-105 shadow-emerald-200 shadow-lg ring-2 ring-emerald-100'
                                                        : 'bg-emerald-400/80 hover:bg-emerald-400'
                                                        }`}
                                                    style={{ height: `${(day.total_revenue / maxRevenue) * 300}px` }}
                                                >
                                                </div>
                                            </div>
                                            <div className="h-6 flex items-center justify-center">
                                                <span className={`text-xs font-medium whitespace-nowrap transition-all ${(hoveredDay && hoveredDay.sale_day === day.sale_day)
                                                    ? 'text-emerald-600 font-bold scale-110 opacity-100'
                                                    : (index % 7 === 0 || index === trendData.length - 1 ? 'text-slate-400 opacity-100' : 'text-slate-300 opacity-0')
                                                    }`}>
                                                    {day.sale_day.split('-').slice(1).join('/')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-10 border-t border-slate-50">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-slate-500 text-sm mb-1">{trendData.length}日最高营收</p>
                                    <p className="text-2xl font-bold text-slate-800">¥{maxRevenue.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-slate-500 text-sm mb-1">{trendData.length}日累计订单</p>
                                    <p className="text-2xl font-bold text-slate-800">{trendData.reduce((acc, curr) => acc + curr.order_count, 0)} 笔</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-slate-500 text-sm mb-1">{trendData.length}日日均营收</p>
                                    <p className="text-2xl font-bold text-slate-800">¥{(trendData.reduce((acc, curr) => acc + curr.total_revenue, 0) / (trendData.length || 1)).toFixed(0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ranking Section */}
                    {activeSection === 'ranking' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Trophy size={24} className="text-emerald-500" />
                                        药品销售总排行
                                    </h3>
                                    <div className="relative w-full sm:w-80">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="搜索药品名称或编码..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">排名</th>
                                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">药品信息</th>
                                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">分类</th>
                                                <th
                                                    className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-emerald-600 uppercase whitespace-nowrap cursor-pointer hover:bg-emerald-50 transition-colors rounded-t-lg"
                                                    onClick={() => handleSort('total_sold')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        销量 {sortConfig.column === 'total_sold' && (sortConfig.order === 'DESC' ? '↓' : '↑')}
                                                    </div>
                                                </th>
                                                <th
                                                    className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-emerald-600 uppercase whitespace-nowrap cursor-pointer hover:bg-emerald-50 transition-colors rounded-t-lg"
                                                    onClick={() => handleSort('total_revenue')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        总销售额 {sortConfig.column === 'total_revenue' && (sortConfig.order === 'DESC' ? '↓' : '↑')}
                                                    </div>
                                                </th>
                                                <th
                                                    className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-emerald-600 uppercase whitespace-nowrap cursor-pointer hover:bg-emerald-50 transition-colors rounded-t-lg"
                                                    onClick={() => handleSort('total_profit')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        毛利润 {sortConfig.column === 'total_profit' && (sortConfig.order === 'DESC' ? '↓' : '↑')}
                                                    </div>
                                                </th>
                                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">毛利率</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredRanking.map((item, index) => {
                                                const totalRev = rankingData.reduce((acc, curr) => acc + curr.total_revenue, 0) || 1;
                                                const share = (item.total_revenue / totalRev) * 100;

                                                return (
                                                    <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm shadow-sm transition-all rounded-lg ${index === 0
                                                                ? 'bg-emerald-600 text-white rotate-6'
                                                                : index === 1
                                                                    ? 'bg-emerald-500 text-white -rotate-3'
                                                                    : index === 2
                                                                        ? 'bg-emerald-400 text-white'
                                                                        : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{item.code}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold whitespace-nowrap">
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="font-semibold text-slate-600 text-sm whitespace-nowrap">{item.total_sold} <span className="text-[10px] font-normal text-slate-400">件</span></div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="font-bold text-slate-700 text-sm whitespace-nowrap">¥{item.total_revenue?.toLocaleString()}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="font-bold text-emerald-600 text-sm whitespace-nowrap">
                                                                ¥{(item.total_profit || 0).toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="font-bold text-teal-600 text-sm whitespace-nowrap">
                                                                {item.total_revenue > 0 ? ((item.total_profit / item.total_revenue) * 100).toFixed(1) : 0}%
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="w-20 md:w-24">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[10px] text-emerald-600 font-bold">{share.toFixed(1)}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                                                        style={{ width: `${share}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {filteredRanking.length === 0 && (
                                        <div className="py-20 text-center">
                                            <div className="text-slate-300 mb-2 font-bold italic">No results found</div>
                                            <div className="text-slate-400 text-sm">尝试搜索其他药品名称</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )
            }
        </div >
    );
}
