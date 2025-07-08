import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useToast } from '../ToastProvider'
import { Loader2 } from 'lucide-react'
import type { User, UserFormData } from '../../services/api'

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['user', 'admin'], {
    required_error: 'Please select a role',
  }),
  password: z.string().optional(),
})

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: UserFormData) => Promise<void>
  user?: User | null
  mode: 'add' | 'edit'
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode,
}: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSuccess, showError } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      password: '',
    },
  })

  const watchedRole = watch('role')
  const watchedPassword = watch('password')

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        reset({
          name: user.name,
          email: user.email,
          role: user.role,
          password: '', // Don't prefill password for edit
        })
      } else {
        reset({
          name: '',
          email: '',
          role: 'user',
          password: '',
        })
      }
    }
  }, [isOpen, mode, user, reset])

  const handleFormSubmit = async (data: UserFormData) => {
    if (isSubmitting) return

    // Custom validation for password in create mode
    if (mode === 'add' && (!data.password || data.password.length < 6)) {
      showError('Validation Error', 'Password is required and must be at least 6 characters for new users')
      return
    }

    // For edit mode, if password is empty, remove it from the data
    const submitData = { ...data }
    if (mode === 'edit' && !submitData.password) {
      delete submitData.password
    }

    setIsSubmitting(true)
    try {
      await onSubmit(submitData)
      // Success message is handled by the mutation
      onClose()
    } catch (error: any) {
      // Error message is handled by the mutation, but also show it here for form-specific errors
      console.error('Form submission error:', error)
      
      // Show user-friendly error for backend limitations
      if (error.message?.includes('not supported by backend')) {
        showError('Feature Not Available', error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New User' : 'Edit User'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Create a new user account with the details below.'
              : 'Update the user account details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter full name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => setValue('role', value as 'user' | 'admin')}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === 'add' ? 'Password' : 'New Password (optional)'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={mode === 'add' ? 'Enter password' : 'Leave blank to keep current password'}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>



          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'add' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'add' ? 'Create User' : 'Update User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
