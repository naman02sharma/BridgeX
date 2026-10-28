import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { alertId, location, urgencyLevel, radius } = await request.json()

    console.log("[v0] Notifying responders within", radius, "km of alert:", alertId)

    // Get verified and active responders
    // Note: For production, implement proper geospatial queries
    const { data: responders, error } = await supabase
      .from('responders')
      .select(`
        id,
        user_id,
        organization,
        profiles:user_id (
          name
        )
      `)
      .eq('verification_status', 'verified')
      .eq('active', true)
      .limit(20) // Limit for initial implementation

    if (error) throw error

    // Create notifications for responders
    if (responders && responders.length > 0) {
      const notifications = responders.map(responder => ({
        user_id: responder.user_id,
        alert_id: alertId,
        title: `Emergency Alert: ${urgencyLevel.toUpperCase()} Priority`,
        body: `New emergency requires immediate attention`,
        data: { alertId, location, urgencyLevel, radius }
      }))

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) throw notifError
    }

    return NextResponse.json({
      success: true,
      notified: responders?.length || 0,
      responders: responders?.map(r => ({
        id: r.id,
        name: r.profiles?.[0]?.name || r.organization,
        organization: r.organization
      })) || [],
    })
  } catch (error) {
    console.error("[v0] Notification error:", error)
    return NextResponse.json({ success: false, error: "Failed to notify responders" }, { status: 500 })
  }
}
