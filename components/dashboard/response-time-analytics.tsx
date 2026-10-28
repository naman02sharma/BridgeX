"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface ResponseTimeItem {
  emergency_type: string
  avg_response_seconds: number
  min_response_seconds: number
  max_response_seconds: number
  total_resolved: number
}

export function ResponseTimeAnalytics() {
  const [data, setData] = useState<ResponseTimeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/response-time?days=7')
        if (response.ok) {
          const result = await response.json()
          setData(result || [])
        }
      } catch (error) {
        console.error('Failed to fetch response time data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('response_times')
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'text-red-500 bg-red-50'
      case 'fire': return 'text-orange-500 bg-orange-50'
      case 'security': return 'text-blue-500 bg-blue-50'
      case 'other': return 'text-gray-500 bg-gray-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const formatSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const totalResponses = data.reduce((sum, item) => sum + Number(item.total_resolved), 0)
  const avgOverall = data.length > 0 
    ? data.reduce((sum, item) => sum + Number(item.avg_response_seconds), 0) / data.length 
    : 0

  return (
    <Card className="border-2">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Response Time Analytics</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {totalResponses} responses
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No response time data available
          </div>
        ) : (
          <>
            {/* Average Response Times by Emergency Type */}
            <div>
              <h4 className="font-medium mb-3 text-foreground">Average Response Time by Type</h4>
              <div className="space-y-3">
                {data.map((item) => (
                  <div key={item.emergency_type} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getTypeColor(item.emergency_type)} border-0 capitalize`}>
                        {item.emergency_type}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-medium">{formatSeconds(item.avg_response_seconds)} average</div>
                        <div className="text-muted-foreground">{item.total_resolved} responses</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{formatSeconds(item.min_response_seconds)} - {formatSeconds(item.max_response_seconds)} range</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">Performance Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-700">Overall Average</div>
                  <div className="text-2xl font-bold text-blue-600">{formatSeconds(avgOverall)}</div>
                  <div className="text-xs text-blue-500 mt-1">Across all emergency types</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-medium text-green-700">Total Resolved</div>
                  <div className="text-2xl font-bold text-green-600">{totalResponses}</div>
                  <div className="text-xs text-green-500 mt-1">Successfully responded alerts</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}