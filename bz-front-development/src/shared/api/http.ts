// HTTP client for Knowledge Base API
import axios from 'axios';

// Normalize base URL. In production we use "/api" and proxy it via Nginx to backend.
const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'https://kb-backend-astral-e2a00aff.fly.dev').replace(/\/+$/, '');

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
    // Avoid double "/api/api/..." when baseURL already contains "/api"
    try {
      const baseEndsWithApi = /(^|\/)api$/i.test(API_BASE_URL);
      if (baseEndsWithApi && typeof config.url === 'string') {
        // strip leading /api from request url
        config.url = config.url.replace(/^\/?api\/+/, '/');
      }
    } catch (_) {}

    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (import.meta.env.DEV) {
        console.log('[auth] using token for request:', { url: config.url });
      }
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
      if (import.meta.env.DEV) console.log('[auth] session ended (401).');
    }
    return Promise.reject(error);
  }
);

export default http;
