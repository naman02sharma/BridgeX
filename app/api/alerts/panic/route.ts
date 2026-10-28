import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { alertId } = await request.json()

    console.log("[v0] PANIC MODE ACTIVATED for alert:", alertId)

    // Update alert to panic mode
    const { error: updateError } = await supabase
      .from('alerts')
      .update({
        panic_mode: true,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (updateError) throw updateError

    // Get all verified responders for critical broadcast
    const { data: responders, error: respondersError } = await supabase
      .from('responders')
      .select('user_id')
      .eq('verification_status', 'verified')
      .eq('active', true)

    if (respondersError) throw respondersError

    // Create critical notifications for all responders
    if (responders && responders.length > 0) {
      const notifications = responders.map(responder => ({
        user_id: responder.user_id,
        alert_id: alertId,
        title: "🚨 CRITICAL EMERGENCY - PANIC MODE",
        body: "Immediate response required - life-threatening situation",
        data: { alertId, priority: 'critical', panicMode: true },
        priority: 'critical',
        created_at: new Date().toISOString()
      }))

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) throw notifError
    }

    // Broadcast panic mode via Supabase realtime channel
    const panicChannel = supabase.channel(`alert_panic_${alertId}`)
    await panicChannel.send({
      type: 'broadcast',
      event: 'panic_mode_activated',
      payload: {
        alertId,
        type: 'panic',
        timestamp: new Date().toISOString(),
        respondersNotified: responders?.length || 0,
        message: "PANIC MODE ACTIVATED - All units respond immediately"
      }
    })

    return NextResponse.json({
      success: true,
      message: "Panic mode activated - all responders notified",
      realtimeBroadcast: true,
      respondersNotified: responders?.length || 0
    })
  } catch (error) {
    console.error("[v0] Panic mode activation error:", error)
    return NextResponse.json({ success: false, error: "Failed to activate panic mode" }, { status: 500 })
  }
}
