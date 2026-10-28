import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
]

const CACHE_TTL = 10 * 60 * 1000
const cache = new Map<string, { at: number; places: any[] }>()

function distanceM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildQuery(lat: number, lon: number, r: number) {
  const around = `(around:${r},${lat},${lon})`
  // Comprehensive emergency query covering nodes, ways and relations across standard & healthcare tags
  return `[out:json][timeout:15];(
    node["amenity"="hospital"]${around};
    way["amenity"="hospital"]${around};
    relation["amenity"="hospital"]${around};
    node["healthcare"="hospital"]${around};
    way["healthcare"="hospital"]${around};
    node["amenity"="clinic"]${around};
    way["amenity"="clinic"]${around};
    node["healthcare"="centre"]${around};
    node["healthcare"="clinic"]${around};
    node["amenity"="doctors"]${around};
    node["amenity"="pharmacy"]${around};
    node["amenity"="police"]${around};
    node["amenity"="fire_station"]${around};
    way["amenity"="fire_station"]${around};
    way["amenity"="police"]${around};
  );out center tags 120;`
}

async function queryOverpass(query: string) {
  let lastError = "Overpass unavailable"
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "BridgeX/2.0 (Emergency Response App)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      })
      if (!res.ok) {
        lastError = `Overpass ${res.status}`
        continue
      }
      const text = await res.text()
      if (!text.trim().startsWith("{")) {
        lastError = "Overpass busy"
        continue
      }
      const json = JSON.parse(text)
      if (Array.isArray(json.elements)) return json.elements as any[]
    } catch (err: any) {
      lastError = err?.name === "TimeoutError" ? "Overpass timed out" : err?.message || lastError
    }
  }
  throw new Error(lastError)
}

function toPlaces(elements: any[], lat: number, lon: number) {
  const places: any[] = []
  for (const el of elements) {
    const tags = el.tags || {}
    const elLat = el.center?.lat ?? el.lat
    const elLon = el.center?.lon ?? el.lon
    if (typeof elLat !== "number" || typeof elLon !== "number") continue

    let category = "emergency"
    if (tags.amenity === "hospital" || tags.healthcare === "hospital") category = "hospital"
    else if (tags.amenity === "clinic" || tags.healthcare === "clinic" || tags.healthcare === "centre" || tags.amenity === "doctors") category = "clinic"
    else if (tags.amenity === "pharmacy" || tags.healthcare === "pharmacy") category = "pharmacy"
    else if (tags.amenity === "police") category = "police"
    else if (tags.amenity === "fire_station") category = "fire_station"
    else if (["ngo", "charity", "association"].includes(tags.office)) category = "ngo"

    const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:postcode"]]
      .filter(Boolean)
      .join(", ")

    places.push({
      id: `${el.type || "osm"}-${el.id}`,
      name: tags.name || tags.operator || tags.brand || `${category.replace("_", " ").toUpperCase()}`,
      category,
      lat: elLat,
      lon: elLon,
      distance: distanceM(lat, lon, elLat, elLon),
      address: address || undefined,
      phone: tags.phone || tags["contact:phone"],
      website: tags.website || tags["contact:website"],
      openingHours: tags.opening_hours,
      emergency: tags.emergency === "yes" || category === "hospital",
    })
  }
  places.sort((a, b) => a.distance - b.distance)
  return places.slice(0, 150)
}

/** Fallback to Photon OpenStreetMap search when Overpass is throttled */
async function queryPhotonFallback(lat: number, lon: number, radiusMeters: number) {
  const categories = ["hospital", "emergency hospital", "clinic", "police", "pharmacy", "fire station"]
  const results: any[] = []
  const seen = new Set<string>()

  for (const cat of categories) {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cat)}&lat=${lat}&lon=${lon}&limit=20`
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
      if (!res.ok) continue
      const data = await res.json()
      if (!Array.isArray(data.features)) continue

      for (const feat of data.features) {
        const coords = feat.geometry?.coordinates
        if (!Array.isArray(coords) || coords.length < 2) continue
        const pLon = coords[0]
        const pLat = coords[1]
        const dist = distanceM(lat, lon, pLat, pLon)

        if (dist > radiusMeters) continue

        const id = `photon-${feat.properties?.osm_id || `${pLat}-${pLon}`}`
        if (seen.has(id)) continue
        seen.add(id)

        const props = feat.properties || {}
        let category: "hospital" | "clinic" | "pharmacy" | "police" | "fire_station" | "emergency" = "emergency"
        if (cat.includes("hospital")) category = "hospital"
        else if (cat === "clinic") category = "clinic"
        else if (cat === "police") category = "police"
        else if (cat === "pharmacy") category = "pharmacy"
        else if (cat === "fire station") category = "fire_station"

        const addr = [props.street, props.district || props.locality, props.city || props.county].filter(Boolean).join(", ")

        results.push({
          id,
          name: props.name || `${category.replace("_", " ").toUpperCase()}`,
          category,
          lat: pLat,
          lon: pLon,
          distance: dist,
          address: addr || undefined,
          phone: props.phone,
          emergency: category === "hospital",
        })
      }
    } catch {
      // Continue to next category
    }
  }

  results.sort((a, b) => a.distance - b.distance)
  return results.slice(0, 100)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get("lat") || "")
  const lon = parseFloat(searchParams.get("lon") || searchParams.get("lng") || "")
  const radius = Math.min(Math.max(parseInt(searchParams.get("radius") || "20000", 10) || 20000, 500), 25000)

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ success: false, places: [], error: "Valid lat and lon are required" }, { status: 400 })
  }

  const key = `${lat.toFixed(3)}:${lon.toFixed(3)}:${radius}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return NextResponse.json({ success: true, places: hit.places, cached: true })
  }

  // 1. Try Overpass first
  try {
    const elements = await queryOverpass(buildQuery(lat, lon, radius))
    const places = toPlaces(elements, lat, lon)
    if (places.length > 0) {
      cache.set(key, { at: Date.now(), places })
      return NextResponse.json({ success: true, places })
    }
  } catch (err: any) {
    console.warn("[places] Overpass mirrors failed, using Photon OSM fallback:", err?.message)
  }

  // 2. High-speed Photon OpenStreetMap fallback
  try {
    const fallbackPlaces = await queryPhotonFallback(lat, lon, radius)
    if (fallbackPlaces.length > 0) {
      cache.set(key, { at: Date.now(), places: fallbackPlaces })
      return NextResponse.json({ success: true, places: fallbackPlaces, fallback: "photon" })
    }
  } catch (photonErr: any) {
    console.warn("[places] Photon fallback error:", photonErr?.message)
  }

  if (hit) {
    return NextResponse.json({ success: true, places: hit.places, cached: true, stale: true })
  }

  return NextResponse.json({
    success: true,
    places: [],
    radius: `${radius / 1000}km`,
  })
}
