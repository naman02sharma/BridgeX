"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Eye, AlertOctagon, Zap, ShieldAlert, Sparkles, Activity } from "lucide-react"

interface EmergencyBeaconProps {
  triggerClassName?: string
  variant?: "default" | "destructive" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  label?: string
}

export function EmergencyBeacon({
  triggerClassName,
  variant = "destructive",
  size = "default",
  label = "Distress Beacon",
}: EmergencyBeaconProps) {
  const [open, setOpen] = useState(false)
  const [sirenActive, setSirenActive] = useState(false)
  const [strobeActive, setStrobeActive] = useState(false)
  const [strobeColor, setStrobeColor] = useState<"red" | "white" | "yellow">("red")
  const [volume, setVolume] = useState<number>(0.8)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const strobeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize or resume audio context
  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      audioCtxRef.current = new AudioCtx()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }

  // Toggle Rescue Siren
  const toggleSiren = () => {
    if (sirenActive) {
      stopSiren()
    } else {
      startSiren()
    }
  }

  const startSiren = () => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      stopSiren() // clean any existing nodes

      setSirenActive(true)

      // Start device vibration pattern if available (SOS pattern: 3 short, 3 long, 3 short)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200, 300, 500, 200, 500, 200, 500, 300, 200, 100, 200, 100, 200])
      }

      // Loop warbling siren sweep
      const playSweep = () => {
        if (!ctx || ctx.state === "closed") return
        const now = ctx.currentTime

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sawtooth"
        // Sweeps from 700 Hz up to 1350 Hz and back
        osc.frequency.setValueAtTime(700, now)
        osc.frequency.linearRampToValueAtTime(1350, now + 0.45)
        osc.frequency.linearRampToValueAtTime(700, now + 0.9)

        gain.gain.setValueAtTime(volume * 0.35, now)
        gain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.85)
        gain.gain.linearRampToValueAtTime(0.001, now + 0.95)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.95)
      }

      playSweep()
      sirenIntervalRef.current = setInterval(playSweep, 950)
    } catch (e) {
      console.warn("Audio siren error:", e)
    }
  }

  const stopSiren = () => {
    setSirenActive(false)
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current)
      sirenIntervalRef.current = null
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0)
    }
  }

  // Toggle Optical Strobe Beacon
  const toggleStrobe = () => {
    if (strobeActive) {
      stopStrobe()
    } else {
      startStrobe()
    }
  }

  const startStrobe = () => {
    setStrobeActive(true)
    let flash = false
    strobeIntervalRef.current = setInterval(() => {
      flash = !flash
      setStrobeColor(flash ? "red" : "white")
    }, 120) // High frequency 8Hz flash
  }

  const stopStrobe = () => {
    setStrobeActive(false)
    if (strobeIntervalRef.current) {
      clearInterval(strobeIntervalRef.current)
      strobeIntervalRef.current = null
    }
    setStrobeColor("red")
  }

  const activateBoth = () => {
    startSiren()
    startStrobe()
  }

  const deactivateAll = () => {
    stopSiren()
    stopStrobe()
  }

  useEffect(() => {
    if (!open) {
      deactivateAll()
    }
  }, [open])

  useEffect(() => {
    return () => {
      deactivateAll()
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-2 font-semibold shadow-md active:scale-95 transition-all ${triggerClassName || ""}`}
        >
          <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
          <span>{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl p-0 overflow-hidden border-2 border-red-500/60 rounded-2xl shadow-2xl z-[99999]">
        {/* Dynamic Strobe Screen Background */}
        <div
          className={`p-6 sm:p-8 transition-colors duration-100 ${
            strobeActive
              ? strobeColor === "red"
                ? "bg-red-600 text-white"
                : "bg-amber-400 text-black"
              : "bg-gradient-to-b from-red-950/50 via-background to-background text-foreground"
          }`}
        >
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-red-600/20 text-red-500 rounded-xl flex-shrink-0">
                <AlertOctagon className="w-7 h-7 animate-pulse text-red-500" />
              </span>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">
                  Emergency Distress Beacon & Rescue Siren
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  High-decibel rescue siren sweep + strobe light beacon for search & rescue teams
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Quick Activate All Hero Button */}
          <div className="my-5">
            {sirenActive || strobeActive ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={deactivateAll}
                className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl flex items-center justify-center gap-2 border border-zinc-700 rounded-xl"
              >
                <VolumeX className="w-5 h-5 text-red-400" />
                Silence Beacon & Siren
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={activateBoth}
                className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-xl shadow-red-600/40 flex items-center justify-center gap-2.5 animate-pulse rounded-xl"
              >
                <Zap className="w-5 h-5 fill-current" />
                Activate Full Distress Beacon (Audio + Strobe)
              </Button>
            )}
          </div>

          {/* Independent Toggles */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Card
              onClick={toggleSiren}
              className={`p-4 sm:p-5 cursor-pointer text-center border-2 transition-all select-none rounded-xl ${
                sirenActive
                  ? "border-red-500 bg-red-500/15 shadow-md shadow-red-500/20"
                  : "border-border hover:border-red-500/50 bg-card hover:bg-card/80"
              }`}
            >
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    sirenActive ? "bg-red-600 text-white animate-bounce" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {sirenActive ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Acoustic Rescue Siren</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sirenActive ? "Loud Acoustic Pulse (Playing)" : "Muted (Click to start)"}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              onClick={toggleStrobe}
              className={`p-4 sm:p-5 cursor-pointer text-center border-2 transition-all select-none rounded-xl ${
                strobeActive
                  ? "border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/20"
                  : "border-border hover:border-amber-500/50 bg-card hover:bg-card/80"
              }`}
            >
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    strobeActive ? "bg-amber-500 text-black animate-pulse" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Optical Strobe Beacon</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {strobeActive ? "High-Hz Flash (Active)" : "Off (Click to flash)"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Emergency Safety Notice */}
          <div className="rounded-xl bg-background/90 p-4 text-xs sm:text-sm text-muted-foreground border shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">100% Offline Capability:</strong> This beacon operates completely client-side without internet, GPS,
                or cellular service. Point your mobile screen towards rescuers, windows, or open areas.
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Card({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div onClick={onClick} className={`rounded-xl ${className || ""}`}>
      {children}
    </div>
  )
}
