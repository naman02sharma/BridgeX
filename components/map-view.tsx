"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Loader2, Hospital, Flame, Shield, Stethoscope } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase"
import { useSupabase } from "@/components/supabase-provider"
import { getUserLocation, calculateDistance, formatDistance } from "@/lib/geolocation"
import { useGlobalTranslation } from "@/components/translation-provider"

// Dynamically import the entire map component to avoid SSR issues
const MapContent = dynamic(() => import("./map-content"), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex flex-col items-center justify-center bg-muted/10 gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading Emergency Map...</span>
    </div>
  )
})

interface Location {
  lat: number
  lng: number
}

interface FacilityMarker {
  id: string
  name: string
  type: string
  distance: string
  distanceKm: number
  lat: number
  lng: number
  available: boolean
  phone?: string
  address?: string
}

export function MapView() {
  const { t } = useGlobalTranslation()
  const { user } = useSupabase()
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [facilities, setFacilities] = useState<FacilityMarker[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")

  // Auto-acquire user location on mount (auto-detects accurate GPS / phone location)
  useEffect(() => {
    let mounted = true
    const initLocation = async () => {
      setLoading(true)
      try {
        const coords = await getUserLocation(false, user?.phone)
        if (mounted && coords) {
          const loc = { lat: coords.lat, lng: coords.lng }
          setUserLocation(loc)
          await loadMapResources(loc)
        }
      } catch (err) {
        console.warn("Location init error:", err)
        const fallback = { lat: 18.9894, lng: 73.1175 }
        if (mounted) {
          setUserLocation(fallback)
          await loadMapResources(fallback)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initLocation()
    return () => { mounted = false }
  }, [user?.phone])

  // Manual refresh GPS location
  const handleRefreshLocation = async () => {
    setLoading(true)
    try {
      localStorage.removeItem("bridgex_user_coords")
      const coords = await getUserLocation(true, user?.phone)
      const loc = { lat: coords.lat, lng: coords.lng }
      setUserLocation(loc)
      await loadMapResources(loc)
    } finally {
      setLoading(false)
    }
  }

  // Load both real nearby emergency facilities and active online responders
  const loadMapResources = async (location: Location) => {
    const combined: FacilityMarker[] = []
    const seen = new Set<string>()

    // 1. Fetch real nearby hospitals, fire stations, police stations via /api/places
    try {
      const placesRes = await fetch(`/api/places?lat=${location.lat}&lon=${location.lng}&radius=20000`)
      if (placesRes.ok) {
        const data = await placesRes.json()
        if (Array.isArray(data.places)) {
          for (const p of data.places) {
            const dist = calculateDistance(location.lat, location.lng, p.lat, p.lon)
            seen.add(p.id)
            combined.push({
              id: p.id,
              name: p.name,
              type: p.category || "emergency",
              distance: formatDistance(dist),
              distanceKm: dist,
              lat: p.lat,
              lng: p.lon,
              available: true,
              phone: p.phone,
              address: p.address
            })
          }
        }
      }
    } catch (placesErr) {
      console.warn("Places fetch fallback:", placesErr)
    }

    // 2. Fetch live responder locations from Supabase
    try {
      const { data: responderData } = await supabase
        .from('responder_locations')
        .select(`
          id,
          responder_id,
          latitude,
          longitude,
          status,
          responders (
            id,
            organization,
            specializations,
            active
          )
        `)
        .eq('active', true)
        .limit(30)

      if (responderData && responderData.length > 0) {
        for (const r of responderData as any[]) {
          const rId = `resp-${r.id}`
          if (!seen.has(rId)) {
            const dist = calculateDistance(location.lat, location.lng, r.latitude, r.longitude)
            seen.add(rId)
            combined.push({
              id: rId,
              name: r.responders?.organization || "Emergency Responder",
              type: r.responders?.specializations?.[0] || "responder",
              distance: formatDistance(dist),
              distanceKm: dist,
              lat: r.latitude,
              lng: r.longitude,
              available: r.status === "available"
            })
          }
        }
      }
    } catch {}

    combined.sort((a, b) => a.distanceKm - b.distanceKm)
    setFacilities(combined)
  }

  // Filter facilities by selected category tab
  const filteredFacilities = facilities.filter((f) => {
    if (activeCategory === "all") return true
    if (activeCategory === "hospital") return f.type === "hospital" || f.type === "medical"
    if (activeCategory === "fire") return f.type === "fire_station" || f.type === "fire"
    if (activeCategory === "police") return f.type === "police" || f.type === "security"
    if (activeCategory === "clinic") return f.type === "clinic" || f.type === "pharmacy" || f.type === "doctors"
    return true
  })

  const hospitalCount = facilities.filter(f => f.type === "hospital" || f.type === "medical").length
  const fireCount = facilities.filter(f => f.type === "fire_station" || f.type === "fire").length
  const policeCount = facilities.filter(f => f.type === "police" || f.type === "security").length

  return (
    <Card className="overflow-hidden border-2 relative z-0 isolate shadow-md">
      {/* Header Bar */}
      <div className="p-4 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-600 animate-pulse" />
          <span className="font-bold text-foreground text-base">{t('map', 'Live Emergency Map')}</span>
          {userLocation && (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              GPS Live
            </Badge>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All ({facilities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("hospital")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
              activeCategory === "hospital" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Hospital className="w-3 h-3" />
            Hospitals ({hospitalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("fire")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
              activeCategory === "fire" ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Flame className="w-3 h-3" />
            Fire ({fireCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("police")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
              activeCategory === "police" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Shield className="w-3 h-3" />
            Police ({policeCount})
          </button>
        </div>

        <Button size="sm" variant="outline" onClick={handleRefreshLocation} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          <span className="text-xs">Locate Me</span>
        </Button>
      </div>

      {/* Map Canvas */}
      <div className="relative h-[520px] w-full z-0 isolate">
        {loading && !userLocation && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Acquiring GPS location...</p>
          </div>
        )}

        {userLocation && (
          <MapContent userLocation={userLocation} responders={filteredFacilities} />
        )}
      </div>

      {/* Status Footer */}
      <div className="p-3 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Showing <span className="font-semibold text-foreground">{filteredFacilities.length}</span> emergency centers within 20 km range
        </div>
        <div className="flex items-center gap-2">
          <span>🏥 Hospital</span>
          <span>🚒 Fire</span>
          <span>🚓 Police</span>
          <span>⚕️ Clinic</span>
        </div>
      </div>
    </Card>
  )
}
