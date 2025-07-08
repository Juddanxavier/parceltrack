# Admin Dashboard Frontend

This document explains the frontend admin dashboard implementation for user role management.

## Overview

The admin dashboard provides a web interface for administrators to:
- View all users in the system
- See user statistics (total users, admin count, regular user count)
- Change user roles between USER and ADMIN
- Monitor user creation and update dates

## Access Control

### Protected Route
The admin dashboard is protected by the `ProtectedRoute` component with `requireAdmin={true}`, ensuring only users with ADMIN role can access it.

### Navigation
Admin users will see an "Admin Dashboard" link in their header dropdown menu that takes them to `/admin/dashboard`.

## Features

### Dashboard Statistics
- **Total Users**: Shows count of all registered users
- **Admin Users**: Shows count of users with ADMIN role
- **Regular Users**: Shows count of users with USER role

### User Management Table
Displays all users with the following information:
- Name
- Email
- Role (with color-coded badges)
- Created date
- Last updated date
- Actions menu

### Role Management
- Click the actions menu (⋮) next to any user to change their role
- Options: "Make User" or "Make Admin"
- Self-protection: Users cannot change their own role
- Real-time updates: The table refreshes after role changes

## Technical Implementation

### Components Used
- `Card` components for layout and statistics
- `Table` components for user listing
- `Badge` components for role indicators
- `DropdownMenu` for actions
- `Button` components for interactions

### API Integration
Uses the `roleAPI` service which provides:
- `getAllUsers()` - Fetch all users
- `changeUserRole(userId, role)` - Change a user's role

### Security Features
- **Route Protection**: Only admins can access the dashboard
- **Self-Protection**: Users cannot modify their own roles
- **Real-time Validation**: Role changes are immediately reflected
- **Error Handling**: Displays user-friendly error messages

## URL Structure
- `/admin/dashboard` - Main admin dashboard

## Error Handling
- Loading states during data fetching
- Error display with retry functionality
- User feedback for successful/failed operations
- Graceful handling of empty states

## Responsive Design
The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Usage Flow

1. **Access**: Admin logs in and sees "Admin Dashboard" in header menu
2. **Navigate**: Click to go to `/admin/dashboard`
3. **View Data**: See statistics and user table
4. **Manage Roles**: Use action menu to change user roles
5. **Feedback**: Receive confirmation of successful changes

## Security Considerations

- All API calls include authentication cookies
- Role checks happen on both frontend and backend
- Protection against privilege escalation
- Audit trail through role change confirmations
