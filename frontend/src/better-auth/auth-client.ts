import { AUTH_ENDPOINTS, ERROR_CODES } from './constants.ts';
import type { AuthResponse } from './types.ts';

// Auth client implementation
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/[/]$/, '');
const API_URL = `${BASE_URL}/api/auth`;

interface AuthClientOptions {
  baseURL: string;
  withCredentials: boolean;
  headers?: Record<string, string>;
}

class AuthClient {
  private baseURL: string;
  private withCredentials: boolean;
  private headers: Record<string, string>;

  constructor(options: AuthClientOptions) {
    this.baseURL = options.baseURL;
    this.withCredentials = options.withCredentials;
    this.headers = options.headers || {};
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<AuthResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
          ...options.headers,
        },
        credentials: this.withCredentials ? 'include' : 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.message || 'Request failed',
            code: data.code,
            status: response.status,
          },
        };
      }

      return { data };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Network error',
          code: ERROR_CODES.NETWORK_ERROR,
        },
      };
    }
  }

  async getSession() {
    return this.request(AUTH_ENDPOINTS.GET_SESSION);
  }

  signIn = {
    email: async (credentials: { email: string; password: string }) => {
      return this.request(AUTH_ENDPOINTS.SIGN_IN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
  };

  signUp = {
    email: async (data: { email: string; password: string; name: string }) => {
      return this.request(AUTH_ENDPOINTS.SIGN_UP, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  async signOut() {
    return this.request(AUTH_ENDPOINTS.SIGN_OUT, { method: 'POST' });
  }

  clearSession() {
    // Clear any session cookies or local storage items
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    localStorage.clear();
    sessionStorage.clear();
  }

  useSession() {
    // This is just a placeholder - the actual implementation will be in the React context
    return {
      data: null,
      isPending: false,
      error: null,
      refetch: async () => {},
    };
  }
}

const authClientOptions: AuthClientOptions = {
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
};

export const authClient = new AuthClient(authClientOptions);

// Set up client-side redirect on 401
authClient.getSession().then(
  () => {},
  (error) => {
    if (error?.status === 401) {
      window.location.href = '/auth/signin';
    }
  }
);
