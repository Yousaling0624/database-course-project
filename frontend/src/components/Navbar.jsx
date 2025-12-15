import { Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return '数据概览';
            case '/inventory': return '药品库存管理';
            case '/sales': return '销售订单管理';
            case '/inbound': return '进货入库管理';
            case '/users': return '员工信息管理';
            case '/customers': return '客户管理'; // Shortened for mobile fit
            case '/suppliers': return '供应商管理';
            case '/reports': return '报表中心';
            case '/system': return '系统维护';
            default: return '医药管理系统';
        }
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
                <span className="text-slate-800 font-medium truncate">
                    {getPageTitle()}
                </span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>
            </div>
        </header>
    );
}
