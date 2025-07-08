# User Management API Integration

This document describes the comprehensive user management API integration for the frontend application.

## Overview

The frontend now includes a complete user management system with API integration for:
- User CRUD operations
- Role and status management
- Bulk operations
- Statistics and reporting
- Export functionality
- Activity tracking

## API Structure

### Base Configuration

The API client is configured in `src/services/api.tsx` with:
- Base URL: `http://localhost:5000`
- Automatic cookie-based authentication
- Proper error handling

### API Endpoints

#### User Management (`userAPI`)

```typescript
// Get users with filtering and pagination
userAPI.getUsers({
  page: 1,
  limit: 10,
  role: 'admin',
  status: 'active',
  search: 'john',
  sortBy: 'name',
  sortOrder: 'asc'
})

// Get user statistics
userAPI.getUserStats()

// Get single user
userAPI.getUser(userId)

// Create user
userAPI.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  status: 'active',
  department: 'Engineering',
  password: 'securePassword' // For new users
})

// Update user
userAPI.updateUser(userId, userData)

// Delete user
userAPI.deleteUser(userId)

// Change user role
userAPI.changeUserRole(userId, 'admin')

// Change user status
userAPI.changeUserStatus(userId, 'suspended')

// Bulk operations
userAPI.bulkUpdateUsers(userIds, updates)
userAPI.bulkDeleteUsers(userIds)

// Export users
userAPI.exportUsers('csv') // or 'xlsx'

// Advanced operations
userAPI.sendPasswordReset(userId)
userAPI.forceLogout(userId)
userAPI.getUserActivity(userId, { page: 1, limit: 10 })
userAPI.updateUserPermissions(userId, permissions)
```

#### Authentication (`authAPI`)

```typescript
// Basic auth operations
authAPI.login({ email, password })
authAPI.register({ name, email, password })
authAPI.logout()
authAPI.getCurrentUser()
authAPI.refreshSession()

// Password management
authAPI.requestPasswordReset(email)
authAPI.resetPassword(token, newPassword)
authAPI.verifyEmail(token)

// Profile management
authAPI.updateProfile({
  name: 'New Name',
  email: 'new@email.com',
  currentPassword: 'current',
  newPassword: 'new'
})
```

#### Legacy Role API (`roleAPI`)

```typescript
// Legacy endpoints (kept for backward compatibility)
roleAPI.getCurrentUserRole()
roleAPI.getAllUsers()
roleAPI.changeUserRole(userId, role)
roleAPI.debugCurrentUser()
```

## Data Types

