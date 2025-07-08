import { toast } from 'sonner'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'user' | 'system' | 'security' | 'admin' | 'general'
  actions?: Array<{
    label: string
    action: () => void
    style: 'primary' | 'secondary' | 'danger'
  }>
  persistent?: boolean
  autoClose?: boolean
  duration?: number
  sound?: boolean
  metadata?: Record<string, any>
}

export interface NotificationSettings {
  sound: boolean
  desktop: boolean
  email: boolean
  persistence: boolean
  maxNotifications: number
  autoMarkRead: boolean
  groupSimilar: boolean
}

class NotificationService {
  private notifications: Notification[] = []
  private settings: NotificationSettings = {
    sound: true,
    desktop: true,
    email: false,
    persistence: true,
    maxNotifications: 50,
    autoMarkRead: true,
    groupSimilar: true
  }
  private listeners: Array<(notifications: Notification[]) => void> = []
  private unreadCount = 0

  constructor() {
    this.loadFromStorage()
    this.requestNotificationPermission()
  }

  // Core notification methods
  show(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const id = this.generateId()
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? this.getDurationByPriority(notification.priority),
      sound: notification.sound ?? this.settings.sound
    }

    // Add to internal storage
    this.addNotification(newNotification)

    // Show toast notification
    this.showToast(newNotification)

    // Show desktop notification if enabled
    if (this.settings.desktop && this.canShowDesktop()) {
      this.showDesktopNotification(newNotification)
    }

    // Play sound if enabled
    if (newNotification.sound && this.settings.sound) {
      this.playNotificationSound(newNotification.type)
    }

    return id
  }

  // Convenience methods
  success(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'success',
      title,
      message,
      priority: 'medium',
      category: 'general',
      ...options
    })
  }

  error(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'error',
      title,
      message,
      priority: 'high',
      category: 'general',
      persistent: true,
      autoClose: false,
      ...options
    })
  }

  warning(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'warning',
      title,
      message,
      priority: 'medium',
      category: 'general',
      ...options
    })
  }

  info(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'info',
      title,
      message,
      priority: 'low',
      category: 'general',
      ...options
    })
  }

  system(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'system',
      title,
      message,
      priority: 'high',
      category: 'system',
      persistent: true,
      ...options
    })
  }

  // Security-specific notifications
  security(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'warning',
      title,
      message,
      priority: 'urgent',
      category: 'security',
      persistent: true,
      autoClose: false,
      sound: true,
      ...options
    })
  }

  // Admin-specific notifications
  admin(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'info',
      title,
      message,
      priority: 'medium',
      category: 'admin',
      ...options
    })
  }

  // User action notifications
  userAction(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'info',
      title,
      message,
      priority: 'low',
      category: 'user',
      ...options
    })
  }

  // Notification management
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      notification.read = true
      this.unreadCount = Math.max(0, this.unreadCount - 1)
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true)
    this.unreadCount = 0
    this.saveToStorage()
    this.notifyListeners()
  }

  remove(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      const notification = this.notifications[index]
      if (!notification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
      this.notifications.splice(index, 1)
      this.saveToStorage()
      this.notifyListeners()
      toast.dismiss(id)
    }
  }

  clear(): void {
    this.notifications = []
    this.unreadCount = 0
    this.saveToStorage()
    this.notifyListeners()
    toast.dismiss()
  }

  // Getters
  getAll(): Notification[] {
    return [...this.notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read)
  }

  getByCategory(category: Notification['category']): Notification[] {
    return this.notifications.filter(n => n.category === category)
  }

  getUnreadCount(): number {
    return this.unreadCount
  }

  // Settings management
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    localStorage.setItem('notification-settings', JSON.stringify(this.settings))
  }

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  // Listeners for real-time updates
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Private methods
  private addNotification(notification: Notification): void {
    // Check for duplicates if grouping is enabled
    if (this.settings.groupSimilar) {
      const existing = this.notifications.find(n => 
        n.title === notification.title && 
        n.category === notification.category &&
        !n.read &&
        Date.now() - n.timestamp.getTime() < 60000 // Within 1 minute
      )
      if (existing) {
        existing.timestamp = new Date()
        this.notifyListeners()
        return
      }
    }

    this.notifications.unshift(notification)
    this.unreadCount++

    // Limit notifications
    if (this.notifications.length > this.settings.maxNotifications) {
      const removed = this.notifications.splice(this.settings.maxNotifications)
      removed.forEach(n => {
        if (!n.read) this.unreadCount--
      })
    }

    this.saveToStorage()
    this.notifyListeners()
  }

  private showToast(notification: Notification): void {
    const toastOptions = {
      id: notification.id,
      description: notification.message,
      duration: notification.autoClose ? notification.duration : Infinity,
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: notification.actions[0].action
      } : undefined
    }

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions)
        break
      case 'error':
        toast.error(notification.title, toastOptions)
        break
      case 'warning':
        toast.warning(notification.title, toastOptions)
        break
      case 'info':
      case 'system':
        toast.info(notification.title, toastOptions)
        break
      default:
        toast(notification.title, toastOptions)
    }
  }

  private showDesktopNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: this.getIconForType(notification.type),
        tag: notification.category,
        requireInteraction: notification.priority === 'urgent'
      })

      desktopNotification.onclick = () => {
        window.focus()
        this.markAsRead(notification.id)
        desktopNotification.close()
      }

      if (notification.autoClose) {
        setTimeout(() => desktopNotification.close(), notification.duration! * 1000)
      }
    }
  }

  private playNotificationSound(type: Notification['type']): void {
    // You can add different sounds for different types
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different frequencies for different types
    const frequencies = {
      success: 800,
      error: 400,
      warning: 600,
      info: 700,
      system: 500
    }

    oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  private canShowDesktop(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  private getDurationByPriority(priority: Notification['priority']): number {
    const durations = {
      low: 3000,
      medium: 5000,
      high: 8000,
      urgent: 0 // No auto-close for urgent
    }
    return durations[priority]
  }

  private getIconForType(type: Notification['type']): string {
    // You can customize these icons
    const icons = {
      success: '/icons/success.png',
      error: '/icons/error.png',
      warning: '/icons/warning.png',
      info: '/icons/info.png',
      system: '/icons/system.png'
    }
    return icons[type] || icons.info
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private saveToStorage(): void {
    if (this.settings.persistence) {
      const data = {
        notifications: this.notifications.map(n => ({
          ...n,
          timestamp: n.timestamp.toISOString()
        })),
        unreadCount: this.unreadCount
      }
      localStorage.setItem('notifications', JSON.stringify(data))
    }
  }

  private loadFromStorage(): void {
    if (this.settings.persistence) {
      try {
        const stored = localStorage.getItem('notifications')
        const settingsStored = localStorage.getItem('notification-settings')
        
        if (settingsStored) {
          this.settings = { ...this.settings, ...JSON.parse(settingsStored) }
        }

        if (stored) {
          const data = JSON.parse(stored)
          this.notifications = data.notifications.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }))
          this.unreadCount = data.unreadCount || this.notifications.filter(n => !n.read).length
        }
      } catch (error) {
        console.error('Failed to load notifications from storage:', error)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAll()))
  }
}

// Create singleton instance
export const notificationService = new NotificationService()

// Export convenience methods for direct use
export const {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  system: showSystem,
  security: showSecurity,
  admin: showAdmin,
  userAction: showUserAction
} = notificationService
