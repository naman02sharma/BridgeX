import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { getRequestUser, isUuid } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** Status poll used by the sender's screen. Ids are unguessable UUIDs; only minimal info is returned. */
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ success: true, status: "active", mock: true })
  try {
    const db = getServerSupabase()
    const { data: alert, error } = await db.from("alerts").select("id, status, accepted_by, accepted_at").eq("id", id).maybeSingle()
    if (error) throw error
    if (!alert) return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 })

    let responder: { name: string } | null = null
    if (alert.accepted_by) {
      const { data } = await db.from("responders").select("organization, name").eq("user_id", alert.accepted_by).limit(1).maybeSingle()
      responder = { name: data?.name || data?.organization || "A responder" }
    }
    const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("alert_id", id).eq("type", "alert")
    return NextResponse.json({ success: true, status: alert.status, acceptedAt: alert.accepted_at, responder, notified: count ?? 0 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed" }, { status: 500 })
  }
}

/**
 * PATCH { action: "cancel" | "resolve", guestId? }
 *  - cancel: the sender withdraws the SOS -> every notified responder's card is cancelled
 *  - resolve: the sender or the accepting responder closes the alert
 */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = body.action as "cancel" | "resolve"
    if (!["cancel", "resolve"].includes(action)) return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    if (!isUuid(id)) return NextResponse.json({ success: true, status: action === "cancel" ? "cancelled" : "resolved", mock: true })

    const db = getServerSupabase()
    const { data: alert, error } = await db.from("alerts").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    if (!alert) return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 })

    const user = await getRequestUser(request)
    const isOwner = alert.user_id ? user?.id === alert.user_id : (!!body.guestId && body.guestId === alert.metadata?.guest_id)
    const isAcceptedResponder = !!user && alert.accepted_by === user.id
    const isAnyResponder = !!user // Any authenticated responder or organization member
    if (action === "cancel" && !isOwner) return NextResponse.json({ success: false, error: "Only the sender can cancel this alert" }, { status: 403 })
    if (action === "resolve" && !isOwner && !isAcceptedResponder && !isAnyResponder) return NextResponse.json({ success: false, error: "Not allowed" }, { status: 403 })

    if (["cancelled", "resolved"].includes(alert.status)) return NextResponse.json({ success: true, status: alert.status })

    const now = new Date().toISOString()
    const status = action === "cancel" ? "cancelled" : "resolved"
    const { error: updError } = await db
      .from("alerts")
      .update(action === "cancel" ? { status, cancelled_at: now } : { status, resolved_at: now })
      .eq("id", id)
    if (updError) throw updError

    if (action === "cancel") {
      // Every responder card for this alert (pending or accepted) is closed
      await db
        .from("notifications")
        .update({ status: "cancelled", read: false, title: "Alert cancelled by the sender", message: "The sender cancelled this SOS. No response is needed.", body: "The sender cancelled this SOS. No response is needed." })
        .eq("alert_id", id)
        .eq("type", "alert")
    } else if (action === "resolve") {
      // Mark notifications as resolved
      await db
        .from("notifications")
        .update({ status: "resolved", read: true })
        .eq("alert_id", id)
        .eq("type", "alert")
    }
    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    console.error("[alerts/PATCH]", error)
    return NextResponse.json({ success: false, error: error?.message || "Failed" }, { status: 500 })
  }
}
