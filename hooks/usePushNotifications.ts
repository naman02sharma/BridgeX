"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export function usePushNotifications(userId?: string) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Register service worker and check subscription
      const initializePush = async () => {
        await registerServiceWorker()
        if (userId) {
          await checkExistingSubscription()
        }
      }

      initializePush()
    }
  }, [userId])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      setSubscription(existingSubscription)

      if (existingSubscription) {
        setIsSubscribed(true)
        // Verify subscription is stored in database
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            subscription: {
              endpoint: existingSubscription.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode(...new Uint8Array(existingSubscription.getKey('p256dh')!))),
                auth: btoa(String.fromCharCode(...new Uint8Array(existingSubscription.getKey('auth')!))),
              },
            },
          }),
        })
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const requestPermission = async () => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting permission:', error)
      return false
    }
  }

  const subscribe = async () => {
    if (!isSupported || permission !== 'granted' || !userId) return false

    try {
      const registration = await navigator.serviceWorker.ready

      // Get VAPID key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!vapidPublicKey || vapidPublicKey.length < 20) {
        console.error('Valid VAPID public key not configured')
        return false
      }

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        
      })

      setSubscription(pushSubscription)
      setIsSubscribed(true)

      // Store subscription in database
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Subscription Updated',
          message: 'Push notifications enabled',
          type: 'system',
          subscription: {
            endpoint: pushSubscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!))),
            },
          },
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  }

  const unsubscribe = async () => {
    if (!subscription) return false

    try {
      await subscription.unsubscribe()
      setSubscription(null)
      setIsSubscribed(false)

      // Remove from database
      await fetch('/api/push', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      return true
    } catch (error) {
      console.error('Error unsubscribing:', error)
      return false
    }
  }

  const sendTestNotification = async () => {
    if (!userId) return

    try {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Test Notification',
          message: 'This is a test push notification from BridgeX',
          type: 'test',
          priority: 'normal',
        }),
      })
    } catch (error) {
      console.error('Error sending test notification:', error)
    }
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}