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

// Known ISP gateways (Kurla central node and Borivali node) that mislead client geolocation
export function isMisleadingIspGateway(lat: number, lng: number): boolean {
  // 1. Kurla ISP gateway (central Mumbai routing hub)
  const isKurla =
    (Math.abs(lat - 19.076) < 0.02 && Math.abs(lng - 72.877) < 0.02) ||
    (Math.abs(lat - 19.0728) < 0.02 && Math.abs(lng - 72.8826) < 0.02)

  // 2. Borivali ISP gateway (fixed node returned by freeipapi)
  const isBorivaliGateway =
    Math.abs(lat - 19.235) < 0.015 && Math.abs(lng - 72.8598) < 0.015

  return isKurla || isBorivaliGateway
}

// Backward-compat alias
export const isKurlaGateway = isMisleadingIspGateway

/**
 * Account-based location resolver:
 * Ensures institutional accounts (e.g. A. P. Shah Institute of Technology @apsit.edu.in)
 * never get assigned an erroneous ISP gateway or mixed up with another user's coordinates.
 */
export function resolveLocationFromAccount(
  accountIdentifier?: string | null,
  organization?: string | null
): Coordinates | null {
  if (!accountIdentifier && !organization) return null
  const idStr = String(accountIdentifier || "").toLowerCase()
  const orgStr = String(organization || "").toLowerCase()

  // A. P. Shah Institute of Technology (APSIT), Kasarvadavali, Ghodbunder Rd, Thane West
  if (
    idStr.includes("apsit.edu.in") ||
    idStr.includes("apsit") ||
    orgStr.includes("apsit") ||
    orgStr.includes("a.p. shah") ||
    orgStr.includes("ap shah")
  ) {
    return {
      lat: 19.2680,
      lng: 72.9673,
      city: "Thane (A. P. Shah Institute of Technology)",
      source: "account"
    }
  }

  // General Thane account
  if (idStr.includes("thane") || orgStr.includes("thane")) {
    return {
      lat: 19.2183,
      lng: 72.9781,
      city: "Thane",
      source: "account"
    }
  }

  // General Panvel account
  if (idStr.includes("panvel") || orgStr.includes("panvel")) {
    return {
      lat: 18.9894,
      lng: 73.1175,
      city: "Panvel",
      source: "account"
    }
  }

  return null
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
 * Helper to get user-scoped localStorage cache key to prevent account cross-contamination
 */
export function getCoordsCacheKey(userId?: string | null): string {
  if (userId) return `bridgex_coords_${userId}`
  if (typeof window !== "undefined") {
    const savedId = localStorage.getItem("bridgex_user_id")
    if (savedId) return `bridgex_coords_${savedId}`
  }
  return "bridgex_user_coords"
}

/**
 * Fetch approximate coordinates from IP geolocation
 * Sequentially tests providers and skips ISP routing gateways (Kurla & Borivali nodes)
 */
async function getIpLocation(): Promise<Coordinates | null> {
  // Provider 1: BigDataCloud reverse geocode client (high precision client location)
  try {
    const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client", {
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const data = await res.json()
      if (typeof data.latitude === "number" && typeof data.longitude === "number") {
        if (!isMisleadingIspGateway(data.latitude, data.longitude)) {
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

  // Provider 2: ipwho.is
  try {
    const res = await fetch("https://ipwho.is/", {
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.success !== false && typeof data.latitude === "number" && typeof data.longitude === "number") {
        if (!isMisleadingIspGateway(data.latitude, data.longitude)) {
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
 * 1. Checks user-isolated GPS cache (< 15 seconds old)
 * 2. Attempts hardware/browser GPS with 2-tier fallback (High Accuracy -> Wi-Fi network location)
 * 3. Resolves from verified account institutional campus (e.g. A. P. Shah Institute of Technology, Thane)
 * 4. Falls back to multi-provider IP Geolocation (rejecting Kurla & Borivali ISP nodes)
 * 5. Defaults to current regional center (Thane)
 */
export const getUserLocation = async (
  forceFresh = false,
  accountIdentifier?: string | null,
  organization?: string | null
): Promise<Coordinates> => {
  if (typeof window === "undefined") return DEFAULT_COORDS

  const cacheKey = getCoordsCacheKey(accountIdentifier)

  // Clear any legacy manual city overrides
  try {
    localStorage.removeItem("bridgex_selected_city")
  } catch {}

  // 1. Check account-isolated GPS cache — only accept GPS-sourced coords less than 15 seconds old
  if (!forceFresh) {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (
          !isMisleadingIspGateway(parsed.lat, parsed.lng) &&
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

  // 2. Try browser GPS: High Accuracy -> Wi-Fi network triangulation
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
            maximumAge: 15000, // allow fresh 15s OS reading to prevent cold-start timeout
          }
        )
      })
      if (!isMisleadingIspGateway(pos.lat, pos.lng)) {
        try { localStorage.setItem(cacheKey, JSON.stringify({ ...pos, time: Date.now() })) } catch {}
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
        if (!isMisleadingIspGateway(pos.lat, pos.lng)) {
          try { localStorage.setItem(cacheKey, JSON.stringify({ ...pos, time: Date.now() })) } catch {}
          return pos
        }
      } catch {}
    }
  }

  // 3. Resolve from Account (e.g. A. P. Shah Institute of Technology @apsit.edu.in in Thane)
  const fromAccount = resolveLocationFromAccount(accountIdentifier, organization)
  if (fromAccount) {
    try { localStorage.setItem(cacheKey, JSON.stringify({ ...fromAccount, time: Date.now() })) } catch {}
    return fromAccount
  }

  // 4. Try IP-based location (rejecting Kurla & Borivali ISP nodes)
  const ipLoc = await getIpLocation()
  if (ipLoc) {
    if (!isMisleadingIspGateway(ipLoc.lat, ipLoc.lng)) {
      try { localStorage.setItem(cacheKey, JSON.stringify({ ...ipLoc, time: Date.now() })) } catch {}
      return ipLoc
    }
  }

  // 5. Default to Thane
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
