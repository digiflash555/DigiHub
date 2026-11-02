import axios from 'axios';

// Create an axios instance with base URL (relative to same origin)
const api = axios.create({
  baseURL: '/', // All requests are relative to the root
  // You can set default headers here if needed
});

// Request interceptor to attach auth token if present
// Request interceptor to attach auth token if present and validate expiry
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  // Skip auth handling for login or token refresh endpoints
  const skipUrls = ['/login', '/api/auth/refresh-token'];
  if (skipUrls.some((url) => config.url && config.url.includes(url))) {
    return config;
  }
  if (token) {
    // Check token expiry (expects JWT with exp claim in seconds)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired - clean up and redirect
        clearAuth();
        window.location.href = '/login';
        return config; // request will likely be aborted
      }
    } catch (e) {
      // If decode fails, proceed with token as is
    }
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Helper to clear all authentication related storage
function clearAuth() {
  localStorage.removeItem('authToken');
  // Remove any other auth related keys if needed
  localStorage.removeItem('user');
  sessionStorage.clear();
  // Clear auth cookie if set (example name authToken)
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Response interceptor to handle unauthorized errors globally without loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config || {};
    const isLoginOrRefresh = originalRequest.url && (originalRequest.url.includes('/login') || originalRequest.url.includes('/refresh-token'));
    if (!isLoginOrRefresh && error.response && error.response.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export default api;
