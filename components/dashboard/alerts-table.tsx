"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, MessageSquare, Phone, MoreVertical, Loader2, CheckCircle2 } from "lucide-react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { supabase } from "@/lib/supabase"

interface AlertRow {
  id: string
  type: string
  location: string
  time: string
  priority: string
  status: string
  responder: string
  language: string
}

export function AlertsTable() {
  const { t } = useGlobalTranslation()
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, emergency_type, urgency_level, message, location, status, language_code, accepted_by, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

      if (data && !error && data.length > 0) {
        const rows: AlertRow[] = data.map((a: any) => {
          const locStr = a.location?.address || (a.location?.lat ? `${Number(a.location.lat).toFixed(2)}, ${Number(a.location.lng).toFixed(2)}` : "Live Location")
          const minsAgo = Math.max(0, Math.floor((Date.now() - new Date(a.created_at).getTime()) / 60000))
          const timeStr = minsAgo < 1 ? "Just now" : minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`

          return {
            id: a.id.slice(0, 8).toUpperCase(),
            type: (a.emergency_type || "Emergency").replace("_", " "),
            location: locStr,
            time: timeStr,
            priority: a.urgency_level || "high",
            status: a.status || "active",
            responder: a.accepted_by ? "Assigned" : "Searching Responders",
            language: (a.language_code || "EN").toUpperCase(),
          }
        })
        setAlerts(rows)
      } else {
        // Fallback to API
        const res = await fetch("/api/alerts?status=all")
        const json = await res.json()
        if (json.alerts && Array.isArray(json.alerts)) {
          const rows: AlertRow[] = json.alerts.slice(0, 10).map((a: any) => ({
            id: (a.id || "ALT").slice(0, 8).toUpperCase(),
            type: a.emergencyType || a.emergency_type || "Emergency",
            location: a.location?.address || "Active Area",
            time: "Recently",
            priority: a.urgency || a.urgency_level || "high",
            status: a.status || a.state || "active",
            responder: a.acceptedBy || "Pending",
            language: (a.languageCode || a.language_code || "EN").toUpperCase(),
          }))
          setAlerts(rows)
        } else {
          setAlerts([])
        }
      }
    } catch {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()

    const poll = setInterval(fetchAlerts, 2500)

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "bridgex_new_sos_broadcast" || e.key === "bridgex_last_resolved_alert_id") {
        fetchAlerts()
      }
    }
    const onFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") fetchAlerts()
    }
    let bc: BroadcastChannel | null = null
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("bridgex_alerts_bus")
        bc.onmessage = () => fetchAlerts()
      }
    } catch {}

    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorageChange)
      window.addEventListener("focus", onFocus)
      document.addEventListener("visibilitychange", onFocus)
      window.addEventListener("bridgex_new_sos_alert", fetchAlerts)
      window.addEventListener("bridgex_emergency_resolved", fetchAlerts)
    }

    return () => {
      clearInterval(poll)
      if (bc) try { bc.close() } catch {}
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorageChange)
        window.removeEventListener("focus", onFocus)
        document.removeEventListener("visibilitychange", onFocus)
        window.removeEventListener("bridgex_new_sos_alert", fetchAlerts)
        window.removeEventListener("bridgex_emergency_resolved", fetchAlerts)
      }
    }
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      case "responding":
      case "accepted":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "resolved":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <Card className="border-2">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recent SOS Alerts</h2>
            <p className="text-sm text-muted-foreground mt-1">Real-time emergency alerts from active victims</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchAlerts}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm">Loading verified emergency alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" />
          <p className="font-semibold text-foreground text-sm">No Active Emergency Alerts</p>
          <p className="text-xs mt-1">All nearby incidents have been resolved or are clear.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="border-b">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Alert ID</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Location</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Priority</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Responder</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-mono text-sm text-foreground">{alert.id}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {alert.time}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-foreground capitalize">{alert.type}</div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {alert.language}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate max-w-[200px]">{alert.location}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getPriorityColor(alert.priority) as any} className="capitalize">
                      {alert.priority}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={`capitalize ${getStatusColor(alert.status)}`}>{alert.status}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-foreground">{alert.responder}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
