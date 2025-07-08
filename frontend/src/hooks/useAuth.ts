import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useBetterAuth } from 'better-auth/react';
import { clearAllCache } from '../lib/cache';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  isAdmin?: boolean;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const { user, loading, signIn: betterAuthSignIn, signOut: betterAuthSignOut, refreshSession: betterAuthRefresh } = useBetterAuth();

  // Enhanced sign in with security measures
  const signIn = useCallback(async (email: string, password: string, remember = false) => {
    try {
      await betterAuthSignIn({ email, password }, { remember });
      
      // Clear any existing cache on sign in
      clearAllCache();
      
      // Redirect based on role
      const role = user?.role?.toLowerCase();
      navigate({ 
        to: role === 'admin' ? '/admin/dashboard' : '/profile',
        replace: true
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, [betterAuthSignIn, navigate, user?.role]);

  // Enhanced sign out with cleanup
  const signOut = useCallback(async () => {
    try {
      await betterAuthSignOut();
      
      // Clear all cache and local storage
      clearAllCache();
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any sensitive cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Redirect to sign in
      navigate({ to: '/auth/signin', replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [betterAuthSignOut, navigate]);

  // Session refresh with error handling
  const refreshSession = useCallback(async () => {
    try {
      await betterAuthRefresh();
    } catch (error) {
      console.error('Session refresh error:', error);
      // If refresh fails, sign out
      await signOut();
    }
  }, [betterAuthRefresh, signOut]);

  // Auto refresh session when it's about to expire
  useEffect(() => {
    if (!user) return;

    const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
    const checkInterval = setInterval(async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.error('Auto refresh error:', error);
      }
    }, REFRESH_BUFFER);

    return () => clearInterval(checkInterval);
  }, [user, refreshSession]);

  // Detect and handle token tampering
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const [, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        
        // Check if token belongs to current user
        if (decodedPayload.sub !== user.id) {
          console.error('Token mismatch detected');
          signOut();
        }
      } catch (error) {
        console.error('Token validation error:', error);
        signOut();
      }
    }
  }, [user, signOut]);

  return {
    user: user as AuthUser | null,
    isLoading: loading,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toLowerCase() === 'admin',
    signIn,
    signOut,
    refreshSession,
  };
}

// Helper hooks for role-based access control
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ 
        to: '/auth/signin',
        search: { redirect: window.location.pathname },
        replace: true 
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return isLoading;
}

export function useRequireAdmin() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate({ 
          to: '/auth/signin',
          search: { redirect: window.location.pathname },
          replace: true 
        });
      } else if (!isAdmin) {
        navigate({ to: '/profile', replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  return isLoading;
}
