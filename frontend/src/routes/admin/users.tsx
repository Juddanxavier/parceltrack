import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { UserManagementTable } from '../../components/admin/UserManagementTable'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Users, Shield, RefreshCw } from 'lucide-react'
import { useUsersPage } from '../../hooks/useUsersQuery'
import { useToast } from '../../components/ToastProvider'
import { getUserFriendlyErrorMessage } from '../../lib/apiUtils'
import { betterAuthAdminAPI, type UserFormData } from '../../services/api'
import { ConnectionStatus } from '../../components/ConnectionStatus'
import { BackendImplementationGuide } from '../../components/admin/BackendImplementationGuide'

function UsersPageComponent() {
  const { showSuccess, showError } = useToast()
  
  const {
    users,
    loading,
    error,
    totalUsers,
    adminUsers,
    createUser,
    updateUser,
    deleteUser,
    changeUserRole,
    refetch,
    refreshAll,
    isChangingRole
  } = useUsersPage()

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      await createUser(userData)
      // Success message is handled by the mutation
    } catch (error: any) {
      showError('Error', getUserFriendlyErrorMessage(error))
      throw error // Re-throw to let the form handle it
    }
  }

  const handleEditUser = async (userId: string, userData: UserFormData) => {
    try {
      await updateUser(userId, userData)
      // Success message is handled by the mutation
    } catch (error: any) {
      showError('Error', getUserFriendlyErrorMessage(error))
      throw error // Re-throw to let the form handle it
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      // Success message is handled by the mutation
    } catch (error: any) {
      showError('Error', getUserFriendlyErrorMessage(error))
    }
  }

  const handleChangeUserRole = async (userId: string, role: 'user' | 'admin') => {
    try {
      await changeUserRole(userId, role)
      // Success message is handled by the mutation
    } catch (error: any) {
      showError('Error', getUserFriendlyErrorMessage(error))
    }
  }



  // Show error state if there's an error loading users
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-600 text-lg font-semibold mb-2">Cannot Load Users</div>
          <div className="text-muted-foreground mb-4">{error}</div>
          {error.includes('Backend server') && (
            <div className="text-sm text-blue-600">
              Start your backend server and refresh this page.
            </div>
          )}
          {!error.includes('Backend server') && (
            <div className="mt-4">
              <BackendImplementationGuide />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ConnectionStatus 
        isConnected={!error}
        isLoading={loading}
        error={error}
        onRetry={refetch}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <BackendImplementationGuide />
          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-8 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : (
                  totalUsers
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
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-8 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : (
                  adminUsers
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with admin privileges
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UserManagementTable
              users={users}
              loading={loading}
              onCreateUser={handleCreateUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onChangeUserRole={handleChangeUserRole}
            />
          </CardContent>
        </Card>
      </div>
    )
}

export const Route = createFileRoute('/admin/users')({
  component: () => (
    <ProtectedRoute requireAdmin={true} fallbackRoute="/profile">
      <UsersPageComponent />
    </ProtectedRoute>
  ),
})
