import { createFileRoute } from '@tanstack/react-router'
import { useBetterAuth } from '../../better-auth'
import { useState } from 'react'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { MoreHorizontal, Users, Shield, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { useUsersQuery, useUserMutations } from '../../hooks/useUsersQuery'
import { useToast } from '../../components/ToastProvider'

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

function UserRoleDropdown({ user: targetUser, changeUserRole }: { user: User; changeUserRole: (userId: string, role: 'user' | 'admin') => Promise<any> }) {
  const { user: currentUser } = useBetterAuth()
  const { showError } = useToast()
  const [isChanging, setIsChanging] = useState(false)

  const handleRoleChange = async (newRole: 'user' | 'admin') => {
    if (targetUser.id === currentUser?.id) {
      showError('Permission Denied', 'You cannot change your own role!')
      return
    }

    setIsChanging(true)
    try {
      await changeUserRole(targetUser.id, newRole)
      // Success message is handled by the mutation
    } catch (error) {
      // Error message is handled by the mutation
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isChanging}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleRoleChange('user')}
          disabled={targetUser.role === 'user' || targetUser.id === currentUser?.id}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Make User
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleRoleChange('admin')}
          disabled={targetUser.role === 'admin' || targetUser.id === currentUser?.id}
        >
          <Shield className="mr-2 h-4 w-4" />
          Make Admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RouteComponent() {
  const { user: currentUser } = useBetterAuth()
  
  // Use TanStack Query for data fetching
  const { data: usersData, isLoading: loading, error, refetch } = useUsersQuery({ limit: 100 }) // Get more users for dashboard
  const { changeUserRole } = useUserMutations()
  
  const users = usersData?.users || []

  // Debug logging
  console.log('Admin Dashboard - Current User:', currentUser)
  console.log('Admin Dashboard - User Role:', currentUser?.role)
  console.log('Admin Dashboard - User Object Keys:', currentUser ? Object.keys(currentUser) : 'null')
  
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    return changeUserRole.mutateAsync({ userId, role: newRole })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">
              {error.message || 'Failed to fetch users'}
            </p>
            <Button onClick={() => refetch()} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
    )
  }

  const adminUsers = users.filter(user => user.role === 'admin')
  const regularUsers = users.filter(user => user.role === 'user')

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and their roles. You are logged in as {currentUser?.name} ({currentUser?.email})
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                users.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                adminUsers.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                regularUsers.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Standard user accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions. Click the menu next to each user to change their role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                    >
                      {user.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRoleDropdown user={user} changeUserRole={handleRoleChange} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/admin/dashboard')({
  component: () => (
    <ProtectedRoute requireAdmin={true} fallbackRoute="/profile">
      <RouteComponent />
    </ProtectedRoute>
  ),
})
