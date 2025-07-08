import { useBetterAuth } from '../better-auth'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function DebugAuth() {
  const { user, loading, refreshUser } = useBetterAuth()

  if (loading) {
    return <div>Loading auth debug...</div>
  }

  if (!user) {
    return <div>No user logged in</div>
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Authentication Debug (Session Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Session User Object:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Role Information:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>User ID:</strong> {user.id}</li>
            <li><strong>Email:</strong> {user.email}</li>
            <li><strong>Name:</strong> {user.name || 'Not set'}</li>
            <li><strong>Role:</strong> {user.role || 'user'}</li>
            <li><strong>Is Admin:</strong> {user.role === 'admin' ? '✅ Yes' : '❌ No'}</li>
          </ul>
        </div>

        <div className="bg-green-50 p-3 rounded border border-green-200">
          <p className="text-green-800 text-sm">
            ✅ <strong>Using session data only</strong> - No additional API calls needed!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
