import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  // withCredentials: true, // Uncomment if your auth also uses HTTP-only session cookies
});

// Helper to clear all authentication-related storage
export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  sessionStorage.clear();
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Redirect flag to prevent multiple concurrent requests from spamming window.location.href
let isRedirecting = false;
function redirectToLogin() {
  clearAuth();
  if (!isRedirecting && window.location.pathname !== '/login') {
    isRedirecting = true;
    window.location.href = '/login';
  }
}

// Request interceptor: attach token and validate expiry
api.interceptors.request.use(
  (config) => {
    const skipUrls = ['/login', '/api/auth/refresh-token'];
    if (skipUrls.some((url) => config.url && config.url.includes(url))) {
      return config;
    }

    const token = localStorage.getItem('authToken');

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }

        // Decode Base64URL safely
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));

        // Check if token is expired (exp is in seconds)
        if (payload.exp && payload.exp * 1000 <= Date.now()) {
          redirectToLogin();
          return Promise.reject(new axios.Cancel('Session expired. Redirecting to login...'));
        }
      } catch (err) {
        // If the token is corrupted/unparseable, purge it rather than sending junk
        redirectToLogin();
        return Promise.reject(new axios.Cancel('Corrupt session token. Redirecting to login...'));
      }

      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle unexpected 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If request was canceled by our request interceptor, pass through
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config || {};
    const isAuthRoute =
      originalRequest.url &&
      (originalRequest.url.includes('/login') || originalRequest.url.includes('/refresh-token'));

    if (!isAuthRoute && error.response && error.response.status === 401) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
