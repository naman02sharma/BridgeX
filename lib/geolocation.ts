export interface Coordinates {
  lat: number
  lng: number
  accuracy?: number
  city?: string
  source?: "gps" | "ip" | "cache" | "default"
}

export interface GeolocationError {
  code: number
  message: string
}

// Fallback coordinates (Mumbai / Thane region)
const DEFAULT_COORDS: Coordinates = {
  lat: 19.0760,
  lng: 72.8777,
  source: "default"
}

/**
 * Fetch approximate coordinates from IP geolocation
 */
async function getIpLocation(): Promise<Coordinates | null> {
  try {
    const res = await fetch("https://freeipapi.com/api/json", {
      signal: AbortSignal.timeout(3000)
    })
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      return {
        lat: data.latitude,
        lng: data.longitude,
        city: data.cityName || data.regionName,
        source: "ip"
      }
    }
  } catch (err) {
    // Ignore IP fetch errors
  }
  return null
}

/**
 * High-reliability location getter:
 * 1. Checks recent localStorage cache
 * 2. Attempts browser GPS with 5s timeout
 * 3. Falls back to IP Geolocation if GPS is blocked/unavailable
 * 4. Falls back to default region if offline
 */
export const getUserLocation = async (): Promise<Coordinates> => {
  if (typeof window === "undefined") return DEFAULT_COORDS

  // 1. Check cached position (valid for 15 mins)
  try {
    const cached = localStorage.getItem("bridgex_user_coords")
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.lat && parsed.lng && Date.now() - (parsed.time || 0) < 15 * 60 * 1000) {
        return { lat: parsed.lat, lng: parsed.lng, source: "cache" }
      }
    }
  } catch {}

  // 2. Try browser GPS
  if ("geolocation" in navigator) {
    try {
      const position = await new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              source: "gps"
            })
          },
          (err) => reject(err),
          {
            enableHighAccuracy: false, // Low accuracy is significantly faster & more reliable on desktop
            timeout: 4000,
            maximumAge: 60000,
          }
        )
      })

      try {
        localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...position, time: Date.now() }))
      } catch {}
      return position
    } catch {
      // GPS timed out or denied, proceed to IP fallback
    }
  }

  // 3. Try IP-based location
  const ipLoc = await getIpLocation()
  if (ipLoc) {
    try {
      localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...ipLoc, time: Date.now() }))
    } catch {}
    return ipLoc
  }

  // 4. Return default fallback
  return DEFAULT_COORDS
}

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}
