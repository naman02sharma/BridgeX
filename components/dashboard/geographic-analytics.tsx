"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

interface LocationCluster {
  id: string
  latitude: number
  longitude: number
  alertCount: number
  priorities: Record<string, number>
  statuses: Record<string, number>
  avgResponses: number
}

interface GeographicData {
  locationClusters: LocationCluster[]
  totalAlerts: number
  alertsWithLocation: number
  coveragePercentage: number
  regionStats: {
    urban: number
    suburban: number
    rural: number
  }
}

export function GeographicAnalytics() {
  const [data, setData] = useState<GeographicData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/geographic?days=30')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch geographic data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className="border-2">
        <div className="p-4 border-b bg-muted/30">
          <div className="animate-pulse h-6 bg-muted rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    )
  }

  const getPriorityColor = (count: number) => {
    if (count >= 5) return 'bg-red-500'
    if (count >= 3) return 'bg-orange-500'
    if (count >= 1) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPrioritySize = (count: number) => {
    if (count >= 10) return 'w-8 h-8'
    if (count >= 5) return 'w-6 h-6'
    if (count >= 3) return 'w-4 h-4'
    return 'w-3 h-3'
  }

  return (
    <Card className="border-2">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Geographic Alert Distribution</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            {data?.coveragePercentage || 0}% coverage
          </Badge>
        </div>
      </div>

      <div className="p-6">
        {/* Map Visualization */}
        <div className="relative h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-muted-foreground/20 mb-6">
          {/* Simplified world map background */}
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <path d="M50,100 Q100,50 150,100 T250,100 Q300,150 350,100" stroke="currentColor" fill="none" strokeWidth="2"/>
              <circle cx="200" cy="100" r="80" stroke="currentColor" fill="none" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>

          {/* Alert hotspots */}
          {data?.locationClusters.slice(0, 10).map((cluster, index) => {
            // Position clusters randomly but consistently for demo
            const x = 50 + (index * 30) % 300
            const y = 40 + (index * 25) % 120

            return (
              <div
                key={cluster.id}
                className={`absolute rounded-full border-2 border-background shadow-lg cursor-pointer hover:scale-110 transition-transform ${getPriorityColor(cluster.alertCount)} ${getPrioritySize(cluster.alertCount)}`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`
                }}
                title={`${cluster.alertCount} alerts at ${cluster.latitude.toFixed(2)}, ${cluster.longitude.toFixed(2)}`}
              />
            )
          })}

          {/* Legend */}
          <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm rounded p-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>5+ alerts</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>3-4 alerts</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>1-2 alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg text-primary">{data?.totalAlerts || 0}</div>
            <div className="text-sm text-muted-foreground">Total Alerts</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg text-blue-500">{data?.alertsWithLocation || 0}</div>
            <div className="text-sm text-muted-foreground">With Location</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg text-green-500">{data?.regionStats.urban || 0}</div>
            <div className="text-sm text-muted-foreground">Urban Areas</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg text-orange-500">{data?.regionStats.rural || 0}</div>
            <div className="text-sm text-muted-foreground">Rural Areas</div>
          </div>
        </div>

        {/* Top Alert Locations */}
        <div>
          <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Top Alert Locations
          </h4>
          <div className="space-y-2">
            {data?.locationClusters.slice(0, 5).map((cluster) => (
              <div key={cluster.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">
                      {cluster.latitude.toFixed(2)}, {cluster.longitude.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cluster.avgResponses} avg responses
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {cluster.alertCount} alerts
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}