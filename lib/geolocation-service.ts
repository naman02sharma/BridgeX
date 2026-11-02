/**
 * Real-time Geolocation Service for BridgeX
 * Fetches nearby hospitals, NGOs, emergency centers using OpenStreetMap Nominatim and Overpass API
 */

import { getUserLocation as getBaseLocation } from "./geolocation"

export interface NearbyPlace {
  id: string
  name: string
  category: 'hospital' | 'clinic' | 'pharmacy' | 'police' | 'fire_station' | 'ngo' | 'emergency'
  lat: number
  lon: number
  distance?: number // in meters
  address?: string
  phone?: string
  website?: string
  openingHours?: string
  emergency?: boolean
  tags?: Record<string, string>
}

export interface GeolocationResult {
  success: boolean
  places: NearbyPlace[]
  userLocation: { lat: number; lon: number } | null
  error?: string
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Get user's current location with automatic IP and cache fallback
 */
export async function getUserLocation(
  accountIdentifier?: string | null,
  accountOrg?: string | null
): Promise<{ lat: number; lon: number } | null> {
  try {
    const coords = await getBaseLocation(true, accountIdentifier, accountOrg)
    if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
      return { lat: coords.lat, lon: coords.lng }
    }
  } catch (err) {
    console.warn("Location error:", err)
  }
  const isApsit = String(accountIdentifier || "").includes("apsit") || String(accountOrg || "").toLowerCase().includes("apsit")
  return isApsit ? { lat: 19.2680, lon: 72.9673 } : { lat: 19.2183, lon: 72.9781 }
}

/**
 * Fetch nearby emergency places via our own /api/places route.
 * (The route talks to Overpass server-side with mirror fallback + caching;
 * calling Overpass straight from the browser is what caused "Failed to fetch".)
 */
async function fetchPlacesFromApi(
  lat: number,
  lon: number,
  radiusMeters: number
): Promise<{ places: NearbyPlace[]; error?: string }> {
  try {
    const res = await fetch(`/api/places?lat=${lat}&lon=${lon}&radius=${radiusMeters}`, { cache: 'no-store' })
    const data = await res.json().catch(() => null)
    if (!data || data.success === false) {
      return { places: [], error: data?.error || `Places service error (${res.status})` }
    }
    return { places: (data.places || []) as NearbyPlace[] }
  } catch (error) {
    console.warn('Nearby places request failed:', error)
    return { places: [], error: 'Could not reach the places service. Check your connection and try again.' }
  }
}

export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusMeters: number = 20000
): Promise<NearbyPlace[]> {
  const { places } = await fetchPlacesFromApi(lat, lon, radiusMeters)
  return places.filter((p) => p.category !== 'ngo')
}

export async function fetchNearbyNGOs(
  lat: number,
  lon: number,
  radiusMeters: number = 20000
): Promise<NearbyPlace[]> {
  const { places } = await fetchPlacesFromApi(lat, lon, radiusMeters)
  return places.filter((p) => p.category === 'ngo')
}

/**
 * Main function to get all nearby emergency resources within 15-20 km range
 */
export async function getNearbyEmergencyResources(
  radiusMeters: number = 20000,
  accountIdentifier?: string | null,
  accountOrg?: string | null
): Promise<GeolocationResult> {
  const userLocation = await getUserLocation(accountIdentifier, accountOrg)

  if (!userLocation) {
    return {
      success: false,
      places: [],
      userLocation: null,
      error: 'Location permission denied or unavailable',
    }
  }

  const { places, error } = await fetchPlacesFromApi(userLocation.lat, userLocation.lon, radiusMeters)

  if (error && places.length === 0) {
    return { success: false, places: [], userLocation, error }
  }

  return { success: true, places, userLocation }
}

/**
 * Get category icon for display
 */
export function getCategoryIcon(category: NearbyPlace['category']): string {
  const icons: Record<NearbyPlace['category'], string> = {
    hospital: '🏥',
    clinic: '⚕️',
    pharmacy: '💊',
    police: '👮',
    fire_station: '🚒',
    ngo: '🤝',
    emergency: '🚨',
  }
  return icons[category] || '📍'
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: NearbyPlace['category']): string {
  const colors: Record<NearbyPlace['category'], string> = {
    hospital: 'text-red-600 dark:text-red-400',
    clinic: 'text-blue-600 dark:text-blue-400',
    pharmacy: 'text-green-600 dark:text-green-400',
    police: 'text-indigo-600 dark:text-indigo-400',
    fire_station: 'text-orange-600 dark:text-orange-400',
    ngo: 'text-purple-600 dark:text-purple-400',
    emergency: 'text-red-600 dark:text-red-400',
  }
  return colors[category] || 'text-gray-600 dark:text-gray-400'
}
