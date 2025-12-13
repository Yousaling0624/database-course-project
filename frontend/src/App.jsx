import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Users,
  Search,
  Bell,
  ChevronDown,
  Plus,
  LogOut,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import * as api from './api';

// --- 模拟数据 (Removed) ---
const MOCK_DATA = [
  { id: 1, code: 'M8801', name: '布洛芬缓释胶囊', type: 'OTC', spec: '0.3g*24粒', price: 28.50, stock: 450, manufacturer: '中美史克制药', status: 'active' },
  { id: 2, code: 'M8802', name: '阿莫西林胶囊', type: 'Rx', spec: '0.25g*48粒', price: 15.80, stock: 24, manufacturer: '白云山制药', status: 'active' },
  { id: 3, code: 'M8803', name: '连花清瘟胶囊', type: 'OTC', spec: '0.35g*24粒', price: 14.50, stock: 1200, manufacturer: '以岭药业', status: 'active' },
  { id: 4, code: 'M8804', name: '头孢拉定胶囊', type: 'Rx', spec: '0.25g*24粒', price: 18.00, stock: 85, manufacturer: '华北制药', status: 'active' },
  { id: 5, code: 'M8805', name: '维生素C泡腾片', type: 'OTC', spec: '1g*20片', price: 39.90, stock: 150, manufacturer: '拜耳医药', status: 'active' },
  { id: 6, code: 'M8806', name: '奥美拉唑肠溶胶囊', type: 'Rx', spec: '20mg*14粒', price: 22.50, stock: 0, manufacturer: '阿斯利康', status: 'inactive' },
];

// --- 组件: Toast 通知 ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 animate-in slide-in-from-right ${type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
      }`}>
      {type === 'success' ? <CheckCircle2 size={18} className="mr-2" /> : <AlertCircle size={18} className="mr-2" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// --- 组件: 模态框 ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- 主应用组件 ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState([]); // Real data
  const [stats, setStats] = useState({ total_stock: 0, month_sales: 0, low_stock: 0 });
  const [toast, setToast] = useState(null); // { message, type }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', price: '', stock: '', spec: '', manufacturer: '' });

  // Load Data
  const fetchData = async () => {
    try {
      const meds = await api.getMedicines(searchQuery);
      setData(meds);
      const s = await api.getStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, searchQuery]);

  // 登录逻辑
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const username = e.target[0].value;
    const password = e.target[1].value;

    try {
      await api.login({ username, password });
      setIsLoggedIn(true);
      showToast('欢迎回来，销售经理', 'success');
    } catch (err) {
      showToast('登录失败，请检查账号密码', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 添加药品
  const handleAddMedicine = async () => {
    if (!formData.name) return;
    try {
      await api.createMedicine({
        ...formData,
        code: formData.code || `M${Math.floor(Math.random() * 9000) + 1000}`, // Auto gen if empty
        type: 'OTC', // Default
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
      });
      setIsModalOpen(false);
      setFormData({ name: '', code: '', price: '', stock: '', spec: '', manufacturer: '' });
      showToast('新药品入库成功');
      fetchData(); // Refresh
    } catch (err) {
      showToast('入库失败', 'error');
    }
  };

  // --- 登录界面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-teal-600 to-emerald-600 skew-y-3 transform -translate-y-20 z-0"></div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl z-10 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Pill size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">康源医药 SaaS</h1>
            <p className="text-slate-500 text-sm">下一代智能医药销售管理平台</p>
          </div>

          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">工作账号</label>
              <input
                type="text"
                defaultValue="admin"
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                placeholder="请输入您的ID"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">密码</label>
              <input
                type="password"
                defaultValue="password"
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg shadow-slate-900/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : '进入工作台'}
            </button>
          </form>
          <div className="bg-slate-50 px-8 py-4 text-center border-t border-slate-100">
            <span className="text-xs text-slate-400">Powered by Go & React 18</span>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // --- 主界面 ---
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-600">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <Pill size={18} />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">康源医药</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="数据概览" active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} />
          <SidebarItem icon={Pill} label="药品库存" active={activeMenu === 'inventory'} onClick={() => setActiveMenu('inventory')} />
          <SidebarItem icon={ShoppingCart} label="销售订单" active={activeMenu === 'orders'} onClick={() => setActiveMenu('orders')} />
          <SidebarItem icon={Users} label="客户管理" active={activeMenu === 'customers'} onClick={() => setActiveMenu('customers')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
            <img src="https://i.pravatar.cc/150?img=33" alt="User" className="w-9 h-9 rounded-full bg-slate-200 object-cover" />
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate group-hover:text-teal-700">Admin</p>
              <p className="text-xs text-slate-400 truncate">管理员</p>
            </div>
            <LogOut size={16} className="text-slate-400 hover:text-red-500" onClick={() => setIsLoggedIn(false)} />
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 顶部导航 */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center text-sm text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer">首页</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-800 font-medium">
              {activeMenu === 'inventory' ? '药品库存管理' : activeMenu === 'dashboard' ? '数据概览' : '其他模块'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* 统计卡片 */}
            {(activeMenu === 'dashboard' || activeMenu === 'inventory') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="库存总量" value={stats.total_stock} trend="实时" icon={Pill} color="blue" />
                <StatCard title="本月销售" value={`¥ ${stats.month_sales}`} trend="实时" icon={ShoppingCart} color="emerald" />
                <StatCard title="临期预警" value={stats.low_stock} trend="需要补货" icon={AlertCircle} color="amber" isAlert={stats.low_stock > 0} />
              </div>
            )}

            {/* 主要数据表格区域 */}
            {activeMenu === 'inventory' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* 工具栏 */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-800">库存明细</h2>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="搜索药品名称/编号..."
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-slate-900/10"
                    >
                      <Plus size={16} className="mr-2" />
                      快速入库
                    </button>
                  </div>
                </div>

                {/* 表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <th className="px-6 py-4">药品编号</th>
                        <th className="px-6 py-4">药品信息</th>
                        <th className="px-6 py-4">分类</th>
                        <th className="px-6 py-4">价格</th>
                        <th className="px-6 py-4">库存状态</th>
                        <th className="px-6 py-4">生产厂家</th>
                        <th className="px-6 py-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 text-slate-500 font-mono">{item.code}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{item.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{item.spec}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'OTC' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            ¥{item.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className={`font-medium ${item.stock < 50 ? 'text-red-600' : 'text-slate-600'}`}>
                                {item.stock}
                              </span>
                            </div>

                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.stock < 50 ? 'bg-red-500' : 'bg-teal-500'}`}
                                style={{ width: `${Math.min((item.stock / 500) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{item.manufacturer}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-teal-600 p-1 rounded hover:bg-teal-50 transition-colors">
                              <MoreHorizontal size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {data.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                            没有找到相关药品
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMenu === 'orders' && (
              <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
                销售订单功能开发中... (Testing Placeholder)
              </div>
            )}

          </div>
        </main>
      </div>

      {/* 模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新药入库登记"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">入库数量</label>
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
              确认入库
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast 容器 */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`
      group flex items-center px-3 py-2.5 my-1 rounded-lg cursor-pointer transition-all duration-200
      ${active
        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }
    `}
  >
    <Icon size={20} className={`${active ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-600'} mr-3 transition-colors`} />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const StatCard = ({ title, value, trend, icon: Icon, color, isAlert }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-slate-50'}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className={`font-medium ${isAlert ? 'text-red-500' : 'text-emerald-600'}`}>
          {trend}
        </span>
        <span className="text-slate-400 ml-2">与上月相比</span>
      </div>
    </div>
  );
};