import axios from 'axios';

const request = axios.create({
    baseURL: '/api', // Proxy in vite config handles localhost:8080
    timeout: 5000,
});

// Loading Indicator Logic
let requestCount = 0;

const showLoading = () => {
    if (requestCount === 0) {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.innerHTML = `
                <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                    <div class="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-slate-100">
                        <div class="relative w-10 h-10">
                            <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div class="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <span class="text-sm font-bold text-slate-600">加载中...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }
    }
    requestCount++;
};

const hideLoading = () => {
    requestCount--;
    if (requestCount <= 0) {
        requestCount = 0;
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    }
};

request.interceptors.request.use(
    (config) => {
        showLoading();
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        hideLoading();
        return Promise.reject(error);
    }
);

request.interceptors.response.use(
    (response) => {
        hideLoading();
        return response.data;
    },
    (error) => {
        hideLoading();
        // console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default request;
