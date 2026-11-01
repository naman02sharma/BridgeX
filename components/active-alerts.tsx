"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Eye,
  CheckCircle,
  X,
  Navigation,
  User,
  Languages,
  Loader2,
  Building2,
  MessageCircle,
  Shield,
  Heart,
  Flame,
  Radio,
  Volume2,
  VolumeX,
  Siren,
  XCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { fetchNearbyPlaces, type NearbyPlace, formatDistance } from "@/lib/geolocation-service"
import { FirstAidGuide } from "@/components/first-aid-guide"
import { EmergencyBeacon } from "@/components/emergency-beacon"

interface Alert {
  id: string
  emergency_type: string
  urgency_level: string
  message: string
  original_message?: string
  language_code?: string
  translated_message?: string
  location: any
  metadata?: any
  created_at: string
  status: string
  user_id: string
  accepted_by?: string | null
  responder_phone?: string
  profiles?: { name?: string; phone?: string }
}

// Emergency Siren Audio Engine (Web Audio API)
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
          // Alert siren sweeping between 750Hz and 1000Hz
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

// Global gesture listener to unlock Web Audio API on first user interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    if (sirenSound.ctx && sirenSound.ctx.state === "suspended") {
      sirenSound.ctx.resume().catch(() => {})
    }
  }
  window.addEventListener("click", unlockAudio, { passive: true })
  window.addEventListener("touchstart", unlockAudio, { passive: true })
  window.addEventListener("keydown", unlockAudio, { passive: true })
}

