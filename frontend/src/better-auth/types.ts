/**
 * User related types
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

/**
 * Auth error structure
 */
export interface AuthError {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * Auth response wrapper
 */
export interface AuthResponse<T = any> {
  data?: T;
  error?: AuthError;
}

/**
 * Session data structure
 */
export interface Session {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Sign up data
 */
export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

/**
 * Auth context type
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: SignInCredentials) => Promise<AuthResponse>;
  register: (data: SignUpData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}
