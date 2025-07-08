import { useBetterAuth } from '../better-auth'
import { Button } from './ui/button'

export function ForceReauth() {
  const { user, logout } = useBetterAuth()

  const handleForceLogout = async () => {
    try {
      await logout()
      alert('Logged out! Please sign in again to get fresh session data.')
      // Optionally redirect to sign in page
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Logout error:', error)
      alert('Logout failed. Please try refreshing the page.')
    }
  }

  if (!user) return null

  return (
    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
      <h3 className="font-semibold text-red-800 mb-2">Session Refresh Required</h3>
      <p className="text-sm text-red-700 mb-3">
        Your role was updated in the database but your session has stale data.
        You need to log out and log back in to see the changes.
      </p>
      <Button 
        onClick={handleForceLogout}
        variant="destructive"
        size="sm"
      >
        Force Logout & Refresh Session
      </Button>
    </div>
  )
}
