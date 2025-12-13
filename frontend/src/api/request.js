import axios from 'axios';

// Use full URL for Electron app, relative URL for dev server with proxy
const baseURL = window.location.protocol === 'file:'
    ? 'http://localhost:8080/api'  // Electron (file:// protocol)
    : '/api';                       // Vite dev server (http:// with proxy)

const request = axios.create({
    baseURL,
    timeout: 10000,
});

request.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default request;
