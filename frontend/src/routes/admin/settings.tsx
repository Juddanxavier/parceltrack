import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { 
  Settings, 
  Database, 
  Shield, 
  Mail, 
  Bell, 
  User, 
  Monitor, 
  Zap, 
  Palette, 
  Globe, 
  Webhook, 
  CreditCard, 
  Smartphone,
  HardDrive,
  Activity,
  Clock,
  Key,
  Users,
  Lock,
  Wifi,
  Download,
  Upload,
  TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { useToast } from '../../components/ToastProvider'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

function SettingsSection({ title, description, children, icon }: SettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface StatusItemProps {
  label: string
  value: string
  status?: 'success' | 'warning' | 'error' | 'info'
  action?: () => void
  actionLabel?: string
}

function StatusItem({ label, value, status = 'info', action, actionLabel }: StatusItemProps) {
  const statusColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-gray-600'
  }

  const statusIcons = {
    success: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    info: <Activity className="h-4 w-4" />
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`flex items-center space-x-1 text-sm font-medium ${statusColors[status]}`}>
          {statusIcons[status]}
          <span>{value}</span>
        </div>
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action}>
          {actionLabel || 'Configure'}
        </Button>
      )}
    </div>
  )
}

function SettingsPageComponent() {
  const { showSuccess, showError, showInfo } = useToast()
  const [activeTab, setActiveTab] = useState('general')

  const handleTestConnection = (type: string) => {
    showInfo('Testing Connection', `Testing ${type} connection...`)
    // Simulate API call
    setTimeout(() => {
      showSuccess('Connection Test', `${type} connection successful!`)
    }, 2000)
  }

  const handleBackup = () => {
    showInfo('Backup Started', 'Database backup is being generated...')
    setTimeout(() => {
      showSuccess('Backup Complete', 'Database backup completed successfully!')
    }, 3000)
  }

  const handleExport = () => {
    showInfo('Export Started', 'Exporting settings...')
    setTimeout(() => {
      showSuccess('Export Complete', 'Settings exported successfully!')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and configurations
          </p>
        </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="user-prefs">User Prefs</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SettingsSection 
                title="Application Settings" 
                icon={<Settings className="h-5 w-5" />}
                description="Basic application configuration"
              >
                <div className="space-y-4">
                  <StatusItem label="App Name" value="Admin Dashboard" />
                  <StatusItem label="Version" value="1.0.0" />
                  <StatusItem label="Environment" value="Development" status="warning" />
                  <StatusItem 
                    label="Maintenance Mode" 
                    value="Disabled" 
                    status="success"
                    action={() => showInfo('Maintenance', 'Maintenance mode toggled')}
                    actionLabel="Toggle"
                  />
                  <StatusItem label="Registration" value="Open" status="success" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="System Status" 
                icon={<Monitor className="h-5 w-5" />}
                description="Current system health and performance"
              >
                <div className="space-y-4">
                  <StatusItem label="System Status" value="Healthy" status="success" />
                  <StatusItem label="Uptime" value="15 days, 4 hours" status="success" />
                  <StatusItem label="Memory Usage" value="64% (2.1GB / 4GB)" status="warning" />
                  <StatusItem label="CPU Usage" value="23%" status="success" />
                  <StatusItem 
                    label="Disk Space" 
                    value="78% (156GB / 200GB)" 
                    status="warning"
                    action={() => showInfo('Disk Space', 'Checking disk usage...')}
                    actionLabel="Details"
                  />
                </div>
              </SettingsSection>
            </div>
          </TabsContent>

          {/* User Preferences */}
          <TabsContent value="user-prefs" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SettingsSection 
                title="Appearance" 
                icon={<Palette className="h-5 w-5" />}
                description="Customize the look and feel"
              >
                <div className="space-y-4">
                  <StatusItem label="Theme" value="System" />
                  <StatusItem label="Language" value="English (US)" />
                  <StatusItem label="Timezone" value="UTC-5 (EST)" />
                  <StatusItem label="Date Format" value="MM/DD/YYYY" />
                  <StatusItem label="Time Format" value="12-hour" />
                  <StatusItem label="Compact Mode" value="Disabled" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Localization" 
                icon={<Globe className="h-5 w-5" />}
                description="Regional and language settings"
              >
                <div className="space-y-4">
                  <StatusItem label="Currency" value="USD ($)" />
                  <StatusItem label="Number Format" value="1,234.56" />
                  <StatusItem label="First Day of Week" value="Sunday" />
                  <StatusItem label="Calendar Type" value="Gregorian" />
                  <StatusItem label="Sound Effects" value="Enabled" status="success" />
                </div>
              </SettingsSection>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SettingsSection 
                title="Email Notifications" 
                icon={<Mail className="h-5 w-5" />}
                description="Configure email notification preferences"
              >
                <div className="space-y-4">
                  <StatusItem label="Email Notifications" value="Enabled" status="success" />
                  <StatusItem label="New User Registration" value="Enabled" status="success" />
                  <StatusItem label="User Role Changes" value="Enabled" status="success" />
                  <StatusItem label="Security Alerts" value="Enabled" status="success" />
                  <StatusItem label="System Updates" value="Enabled" status="success" />
                  <StatusItem label="Weekly Reports" value="Disabled" />
                  <StatusItem label="Marketing Emails" value="Disabled" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Push & In-App" 
                icon={<Bell className="h-5 w-5" />}
                description="Browser and in-app notifications"
              >
                <div className="space-y-4">
                  <StatusItem label="Push Notifications" value="Enabled" status="success" />
                  <StatusItem label="Desktop Notifications" value="Enabled" status="success" />
                  <StatusItem label="Sound Alerts" value="Enabled" status="success" />
                  <StatusItem label="Toast Duration" value="5 seconds" />
                  <StatusItem label="Auto Mark Read" value="Enabled" status="success" />
                  <StatusItem label="Group Similar" value="Enabled" status="success" />
                  <StatusItem 
                    label="Test Notification" 
                    value="Send Test"
                    action={() => showSuccess('Test', 'This is a test notification!')}
                    actionLabel="Send"
                  />
                </div>
              </SettingsSection>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SettingsSection 
                title="Authentication" 
                icon={<Shield className="h-5 w-5" />}
                description="User authentication and security"
              >
                <div className="space-y-4">
                  <StatusItem label="Two-Factor Auth" value="Disabled" status="warning" />
                  <StatusItem label="Session Timeout" value="30 minutes" />
                  <StatusItem label="Max Concurrent Sessions" value="3" />
                  <StatusItem label="Remember Me" value="Enabled" status="success" />
                  <StatusItem label="Auto Logout Inactive" value="Enabled" status="success" />
                  <StatusItem label="Email Verification" value="Required" status="success" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Password Policy" 
                icon={<Key className="h-5 w-5" />}
                description="Password requirements and policies"
              >
                <div className="space-y-4">
                  <StatusItem label="Minimum Length" value="8 characters" />
                  <StatusItem label="Require Uppercase" value="Yes" status="success" />
                  <StatusItem label="Require Lowercase" value="Yes" status="success" />
                  <StatusItem label="Require Numbers" value="Yes" status="success" />
                  <StatusItem label="Require Special Chars" value="No" />
                  <StatusItem label="Password Expiry" value="90 days" />
                  <StatusItem label="Prevent Reuse" value="Last 5 passwords" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Access Control" 
                icon={<Lock className="h-5 w-5" />}
                description="IP restrictions and access controls"
              >
                <div className="space-y-4">
                  <StatusItem label="IP Restrictions" value="None" />
                  <StatusItem label="Block Suspicious Activity" value="Enabled" status="success" />
                  <StatusItem label="Audit Logging" value="Enabled" status="success" />
                  <StatusItem label="Failed Login Attempts" value="5 max" />
                  <StatusItem label="Account Lockout Duration" value="15 minutes" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="API Security" 
                icon={<Zap className="h-5 w-5" />}
                description="API access and rate limiting"
              >
                <div className="space-y-4">
                  <StatusItem label="Rate Limiting" value="100 req/min" />
                  <StatusItem label="API Keys" value="Disabled" />
                  <StatusItem label="CORS" value="Enabled" status="success" />
                  <StatusItem label="Allowed Origins" value="2 configured" />
                  <StatusItem label="Webhooks" value="Disabled" />
                </div>
              </SettingsSection>
            </div>
          </TabsContent>

          {/* System */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SettingsSection 
                title="Database" 
                icon={<Database className="h-5 w-5" />}
                description="Database connection and backup settings"
              >
                <div className="space-y-4">
                  <StatusItem label="Connection Status" value="Connected" status="success" />
                  <StatusItem label="Database Type" value="PostgreSQL" />
                  <StatusItem label="Last Backup" value="2 hours ago" status="success" />
                  <StatusItem label="Auto Backup" value="Daily" status="success" />
                  <StatusItem label="Retention Period" value="30 days" />
                  <StatusItem 
                    label="Test Connection" 
                    value="Test Now"
                    action={() => handleTestConnection('Database')}
                    actionLabel="Test"
                  />
                  <StatusItem 
                    label="Manual Backup" 
                    value="Create Backup"
                    action={handleBackup}
                    actionLabel="Backup"
                  />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Email Configuration" 
                icon={<Mail className="h-5 w-5" />}
                description="SMTP and email delivery settings"
              >
                <div className="space-y-4">
                  <StatusItem label="Email Service" value="SMTP" />
                  <StatusItem label="Provider" value="Custom SMTP" />
                  <StatusItem label="Encryption" value="TLS" status="success" />
                  <StatusItem label="Daily Limit" value="1,000 emails" />
                  <StatusItem label="Status" value="Not Configured" status="warning" />
                  <StatusItem 
                    label="Test Email" 
                    value="Send Test"
                    action={() => handleTestConnection('Email')}
                    actionLabel="Test"
                  />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="File Storage" 
                icon={<HardDrive className="h-5 w-5" />}
                description="File upload and storage configuration"
              >
                <div className="space-y-4">
                  <StatusItem label="Storage Provider" value="Local" />
                  <StatusItem label="Max File Size" value="10 MB" />
                  <StatusItem label="Allowed Types" value="7 types" />
                  <StatusItem label="Compression" value="Enabled" status="success" />
                  <StatusItem label="CDN" value="Disabled" />
                  <StatusItem label="Storage Used" value="2.3 GB / 100 GB" status="success" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Analytics & Monitoring" 
                icon={<Activity className="h-5 w-5" />}
                description="Analytics and error tracking"
              >
                <div className="space-y-4">
                  <StatusItem label="Analytics" value="Disabled" />
                  <StatusItem label="Google Analytics" value="Not Configured" />
                  <StatusItem label="Error Tracking" value="Disabled" />
                  <StatusItem label="Performance Monitoring" value="Disabled" />
                  <StatusItem label="Uptime Monitoring" value="Internal" status="success" />
                </div>
              </SettingsSection>
            </div>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SettingsSection 
                title="OAuth Providers" 
                icon={<Users className="h-5 w-5" />}
                description="Third-party authentication providers"
              >
                <div className="space-y-4">
                  <StatusItem label="Google OAuth" value="Disabled" />
                  <StatusItem label="GitHub OAuth" value="Disabled" />
                  <StatusItem label="Microsoft OAuth" value="Disabled" />
                  <StatusItem label="Apple Sign In" value="Disabled" />
                  <StatusItem label="Discord OAuth" value="Disabled" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Webhooks" 
                icon={<Webhook className="h-5 w-5" />}
                description="Webhook endpoints and events"
              >
                <div className="space-y-4">
                  <StatusItem label="Webhooks" value="Disabled" />
                  <StatusItem label="Configured Endpoints" value="0" />
                  <StatusItem label="Webhook Events" value="Not Configured" />
                  <StatusItem label="Retry Policy" value="3 attempts" />
                  <StatusItem label="Timeout" value="30 seconds" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="Payment Gateway" 
                icon={<CreditCard className="h-5 w-5" />}
                description="Payment processing configuration"
              >
                <div className="space-y-4">
                  <StatusItem label="Payment Provider" value="Not Configured" status="warning" />
                  <StatusItem label="Stripe" value="Disabled" />
                  <StatusItem label="PayPal" value="Disabled" />
                  <StatusItem label="Square" value="Disabled" />
                  <StatusItem label="Test Mode" value="Enabled" status="warning" />
                </div>
              </SettingsSection>

              <SettingsSection 
                title="SMS Provider" 
                icon={<Smartphone className="h-5 w-5" />}
                description="SMS and messaging configuration"
              >
                <div className="space-y-4">
                  <StatusItem label="SMS Provider" value="Not Configured" status="warning" />
                  <StatusItem label="Twilio" value="Disabled" />
                  <StatusItem label="AWS SNS" value="Disabled" />
                  <StatusItem label="Nexmo" value="Disabled" />
                  <StatusItem label="Monthly Limit" value="1,000 SMS" />
                </div>
              </SettingsSection>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
}

export const Route = createFileRoute('/admin/settings')({
  component: () => (
    <ProtectedRoute requireAdmin={true} fallbackRoute="/profile">
      <SettingsPageComponent />
    </ProtectedRoute>
  ),
})
