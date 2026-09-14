import axios from 'axios';

// Central axios instance.
// In dev: Vite proxies /api → localhost:5000 (see vite.config.js)
// In production: Vercel rewrites /api → Render backend (see vercel.json)
// No hardcoded URL needed anywhere.
const api = axios.create({
    baseURL: '',
    withCredentials: false,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (e) {
        // ignore
    }
    return config;
});

export default api;
