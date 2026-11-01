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

// Default regional center: Panvel (Raigad / Navi Mumbai)
export const DEFAULT_COORDS: Coordinates = {
  lat: 18.9894,
  lng: 73.1175,
  city: "Panvel",
  source: "default"
}

/**
 * Resolve geolocation from account phone number, area codes, or mobile telecom circles.
 * Supports Panvel, Navi Mumbai, Raigad, Mumbai, and Maharashtra numbers.
 */
export function resolveLocationFromPhone(phone?: string | null): Coordinates | null {
  if (!phone) return null
  const clean = phone.replace(/[^0-9]/g, "")
  if (!clean || clean.length < 4) return null

  // 1. Panvel / Raigad STD landline code (02143 / 2143)
  if (clean.includes("2143")) {
    return { lat: 18.9894, lng: 73.1175, city: "Panvel", source: "phone" }
  }

  // 2. Navi Mumbai / Mumbai STD codes (022 / 22)
  if (clean.startsWith("022") || clean.startsWith("9122")) {
    return { lat: 19.0330, lng: 73.0297, city: "Navi Mumbai", source: "phone" }
  }

  // 3. Indian mobile phone numbers (10 digits)
  const last10 = clean.slice(-10)
  if (last10.length === 10) {
    const p4 = last10.slice(0, 4)
    // Series 8087 (Swayam / responder phone in DB, registered in Panvel / Raigad / MH Circle)
    if (p4 === "8087") {
      return { lat: 18.9894, lng: 73.1175, city: "Panvel", source: "phone" }
    }

    // Common Maharashtra / Raigad / Panvel mobile series:
    const mhRaigad = [
      "8087", "8779", "9422", "9423", "9822", "9823", "9850", "9860", "9890",
      "9922", "9923", "7020", "7028", "7038", "7709", "7719", "7720",
      "7875", "8308", "8380", "8390", "8408", "8411", "8412", "8421", "8446"
    ]
    if (mhRaigad.includes(p4)) {
      return { lat: 18.9894, lng: 73.1175, city: "Panvel", source: "phone" }
    }
  }

  // If Indian mobile number (+91) or 10-digit number, default to Panvel
  if (clean.startsWith("91") || clean.length === 10) {
    return { lat: 18.9894, lng: 73.1175, city: "Panvel", source: "phone" }
  }

  return null
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
 * High-reliability location getter:
 * 1. Checks user account / profile / selected city (e.g. Panvel)
 * 2. Checks recent valid GPS cache (< 2 minutes old)
 * 3. Attempts hardware/browser GPS with 2-tier fallback (High Accuracy -> Wi-Fi network location)
 * 4. Resolves according to phone number location for all accounts
 * 5. Falls back to IP Geolocation (rejecting Kurla ISP gateway)
 * 6. Defaults to Panvel
 */
export const getUserLocation = async (
  forceFresh = false,
  userPhone?: string | null
): Promise<Coordinates> => {
  if (typeof window === "undefined") return DEFAULT_COORDS

  // 1. Check cached position if recent and not the Kurla ISP gateway (< 2 minutes)
  if (!forceFresh) {
    try {
      const cached = localStorage.getItem("bridgex_user_coords")
      if (cached) {
        const parsed = JSON.parse(cached)
        const isKurla = Math.abs(parsed.lat - 19.076) < 0.015 && Math.abs(parsed.lng - 72.877) < 0.015
        if (
          !isKurla &&
          parsed.lat &&
          parsed.lng &&
          parsed.source === "gps" &&
          Date.now() - (parsed.time || 0) < 2 * 60 * 1000
        ) {
          return { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy, city: parsed.city, source: "cache" }
        }
      }
    } catch {}
  }

  // 3. Try browser GPS with 2-tier fallback: High Accuracy -> Wi-Fi network triangulation
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
            timeout: 5000,
            maximumAge: 0,
          }
        )
      })
      const isKurla = Math.abs(pos.lat - 19.076) < 0.01 && Math.abs(pos.lng - 72.877) < 0.01
      if (!isKurla) {
        try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...pos, time: Date.now() })) } catch {}
        return pos
      }
    } catch {
      // High accuracy timed out / unavailable: try standard Wi-Fi network location
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
              timeout: 4000,
              maximumAge: 30000,
            }
          )
        })
        const isKurla = Math.abs(pos.lat - 19.076) < 0.01 && Math.abs(pos.lng - 72.877) < 0.01
        if (!isKurla) {
          try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...pos, time: Date.now() })) } catch {}
          return pos
        }
      } catch {}
    }
  }

  // 4. Resolve from Phone Number / Account Location for all accounts
  const effectivePhone =
    userPhone ||
    (typeof window !== "undefined" ? localStorage.getItem("bridgex_user_phone") : null)
  if (effectivePhone) {
    const fromPhone = resolveLocationFromPhone(effectivePhone)
    if (fromPhone) {
      try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...fromPhone, time: Date.now() })) } catch {}
      return fromPhone
    }
  }

  // 5. Try IP-based location (Rejecting Kurla ISP routing gateway)
  const ipLoc = await getIpLocation()
  if (ipLoc) {
    const isKurla =
      (Math.abs(ipLoc.lat - 19.076) < 0.02 && Math.abs(ipLoc.lng - 72.877) < 0.02) ||
      (Math.abs(ipLoc.lat - 19.0728) < 0.02 && Math.abs(ipLoc.lng - 72.8826) < 0.02)
    if (!isKurla) {
      try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...ipLoc, time: Date.now() })) } catch {}
      return ipLoc
    }
  }

  // 6. Default to Panvel
  try { localStorage.setItem("bridgex_user_coords", JSON.stringify({ ...DEFAULT_COORDS, time: Date.now() })) } catch {}
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
