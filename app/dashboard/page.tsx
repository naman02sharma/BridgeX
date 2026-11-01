"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardStats } from "@/components/dashboard/stats"
import { ActiveAlerts } from "@/components/active-alerts"
import { MapView } from "@/components/map-view"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { AlertTrendsChart } from "@/components/dashboard/alert-trends-chart"
import { ResponseTimeAnalytics } from "@/components/dashboard/response-time-analytics"
import { ResponderStatus } from "@/components/dashboard/responder-status"

export default function DashboardPage() {
  const { user, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // If not logged in, redirect to login
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Citizens / Victims have NO dashboard: redirect to Home SOS interface
    const isCitizen = user.role === "user" || user.role === "victim"
    if (isCitizen) {
      toast.info("The operations dashboard is for emergency responders. Citizens can broadcast SOS from the home screen.")
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying responder credentials…</p>
      </div>
    )
  }

  // Block rendering for citizen/victim users
  if (!user || user.role === "user" || user.role === "victim") {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <DashboardHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Operations Overview Stats */}
          <DashboardStats />

          {/* Operational Dispatch Grid: Real Active Alerts + Live Map */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Primary Operations Column: Active Emergency Dispatches & Interactive Map */}
            <div className="lg:col-span-2 space-y-6">
              {/* Live Dispatch Feed with Continuous Audio Siren */}
              <ActiveAlerts />

              {/* Real Leaflet Map with Geolocation & Responder Positions */}
              <div className="rounded-xl overflow-hidden border-2 bg-card">
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Live Emergency Tactical Map</h3>
                    <p className="text-xs text-muted-foreground">Real-time GPS incident locations and nearby response units</p>
                  </div>
                </div>
                <div className="p-2">
                  <MapView />
                </div>
              </div>

              {/* Response Time Analytics */}
              <ResponseTimeAnalytics />
            </div>

            {/* Sidebar Operations: Responders, Activity & Trends */}
            <div className="space-y-6">
              {/* On-Duty Responder Teams */}
              <ResponderStatus />

              {/* Real-time Emergency Activity Log */}
              <RecentActivity />

              {/* Incident Trends Chart */}
              <AlertTrendsChart />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
