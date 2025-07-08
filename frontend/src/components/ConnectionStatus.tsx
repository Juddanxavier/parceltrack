import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from './ui/alert'
import { Wifi, WifiOff, RotateCcw } from 'lucide-react'
import { cn } from '../lib/utils'

interface ConnectionStatusProps {
  isConnected: boolean
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
}

export function ConnectionStatus({ isConnected, isLoading, error, onRetry }: ConnectionStatusProps) {
  const [showStatus, setShowStatus] = useState(false)

  // Show status indicator when there's an error or when loading after an error
  useEffect(() => {
    if (error || (!isConnected && isLoading)) {
      setShowStatus(true)
    } else if (isConnected && !isLoading) {
      // Hide status after successful connection (with delay)
      const timer = setTimeout(() => setShowStatus(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, isLoading, error])

  if (!showStatus) return null

  return (
    <Alert className={cn(
      "mb-4 transition-all duration-300",
      isConnected ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
    )}>
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <RotateCcw className="h-4 w-4 animate-spin text-blue-600" />
        ) : isConnected ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        
        <AlertDescription className="flex-1">
          {isLoading && error ? (
            "Attempting to reconnect to server..."
          ) : isConnected ? (
            "Connected to server"
          ) : error?.toLowerCase?.().includes('backend server') ? (
            <div className="flex items-center justify-between">
              <span>Backend server is not running</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Retry now
                </button>
              )}
            </div>
          ) : (
            "Connection error"
          )}
        </AlertDescription>
      </div>
    </Alert>
  )
}
