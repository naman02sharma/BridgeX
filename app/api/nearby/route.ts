import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
]

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || searchParams.get("lon") || "0")
    // Tracking geolocation to 15-20 km range (default 20 km)
    const radius = Math.min(Math.max(parseInt(searchParams.get("radius") || "20", 10) || 20, 1), 30)

    if (!lat && !lng) {
      return NextResponse.json({
        success: false,
        responders: [],
        count: 0,
        error: "Location required. Enable device location to track nearby emergency places within 15-20 km.",
      })
    }

    const radiusMeters = radius * 1000
    const query = `
      [out:json][timeout:25];
      (
        nwr["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
        nwr["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
        nwr["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
        nwr["amenity"="police"](around:${radiusMeters},${lat},${lng});
        nwr["amenity"="fire_station"](around:${radiusMeters},${lat},${lng});
        nwr["emergency"="yes"](around:${radiusMeters},${lat},${lng});
        nwr["office"~"^(ngo|charity|association)$"](around:${radiusMeters},${lat},${lng});
      );
      out center tags;
    `

    let elements: any[] = []
    let lastError: string | null = null

    for (const mirror of MIRRORS) {
      try {
        const response = await fetch(mirror, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent": "BridgeX/2.0 (Emergency Response Geolocation)",
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(15000),
          cache: "no-store",
        })

        if (!response.ok) {
          lastError = `Overpass status ${response.status}`
          continue
        }

        const text = await response.text()
        if (!text.trim().startsWith("{")) {
          lastError = "Overpass response not JSON"
          continue
        }

        const data = JSON.parse(text)
        if (Array.isArray(data.elements)) {
          elements = data.elements
          break
        }
      } catch (err: any) {
        lastError = err?.message || "Overpass query failed"
      }
    }

    // Transform real elements into emergency responders/facilities
    const responders = elements
      .filter((elem: any) => {
        const pLat = elem.center?.lat ?? elem.lat
        const pLng = elem.center?.lon ?? elem.lon
        return typeof pLat === "number" && typeof pLng === "number" && (elem.tags?.name || elem.tags?.amenity)
      })
      .map((elem: any) => {
        const pLat = elem.center?.lat ?? elem.lat
        const pLng = elem.center?.lon ?? elem.lon
        const distKm = calculateDistance(lat, lng, pLat, pLng)
        const responseTime = Math.max(2, Math.round((distKm / 45) * 60)) // average emergency vehicle speed 45 km/h
        const tags = elem.tags || {}

        let type = "emergency"
        if (tags.amenity === "hospital") type = "hospital"
        else if (tags.amenity === "clinic") type = "clinic"
        else if (tags.amenity === "pharmacy") type = "pharmacy"
        else if (tags.amenity === "police") type = "police"
        else if (tags.amenity === "fire_station") type = "fire_station"
        else if (["ngo", "charity", "association"].includes(tags.office)) type = "ngo"

        const name = tags.name || tags.operator || `${type.replace("_", " ").toUpperCase()} Station`
        const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ")

        return {
          id: `osm-${elem.id}`,
          name,
          type,
          category: type,
          distance: `${distKm.toFixed(1)} km`,
          distanceKm: distKm,
          responseTime: `${responseTime} min`,
          available: true,
          contact: tags.phone || tags["contact:phone"] || "112 / Emergency Dispatch",
          address: address || "Address coordinates on map",
          lat: pLat,
          lng: pLng,
          source: "OpenStreetMap Real-time Geolocation",
        }
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 30)

    return NextResponse.json({
      success: true,
      responders,
      count: responders.length,
      location: { lat, lng },
      radius: `${radius} km`,
      ...(lastError && responders.length === 0 ? { warning: lastError } : {}),
    })
  } catch (error: any) {
    console.error("[Nearby API] Error:", error)
    return NextResponse.json(
      { success: false, responders: [], count: 0, error: error.message },
      { status: 500 }
    )
  }
}
