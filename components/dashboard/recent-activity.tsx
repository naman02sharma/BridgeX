"use client"

import { Card } from "@/components/ui/card"
import { Clock, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { useSupabase } from "@/components/supabase-provider"
import { supabase } from "@/lib/supabase"

interface ActivityItem {
  id: string
  type: string
  message: string
  time: string
}

export function RecentActivity() {
  const { t } = useGlobalTranslation()
  const { user } = useSupabase()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const orgName = ((user as any)?.organization || (user as any)?.user_metadata?.organization || "").toLowerCase()
  const rawRole = ((user as any)?.role || (user as any)?.user_metadata?.responderRole || (user as any)?.user_metadata?.specificRole || "").toLowerCase()
  const rawSpec = ((user as any)?.specialization || "").toLowerCase()

  const isHospitalOrg = rawRole === "hospital" || rawSpec === "hospital" || rawRole === "medical" || rawSpec === "medical" || orgName.includes("hospital") || orgName.includes("medical") || orgName.includes("clinic")
  const isFireOrg = rawRole === "fire" || rawSpec === "fire" || orgName.includes("fire") || orgName.includes("rescue")
  const isPoliceOrg = rawRole === "police" || rawSpec === "police" || rawRole === "security" || rawSpec === "security" || orgName.includes("police") || orgName.includes("security")

  const matchesDepartment = (alertType: string) => {
    const et = (alertType || "").toLowerCase()
    if (isHospitalOrg) return et === "medical" || et === "accident"
    if (isFireOrg) return et === "fire"
    if (isPoliceOrg) return et === "security" || et === "police"
    return true
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/alerts?limit=8')
        if (res.ok) {
          const data = await res.json()
          const mapped = (data || [])
            .filter((a: any) => matchesDepartment(a.emergency_type || a.type || ''))
            .map((a: any) => ({
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
          const alertType = newAlert.emergency_type || 'alert'
          if (!matchesDepartment(alertType)) return

          const newItem: ActivityItem = {
            id: newAlert.id,
            type: alertType,
            message: newAlert.message || newAlert.original_message || 'Emergency Alert',
            time: new Date(newAlert.created_at || Date.now()).toLocaleString(),
          }
          setItems(prev => [newItem, ...prev].slice(0, 8))
        }
      )
      .subscribe()

    // Refresh data every 3 seconds for instant live updates
    const interval = setInterval(load, 3000)

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "bridgex_new_sos_broadcast" || e.key === "bridgex_last_resolved_alert_id") {
        load()
      }
    }
    const onFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") load()
    }
    let bc: BroadcastChannel | null = null
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("bridgex_alerts_bus")
        bc.onmessage = () => load()
      }
    } catch {}

    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorageChange)
      window.addEventListener("focus", onFocus)
      document.addEventListener("visibilitychange", onFocus)
      window.addEventListener("bridgex_new_sos_alert", load)
      window.addEventListener("bridgex_emergency_resolved", load)
    }

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      if (bc) try { bc.close() } catch {}
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorageChange)
        window.removeEventListener("focus", onFocus)
        document.removeEventListener("visibilitychange", onFocus)
        window.removeEventListener("bridgex_new_sos_alert", load)
        window.removeEventListener("bridgex_emergency_resolved", load)
      }
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
