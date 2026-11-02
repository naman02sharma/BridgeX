export interface Coordinates {
  lat: number
  lng: number
  accuracy?: number
  city?: string
  source?: "gps" | "phone" | "account" | "ip" | "cache" | "default"
}

export interface GeolocationError {
  code: number
  message: string
}

// Default regional center: Thane (Mumbai MMR)
export const DEFAULT_COORDS: Coordinates = {
  lat: 19.2183,
  lng: 72.9781,
  city: "Thane",
  source: "default"
}

export function isKurlaGateway(lat: number, lng: number): boolean {
  return (
    (Math.abs(lat - 19.076) < 0.02 && Math.abs(lng - 72.877) < 0.02) ||
    (Math.abs(lat - 19.0728) < 0.02 && Math.abs(lng - 72.8826) < 0.02)
  )
}

/**
 * Resolve geolocation from account phone number, area codes, or mobile telecom circles.
 */
export function resolveLocationFromPhone(phone?: string | null): Coordinates | null {
  if (!phone) return null
  const clean = phone.replace(/[^0-9]/g, "")
  if (!clean || clean.length < 4) return null

  // Panvel / Raigad STD landline code (02143 / 2143)
  if (clean.includes("2143")) {
    return { lat: 18.9894, lng: 73.1175, city: "Panvel", source: "phone" }
  }

  // Mumbai / Thane / Navi Mumbai STD codes (022 / 22)
  if (clean.startsWith("022") || clean.startsWith("9122")) {
    return { lat: 19.2183, lng: 72.9781, city: "Thane", source: "phone" }
  }

  return null
}

/**
 * Fetch approximate coordinates from IP geolocation
 * Sequentially tests providers and skips ISP routing gateways (Kurla)
 */
async function getIpLocation(): Promise<Coordinates | null> {
  // Provider 1: freeipapi.com (returns accurate city/suburb e.g. Borivali / Thane area)
  try {
    const res = await fetch("https://freeipapi.com/api/json", {
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const data = await res.json()
      if (typeof data.latitude === "number" && typeof data.longitude === "number") {
        if (!isKurlaGateway(data.latitude, data.longitude)) {
          return {
            lat: data.latitude,
            lng: data.longitude,
            city: data.cityName || data.regionName || "Thane",
            source: "ip"
          }
        }
      }
    }
  } catch (err) {}

  // Provider 2: BigDataCloud reverse geocode client (high precision client location)
  try {
    const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client", {
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const data = await res.json()
      if (typeof data.latitude === "number" && typeof data.longitude === "number") {
        if (!isKurlaGateway(data.latitude, data.longitude)) {
          return {
            lat: data.latitude,
            lng: data.longitude,
            city: data.locality || data.city || "Thane",
            source: "ip"
          }
        }
      }
    }
  } catch (err) {}

  // Provider 3: ipwho.is fallback
  try {
    const res = await fetch("https://ipwho.is/", {
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.success !== false && typeof data.latitude === "number" && typeof data.longitude === "number") {
        if (!isKurlaGateway(data.latitude, data.longitude)) {
          return {
            lat: data.latitude,
            lng: data.longitude,
            city: data.city || data.region || "Thane",
            source: "ip"
          }
        }
      }
    }
  } catch (err) {}

  return null
}

/**
 * High-reliability live location getter:
 * 1. Checks recent valid GPS cache (< 15 seconds old, GPS source only)
 * 2. Attempts hardware/browser GPS with 2-tier fallback (High Accuracy -> Wi-Fi network location)
 * 3. Falls back to multi-provider IP Geolocation (rejecting Kurla ISP gateway)
 * 4. Defaults to current regional center (Thane)
 */
export const getUserLocation = async (
  forceFresh = false,
  userPhone?: string | null
): Promise<Coordinates> => {
  if (typeof window === "undefined") return DEFAULT_COORDS

  // Clear any legacy manual city overrides from older sessions
  try {
    localStorage.removeItem("bridgex_selected_city")
  } catch {}

  // 1. Check GPS cache — only accept GPS-sourced coords less than 15 seconds old
  if (!forceFresh) {
    try {
      const cached = localStorage.getItem("bridgex_user_coords")
      if (cached) {
        const parsed = JSON.parse(cached)
        if (
          !isKurlaGateway(parsed.lat, parsed.lng) &&
          parsed.lat &&
          parsed.lng &&
          parsed.source === "gps" &&
          Date.now() - (parsed.time || 0) < 15 * 1000 // 15-second cache only
        ) {
          return { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy, city: parsed.city, source: "cache" }
        }
      }
    } catch {}
  }

  // 2. Try browser GPS with 2-tier fallback: High Accuracy -> Wi-Fi network triangulation
  if ("geolocation" in navigator) {
    try {
      const pos = await new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: p.coords.accuracy,
            source: "gps"
          }),
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 15000, // allows fresh OS-level cache (15s) to avoid cold-start satellite timeouts
          }
        )
      })
      if (!isKurlaGateway(pos.lat, pos.lng)) {
        try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...pos, time: Date.now() })) } catch {}
        return pos
      }
    } catch {
      // High accuracy timed out / unavailable indoors: try standard Wi-Fi network triangulation
      try {
        const pos = await new Promise<Coordinates>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({
              lat: p.coords.latitude,
              lng: p.coords.longitude,
              accuracy: p.coords.accuracy,
              source: "gps"
            }),
            (err) => reject(err),
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 60000, // network triangulation
            }
          )
        })
        if (!isKurlaGateway(pos.lat, pos.lng)) {
          try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...pos, time: Date.now() })) } catch {}
          return pos
        }
      } catch {}
    }
  }

  // 3. Try IP-based location (FreeIPApi / BigDataCloud / IPWho, rejecting Kurla ISP gateway)
  const ipLoc = await getIpLocation()
  if (ipLoc) {
    if (!isKurlaGateway(ipLoc.lat, ipLoc.lng)) {
      try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...ipLoc, time: Date.now() })) } catch {}
      return ipLoc
    }
  }

  // 4. Default to Thane
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
