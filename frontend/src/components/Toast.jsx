import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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

export default Toast;
