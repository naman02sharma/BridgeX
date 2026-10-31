"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HeartPulse,
  Droplet,
  Flame,
  Wind,
  Bone,
  Sun,
  Play,
  Pause,
  RotateCcw,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react"

interface FirstAidGuideProps {
  triggerClassName?: string
  variant?: "default" | "destructive" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  label?: string
}

export function FirstAidGuide({
  triggerClassName,
  variant = "outline",
  size = "default",
  label = "First-Aid Guide",
}: FirstAidGuideProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("cpr")

  // CPR Metronome State (110 BPM)
  const [cprActive, setCprActive] = useState(false)
  const [cprBeat, setCprBeat] = useState(false)
  const [compressionCount, setCompressionCount] = useState(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const cprIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Tourniquet Timer State
  const [tourniquetActive, setTourniquetActive] = useState(false)
  const [tourniquetSeconds, setTourniquetSeconds] = useState(0)
  const tourniquetIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Audio for Metronome Beep
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

  const playClickSound = (isHigh = false) => {
    try {
      const ctx = getAudioContext()
      if (!ctx || ctx.state === "closed") return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(isHigh ? 880 : 587, now) // High tone every 30 compressions

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.08)
    } catch {
      // Audio error suppressed
    }
  }

  // Start/Stop CPR Metronome (110 BPM = ~545ms per beat)
  const toggleCprMetronome = () => {
    if (cprActive) {
      stopCprMetronome()
    } else {
      startCprMetronome()
    }
  }

  const startCprMetronome = () => {
    setCprActive(true)
    let count = 0
    // 110 BPM = 60,000 / 110 = ~545.45 ms
    cprIntervalRef.current = setInterval(() => {
      count = (count % 30) + 1
      setCompressionCount(count)
      setCprBeat(true)
      setTimeout(() => setCprBeat(false), 120)
      playClickSound(count === 30 || count === 1)
    }, 545)
  }

  const stopCprMetronome = () => {
    setCprActive(false)
    if (cprIntervalRef.current) {
      clearInterval(cprIntervalRef.current)
      cprIntervalRef.current = null
    }
  }

  const resetCprCounter = () => {
    setCompressionCount(0)
  }

  // Tourniquet Timer Logic
  const toggleTourniquetTimer = () => {
    if (tourniquetActive) {
      setTourniquetActive(false)
      if (tourniquetIntervalRef.current) clearInterval(tourniquetIntervalRef.current)
    } else {
      setTourniquetActive(true)
      tourniquetIntervalRef.current = setInterval(() => {
        setTourniquetSeconds((prev) => prev + 1)
      }, 1000)
    }
  }

  const resetTourniquetTimer = () => {
    setTourniquetSeconds(0)
    setTourniquetActive(false)
    if (tourniquetIntervalRef.current) clearInterval(tourniquetIntervalRef.current)
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    return () => {
      stopCprMetronome()
      if (tourniquetIntervalRef.current) clearInterval(tourniquetIntervalRef.current)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`gap-2 font-medium ${triggerClassName || ""}`}>
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden border border-border/80 shadow-2xl rounded-2xl bg-card">
        {/* Pinned Header */}
        <div className="px-5 sm:px-6 py-4 border-b bg-card/95 backdrop-blur-md shrink-0">
          <DialogHeader className="pr-8 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 ring-1 ring-rose-500/20">
                  <HeartPulse className="w-6 h-6" />
                </span>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">Emergency First-Aid Protocols</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Instant step-by-step guidance & timing tools while waiting for responders
                  </p>
                </div>
              </div>
              <a href="tel:112" className="shrink-0 hidden xs:inline-block">
                <Button size="sm" variant="destructive" className="gap-1.5 text-xs h-8 px-3 shadow-sm font-semibold">
                  <Phone className="w-3.5 h-3.5" /> Call 112
                </Button>
              </a>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
        <Tabs defaultValue="cpr" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/70 gap-1 mb-4">
            <TabsTrigger value="cpr" className="text-xs py-2 gap-1.5 flex flex-col sm:flex-row">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              CPR
            </TabsTrigger>
            <TabsTrigger value="bleeding" className="text-xs py-2 gap-1.5 flex flex-col sm:flex-row">
              <Droplet className="w-4 h-4 text-red-500" />
              Bleeding
            </TabsTrigger>
            <TabsTrigger value="choking" className="text-xs py-2 gap-1.5 flex flex-col sm:flex-row">
              <Wind className="w-4 h-4 text-cyan-500" />
              Choking
            </TabsTrigger>
            <TabsTrigger value="burns" className="text-xs py-2 gap-1.5 flex flex-col sm:flex-row">
              <Flame className="w-4 h-4 text-orange-500" />
              Burns
            </TabsTrigger>
            <TabsTrigger value="fracture" className="text-xs py-2 gap-1.5 flex flex-col sm:flex-row">
              <Bone className="w-4 h-4 text-amber-500" />
              Trauma
            </TabsTrigger>
            <TabsTrigger value="heatstroke" className="text-xs py-2 gap-1.5 flex flex-col sm:flex-row">
              <Sun className="w-4 h-4 text-yellow-500" />
              Heatstroke
            </TabsTrigger>
          </TabsList>

          {/* 1. CPR PROTOCOL & 110 BPM METRONOME */}
          <TabsContent value="cpr" className="space-y-4">
            {/* Interactive Metronome Card */}
            <Card className="border-2 border-rose-500/30 bg-rose-500/5 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all duration-100 ${
                        cprBeat
                          ? "bg-rose-600 text-white scale-110 shadow-lg shadow-rose-600/40 ring-4 ring-rose-400"
                          : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {compressionCount > 0 ? compressionCount : "110"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">CPR Rhythmic Metronome</span>
                        <Badge variant="outline" className="text-[10px]">110 BPM</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cprActive
                          ? `Push hard & fast on each beat! (${compressionCount}/30 compressions, then 2 rescue breaths)`
                          : "Push chest 2 inches (5 cm) deep to the beat of this metronome"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={toggleCprMetronome}
                      className={cprActive ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-600 text-white hover:bg-rose-700"}
                    >
                      {cprActive ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                      {cprActive ? "Pause Beat" : "Start 110 BPM"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={resetCprCounter}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CPR Steps */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-sm font-semibold">Check Responsiveness & Breathing</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Tap collarbone firmly and shout. Look for normal breathing for no more than 10 seconds.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-sm font-semibold">Hand Position</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Place heel of one hand in the center of the chest (lower half of sternum). Interlock your other hand on top. Keep arms straight.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-sm font-semibold">30 Chest Compressions : 2 Rescue Breaths</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Compress 5-6 cm deep at 100-120 BPM. Allow complete chest recoil after each push. If untrained, provide continuous hands-only CPR without stopping.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 2. SEVERE BLEEDING & TOURNIQUET */}
          <TabsContent value="bleeding" className="space-y-4">
            <Card className="border-2 border-red-500/30 bg-red-500/5">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-sm">Tourniquet Application Clock</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track exact elapsed time. Medical teams must know tourniquet time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatTimer(tourniquetSeconds)}
                  </span>
                  <Button size="sm" variant={tourniquetActive ? "destructive" : "default"} onClick={toggleTourniquetTimer}>
                    {tourniquetActive ? "Stop" : "Start Timer"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetTourniquetTimer}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-600 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-sm font-semibold">Direct Firm Pressure</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Use sterile gauze or clean cloth. Press firmly directly over the bleeding site with both hands and don&apos;t lift to peek.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-600 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-sm font-semibold">Tourniquet for Limb Hemorrhage</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Apply 2-3 inches above bleeding site on the limb (never directly over a joint). Tighten until bleeding stops completely. Note exact time.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground"><strong>Never loosen or remove</strong> an applied tourniquet once placed. Only hospital surgical staff should release it.</p>
              </div>
            </div>
          </TabsContent>

          {/* 3. CHOKING */}
          <TabsContent value="choking" className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <h4 className="text-sm font-semibold">5 Firm Back Blows</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Stand behind and slightly to the side. Support victim&apos;s chest with one hand and lean them forward. Deliver up to 5 sharp blows between shoulder blades with the heel of your hand.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <h4 className="text-sm font-semibold">5 Abdominal Thrusts (Heimlich Maneuver)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Stand behind the person, wrap arms around waist. Make a fist just above the navel. Grasp fist with your other hand and pull sharply inward and upward.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <h4 className="text-sm font-semibold">If Victim Collapses Unconscious</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Lower them safely to the ground immediately. Call 112 and begin chest compressions (hands-only CPR). Look in mouth for visible object before rescue breaths.</p>
              </div>
            </div>
          </TabsContent>

          {/* 4. BURNS */}
          <TabsContent value="burns" className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <h4 className="text-sm font-semibold">Cool Running Water for 20 Minutes</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Immediately cool the burn under gentle running tap water for at least 20 minutes. <strong>NEVER use ice, ice water, butter, or toothpaste.</strong></p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <h4 className="text-sm font-semibold">Remove Jewelry & Constrictive Items</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Remove rings, watches, and loose clothing before swelling occurs. Do not peel off clothing stuck directly to the burn.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <h4 className="text-sm font-semibold">Cover Loosely with Clean Plastic Wrap</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Cover with clean cling film or clean sterile non-adherent dressing. Keeps nerve endings protected and prevents infection.</p>
              </div>
            </div>
          </TabsContent>

          {/* 5. FRACTURES */}
          <TabsContent value="fracture" className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <h4 className="text-sm font-semibold">Immobilize in Position Found</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Do not attempt to realign broken bones or push protruding bones back in. Splint above and below the injured joint using rolled magazines or wood.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <h4 className="text-sm font-semibold">Suspected Spinal / Neck Injury</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Keep the head and spine completely still in a neutral position. Do not move the victim unless in immediate danger from fire or water.</p>
              </div>
            </div>
          </TabsContent>

          {/* 6. HEATSTROKE */}
          <TabsContent value="heatstroke" className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-600 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <h4 className="text-sm font-semibold">Move to Shade & Active Cooling</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Move victim immediately out of the sun into shade or AC. Loosen tight clothes. Apply cool wet cloths to neck, armpits, and groin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-600 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <h4 className="text-sm font-semibold">Hydration Alert</h4>
                <p className="text-xs text-muted-foreground mt-0.5">If fully alert, sip cool water slowly with oral rehydration salts. <strong>If disoriented, vomiting, or drowsy, do NOT give fluids by mouth.</strong></p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>

        {/* Pinned Footer */}
        <div className="px-5 sm:px-6 py-3 border-t bg-muted/40 text-xs text-muted-foreground flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Standard ERC/AHA protocol summary · Works 100% offline
          </span>
          <span className="font-bold text-rose-500">Emergency 112 / 108</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
