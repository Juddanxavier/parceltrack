import { createContext, useContext } from 'react'
import { toast } from 'sonner'
import { Toaster } from './ui/sonner'
import type { ReactNode } from 'react'

interface ToastOptions {
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'default'
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void
  showSuccess: (message: string, description?: string) => void
  showError: (message: string, description?: string) => void
  showWarning: (message: string, description?: string) => void
  showInfo: (message: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (options: ToastOptions) => {
    const { title, description, type = 'default', action, duration } = options

    const toastOptions = {
      description,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    }

    switch (type) {
      case 'success':
        toast.success(title || 'Success', toastOptions)
        break
      case 'error':
        toast.error(title || 'Error', toastOptions)
        break
      case 'warning':
        toast.warning(title || 'Warning', toastOptions)
        break
      case 'info':
        toast.info(title || 'Info', toastOptions)
        break
      default:
        toast(title || 'Notification', toastOptions)
        break
    }
  }

  const showSuccess = (message: string, description?: string) => {
    showToast({ title: message, description, type: 'success' })
  }

  const showError = (message: string, description?: string) => {
    showToast({ title: message, description, type: 'error' })
  }

  const showWarning = (message: string, description?: string) => {
    showToast({ title: message, description, type: 'warning' })
  }

  const showInfo = (message: string, description?: string) => {
    showToast({ title: message, description, type: 'info' })
  }

  return (
    <ToastContext.Provider 
      value={{ 
        showToast, 
        showSuccess, 
        showError, 
        showWarning, 
        showInfo 
      }}
    >
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
