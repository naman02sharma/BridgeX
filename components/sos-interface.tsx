"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Clock
} from "lucide-react"
import { VoiceInput } from "@/components/voice-input"
import { FileUpload } from "@/components/file-upload"
import { OfflineIndicator } from "@/components/offline-indicator"
import { useGlobalTranslation } from "@/components/translation-provider"
import { useOfflineSupport } from "@/hooks/useOfflineSupport"
import { createSOSAlert } from "@/lib/sos-system"
import { supabase } from "@/lib/supabase"

interface EmergencyType {
  id: string
  label: string
  description: string
  icon: any
  color: string
}

export function SOSInterface() {
  const { t } = useGlobalTranslation()
  const { isOnline, addToOfflineQueue, unsyncedCount } = useOfflineSupport()
  
  const [isActivating, setIsActivating] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("medical")
  const [message, setMessage] = useState("")
  const [panicTimer, setPanicTimer] = useState<number | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  // Define base emergency types
  const emergencyTypesBase: EmergencyType[] = [
    {
      id: "medical",
      label: "medicalEmergency",
      description: "medicalEmergencyDesc",
      icon: Heart,
      color: "text-red-500"
    },
    {
      id: "fire",
      label: "fireEmergency",
      description: "fireEmergencyDesc",
      icon: Flame,
      color: "text-orange-500"
    },
    {
      id: "security",
      label: "securityEmergency",
      description: "securityEmergencyDesc",
      icon: Shield,
      color: "text-blue-500"
    },
    {
      id: "other",
      label: "otherEmergency",
      description: "otherEmergencyDesc",
      icon: HelpCircle,
      color: "text-gray-500"
    }
  ]

  // Map emergency types with translations
  const emergencyTypes = emergencyTypesBase.map(type => ({
    ...type,
    label: t(type.label),
    description: t(type.description)
  }))

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
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

  const handleSOSClick = async () => {
    if (sosActive) {
      // Cancel SOS
      setSosActive(false)
      setPanicTimer(null)
      setShowDetails(false)
      return
    }

    // Show details form
    setShowDetails(true)
  }

  const handleQuickSOS = async () => {
    // Send SOS immediately without details
    await sendSOS()
  }

  const sendSOS = async () => {
    setIsActivating(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("No user logged in")
        // For demo purposes, create anonymous alert
        const userName = "Anonymous User"
        const userId = "anonymous-" + Date.now()
        
        if (isOnline) {
          await createSOSAlert(userId, userName, selectedType as any, message, uploadedFiles)
        } else {
          // Queue for offline sync
          await addToOfflineQueue({
            type: selectedType,
            message: message || t("emergencyAlert"),
            location: { latitude: 0, longitude: 0 },
            attachments: uploadedFiles.map(f => f.url),
          })
        }
      } else {
        const userName = user.email || "User"
        const userId = user.id
        
        if (isOnline) {
          await createSOSAlert(userId, userName, selectedType as any, message, uploadedFiles)
        } else {
          // Queue for offline sync
          await addToOfflineQueue({
            type: selectedType,
            message: message || t("emergencyAlert"),
            location: { latitude: 0, longitude: 0 },
            attachments: uploadedFiles.map(f => f.url),
          })
        }
      }

      // Activate SOS mode
      setSosActive(true)
      setShowDetails(false)
      
      // Start panic timer (120 seconds = 2 minutes)
      setPanicTimer(120)

      // Request notification permission if not granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        setNotificationsEnabled(permission === 'granted')
      }

      // Show notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(t("alertActive"), {
          body: t("respondersNotified"),
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        })
      }

    } catch (error) {
      console.error("Failed to send SOS:", error)
      alert(t("error") + ": " + (error as Error).message)
    } finally {
      setIsActivating(false)
    }
  }

  const handleVoiceInput = (transcript: string) => {
    setMessage(transcript)
  }

  const handleFileUpload = (files: any[]) => {
    setUploadedFiles(files)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Main SOS Card */}
      <Card className="p-8 bg-gradient-to-br from-background to-muted/20 border-2 shadow-lg">
        <div className="text-center space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              {t("emergencyInterface")}
            </h2>
            <p className="text-muted-foreground">
              {t("helpInOneTap")}
            </p>
          </div>

          {/* SOS Button */}
          {!showDetails && !sosActive && (
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={handleSOSClick}
                className="w-full h-32 text-3xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                disabled={isActivating}
              >
                {isActivating ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="w-16 h-16" />
                    <span>{t("sendSOS")}</span>
                  </div>
                )}
              </Button>

              {/* Info badges */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-muted-foreground">{t("locationShared")}</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">{t("instantContact")}</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Radio className="w-4 h-4 text-purple-500" />
                  <span className="text-muted-foreground">{t("multilingualTranslation")}</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-muted-foreground">{t("autoEscalate")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active SOS Alert */}
          {sosActive && (
            <div className="space-y-4">
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <AlertDescription className="text-red-600 font-semibold">
                  {isOnline ? t("alertActive") : t("alertQueued")}
                </AlertDescription>
              </Alert>

              {/* Status info */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Radio className="w-5 h-5 animate-pulse text-red-500" />
                  <span>
                    {isOnline ? t("respondersNotified") : t("alertSavedOffline")}
                  </span>
                </div>

                {panicTimer !== null && panicTimer > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-lg font-mono">
                      {t("autoEscalateIn")} {formatTime(panicTimer)}
                    </span>
                  </div>
                )}

                {!isOnline && unsyncedCount > 0 && (
                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                    {t("queued")}: {unsyncedCount} {unsyncedCount === 1 ? t("alert") : t("alerts")}
                  </Badge>
                )}
              </div>

              {/* Cancel button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleSOSClick}
                className="w-full border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                {t("cancelAlert")}
              </Button>
            </div>
          )}

          {/* Emergency Details Form */}
          {showDetails && !sosActive && (
            <div className="space-y-6 text-left">
              {/* Emergency Type Selector */}
              <div className="space-y-3">
                <Label htmlFor="emergency-type" className="text-base font-semibold">
                  {t("emergencyType")}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {emergencyTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          selectedType === type.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-muted hover:border-muted-foreground/50 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-6 h-6 mt-0.5 ${type.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm mb-1">{type.label}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-3">
                <Label htmlFor="emergency-message" className="text-base font-semibold">
                  {t("additionalDetails")}
                </Label>
                <Textarea
                  id="emergency-message"
                  placeholder={t("describeEmergency")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Voice Input */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {t("voiceEmergencyDetails")}
                </Label>
                <VoiceInput
                  onFinalTranscript={handleVoiceInput}
                  placeholder={t("speakNow")}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {t("attachFiles")}
                </Label>
                <FileUpload
                  onUploadComplete={handleFileUpload}
                  maxFiles={5}
                  maxSizeMB={10}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  onClick={sendSOS}
                  disabled={isActivating}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t("broadcasting")}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t("sendSOS")}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleQuickSOS}
                  disabled={isActivating}
                  className="w-full"
                >
                  {t("skipDetails")}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="w-full"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Description Card */}
      {!sosActive && !showDetails && (
        <Card className="p-6 bg-muted/30">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              {t("emergencyTypes")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("sosDescription")}
            </p>
            <div className="grid gap-3">
              {emergencyTypes.map((type) => {
                const Icon = type.icon
                return (
                  <div
                    key={type.id}
                    className="flex items-start gap-3 p-3 bg-background rounded-lg border"
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${type.color}`} />
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
