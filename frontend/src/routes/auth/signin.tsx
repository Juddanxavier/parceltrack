import { createFileRoute } from '@tanstack/react-router'
import { useAuthRedirect, usePostLoginRedirect } from '../../hooks/useAuthRedirect'
import { useBetterAuth } from '../../better-auth'
import SignInForm from '../../better-auth/SignInForm'

function SignInWithRedirect() {
  const { user } = useBetterAuth()
  const postLoginRedirect = usePostLoginRedirect()
  const { isRedirecting, shouldRender } = useAuthRedirect()

  const handleSignInSuccess = (user: any) => {
    // Use the post-login redirect hook to handle role-based redirection
    postLoginRedirect(user)
  }

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if user is already authenticated (will be redirected)
  if (!shouldRender || user) {
    return null
  }

  return (
    <SignInForm onSuccess={handleSignInSuccess} />
  )
}

export const Route = createFileRoute('/auth/signin')({
  component: SignInWithRedirect,
})
