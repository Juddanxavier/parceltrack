import { createAuthClient } from 'better-auth/react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';

interface AuthClientOptions {
  baseURL: string;
  withCredentials: boolean;
  headers?: Record<string, string>;
}

const authClientOptions: AuthClientOptions = {
  baseURL: API_URL,
  withCredentials: true,  // Enable secure cookie handling
  headers: {
    'X-Requested-With': 'XMLHttpRequest',  // CSRF protection
  },
};

export const authClient = createAuthClient(authClientOptions);

// Set up interceptors for error handling and token refresh
authClient.addResponseInterceptor(
  (response) => response,  // Pass through successful responses
  async (error) => {
    if (error.response?.status === 401) {
      // Clear local auth state
      authClient.clearSession();
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);
