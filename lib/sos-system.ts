import { getUserLocation, type Coordinates } from "./geolocation"
import { classifyEmergency } from "./emergency-classifier"
import { supabase } from "./supabase"

export type EmergencyType = "medical" | "fire" | "accident" | "security" | "natural_disaster" | "other"
export type UrgencyLevel = "low" | "medium" | "high" | "critical"

export interface SOSAlert {
  id: string
  userId: string
  userName: string
  location: Coordinates
  address?: string
  emergencyType: EmergencyType
  urgencyLevel: UrgencyLevel
  message?: string
  timestamp: Date
  status: "active" | "responding" | "resolved" | "cancelled"
  panicMode: boolean
  panicTimer?: number
  responders: string[]
  metadata: {
    batteryLevel?: number
    deviceInfo?: string
    additionalNotes?: string
    offline?: boolean
    queuedAt?: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
}

/**
 * Create a new SOS alert with automatic urgency classification
 * Supports offline queuing when network is unavailable
 */
export async function createSOSAlert(
  userId: string,
  userName: string,
  emergencyType: EmergencyType,
  message?: string,
  uploadedFiles?: any[]
): Promise<SOSAlert> {
  try {
    // Check if user is online
    const isOnline = navigator.onLine

    if (!isOnline) {
      // Queue alert for offline sync
      console.log("[BridgeX] User offline, queuing alert for later sync")

      // Get location (may fail offline, but try anyway)
      let location: Coordinates | null = null
      let address = "Location unavailable (offline)"

      try {
        location = await getUserLocation()
        address = await reverseGeocode(location)
      } catch (error) {
        console.warn("[BridgeX] Could not get location offline:", error)
        // Use default location or last known location if available
        location = { lat: 0, lng: 0 }
      }

      // Classify urgency based on message if provided
      let urgencyLevel: UrgencyLevel = "high" // Default for SOS
      if (message) {
        try {
          const classification = classifyEmergency(message)
          const urgencyMap: Record<string, UrgencyLevel> = { high: "critical", medium: "high", low: "medium" }
          urgencyLevel = urgencyMap[classification.confidence] || "high"
        } catch (error) {
          console.warn("[BridgeX] Could not classify emergency offline:", error)
        }
      }

      // Create offline alert object
      const offlineAlert = {
        type: emergencyType,
        message: message || "",
        location: location,
        attachments: uploadedFiles?.map(f => f.url || f.name) || []
      }

      // Queue for later sync
      if (window.indexedDB) {
        await queueOfflineAlert(offlineAlert)
      }

      // Return a temporary alert object for UI feedback
      const tempAlert: SOSAlert = {
        id: `offline-${Date.now()}`,
        userId,
        userName,
        location: location,
        address,
        emergencyType,
        urgencyLevel,
        message,
        timestamp: new Date(),
        status: "active",
        panicMode: false,
        responders: [],
        metadata: {
          batteryLevel: await getBatteryLevel(),
          deviceInfo: navigator.userAgent,
          offline: true,
          queuedAt: new Date().toISOString()
        },
      }

      // Show offline notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Alert Queued", {
          body: "Emergency alert saved offline and will be sent when connection is restored",
          icon: "/icon-192x192.png",
          tag: "offline-alert",
        })
      }

      return tempAlert
    }

    // Online flow - proceed with normal alert creation
    return await createOnlineSOSAlert(userId, userName, emergencyType, message, uploadedFiles)
  } catch (error) {
    console.error("[BridgeX] SOS Alert creation failed:", error)
    throw error
  }
}

/**
 * Create SOS alert when online
 */
async function createOnlineSOSAlert(
  userId: string,
  userName: string,
  emergencyType: EmergencyType,
  message?: string,
  uploadedFiles?: any[]
): Promise<SOSAlert> {
  // Get user location
  const location = await getUserLocation()

  // Get address from coordinates (reverse geocoding)
  const address = await reverseGeocode(location)

  // Classify urgency based on message if provided
  let urgencyLevel: UrgencyLevel = "high" // Default for SOS
  if (message) {
    const classification = classifyEmergency(message)
    const urgencyMap: Record<string, UrgencyLevel> = { high: "critical", medium: "high", low: "medium" }
    urgencyLevel = urgencyMap[classification.confidence] || "high"
  }

  // Create alert in database
  const { data: alertData, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      emergency_type: emergencyType,
      urgency_level: urgencyLevel,
      message,
      location: {
        lat: location.lat,
        lng: location.lng,
        address,
      },
      attachments: uploadedFiles || [],
      metadata: {
        batteryLevel: await getBatteryLevel(),
        deviceInfo: navigator.userAgent,
      },
    })
    .select()
    .single()

  if (error) throw error

  // Convert to our SOSAlert format
  const alert: SOSAlert = {
    id: alertData.id,
    userId: alertData.user_id,
    userName,
    location,
    address,
    emergencyType,
    urgencyLevel,
    message,
    timestamp: new Date(alertData.created_at),
    status: alertData.status as any,
    panicMode: false,
    responders: [],
    metadata: alertData.metadata,
  }

  // Notify nearby responders
  await notifyNearbyResponders(alert)

  // Start panic mode timer if no response in 2 minutes
  startPanicModeTimer(alert.id)

  return alert
}

