"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, X, AlertTriangle, Info, CheckCircle, BellOff, BellRing } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { usePushNotifications } from "@/hooks/usePushNotifications"

interface Notification {
  id: string
  title: string
  message: string
  type: "alert" | "info" | "success" | "warning"
  priority: "low" | "normal" | "high" | "urgent"
  read: boolean
  created_at: string
}

export function RealTimeNotifications({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  const {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications(userId)

  useEffect(() => {
    if (userId) {
      fetchNotifications()

      // Skip real-time subscription for demo users
      if (!userId.startsWith('demo-user-')) {
        // Subscribe to real-time notifications
        const channel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification
              setNotifications(prev => [newNotification, ...prev])
              setUnreadCount(prev => prev + 1)

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/icon-192x192.png',
                  tag: 'bridgex-notification',
                })
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [userId])

  // Auto-enable push notifications when user logs in (if permission already granted)
  useEffect(() => {
    if (userId && !userId.startsWith('demo-user-') && isSupported && permission === 'granted' && !isSubscribed) {
      // Automatically subscribe if permission was already granted
      subscribe().catch(err => console.warn('Auto-subscribe failed:', err))
    }
  }, [userId, isSupported, permission, isSubscribed])

  const fetchNotifications = async () => {
    try {
      // Only fetch if we have a real user (not demo)
      if (!userId || userId.startsWith('demo-user-')) {
        // Use mock notifications for demo users
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'System Online',
            message: 'Dashboard is running with demo data',
            type: 'info',
            priority: 'normal',
            read: false,
            created_at: new Date().toISOString()
          }
        ]
        setNotifications(mockNotifications)
        setUnreadCount(1)
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.warn('Error fetching notifications from database:', error.message || error)
        // Use mock notifications as fallback
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'Connection Issue',
            message: 'Unable to load notifications. Using demo data.',
            type: 'warning',
            priority: 'normal',
            read: false,
            created_at: new Date().toISOString()
          }
        ]
        setNotifications(mockNotifications)
        setUnreadCount(1)
        return
      }

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.read).length)
    } catch (error) {
      console.warn('Network error fetching notifications:', error)
      // Use mock notifications as fallback
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Network Issue',
          message: 'Unable to connect to notification service.',
          type: 'warning',
          priority: 'normal',
          read: false,
          created_at: new Date().toISOString()
        }
      ]
      setNotifications(mockNotifications)
      setUnreadCount(1)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // Skip database update for demo users
      if (!userId || userId.startsWith('demo-user-')) {
        // Just update UI for demo
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        return
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.warn('Error marking notification as read:', error.message || error)
      }

      // Update UI optimistically even if DB update fails
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.warn('Network error marking notification as read:', error)
      // Still update UI optimistically
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      // Skip database operation for demo users
      if (!userId || userId.startsWith('demo-user-')) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        return
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.warn('Error deleting notification:', error)
    }
  }

  const handlePushToggle = async () => {
    if (!isSupported) return

    if (permission === 'default') {
      const granted = await requestPermission()
      if (granted) {
        await subscribe()
      }
    } else if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-orange-500 bg-orange-50"
      case "normal":
        return "border-blue-500 bg-blue-50"
      default:
        return "border-gray-500 bg-gray-50"
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Hidden push toggle - moved to notification panel
      {isSupported && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePushToggle}
          className={`relative ${isSubscribed ? 'text-green-600' : 'text-muted-foreground'}`}
          title={
            !isSupported
              ? 'Push notifications not supported'
              : permission === 'denied'
                ? 'Push notifications blocked'
                : isSubscribed
                  ? 'Push notifications enabled'
                    : 'Enable push notifications'
            }
          >
            {isSubscribed ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
          </Button>
        )}
      </div> */}

      {/* Notification Panel */}
      {showPanel && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto z-50 shadow-lg border-2">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Push Notification Status */}
            <div className="mt-2 flex items-center gap-2 text-sm">
              {isSupported ? (
                <>
                  {isSubscribed ? (
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      <BellRing className="w-3 h-3 mr-1" />
                      Push Enabled
                    </Badge>
                  ) : permission === 'denied' ? (
                    <Badge variant="destructive">
                      <BellOff className="w-3 h-3 mr-1" />
                      Push Blocked
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handlePushToggle}
                      className="text-xs"
                    >
                      <BellOff className="w-3 h-3 mr-1" />
                      Enable Push Notifications
                    </Button>
                  )}
                </>
              ) : (
                <Badge variant="secondary">
                  <BellOff className="w-3 h-3 mr-1" />
                  Not Supported
                </Badge>
              )}
            </div>
          </div>

          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">No notifications yet</p>
                {isSupported && !isSubscribed && permission !== 'denied' && (
                  <Button size="sm" onClick={handlePushToggle}>
                    Enable Push Notifications
                  </Button>
                )}
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 mb-2 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 px-2 text-xs"
                              >
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Test Notification Button */}
                <div className="text-center pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                    disabled={!isSubscribed}
                  >
                    Send Test Notification
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}