import api from './api'
import { AppSettings, SettingsFormData, SettingsValidation } from '../types/settings'

export const settingsAPI = {
  // Get all settings
  getSettings: async (): Promise<AppSettings> => {
    const response = await api.get('/api/settings')
    return response.data
  },

  // Get settings by section
  getSettingsBySection: async (section: keyof AppSettings): Promise<AppSettings[keyof AppSettings]> => {
    const response = await api.get(`/api/settings/${section}`)
    return response.data
  },

  // Update settings (partial update)
  updateSettings: async (settingsData: SettingsFormData): Promise<AppSettings> => {
    const response = await api.put('/api/settings', settingsData)
    return response.data
  },

  // Update specific section
  updateSettingsSection: async (
    section: keyof AppSettings, 
    data: Partial<AppSettings[keyof AppSettings]>
  ): Promise<AppSettings[keyof AppSettings]> => {
    const response = await api.put(`/api/settings/${section}`, data)
    return response.data
  },

  // Reset settings to defaults
  resetSettings: async (section?: keyof AppSettings): Promise<AppSettings> => {
    const url = section ? `/api/settings/reset/${section}` : '/api/settings/reset'
    const response = await api.post(url)
    return response.data
  },

  // Validate settings
  validateSettings: async (settingsData: SettingsFormData): Promise<SettingsValidation> => {
    const response = await api.post('/api/settings/validate', settingsData)
    return response.data
  },

  // Export settings
  exportSettings: async (): Promise<Blob> => {
    const response = await api.get('/api/settings/export', {
      responseType: 'blob'
    })
    return response.data
  },

  // Import settings
  importSettings: async (file: File): Promise<AppSettings> => {
    const formData = new FormData()
    formData.append('settings', file)
    const response = await api.post('/api/settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Test email configuration
  testEmailConfig: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/api/settings/test/email')
    return response.data
  },

  // Test database connection
  testDatabaseConnection: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/api/settings/test/database')
    return response.data
  },

  // Test webhook endpoint
  testWebhook: async (webhookId: string): Promise<{ success: boolean; message: string; responseTime: number }> => {
    const response = await api.post(`/api/settings/test/webhook/${webhookId}`)
    return response.data
  },

  // Generate backup
  generateBackup: async (): Promise<{ success: boolean; filename: string; size: number }> => {
    const response = await api.post('/api/settings/backup')
    return response.data
  },

  // Get system status
  getSystemStatus: async (): Promise<{
    database: { status: string; latency: number }
    email: { status: string; lastSent: string }
    storage: { status: string; usage: number; total: number }
    memory: { used: number; total: number; percentage: number }
    cpu: { usage: number }
    uptime: number
  }> => {
    const response = await api.get('/api/settings/system/status')
    return response.data
  },

  // Get audit logs
  getAuditLogs: async (params?: {
    page?: number
    limit?: number
    section?: string
    action?: string
    user?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    logs: Array<{
      id: string
      timestamp: string
      user: string
      action: string
      section: string
      oldValue: any
      newValue: any
      ipAddress: string
      userAgent: string
    }>
    total: number
    page: number
    limit: number
  }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })
    }
    const response = await api.get(`/api/settings/audit?${searchParams.toString()}`)
    return response.data
  }
}

// Default settings for initialization
export const defaultSettings: AppSettings = {
  userPreferences: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    compactMode: false,
    soundEffects: true
  },
  notifications: {
    emailNotifications: {
      enabled: true,
      newUserRegistration: true,
      userRoleChanges: true,
      securityAlerts: true,
      systemUpdates: true,
      weeklyReports: false,
      marketingEmails: false
    },
    pushNotifications: {
      enabled: true,
      newUserRegistration: true,
      securityAlerts: true,
      systemErrors: true,
      maintenance: true
    },
    inAppNotifications: {
      enabled: true,
      showToasts: true,
      soundEnabled: true,
      desktop: true,
      duration: 5
    },
    frequency: {
      immediate: true,
      daily: false,
      weekly: false,
      monthly: false
    }
  },
  security: {
    twoFactorAuth: {
      enabled: false,
      method: 'app',
      backupCodes: false
    },
    session: {
      timeout: 30,
      rememberMe: true,
      maxConcurrentSessions: 3,
      logoutInactive: true
    },
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiry: 90,
      preventReuse: 5
    },
    accessControl: {
      allowedIPs: [],
      blockSuspiciousActivity: true,
      enableAuditLog: true,
      requireEmailVerification: true
    }
  },
  system: {
    application: {
      appName: 'Admin Dashboard',
      appDescription: 'Modern admin dashboard built with React',
      appLogo: '',
      maintenanceMode: false,
      allowRegistration: true,
      defaultUserRole: 'user',
      sessionTimeout: 30
    },
    database: {
      connectionStatus: 'connected',
      lastBackup: '',
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30
    },
    email: {
      provider: 'smtp',
      host: '',
      port: 587,
      username: '',
      encryption: 'tls',
      fromName: 'Admin Dashboard',
      fromEmail: '',
      replyTo: '',
      dailyLimit: 1000,
      enabled: false
    },
    storage: {
      provider: 'local',
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
      compressionEnabled: true,
      cdnEnabled: false,
      cdnUrl: ''
    },
    api: {
      rateLimit: 100,
      rateLimitWindow: 15,
      enableCors: true,
      allowedOrigins: ['http://localhost:5173', 'http://localhost:5174'],
      enableApiKeys: false,
      enableWebhooks: false
    },
    analytics: {
      enabled: false,
      googleAnalytics: '',
      enableErrorTracking: false,
      sentryDsn: '',
      enablePerformanceMonitoring: false
    }
  },
  integrations: {
    oauth: {
      google: {
        enabled: false,
        clientId: '',
        clientSecret: ''
      },
      github: {
        enabled: false,
        clientId: '',
        clientSecret: ''
      },
      microsoft: {
        enabled: false,
        clientId: '',
        clientSecret: ''
      }
    },
    webhooks: {
      enabled: false,
      endpoints: []
    },
    externalApis: {
      paymentGateway: {
        provider: 'stripe',
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
        enabled: false
      },
      smsProvider: {
        provider: 'twilio',
        accountSid: '',
        authToken: '',
        fromNumber: '',
        enabled: false
      }
    }
  },
  lastUpdated: new Date().toISOString(),
  version: '1.0.0'
}
