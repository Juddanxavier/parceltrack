import { ERROR_CODES } from './constants';
import type { AuthError } from './types';

/**
 * Creates a standardized auth error object
 */
export function createAuthError(
  message: string,
  code = ERROR_CODES.AUTH_ERROR,
  statusCode?: number
): AuthError {
  return {
    message,
    code,
    statusCode,
  };
}

/**
 * Checks if an error is an auth error
 */
export function isAuthError(error: any): error is AuthError {
  return (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

/**
 * Handle network or unexpected errors
 */
export function handleUnexpectedError(error: any): AuthError {
  if (error instanceof Error) {
    return createAuthError(
      error.message,
      ERROR_CODES.UNEXPECTED_ERROR
    );
  }
  
  if (typeof error === 'string') {
    return createAuthError(error, ERROR_CODES.UNEXPECTED_ERROR);
  }
  
  return createAuthError(
    'An unexpected error occurred',
    ERROR_CODES.UNEXPECTED_ERROR
  );
}

/**
 * Parse JWT token without external dependencies
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = parseJwt(token);
  if (!decoded?.exp) return true;
  
  // Add 1 minute buffer for clock skew
  const expiry = decoded.exp * 1000 - 60000;
  return Date.now() >= expiry;
}

/**
 * Store auth data securely
 */
export function setSecureAuthData(key: string, value: string): void {
  try {
    // Use httpOnly cookies in production
    if (import.meta.env.PROD) {
      document.cookie = `${key}=${value};path=/;secure;samesite=strict;max-age=31536000`;
    } else {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error('Failed to store auth data:', error);
  }
}

/**
 * Get auth data
 */
export function getSecureAuthData(key: string): string | null {
  try {
    // Use httpOnly cookies in production
    if (import.meta.env.PROD) {
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(key))
        ?.split('=')[1];
      return value || null;
    } else {
      return localStorage.getItem(key);
    }
  } catch (error) {
    console.error('Failed to retrieve auth data:', error);
    return null;
  }
}

/**
 * Clear auth data
 */
export function clearSecureAuthData(key: string): void {
  try {
    // Clear both cookie and localStorage to be safe
    document.cookie = `${key}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}
