
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/auth-fetch"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useGlobalTranslation } from "@/components/translation-provider"

const SPECIALIZATIONS = [
  { value: "medical", label: "become.responder.specializations.medical" },
  { value: "fire", label: "become.responder.specializations.fire" },
  { value: "rescue", label: "become.responder.specializations.rescue" },
  { value: "trauma", label: "become.responder.specializations.trauma" },
  { value: "first-aid", label: "become.responder.specializations.firstAid" },
  { value: "support", label: "become.responder.specializations.support" },
  { value: "security", label: "become.responder.specializations.security" },
]

export function BecomeResponder() {
  const { t } = useGlobalTranslation()
  const [organization, setOrganization] = useState("")
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [responseRadius, setResponseRadius] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResponder, setIsResponder] = useState(false)
  const { toast } = useToast()

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecs(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    )
  }

  const handleSubmit = async () => {
    if (!organization.trim()) {
      toast({
        title: t('become.responder.organizationRequired', 'Organization required'),
        description: t('become.responder.organizationRequiredDesc', 'Please enter your organization name'),
        variant: "destructive"
      })
      return
    }

    if (selectedSpecs.length === 0) {
      toast({
        title: t('become.responder.specializationRequired', 'Specialization required'),
        description: t('become.responder.specializationRequiredDesc', 'Please select at least one specialization'),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please log in first, then register as a responder")

      // Location is needed to receive alerts from your area (registration still works without it)
      const location = await new Promise<{ lat: number; lng: number; accuracy: number } | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 },
        )
      })

      const res = await authFetch("/api/responders/register", {
        method: "POST",
        body: JSON.stringify({ organization: organization.trim(), specializations: selectedSpecs, responseRadius, location }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok || !result.success) throw new Error(result.error || "Registration failed")

      setIsResponder(true)
      toast({
        title: "Success!",
        description: location
          ? "You are now registered as a responder"
          : "Registered, but location was blocked. Allow location on the Responders page to receive nearby alerts.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isResponder) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold">You're a Responder!</h3>
          <p className="text-muted-foreground">
            Open the Responders page and keep it open while on duty: it shares your location and shows incoming alerts live.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/responders">Go to responder inbox</Link>
          </Button>
          <Badge variant="default" className="text-lg px-4 py-2">
            <Shield className="w-4 h-4 mr-2" />
            Active
          </Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-2">Become a Responder</h3>
          <p className="text-muted-foreground">
            Help people in your area by registering as an emergency responder
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="organization">Organization / Name</Label>
            <Input
              id="organization"
              placeholder={t('become.responder.placeholder.organization', 'e.g., City Hospital, Fire Dept, Volunteer')}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>

          <div>
            <Label>Specializations</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SPECIALIZATIONS.map(spec => (
                <Badge
                  key={spec.value}
                  variant={selectedSpecs.includes(spec.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSpecialization(spec.value)}
                >
                  {t(spec.label, spec.label.split('.').pop() || spec.label)}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="radius">Response Radius (km)</Label>
            <Input
              id="radius"
              type="number"
              min="1"
              max="50"
              value={responseRadius}
              onChange={(e) => setResponseRadius(parseInt(e.target.value) || 10)}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Location Tracking</p>
                <p className="text-muted-foreground">
                  Your location will be tracked in real-time to help emergency services find the nearest responders.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Registering..." : "Register as Responder"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
