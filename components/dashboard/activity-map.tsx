"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Radio } from "lucide-react"

export function ActivityMap() {
  return (
    <Card className="border-2">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Activity Heatmap</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Radio className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
      </div>

      <div className="relative h-64 bg-muted/10">
        {/* Map Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px]" />

        {/* Activity Hotspots */}
        <div className="absolute top-1/4 left-1/3 w-20 h-20 bg-red-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-1/2 left-2/3 w-16 h-16 bg-orange-500/20 rounded-full blur-xl animate-pulse animation-delay-500" />
        <div className="absolute bottom-1/4 left-1/2 w-12 h-12 bg-yellow-500/20 rounded-full blur-lg animate-pulse animation-delay-1000" />

        {/* Alert Markers */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-background shadow-lg" />
        </div>
        <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-background shadow-lg" />
        </div>
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-background shadow-lg" />
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-card border rounded-lg p-3 shadow-lg">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="font-bold text-lg text-red-500">8</div>
                <div className="text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="font-bold text-lg text-blue-500">5</div>
                <div className="text-muted-foreground">Responding</div>
              </div>
              <div>
                <div className="font-bold text-lg text-green-500">24</div>
                <div className="text-muted-foreground">Resolved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
