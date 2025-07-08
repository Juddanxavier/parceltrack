import { QueryClient } from '@tanstack/react-query'

// Create a QueryClient with optimized settings to prevent 429 errors
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 10 minutes (longer cache)
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      
      // Very conservative retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on any HTTP errors to prevent rate limits
        if (error?.response?.status) return false
        // Only retry on network errors, and only once
        return failureCount < 1
      },
      
      // Disable all automatic refetching to prevent rate limits
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,  // Enable refetch on reconnect
      refetchInterval: false,
      refetchIntervalInBackground: false,
      
      // Longer delay between retries
      retryDelay: attemptIndex => Math.min(3000 * 2 ** attemptIndex, 60000),
    },
    
    mutations: {
      // Don't retry mutations at all
      retry: false,
      // Add delay for mutations too
      retryDelay: 3000,
    },
  },
})

// Query keys for better organization and cache invalidation
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    stats: () => [...queryKeys.users.all, 'stats'] as const,
  },
  admin: {
    all: ['admin'] as const,
    users: () => [...queryKeys.admin.all, 'users'] as const,
    roles: () => [...queryKeys.admin.all, 'roles'] as const,
  },
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
} as const
