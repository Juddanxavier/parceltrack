# Better Auth Admin Plugin Integration

## Overview
This document summarizes the integration of Better Auth admin plugin endpoints into the frontend admin components for seamless user management.

## Changes Made

### 1. API Service Updates (`src/services/api.tsx`)

#### New Better Auth Admin API Functions
- **`betterAuthAdminAPI.listUsers()`** - List all users using Better Auth admin plugin
- **`betterAuthAdminAPI.setRole(userId, role)`** - Set user role (user/admin)
- **`betterAuthAdminAPI.banUser(userId, banUntil?)`** - Ban a user with optional expiry
- **`betterAuthAdminAPI.unbanUser(userId)`** - Unban a user
- **`betterAuthAdminAPI.impersonateUser(userId)`** - Impersonate a user
- **`betterAuthAdminAPI.stopImpersonation()`** - Stop impersonation
- **`betterAuthAdminAPI.createUser(userData)`** - Create user via Better Auth admin
- **`betterAuthAdminAPI.removeUser(userId)`** - Remove user via Better Auth admin

#### Enhanced Existing Functions
- **`userAPI.getUsers()`** - Now tries Better Auth admin plugin first, with fallback to legacy endpoints
- **`userAPI.createUser()`** - Uses Better Auth admin plugin with fallback
- **`userAPI.deleteUser()`** - Uses Better Auth admin plugin with fallback
- **`userAPI.changeUserRole()`** - Uses Better Auth admin plugin with fallback
- **`userAPI.changeUserStatus()`** - Maps status changes to Better Auth ban/unban operations

### 2. User Management Table Updates (`src/components/admin/UserManagementTable.tsx`)

#### New Props
- `onImpersonateUser?: (userId: string) => void`
- `onBanUser?: (userId: string) => void`
- `onUnbanUser?: (userId: string) => void`

#### New Actions in Dropdown Menu
- **Impersonate user** - Allows admin to impersonate another user
- **Ban user** - Ban a user (shows when user is not suspended)
- **Unban user** - Unban a user (shows when user is suspended)

#### Icons Added
- `UserCog` for impersonation
- `Ban` for ban action

### 3. Users Page Updates (`src/routes/admin/users.tsx`)

#### New Handler Functions
- **`handleImpersonateUser(userId)`** - Initiates user impersonation and stores session data
- **`handleBanUser(userId)`** - Bans a user and refreshes the list
- **`handleUnbanUser(userId)`** - Unbans a user and refreshes the list

#### Updated Component Props
The `UserManagementTable` component now receives the new handler functions.

### 4. Admin Layout Updates (`src/components/admin/AdminLayout.tsx`)

#### New Impersonation Banner Component
- Displays when admin is impersonating another user
- Shows impersonated user's name/email
- Provides "Stop Impersonation" button
- Uses session storage to track impersonation state

#### Visual Indicators
- Yellow banner at top of admin interface during impersonation
- Alert triangle icon to draw attention
- Clear call-to-action button to stop impersonation

## Integration Strategy

### Graceful Fallbacks
The integration is designed with graceful fallbacks:
1. **Primary**: Try Better Auth admin plugin endpoints
2. **Fallback**: Use existing legacy endpoints if Better Auth is unavailable
3. **Logging**: Console warnings when falling back to legacy endpoints

### Session Management
- Impersonation state stored in `sessionStorage`
- Banner automatically detects and displays impersonation status
- Session data cleared when impersonation is stopped

### User Experience
- **Toast notifications** for all actions (success/error)
- **Visual feedback** with impersonation banner
- **Consistent UI** - new actions integrate seamlessly with existing interface
- **Role-based actions** - ban/unban buttons show contextually

## Better Auth Admin Plugin Endpoints

The frontend now integrates with these Better Auth admin plugin endpoints:

```
GET    /api/admin/list-users       - List all users
POST   /api/admin/set-role         - Set user role
POST   /api/admin/ban-user         - Ban user
POST   /api/admin/unban-user       - Unban user
POST   /api/admin/impersonate      - Impersonate user
POST   /api/admin/stop-impersonate - Stop impersonation
POST   /api/admin/create-user      - Create user
POST   /api/admin/remove-user      - Remove user
```

## Usage Examples

### Impersonating a User
1. Admin clicks "Impersonate user" from user dropdown menu
2. System calls Better Auth admin plugin endpoint
3. Session data stored for banner display
4. Admin redirected to dashboard as impersonated user
5. Yellow banner shows impersonation status
6. Admin can click "Stop Impersonation" to return to normal

### Banning/Unbanning Users
1. Admin clicks "Ban user" or "Unban user" from dropdown
2. System calls appropriate Better Auth endpoint
3. User list refreshes to show updated status
4. Success notification displayed

### Role Management
1. Admin clicks "Make admin" or "Remove admin" from dropdown
2. System tries Better Auth admin plugin endpoint first
3. Falls back to legacy endpoint if needed
4. User list updates with new role

## Benefits

1. **Better Auth Integration** - Leverages powerful admin plugin features
2. **Backward Compatibility** - Existing functionality preserved with fallbacks
3. **Enhanced Security** - Built-in ban/unban and impersonation features
4. **Improved UX** - Clear visual indicators and consistent interface
5. **Maintainable Code** - Clean separation between Better Auth and legacy APIs

## Future Enhancements

1. **Real-time Updates** - WebSocket integration for live user status changes
2. **Audit Logging** - Track all admin actions with Better Auth
3. **Advanced Permissions** - Fine-grained permission management
4. **Bulk Operations** - Extend Better Auth integration to bulk actions
5. **Session Management** - Better Auth session handling improvements
