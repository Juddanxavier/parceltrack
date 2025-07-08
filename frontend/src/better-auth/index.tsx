import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authClient } from './auth-client';

export interface AuthError {
  message: string;
  code: string;
  statusCode?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface SignInCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: AuthError }>;
  register: (data: SignUpData) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const BetterAuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper function to create auth errors
const createAuthError = (message: string, code: string, statusCode?: number): AuthError => ({
  message,
  code,
  statusCode
});

// Helper function to handle unexpected errors
const handleUnexpectedError = (error: any): AuthError => {
  console.error('Unexpected auth error:', error);
  return createAuthError(
    error.message || 'An unexpected error occurred',
    'UNEXPECTED_ERROR'
  );
};

export function BetterAuthProvider({ children }: { children: ReactNode }) {
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [session, setSession] = useState<{ user: User; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const { data, error } = await authClient.getSession();
      if (error) {
        setAuthError(createAuthError(error.message, 'SESSION_ERROR'));
        setSession(null);
      } else {
        setSession(data);
        setAuthError(null);
      }
    } catch (error) {
      setAuthError(handleUnexpectedError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

// Set up session refresh interval
useEffect(() => {
  if (!session) return;

  const interval = setInterval(() => {
    fetchSession();
  }, 5 * 60 * 1000); // Refresh every 5 minutes

  return () => clearInterval(interval);
}, [session, fetchSession]);

// Initial session fetch
useEffect(() => {
  fetchSession();
}, [fetchSession]);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      await fetchSession()
    } catch (error) {
      console.error('Failed to refresh user session:', error)
      setAuthError({
        message: 'Failed to refresh user session',
        code: 'REFRESH_ERROR'
      })
    }
  }, [fetchSession])

  // Use session data directly - no need for additional API calls!

  const user = session?.user || null;
  const isAuthenticated = !!user;
  const isAdmin = session?.role === 'admin';

  const login = useCallback(async ({ email, password, remember }: SignInCredentials) => {
    try {
      setAuthError(null);
      const { data, error } = await authClient.signIn.email({ email, password });

      if (error) {
        const authError = createAuthError(error.message, 'AUTH_ERROR');
        setAuthError(authError);
        return { success: false, error: authError };
      }

      await fetchSession();
      return { success: true };
    } catch (error) {
      const authError = handleUnexpectedError(error);
      setAuthError(authError);
      return { success: false, error: authError };
    }
  }, [fetchSession]);

  // Register method with enhanced error handling
  const register = useCallback(async ({ email, password, name }: SignUpData) => {
    try {
      setAuthError(null);
      const { data, error } = await authClient.signUp.email({ email, password, name });
      
      if (error) {
        const authError = createAuthError(
          error.message || 'Registration failed',
          error.code || 'AUTH_ERROR',
          error.statusCode
        );
        setAuthError(authError);
        return { success: false, error: authError };
      }
      
      await fetchSession();
      return { success: true, data };
    } catch (err) {
      const authError = handleUnexpectedError(err);
      setAuthError(authError);
      return { success: false, error: authError };
    }
  }, [fetchSession]);

  // Logout method with enhanced error handling
  const logout = useCallback(async () => {
    try {
      setAuthError(null);
      await authClient.signOut();
      // Clear all auth data
      setSession(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, clear local state
      setAuthError(createAuthError(
        'Logout completed with errors',
        'AUTH_ERROR'
      ));
    }
  }, [])

  return (
    <BetterAuthContext.Provider
      value={{
        user: session?.user || null,
        loading,
        error: authError,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        clearError,
        refreshUser
      }}
    >
      {children}
    </BetterAuthContext.Provider>
  )
}

export function useBetterAuth() {
  const ctx = useContext(BetterAuthContext)
  if (!ctx)
    throw new Error('useBetterAuth must be used within a BetterAuthProvider')
  return ctx
}

// Enhanced API client functions with better error handling
export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: AuthError }> {
  try {
    const { data, error } = await authClient.signIn.email({ email, password })
    if (error) {
      return { 
        success: false, 
        error: { 
          message: error.message || 'Login failed',
          code: error.code || 'LOGIN_ERROR'
        }
      }
    }
    return { success: true, user: data?.user }
  } catch (err: any) {
    return { 
      success: false, 
      error: { 
        message: err.message || 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; user?: User; error?: AuthError }> {
  try {
    const { data, error } = await authClient.signUp.email({ email, password, name })
    if (error) {
      return { 
        success: false, 
        error: { 
          message: error.message || 'Registration failed',
          code: error.code || 'REGISTER_ERROR'
        }
      }
    }
    return { success: true, user: data?.user }
  } catch (err: any) {
    return { 
      success: false, 
      error: { 
        message: err.message || 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

export async function getCurrentUser(): Promise<{ success: boolean; user?: User; error?: AuthError }> {
  try {
    const { data, error } = await authClient.getSession()
    if (error) {
      return { 
        success: false, 
        error: { 
          message: error.message || 'Session fetch failed',
          code: error.code || 'SESSION_ERROR'
        }
      }
    }
    return { success: true, user: data?.user }
  } catch (err: any) {
    return { 
      success: false, 
      error: { 
        message: err.message || 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

// Role verification utility
export function isAdmin(user: User | null): boolean {
  return user?.role?.toLowerCase() === 'admin'
}

export function hasRole(user: User | null, role: 'user' | 'admin'): boolean {
  return user?.role?.toLowerCase() === role.toLowerCase()
}
