import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-server"
import { getRequestUser } from "@/lib/api-auth"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const db = getServerSupabase()
    const { error } = await db
      .from("notifications")
      .update({ status: "declined", read: true })
      .eq("alert_id", id)
      .eq("user_id", user.id)
      .eq("type", "alert")
      .eq("status", "pending")
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed" }, { status: 500 })
  }
}