### User Interface

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}
```

### User Form Data

```typescript
interface UserFormData {
  name: string
  email: string
  role: 'user' | 'admin'
  password?: string // For creating new users
}
```

### User Statistics

```typescript
interface UserStats {
  totalUsers: number
  adminUsers: number
}
```

## React Hook: useUserManagement

A comprehensive hook for managing user state and API calls:

```typescript
const {
  // State
  users,
  stats,
  loading,
  error,
  pagination,
  filters,

  // Actions
  loadUsers,
  loadStats,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  changeUserStatus,
  updateFilters,
  updatePagination,
  exportUsers,
  bulkUpdateUsers,
  bulkDeleteUsers,
  sendPasswordReset,
  forceLogout,
  getUserActivity,

  // Computed values
  totalUsers,
  adminUsers,
  activeUsers,
  suspendedUsers,
  inactiveUsers,
} = useUserManagement({
  initialPage: 1,
  initialLimit: 10,
  autoLoadStats: true
})
```

### Hook Options

```typescript
interface UseUserManagementOptions {
  initialPage?: number      // Default: 1
  initialLimit?: number     // Default: 10
  autoLoadStats?: boolean   // Default: true
}
```

### Hook Filters

```typescript
interface UseUserManagementFilters {
  role?: string
  status?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

## Error Handling

The system includes comprehensive error handling utilities in `src/lib/apiUtils.ts`:

### Error Types Detection

```typescript
isNetworkError(error)      // Network connectivity issues
isAuthError(error)         // 401 Unauthorized
isPermissionError(error)   // 403 Forbidden
isNotFoundError(error)     // 404 Not Found
isValidationError(error)   // 400/422 Validation errors
isServerError(error)       // 5xx Server errors
```

### Error Message Extraction

```typescript
getErrorMessage(error)              // Extract basic error message
getApiError(error)                  // Get full error details
getUserFriendlyErrorMessage(error)  // Get user-friendly message
```

## Utility Functions

Additional utilities for common operations:

```typescript
// File operations
downloadBlob(blob, filename)

// User formatting
formatUserName(name)
getUserInitials(name)

// Date formatting
formatDate(dateString)
formatDateTime(dateString)
getRelativeTime(dateString)

// Validation
isValidEmail(email)

// Utilities
generatePassword(length)
debounce(func, delay)
```

## Component Integration

### Admin Users Page

The main user management interface is in `src/routes/admin/users.tsx`:

- Uses `useUserManagement` hook
- Displays user statistics cards
- Integrates with `UserManagementTable` component
- Handles all CRUD operations with proper error handling

### User Management Table

Component in `src/components/admin/UserManagementTable.tsx`:

- Sortable columns
- Filtering and search
- Pagination
- Bulk operations
- Role and status quick actions
- Export functionality

### User Form Modal

Component in `src/components/admin/UserFormModal.tsx`:

- Add/Edit user form
- Form validation with Zod
- Role and status selection
- Department field

## Backend Requirements

The frontend expects the following API endpoints from the backend:

### Required Endpoints

```
GET    /api/admin/users              # Get users with filters/pagination
GET    /api/admin/users/stats        # Get user statistics
GET    /api/admin/users/:id          # Get single user
POST   /api/admin/users              # Create user
PUT    /api/admin/users/:id          # Update user
DELETE /api/admin/users/:id          # Delete user
PUT    /api/admin/users/:id/role     # Change user role
PUT    /api/admin/users/:id/status   # Change user status
PUT    /api/admin/users/bulk         # Bulk update users
DELETE /api/admin/users/bulk         # Bulk delete users
GET    /api/admin/users/export       # Export users
POST   /api/admin/users/:id/password-reset  # Send password reset
POST   /api/admin/users/:id/force-logout    # Force user logout
GET    /api/admin/users/:id/activity # Get user activity log
PUT    /api/admin/users/:id/permissions     # Update permissions

# Authentication endpoints
POST   /api/auth/signin              # Login
POST   /api/auth/signup              # Register
POST   /api/auth/signout             # Logout
GET    /api/auth/session             # Get current session
POST   /api/auth/refresh             # Refresh session
POST   /api/auth/forgot-password     # Request password reset
POST   /api/auth/reset-password      # Reset password
POST   /api/auth/verify-email        # Verify email
PUT    /api/auth/profile             # Update profile

# Legacy endpoints (for backward compatibility)
GET    /api/admin/current            # Get current user role
PUT    /api/admin/users/:id/role     # Change user role (legacy)
GET    /api/debug/me                 # Debug current user
```

### Expected Response Formats

#### User List Response
```json
{
  "users": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "status": "active",
      "department": "Engineering",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### User Stats Response
```json
{
  "totalUsers": 100,
  "adminUsers": 5,
  "activeUsers": 90,
  "suspendedUsers": 2,
  "inactiveUsers": 8
}
```

#### Error Response
```json
{
  "message": "User not found",
  "error": "NOT_FOUND",
  "details": {}
}
```

## Usage Examples

### Basic Usage

```typescript
// In a React component
const UserManagement = () => {
  const { users, loading, createUser } = useUserManagement()
  
  const handleCreateUser = async (userData) => {
    try {
      await createUser(userData)
      // Success handled automatically by hook
    } catch (error) {
      // Error handling
      console.error('Failed to create user:', error)
    }
  }
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### With Filtering

```typescript
const { users, updateFilters } = useUserManagement()

// Filter by role
updateFilters({ role: 'admin' })

// Search users
updateFilters({ search: 'john' })

// Sort users
updateFilters({ sortBy: 'name', sortOrder: 'asc' })
```

### Bulk Operations

```typescript
const { bulkDeleteUsers, bulkUpdateUsers } = useUserManagement()

// Delete multiple users
await bulkDeleteUsers(['1', '2', '3'])

// Update multiple users
await bulkUpdateUsers(['1', '2'], { status: 'inactive' })
```

### Export Users

```typescript
const { exportUsers } = useUserManagement()

// Export as CSV
const csvBlob = await exportUsers('csv')
downloadBlob(csvBlob, 'users.csv')

// Export as Excel
const xlsxBlob = await exportUsers('xlsx')
downloadBlob(xlsxBlob, 'users.xlsx')
```

## Security Considerations

1. **Authentication**: All API calls include credentials via cookies
2. **Authorization**: Admin-only endpoints require proper role validation
3. **Input Validation**: Form data is validated on the frontend and should be validated on the backend
4. **Password Security**: New user passwords should be securely generated or validated
5. **Session Management**: Proper session handling with refresh tokens
6. **Error Messages**: Avoid exposing sensitive information in error messages

## Development Notes

1. The API base URL is currently hardcoded to `http://localhost:5000` for development
2. Error handling is comprehensive and user-friendly
3. All components are fully typed with TypeScript
4. The system is designed to be scalable and maintainable
5. The hook pattern allows for easy testing and reusability

## Testing

To test the API integration:

1. Ensure your backend is running on `http://localhost:5000`
2. Navigate to `/admin/users` in the frontend
3. Test CRUD operations through the UI
4. Verify error handling by simulating network issues
5. Test bulk operations and export functionality

## Future Enhancements

Potential improvements:

1. Real-time updates via WebSocket
2. Advanced filtering options
3. User import functionality
4. Audit log visualization
5. Permission management UI
6. User profile pictures
7. Two-factor authentication
8. Advanced search with query builder
