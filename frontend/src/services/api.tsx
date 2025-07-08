import axios from 'axios'
import { throttleRequest, retryWithBackoff, getCachedRequest, setCachedRequest } from '../lib/apiUtils'

/**
 * Creates an instance of axios with a base URL and default headers.
 * The base URL is set to the value of the REACT_APP_API_URL environment variable,
 * or defaults to 'http://localhost:3000' if not set.
 * The 'Content-Type' header is set to 'application/json' for all requests.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always send cookies for session auth
})

// User interface for type safety
export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface UserFormData {
  name: string
  email: string
  role: 'user' | 'admin'
  password?: string // For creating new users
}

export interface UserStats {
  totalUsers: number
  adminUsers: number
}

// Admin API functions
export const roleAPI = {
  getAllUsers: async () => {
    // Check cache first
    const cached = getCachedRequest<any>('/api/admin/users')
    if (cached) return cached
    
    await throttleRequest('/api/admin/users')
    return await retryWithBackoff(async () => {
      const response = await api.get('/api/admin/users')
      setCachedRequest('/api/admin/users', response.data)
      return response.data
    })
  },

  changeUserRole: async (userId: string, role: 'user' | 'admin') => {
    await throttleRequest(`/api/admin/users/${userId}/role`)
    return await retryWithBackoff(async () => {
      const response = await api.put(`/api/admin/users/${userId}/role`, { role })
      return response.data
    })
  },

  // Debug function to check current user
  debugCurrentUser: async () => {
    await throttleRequest('/api/debug/me')
    return await retryWithBackoff(async () => {
      const response = await api.get('/api/debug/me')
      return response.data
    })
  },
}

// Better Auth Admin Plugin API functions - Updated to match backend implementation
export const betterAuthAdminAPI = {
  // List all users using Better Auth admin plugin
  listUsers: async (): Promise<{ users: User[] }> => {
    // Check cache first
    const cached = getCachedRequest<{ users: User[] }>('/api/admin/users')
    if (cached) return cached
    
    await throttleRequest('/api/admin/users')
    return await retryWithBackoff(async () => {
      const response = await api.get('/api/admin/users')
      setCachedRequest('/api/admin/users', response.data)
      return response.data
    })
  },

  // Get user statistics
  getUserStats: async (): Promise<{ stats: { totalUsers: number; totalAdmins: number; recentUsers: number; totalRegularUsers: number } }> => {
    await throttleRequest('/api/admin/users/stats')
    return await retryWithBackoff(async () => {
      const response = await api.get('/api/admin/users/stats')
      return response.data
    })
  },

  // Get single user by ID
  getUser: async (userId: string): Promise<{ user: User }> => {
    await throttleRequest(`/api/admin/users/${userId}`)
    return await retryWithBackoff(async () => {
      const response = await api.get(`/api/admin/users/${userId}`)
      return response.data
    })
  },

  // Set user role using the correct endpoint
  setRole: async (userId: string, role: 'user' | 'admin'): Promise<{ user: User; message: string; previousRole: string }> => {
    await throttleRequest(`/api/admin/users/${userId}/role`)
    return await retryWithBackoff(async () => {
      const response = await api.put(`/api/admin/users/${userId}/role`, { role })
      return response.data
    })
  },

  // Create user using Better Auth admin
  createUser: async (userData: {
    email: string
    name: string
    password: string
    role?: 'user' | 'admin'
  }): Promise<{ user: User; message: string }> => {
    await throttleRequest('/api/admin/users')
    return await retryWithBackoff(async () => {
      const response = await api.post('/api/admin/users', userData)
      return response.data
    })
  },

  // Update user
  updateUser: async (userId: string, userData: {
    name?: string
    email?: string
    role?: 'user' | 'admin'
  }): Promise<{ user: User; message: string }> => {
    await throttleRequest(`/api/admin/users/${userId}`)
    return await retryWithBackoff(async () => {
      const response = await api.put(`/api/admin/users/${userId}`, userData)
      return response.data
    })
  },

  // Remove user
  removeUser: async (userId: string): Promise<{ message: string; deletedUser: User }> => {
    await throttleRequest(`/api/admin/users/${userId}`)
    return await retryWithBackoff(async () => {
      const response = await api.delete(`/api/admin/users/${userId}`)
      return response.data
    })
  },

  banUser: async (userId: string, banUntil?: string): Promise<{ message: string }> => {
    await throttleRequest(`/api/admin/users/${userId}/ban`)
    return await retryWithBackoff(async () => {
      const response = await api.post(`/api/admin/users/${userId}/ban`, { banUntil })
      return response.data
    })
  },

  unbanUser: async (userId: string): Promise<{ message: string }> => {
    await throttleRequest(`/api/admin/users/${userId}/unban`)
    return await retryWithBackoff(async () => {
      const response = await api.post(`/api/admin/users/${userId}/unban`)
      return response.data
    })
  },
}

// User Management API functions (Legacy/Custom endpoints - keeping for backward compatibility)
export const userAPI = {
  // Get all users with optional filtering and pagination
  getUsers: async (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ users: User[]; total: number; page: number; limit: number }> => {
    try {
      // First try Better Auth admin plugin endpoint
      const response = await betterAuthAdminAPI.listUsers()
      
      // Apply local filtering and pagination for Better Auth
      let filtered = response.users
      
      if (params) {
        // Apply search filter
        if (params.search) {
          const searchTerm = params.search.toLowerCase()
          filtered = filtered.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
          )
        }
        
        // Apply role filter
        if (params.role && params.role !== 'all') {
          filtered = filtered.filter(user => user.role === params.role)
        }
        
        // Apply sorting
        if (params.sortBy && params.sortOrder) {
          filtered.sort((a, b) => {
            const aVal = a[params.sortBy as keyof User]
            const bVal = b[params.sortBy as keyof User]
            
            let result = 0
            if (aVal < bVal) result = -1
            if (aVal > bVal) result = 1
            
            return params.sortOrder === 'desc' ? -result : result
          })
        }
      }
      
      // Apply pagination
      const page = params?.page || 1
      const limit = params?.limit || 10
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedUsers = filtered.slice(startIndex, endIndex)
      
      return {
        users: paginatedUsers,
        total: filtered.length,
        page,
        limit
      }
    } catch (error) {
      // Fallback to legacy endpoint if Better Auth admin plugin is not available
      console.warn('Better Auth admin plugin not available, falling back to legacy endpoint')
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString())
          }
        })
      }
      const response = await api.get(`/api/admin/users?${searchParams.toString()}`)
      return response.data
    }
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    try {
      // Try Better Auth admin plugin first
      const response = await betterAuthAdminAPI.getUserStats()
      return {
        totalUsers: response.stats.totalUsers,
        adminUsers: response.stats.totalAdmins,
      }
    } catch (error: any) {
      // If stats endpoint doesn't exist, calculate from user list
      if (error.response?.status === 404) {
        console.warn('Stats endpoint not available, calculating from user list')
        try {
          const usersResponse = await betterAuthAdminAPI.listUsers()
          const users = usersResponse.users
          return {
            totalUsers: users.length,
            adminUsers: users.filter(user => user.role === 'admin').length,
          }
        } catch (listError) {
          console.warn('Could not calculate stats from user list, returning default stats')
          return {
            totalUsers: 0,
            adminUsers: 0,
          }
        }
      }
      throw error
    }
  },

  // Get a single user by ID
  getUser: async (userId: string): Promise<User> => {
    try {
      const response = await betterAuthAdminAPI.getUser(userId)
      return response.user
    } catch (error: any) {
      // Fallback to direct API call
      console.warn('Better Auth getUser not available, falling back to direct API')
      const response = await api.get(`/api/admin/users/${userId}`)
      return response.data.user || response.data
    }
  },

  // Create a new user
  createUser: async (userData: UserFormData): Promise<User> => {
    try {
      // Try Better Auth admin plugin first
      const response = await betterAuthAdminAPI.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password || 'TempPassword123!', // Default password if not provided
        role: userData.role
      })
      return response.user
    } catch (error: any) {
      // Fallback to legacy endpoint
      console.warn('Better Auth admin plugin not available for createUser, falling back to legacy endpoint')
      try {
        const response = await api.post('/api/admin/users', userData)
        return response.data
      } catch (legacyError: any) {
        if (legacyError.response?.status === 404) {
          throw new Error('User creation not supported by backend. Please implement user creation endpoints.')
        }
        throw legacyError
      }
    }
  },

  // Update an existing user
  updateUser: async (userId: string, userData: Partial<UserFormData>): Promise<User> => {
    try {
      // Try Better Auth admin plugin first
      const response = await betterAuthAdminAPI.updateUser(userId, userData)
      return response.user
    } catch (error: any) {
      // If Better Auth endpoint doesn't exist, try legacy endpoint
      if (error.response?.status === 404) {
        console.warn('Better Auth update endpoint not available, trying legacy endpoint')
        try {
          const response = await api.put(`/api/admin/users/${userId}`, userData)
          return response.data.user || response.data
        } catch (legacyError: any) {
          if (legacyError.response?.status === 404) {
            throw new Error('User update not supported by backend. Please implement user update endpoints.')
          }
          throw legacyError
        }
      }
      throw error
    }
  },

  // Delete a user
  deleteUser: async (userId: string): Promise<void> => {
    try {
      // Try Better Auth admin plugin first
      await betterAuthAdminAPI.removeUser(userId)
    } catch (error: any) {
      // Fallback to legacy endpoint
      console.warn('Better Auth admin plugin not available for deleteUser, falling back to legacy endpoint')
      try {
        await api.delete(`/api/admin/users/${userId}`)
      } catch (legacyError: any) {
        if (legacyError.response?.status === 404) {
          throw new Error('User deletion not supported by backend. Please implement user deletion endpoints.')
        }
        throw legacyError
      }
    }
  },

  // Change user role
  changeUserRole: async (userId: string, role: 'user' | 'admin'): Promise<User> => {
    try {
      // Try Better Auth admin plugin first
      const response = await betterAuthAdminAPI.setRole(userId, role)
      return response.user
    } catch (error) {
      // Fallback to legacy endpoint
      console.warn('Better Auth admin plugin not available for changeUserRole, falling back to legacy endpoint')
      const response = await api.put(`/api/admin/users/${userId}/role`, { role })
      return response.data.user || response.data
    }
  },


  // Bulk operations
  bulkUpdateUsers: async (userIds: string[], updates: Partial<UserFormData>): Promise<User[]> => {
    const response = await api.put('/api/admin/users/bulk', { userIds, updates })
    return response.data
  },

  bulkDeleteUsers: async (userIds: string[]): Promise<void> => {
    await api.delete('/api/admin/users/bulk', { data: { userIds } })
  },

  // Export users data
  exportUsers: async (format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    const response = await api.get(`/api/admin/users/export?format=${format}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Send password reset email to user
  sendPasswordReset: async (userId: string): Promise<void> => {
    await api.post(`/api/admin/users/${userId}/password-reset`)
  },

  // Force user logout (invalidate all sessions)
  forceLogout: async (userId: string): Promise<void> => {
    await api.post(`/api/admin/users/${userId}/force-logout`)
  },

  // Get user activity/audit log
  getUserActivity: async (userId: string, params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<{
    activities: Array<{
      id: string
      action: string
      details: string
      timestamp: string
      ipAddress?: string
      userAgent?: string
    }>
    total: number
  }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })
    }
    const response = await api.get(`/api/admin/users/${userId}/activity?${searchParams.toString()}`)
    return response.data
  },

  // Update user permissions (if your backend supports granular permissions)
  updateUserPermissions: async (userId: string, permissions: string[]): Promise<User> => {
    const response = await api.put(`/api/admin/users/${userId}/permissions`, { permissions })
    return response.data
  },
}

// Authentication API functions
export const authAPI = {
  // Login
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/auth/signin', credentials)
    return response.data
  },

  // Register
  register: async (userData: { name: string; email: string; password: string }) => {
    const response = await api.post('/api/auth/signup', userData)
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/signout')
    return response.data
  },

  // Get current user session
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/session')
    return response.data
  },

  // Refresh session
  refreshSession: async () => {
    const response = await api.post('/api/auth/refresh')
    return response.data
  },

  // Request password reset
  requestPasswordReset: async (email: string) => {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/api/auth/reset-password', { token, newPassword })
    return response.data
  },

  // Verify email with token
  verifyEmail: async (token: string) => {
    const response = await api.post('/api/auth/verify-email', { token })
    return response.data
  },

  // Update profile
  updateProfile: async (profileData: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const response = await api.put('/api/auth/profile', profileData)
    return response.data
  },
}

// Exports the configured axios instance for use in the application.
export default api
