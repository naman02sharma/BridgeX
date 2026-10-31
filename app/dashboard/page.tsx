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
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { AlertTrendsChart } from "@/components/dashboard/alert-trends-chart"
import { ResponseTimeAnalytics } from "@/components/dashboard/response-time-analytics"
import { GeographicAnalytics } from "@/components/dashboard/geographic-analytics"
import { ActivityMap } from "@/components/dashboard/activity-map"
import { ResponderStatus } from "@/components/dashboard/responder-status"
import { RealtimeTestPanel } from "@/components/realtime-test-panel"
import { DatabaseTestPanel } from "@/components/database-test-panel"

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-3">
              <DashboardStats />
            </div>

          </div>

          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <AlertTrendsChart />
              <ResponseTimeAnalytics />
              <RealtimeTestPanel />
              <DatabaseTestPanel />
            </div>
            <div className="space-y-6">
              <RecentActivity />
              <GeographicAnalytics />
              <ActivityMap />
              <ResponderStatus />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
