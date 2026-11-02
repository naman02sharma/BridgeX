"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, 
  Heart, 
  Flame, 
  Shield, 
  HelpCircle, 
  Send, 
  Loader2,
  MapPin,
  Phone,
  Radio,
  Clock,
  CheckCircle2,
  X,
  Mic,
  Upload,
  Info,
  Globe,
  Languages,
  Navigation,
  PhoneCall,
  Building2,
  Check,
  Sparkles,
  Zap
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { VoiceInputV2 } from "@/components/voice-input-v2"
import { FileUploadV2 } from "@/components/file-upload-v2"
import { useGlobalTranslation } from "@/components/translation-provider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/auth-fetch"
import { getUserLocation } from "@/lib/geolocation"
import { speechLocales, supportedVoiceLanguages, detectIndicLanguage } from "@/lib/language-scripts"
import { fetchNearbyPlaces, type NearbyPlace, formatDistance, getCategoryIcon } from "@/lib/geolocation-service"
import { classifyEmergency, type DetectedEmergency } from "@/lib/emergency-classifier"
import { SafetyCheckin } from "@/components/safety-checkin"
import { useLiveTranslation } from "@/hooks/use-live-translation"
import { EmergencyBeacon } from "@/components/emergency-beacon"
import { FirstAidGuide } from "@/components/first-aid-guide"

const LANGUAGE_NAMES: Record<string, string> = {
  mr: "मराठी (Marathi)",
  hi: "हिन्दी (Hindi)",
  bn: "বাংলা (Bengali)",
  ta: "தமிழ் (Tamil)",
  te: "తెలుగు (Telugu)",
  gu: "ગુજરાતી (Gujarati)",
  kn: "ಕನ್ನಡ (Kannada)",
  ml: "മലയാളം (Malayalam)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
  ur: "اردو (Urdu)",
  en: "English",
}

interface EmergencyType {
  id: string
  label: string
  description: string
  icon: any
  color: string
  gradient: string
}

