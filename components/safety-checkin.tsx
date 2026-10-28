"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Timer,
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SafetyCheckinProps {
  /** Called when the checkin timer expires without confirmation → trigger auto-SOS */
  onAutoSOS?: () => void
  /** Whether an SOS is already active */
  sosActive?: boolean
  className?: string
}

const CHECKIN_INTERVALS = [
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "30 min", seconds: 1800 },
]

type CheckinState = "idle" | "armed" | "warning" | "expired"

/**
 * Feature 1 — Safety Check-in Timer
 *
 * Lets a victim arm a countdown. If they don't confirm "I'm safe" before it
 * expires, the app automatically fires an SOS on their behalf.
 * Great for: walking alone at night, visiting an unknown place, etc.
 */
export function SafetyCheckin({ onAutoSOS, sosActive, className }: SafetyCheckinProps) {
  const [state, setState] = useState<CheckinState>("idle")
  const [intervalSec, setIntervalSec] = useState(300) // 5 minutes default
  const [remaining, setRemaining] = useState(0)
  const [warningFired, setWarningFired] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startRef = useRef<number>(0)

  const progress = state === "armed" || state === "warning"
    ? Math.max(0, (remaining / intervalSec) * 100)
    : 0

  const arm = useCallback(() => {
    if (state === "armed" || state === "warning") return
    setRemaining(intervalSec)
    setWarningFired(false)
    setState("armed")
    startRef.current = Date.now()
  }, [state, intervalSec])

  const confirm = useCallback(() => {
    // Victim confirmed they are safe — reset
    setState("idle")
    setRemaining(0)
    setWarningFired(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const cancel = useCallback(() => {
    setState("idle")
    setRemaining(0)
    setWarningFired(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  // Tick every second
  useEffect(() => {
    if (state !== "armed" && state !== "warning") {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1

        // Warning at 30 seconds
        if (next <= 30 && !warningFired) {
          setState("warning")
          setWarningFired(true)
          // Vibrate on mobile
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400])
          }
        }

        if (next <= 0) {
          setState("expired")
          if (timerRef.current) clearInterval(timerRef.current)
          // Trigger auto SOS
          setTimeout(() => {
            onAutoSOS?.()
          }, 500)
          return 0
        }

        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state, warningFired, onAutoSOS])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (sosActive) return null // hide when SOS is already active

  return (
    <Card
      className={cn(
        "border-2 transition-all duration-500",
        state === "idle" && "border-slate-200 dark:border-slate-700",
        state === "armed" && "border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/20",
        state === "warning" && "border-amber-500 dark:border-amber-400 shadow-lg shadow-amber-500/30 animate-pulse",
        state === "expired" && "border-red-500 dark:border-red-400 shadow-lg shadow-red-500/30",
        className,
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {state === "idle" && <Shield className="w-4 h-4 text-slate-500" />}
            {state === "armed" && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
            {(state === "warning" || state === "expired") && (
              <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            )}
            <span className="text-sm font-semibold">
              {state === "idle" && "Safety Check-in Timer"}
              {state === "armed" && "Safety Timer Active"}
              {state === "warning" && "⚠️ Respond Now!"}
              {state === "expired" && "🚨 Triggering Auto-SOS…"}
            </span>
          </div>
          {(state === "armed" || state === "warning") && (
            <Badge
              className={cn(
                "font-mono text-sm px-2",
                state === "warning" ? "bg-amber-500 animate-pulse" : "bg-emerald-600",
              )}
            >
              <Timer className="w-3 h-3 mr-1" />
              {formatTime(remaining)}
            </Badge>
          )}
        </div>

        {/* Idle: configuration */}
        {state === "idle" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Arm a timer. If you don't confirm you're safe before it expires, an SOS will be sent automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              {CHECKIN_INTERVALS.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => setIntervalSec(opt.seconds)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    intervalSec === opt.seconds
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-muted border-border hover:border-emerald-400 hover:text-emerald-600",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              onClick={arm}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              size="sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Arm Safety Timer
            </Button>
          </div>
        )}

        {/* Armed / Warning: progress + confirm */}
        {(state === "armed" || state === "warning") && (
          <div className="space-y-3">
            <Progress
              value={progress}
              className={cn(
                "h-2 transition-all",
                state === "warning" ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500",
              )}
            />
            {state === "warning" && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300 dark:border-amber-700">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Confirm you're safe or an SOS will be sent in {remaining}s!
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={confirm}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                I'm Safe
              </Button>
              <Button
                onClick={cancel}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expired */}
        {state === "expired" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-300">
              <Bell className="w-4 h-4 text-red-600 animate-bounce" />
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                Timer expired — auto-SOS triggered!
              </p>
            </div>
            <Button
              onClick={cancel}
              variant="outline"
              size="sm"
              className="w-full border-slate-300"
            >
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
