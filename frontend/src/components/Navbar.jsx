import { Bell, Search, Menu, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Navbar({ onMenuClick }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);

    useEffect(() => {
        // Fetch low stock count for notification badge
        const fetchAlerts = async () => {
            try {
                const stats = await api.getStats();
                setLowStockCount(stats.low_stock || 0);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAlerts();
    }, [location.pathname]);

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return '数据概览';
            case '/inventory': return '药品库存管理';
            case '/sales': return '销售订单管理';
            case '/inbound': return '进货入库管理';
            case '/users': return '员工信息管理';
            case '/customers': return '客户管理';
            case '/suppliers': return '供应商管理';
            case '/reports': return '报表中心';
            case '/analysis': return '销售深度分析';
            case '/system': return '系统维护';
            default: return '医药管理系统';
        }
    };

    const renderBreadcrumbs = () => {
        const path = location.pathname;
        if (path === '/') return <span className="text-slate-800 font-medium truncate">数据概览</span>;

        if (path === '/analysis') {
            return (
                <>
                    <span className="hover:text-slate-800 cursor-pointer">报表分析</span>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-slate-800 font-medium truncate">深度分析</span>
                </>
            );
        }

        return (
            <span className="text-slate-800 font-medium truncate">
                {getPageTitle()}
            </span>
        );
    };

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
    };

    const handleGoToLowStock = () => {
        setShowNotifications(false);
        navigate('/inventory?filter=low_stock');
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 transition-all">
            <div className="flex items-center text-sm text-slate-500 overflow-hidden">
                <button
                    onClick={onMenuClick}
                    className="mr-3 md:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>

                <span className="hover:text-slate-800 cursor-pointer hidden sm:inline">首页</span>
                <span className="mx-2 text-slate-300 hidden sm:inline">/</span>
                {renderBreadcrumbs()}
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 relative">
                <button
                    onClick={handleNotificationClick}
                    className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <Bell size={20} />
                    {lowStockCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-semibold text-slate-700">系统通知</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {lowStockCount > 0 ? (
                                <button
                                    onClick={handleGoToLowStock}
                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <AlertTriangle size={16} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">库存预警</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            有 <span className="font-bold text-amber-600">{lowStockCount}</span> 种药品库存不足，点击查看
                                        </p>
                                    </div>
                                </button>
                            ) : (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                    暂无新通知
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
