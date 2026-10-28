"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shield, CheckCircle, Clock, MapPin, RefreshCw } from "lucide-react"

interface Responder {
  id: string
  name: string
  organization: string
  verified: boolean
  specializations: string[]
  status: string
  available: boolean
  last_active: string
  distanceKm: number | null
}

export function VerificationBadge({ responder }: { responder: Pick<Responder, "verified"> }) {
  return (
    <Badge variant="secondary" className={`${responder.verified ? "bg-green-600" : "bg-gray-500"} text-white border-0`}>
      <CheckCircle className="w-3 h-3 mr-1" />
      {responder.verified ? "Verified" : "Pending"}
    </Badge>
  )
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const h = Math.floor(mins / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export function ResponderCard({ responder }: { responder: Responder }) {
  const statusColor = responder.status === "responding" ? "bg-yellow-500" : responder.available ? "bg-green-500" : "bg-gray-500"
  const statusText = responder.status === "responding" ? "Responding" : responder.available ? "Available" : "Offline"
  const initials = (responder.name || "R").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${statusColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{responder.name}</h3>
            {responder.distanceKm !== null && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">{responder.distanceKm} km away</span>
            )}
          </div>
          <VerificationBadge responder={responder} />
          <div className="flex flex-wrap gap-1 mt-2">
            {responder.specializations.map((s) => (
              <Badge key={s} variant="outline" className="text-xs px-1.5 py-0 capitalize">{s.replace("-", " ")}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{statusText}</div>
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />Active {timeAgo(responder.last_active)}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ResponderVerification() {
  const [responders, setResponders] = useState<Responder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Distance is a nice-to-have: never block the list on location permission
      let query = ""
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation
            ? navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 300000 })
            : reject(new Error("no geolocation")),
        )
        query = `?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
      } catch {
        /* list without distances */
      }
      const res = await fetch(`/api/responders${query}`, { cache: "no-store" })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to load responders")
      setResponders(data.responders || [])
    } catch (err: any) {
      console.warn("Error fetching responders:", err)
      setError(err?.message || "Failed to load responders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Verified Responders</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{responders.length} on duty</Badge>
          <Button size="icon" variant="ghost" onClick={load} aria-label="Refresh responders">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="font-medium mb-2">Couldn&apos;t load responders</h4>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </Card>
      ) : responders.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="font-medium mb-2">No responders on duty yet</h4>
          <p className="text-sm text-muted-foreground">Be the first: register below and you will receive alerts from your area.</p>
        </Card>
      ) : (
        responders.map((r) => <ResponderCard key={r.id} responder={r} />)
      )}
    </div>
  )
}
