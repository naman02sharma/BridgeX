"use client"

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
