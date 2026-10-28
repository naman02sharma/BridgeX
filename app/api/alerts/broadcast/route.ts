import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { alertId, radius } = await request.json()

    console.log("[v0] Broadcasting alert", alertId, "to all responders within", radius, "km")

    // Get all verified responders for emergency broadcast
    const { data: responders, error } = await supabase
      .from('responders')
      .select('user_id')
      .eq('verification_status', 'verified')
      .eq('active', true)

    if (error) throw error

    // Create broadcast notifications
    if (responders && responders.length > 0) {
      const notifications = responders.map(responder => ({
        user_id: responder.user_id,
        alert_id: alertId,
        title: "🚨 EMERGENCY BROADCAST",
        body: `Critical emergency broadcast - all units respond`,
        data: { alertId, broadcast: true, radius },
        priority: 'high',
        created_at: new Date().toISOString()
      }))

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) throw notifError
    }

    // Broadcast via Supabase realtime channel
    const broadcastChannel = supabase.channel(`alert_broadcast_${alertId}`)
    await broadcastChannel.send({
      type: 'broadcast',
      event: 'emergency_alert',
      payload: {
        alertId,
        type: 'broadcast',
        radius,
        timestamp: new Date().toISOString(),
        respondersNotified: responders?.length || 0
      }
    })

    return NextResponse.json({
      success: true,
      broadcast: true,
      radius,
      respondersNotified: responders?.length || 0,
      realtimeBroadcast: true
    })
  } catch (error) {
    console.error("[v0] Broadcast error:", error)
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 })
  }
}
