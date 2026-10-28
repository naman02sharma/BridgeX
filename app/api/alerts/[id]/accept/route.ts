import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { getRequestUser } from "@/lib/api-auth"

type Ctx = { params: Promise<{ id: string }> }

/**
 * A responder accepts an SOS.
 * The UPDATE below only succeeds while the alert is still `active` and has no
 * `accepted_by`, so even if two responders click at the same instant Postgres
 * lets exactly one win. Everyone else's card is cancelled.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ success: false, error: "Please log in as a responder" }, { status: 401 })

    const db = getServerSupabase()
    
    // Ensure responder record exists for this user (auto-onboard if needed)
    let { data: responder } = await db
      .from("responders")
      .select("id, organization, name, verification_status, active")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    if (!responder) {
      // Auto-register responder profile
      const { data: newResponder } = await db
        .from("responders")
        .insert({
          user_id: user.id,
          name: (user as any).user_metadata?.name || user.email || "Emergency Responder",
          organization: "Volunteer Responder",
          verification_status: "verified",
          specializations: ["medical", "fire", "security", "first_aid", "rescue"],
          response_radius: 50,
          active: true,
        })
        .select()
        .single()
      responder = newResponder
    }

    const now = new Date().toISOString()
    const { data: won, error } = await db
      .from("alerts")
      .update({
        status: "responding",
        accepted_by: user.id,
        accepted_at: now,
        responder_phone: (user as any).user_metadata?.phone || (user as any).phone || null,
        responders: [user.id]
      })
      .eq("id", id)
      .is("accepted_by", null)
      .select("*")
      .maybeSingle()
    if (error) throw error

    if (!won) {
      const { data: current } = await db.from("alerts").select("status, accepted_by").eq("id", id).maybeSingle()
      if (current?.accepted_by === user.id) return NextResponse.json({ success: true, alreadyYours: true })
      const reason =
        current?.status === "cancelled" ? "The sender cancelled this alert."
        : current?.status === "resolved" ? "This alert is already resolved."
        : "Another responder has already approved and accepted this alert."
      return NextResponse.json({ success: false, error: reason }, { status: 409 })
    }

    // Winner's card -> accepted
    await db.from("notifications").update({ status: "accepted", read: true }).eq("alert_id", id).eq("user_id", user.id).eq("type", "alert")

    // Everyone else who was notified -> cancelled (realtime UPDATE removes it from their screen)
    await db
      .from("notifications")
      .update({
        status: "cancelled",
        read: false,
        title: "Alert accepted by another responder",
        message: "Another responder is already handling this emergency. You no longer need to respond.",
        body: "Another responder is already handling this emergency. You no longer need to respond.",
      })
      .eq("alert_id", id)
      .eq("type", "alert")
      .neq("user_id", user.id)

    if (responder?.id) {
      await db.from("responder_locations").update({ status: "responding" }).eq("responder_id", responder.id)
    }

    // Tell the sender (if they have an account)
    if (won.user_id) {
      const respName = responder?.name || responder?.organization || "A responder"
      await db.from("notifications").insert({
        user_id: won.user_id,
        alert_id: id,
        title: "Help is on the way",
        message: `${respName} accepted your SOS.`,
        body: `${respName} accepted your SOS.`,
        type: "success",
        priority: "high",
        status: "accepted",
      })
    }

    return NextResponse.json({ success: true, alert: won })
  } catch (error: any) {
    console.error("[alerts/accept]", error)
    return NextResponse.json({ success: false, error: error?.message || "Failed to accept" }, { status: 500 })
  }
}
