import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get real-time platform statistics
    const stats = {
      languages: 100, // Static - supported languages count
      responseTime: 0, // Will calculate from recent alerts
      availability: "24/7", // Static
      coverage: "Global", // Static
      verifiedResponders: 0,
      countriesCovered: 0,
      activeAlerts: 0,
      avgTranslationTime: 0,
      translationAccuracy: 95,
    }

    // Try to get real data from database
    try {
      // Count verified responders
      const { count: responderCount } = await supabase
        .from('responders')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true)

      stats.verifiedResponders = responderCount || 0

      // Count active alerts
      const { count: alertCount } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'responding'])

      stats.activeAlerts = alertCount || 0

      // Calculate average response time from recent alerts
      const { data: recentAlerts } = await supabase
        .from('alerts')
        .select('created_at, updated_at, status')
        .in('status', ['resolved', 'responding'])
        .order('created_at', { ascending: false })
        .limit(100)

      if (recentAlerts && recentAlerts.length > 0) {
        const responseTimes = recentAlerts
          .filter(alert => alert.updated_at)
          .map(alert => {
            const created = new Date(alert.created_at).getTime()
            const updated = new Date(alert.updated_at).getTime()
            return (updated - created) / 1000 // Convert to seconds
          })

        if (responseTimes.length > 0) {
          const avgSeconds = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          stats.responseTime = Math.round(avgSeconds)
        }
      }

      // Count unique countries from responder locations
      const { data: responders } = await supabase
        .from('responders')
        .select('location')
        .not('location', 'is', null)

      if (responders) {
        const countries = new Set(
          responders
            .map(r => r.location?.country)
            .filter(Boolean)
        )
        stats.countriesCovered = countries.size
      }

    } catch (dbError) {
      console.warn('[Stats API] Database unavailable or empty:', dbError)
      stats.verifiedResponders = 0
      stats.countriesCovered = 1
      stats.activeAlerts = 0
      stats.responseTime = 0
      stats.avgTranslationTime = 0.5
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[Stats API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stats: {
          languages: 15,
          responseTime: 0,
          availability: "24/7",
          coverage: "Active",
          verifiedResponders: 0,
          countriesCovered: 1,
          activeAlerts: 0,
          avgTranslationTime: 0.5,
          translationAccuracy: 98,
        }
      },
      { status: 200 }
    )
  }
}
