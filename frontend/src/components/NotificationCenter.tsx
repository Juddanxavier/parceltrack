import { useState, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Settings, Trash2, Filter } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover'
import { notificationService, type Notification } from '../services/notificationService'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onRemove: (id: string) => void
}

function NotificationItem({ notification, onMarkRead, onRemove }: NotificationItemProps) {
  const getTypeColor = (type: Notification['type']) => {
    const colors = {
      success: 'border-green-200 bg-green-50',
      error: 'border-red-200 bg-red-50',
      warning: 'border-yellow-200 bg-yellow-50',
      info: 'border-blue-200 bg-blue-50',
      system: 'border-purple-200 bg-purple-50'
    }
    return colors[type] || colors.info
  }

  const getPriorityIndicator = (priority: Notification['priority']) => {
    if (priority === 'urgent') return '🔴'
    if (priority === 'high') return '🟡'
    return ''
  }

  return (
    <Card className={`mb-2 transition-all hover:shadow-md ${
      notification.read ? 'opacity-60' : getTypeColor(notification.type)
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-muted-foreground">
                {getPriorityIndicator(notification.priority)}
                {notification.category.toUpperCase()}
              </span>
              {!notification.read && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
            </div>
            <h4 className="font-medium text-sm mt-1">{notification.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </p>
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex space-x-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.style === 'primary' ? 'default' : 'outline'}
                    onClick={action.action}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-1">
            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkRead(notification.id)}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(notification.id)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface NotificationCenterProps {
  showAsPopover?: boolean
  className?: string
}

export function NotificationCenter({ showAsPopover = true, className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['category']>('all')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Initial load
    setNotifications(notificationService.getAll())
    setUnreadCount(notificationService.getUnreadCount())

    // Subscribe to changes
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
      setUnreadCount(notificationService.getUnreadCount())
    })

    return unsubscribe
  }, [])

  const handleMarkRead = (id: string) => {
    notificationService.markAsRead(id)
  }

  const handleRemove = (id: string) => {
    notificationService.remove(id)
  }

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead()
  }

  const handleClearAll = () => {
    notificationService.clear()
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    return notification.category === filter
  })

  const categories: Array<{ value: Notification['category']; label: string; count: number }> = [
    { 
      value: 'general', 
      label: 'General', 
      count: notifications.filter(n => n.category === 'general').length 
    },
    { 
      value: 'system', 
      label: 'System', 
      count: notifications.filter(n => n.category === 'system').length 
    },
    { 
      value: 'security', 
      label: 'Security', 
      count: notifications.filter(n => n.category === 'security').length 
    },
    { 
      value: 'admin', 
      label: 'Admin', 
      count: notifications.filter(n => n.category === 'admin').length 
    },
    { 
      value: 'user', 
      label: 'User', 
      count: notifications.filter(n => n.category === 'user').length 
    }
  ]

  const NotificationContent = () => (
    <div className="w-96">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('unread')}>
                Unread Only
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map(category => (
                <DropdownMenuItem 
                  key={category.value}
                  onClick={() => setFilter(category.value)}
                >
                  {category.label} ({category.count})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearAll} disabled={notifications.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="p-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onRemove={handleRemove}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )

  if (showAsPopover) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <NotificationContent />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Card className={className}>
      <NotificationContent />
    </Card>
  )
}

// Hook for using notifications with React components
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setNotifications(notificationService.getAll())
    setUnreadCount(notificationService.getUnreadCount())

    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
      setUnreadCount(notificationService.getUnreadCount())
    })

    return unsubscribe
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    remove: notificationService.remove.bind(notificationService),
    clear: notificationService.clear.bind(notificationService),
    // Convenience methods
    success: notificationService.success.bind(notificationService),
    error: notificationService.error.bind(notificationService),
    warning: notificationService.warning.bind(notificationService),
    info: notificationService.info.bind(notificationService),
    system: notificationService.system.bind(notificationService),
    security: notificationService.security.bind(notificationService),
    admin: notificationService.admin.bind(notificationService),
    userAction: notificationService.userAction.bind(notificationService)
  }
}
