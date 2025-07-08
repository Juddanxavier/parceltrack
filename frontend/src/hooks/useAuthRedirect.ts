import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useBetterAuth } from '../better-auth'

interface UseAuthRedirectOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
  fallbackRoute?: string
}

interface AuthRedirectResult {
  isRedirecting: boolean
  shouldRender: boolean
}

export function useAuthRedirect({
  requireAuth = false,
  requireAdmin = false,
  redirectTo,
  fallbackRoute = '/profile'
}: UseAuthRedirectOptions = {}): AuthRedirectResult {
  const { user, loading } = useBetterAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectingRef = useRef(false)

  useEffect(() => {
    // Don't do anything while loading or already redirecting
    if (loading || redirectingRef.current) {
      return
    }

    const currentPath = location.pathname

    // Case 1: User is authenticated and on auth pages - redirect based on role
    if (user && (currentPath === '/auth/signin' || currentPath === '/auth/signup')) {
      const targetRoute = user.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/profile'
      redirectingRef.current = true
      navigate({ to: targetRoute, replace: true })
      return
    }

    // Case 2: User is authenticated and should be redirected to a specific route
    if (user && redirectTo) {
      const ALLOWED_REDIRECTS = ['/profile', '/admin', '/dashboard'];
      const isAllowedRedirect = ALLOWED_REDIRECTS.some(path => redirectTo.startsWith(path));
      if (!isAllowedRedirect) redirectTo = fallbackRoute;

      redirectingRef.current = true;
      navigate({ to: redirectTo, replace: true })
      return
    }

    // Case 3: Admin user on non-admin pages (except profile and auth)
    if (user && user.role?.toLowerCase() === 'admin' && 
        !currentPath.startsWith('/admin') && 
        !currentPath.startsWith('/auth') && 
        currentPath !== '/profile' &&
        currentPath !== '/') {
      redirectingRef.current = true
      navigate({ to: '/admin/dashboard', replace: true })
      return
    }

    // Case 4: Route requires authentication but user is not logged in
    if (requireAuth && !user) {
      redirectingRef.current = true
      navigate({ 
        to: '/auth/signin',
        search: { redirect: currentPath },
        replace: true 
      })
      return
    }

    // Case 5: Route requires admin but user is not admin
    if (requireAdmin && user && user.role?.toLowerCase() !== 'admin') {
      redirectingRef.current = true
      navigate({ to: fallbackRoute, replace: true })
      return
    }

    // Reset redirecting flag if we reach here
    redirectingRef.current = false
  }, [user, loading, navigate, location.pathname, requireAuth, requireAdmin, redirectTo, fallbackRoute])

  // Reset redirecting flag when location changes
  useEffect(() => {
    redirectingRef.current = false
  }, [location.pathname])

  const isRedirecting = loading || redirectingRef.current
  const shouldRender = !isRedirecting && (
    !requireAuth || 
    (requireAuth && user && (!requireAdmin || user.role?.toLowerCase() === 'admin'))
  ) || false

  return {
    isRedirecting,
    shouldRender
  }
}

// Helper hook for post-login redirects
export function usePostLoginRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  return (user: any) => {
    // Check for redirect parameter in URL
    const searchParams = new URLSearchParams(location.search)
    const redirectTo = searchParams.get('redirect')
    
    if (redirectTo && redirectTo !== '/auth/signin' && redirectTo !== '/auth/signup') {
      navigate({ to: redirectTo, replace: true })
      return
    }

    // Default role-based redirect
    const targetRoute = user.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/profile'
    navigate({ to: targetRoute, replace: true })
  }
}
