"use client"

import { Card } from "@/components/ui/card"
import { Clock, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { supabase } from "@/lib/supabase"

interface ActivityItem {
  id: string
  type: string
  message: string
  time: string
}

export function RecentActivity() {
  const { t } = useGlobalTranslation()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/alerts?limit=8')
        if (res.ok) {
          const data = await res.json()
          const mapped = (data || []).map((a: any) => ({
            id: a.id,
            type: a.emergency_type || a.type || 'alert',
            message: a.message || a.summary || a.original_message || 'Emergency Alert',
            time: new Date(a.created_at || Date.now()).toLocaleString(),
          }))
          setItems(mapped)
        } else {
          setItems([])
        }
      } catch (e) {
        console.error('Failed to load recent activity', e)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()

    // Subscribe to realtime updates for new alerts
    const channel = supabase
      .channel('recent_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const newAlert = payload.new as any
          const newItem: ActivityItem = {
            id: newAlert.id,
            type: newAlert.emergency_type || 'alert',
            message: newAlert.message || newAlert.original_message || 'Emergency Alert',
            time: new Date(newAlert.created_at || Date.now()).toLocaleString(),
          }
          setItems(prev => [newItem, ...prev].slice(0, 8))
        }
      )
      .subscribe()

    // Refresh data every 30 seconds
    const interval = setInterval(load, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  return (
    <Card className="border-2">
      <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('recentActivity', 'Recent Activity')}</h3>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('loading', 'Loading...')}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('noRecentActivity', 'No recent activity')}</div>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">{it.message}</div>
                <div className="text-xs text-muted-foreground">{it.type}</div>
              </div>
              <div className="text-xs text-muted-foreground">{it.time}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
