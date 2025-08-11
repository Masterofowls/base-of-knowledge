// HTTP client for Knowledge Base API
import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://kb-backend-astral-e2a00aff.fly.dev';

// Create axios instance
const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
    }
    return Promise.reject(error);
  }
);

export default http;
