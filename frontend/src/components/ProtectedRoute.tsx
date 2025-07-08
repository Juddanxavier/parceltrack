import { useEffect, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useBetterAuth } from '../better-auth'

export interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('user' | 'admin')[]
  fallbackRoute?: string
  loadingComponent?: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles = ['user', 'admin'],
  fallbackRoute = '/profile',
  loadingComponent = <div className="flex items-center justify-center min-h-screen">Loading...</div>,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading } = useBetterAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to signin
        navigate({ to: '/auth/signin', replace: true })
      } else if (requireAdmin && user.role !== 'admin') {
        // Admin required but user is not admin
        navigate({ to: fallbackRoute, replace: true })
      } else if (user.role && !allowedRoles.includes(user.role as 'user' | 'admin')) {
        // Logged in but role not allowed, redirect to fallback route
        navigate({ to: fallbackRoute, replace: true })
      }
    }
  }, [user, loading, navigate, allowedRoles, fallbackRoute, requireAdmin])

  if (loading) return <>{loadingComponent}</>

  // If user is authenticated and meets requirements, render children
  if (user && user.role) {
    if (requireAdmin && user.role !== 'admin') {
      return <>{loadingComponent}</>
    }
    if (allowedRoles.includes(user.role as 'user' | 'admin')) {
      return <>{children}</>
    }
  }

  // While redirecting, show loading
  return <>{loadingComponent}</>
}
