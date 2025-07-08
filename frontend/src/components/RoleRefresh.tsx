import { useBetterAuth } from '../better-auth'
import { Button } from './ui/button'

export function RoleRefresh() {
  const { user, refreshUser } = useBetterAuth()

  const refreshRole = async () => {
    if (!user) return
    await refreshUser() // Just refresh the session
  }

  if (!user) return null

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <h3 className="font-semibold text-yellow-800 mb-2">Role Status Check</h3>
      <p className="text-sm text-yellow-700 mb-3">
        Current session role: <strong>{user.role}</strong>
      </p>
      <Button 
        onClick={refreshRole}
        variant="outline"
        size="sm"
      >
        Refresh Session
      </Button>
      <div className="mt-2 text-sm">
        <p><strong>✅ Role loaded from session:</strong> {user.role}</p>
        <p className="text-green-600">No additional API calls needed!</p>
      </div>
    </div>
  )
}
