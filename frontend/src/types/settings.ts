export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  currency: string
  compactMode: boolean
  soundEffects: boolean
}

export interface NotificationSettings {
  // Email notifications
  emailNotifications: {
    enabled: boolean
    newUserRegistration: boolean
    userRoleChanges: boolean
    securityAlerts: boolean
    systemUpdates: boolean
    weeklyReports: boolean
    marketingEmails: boolean
  }
  
  // Push notifications (browser)
  pushNotifications: {
    enabled: boolean
    newUserRegistration: boolean
    securityAlerts: boolean
    systemErrors: boolean
    maintenance: boolean
  }
  
  // In-app notifications
  inAppNotifications: {
    enabled: boolean
    showToasts: boolean
    soundEnabled: boolean
    desktop: boolean
    duration: number // in seconds
  }
  
  // Notification frequency
  frequency: {
    immediate: boolean
    daily: boolean
    weekly: boolean
    monthly: boolean
  }
}

export interface SecuritySettings {
  // Authentication
  twoFactorAuth: {
    enabled: boolean
    method: 'app' | 'sms' | 'email'
    backupCodes: boolean
  }
  
  // Session management
  session: {
    timeout: number // in minutes
    rememberMe: boolean
    maxConcurrentSessions: number
    logoutInactive: boolean
  }
  
  // Password policy
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    passwordExpiry: number // days
    preventReuse: number // number of previous passwords
  }
  
  // Access control
  accessControl: {
    allowedIPs: string[]
    blockSuspiciousActivity: boolean
    enableAuditLog: boolean
    requireEmailVerification: boolean
  }
}

export interface SystemSettings {
  // Application
  application: {
    appName: string
    appDescription: string
    appLogo: string
    maintenanceMode: boolean
    allowRegistration: boolean
    defaultUserRole: 'user' | 'admin'
    sessionTimeout: number
  }
  
  // Database
  database: {
    connectionStatus: 'connected' | 'disconnected' | 'error'
    lastBackup: string
    autoBackup: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
    retentionPeriod: number // days
  }
  
  // Email configuration
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses'
    host: string
    port: number
    username: string
    encryption: 'none' | 'tls' | 'ssl'
    fromName: string
    fromEmail: string
    replyTo: string
    dailyLimit: number
    enabled: boolean
  }
  
  // File storage
  storage: {
    provider: 'local' | 's3' | 'cloudinary' | 'gcs'
    maxFileSize: number // MB
    allowedFileTypes: string[]
    compressionEnabled: boolean
    cdnEnabled: boolean
    cdnUrl: string
  }
  
  // API settings
  api: {
    rateLimit: number // requests per minute
    rateLimitWindow: number // minutes
    enableCors: boolean
    allowedOrigins: string[]
    enableApiKeys: boolean
    enableWebhooks: boolean
  }
  
  // Analytics and monitoring
  analytics: {
    enabled: boolean
    googleAnalytics: string
    enableErrorTracking: boolean
    sentryDsn: string
    enablePerformanceMonitoring: boolean
  }
}

export interface IntegrationSettings {
  // Third-party services
  oauth: {
    google: {
      enabled: boolean
      clientId: string
      clientSecret: string
    }
    github: {
      enabled: boolean
      clientId: string
      clientSecret: string
    }
    microsoft: {
      enabled: boolean
      clientId: string
      clientSecret: string
    }
  }
  
  // Webhooks
  webhooks: {
    enabled: boolean
    endpoints: Array<{
      id: string
      name: string
      url: string
      events: string[]
      enabled: boolean
      secret: string
    }>
  }
  
  // External APIs
  externalApis: {
    paymentGateway: {
      provider: 'stripe' | 'paypal' | 'square'
      publicKey: string
      secretKey: string
      webhookSecret: string
      enabled: boolean
    }
    smsProvider: {
      provider: 'twilio' | 'nexmo' | 'aws-sns'
      accountSid: string
      authToken: string
      fromNumber: string
      enabled: boolean
    }
  }
}

// Combined settings interface
export interface AppSettings {
  userPreferences: UserPreferences
  notifications: NotificationSettings
  security: SecuritySettings
  system: SystemSettings
  integrations: IntegrationSettings
  lastUpdated: string
  version: string
}

// Settings form interfaces for UI
export interface SettingsFormData {
  section: keyof AppSettings
  data: Partial<AppSettings[keyof AppSettings]>
}

// Settings validation
export interface SettingsValidation {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}
