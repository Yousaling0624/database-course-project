import axios from 'axios';

const request = axios.create({
    baseURL: '/api', // Proxy in vite config handles localhost:8080
    timeout: 5000,
});

request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

request.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default request;