/**
 * Queue alert for offline sync
 */
async function queueOfflineAlert(alertData: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bridgex-offline', 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest)?.result
      if (db && !db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest)?.result
      const transaction = db.transaction(['offline-queue'], 'readwrite')
      const store = transaction.objectStore('offline-queue')

      const offlineAlert = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...alertData,
        timestamp: Date.now(),
        synced: false
      }

      const addRequest = store.add(offlineAlert)

      addRequest.onsuccess = () => {
        console.log('[BridgeX] Alert queued for offline sync:', offlineAlert.id)
        resolve()
      }

      addRequest.onerror = () => {
        console.error('[BridgeX] Failed to queue offline alert')
        reject(new Error('Failed to queue offline alert'))
      }
    }

    request.onerror = () => {
      console.error('[BridgeX] Failed to open offline database')
      reject(new Error('Failed to open offline database'))
    }
  })
}

/**
 * Activate panic mode for an alert
 */
export async function activatePanicMode(alertId: string): Promise<void> {
  try {
    console.log("[BridgeX] Activating panic mode for alert:", alertId)

    // Update alert status in database
    const { error } = await supabase
      .from('alerts')
      .update({
        panic_mode: true,
        status: 'active', // Keep active but mark panic
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) throw error

    // Send high-priority notifications
    await sendPriorityNotifications(alertId)

    // Broadcast to all nearby responders in wider radius
    await broadcastToAllResponders(alertId)
  } catch (error) {
    console.error("[BridgeX] Panic mode activation failed:", error)
  }
}

/**
 * Get urgency color coding for UI
 */
export function getUrgencyColor(level: UrgencyLevel): {
  bg: string
  text: string
  border: string
  icon: string
} {
  const colors = {
    low: {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
      icon: "text-blue-500",
    },
    medium: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-500/30",
      icon: "text-yellow-500",
    },
    high: {
      bg: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500/30",
      icon: "text-orange-500",
    },
    critical: {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/30",
      icon: "text-red-500",
    },
  }

  return colors[level]
}

/**
 * Start panic mode timer (triggers if no response within 2 minutes)
 */
function startPanicModeTimer(alertId: string): void {
  const PANIC_MODE_DELAY = 2 * 60 * 1000 // 2 minutes

  setTimeout(async () => {
    try {
      // Check if alert is still active and no responders assigned
      const { data: alert, error } = await supabase
        .from('alerts')
        .select('status, responders')
        .eq('id', alertId)
        .single()

      if (error) throw error

      if (alert.status === "active" && (!alert.responders || alert.responders.length === 0)) {
        console.log("[BridgeX] No response detected, activating panic mode")
        await activatePanicMode(alertId)
      }
    } catch (error) {
      console.error("[BridgeX] Panic mode timer error:", error)
    }
  }, PANIC_MODE_DELAY)
}

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(location: Coordinates): Promise<string> {
  try {
    // In production, use Google Maps Geocoding API
    // For now, return formatted coordinates
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
  } catch (error) {
    return "Location unavailable"
  }
}

/**
 * Get device battery level
 */
async function getBatteryLevel(): Promise<number | undefined> {
  try {
    if ("getBattery" in navigator) {
      const battery = await (navigator as any).getBattery()
      return Math.round(battery.level * 100)
    }
  } catch (error) {
    console.error("[BridgeX] Battery API not available")
  }
  return undefined
}

/**
 * Notify nearby responders
 */
async function notifyNearbyResponders(alert: SOSAlert): Promise<void> {
  try {
    // For now, we'll implement this as a direct database query
    // In production, this should use geospatial queries
    const { data: responders, error } = await supabase
      .from('responders')
      .select(`
        id,
        user_id,
        profiles:user_id (
          name,
          organization
        )
      `)
      .eq('active', true)
      .eq('verification_status', 'verified')
      .limit(10) // Get first 10 active responders

    if (error) throw error

    // Create notifications for each responder
    if (responders && responders.length > 0) {
      const notifications = responders.map(responder => ({
        user_id: responder.user_id,
        alert_id: alert.id,
        title: `Emergency Alert: ${alert.emergencyType}`,
        body: `New ${alert.urgencyLevel} priority emergency nearby`,
        data: { alertId: alert.id, type: 'emergency' }
      }))

      await supabase.from('notifications').insert(notifications)
    }
  } catch (error) {
    console.error("[BridgeX] Failed to notify responders:", error)
  }
}

/**
 * Send high-priority notifications for panic mode
 */
async function sendPriorityNotifications(alertId: string): Promise<void> {
  // Browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("PANIC MODE ACTIVATED", {
      body: "Emergency alert requires immediate attention",
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: alertId,
      requireInteraction: true,
    })
  }

  // Send to all admin users
  await fetch("/api/notifications/priority", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId, priority: "critical" }),
  })
}

/**
 * Broadcast to all responders in wider area
 */
async function broadcastToAllResponders(alertId: string): Promise<void> {
  await fetch("/api/alerts/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId, radius: 20 }), // 20km radius
  })
}

/**
 * Request browser notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("[BridgeX] Notifications not supported")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}
