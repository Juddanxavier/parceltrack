/**
 * Authentication endpoints
 */
export const AUTH_ENDPOINTS = {
  GET_SESSION: '/get-session',
  SIGN_IN: '/sign-in/email',
  SIGN_UP: '/sign-up/email',
  SIGN_OUT: '/sign-out',
  REFRESH_TOKEN: '/refresh-token',
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SESSION_ERROR: 'SESSION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  REFRESH_ERROR: 'REFRESH_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

/**
 * Auth configuration
 */
export const AUTH_CONFIG = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  SESSION_REFRESH_INTERVAL: 4 * 60 * 1000, // 4 minutes
  DEFAULT_AUTH_ERROR: 'An unexpected authentication error occurred',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  REFRESH_TOKEN: 'auth_refresh_token',
  REDIRECT_PATH: 'auth_redirect_path',
} as const;
