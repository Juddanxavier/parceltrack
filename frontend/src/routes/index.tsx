import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'
import { DebugAuth } from '../components/DebugAuth'
import { RoleRefresh } from '../components/RoleRefresh'
import { ForceReauth } from '../components/ForceReauth'
import { useBetterAuth } from '../better-auth'
import { useAuthRedirect } from '../hooks/useAuthRedirect'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { user, loading } = useBetterAuth()
  const { isRedirecting } = useAuthRedirect()
  
  // Show loading while checking user status or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{isRedirecting ? 'Redirecting...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {user && (
        <div className="space-y-4">
          <ForceReauth />
          <RoleRefresh />
          <DebugAuth />
        </div>
      )}
      <div className="text-center">
        <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
          <img
            src={logo}
            className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
            alt="logo"
          />
          <p>
            Edit <code>src/routes/index.tsx</code> and save to reload.
          </p>
          <a
            className="text-[#61dafb] hover:underline"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <a
            className="text-[#61dafb] hover:underline"
            href="https://tanstack.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn TanStack
          </a>
        </header>
      </div>
    </div>
  )
}
