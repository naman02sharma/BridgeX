import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { getRequestUser } from "@/lib/api-auth"

const ALLOWED = ["medical", "fire", "rescue", "trauma", "first-aid", "support", "security"]

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ success: false, error: "Please log in to register as a responder" }, { status: 401 })

    const body = await request.json()
    const organization = String(body.organization || "").trim().slice(0, 120)
    const specializations = (Array.isArray(body.specializations) ? body.specializations : []).filter((s: string) => ALLOWED.includes(s))
    const radius = Math.min(Math.max(parseInt(body.responseRadius, 10) || 10, 1), 50)
    if (!organization) return NextResponse.json({ success: false, error: "Organization / name is required" }, { status: 400 })
    if (specializations.length === 0) return NextResponse.json({ success: false, error: "Select at least one specialization" }, { status: 400 })

    const db = getServerSupabase()

    // Make sure the profile row exists (notifications reference it) and mark the role
    const { data: profile } = await db.from("profiles").select("id, role").eq("id", user.id).maybeSingle()
    if (!profile) {
      const { error } = await db.from("profiles").insert({ id: user.id, email: user.email, role: "responder" })
      if (error) throw error
    } else if (profile.role === "user") {
      await db.from("profiles").update({ role: "responder" }).eq("id", user.id)
    }

    const fields = {
      organization,
      specializations,
      response_radius: radius,
      verification_status: "verified", // auto-verified for now (same as before)
      active: true,
      last_active: new Date().toISOString(),
    }
    const { data: existing } = await db.from("responders").select("id").eq("user_id", user.id).limit(1).maybeSingle()
    let responderId = existing?.id as string | undefined
    if (responderId) {
      const { error } = await db.from("responders").update(fields).eq("id", responderId)
      if (error) throw error
    } else {
      const { data, error } = await db.from("responders").insert({ user_id: user.id, ...fields }).select("id").single()
      if (error) throw error
      responderId = data.id
    }

    const lat = Number(body.location?.lat)
    const lng = Number(body.location?.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const { error } = await db.from("responder_locations").upsert(
        {
          responder_id: responderId,
          latitude: lat,
          longitude: lng,
          accuracy: Number(body.location?.accuracy) || null,
          status: "available",
          active: true,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "responder_id" },
      )
      if (error) throw error
    }

    return NextResponse.json({ success: true, responderId, locationSaved: Number.isFinite(lat) && Number.isFinite(lng) })
  } catch (error: any) {
    console.error("[responders/register]", error)
    return NextResponse.json({ success: false, error: error?.message || "Registration failed" }, { status: 500 })
  }
}