export function ActiveAlerts() {
  const { user } = useSupabase()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [respondOpen, setRespondOpen] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [responderNameInput, setResponderNameInput] = useState("")
  const [translating, setTranslating] = useState(false)
  const [translatedText, setTranslatedText] = useState("")
  const [mapUrl, setMapUrl] = useState("")
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyPlace[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [soundMuted, setSoundMuted] = useState(false)
  const [declinedAlertIds, setDeclinedAlertIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem("bridgex_declined_alert_ids")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const declinedAlertIdsRef = useRef<Set<string>>(new Set(declinedAlertIds))

  const [myAcceptedAlertIds, setMyAcceptedAlertIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem("bridgex_accepted_alert_ids")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const userRole = (user as any)?.role || "user"
  const isResponder = Boolean(user && userRole !== "user" && userRole !== "victim")
  const isVictimUser = !isResponder
  const userPhone = (user as any)?.phone || (user as any)?.user_metadata?.phone || ""

  // Responder specialization (fire / medical / security / all)
  const orgName = ((user as any)?.organization || (user as any)?.user_metadata?.organization || "").toLowerCase()
  const rawRole = ((user as any)?.role || (user as any)?.user_metadata?.responderRole || (user as any)?.user_metadata?.specificRole || "").toLowerCase()
  const rawSpec = ((user as any)?.specialization || "").toLowerCase()

  const isHospitalOrg = rawRole === "hospital" || rawSpec === "hospital" || rawRole === "medical" || rawSpec === "medical" || orgName.includes("hospital") || orgName.includes("medical") || orgName.includes("clinic")
  const isFireOrg = rawRole === "fire" || rawSpec === "fire" || orgName.includes("fire") || orgName.includes("rescue")
  const isPoliceOrg = rawRole === "police" || rawSpec === "police" || rawRole === "security" || rawSpec === "security" || orgName.includes("police") || orgName.includes("security")

  const defaultDept = isFireOrg
    ? "fire"
    : isHospitalOrg
    ? "medical"
    : isPoliceOrg
    ? "security"
    : "all"

  const [departmentFilter, setDepartmentFilter] = useState<string>(defaultDept)

  // Automatically adapt department filter when responder logs in
  useEffect(() => {
    if (!user) return
    if (isFireOrg) {
      setDepartmentFilter("fire")
    } else if (isHospitalOrg) {
      setDepartmentFilter("medical")
    } else if (isPoliceOrg) {
      setDepartmentFilter("security")
    }
  }, [user, isFireOrg, isHospitalOrg, isPoliceOrg])

  // Computed visible alerts filtered by declined IDs, stale filter, and department specialization
  const visibleAlerts = alerts.filter((a) => {
    // 1. If citizen/victim: ONLY show their OWN alert! Never show other users' emergencies
    if (isVictimUser) {
      const activeSosId = typeof window !== "undefined" ? localStorage.getItem("bridgex_active_sos_id") : null
      const isMySosId = activeSosId && a.id === activeSosId
      const isMyUserId = Boolean(user && a.user_id === user.id)
      const isMyPhone = Boolean(userPhone && (a.metadata?.victim_phone === userPhone || a.metadata?.phone === userPhone))
      return Boolean(isMySosId || isMyUserId || isMyPhone)
    }

    // 2. Never show if rejected / declined by this responder
    if (declinedAlertIds.includes(a.id) || declinedAlertIdsRef.current.has(a.id)) {
      return false
    }

    // 3. Stale check: don't show unaccepted alerts older than 24h
    const ageHours = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60)
    if (ageHours > 24 && !a.accepted_by) return false

    // 4. Department matching:
    if (isHospitalOrg) {
      if (a.emergency_type !== "medical" && a.emergency_type !== "accident") return false
    } else if (isFireOrg) {
      if (a.emergency_type !== "fire") return false
    } else if (isPoliceOrg) {
      if (a.emergency_type !== "security" && a.emergency_type !== "police") return false
    } else if (departmentFilter === "medical") {
      // Hospitals receive medical and accident emergencies
      if (a.emergency_type !== "medical" && a.emergency_type !== "accident") return false
    } else if (departmentFilter === "fire") {
      // Fire departments receive fire emergencies
      if (a.emergency_type !== "fire") return false
    } else if (departmentFilter === "security" || departmentFilter === "police") {
      // Police departments receive security and police emergencies
      if (a.emergency_type !== "security" && a.emergency_type !== "police") return false
    } else if (departmentFilter !== "all") {
      if (a.emergency_type !== departmentFilter) return false
    }

    return true
  })

  // Responders only: unaccepted alerts matching department filter, never playing siren for victim's own alert
  const unacceptedAlerts = isVictimUser
    ? []
    : visibleAlerts.filter(
        (a) =>
          a.status === "active" &&
          !a.accepted_by &&
          !(user && a.user_id === user.id)
      )

  // Siren sounds continuously till responder accepts or rejects (NEVER for victims or own alerts)
  useEffect(() => {
    if (isVictimUser || unacceptedAlerts.length === 0 || soundMuted) {
      sirenSound.stop()
    } else {
      sirenSound.start()
    }
    return () => {
      sirenSound.stop()
    }
  }, [unacceptedAlerts.length, soundMuted, isVictimUser])

  const handleRejectAlert = (alertId: string) => {
    const updated = Array.from(new Set([...declinedAlertIds, alertId]))
    declinedAlertIdsRef.current.add(alertId)
    setDeclinedAlertIds(updated)
    try {
      localStorage.setItem("bridgex_declined_alert_ids", JSON.stringify(updated))
    } catch {}

    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    if (selectedAlert?.id === alertId) {
      setRespondOpen(false)
      setDetailsOpen(false)
      setSelectedAlert(null)
    }
    authFetch(`/api/alerts/${alertId}/decline`, { method: "POST" }).catch(() => {})
    toast({
      title: "Alert Declined",
      description: "You have declined this alert. It will not be shown to you again.",
    })
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      try {
        await authFetch(`/api/alerts/${alertId}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "resolve" }),
        })
      } catch {}

      // Direct client fallback to ensure row status is updated in database
      try {
        await supabase
          .from("alerts")
          .update({ status: "resolved", updated_at: new Date().toISOString() })
          .eq("id", alertId)
      } catch {}

      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      const nextAccepted = myAcceptedAlertIds.filter((id) => id !== alertId)
      setMyAcceptedAlertIds(nextAccepted)
      try {
        localStorage.setItem("bridgex_accepted_alert_ids", JSON.stringify(nextAccepted))
        localStorage.removeItem("bridgex_active_sos_id")
      } catch {}
      toast({
        title: "Emergency Resolved",
        description: "The emergency has been marked as resolved and cancelled.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Could not resolve the alert",
        variant: "destructive",
      })
    }
  }

  const getVictimPhone = (alert: Alert | null): string => {
    if (!alert) return ""
    return (
      alert.metadata?.phone ||
      alert.metadata?.victim_phone ||
      alert.profiles?.phone ||
      alert.responder_phone ||
      ""
    )
  }

  useEffect(() => {
    fetchAlerts()

    const channel = supabase
      .channel("active_alerts_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          let currentDeclined = Array.from(declinedAlertIdsRef.current)
          let currentAccepted = myAcceptedAlertIds
          try {
            const dec = localStorage.getItem("bridgex_declined_alert_ids")
            if (dec) currentDeclined = Array.from(new Set([...currentDeclined, ...JSON.parse(dec)]))
            const acc = localStorage.getItem("bridgex_accepted_alert_ids")
            if (acc) currentAccepted = JSON.parse(acc)
          } catch {}

          const decSet = new Set(currentDeclined)
          const accSet = new Set(currentAccepted)

          if (payload.eventType === "INSERT") {
            const newAlert = payload.new as Alert

            // CITIZENS / VICTIMS: ONLY receive updates about their own SOS!
            if (isVictimUser) {
              const activeSosId = typeof window !== "undefined" ? localStorage.getItem("bridgex_active_sos_id") : null
              const isMine =
                (user && newAlert.user_id === user.id) ||
                (activeSosId && newAlert.id === activeSosId) ||
                (userPhone && newAlert.metadata?.victim_phone === userPhone)
              if (isMine) {
                setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)])
              }
              return
            }

            // DEPARTMENT SPECIFIC ISOLATION:
            // Medical responder -> ONLY receive medical & accident alerts
            if (isHospitalOrg && newAlert.emergency_type !== "medical" && newAlert.emergency_type !== "accident") {
              return
            }
            // Fire responder -> ONLY receive fire alerts
            if (isFireOrg && newAlert.emergency_type !== "fire") {
              return
            }
            // Police responder -> ONLY receive security & police alerts
            if (isPoliceOrg && newAlert.emergency_type !== "security" && newAlert.emergency_type !== "police") {
              return
            }

            if (decSet.has(newAlert.id)) return // Never show declined alerts
            if (newAlert.accepted_by) {
              const isMine = (user && newAlert.accepted_by === user.id) || accSet.has(newAlert.id)
              if (isMine) {
                setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)])
              }
            } else if (newAlert.status === "active") {
              setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)])
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedAlert = payload.new as Alert

            // DEPARTMENT SPECIFIC ISOLATION:
            if (isHospitalOrg && updatedAlert.emergency_type !== "medical" && updatedAlert.emergency_type !== "accident") {
              setAlerts((prev) => prev.filter((a) => a.id !== updatedAlert.id))
              return
            }
            if (isFireOrg && updatedAlert.emergency_type !== "fire") {
              setAlerts((prev) => prev.filter((a) => a.id !== updatedAlert.id))
              return
            }
            if (isPoliceOrg && updatedAlert.emergency_type !== "security" && updatedAlert.emergency_type !== "police") {
              setAlerts((prev) => prev.filter((a) => a.id !== updatedAlert.id))
              return
            }
            if (isVictimUser) {
              if (updatedAlert.status === "resolved" || updatedAlert.status === "cancelled") {
                setAlerts((prev) => prev.filter((a) => a.id !== updatedAlert.id))
              } else {
                const isMine =
                  (user && updatedAlert.user_id === user.id) ||
                  (userPhone && updatedAlert.metadata?.victim_phone === userPhone)
                if (isMine) {
                  setAlerts((prev) => [updatedAlert, ...prev.filter((a) => a.id !== updatedAlert.id)])
                }
              }
              return
            }

            if (decSet.has(updatedAlert.id)) {
              // Ensure rejected alert is completely excluded
              setAlerts((prev) => prev.filter((a) => a.id !== updatedAlert.id))
              return
            }
            if (updatedAlert.status === "resolved" || updatedAlert.status === "cancelled") {
              // Remove resolved/cancelled alerts from everyone
              setAlerts((prev) => prev.filter((a) => a.id !== updatedAlert.id))
              if (selectedAlert?.id === updatedAlert.id) {
                setRespondOpen(false)
                setDetailsOpen(false)
                setSelectedAlert(null)
              }
            } else if (updatedAlert.accepted_by) {
              // Alert accepted!
              const isMine =
                (user && updatedAlert.accepted_by === user.id) ||
                accSet.has(updatedAlert.id)
              if (isMine) {
                // Keep for the responder who accepted it
                setAlerts((prev) =>
                  prev.map((a) => (a.id === updatedAlert.id ? (updatedAlert as Alert) : a))
                )
              } else {
                // Remove from everyone else!
                setAlerts((prev) => prev.filter((a) => a.id !== updatedAlert.id))
                if (selectedAlert?.id === updatedAlert.id) {
                  setRespondOpen(false)
                  setDetailsOpen(false)
                  setSelectedAlert(null)
                  toast({
                    title: "Alert Claimed",
                    description: "Another responder has accepted this alert and is en route.",
                  })
                }
              }
            } else {
              setAlerts((prev) =>
                prev.map((a) => (a.id === updatedAlert.id ? (updatedAlert as Alert) : a))
              )
            }
          } else if (payload.eventType === "DELETE") {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, isVictimUser, userPhone, isHospitalOrg, isFireOrg, isPoliceOrg])

  const fetchAlerts = async () => {
    try {
      if (isVictimUser) {
        // Citizens / Victims: ONLY fetch their OWN active SOS
        const activeSosId = typeof window !== "undefined" ? localStorage.getItem("bridgex_active_sos_id") : null
        if (!user?.id && !activeSosId) {
          setAlerts([])
          return
        }
        let query = supabase
          .from("alerts")
          .select("*, profiles:user_id(name, phone)")
          .in("status", ["active", "responding"])
          .order("created_at", { ascending: false })
          .limit(5)

        if (user?.id && activeSosId) {
          query = query.or(`user_id.eq.${user.id},id.eq.${activeSosId}`)
        } else if (user?.id) {
          query = query.eq("user_id", user.id)
        } else if (activeSosId) {
          query = query.eq("id", activeSosId)
        }

        const { data, error } = await query
        setAlerts(data || [])
        return
      }

      // Responders: fetch active/responding dispatches
      const { data, error } = await supabase
        .from("alerts")
        .select("*, profiles:user_id(name, phone)")
        .in("status", ["active", "responding"])
        .order("created_at", { ascending: false })
        .limit(30)

      let list: Alert[] = data || []
      if (!list || list.length === 0 || error) {
        try {
          const apiRes = await fetch("/api/alerts?status=active")
          if (apiRes.ok) {
            const apiAlerts = await apiRes.json()
            if (Array.isArray(apiAlerts)) {
              list = apiAlerts
            }
          }
        } catch {}
      }

      let currentDeclined = declinedAlertIds
      let currentAccepted = myAcceptedAlertIds
      try {
        const dec = localStorage.getItem("bridgex_declined_alert_ids")
        if (dec) currentDeclined = JSON.parse(dec)
        const acc = localStorage.getItem("bridgex_accepted_alert_ids")
        if (acc) currentAccepted = JSON.parse(acc)
      } catch {}

      const decSet = new Set(currentDeclined)
      const accSet = new Set(currentAccepted)

      const filtered = list.filter((a: Alert) => {
        // 1. If once rejected by this responder -> never show again!
        if (decSet.has(a.id)) return false

        // 2. If resolved or cancelled -> don't show
        if (a.status === "resolved" || a.status === "cancelled") return false

        // 3. Stale check: filter out unaccepted alerts older than 24 hours
        const ageHours = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60)
        if (ageHours > 24 && !a.accepted_by) return false

        // 4. DEPARTMENT SPECIFIC ISOLATION on initial fetch:
        if (isHospitalOrg && a.emergency_type !== "medical" && a.emergency_type !== "accident") return false
        if (isFireOrg && a.emergency_type !== "fire") return false
        if (isPoliceOrg && a.emergency_type !== "security" && a.emergency_type !== "police") return false

        // 5. If accepted by someone:
        if (a.accepted_by) {
          const isMine = (user && a.accepted_by === user.id) || accSet.has(a.id)
          // Keep ONLY for the one who accepted, remove from everyone else!
          return isMine
        }

        // 5. Otherwise it's unaccepted and active -> show to all responders
        return a.status === "active"
      })

      setAlerts(filtered)
    } catch (error) {
      console.error("Error fetching alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMs = now.getTime() - alertTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const getPriorityColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case "critical": return "#ef4444"
      case "high": return "#f97316"
      case "medium": return "#eab308"
      default: return "#6b7280"
    }
  }

  const getUrgencyBadgeVariant = (urgencyLevel: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (urgencyLevel) {
      case "critical": return "destructive"
      case "high": return "destructive"
      default: return "secondary"
    }
  }

  const handleViewDetails = async (alert: Alert) => {
    setSelectedAlert(alert)
    setDetailsOpen(true)
    setTranslatedText("")

    // Build Google Maps URL for the location & fetch nearby facilities
    const lat = alert.location?.lat
    const lng = alert.location?.lng || alert.location?.lon
    if (lat && lng) {
      setMapUrl(`https://www.google.com/maps?q=${lat},${lng}&z=15`)
      setLoadingFacilities(true)
      fetchNearbyPlaces(lat, lng, 5000)
        .then((places) => setNearbyFacilities(places || []))
        .catch(() => setNearbyFacilities([]))
        .finally(() => setLoadingFacilities(false))
    } else {
      setNearbyFacilities([])
    }

    // Auto-translate message if exists
    const orig = alert.original_message || alert.message || ""
    const eng = alert.message || ""
    if (orig && eng && orig !== eng) {
      setTranslatedText(eng)
    } else if (orig) {
      setTranslating(true)
      try {
        const res = await fetch("/api/lingo/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: orig, targetLang: "en" }),
        })
        if (res.ok) {
          const data = await res.json()
          setTranslatedText(data.translatedText || "")
        }
      } catch (err) {
        console.warn("Translation failed:", err)
      } finally {
        setTranslating(false)
      }
    }
  }

  const handleRespond = (alert: Alert) => {
    setSelectedAlert(alert)
    setRespondOpen(true)
  }

  const handleAcceptAlert = async () => {
    if (!selectedAlert) return
    setAccepting(true)

    try {
      let acceptedSuccessfully = false

      // Try official accept endpoint using authenticated session
      try {
        const res = await authFetch(`/api/alerts/${selectedAlert.id}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          acceptedSuccessfully = true
        } else if (res.status === 409) {
          toast({
            title: "Already Taken",
            description: "Another responder has already approved and accepted this emergency alert.",
            variant: "destructive"
          })
          fetchAlerts()
          setRespondOpen(false)
          setDetailsOpen(false)
          return
        }
      } catch {
        // Fallback to direct client update
      }

      // If user is authenticated or has provided responder profile
      if (!acceptedSuccessfully && user) {
        const { error } = await supabase
          .from("alerts")
          .update({
            accepted_by: user.id,
            status: "responding",
            responder_phone: user.phone || (user as any)?.user_metadata?.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedAlert.id)
          .is("accepted_by", null)

        if (!error) {
          acceptedSuccessfully = true
        }
      }

      // Immediately silence siren for this responder
      sirenSound.stop()
      setSoundMuted(true)

      const acceptedAlert: Alert = {
        ...selectedAlert,
        status: "responding",
        accepted_by: user?.id || "me"
      }

      const nextAccepted = Array.from(new Set([...myAcceptedAlertIds, selectedAlert.id]))
      setMyAcceptedAlertIds(nextAccepted)
      try {
        localStorage.setItem("bridgex_accepted_alert_ids", JSON.stringify(nextAccepted))
      } catch {}

      // Keep it visible for the accepting responder!
      setAlerts((prev) =>
        prev.map((a) => (a.id === selectedAlert.id ? acceptedAlert : a))
      )

      toast({
        title: "Alert Accepted! 🚨",
        description: "Emergency siren silenced. You have taken ownership of this incident. Please call the victim immediately.",
      })

      // Turn off siren and only show the responder the details and victim contact
      setSelectedAlert(acceptedAlert)
      setRespondOpen(false)
      setDetailsOpen(true)
    } catch (err: any) {
      console.error("Accept error:", err)
      toast({
        title: "Error Approving Alert",
        description: "Please check your network connection and try again.",
        variant: "destructive"
      })
    } finally {
      setAccepting(false)
    }
  }

  const getLocationString = (location: any): string => {
    if (!location) return "Unknown location"
    if (location.address) return location.address
    const lat = location.lat
    const lng = location.lng || location.lon
    if (lat && lng) return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
    return "Unknown location"
  }

  const getMapEmbedUrl = (location: any): string | null => {
    if (!location) return null
    const lat = location.lat
    const lng = location.lng || location.lon
    if (!lat || !lng) return null
    return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">
              {isVictimUser ? "Emergency Safety Status" : "Active Emergency Dispatches"}
            </h3>
            <Badge variant="secondary" className="animate-pulse">
              Loading...
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {isVictimUser ? "Connecting to BridgeX emergency grid..." : "Scanning for active emergency dispatches..."}
          </p>
        </Card>
      </div>
    )
  }

  // ==========================================
  // CITIZEN / VICTIM USER VIEW (NO OTHER ALERTS)
  // ==========================================
  if (isVictimUser) {
    const myActiveAlert = visibleAlerts.find(
      (a) => a.status === "active" || a.status === "responding"
    )

    if (myActiveAlert) {
      return (
        <div className="space-y-4">
          <Card className="p-5 border-2 border-red-500/50 bg-gradient-to-b from-card to-red-950/20 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600 text-white animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    Your Emergency SOS is Live
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Dispatched to verified responders & emergency services
                  </p>
                </div>
              </div>
              <Badge className="bg-red-600 text-white animate-pulse text-xs font-bold capitalize">
                {myActiveAlert.urgency_level || "Critical"}
              </Badge>
            </div>

            {/* Department Routed */}
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-foreground flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                Target: {myActiveAlert.metadata?.emergency_department || myActiveAlert.metadata?.routed_organization || "Emergency Rapid Response"}
              </span>
              <Badge className="bg-red-600 text-white text-[10px] ml-1 flex-shrink-0">
                Helpline: {myActiveAlert.metadata?.emergency_helpline || myActiveAlert.metadata?.routed_helpline || "112"}
              </Badge>
            </div>

            {/* Live Response Status */}
            <div className="mb-3">
              {myActiveAlert.status === "responding" || myActiveAlert.accepted_by ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Responder En Route!
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    A verified responder has taken charge of your emergency and is navigating to you.
                  </p>
                  {myActiveAlert.responder_phone && (
                    <a
                      href={`tel:${myActiveAlert.responder_phone}`}
                      className="mt-2 inline-flex items-center gap-1.5 py-1 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Responder: {myActiveAlert.responder_phone}
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Broadcasting Distress Signal...
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Your GPS coordinates and emergency details are being dispatched to nearby units.
                  </p>
                </div>
              )}
            </div>

            {/* Landmark & Message */}
            <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
              {(myActiveAlert.location?.details || myActiveAlert.metadata?.address_details) && (
                <div className="flex items-start gap-1.5 text-foreground bg-muted/60 p-2 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                  <span className="font-medium truncate">
                    {myActiveAlert.location?.details || myActiveAlert.metadata?.address_details}
                  </span>
                </div>
              )}
              {myActiveAlert.message && (
                <div className="p-2 rounded-lg bg-muted/40 text-card-foreground text-xs italic">
                  &ldquo;{myActiveAlert.message}&rdquo;
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all"
              >
                <Phone className="w-3.5 h-3.5" /> Call 112 Direct
              </a>
              <Button
                variant="outline"
                className="text-xs font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-9"
                onClick={() => handleResolveAlert(myActiveAlert.id)}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                I Am Safe / Cancel
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    // Citizen Safety Hub (When no active alert submitted)
    return (
      <div className="space-y-4">
        <Card className="p-5 border-2 border-emerald-500/30 bg-gradient-to-b from-card to-emerald-950/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  Citizen Safety Hub
                  <Badge className="bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 text-[10px] py-0 px-1.5 font-bold">
                    All Clear
                  </Badge>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {user ? `Logged in as ${user.name || user.email}` : "24/7 AI-Monitored Emergency Grid"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold">
              Protected
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            You have no active emergency requests. BridgeX AI-powered rapid response grid is active and standing by in your area.
          </p>

          {/* 1-Tap Emergency Speed Dial */}
          <div className="space-y-2 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Direct Emergency Helplines (1-Tap Dial)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="p-2.5 rounded-xl border bg-card hover:bg-muted/70 transition-all flex items-center gap-2 text-xs font-bold text-foreground group"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-muted-foreground font-normal">National Helpline</span>
                  <span>112 Emergency</span>
                </div>
              </a>
              <a
                href="tel:108"
                className="p-2.5 rounded-xl border bg-card hover:bg-muted/70 transition-all flex items-center gap-2 text-xs font-bold text-foreground group"
              >
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600">
                  <Heart className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-muted-foreground font-normal">Ambulance</span>
                  <span>108 / 102 Medical</span>
                </div>
              </a>
              <a
                href="tel:101"
                className="p-2.5 rounded-xl border bg-card hover:bg-muted/70 transition-all flex items-center gap-2 text-xs font-bold text-foreground group"
              >
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-muted-foreground font-normal">Fire & Rescue</span>
                  <span>101 Fire Dept</span>
                </div>
              </a>
              <a
                href="tel:100"
                className="p-2.5 rounded-xl border bg-card hover:bg-muted/70 transition-all flex items-center gap-2 text-xs font-bold text-foreground group"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-muted-foreground font-normal">Police</span>
                  <span>100 Control</span>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-xs h-9 gap-2 shadow-md shadow-red-600/20"
              onClick={() => {
                const el = document.getElementById("sos-interface")
                if (el) el.scrollIntoView({ behavior: "smooth" })
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              Trigger Emergency SOS
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <FirstAidGuide size="sm" variant="outline" triggerClassName="w-full text-xs h-8" label="First Aid Guide" />
              <EmergencyBeacon size="sm" variant="outline" triggerClassName="w-full text-xs h-8" label="Beacon & Siren" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ==========================================
  // RESPONDER VIEW (LIVE DISPATCH CONSOLE)
  // ==========================================

  return (
    <div className="space-y-4">
      <Card className="p-4 border-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Active Emergency Dispatches</h3>
            {unacceptedAlerts.length > 0 && !isVictimUser && (
              <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-1 text-xs">
                <Siren className="w-3.5 h-3.5 animate-spin" />
                {soundMuted ? "Siren Muted" : "Emergency Siren Playing"}
              </Badge>
            )}
            {isVictimUser && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Victim Mode (Dispatches routed to emergency services)
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isVictimUser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSoundMuted((m) => !m)}
                className="h-8 text-xs gap-1.5"
              >
                {soundMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                    Unmute Siren
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                    Mute Siren
                  </>
                )}
              </Button>
            )}
            <Badge variant="destructive" className="animate-pulse">
              {unacceptedAlerts.length} Pending
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {isVictimUser
            ? "Your emergency requests are sent directly to verified responders and emergency organizations."
            : "Emergency dispatches tailored to your specialization. Siren sounds continuously until approved."}
        </p>

        {/* Department / Organization Console Banner or Filter Tabs */}
        {isHospitalOrg ? (
          <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
            <Heart className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="font-bold">🏥 Medical & Trauma Emergency Dispatch Console (102 / 108)</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">Strictly filtered to Hospital & Ambulance alerts. Audio siren triggers only for Medical emergencies.</span>
            </div>
          </div>
        ) : isFireOrg ? (
          <div className="flex items-center gap-2.5 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs font-semibold text-orange-600 dark:text-orange-400">
            <Flame className="w-4 h-4 text-orange-500 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="font-bold">🚒 Fire & Rescue Emergency Dispatch Console (101)</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">Strictly filtered to Fire Brigade dispatches. Audio siren triggers only for Fire emergencies.</span>
            </div>
          </div>
        ) : isPoliceOrg ? (
          <div className="flex items-center gap-2.5 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="font-bold">🚓 Police & Law Enforcement Command Console (112)</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">Strictly filtered to Security & Police dispatches. Audio siren triggers only for Law Enforcement emergencies.</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl overflow-x-auto border">
            {[
              { id: "all", label: "All Incidents", icon: Radio, color: "text-foreground" },
              { id: "fire", label: "Fire & Rescue (101)", icon: Flame, color: "text-orange-500" },
              { id: "medical", label: "Medical & Trauma (102)", icon: Heart, color: "text-red-500" },
              { id: "security", label: "Police & Security (112)", icon: Shield, color: "text-blue-500" },
            ].map((tab) => {
              const Icon = tab.icon
              const active = departmentFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setDepartmentFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? "bg-background text-foreground shadow-sm border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">
                No active {departmentFilter !== "all" ? departmentFilter : ""} emergency dispatches at this moment
              </p>
            </Card>
          ) : (
            visibleAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <Card
                  className="p-4 border-l-4 transition-shadow hover:shadow-md"
                  style={{ borderLeftColor: getPriorityColor(alert.urgency_level) }}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-muted flex items-center justify-center">
                        {alert.emergency_type === "medical" ? (
                          <Heart className="w-5 h-5 text-red-600" />
                        ) : alert.emergency_type === "fire" ? (
                          <Flame className="w-5 h-5 text-orange-600" />
                        ) : (
                          <Shield className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-card-foreground capitalize flex items-center gap-1.5">
                          {alert.emergency_type?.replace(/_/g, " ")} Emergency
                        </h4>
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          🎯 Department: <strong className="text-foreground">{alert.metadata?.emergency_department || alert.metadata?.routed_organization || "Emergency Dispatch"}</strong>
                        </span>
                      </div>
                    </div>
                    {alert.status === "responding" || alert.accepted_by ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Accepted By You
                        </Badge>
                        <Badge variant={getUrgencyBadgeVariant(alert.urgency_level)} className="text-xs capitalize">
                          {alert.urgency_level}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant={getUrgencyBadgeVariant(alert.urgency_level)} className="text-xs capitalize flex-shrink-0">
                        {alert.urgency_level}
                      </Badge>
                    )}
                  </div>

                  {/* Emergency Department Highlight */}
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-900 dark:text-red-200 flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      Dispatched To: {alert.metadata?.emergency_department || alert.metadata?.routed_organization || "Emergency Rapid Response"}
                    </span>
                    <Badge className="bg-red-600 text-white text-[10px] flex-shrink-0 ml-1">
                      Helpline: {alert.metadata?.emergency_helpline || alert.metadata?.routed_helpline || "112"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-3 text-xs text-muted-foreground">
                    {(alert.location?.details || alert.metadata?.address_details) && (
                      <div className="flex items-start gap-1.5 text-amber-800 dark:text-amber-200 font-semibold bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                        <span>Landmark: {alert.location?.details || alert.metadata?.address_details}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{getLocationString(alert.location)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(alert.created_at)}</span>
                    </div>
                    {getVictimPhone(alert) && (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <Phone className="w-3 h-3" />
                        <span>Victim: {getVictimPhone(alert)}</span>
                      </div>
                    )}
                  </div>

                  {alert.message && (
                    <div className="mb-3 p-2 bg-muted/40 rounded-md space-y-1">
                      <p className="text-xs text-card-foreground line-clamp-2 font-medium">
                        {alert.message}
                      </p>
                      {alert.original_message && alert.original_message !== alert.message && (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-1">
                          Original ({alert.language_code || 'native'}): {alert.original_message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    {alert.status === "active" && !alert.accepted_by ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5 w-full bg-background/50 hover:bg-muted font-medium h-8"
                          onClick={() => handleViewDetails(alert)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5 w-full border-red-300/80 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium h-8"
                          onClick={() => handleRejectAlert(alert.id)}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="col-span-2 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm w-full h-8"
                          onClick={() => handleRespond(alert)}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Respond to SOS
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs gap-1.5 bg-transparent h-8"
                          onClick={() => handleViewDetails(alert)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </Button>
                        {(alert.status === "responding" || alert.accepted_by) && (
                          <div className="flex-1 flex gap-2">
                            {getVictimPhone(alert) && (
                              <a
                                href={`tel:${getVictimPhone(alert)}`}
                                className="flex-1 py-1 px-2.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1 shadow-sm h-8"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-8"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 z-[99999] rounded-2xl shadow-2xl border-2">
          <DialogHeader className="mb-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-red-600/15 text-red-500 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
              </span>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                  Emergency Incident Mission Dossier
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Real-time distress intelligence, victim contact, GPS coordinates, and departmental routing
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4 pt-2">
              {/* Type & Routed Organization */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border-2 border-border/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                    {selectedAlert.emergency_type === "medical" ? (
                      <Heart className="w-7 h-7 text-red-600" />
                    ) : selectedAlert.emergency_type === "fire" ? (
                      <Flame className="w-7 h-7 text-orange-600" />
                    ) : (
                      <Shield className="w-7 h-7 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black capitalize flex items-center gap-1.5 text-foreground">
                      {selectedAlert.emergency_type?.replace(/_/g, " ")} Emergency
                    </span>
                    {selectedAlert.metadata?.routed_organization && (
                      <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
                        🎯 Routed To: <strong className="text-foreground">{selectedAlert.metadata.routed_organization}</strong>
                        {selectedAlert.metadata?.routed_helpline && ` (Helpline: ${selectedAlert.metadata.routed_helpline})`}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={getUrgencyBadgeVariant(selectedAlert.urgency_level)}
                  className="capitalize font-black text-xs px-3 py-1 flex-shrink-0"
                >
                  {selectedAlert.urgency_level} Priority
                </Badge>
              </div>

              {/* Status Banner if Accepted / Responding */}
              {(selectedAlert.status === "responding" || selectedAlert.accepted_by) && (
                <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-bounce" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">
                      Incident Accepted — You are Exclusive Primary Responder
                    </p>
                    <p className="text-emerald-800/80 dark:text-emerald-300/80 text-xs mt-0.5">
                      Emergency sirens have been silenced. Please call the victim and follow the navigation route.
                    </p>
                  </div>
                </div>
              )}

              {/* Victim Contact Info */}
              {getVictimPhone(selectedAlert) ? (
                <div className="rounded-xl border-2 p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Victim Direct Contact Number
                    </span>
                    <span className="text-base sm:text-lg font-black text-foreground font-mono">
                      {getVictimPhone(selectedAlert)}
                    </span>
                  </div>
                  <div className="flex gap-2.5">
                    <a
                      href={`tel:${getVictimPhone(selectedAlert)}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-green-600/30 transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4" /> Call Victim Directly
                    </a>
                    <a
                      href={`https://wa.me/${getVictimPhone(selectedAlert).replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 font-bold text-center text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-300 dark:border-emerald-700 transition-all active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp Victim
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border p-3.5 bg-muted/40 text-xs text-muted-foreground">
                  📞 Contact number was not provided by victim. Navigate to the GPS coordinates below.
                </div>
              )}

              {/* Location Section */}
              <div className="rounded-xl border-2 p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Victim Location & Landmark Directions
                  </span>
                  {selectedAlert.location?.lat && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Open Google Maps Navigation
                    </a>
                  )}
                </div>

                {/* Detailed Landmark / Floor / Flat if provided by victim */}
                {(selectedAlert.location?.details || selectedAlert.metadata?.address_details) && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs">
                    <span className="font-extrabold text-amber-900 dark:text-amber-100 flex items-center gap-1.5 text-xs sm:text-sm">
                      🏢 Landmark / Floor / Flat:
                    </span>
                    <p className="font-bold text-foreground mt-1 text-sm">
                      {selectedAlert.location.details || selectedAlert.metadata.address_details}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  {getLocationString(selectedAlert.location)}
                </p>
                {/* Embedded Map */}
                {getMapEmbedUrl(selectedAlert.location) && (
                  <div className="mt-2 rounded-xl overflow-hidden border h-48 shadow-inner">
                    <iframe
                      src={getMapEmbedUrl(selectedAlert.location)!}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Victim location map"
                    />
                  </div>
                )}
              </div>

              {/* Message & Translation */}
              <div className="rounded-xl border-2 p-4 bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-100">
                  <span className="flex items-center gap-2 text-sm">
                    <Languages className="w-4 h-4 text-blue-600" />
                    Emergency Message & Translation
                  </span>
                  <Badge variant="outline" className="text-[11px] font-semibold uppercase">
                    {selectedAlert.language_code || "Auto-Detected"}
                  </Badge>
                </div>

                {/* Original Message */}
                {selectedAlert.original_message && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Original Message ({selectedAlert.language_code || "Native"}):
                    </p>
                    <p className="text-sm font-medium text-foreground bg-background p-3 rounded-xl border">
                      {selectedAlert.original_message}
                    </p>
                  </div>
                )}

                {/* English Translation */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                    <span>English Translation (for Responders):</span>
                    {translating && (
                      <span className="text-blue-600 flex items-center gap-1 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" /> Translating…
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-bold text-foreground bg-background p-3 rounded-xl border border-blue-300 dark:border-blue-700 shadow-sm">
                    {translatedText || selectedAlert.message}
                  </p>
                </div>
              </div>

              {/* Nearby Emergency Facilities (Real-time Geolocation) */}
              <div className="rounded-xl border-2 p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-foreground">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-500" />
                    Nearby Hospitals & Stations (within 15-20km)
                  </span>
                  {loadingFacilities && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </div>
                {nearbyFacilities.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {nearbyFacilities.slice(0, 3).map((f) => (
                      <div key={f.id} className="p-3 rounded-xl border bg-background flex items-center justify-between gap-2.5 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                            <span>{f.category === "hospital" ? "🏥" : f.category === "police" ? "👮" : "🚒"}</span>
                            <span className="truncate">{f.name}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {f.address || f.category.replace("_", " ")} • {f.distance ? formatDistance(f.distance) : ""}
                          </div>
                        </div>
                        <a
                          href={`tel:${f.phone || (f.category === "hospital" ? "102" : f.category === "police" ? "112" : "101")}`}
                          className="py-1.5 px-3 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold hover:bg-red-200 text-xs flex-shrink-0"
                        >
                          📞 Call
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground">
                    National Emergency Helplines: Ambulance 102 / 108 | Police 112 | Fire 101
                  </div>
                )}
              </div>

              {/* Dialog Footer Actions */}
              <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Reported {formatTime(selectedAlert.created_at)}
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {selectedAlert.status === "responding" || selectedAlert.accepted_by ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex-1 sm:flex-initial"
                        onClick={() => setDetailsOpen(false)}
                      >
                        Close Dossier
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 flex-1 sm:flex-initial shadow-md shadow-emerald-600/30"
                        onClick={() => {
                          setDetailsOpen(false)
                          handleResolveAlert(selectedAlert.id)
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Incident Resolved
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 text-xs flex-1 sm:flex-initial"
                        onClick={() => handleRejectAlert(selectedAlert.id)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject Alert
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1.5 flex-1 sm:flex-initial shadow-md shadow-green-600/30"
                        onClick={handleAcceptAlert}
                        disabled={accepting}
                      >
                        {accepting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            Approving…
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve & Take Ownership
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto z-[99999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              Respond & Call Victim
            </DialogTitle>
            <DialogDescription>
              Call the victim directly and accept this alert to take ownership
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Emergency Summary */}
              <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold capitalize flex items-center gap-1.5 text-red-900 dark:text-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    {selectedAlert.emergency_type?.replace(/_/g, " ")} Emergency
                  </span>
                  <Badge variant={getUrgencyBadgeVariant(selectedAlert.urgency_level)} className="capitalize text-xs">
                    {selectedAlert.urgency_level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                  {getLocationString(selectedAlert.location)}
                </p>
                {selectedAlert.message && (
                  <p className="text-xs font-semibold text-foreground pt-1 border-t">
                    "{selectedAlert.message}"
                  </p>
                )}
              </div>

              {/* Direct Victim Contact Banner */}
              <div className="rounded-xl border p-4 space-y-3 bg-card shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                  Victim Contact Phone Number
                </p>

                {getVictimPhone(selectedAlert) ? (
                  <div className="space-y-2">
                    <a
                      href={`tel:${getVictimPhone(selectedAlert)}`}
                      className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg font-bold shadow-md transition-all active:scale-95"
                    >
                      <Phone className="w-5 h-5 animate-pulse" />
                      Call Victim: {getVictimPhone(selectedAlert)}
                    </a>

                    <a
                      href={`https://wa.me/${getVictimPhone(selectedAlert).replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp ({getVictimPhone(selectedAlert)})
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Phone number not provided by victim.</p>
                    <p>Use GPS navigation to proceed to the victim's location.</p>
                  </div>
                )}
              </div>

              {/* Accept Warning */}
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ By accepting, this alert will be <strong>removed from all other responders</strong> and assigned exclusively to you.
                </p>
              </div>

              {!user && (
                <div className="space-y-1.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Responder Call Sign / Name:
                  </p>
                  <Input
                    placeholder="Enter your name or callsign (e.g. Officer Sharma)"
                    value={responderNameInput}
                    onChange={(e) => setResponderNameInput(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    You can approve and claim ownership immediately as an on-duty emergency responder.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRespondOpen(false)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
                  onClick={() => handleRejectAlert(selectedAlert.id)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                  onClick={handleAcceptAlert}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Approving…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve & Take Ownership
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
