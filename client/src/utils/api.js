import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create an axios instance with base URL (relative to same origin)
const api = axios.create({
  baseURL: '/', // All requests are relative to the root
  // You can set default headers here if needed
});

// Request interceptor to attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login page
      localStorage.removeItem('authToken');
      // Use window location for redirection as we are outside React component
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
