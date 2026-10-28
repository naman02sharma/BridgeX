// public/sw.js
const CACHE_NAME = 'bridgex-v1'
const OFFLINE_QUEUE = 'offline-queue'

// Resources to cache for offline use
const CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/bridgex-logo.svg',
  // Cache critical components and pages
  '/_next/static/css/',
  '/_next/static/js/',
  // API endpoints that might be needed offline
  '/api/alerts',
  '/api/responders'
]

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching critical resources')
        return cache.addAll(CACHE_URLS)
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      clients.claim()
    ])
  )
})

// Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event)
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response.ok) {
              return response
            }

            // Clone the response for caching
            const responseClone = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone)
              })

            return response
          })
          .catch(() => {
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/')
            }
          })
      })
  )
})

// Handle API requests with network-first strategy
function handleApiRequest(event) {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone)
            })
        }
        return response
      })
      .catch(() => {
        // Return cached version if available
        return caches.match(event.request)
      })
  )
}

// Background sync for offline alerts
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)

  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncOfflineAlerts())
  }
})

// Sync offline alerts when back online
async function syncOfflineAlerts() {
  try {
    const offlineQueue = await getOfflineQueue()

    if (offlineQueue.length === 0) {
      console.log('No offline alerts to sync')
      return
    }

    console.log(`Syncing ${offlineQueue.length} offline alerts`)

    for (const alertData of offlineQueue) {
      try {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertData)
        })

        if (response.ok) {
          // Remove from queue on success
          await removeFromOfflineQueue(alertData.id)
          console.log('Alert synced successfully:', alertData.id)
        } else {
          console.error('Failed to sync alert:', alertData.id, response.status)
        }
      } catch (error) {
        console.error('Error syncing alert:', alertData.id, error)
      }
    }
  } catch (error) {
    console.error('Error during background sync:', error)
  }
}

// Offline queue management
async function getOfflineQueue() {
  try {
    const db = await openOfflineDB()
    const transaction = db.transaction([OFFLINE_QUEUE], 'readonly')
    const store = transaction.objectStore(OFFLINE_QUEUE)
    return new Promise((resolve) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => resolve([])
    })
  } catch (error) {
    console.error('Error getting offline queue:', error)
    return []
  }
}

async function removeFromOfflineQueue(id) {
  try {
    const db = await openOfflineDB()
    const transaction = db.transaction([OFFLINE_QUEUE], 'readwrite')
    const store = transaction.objectStore(OFFLINE_QUEUE)
    store.delete(id)
  } catch (error) {
    console.error('Error removing from offline queue:', error)
  }
}

// IndexedDB for offline queue
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bridgex-offline', 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE)) {
        db.createObjectStore(OFFLINE_QUEUE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push message received:', event)

  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || data.message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      url: data.url || '/',
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192x192.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    requireInteraction: data.urgent || false,
    silent: false,
    tag: data.tag || 'emergency-alert',
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)

  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
})