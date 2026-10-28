"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface TrendData {
  date: string
  total_count: number
  medical_count: number
  fire_count: number
  security_count: number
  other_count: number
}

export function AlertTrendsChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/trends?days=7')
        if (response.ok) {
          const result = await response.json()
          setData(result || [])
        }
      } catch (error) {
        console.error('Failed to fetch alert trends:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('alert_trends')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <Card className="border-2">
        <div className="p-4 border-b bg-muted/30">
          <div className="animate-pulse h-6 bg-muted rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map(d => d.total_count), 1)

  return (
    <Card className="border-2">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Alert Trends (7 Days)</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Daily
          </Badge>
        </div>
      </div>

      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No alert data available for the selected period
          </div>
        ) : (
          <div className="space-y-4">
            {data.slice(0, 7).map((day, index) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-16 text-sm text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium">{day.total_count} alerts</div>
                    <div className="text-xs text-muted-foreground">
                      Medical: {day.medical_count}, Fire: {day.fire_count}, Security: {day.security_count}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max((day.total_count / maxValue) * 100, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-lg text-primary">
                {data.reduce((sum, d) => sum + d.total_count, 0)}
              </div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="font-bold text-lg text-red-500">
                {data.reduce((sum, d) => sum + d.medical_count, 0)}
              </div>
              <div className="text-muted-foreground">Medical</div>
            </div>
            <div>
              <div className="font-bold text-lg text-orange-500">
                {data.reduce((sum, d) => sum + d.fire_count, 0)}
              </div>
              <div className="text-muted-foreground">Fire</div>
            </div>
            <div>
              <div className="font-bold text-lg text-blue-500">
                {data.reduce((sum, d) => sum + d.security_count, 0)}
              </div>
              <div className="text-muted-foreground">Security</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}