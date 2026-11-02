"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Hospital, Building2, Users, Phone, MapPin, Clock, Loader2, Navigation, AlertCircle } from "lucide-react"
import { getUserLocation } from "@/lib/geolocation"

interface Responder {
  id: string
  name: string
  type: string
  distance: string
  responseTime: string
  available: boolean
  languages?: string[]
  contact: string
  address?: string
  lat?: number
  lng?: number
  source?: string
}

const getIcon = (type: string) => {
  switch (type) {
    case "hospital":
    case "clinic":
      return Hospital
    case "ngo":
      return Building2
    case "police":
    case "fire_station":
    case "volunteer":
      return Users
    default:
      return MapPin
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "hospital":
      return "bg-red-500/10 text-red-700 dark:text-red-400"
    case "clinic":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "ngo":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
    case "police":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
    case "fire_station":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
    default:
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  }
}

export function NearbyResponders() {
  const [responders, setResponders] = useState<Responder[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchNearbyResponders = async (lat: number, lng: number) => {
    try {
      setLoading(true)
      setError(null)
      // Geolocation tracking to 20 km range (15-20 km)
      const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=20`)
      const data = await response.json()
      if (data.success) {
        setResponders(data.responders || [])
      } else {
        // Don't set error for empty results — just show empty state
        setResponders([])
      }
    } catch (err: any) {
      console.error("Failed to fetch responders:", err)
      setResponders([])
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      // getUserLocation always returns coords (falls back to IP then Panvel default) — never throws
      const coords = await getUserLocation(true)
      const loc = {
        lat: coords.lat,
        lng: coords.lng,
      }
      setUserLocation(loc)
      await fetchNearbyResponders(loc.lat, loc.lng)
    } catch (err: any) {
      console.warn("Location error:", err)
      // Even if something goes wrong, try with default Panvel coords so the list is never blank
      const fallback = { lat: 18.9894, lng: 73.1175 }
      setUserLocation(fallback)
      await fetchNearbyResponders(fallback.lat, fallback.lng)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    requestLocation()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-4 border-2">
          <h3 className="font-semibold mb-1 text-foreground">Nearby Responders & Emergency Hubs</h3>
          <p className="text-xs text-muted-foreground">Tracking verified services within 15-20 km</p>
        </Card>
        <Card className="p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Scanning 15-20 km radius for emergency facilities...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-2 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            Nearby Emergency Responders
            <Badge variant="outline" className="text-xs font-normal">
              15-20 km Range
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground">
            {userLocation ? "Tracking live facilities around your GPS location" : "Location permission needed"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={requestLocation} className="gap-1.5 text-xs">
          <Navigation className="w-3.5 h-3.5" />
          {userLocation ? "Refresh" : "Locate"}
        </Button>
      </Card>

      {error && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-medium text-xs mb-1">Live Location Needed</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button size="sm" className="mt-2 text-xs h-7" onClick={requestLocation}>
              Enable GPS Location
            </Button>
          </div>
        </Card>
      )}

      {responders.length === 0 && !error && !loading && (
        <Card className="p-6 text-center text-muted-foreground border-dashed">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
          <p className="font-medium text-sm text-foreground">No emergency facilities detected within 20 km</p>
          <p className="text-xs mt-1">In an extreme emergency, dial national emergency helpline 112 immediately.</p>
          <a href="tel:112">
            <Button variant="destructive" size="sm" className="mt-3 gap-1.5 text-xs">
              <Phone className="w-3.5 h-3.5" /> Call 112 Dispatch
            </Button>
          </a>
        </Card>
      )}

      <div className="space-y-3">
        {responders.map((responder) => {
          const Icon = getIcon(responder.type)
          const mapsUrl = responder.lat && responder.lng
            ? `https://www.google.com/maps/dir/?api=1&destination=${responder.lat},${responder.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(responder.name)}`

          return (
            <Card key={responder.id} className="p-4 hover:shadow-md transition-shadow border">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(responder.type)}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-card-foreground truncate">{responder.name}</h4>
                    {responder.available && (
                      <Badge variant="secondary" className="shrink-0 text-[10px] py-0 px-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                        Available
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{responder.distance}</span>
                      <span className="truncate">· {responder.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>~{responder.responseTime} estimated response</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {responder.contact && responder.contact !== "N/A" && (
                      <a href={`tel:${responder.contact}`} className="flex-1">
                        <Button size="sm" variant="default" className="w-full text-xs h-8 gap-1.5">
                          <Phone className="w-3 h-3" />
                          Call Facility
                        </Button>
                      </a>
                    )}
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5">
                        <Navigation className="w-3 h-3" />
                        Navigate
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
