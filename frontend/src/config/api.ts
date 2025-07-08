import axios from 'axios';
import { getApiError, isAuthError } from '@/lib/apiUtils';
import { authClient } from '../better-auth/auth-client';

// API Configuration
export const API_CONFIG = {
  BASE_URL: (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, ''),
  TIMEOUT: 30000, // 30 seconds
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add session token
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.session?.access_token) {
        config.headers.Authorization = `Bearer ${session.data.session.access_token}`;
      }
      return config;
    } catch (error) {
      console.error('Failed to get session:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle auth errors
    if (isAuthError(error)) {
      // Clear auth state
      localStorage.removeItem('auth_token');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/signin';
      }
    }

    // Transform error into user-friendly format
    const apiError = getApiError(error);
    return Promise.reject(apiError);
  }
);

export default api;
