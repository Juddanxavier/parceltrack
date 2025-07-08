import { useState, type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  Search,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Package
} from 'lucide-react'
import { NotificationCenter } from '../NotificationCenter'
import { useBetterAuth } from '../../better-auth'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'


const menuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Leads', path: '/admin/leads', icon: Package },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
  { name: 'Activity', path: '/admin/activity', icon: Activity },
]

function Sidebar({ 
  isOpen, 
  onToggle, 
  isCollapsed, 
  onToggleCollapse 
}: { 
  isOpen: boolean; 
  onToggle: () => void; 
  isCollapsed: boolean; 
  onToggleCollapse: () => void; 
}) {
  const location = useLocation()
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" 
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:sticky inset-y-0 lg:top-0 left-0 z-30 bg-slate-900 text-white shadow-xl transform transition-all duration-300 ease-in-out lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 bg-slate-800 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-6'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-white">Larkon</span>
            )}
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Desktop collapse toggle */}
          {!isCollapsed && (
            <button 
              onClick={onToggleCollapse}
              className="hidden lg:block p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`mt-6 ${isCollapsed ? 'px-1' : 'px-3'}`}>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center text-sm font-medium rounded-lg transition-colors group relative
                    ${
                      isCollapsed 
                        ? 'justify-center px-3 py-3' 
                        : 'px-3 py-2.5'
                    }
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${
                    isCollapsed ? '' : 'mr-3'
                  }`} />
                  {!isCollapsed && item.name}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                      {item.name}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
        
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="absolute bottom-20 left-0 right-0 px-1">
            <button 
              onClick={onToggleCollapse}
              className="w-full flex justify-center p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Bottom user info */}
        <div className={`absolute bottom-0 left-0 right-0 bg-slate-800 ${
          isCollapsed ? 'p-2' : 'p-4'
        }`}>
          <div className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          }`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-slate-400 truncate">Administrator</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useBetterAuth()
  const location = useLocation()
  
  // Get page title from current route
  const getPageTitle = (pathname: string) => {
    const item = menuItems.find(item => item.path === pathname)
    return item?.name || 'Dashboard'
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {getPageTitle(location.pathname)}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 hover:bg-slate-100"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
