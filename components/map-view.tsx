"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase"
import { calculateDistance, formatDistance } from "@/lib/geolocation"
import { useGlobalTranslation } from "@/components/translation-provider"

// Dynamically import the entire map component to avoid SSR issues
const MapContent = dynamic(() => import("./map-content"), { ssr: false })

interface Location {
  lat: number
  lng: number
}

interface Responder {
  id: string
  name: string
  type: "hospital" | "ngo" | "volunteer"
  distance: string
  lat: number
  lng: number
  available: boolean
  last_updated?: string
  status?: "available" | "busy" | "responding"
}

export function MapView() {
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [responders, setResponders] = useState<Responder[]>([])

  useEffect(() => {
    // Subscribe to realtime responder location updates
    const channel = supabase
      .channel('responder_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responder_locations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (userLocation) {
              fetchNearbyResponders(userLocation)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userLocation])

  const getLocation = () => {
    setLoading(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(location)
          fetchNearbyResponders(location)
          setLoading(false)
        },
        (error) => {
          console.warn(`Could not get your location (${error.message || error.code}); using a default location.`)
          // Use default location for demo
          const defaultLocation = { lat: 40.7128, lng: -74.006 }
          setUserLocation(defaultLocation)
          fetchNearbyResponders(defaultLocation)
          setLoading(false)
        },
      )
    } else {
      const defaultLocation = { lat: 40.7128, lng: -74.006 }
      setUserLocation(defaultLocation)
      fetchNearbyResponders(defaultLocation)
      setLoading(false)
    }
  }

  const fetchNearbyResponders = async (location: Location) => {
    try {
      // First, test basic Supabase connectivity
      const { data: testData, error: testError } = await supabase
        .from('responders')
        .select('count')
        .limit(1)

      if (testError) {
        console.error('Supabase connectivity test failed:', testError)
        throw new Error(`Supabase connection failed: ${testError.message}`)
      }

      // Fetch real responder data from Supabase
      const { data: responderData, error } = await supabase
        .from('responder_locations')
        .select(`
          id,
          responder_id,
          latitude,
          longitude,
          last_updated,
          status,
          accuracy,
          responders!inner (
            id,
            organization,
            specializations,
            verification_status,
            active,
            user_id,
            profiles (
              email
            )
          )
        `)
        .eq('active', true)
        .eq('responders.verification_status', 'verified')
        .eq('responders.active', true)

      if (error) {
        console.error('Error fetching responder locations:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })

        // Try a simpler query to see if the table exists
        const { data: simpleData, error: simpleError } = await supabase
          .from('responder_locations')
          .select('*')
          .limit(1)

        if (simpleError) {
          console.error('Even simple query failed:', simpleError)
        } else {
        }

        // Fallback to API call if Supabase fails
        const response = await fetch(`/api/responders?lat=${location.lat}&lng=${location.lng}`)
        const data = await response.json()
        setResponders(data.responders || [])
        return
      }

      // Transform data and calculate distances
      const transformedResponders: Responder[] = (responderData || []).map((item: any) => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          item.latitude,
          item.longitude
        )

        return {
          id: item.responders?.id || item.id,
          name: item.responders?.organization || 'Unknown Responder',
          type: item.responders?.specializations?.[0] || 'responder',
          distance: formatDistance(distance),
          lat: item.latitude,
          lng: item.longitude,
          available: item.responders?.active && item.status === 'available',
          last_updated: item.last_updated,
          status: item.status
        }
      }).filter((responder: Responder) => responder.available)

      setResponders(transformedResponders)
    } catch (error) {
      console.error('Error fetching responders:', error)
      // Fallback to API call
      try {
        const response = await fetch(`/api/responders?lat=${location.lat}&lng=${location.lng}`)
        const data = await response.json()
        setResponders(data.responders || [])
      } catch (apiError) {
        console.error('API fallback failed:', apiError)
      }
    }
  }

  useEffect(() => {
    getLocation()
  }, [])

  const { t } = useGlobalTranslation()

  return (
    <Card className="overflow-hidden border-2 relative z-0 isolate">
      <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">{t('map', 'Live Map')}</span>
          {userLocation && (
            <Badge variant="secondary" className="ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Location Active
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={getLocation} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        </Button>
      </div>

      {/* OpenStreetMap Container */}
      <div className="relative h-[500px] w-full z-0 isolate">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        {!userLocation && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{t('enableLocation', 'Enable location to view map')}</p>
              <Button onClick={getLocation}>
                <Navigation className="w-4 h-4 mr-2" />
                {t('getLocation', 'Get Location')}
              </Button>
            </div>
          </div>
        )}

        {userLocation && (
          <MapContent userLocation={userLocation} responders={responders} />
        )}

        {/* Legend */}
        {userLocation && (
          <div className="absolute bottom-4 left-4 bg-card border rounded-lg p-3 shadow-lg z-20">
            <div className="text-xs font-semibold mb-2 text-card-foreground">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-muted-foreground">Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-muted-foreground">Hospital</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-muted-foreground">NGO</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-muted-foreground">Volunteers</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="p-4 bg-muted/30 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {responders.length} verified responders nearby • Powered by OpenStreetMap
        </div>
      </div>
    </Card>
  )
}
