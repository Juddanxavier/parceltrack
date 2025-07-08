export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin';
  permissions?: string[];
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSession {
  user: AdminUser;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AdminError {
  message: string;
  code: string;
  status?: number;
}

export interface AdminResponse<T = any> {
  data?: T;
  error?: AdminError;
}

export interface AdminAuthConfig {
  apiUrl: string;
  onSessionExpired?: () => void;
  onUnauthorized?: () => void;
}
