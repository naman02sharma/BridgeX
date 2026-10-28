import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { getRequestUser } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

/** The logged-in responder's inbox: every alert they were notified about + its current state. */
export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const db = getServerSupabase()
    const { data: responder } = await db
      .from("responders")
      .select("id, organization, specializations, response_radius, active, verification_status")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    if (!responder) return NextResponse.json({ success: true, responder: null, alerts: [] })

    const { data: notes, error } = await db
      .from("notifications")
      .select("id, alert_id, title, message, body, status, priority, read, data, created_at")
      .eq("user_id", user.id)
      .eq("type", "alert")
      .not("alert_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(30)
    if (error) throw error

    const alertIds = Array.from(new Set((notes || []).map((n: any) => n.alert_id)))
    const { data: alerts } = alertIds.length
      ? await db.from("alerts").select("id, status, accepted_by, message, original_message, emergency_type, urgency_level, location, created_at").in("id", alertIds)
      : { data: [] as any[] }
    const alertOf = new Map<string, any>((alerts || []).map((a: any) => [a.id, a]))

    const items = (notes || []).map((n: any) => {
      const a = alertOf.get(n.alert_id)
      const mine = a?.accepted_by === user.id
      let state: "pending" | "accepted" | "taken" | "cancelled" | "resolved" | "declined" = "pending"
      if (n.status === "declined") state = "declined"
      else if (a?.status === "resolved") state = mine ? "resolved" : "cancelled"
      else if (a?.status === "cancelled") state = "cancelled"
      else if (a?.accepted_by) state = mine ? "accepted" : "taken"
      else if (n.status === "cancelled") state = "cancelled"
      return {
        notificationId: n.id,
        alertId: n.alert_id,
        state,
        emergencyType: a?.emergency_type || n.data?.emergencyType || "other",
        urgency: a?.urgency_level || n.data?.urgency || "high",
        message: a?.message || n.message || n.body || "",
        originalMessage: a?.original_message || null,
        distanceKm: n.data?.distanceKm ?? null,
        escalated: !!n.data?.escalated,
        location: a?.location || n.data?.location || null,
        createdAt: n.created_at,
      }
    })

    return NextResponse.json({ success: true, responder, alerts: items })
  } catch (error: any) {
    console.error("[responders/alerts]", error)
    return NextResponse.json({ success: false, error: error?.message || "Failed to load alerts" }, { status: 500 })
  }
}
