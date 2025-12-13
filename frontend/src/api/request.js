import axios from 'axios';

const request = axios.create({
    baseURL: '/api', // Proxy in vite config handles localhost:8080
    timeout: 5000,
});

request.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default request;
