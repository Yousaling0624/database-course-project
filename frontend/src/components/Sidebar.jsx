import React from 'react';
import { LayoutDashboard, Pill, ShoppingCart, Users, Truck, Package, BarChart3, Settings, LogOut, Activity, Shield, UserCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, to, onClick }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
      group flex items-center px-3 py-2.5 my-1 rounded-lg cursor-pointer transition-all duration-200
      ${isActive
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }
    `}
        onClick={onClick}
    >
        {({ isActive }) => (
            <>
                <Icon size={20} className={`${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-600'} mr-3 transition-colors`} />
                <span className="text-sm font-medium">{label}</span>
            </>
        )}
    </NavLink>
);

export default function Sidebar({ onLogout, userRole, currentUser, isOpen, onClose }) {
    const isAdmin = userRole === 'admin';

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-20 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                            <Pill size={18} />
                        </div>
                        <span className="text-lg font-bold text-slate-800 tracking-tight">康源医药</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                        <LogOut size={20} className="rotate-180" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <SidebarItem icon={LayoutDashboard} label="数据概览" to="/" onClick={onClose} />
                    <SidebarItem icon={Pill} label="药品库存" to="/inventory" onClick={onClose} />
                    <SidebarItem icon={Package} label="进货管理" to="/inbound" onClick={onClose} />
                    <SidebarItem icon={ShoppingCart} label="销售订单" to="/sales" onClick={onClose} />

                    <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">基础数据</div>

                    {/* Admin only: 员工管理 */}
                    {isAdmin && <SidebarItem icon={Users} label="员工管理" to="/users" onClick={onClose} />}

                    <SidebarItem icon={Activity} label="客户管理" to="/customers" onClick={onClose} />
                    <SidebarItem icon={Truck} label="供应商管理" to="/suppliers" onClick={onClose} />

                    <div className="pt-4 pb-1 pl-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">报表与系统</div>
                    <SidebarItem icon={BarChart3} label="报表中心" to="/reports" onClick={onClose} />

                    {/* Admin only: 系统维护 */}
                    {isAdmin && <SidebarItem icon={Settings} label="系统维护" to="/system" onClick={onClose} />}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isAdmin ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {isAdmin ? <Shield size={18} className="text-amber-600" /> : <UserCircle size={18} className="text-blue-600" />}
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-slate-700 truncate group-hover:text-teal-700">
                                {currentUser?.real_name || currentUser?.username || 'User'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                {isAdmin ? (
                                    <span className="text-amber-600 font-medium">管理员</span>
                                ) : (
                                    <span className="text-blue-600">普通员工</span>
                                )}
                            </p>
                        </div>
                        <LogOut size={16} className="text-slate-400 hover:text-red-500 cursor-pointer" onClick={onLogout} />
                    </div>
                </div>
            </aside>
        </>
    );
}
