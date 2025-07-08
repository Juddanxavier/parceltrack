import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { UserFormModal } from './UserFormModal'
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Plus,
  Download,
  Trash2,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ban,
} from 'lucide-react'

import type { User, UserFormData } from '../../services/api'

interface UserManagementTableProps {
  users: User[]
  loading?: boolean
  onCreateUser?: (userData: UserFormData) => Promise<void>
  onEditUser?: (userId: string, userData: UserFormData) => Promise<void>
  onDeleteUser?: (userId: string) => void
  onChangeUserRole?: (userId: string, role: 'user' | 'admin') => void
}

type SortField = 'name' | 'role' | 'createdAt' | 'lastLoginAt'
type SortDirection = 'asc' | 'desc' | null

interface Sorting {
  field: SortField | null
  direction: SortDirection
}

interface Filters {
  role: string
}

export function UserManagementTable({
  users,
  loading = false,
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onChangeUserRole,
}: UserManagementTableProps) {
  const [sorting, setSorting] = useState<Sorting>({ field: null, direction: null })
  const [filters, setFilters] = useState<Filters>({ role: 'all' })
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  
  // Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [userToEdit, setUserToEdit] = useState<User | null>(null)

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Global filter
      const matchesGlobal = !globalFilter || 
        user.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        user.email?.toLowerCase().includes(globalFilter.toLowerCase())
      
      // Role filter
      const matchesRole = filters.role === 'all' || user.role === filters.role
      
      return matchesGlobal && matchesRole
    })

    // Sort
    if (sorting.field && sorting.direction) {
      filtered.sort((a, b) => {
        let aValue: any = a[sorting.field!]
        let bValue: any = b[sorting.field!]
        
        // Handle date fields
        if (sorting.field === 'createdAt' || sorting.field === 'lastLoginAt') {
          aValue = new Date(aValue || 0).getTime()
          bValue = new Date(bValue || 0).getTime()
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        } else {
          // Handle null/undefined values
          aValue = aValue || ''
          bValue = bValue || ''
        }
        
        let result = 0
        if (aValue < bValue) result = -1
        if (aValue > bValue) result = 1
        
        return sorting.direction === 'desc' ? -result : result
      })
    }
    
    return filtered
  }, [users, globalFilter, filters, sorting])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / pageSize))
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex)
  
  // Reset page if current page is out of bounds
  if (currentPage >= totalPages && totalPages > 1) {
    setCurrentPage(totalPages - 1)
  }

  // Sorting handler
  const handleSort = (field: SortField) => {
    setSorting(prev => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> null
        const newDirection = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc'
        return { field: newDirection ? field : null, direction: newDirection }
      } else {
        return { field, direction: 'asc' }
      }
    })
  }

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sorting.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sorting.direction === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handleViewUser = (user: User) => {
    // You could open a view dialog here
    console.log('View user:', user)
  }

  const handleCreateUser = () => {
    setModalMode('add')
    setUserToEdit(null)
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setModalMode('edit')
    setUserToEdit(user)
    setIsUserModalOpen(true)
  }

  const handleModalSubmit = async (userData: UserFormData) => {
    if (modalMode === 'add') {
      await onCreateUser?.(userData)
    } else if (modalMode === 'edit' && userToEdit) {
      await onEditUser?.(userToEdit.id, userData)
    }
  }

  const handleModalClose = () => {
    setIsUserModalOpen(false)
    setUserToEdit(null)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = () => {
    if (userToDelete) {
      onDeleteUser?.(userToDelete.id)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <div className="flex space-x-2">
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateUser} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-semibold"
                >
                  Name
                  {renderSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('createdAt')}
                  className="h-auto p-0 font-semibold"
                >
                  Created
                  {renderSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('lastLoginAt')}
                  className="h-auto p-0 font-semibold"
                >
                  Last Login
                  {renderSortIcon('lastLoginAt')}
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(user.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{user.email || 'No email'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit user
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onChangeUserRole?.(user.id, user.role === 'admin' ? 'user' : 'admin')}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredAndSortedUsers.length)}{' '}
          of {filteredAndSortedUsers.length} users
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">Rows per page:</Label>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setCurrentPage(0)
              }}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              Page {currentPage + 1} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        user={userToEdit}
        mode={modalMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{userToDelete?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
