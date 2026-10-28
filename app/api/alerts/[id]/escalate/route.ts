import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { dispatchAlert } from "@/lib/dispatch"
import { isUuid } from "@/lib/api-auth"

type Ctx = { params: Promise<{ id: string }> }

/** Panic escalation: nobody accepted in time -> widen the radius and notify every matching/any responder once. */
export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isUuid(id)) return NextResponse.json({ success: true, notified: 0, mock: true })
    const db = getServerSupabase()
    const { data: alert } = await db.from("alerts").select("*").eq("id", id).maybeSingle()
    if (!alert) return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 })
    if (alert.status !== "active" || alert.accepted_by || alert.panic_mode) {
      return NextResponse.json({ success: true, notified: 0, skipped: true })
    }
    await db.from("alerts").update({ panic_mode: true }).eq("id", id)
    const result = await dispatchAlert(db, alert, { widen: true })
    return NextResponse.json({ success: true, notified: result.notified })
  } catch (error: any) {
    console.error("[alerts/escalate]", error)
    return NextResponse.json({ success: false, error: error?.message || "Failed" }, { status: 500 })
  }
}
