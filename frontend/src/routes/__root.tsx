import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { ReactElement } from 'react'

import Header from '../components/Header'

function RootComponent(): ReactElement {
  const location = useLocation()
  const isAdminRoute: boolean = location.pathname.startsWith('/admin')

  return (
    <>
      {/* Only show header for non-admin routes */}
      {!isAdminRoute && <Header />}
      
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
