import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Code, ExternalLink, Info } from 'lucide-react'

interface EndpointInfo {
  method: string
  path: string
  description: string
  status: 'missing' | 'partial' | 'available'
}

const endpoints: EndpointInfo[] = [
  {
    method: 'GET',
    path: '/api/admin/list-users',
    description: 'List all users (Better Auth admin plugin)',
    status: 'missing'
  },
  {
    method: 'POST',
    path: '/api/admin/create-user',
    description: 'Create new user (Better Auth admin plugin)',
    status: 'missing'
  },
  {
    method: 'POST',
    path: '/api/admin/set-role',
    description: 'Change user role (Better Auth admin plugin)',
    status: 'missing'
  },
  {
    method: 'POST',
    path: '/api/admin/remove-user',
    description: 'Delete user (Better Auth admin plugin)',
    status: 'missing'
  },
  {
    method: 'GET',
    path: '/api/admin/users',
    description: 'List users with pagination (Legacy fallback)',
    status: 'missing'
  },
  {
    method: 'POST',
    path: '/api/admin/users',
    description: 'Create new user (Legacy fallback)',
    status: 'missing'
  },
  {
    method: 'PUT',
    path: '/api/admin/users/{id}',
    description: 'Update user details (Legacy fallback)',
    status: 'missing'
  },
  {
    method: 'DELETE',
    path: '/api/admin/users/{id}',
    description: 'Delete user (Legacy fallback)',
    status: 'missing'
  },
  {
    method: 'GET',
    path: '/api/admin/users/stats',
    description: 'Get user statistics (Optional)',
    status: 'missing'
  }
]

function StatusBadge({ status }: { status: EndpointInfo['status'] }) {
  const variants = {
    missing: { variant: 'destructive' as const, text: 'Missing' },
    partial: { variant: 'secondary' as const, text: 'Partial' },
    available: { variant: 'default' as const, text: 'Available' }
  }
  
  const { variant, text } = variants[status]
  
  return <Badge variant={variant}>{text}</Badge>
}

export function BackendImplementationGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Info className="h-4 w-4" />
          <span>Backend Setup Guide</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Backend Implementation Guide</span>
          </DialogTitle>
          <DialogDescription>
            Your frontend is ready, but some backend endpoints need to be implemented for full functionality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Implementation Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Implementation Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Option 1: Better Auth Admin Plugin (Recommended)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Install and configure the Better Auth admin plugin for automatic endpoint generation.
                </p>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  npm install @better-auth/admin-plugin
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Option 2: Custom Endpoints</h4>
                <p className="text-sm text-muted-foreground">
                  Implement the legacy API endpoints manually in your backend framework.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    </div>
                    <StatusBadge status={endpoint.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentation Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Better Auth Documentation</h4>
                  <p className="text-sm text-muted-foreground">Official guide for admin plugin setup</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://better-auth.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">API Documentation</h4>
                  <p className="text-sm text-muted-foreground">Expected request/response formats</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  // Could open a modal with API docs or link to docs
                  console.log('Open API documentation')
                }}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
