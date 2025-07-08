import { createContext, useContext, useCallback, useState } from 'react'
import { authClient } from '../lib/client'
import type { ReactNode } from 'react'

interface User {
  id: string
  email: string
  name?: string
  role?: 'user' | 'admin'
  [key: string]: any
}

interface AuthError {
  message: string
  code?: string
  statusCode?: number
}

interface BetterAuthContextType {
  user: User | null
  loading: boolean
  error: AuthError | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: AuthError }>
  logout: () => Promise<void>
  clearError: () => void
  refreshUser: () => Promise<void>
}

const BetterAuthContext = createContext<BetterAuthContextType | undefined>(
  undefined,
)

export function BetterAuthProvider({ children }: { children: ReactNode }) {
  const [authError, setAuthError] = useState<AuthError | null>(null)
  
  // Use the session hook for user and loading state
  const {
    data: sessionData,
    isPending: loading,
    error: sessionError,
    refetch,
  } = authClient.useSession()

  // Clear error function
  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error('Failed to refresh user session:', error)
      setAuthError({
        message: 'Failed to refresh user session',
        code: 'REFRESH_ERROR'
      })
    }
  }, [refetch])

  // Use session data directly - no need for additional API calls!
  const user = sessionData?.user ? {
    ...sessionData.user,
    role: (sessionData.user.role || 'user') as 'user' | 'admin'
  } : null
  
  const isLoading = loading
  const error = authError || (sessionError ? { message: sessionError.message || 'Authentication error', code: 'SESSION_ERROR' } : null)

  // Login method with enhanced error handling
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setAuthError(null)
        const { error } = await authClient.signIn.email({ email, password })
        
        if (error) {
          const authError: AuthError = {
            message: error.message || 'Login failed',
            code: error.code || 'LOGIN_ERROR',
            statusCode: error.status
          }
          setAuthError(authError)
          return { success: false, error: authError }
        }
        
        await refetch()
        return { success: true }
      } catch (err: any) {
        const authError: AuthError = {
          message: err.message || 'An unexpected error occurred during login',
          code: 'UNEXPECTED_LOGIN_ERROR'
        }
        setAuthError(authError)
        return { success: false, error: authError }
      }
    },
    [refetch],
  )

  // Register method with enhanced error handling
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setAuthError(null)
        const { error } = await authClient.signUp.email({ email, password, name })
        
        if (error) {
          const authError: AuthError = {
            message: error.message || 'Registration failed',
            code: error.code || 'REGISTER_ERROR',
            statusCode: error.status
          }
          setAuthError(authError)
          return { success: false, error: authError }
        }
        
        await refetch()
        return { success: true }
      } catch (err: any) {
        const authError: AuthError = {
          message: err.message || 'An unexpected error occurred during registration',
          code: 'UNEXPECTED_REGISTER_ERROR'
        }
        setAuthError(authError)
        return { success: false, error: authError }
      }
    },
    [refetch],
  )

  // Logout method with enhanced error handling
  const logout = useCallback(async () => {
    try {
      setAuthError(null)
      await authClient.signOut()
      await refetch()
    } catch (err: any) {
      console.error('Logout error:', err)
      // Even if logout fails, clear local state
      setAuthError({
        message: 'Logout completed with errors',
        code: 'LOGOUT_ERROR'
      })
    }
  }, [refetch])

  return (
    <BetterAuthContext.Provider
      value={{ 
        user, 
        loading: isLoading, 
        error, 
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
