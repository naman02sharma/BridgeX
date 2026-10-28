"use client"

import { Card } from "@/components/ui/card"
import { AlertTriangle, Users, Clock, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useGlobalTranslation } from "@/components/translation-provider"

interface StatsData {
  totalAlerts: number
  activeAlerts: number
  resolvedAlerts: number
  highPriorityAlerts: number
}

export function DashboardStats() {
  const { t } = useGlobalTranslation()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/alerts?days=7')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Subscribe to realtime updates for alerts
    const channel = supabase
      .channel('dashboard_stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          // Refresh stats when alerts table changes
          fetchStats()
        }
      )
      .subscribe()

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 border-2">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const statsData = [
    {
      title: t('dashboard.stats.activeAlerts', 'Active Alerts'),
      value: stats?.activeAlerts.toString() || "0",
      change: t('dashboard.stats.liveCount', 'Live count'),
      trend: "neutral",
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      title: t('dashboard.stats.totalAlerts', 'Total Alerts'),
      value: stats?.totalAlerts.toString() || "0",
      change: t('dashboard.stats.thisWeek', 'This week'),
      trend: "neutral",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: t('dashboard.stats.highPriority', 'High Priority'),
      value: stats?.highPriorityAlerts.toString() || "0",
      change: t('dashboard.stats.requiresAttention', 'Requires attention'),
      trend: "neutral",
      icon: Clock,
      color: "text-orange-500",
    },
    {
      title: t('dashboard.stats.resolved', 'Resolved'),
      value: stats?.resolvedAlerts.toString() || "0",
      change: t('dashboard.stats.thisWeek', 'This week'),
      trend: "up",
      icon: CheckCircle2,
      color: "text-green-500",
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : null

        return (
          <Card key={stat.title} className="p-6 border-2 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              {TrendIcon && (
                <TrendIcon className={`w-4 h-4 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`} />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1 text-foreground">{stat.value}</h3>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
