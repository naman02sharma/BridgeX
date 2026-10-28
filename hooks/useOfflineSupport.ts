"use client"

import { useState, useEffect, useCallback } from "react"

interface OfflineAlert {
  id: string
  type: string
  message: string
  location: {
    latitude: number
    longitude: number
  }
  attachments?: string[]
  timestamp: number
  synced: boolean
}

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(true) // Default to online for SSR compatibility
  const [offlineQueue, setOfflineQueue] = useState<OfflineAlert[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Monitor online/offline status
  useEffect(() => {
    // Set initial online status on client
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineAlerts()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load offline queue from IndexedDB on mount
  useEffect(() => {
    loadOfflineQueue()
  }, [])

  const loadOfflineQueue = async () => {
    try {
      const queue = await getOfflineQueueFromDB()
      setOfflineQueue(queue)
    } catch (error) {
      console.error('Error loading offline queue:', error)
    }
  }

  const getOfflineQueueFromDB = (): Promise<OfflineAlert[]> => {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve([])
        return
      }

      const request = indexedDB.open('bridgex-offline', 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('offline-queue')) {
          db.createObjectStore('offline-queue', { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['offline-queue'], 'readonly')
        const store = transaction.objectStore('offline-queue')
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result || [])
        }

        getAllRequest.onerror = () => {
          resolve([])
        }
      }

      request.onerror = () => {
        resolve([])
      }
    })
  }

  const saveOfflineQueueToDB = (queue: OfflineAlert[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'))
        return
      }

      const request = indexedDB.open('bridgex-offline', 1)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['offline-queue'], 'readwrite')
        const store = transaction.objectStore('offline-queue')

        // Clear existing data
        const clearRequest = store.clear()

        clearRequest.onsuccess = () => {
          // Add all items from the queue
          let completed = 0
          const total = queue.length

          if (total === 0) {
            resolve()
            return
          }

          queue.forEach((item) => {
            const addRequest = store.add(item)
            addRequest.onsuccess = () => {
              completed++
              if (completed === total) {
                resolve()
              }
            }
            addRequest.onerror = () => {
              reject(new Error('Failed to save offline queue'))
            }
          })
        }

        clearRequest.onerror = () => {
          reject(new Error('Failed to clear offline queue'))
        }
      }

      request.onerror = () => {
        reject(new Error('Failed to open database'))
      }
    })
  }

  const addToOfflineQueue = useCallback(async (alert: Omit<OfflineAlert, 'id' | 'timestamp' | 'synced'>) => {
    const offlineAlert: OfflineAlert = {
      ...alert,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false
    }

    const updatedQueue = [...offlineQueue, offlineAlert]
    setOfflineQueue(updatedQueue)

    try {
      await saveOfflineQueueToDB(updatedQueue)
    } catch (error) {
      console.error('Error saving to offline queue:', error)
    }

    return offlineAlert
  }, [offlineQueue])

  const removeFromOfflineQueue = useCallback(async (id: string) => {
    const updatedQueue = offlineQueue.filter(alert => alert.id !== id)
    setOfflineQueue(updatedQueue)

    try {
      await saveOfflineQueueToDB(updatedQueue)
    } catch (error) {
      console.error('Error updating offline queue:', error)
    }
  }, [offlineQueue])

  const syncOfflineAlerts = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0 || isSyncing) {
      return
    }

    setIsSyncing(true)

    try {
      // Register background sync if supported
      if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('sync-alerts')
      } else {
        // Fallback: sync manually
        await manualSync()
      }
    } catch (error) {
      console.error('Error registering background sync:', error)
      // Fallback to manual sync
      await manualSync()
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, offlineQueue, isSyncing])

  const manualSync = async () => {
    const unsyncedAlerts = offlineQueue.filter(alert => !alert.synced)

    for (const alert of unsyncedAlerts) {
      try {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: alert.type,
            message: alert.message,
            location: alert.location,
            attachments: alert.attachments,
            offline: true,
            offlineTimestamp: alert.timestamp
          })
        })

        if (response.ok) {
          await removeFromOfflineQueue(alert.id)
          console.log('Alert synced successfully:', alert.id)
        } else {
          console.error('Failed to sync alert:', alert.id, response.status)
        }
      } catch (error) {
        console.error('Error syncing alert:', alert.id, error)
      }
    }
  }

  const clearOfflineQueue = useCallback(async () => {
    setOfflineQueue([])
    try {
      await saveOfflineQueueToDB([])
    } catch (error) {
      console.error('Error clearing offline queue:', error)
    }
  }, [])

  return {
    isOnline,
    offlineQueue,
    isSyncing,
    addToOfflineQueue,
    removeFromOfflineQueue,
    syncOfflineAlerts,
    clearOfflineQueue,
    queueLength: offlineQueue.length,
    unsyncedCount: offlineQueue.filter(alert => !alert.synced).length
  }
}