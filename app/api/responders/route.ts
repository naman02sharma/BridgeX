import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { distanceKm } from "@/lib/dispatch"

export const dynamic = "force-dynamic"

/**
 * Public list of verified, on-duty responders.
 * Optional ?lat=&lng=&radius=(meters) adds distance + radius filtering.
 * (Uses the service role because row-level security hides other users' rows.)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get("lat") || "")
    const lng = parseFloat(searchParams.get("lng") || "")
    const radiusKm = (parseFloat(searchParams.get("radius") || "") || 0) / 1000
    const hasPoint = Number.isFinite(lat) && Number.isFinite(lng)

    const db = getServerSupabase()
    const { data: responders, error } = await db
      .from("responders")
      .select("*")
      .eq("verification_status", "verified")
      .eq("active", true)
      .order("last_active", { ascending: false })
      .limit(200)
    if (error) throw error

    const ids = (responders || []).map((r: any) => r.id)
    const { data: locations } = ids.length
      ? await db.from("responder_locations").select("*").in("responder_id", ids)
      : { data: [] as any[] }
    const locOf = new Map<string, any>((locations || []).map((l: any) => [l.responder_id, l]))

    const list = (responders || [])
      .map((r: any) => {
        const loc = locOf.get(r.id)
        const hasLoc = loc && loc.latitude != null && loc.longitude != null
        const dKm = hasPoint && hasLoc ? distanceKm(lat, lng, Number(loc.latitude), Number(loc.longitude)) : null
        return {
          id: r.id,
          name: r.name || r.organization || "Responder",
          organization: r.organization || "Independent",
          type: r.specializations?.[0] || "responder",
          specializations: r.specializations || [],
          verified: true,
          available: loc ? loc.status !== "offline" && loc.status !== "busy" : true,
          status: loc?.status || "available",
          last_active: loc?.last_updated || r.last_active || r.created_at,
          distanceKm: dKm === null ? null : Math.round(dKm * 10) / 10,
          distance: dKm === null ? null : Math.round(dKm * 1000),
          // coordinates are only returned when the caller supplied a point (used by the live map)
          ...(hasPoint && hasLoc ? { lat: Number(loc.latitude), lng: Number(loc.longitude), location: { lat: Number(loc.latitude), lng: Number(loc.longitude) } } : {}),
        }
      })
      .filter((r: any) => !(hasPoint && radiusKm > 0 && r.distanceKm !== null && r.distanceKm > radiusKm))
      .sort((a: any, b: any) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9))

    return NextResponse.json({ success: true, responders: list, total: list.length })
  } catch (error: any) {
    console.warn("[responders] list failed:", error?.message)
    return NextResponse.json({ success: false, responders: [], total: 0, error: error?.message || "Failed to load responders" })
  }
}
