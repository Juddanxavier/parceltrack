import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { userAPI, roleAPI, betterAuthAdminAPI, type User, type UserFormData, type UserStats } from '../services/api'
import { queryKeys } from '../lib/queryClient'
import { useToast } from '../components/ToastProvider'
import { getUserFriendlyErrorMessage } from '../lib/apiUtils'

// Hook for fetching users list
export function useUsersQuery(params?: {
  page?: number
  limit?: number
  role?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userAPI.getUsers(params),
    staleTime: 30 * 1000, // 30 seconds for user lists
    enabled: true, // Always enabled
    refetchInterval: false, // Disable automatic polling to prevent rate limits
    refetchIntervalInBackground: false, // Don't poll when tab is not active
    retry: (failureCount, error) => {
      // Don't retry if it's a network error (server not running)
      if (error?.message?.includes('Network Error') || error?.code === 'ECONNREFUSED') {
        return false
      }
      return failureCount < 3
    },
  })
}

// Hook for fetching user statistics
export function useUserStatsQuery() {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: () => userAPI.getUserStats(),
    staleTime: 60 * 1000, // 1 minute for stats
    refetchInterval: false, // Disable automatic polling to prevent rate limits
    refetchIntervalInBackground: false, // Don't poll when tab is not active
    retry: (failureCount, error) => {
      // Don't retry if endpoint doesn't exist (404) or server is down
      if (
        error?.response?.status === 404 ||
        error?.message?.includes('Network Error') || 
        error?.code === 'ECONNREFUSED'
      ) {
        return false
      }
      return failureCount < 3
    },
    // Don't throw errors for 404 - treat as optional endpoint
    throwOnError: (error: any) => {
      if (error?.response?.status === 404) {
        return false
      }
      return true
    },
  })
}

// Hook for fetching admin users (using legacy API)
export function useAdminUsersQuery() {
  return useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: () => roleAPI.getAllUsers(),
    staleTime: 60 * 1000, // 1 minute
  })
}

// Mutations for user operations
export function useUserMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: UserFormData) => userAPI.createUser(userData),
    onMutate: async (userData) => {
      // Cancel outgoing refetches to avoid conflicts
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
      
      // Get current data for rollback
      const previousData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
      
      return { previousData }
    },
    onSuccess: (newUser, userData) => {
      // Optimistically add the new user to cache instead of invalidating
      queryClient.setQueriesData({ queryKey: queryKeys.users.lists() }, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          users: [newUser, ...oldData.users],
          total: oldData.total + 1
        }
      })
      
      // Only invalidate stats (lighter operation)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
      
      showSuccess('User Created', 'User has been created successfully')
    },
    onError: (error: any, userData, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      // Show user-friendly error messages
      if (error.message?.includes('not supported by backend')) {
        showError('Feature Not Available', error.message)
      } else {
        showError('Error', getUserFriendlyErrorMessage(error))
      }
    },
    onSettled: () => {
      // Light refresh only if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: Partial<UserFormData> }) => 
      userAPI.updateUser(userId, userData),
    onMutate: async ({ userId, userData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
      
      // Snapshot previous values
      const previousUsers = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
      
      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: queryKeys.users.lists() }, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          users: oldData.users.map((user: User) => 
            user.id === userId ? { ...user, ...userData } : user
          )
        }
      })
      
      return { previousUsers }
    },
    onSuccess: (updatedUser, { userId }) => {
      // Update the user in the cache with server response
      if (updatedUser) {
        queryClient.setQueriesData({ queryKey: queryKeys.users.lists() }, (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            users: oldData.users.map((user: User) => 
              user.id === userId ? updatedUser : user
            )
          }
        })
        
        // Also update individual user cache if it exists
        queryClient.setQueryData(queryKeys.users.detail(userId), updatedUser)
      }
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() })
      
      showSuccess('User Updated', 'User has been updated successfully')
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      // Show user-friendly error messages
      if (error.message?.includes('not supported by backend')) {
        showError('Feature Not Available', error.message)
      } else {
        showError('Error', getUserFriendlyErrorMessage(error))
      }
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userAPI.deleteUser(userId),
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
      
      // Get previous data for rollback
      const previousData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
      
      // Optimistically remove user
      queryClient.setQueriesData({ queryKey: queryKeys.users.lists() }, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          users: oldData.users.filter((user: User) => user.id !== userId),
          total: oldData.total - 1
        }
      })
      
      return { previousData }
    },
    onSuccess: (_, userId) => {
      // Remove individual user cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) })
      
      // Only invalidate stats (lighter operation)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
      
      showSuccess('User Deleted', 'User has been successfully deleted')
    },
    onError: (error: any, userId, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      // Show user-friendly error messages
      if (error.message?.includes('not supported by backend')) {
        showError('Feature Not Available', error.message)
      } else {
        showError('Error', getUserFriendlyErrorMessage(error))
      }
    },
  })

  // Change user role mutation
  const changeUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => 
      userAPI.changeUserRole(userId, role),
    onMutate: async ({ userId, role }) => {
      // Cancel outgoing refetches to avoid conflicts
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
      
      // Snapshot the previous value for potential rollback
      const previousUsers = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
      
      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: queryKeys.users.lists() }, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          users: oldData.users.map((user: User) => 
            user.id === userId ? { ...user, role } : user
          )
        }
      })
      
      return { previousUsers }
    },
    onSuccess: (updatedUser, { userId, role }) => {
      // Update cache with the actual server response if we have it
      if (updatedUser) {
        queryClient.setQueriesData({ queryKey: queryKeys.users.lists() }, (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            users: oldData.users.map((user: User) => 
              user.id === userId ? updatedUser : user
            )
          }
        })
      }
      
      // Only invalidate stats (lighter operation)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() })
      
      showSuccess('Role Updated', `User role has been changed to ${role}`)
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      showError('Error', getUserFriendlyErrorMessage(error))
    },
  })


  return {
    createUser: createUserMutation,
    updateUser: updateUserMutation,
    deleteUser: deleteUserMutation,
    changeUserRole: changeUserRoleMutation,
  }
}

