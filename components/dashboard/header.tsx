"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, Bell, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RealTimeNotifications } from "@/components/real-time-notifications"
import { useEffect, useState } from "react"

export function DashboardHeader() {
  const [userId, setUserId] = useState<string>()

  useEffect(() => {
    // Try to get user ID from session storage or generate a demo one
    const storedUserId = sessionStorage.getItem('demo_user_id')
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      // Generate a demo user ID for testing
      const demoUserId = 'demo-user-' + Math.random().toString(36).substring(7)
      sessionStorage.setItem('demo_user_id', demoUserId)
      setUserId(demoUserId)
    }
  }, [])

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Globe className="w-8 h-8 text-primary" strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BridgeX</h1>
              <p className="text-xs text-muted-foreground">Responder Dashboard</p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:flex">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Active Responder
            </Badge>

            {/* Real-time Notifications Component */}
            {userId && <RealTimeNotifications userId={userId} />}

            <Button size="sm" variant="ghost">
              <Settings className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">ER</AvatarFallback>
              </Avatar>
              <Button size="sm" variant="ghost" className="hidden sm:flex">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
