import React from 'react';

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

export default StatCard;
