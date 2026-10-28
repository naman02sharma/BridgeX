import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { getRequestUser } from "@/lib/api-auth"

/** POST { lat?, lng?, accuracy?, active? } - update my live location and/or on-duty status. */
export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const db = getServerSupabase()
    const { data: responder } = await db.from("responders").select("id, active").eq("user_id", user.id).limit(1).maybeSingle()
    if (!responder) return NextResponse.json({ success: false, error: "You are not registered as a responder" }, { status: 404 })

    const now = new Date().toISOString()
    let active = responder.active as boolean
    if (typeof body.active === "boolean") {
      active = body.active
      await db.from("responders").update({ active, last_active: now }).eq("id", responder.id)
    }

    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const { error } = await db.from("responder_locations").upsert(
        {
          responder_id: responder.id,
          latitude: lat,
          longitude: lng,
          accuracy: Number(body.accuracy) || null,
          status: active ? "available" : "offline",
          active,
          last_updated: now,
        },
        { onConflict: "responder_id" },
      )
      if (error) throw error
    } else if (typeof body.active === "boolean") {
      await db.from("responder_locations").update({ status: active ? "available" : "offline", active }).eq("responder_id", responder.id)
    }

    return NextResponse.json({ success: true, active })
  } catch (error: any) {
    console.error("[responders/me]", error)
    return NextResponse.json({ success: false, error: error?.message || "Update failed" }, { status: 500 })
  }
}
