import React, { useState } from 'react';
import { Pill } from 'lucide-react';
import * as api from '../api';

export default function Login({ onLogin, showToast }) {
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const username = e.target[0].value;
        const password = e.target[1].value;

        try {
            const response = await api.login({ username, password });
            onLogin(response.user, response.token); // Pass user object and token
            if (showToast) showToast(`欢迎回来，${response.user?.real_name || response.user?.username || '用户'}`, 'success');
        } catch (err) {
            if (showToast) showToast('登录失败，请检查账号密码', 'error');
        } finally {
            setLoading(false);
        }
    };

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
                            className="input-field"
                            placeholder="请输入您的账号"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">密码</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="请输入密码"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center py-3 text-base shadow-xl shadow-teal-600/30"
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
        </div>
    );
}
