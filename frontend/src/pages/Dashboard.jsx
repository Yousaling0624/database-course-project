import React, { useState, useEffect } from 'react';
import { Pill, ShoppingCart, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import * as api from '../api';

export default function Dashboard() {
    const [stats, setStats] = useState({ total_stock: 0, month_sales: 0, low_stock: 0 });

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

            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
                <h3 className="text-lg font-bold text-slate-800 mb-4">欢迎使用康源医药管理系统</h3>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    请从左侧菜单选择相应的功能模块进行操作。系统支持药品入库、销售管理、库存查询以及基础数据维护。
                </p>
            </div>
        </div>
    );
}