export function SOSInterfaceV2() {
  const { t, currentLang } = useGlobalTranslation()
  const { toast } = useToast()
  const [sentAs, setSentAs] = useState<string | null>(null)
  const [voiceLang, setVoiceLang] = useState<string>("hi-IN")

  // Default to Hindi/Marathi if in India or user preference, otherwise interface/browser locale
  useEffect(() => {
    const browser = typeof navigator !== "undefined" ? navigator.language?.split("-")[0] : ""
    setVoiceLang(speechLocales[currentLang] || speechLocales[browser] || "hi-IN")
  }, [currentLang])
  
  const [isActivating, setIsActivating] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("auto")
  const [message, setMessage] = useState("")
  const [victimPhone, setVictimPhone] = useState("")
  const [detailedAddress, setDetailedAddress] = useState("")
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [geocodedArea, setGeocodedArea] = useState<string>("")
  const [translatedEnglish, setTranslatedEnglish] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [detectedSourceLang, setDetectedSourceLang] = useState("")
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyPlace[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [reportedFacility, setReportedFacility] = useState<string | null>(null)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [panicTimer, setPanicTimer] = useState<number | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [resetSignal, setResetSignal] = useState(0)

  // Feature 3: Live translation — fires in real time as user types
  const liveTranslation = useLiveTranslation(message, "en")
  const [alertId, setAlertId] = useState<string | null>(null)
  const [guestId, setGuestId] = useState<string | null>(null)
  const [notifiedCount, setNotifiedCount] = useState<number | null>(null)
  const [acceptedBy, setAcceptedBy] = useState<string | null>(null)
  const escalatedRef = useRef(false)

  // Auto-populate registered user phone from Supabase auth, profile row, or cached localStorage
  useEffect(() => {
    async function loadRegisteredPhone() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const p = user.user_metadata?.phone || (user as any).phone
          if (p) {
            setVictimPhone(p)
            return
          }
          const { data } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle()
          if (data?.phone) {
            setVictimPhone(data.phone)
            return
          }
        }
      } catch {
        // Auth not available
      }

      if (typeof window !== "undefined") {
        const savedPhone = localStorage.getItem("bridgex_user_phone")
        if (savedPhone) setVictimPhone((prev) => prev || savedPhone)
      }
    }
    loadRegisteredPhone()
  }, [])

  const emergencyTypes: EmergencyType[] = [
    {
      id: "medical",
      label: t("emergency.medicalEmergency"),
      description: t("emergency.medicalEmergencyDesc"),
      icon: Heart,
      color: "text-red-600",
      gradient: "from-red-500 to-pink-600"
    },
    {
      id: "fire",
      label: t("emergency.fireEmergency"),
      description: t("emergency.fireEmergencyDesc"),
      icon: Flame,
      color: "text-orange-600",
      gradient: "from-orange-500 to-red-600"
    },
    {
      id: "security",
      label: t("emergency.securityEmergency"),
      description: t("emergency.securityEmergencyDesc"),
      icon: Shield,
      color: "text-blue-600",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      id: "other",
      label: t("emergency.otherEmergency"),
      description: t("emergency.otherEmergencyDesc"),
      icon: HelpCircle,
      color: "text-gray-600",
      gradient: "from-gray-500 to-slate-600"
    }
  ]

  // Get user location on mount and watch real-time updates as user moves
  useEffect(() => {
    let watchId: number | null = null
    getLocation(true)

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setLocation((prev) => {
              if (!prev || Math.abs(prev.lat - newLoc.lat) > 0.0005 || Math.abs(prev.lng - newLoc.lng) > 0.0005) {
                fetchNearbyEmergencyFacilities(newLoc.lat, newLoc.lng)
                fetch(`/api/places?reverse=1&lat=${newLoc.lat}&lon=${newLoc.lng}`)
                  .then((r) => r.json())
                  .then((data) => {
                    if (data?.display_name) {
                      setGeocodedArea(data.display_name)
                      setDetailedAddress((prev) => (prev ? prev : data.display_name))
                    }
                  })
                  .catch(() => {})
                return newLoc
              }
              return prev
            })
            if (pos.coords.accuracy) {
              setLocationAccuracy(Math.round(pos.coords.accuracy))
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
        )
      } catch {}
    }

    return () => {
      if (watchId !== null && typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  // Panic timer countdown
  useEffect(() => {
    if (panicTimer !== null && panicTimer > 0) {
      const interval = setInterval(() => {
        setPanicTimer(prev => (prev !== null && prev > 0 ? prev - 1 : null))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [panicTimer])

  // Poll and realtime sync the alert so the sender sees when a responder accepts or resolves it
  useEffect(() => {
    if (!sosActive || !alertId || alertId.startsWith("mock-")) return
    let stopped = false
    const check = async () => {
      try {
        const res = await fetch(`/api/alerts/${alertId}`, { cache: "no-store" })
        const data = await res.json()
        if (stopped || !data.success) return
        if (typeof data.notified === "number") setNotifiedCount(data.notified)
        if (data.status === "responding" && data.responder?.name) {
          setAcceptedBy((prev) => {
            if (!prev) {
              toast({
                title: t("sos.accepted", "Help is on the way!"),
                description: `${data.responder.name} ${t("sos.acceptedDesc", "accepted your SOS")}`,
              })
            }
            return data.responder.name
          })
          setPanicTimer(null)
        }
        if (data.status === "resolved" || data.status === "cancelled") {
          toast({
            title: t("sos.resolved", "Emergency Resolved"),
            description: t("sos.resolvedDesc", "The responder marked this emergency as resolved"),
          })
          resetSOS()
        }
      } catch {
        /* temporary network problem: try again next tick */
      }
    }
    check()
    const timer = setInterval(check, 2000)

    // Realtime Supabase channel for instant sub-second resolution sync
    const channel = supabase
      .channel(`victim-alert-sync-${alertId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
          filter: `id=eq.${alertId}`,
        },
        (payload) => {
          if (stopped) return
          const updated = payload.new as any
          if (updated && (updated.status === "resolved" || updated.status === "cancelled")) {
            toast({
              title: t("sos.resolved", "Emergency Resolved"),
              description: t("sos.resolvedDesc", "The responder marked this emergency as resolved"),
            })
            resetSOS()
          } else if (updated?.status === "responding") {
            setAcceptedBy((prev) => prev || "Assigned Responder")
            setPanicTimer(null)
          }
        }
      )
      .subscribe()

    // Same-browser / cross-tab instant resolution listener
    const onResolvedEvent = (e: any) => {
      if (stopped) return
      const resolvedId =
        e?.detail?.alertId ||
        (typeof window !== "undefined" ? localStorage.getItem("bridgex_last_resolved_alert_id") : null)
      if (resolvedId && (resolvedId === alertId || !alertId)) {
        toast({
          title: t("sos.resolved", "Emergency Resolved"),
          description: t("sos.resolvedDesc", "The responder marked this emergency as resolved"),
        })
        resetSOS()
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("bridgex_emergency_resolved", onResolvedEvent)
      window.addEventListener("storage", onResolvedEvent)
    }

    return () => {
      stopped = true
      clearInterval(timer)
      supabase.removeChannel(channel)
      if (typeof window !== "undefined") {
        window.removeEventListener("bridgex_emergency_resolved", onResolvedEvent)
        window.removeEventListener("storage", onResolvedEvent)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sosActive, alertId])

  // Nobody accepted within 2 minutes -> widen the search (once)
  useEffect(() => {
    if (panicTimer === 0 && sosActive && alertId && !acceptedBy && !escalatedRef.current) {
      escalatedRef.current = true
      fetch(`/api/alerts/${alertId}/escalate`, { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          toast({
            title: t("sos.escalated", "Alert escalated"),
            description:
              d?.notified > 0
                ? `${d.notified} ${t("sos.moreNotified", "more responders notified over a wider area")}`
                : t("sos.callNow", "No more responders available. Please call 112 now."),
          })
        })
        .catch(() => {})
    }
  }, [panicTimer, sosActive, alertId, acceptedBy, toast, t])

  const fetchNearbyEmergencyFacilities = async (lat: number, lng: number) => {
    setNearbyLoading(true)
    try {
      const places = await fetchNearbyPlaces(lat, lng, 5000)
      setNearbyFacilities(places || [])
    } catch (err) {
      console.warn("Nearby facilities fetch failed:", err)
    } finally {
      setNearbyLoading(false)
    }
  }

  const translateMessage = async (textToTranslate: string, langHint?: string) => {
    const trimmed = textToTranslate?.trim()
    if (!trimmed) {
      setTranslatedEnglish("")
      return
    }

    // Auto-detect Indic script offline (Marathi, Hindi, Bengali, Tamil, etc.)
    const script = detectIndicLanguage(trimmed)
    const effectiveLang = script.lang || langHint || (detectedSourceLang || undefined)

    setIsTranslating(true)
    try {
      const res = await fetch("/api/lingo/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          targetLang: "en",
          sourceLang: effectiveLang,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.translatedText) {
          setTranslatedEnglish(data.translatedText)
        }
        if (data.sourceLang && data.sourceLang !== "und") {
          setDetectedSourceLang(data.sourceLang)
        } else if (script.lang) {
          setDetectedSourceLang(script.lang)
        }
      }
    } catch (err) {
      console.warn("Translation failed:", err)
    } finally {
      setIsTranslating(false)
    }
  }

  const getLocation = async (forceFresh = false) => {
    setLocationLoading(true)
    try {
      const coords = await getUserLocation(forceFresh, victimPhone)
      const newLoc = {
        lat: coords.lat,
        lng: coords.lng
      }
      setLocation(newLoc)
      if (coords.accuracy) {
        setLocationAccuracy(Math.round(coords.accuracy))
      }
      fetchNearbyEmergencyFacilities(newLoc.lat, newLoc.lng)

      // Auto reverse-geocode area name via server route
      fetch(`/api/places?reverse=1&lat=${newLoc.lat}&lon=${newLoc.lng}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.display_name) {
            setGeocodedArea(data.display_name)
            setDetailedAddress((prev) => (prev ? prev : data.display_name))
          }
        })
        .catch(() => {})
    } catch (error) {
      console.warn("Could not get location:", error)
      const fallbackLoc = { lat: 19.2183, lng: 72.9781 }
      setLocation(fallbackLoc)
      fetchNearbyEmergencyFacilities(fallbackLoc.lat, fallbackLoc.lng)
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSOSClick = () => {
    if (sosActive) {
      cancelSOS()
      return
    }
    setShowDetails(true)
  }

  const handleQuickSOS = async () => {
    await sendSOS(true)
  }

  const sendSOS = async (quick: boolean = false) => {
    setIsActivating(true)

    try {
      // Validate location
      if (!location) {
        await getLocation()
        if (!location) {
          throw new Error("Location is required for SOS alerts")
        }
      }

      // Get current user (optional, works without auth)
      let userId = `guest-${Date.now()}`
      let userName = "Guest User"
      let isGuest = true
      
      let phoneToUse = victimPhone
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
          isGuest = false
          userName = user.user_metadata?.name || user.email || "User"
          if (!phoneToUse) {
            phoneToUse = user.user_metadata?.phone || (user as any).phone || ""
          }
        }
      } catch (authError) {
        console.warn('No authenticated user, using guest mode:', authError)
      }

      if (!phoneToUse && typeof window !== "undefined") {
        phoneToUse = localStorage.getItem("bridgex_user_phone") || ""
      }

      // Auto-detect emergency type and organization routing
      const detected = classifyEmergency(message, effectiveTranslatedEnglish || translatedEnglish)
      const finalEmergencyType = (selectedType && selectedType !== "auto" && selectedType !== "other")
        ? selectedType
        : (detected.category !== "other" ? detected.category : "medical")

      const routedOrg =
        finalEmergencyType === "fire"
          ? "Fire Brigade & Rescue Service"
          : finalEmergencyType === "security"
          ? "Police & Law Enforcement"
          : "Hospital & Ambulance Emergency Service"

      const routedHelpline =
        finalEmergencyType === "fire"
          ? "101"
          : finalEmergencyType === "security"
          ? "112"
          : "102 / 108"

      // Resolved address automatically from GPS Geolocation
      const resolvedAddress = geocodedArea || detailedAddress || (location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "GPS Geolocation Acquired")

      // Prepare alert data with both English translated version & native transcription
      // Use live translation if available, fallback to server-translated or original
      const bestEnglishTranslation = effectiveTranslatedEnglish || translatedEnglish || message || t("emergencyAlert", "Emergency alert")
      const alertData = {
        userId,
        userName,
        emergencyType: finalEmergencyType,
        urgencyLevel: "high",
        message: bestEnglishTranslation,
        originalMessage: message,
        sourceLanguage: detectedSourceLang || liveTranslation.sourceLang || (detectIndicLanguage(message).lang) || voiceLang.split("-")[0],
        phone: phoneToUse,
        location: {
          lat: location.lat,
          lng: location.lng,
          accuracy: locationAccuracy || 10,
          address: resolvedAddress,
          details: resolvedAddress
        },
        attachments: uploadedFiles.map(f => ({
          name: f.name,
          url: f.url,
          type: f.type,
          size: f.size
        })),
        metadata: {
          phone: phoneToUse,
          victim_phone: phoneToUse,
          routed_organization: routedOrg,
          routed_helpline: routedHelpline,
          detected_category: finalEmergencyType,
          detected_confidence: detected.confidence,
          matched_keywords: detected.keywordsMatched,
          address_details: resolvedAddress,
          geocoded_area: geocodedArea,
          reported_facility: reportedFacility,
          nearest_facilities: nearbyFacilities.slice(0, 5).map(f => ({
            name: f.name,
            category: f.category,
            distance: f.distance,
            phone: f.phone
          })),
          batteryLevel: await getBatteryLevel(),
          deviceInfo: navigator.userAgent,
          timestamp: new Date().toISOString(),
          quickSOS: quick
        }
      }

      // Send to API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await authFetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('API error response:', errorData)
        throw new Error(errorData.error || `Failed to send SOS alert (${response.status})`)
      }

      const result = await response.json()
      const newAlertId = result.alert?.id || null
      setAlertId(newAlertId)
      if (typeof window !== "undefined" && newAlertId) {
        localStorage.setItem("bridgex_active_sos_id", newAlertId)
      }
      setGuestId(isGuest ? userId : null)
      setNotifiedCount(typeof result.dispatch?.notified === "number" ? result.dispatch.notified : null)
      setAcceptedBy(null)
      escalatedRef.current = false

      // Show responders' English version when the message was translated
      const englishMessage: string | undefined = result.alert?.message
      const wasTranslated = !!englishMessage && !!message && englishMessage !== message
      setSentAs(wasTranslated ? englishMessage! : null)

      // Activate SOS mode
      setSosActive(true)
      setShowDetails(false)
      setPanicTimer(120) // 2 minutes

      // Request notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission()
        }
        
        if (Notification.permission === 'granted') {
          new Notification(t("alertActive", "Alert Active"), {
            body: t("respondersNotified", "Responders have been notified"),
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'sos-alert',
            requireInteraction: true
          })
        }
      }

      toast({
        title: t("sosAlertSent", "SOS Alert Sent!"),
        description: wasTranslated
          ? `${t("sos.sentAs", "Sent to responders as:")} ${englishMessage}`
          : result.dispatch?.notified > 0
            ? `${result.dispatch.notified} ${t("sos.respondersAlerted", "nearby responders alerted")}`
            : t("sos.noneNearby", "No registered responders in range yet. Call 112 for immediate help."),
      })

    } catch (error: any) {
      console.error("Failed to send SOS:", error)
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      })
      
      let errorMessage = t("failedToSendSOS", "Failed to send SOS alert")
      if (error.name === 'AbortError') {
        errorMessage = t("requestTimeout", "Request timed out. Please check your connection and try again.")
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: t("error", "Error"),
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsActivating(false)
    }
  }

  const resetSOS = () => {
    setSosActive(false)
    setPanicTimer(null)
    setShowDetails(true)
    setMessage("")
    setTranslatedEnglish("")
    setDetectedSourceLang("")
    setReportedFacility(null)
    setUploadedFiles([])
    setAlertId(null)
    setSentAs(null)
    setNotifiedCount(null)
    setAcceptedBy(null)
    setGuestId(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("bridgex_active_sos_id")
    }
    setResetSignal((k) => k + 1)
  }

  const cancelSOS = async () => {
    const id = alertId
    if (id && !id.startsWith("mock-") && !id.startsWith("offline-")) {
      try {
        const res = await authFetch(`/api/alerts/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "cancel", guestId }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          toast({ title: t("error", "Error"), description: d.error || "Could not cancel the alert on the server", variant: "destructive" })
          return
        }
      } catch {
        toast({ title: t("error", "Error"), description: "Could not reach the server to cancel. Please try again.", variant: "destructive" })
        return
      }
    }
    resetSOS()
    toast({
      title: t("alertCancelled", "Alert Cancelled"),
      description: t("alertCancelledDesc", "Your SOS alert has been cancelled and all responders were told"),
    })
  }

  const handleClearMessage = () => {
    setMessage("")
    setTranslatedEnglish("")
    setDetectedSourceLang("")
    setSentAs(null)
    setResetSignal((k) => k + 1)
  }

  const handleVoiceTranscript = (
    transcriptText: string,
    directTranslation?: string,
    detectedCategory?: string,
    detectedLang?: string
  ) => {
    const trimmed = transcriptText?.trim() || ""
    setMessage(trimmed)
    if (!trimmed) {
      setTranslatedEnglish("")
      setDetectedSourceLang("")
      return
    }

    if (directTranslation) {
      setTranslatedEnglish(directTranslation)
    }

    if (detectedLang) {
      setDetectedSourceLang(detectedLang)
    } else {
      const script = detectIndicLanguage(trimmed)
      const detected = script.lang || "hi"
      setDetectedSourceLang(detected)
    }

    // Auto-detect and route the emergency department on its own!
    if (detectedCategory && detectedCategory !== "other") {
      setSelectedType(detectedCategory)
    } else {
      const detected = classifyEmergency(trimmed, directTranslation || effectiveTranslatedEnglish)
      if (detected.category !== "other") {
        setSelectedType(detected.category)
      }
    }

    if (!directTranslation) {
      translateMessage(trimmed, detectedLang || undefined)
    }
  }

  const handleFileUpload = (files: any[]) => {
    setUploadedFiles(files)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getBatteryLevel = async (): Promise<number | undefined> => {
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery()
        return Math.round(battery.level * 100)
      } catch {
        return undefined
      }
    }
    return undefined
  }

  const selectedEmergency = emergencyTypes.find(t => t.id === selectedType)

  // Sync live translation to translatedEnglish so SOS submission and classifier use the latest
  const liveTranslatedText = liveTranslation.translatedText
  const effectiveTranslatedEnglish = liveTranslatedText && liveTranslatedText !== message
    ? liveTranslatedText
    : translatedEnglish

  const detectedEmergency = classifyEmergency(message, effectiveTranslatedEnglish)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Feature 1: Safety Check-in Timer — shown when user is not in active SOS */}
      {!sosActive && (
        <SafetyCheckin
          onAutoSOS={async () => {
            setMessage((prev) => prev || "Auto-SOS: Safety check-in timer expired. User may be in danger.")
            await sendSOS(true)
          }}
          sosActive={sosActive}
        />
      )}

      {/* Main SOS Card */}
      <Card className="overflow-hidden border-2 shadow-2xl">
        <div className="bg-gradient-to-br from-background via-muted/30 to-background p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-600 mb-4 shadow-lg">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              {t("emergencyInterface", "Emergency SOS")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("helpInOneTap", "Get help in one tap - responders will be notified immediately")}
            </p>
          </div>

          {/* SOS Button - Initial State */}
          {!showDetails && !sosActive && (
            <div className="space-y-6">
              <Button
                size="lg"
                onClick={handleSOSClick}
                disabled={isActivating || locationLoading}
                className="w-full h-40 text-4xl font-bold bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-3xl shadow-2xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
              >
                {isActivating ? (
                  <Loader2 className="w-16 h-16 animate-spin" />
                ) : locationLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <span className="text-xl">Getting location...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <AlertTriangle className="w-20 h-20" />
                    <span>{t("sendSOS", "SEND SOS")}</span>
                  </div>
                )}
              </Button>

              {/* Quick Emergency Life-Saving Utilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <EmergencyBeacon triggerClassName="w-full justify-center h-12 text-sm bg-red-600 hover:bg-red-700 text-white" />
                <FirstAidGuide triggerClassName="w-full justify-center h-12 text-sm border-2" />
              </div>

              {/* Feature Badges */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MapPin, label: t("locationShared", "Location Shared"), color: "blue" },
                  { icon: Phone, label: t("instantContact", "Instant Contact"), color: "green" },
                  { icon: Radio, label: t("multilingualTranslation", "Multilingual"), color: "purple" },
                  { icon: Clock, label: t("autoEscalate", "Auto Escalate"), color: "orange" }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-muted-foreground/10 hover:bg-muted/70 transition-colors">
                    <div className={`p-2 rounded-lg bg-${feature.color}-500/10`}>
                      <feature.icon className={`w-5 h-5 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* Location Status */}
              {location && (
                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Location detected:</strong> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Active SOS State */}
          {sosActive && (
            <div className="space-y-6">
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950/30 border-2">
                <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                <AlertTitle className="text-red-900 dark:text-red-100 text-xl font-bold">
                  {t("alertActive", "🚨 SOS Alert Active")}
                </AlertTitle>
                <AlertDescription className="text-red-800 dark:text-red-200 text-base mt-2">
                  {acceptedBy
                    ? `✅ ${acceptedBy} ${t("sos.acceptedDesc", "accepted your SOS and is on the way")}`
                    : notifiedCount === 0
                      ? t("sos.noneNearby", "No registered responders in range yet. Call 112 for immediate help.")
                      : notifiedCount !== null
                        ? `${notifiedCount} ${t("sos.respondersAlerted", "nearby responders alerted")}. ${t("sos.waiting", "Waiting for one to accept…")}`
                        : t("respondersNotified", "Emergency responders have been notified")}
                </AlertDescription>
              </Alert>

              {/* Timer and Status */}
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-300 dark:border-orange-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                        <span className="text-lg font-semibold">{acceptedBy ? "Responder assigned" : "Broadcasting SOS Signal"}</span>
                      </div>
                      <Badge variant={acceptedBy ? "default" : "destructive"} className="text-base px-4 py-1">
                        {acceptedBy ? "ACCEPTED" : "ACTIVE"}
                      </Badge>
                    </div>

                    {panicTimer !== null && panicTimer > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Auto-escalation in:</span>
                          <span className="text-2xl font-mono font-bold text-orange-600">
                            {formatTime(panicTimer)}
                          </span>
                        </div>
                        <Progress value={((120 - panicTimer) / 120) * 100} className="h-2" />
                      </div>
                    )}

                    {victimPhone && (
                      <div className="flex items-center justify-between text-xs bg-muted/60 p-2.5 rounded-md">
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-green-600" />
                          Victim Contact Mobile:
                        </span>
                        <span className="font-bold text-foreground">{victimPhone}</span>
                      </div>
                    )}

                    {(sentAs || translatedEnglish) && (
                      <div className="text-sm rounded-md bg-muted p-3 space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Languages className="w-3 h-3 text-blue-500" />
                          {t("sos.sentAs", "Broadcast to Responders (English):")}
                        </div>
                        <div className="font-semibold text-foreground">{sentAs || translatedEnglish}</div>
                        {message && message !== (sentAs || translatedEnglish) && (
                          <div className="text-xs text-muted-foreground pt-1 border-t mt-1">
                            Original ({detectedSourceLang || voiceLang.split("-")[0]}): {message}
                          </div>
                        )}
                      </div>
                    )}

                    {reportedFacility && (
                      <div className="text-xs text-muted-foreground bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2 rounded-md">
                        🚨 Tagged Emergency Facility: <span className="font-semibold text-foreground">{reportedFacility}</span>
                      </div>
                    )}

                    {alertId && (
                      <div className="text-xs text-muted-foreground">
                        Alert ID: <code className="bg-muted px-2 py-1 rounded">{alertId}</code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cancel Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={cancelSOS}
                className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold"
              >
                <X className="w-5 h-5 mr-2" />
                {t("cancelAlert", "Cancel Alert")}
              </Button>
            </div>
          )}

          {/* Emergency Details Form */}
          {showDetails && !sosActive && (
            <div className="space-y-6">
              {/* 1. Voice Input & AI Language Auto-Detection (TOP) */}
              <div className="space-y-3 rounded-2xl border-2 p-5 bg-gradient-to-br from-purple-500/10 via-background to-card shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                    <span className="font-bold text-base text-foreground">
                      Voice Input & AI Language Auto-Detection
                    </span>
                  </div>
                  <Badge className="bg-purple-600 text-white text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {detectedSourceLang && LANGUAGE_NAMES[detectedSourceLang] 
                      ? LANGUAGE_NAMES[detectedSourceLang]
                      : "Auto-Detecting Language..."}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Tap to speak in <strong>Marathi, Hindi, Bengali, Tamil, Telugu, English</strong>, or any Indian language. BridgeX automatically detects your language, translates it to English, and classifies the emergency department in real time.
                </p>

                {/* Voice Input with Automated Language Detection, Transcription & Routing */}
                <div className="pt-1">
                  <VoiceInputV2
                    onTranscript={(interim) => {
                      // Live speech streaming feedback
                    }}
                    onFinalTranscript={handleVoiceTranscript}
                    onClear={handleClearMessage}
                    resetKey={resetSignal}
                  />
                </div>
              </div>

              {/* 2. Message Input & Live Translation (TOP) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emergency-message" className="text-base font-semibold">
                    {t("additionalDetails", "Describe Emergency in Any Language")}
                  </Label>
                  <div className="flex items-center gap-2">
                    {message.trim() && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 gap-1 text-muted-foreground hover:text-destructive"
                        onClick={handleClearMessage}
                      >
                        <X className="w-3.5 h-3.5" />
                        {t("clear", "Clear")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 gap-1 text-primary"
                      onClick={() => translateMessage(message)}
                      disabled={!message || isTranslating}
                    >
                      <Languages className="w-3.5 h-3.5" />
                      Translate to English
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="emergency-message"
                  placeholder="उदा. मला मदत हवी आहे / मुझे तुरंत मदद चाहिए / I need medical help..."
                  value={message}
                  onChange={(e) => {
                    const val = e.target.value
                    setMessage(val)
                    if (val.trim().length > 2) {
                      const script = detectIndicLanguage(val)
                      if (script.lang) {
                        setDetectedSourceLang(script.lang)
                      }
                    }
                  }}
                  rows={3}
                  className="resize-none text-base"
                />

                {/* Feature 3: Real-Time Live Translation Preview (fires as you type) */}
                {message.trim().length > 2 && (
                  <div className="rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-100">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Live English Translation (Broadcasting to Responders):
                      </span>
                      {liveTranslation.isTranslating ? (
                        <span className="flex items-center gap-1 text-blue-600 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" /> Translating…
                        </span>
                      ) : (
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px]">
                          {(liveTranslation.sourceLang || detectedSourceLang) && LANGUAGE_NAMES[liveTranslation.sourceLang || detectedSourceLang]
                            ? `Detected: ${LANGUAGE_NAMES[liveTranslation.sourceLang || detectedSourceLang]}`
                            : liveTranslation.provider === "gemini" ? "AI Translated" : "Auto-Translated"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground bg-background p-3 rounded-lg border shadow-sm min-h-[2.5rem]">
                      {liveTranslation.isTranslating
                        ? <span className="text-muted-foreground italic">Translating in real time…</span>
                        : (liveTranslation.translatedText || message)}
                    </p>
                    {liveTranslation.translatedText && liveTranslation.translatedText !== message && (
                      <p className="text-xs text-muted-foreground">
                        Original ({LANGUAGE_NAMES[liveTranslation.sourceLang] || liveTranslation.sourceLang || "Native"}): <span className="text-foreground font-medium">{message}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Emergency Department Routing (Direct Selection & AI Auto-Detection) */}
              <div className="space-y-3 rounded-2xl border-2 p-5 bg-gradient-to-br from-card via-card/90 to-muted/30 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span className="font-bold text-base text-foreground">
                      Target Emergency Department
                    </span>
                  </div>
                  <Badge
                    className={`${
                      (selectedType !== "auto" ? selectedType : detectedEmergency.category) === "fire"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : (selectedType !== "auto" ? selectedType : detectedEmergency.category) === "security"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white font-semibold text-xs capitalize`}
                  >
                    {selectedType === "auto"
                      ? (detectedEmergency.category !== "other" ? `AI Auto: ${detectedEmergency.category}` : "AI Auto: Medical")
                      : `Manual: ${selectedType}`}
                  </Badge>
                </div>

                {/* Direct Department Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { id: "auto", label: "Auto (AI)", icon: Sparkles, color: "text-amber-500", desc: "Auto-detect" },
                    { id: "medical", label: "Medical (102)", icon: Heart, color: "text-red-500", desc: "Ambulance" },
                    { id: "fire", label: "Fire (101)", icon: Flame, color: "text-orange-500", desc: "Fire Brigade" },
                    { id: "security", label: "Police (112)", icon: Shield, color: "text-blue-500", desc: "Law Enforcement" },
                  ].map((dept) => {
                    const isSelected = selectedType === dept.id
                    const Icon = dept.icon
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setSelectedType(dept.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-xs transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm font-bold ring-2 ring-primary/20"
                            : "border-border bg-card/60 hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${dept.color}`} />
                        <span className="font-semibold text-foreground text-[11px]">{dept.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Routed Organization Card */}
                {(() => {
                  const currentDept = (selectedType && selectedType !== "auto" && selectedType !== "other")
                    ? selectedType
                    : (detectedEmergency.category !== "other" ? detectedEmergency.category : "medical")

                  const meta = currentDept === "fire"
                    ? {
                        label: "FIRE BRIGADE & RESCUE SERVICE",
                        org: "Fire Brigade & Rescue Department (101)",
                        helpline: "101",
                        gradient: "from-orange-600 via-amber-600 to-red-600",
                        icon: Flame,
                      }
                    : currentDept === "security"
                    ? {
                        label: "POLICE & LAW ENFORCEMENT",
                        org: "Police & Security Command (112)",
                        helpline: "112",
                        gradient: "from-blue-600 via-indigo-600 to-sky-700",
                        icon: Shield,
                      }
                    : {
                        label: "HOSPITAL & TRAUMA EMERGENCY",
                        org: "Emergency Ambulance & Medical Response (102 / 108)",
                        helpline: "102 / 108",
                        gradient: "from-red-600 via-rose-600 to-red-700",
                        icon: Heart,
                      }

                  const DeptIcon = meta.icon
                  return (
                    <div className={`p-4 rounded-xl border-2 text-white bg-gradient-to-r ${meta.gradient} shadow-lg space-y-2.5 transition-all`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-white/20">
                            <DeptIcon className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <div className="text-lg font-extrabold tracking-tight">
                              {meta.label}
                            </div>
                            <div className="text-xs text-white/95 font-medium">
                              Dispatched Directly To: <strong>{meta.org}</strong>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-white/20 text-white font-bold border-white/30 text-xs flex-shrink-0">
                          Helpline: {meta.helpline}
                        </Badge>
                      </div>

                      {detectedEmergency.keywordsMatched.length > 0 && selectedType === "auto" && (
                        <div className="text-xs text-white/85 pt-1.5 border-t border-white/20 flex items-center gap-1.5 flex-wrap">
                          <span>Auto-classified from:</span>
                          {detectedEmergency.keywordsMatched.map((kw, i) => (
                            <span key={i} className="bg-white/25 px-2 py-0.5 rounded text-[11px] font-bold">
                              "{kw}"
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* 4. SEND SOS ALERT BUTTON (Prominent at TOP) */}
              <div className="space-y-3 pt-2 pb-2">
                <Button
                  size="lg"
                  onClick={() => sendSOS(false)}
                  disabled={isActivating}
                  className="w-full h-16 text-xl font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.01] active:scale-95"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      {t("broadcasting", "Broadcasting Emergency...")}
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6 mr-3" />
                      {t("sendSOS", "SEND SOS ALERT NOW")}
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleQuickSOS}
                    disabled={isActivating}
                    className="w-full text-xs font-semibold"
                  >
                    {t("skipDetails", "Quick SOS (Instant)")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => setShowDetails(false)}
                    className="w-full text-xs"
                  >
                    {t("cancel", "Cancel")}
                  </Button>
                </div>
              </div>

              {/* 5. Automatic GPS Geolocation (BELOW) */}
              <div className="space-y-3 rounded-2xl border-2 p-5 bg-gradient-to-br from-emerald-500/10 via-background to-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span className="font-bold text-base text-foreground">
                      Automatic GPS Geolocation
                    </span>
                  </div>
                  {locationLoading ? (
                    <Badge variant="outline" className="text-xs flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                      Acquiring GPS...
                    </Badge>
                  ) : location ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        GPS Acquired
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => getLocation(true)}
                        className="h-7 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
                      >
                        Refresh GPS
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => getLocation(true)}
                      className="h-7 text-xs text-emerald-700"
                    >
                      Retry GPS
                    </Button>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border bg-background/90 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      Coordinates:
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Acquiring GPS coordinates..."}
                      {locationAccuracy ? ` (±${locationAccuracy}m precision)` : ""}
                    </span>
                  </div>

                  <div className="text-xs border-t pt-2 space-y-1">
                    <span className="text-muted-foreground font-medium block">
                      Resolved Area via Geolocation (Automatic):
                    </span>
                    <p className="font-semibold text-foreground text-sm leading-snug">
                      {geocodedArea || (locationLoading ? "Resolving precise location..." : location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Waiting for GPS authorization...")}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  Your exact GPS location is transmitted directly to dispatch and responders automatically. No manual address entry required.
                </p>
              </div>

              {/* 6. Registered Victim Emergency Mobile (BELOW - saved from account) */}
              <div className="space-y-3 rounded-2xl border-2 p-5 bg-gradient-to-br from-blue-500/10 via-background to-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-base text-foreground">
                      Registered Victim Emergency Mobile
                    </span>
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Auto-Linked
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl border bg-background/90 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">Contact Phone Transmitted to Responders:</div>
                    <div className="text-lg font-bold font-mono tracking-wide text-foreground">
                      {victimPhone || (typeof window !== "undefined" && localStorage.getItem("bridgex_user_phone")) || "Registered Contact Connected"}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  Mobile number saved during registration is automatically used for this SOS alert.
                </p>
              </div>

              {/* 7. Real Nearby Emergency Centers (BELOW) */}
              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-500" />
                    Nearby Real Emergency Centers
                  </Label>
                  {location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Real emergency facilities near your GPS location. Click to call directly or report this emergency:
                </p>

                {nearbyLoading ? (
                  <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Locating real nearby hospitals, fire stations & police...
                  </div>
                ) : nearbyFacilities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Nearest Hospital */}
                    {(() => {
                      const hospital = nearbyFacilities.find((p) => p.category === "hospital" || p.category === "clinic")
                      if (!hospital) return null
                      const isReported = reportedFacility === hospital.name
                      return (
                        <div className={`p-3 rounded-lg border text-xs space-y-2 bg-background shadow-sm ${isReported ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold truncate text-foreground flex items-center gap-1">
                              🏥 {hospital.name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                              {hospital.distance ? formatDistance(hospital.distance) : "Nearby"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {hospital.address || "Hospital & Trauma Unit"}
                          </p>
                          <div className="flex gap-1.5 pt-1">
                            <a
                              href={`tel:${hospital.phone || "102"}`}
                              className="flex-1 py-1 px-2 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold text-center text-[11px] hover:bg-red-200"
                            >
                              📞 Call (102)
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedType("medical")
                                setReportedFacility(hospital.name)
                                toast({
                                  title: "Facility Tagged",
                                  description: `Alert routed to ${hospital.name}`,
                                })
                              }}
                              className={`flex-1 py-1 px-2 rounded font-semibold text-center text-[11px] transition-all ${
                                isReported
                                  ? "bg-red-600 text-white"
                                  : "bg-muted hover:bg-muted/80 text-foreground"
                              }`}
                            >
                              {isReported ? "✓ Reported" : "Report"}
                            </button>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Nearest Police Station */}
                    {(() => {
                      const police = nearbyFacilities.find((p) => p.category === "police")
                      const isReported = reportedFacility === police?.name
                      return (
                        <div className={`p-3 rounded-lg border text-xs space-y-2 bg-background shadow-sm ${isReported ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold truncate text-foreground flex items-center gap-1">
                              👮 {police?.name || "Police Control Room"}
                            </span>
                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                              {police?.distance ? formatDistance(police.distance) : "Nearby"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {police?.address || "Police Emergency Dispatch"}
                          </p>
                          <div className="flex gap-1.5 pt-1">
                            <a
                              href={`tel:${police?.phone || "112"}`}
                              className="flex-1 py-1 px-2 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-center text-[11px] hover:bg-blue-200"
                            >
                              📞 Call (112)
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedType("security")
                                setReportedFacility(police?.name || "Police Control")
                                toast({
                                  title: "Facility Tagged",
                                  description: `Alert routed to ${police?.name || "Police Control Room"}`,
                                })
                              }}
                              className={`flex-1 py-1 px-2 rounded font-semibold text-center text-[11px] transition-all ${
                                isReported
                                  ? "bg-blue-600 text-white"
                                  : "bg-muted hover:bg-muted/80 text-foreground"
                              }`}
                            >
                              {isReported ? "✓ Reported" : "Report"}
                            </button>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Nearest Fire Station */}
                    {(() => {
                      const fire = nearbyFacilities.find((p) => p.category === "fire_station")
                      const isReported = reportedFacility === fire?.name
                      return (
                        <div className={`p-3 rounded-lg border text-xs space-y-2 bg-background shadow-sm ${isReported ? 'border-orange-500 ring-1 ring-orange-500' : ''}`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold truncate text-foreground flex items-center gap-1">
                              🚒 {fire?.name || "Fire Department"}
                            </span>
                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                              {fire?.distance ? formatDistance(fire.distance) : "Nearby"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {fire?.address || "Fire & Rescue Station"}
                          </p>
                          <div className="flex gap-1.5 pt-1">
                            <a
                              href={`tel:${fire?.phone || "101"}`}
                              className="flex-1 py-1 px-2 rounded bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold text-center text-[11px] hover:bg-orange-200"
                            >
                              📞 Call (101)
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedType("fire")
                                setReportedFacility(fire?.name || "Fire Station")
                                toast({
                                  title: "Facility Tagged",
                                  description: `Alert routed to ${fire?.name || "Fire Station"}`,
                                })
                              }}
                              className={`flex-1 py-1 px-2 rounded font-semibold text-center text-[11px] transition-all ${
                                isReported
                                  ? "bg-orange-600 text-white"
                                  : "bg-muted hover:bg-muted/80 text-foreground"
                              }`}
                            >
                              {isReported ? "✓ Reported" : "Report"}
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/40 rounded-lg text-xs flex items-center justify-between">
                    <span>Emergency Helplines: Ambulance 102 | Police 112 | Fire 101</span>
                    <a href="tel:112" className="text-red-600 font-bold hover:underline">
                      Call 112
                    </a>
                  </div>
                )}
              </div>

              {/* 8. File Upload (BELOW) */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {t("attachFiles", "Attach Photos/Videos")} <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <FileUploadV2
                  onFilesChange={handleFileUpload}
                  maxFiles={5}
                  maxSizeMB={10}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      {!sosActive && !showDetails && (
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {t("howItWorks", "How It Works")}
            </h3>
            <div className="space-y-3">
              {emergencyTypes.map((type, idx) => {
                const Icon = type.icon
                return (
                  <div key={type.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="p-2 rounded-lg bg-background">
                      <Icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
