"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, MapPin, Navigation, XCircle, Siren } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/auth-fetch"
import { useToast } from "@/hooks/use-toast"
import { ResponderQuickReplies } from "@/components/responder-quick-replies"
import { FirstAidGuide } from "@/components/first-aid-guide"
import { EmergencyBeacon } from "@/components/emergency-beacon"

type State = "pending" | "accepted" | "taken" | "cancelled" | "resolved" | "declined"

interface InboxAlert {
  notificationId: string
  alertId: string
  state: State
  emergencyType: string
  urgency: string
  message: string
  originalMessage: string | null
  sourceLanguage?: string | null
  distanceKm: number | null
  escalated: boolean
  location: { lat?: number; lng?: number } | null
  createdAt: string
}

interface ResponderInfo {
  id: string
  organization: string | null
  specializations: string[]
  active: boolean
}

const TYPE_STYLE: Record<string, string> = {
  medical: "bg-red-600",
  fire: "bg-orange-600",
  accident: "bg-amber-600",
  security: "bg-blue-600",
  natural_disaster: "bg-purple-600",
  other: "bg-gray-600",
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const h = Math.floor(mins / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

const sirenSound = {
  ctx: null as AudioContext | null,
  interval: null as any,
  playing: false,
  start() {
    if (this.playing || typeof window === "undefined") return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx()
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {})
      }
      this.playing = true

      const playPulse = () => {
        if (!this.playing || !this.ctx || this.ctx.state === "closed") return
        try {
          const now = this.ctx.currentTime
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()

          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(750, now)
          osc.frequency.linearRampToValueAtTime(1000, now + 0.3)
          osc.frequency.linearRampToValueAtTime(750, now + 0.6)

          gain.gain.setValueAtTime(0.25, now)
          gain.gain.linearRampToValueAtTime(0.25, now + 0.55)
          gain.gain.linearRampToValueAtTime(0.01, now + 0.65)

          osc.connect(gain)
          gain.connect(this.ctx.destination)

          osc.start(now)
          osc.stop(now + 0.65)
        } catch {
          // Ignore audio errors
        }
      }

      playPulse()
      this.interval = setInterval(playPulse, 700)
    } catch (err) {
      console.warn("Could not start siren sound:", err)
    }
  },
  stop() {
    this.playing = false
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    if (this.ctx && this.ctx.state !== "closed") {
      try {
        this.ctx.close().catch(() => {})
      } catch {}
      this.ctx = null
    }
  }
}