// Combined hook for users page
export function useUsersPage(options?: { limit?: number }) {
  const limit = options?.limit || 10
  const queryClient = useQueryClient()
  
  // Fetch users and stats
  const usersQuery = useUsersQuery({ limit })
  const statsQuery = useUserStatsQuery()
  
  // Get mutation functions
  const mutations = useUserMutations()
  
  // Determine if backend is available
  const isServerUnavailable = usersQuery.error && (
    usersQuery.error.message?.includes('Network Error') ||
    usersQuery.error.code === 'ECONNREFUSED' ||
    usersQuery.error.message?.includes('fetch')
  )
  
  // Manual refresh function that clears cache and refetches
  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.all })
    await usersQuery.refetch()
    await statsQuery.refetch()
  }
  
  // Calculate stats from user list if stats endpoint is not available
  const calculatedStats = useMemo(() => {
    const users = usersQuery.data?.users || []
    const stats = {
      totalUsers: usersQuery.data?.total || users.length,
      adminUsers: users.filter(user => user.role === 'admin').length,
    }
    
    // Log when using calculated stats (only if we have actual user data)
    if (users.length > 0 && statsQuery.error?.response?.status === 404) {
      console.info('📊 Using calculated stats from user list (stats endpoint not available):', stats)
    }
    
    return stats
  }, [usersQuery.data, statsQuery.error])
  
  return {
    // Data
    users: usersQuery.data?.users || [],
    totalUsers: statsQuery.data?.totalUsers || calculatedStats.totalUsers,
    adminUsers: statsQuery.data?.adminUsers || calculatedStats.adminUsers,
    
    // Loading states
    loading: usersQuery.isLoading,
    statsLoading: statsQuery.isLoading,
    
    // Error states  
    error: usersQuery.error ? (
      isServerUnavailable ? 
        'Backend server is not running. Please start the server to manage users.' :
        getUserFriendlyErrorMessage(usersQuery.error)
    ) : null,
    
    // Mutations
    createUser: mutations.createUser.mutateAsync,
    updateUser: (userId: string, userData: Partial<UserFormData>) => 
      mutations.updateUser.mutateAsync({ userId, userData }),
    deleteUser: mutations.deleteUser.mutateAsync,
    changeUserRole: (userId: string, role: 'user' | 'admin') => 
      mutations.changeUserRole.mutateAsync({ userId, role }),
    
    // Mutation states
    isCreating: mutations.createUser.isPending,
    isUpdating: mutations.updateUser.isPending,
    isDeleting: mutations.deleteUser.isPending,
    isChangingRole: mutations.changeUserRole.isPending,
    
    // Refetch functions
    refetch: usersQuery.refetch,
    refreshAll,
  }
}
