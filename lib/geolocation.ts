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
  // Provider 1: ipwho.is (fast, highly accurate for Indian and global IPs, no key required)
  try {
    const res = await fetch("https://ipwho.is/", {
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.success !== false && typeof data.latitude === "number" && typeof data.longitude === "number") {
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city || data.region,
          source: "ip"
        }
      }
    }
  } catch (err) {}

  // Provider 2: freeipapi.com fallback
  try {
    const res = await fetch("https://freeipapi.com/api/json", {
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const data = await res.json()
      if (typeof data.latitude === "number" && typeof data.longitude === "number") {
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.cityName || data.regionName,
          source: "ip"
        }
      }
    }
  } catch (err) {}

  return null
}

/**
 * High-reliability, high-accuracy location getter:
 * 1. Checks recent GPS cache (< 2 minutes old)
 * 2. Attempts hardware/browser GPS with enableHighAccuracy: true and 8s timeout
 * 3. Falls back to IP Geolocation if GPS is blocked or unavailable
 * 4. Falls back to default region only if completely offline
 */
export const getUserLocation = async (forceFresh = false): Promise<Coordinates> => {
  if (typeof window === "undefined") return DEFAULT_COORDS

  // 1. Check cached position if recent and high quality (< 2 minutes)
  if (!forceFresh) {
    try {
      const cached = localStorage.getItem("bridgex_user_coords")
      if (cached) {
        const parsed = JSON.parse(cached)
        if (
          parsed.lat &&
          parsed.lng &&
          parsed.source === "gps" &&
          Date.now() - (parsed.time || 0) < 2 * 60 * 1000
        ) {
          return { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy, source: "cache" }
        }
      }
    } catch {}
  }

  // 2. Try browser GPS with High Accuracy
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
            enableHighAccuracy: true, // Precise GPS & Wi-Fi triangulation
            timeout: 8000,
            maximumAge: 0, // Force fresh position
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