export function ResponderInbox() {
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [responder, setResponder] = useState<ResponderInfo | null>(null)
  const [alerts, setAlerts] = useState<InboxAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [soundMuted, setSoundMuted] = useState(false)
  const knownPending = useRef<Set<string>>(new Set())
  const firstLoad = useRef(true)

  // Siren sounds continuously until all pending alerts are accepted or declined
  useEffect(() => {
    const pendingCount = alerts.filter((a) => a.state === "pending").length
    if (pendingCount > 0 && !soundMuted) {
      sirenSound.start()
    } else {
      sirenSound.stop()
    }
    return () => {
      sirenSound.stop()
    }
  }, [alerts, soundMuted])

  // --- auth ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
      setAuthChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null)
      setAuthChecked(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // --- inbox ---
  const load = useCallback(async () => {
    if (!userId) return
    try {
      const res = await authFetch("/api/responders/alerts", { cache: "no-store" })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to load alerts")
      setError(null)
      setResponder(data.responder)
      const rawList: InboxAlert[] = data.alerts || []
      let decIds: string[] = []
      try {
        const saved = localStorage.getItem("bridgex_declined_alert_ids")
        if (saved) decIds = JSON.parse(saved)
      } catch {}
      const decSet = new Set(decIds)
      const list = rawList.filter((a) => !decSet.has(a.alertId))
      setAlerts(list)

      // Sound + browser notification for alerts we haven't seen yet
      const fresh = list.filter((a) => a.state === "pending" && !knownPending.current.has(a.notificationId))
      list.filter((a) => a.state === "pending").forEach((a) => knownPending.current.add(a.notificationId))
      if (!firstLoad.current && fresh.length > 0) {
        if (!soundMuted) sirenSound.start()
        const a = fresh[0]
        toast({ title: `🚨 New ${a.emergencyType.replace("_", " ")} emergency nearby`, description: a.message, variant: "destructive" })
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`New ${a.emergencyType.replace("_", " ")} emergency nearby`, { body: a.message, icon: "/icon-192x192.png", tag: a.alertId, requireInteraction: true })
        }
      }
      firstLoad.current = false
    } catch (err: any) {
      console.warn("Inbox load failed:", err)
      setError(err?.message || "Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }, [userId, toast])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    firstLoad.current = true
    setLoading(true)
    load()

    // Realtime: new alert (INSERT) or "someone else accepted / sender cancelled" (UPDATE)
    const channel = supabase
      .channel(`responder-inbox-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe()
    // Polling fallback in case realtime isn't enabled for the table
    const poll = setInterval(load, 6000)
    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [userId, load])

  // --- ask for browser notification permission once a responder is signed in ---
  useEffect(() => {
    if (responder && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }
  }, [responder])

  // --- share live location while on duty and this page is open ---
  useEffect(() => {
    if (!responder?.active || !navigator.geolocation) return
    const push = () =>
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          authFetch("/api/responders/me", {
            method: "POST",
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          }).catch(() => {}),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      )
    push()
    const t = setInterval(push, 30000)
    return () => clearInterval(t)
  }, [responder?.active])

  const toggleDuty = async (active: boolean) => {
    setResponder((r) => (r ? { ...r, active } : r))
    const res = await authFetch("/api/responders/me", { method: "POST", body: JSON.stringify({ active }) })
    if (!res.ok) {
      setResponder((r) => (r ? { ...r, active: !active } : r))
      toast({ title: "Couldn't update duty status", variant: "destructive" })
    }
  }

  const act = async (alert: InboxAlert, action: "accept" | "decline" | "resolve") => {
    setBusyId(alert.alertId)
    try {
      const res =
        action === "resolve"
          ? await authFetch(`/api/alerts/${alert.alertId}`, { method: "PATCH", body: JSON.stringify({ action: "resolve" }) })
          : await authFetch(`/api/alerts/${alert.alertId}/${action}`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.success === false) {
        toast({ title: action === "accept" ? "Couldn't accept" : "Action failed", description: data.error || "Please try again", variant: "destructive" })
      } else if (action === "accept") {
        toast({ title: "You accepted this alert", description: "Other responders have been released. Head to the location now." })
      } else if (action === "decline") {
        try {
          const saved = localStorage.getItem("bridgex_declined_alert_ids")
          const parsed = saved ? JSON.parse(saved) : []
          localStorage.setItem("bridgex_declined_alert_ids", JSON.stringify(Array.from(new Set([...parsed, alert.alertId]))))
        } catch {}
        toast({ title: "Alert Declined", description: "You will not see this alert again." })
      } else if (action === "resolve") {
        toast({ title: "Marked as resolved" })
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  // ---------- render ----------
  if (!authChecked || (userId && loading)) {
    return (
      <Card className="p-6 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your responder inbox…
      </Card>
    )
  }

  if (!userId) {
    return (
      <Card className="p-6 text-center space-y-3">
        <Siren className="w-10 h-10 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold">Log in to receive emergency alerts</h3>
        <p className="text-sm text-muted-foreground">Registered responders get SOS alerts from their area in real time.</p>
        <div className="flex gap-2 justify-center">
          <Button asChild><Link href="/auth/login">Log in</Link></Button>
          <Button asChild variant="outline"><Link href="/responders/register">Become a responder</Link></Button>
        </div>
      </Card>
    )
  }

  if (!responder) {
    return (
      <Card className="p-6 text-center space-y-3">
        <Siren className="w-10 h-10 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold">You&apos;re not a registered responder yet</h3>
        <p className="text-sm text-muted-foreground">Register to be notified when someone nearby needs help.</p>
        <Button asChild><Link href="/responders/register">Register as responder</Link></Button>
      </Card>
    )
  }

  const pending = alerts.filter((a) => a.state === "pending")
  const mine = alerts.filter((a) => a.state === "accepted")
  const history = alerts.filter((a) => !["pending", "accepted"].includes(a.state))

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Siren className="w-4 h-4 text-red-500" /> Incoming emergency alerts</h3>
          <p className="text-xs text-muted-foreground">
            {responder.organization || "Responder"} · {responder.specializations.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FirstAidGuide size="sm" variant="outline" triggerClassName="h-8 text-xs" />
          <EmergencyBeacon size="sm" variant="destructive" triggerClassName="h-8 text-xs" />
          <label className="flex items-center gap-2 text-sm ml-2">
            <span className={responder.active ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {responder.active ? "On duty (sharing location)" : "Off duty"}
            </span>
            <Switch checked={responder.active} onCheckedChange={toggleDuty} aria-label="Toggle on duty" />
          </label>
        </div>
      </Card>

      {error && <Card className="p-3 text-sm text-red-600 border-red-300">{error}</Card>}

      {pending.length === 0 && mine.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
          No active emergencies in your area. Keep this page open and you&apos;ll be alerted instantly.
        </Card>
      )}

      {[...pending, ...mine].map((a) => (
        <AlertCard key={a.notificationId} alert={a} busy={busyId === a.alertId} onAct={act} />
      ))}

      {history.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Recent</h4>
          {history.slice(0, 5).map((a) => (
            <AlertCard key={a.notificationId} alert={a} busy={false} onAct={act} />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert, busy, onAct }: { alert: InboxAlert; busy: boolean; onAct: (a: InboxAlert, action: "accept" | "decline" | "resolve") => void }) {
  const { toast } = useToast()
  const lat = Number(alert.location?.lat)
  const lng = Number(alert.location?.lng)
  const hasLoc = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
  const closed = ["taken", "cancelled", "resolved", "declined"].includes(alert.state)
  const closedLabel: Record<string, string> = {
    taken: "Accepted by another responder",
    cancelled: "Cancelled",
    resolved: "Resolved",
    declined: "You declined",
  }

  return (
    <Card className={`p-4 space-y-3 ${alert.state === "pending" ? "border-red-500 border-2" : ""} ${closed ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`${TYPE_STYLE[alert.emergencyType] || TYPE_STYLE.other} text-white border-0 capitalize`}>
          {alert.emergencyType.replace("_", " ")}
        </Badge>
        <Badge variant="outline" className="capitalize">{alert.urgency}</Badge>
        {alert.escalated && <Badge variant="destructive">Escalated</Badge>}
        {alert.distanceKm !== null && (
          <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.distanceKm} km away</span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{timeAgo(alert.createdAt)}</span>
      </div>

      <p className="text-sm font-medium">{alert.message || "Emergency alert"}</p>
      {alert.originalMessage && alert.originalMessage !== alert.message && (
        <p className="text-xs text-muted-foreground">Original: {alert.originalMessage}</p>
      )}

      {alert.state === "accepted" && hasLoc && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noreferrer">
              <Navigation className="w-4 h-4 mr-1" /> Navigate <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noreferrer">
              View on map <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      )}

      {alert.state === "pending" && (
        <div className="flex gap-2">
          <Button className="flex-1 bg-red-600 hover:bg-red-700" disabled={busy} onClick={() => onAct(alert, "accept")}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><AlertTriangle className="w-4 h-4 mr-2" /> Accept &amp; respond</>}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => onAct(alert, "decline")}>Decline</Button>
        </div>
      )}

      {alert.state === "accepted" && (
        <div className="space-y-3">
          {/* Feature 2: Quick Reply Templates (auto-translated to victim's language) */}
          <ResponderQuickReplies
            victimLang={alert.sourceLanguage || "en"}
            victimLangName=""
            onSelectReply={(reply) => {
              // Copy to clipboard so responder can paste into chat
              navigator.clipboard?.writeText(reply).catch(() => {})
              toast({ title: "Copied to clipboard", description: reply.slice(0, 80) + (reply.length > 80 ? "…" : ""), duration: 3000 })
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <Badge className="bg-green-600 text-white border-0"><CheckCircle2 className="w-3 h-3 mr-1" /> You are responding</Badge>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onAct(alert, "resolve")}>Mark resolved</Button>
          </div>
        </div>
      )}

      {closed && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <XCircle className="w-4 h-4" /> {closedLabel[alert.state]}
        </div>
      )}
    </Card>
  )
}
