"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickReplyProps {
  /** ISO 639-1 language code of the victim (e.g. "mr", "hi", "bn") */
  victimLang: string
  victimLangName: string
  /** Called when a template is selected — passes the translated reply */
  onSelectReply: (reply: string) => void
  className?: string
}

// Template messages in English — translated to victim's language on demand
const QUICK_TEMPLATES = [
  {
    id: "on_way",
    icon: "🚑",
    label: "On My Way",
    text: "Help is on the way. I will reach you shortly. Stay calm and stay where you are.",
  },
  {
    id: "eta",
    icon: "⏱️",
    label: "ETA",
    text: "I am approximately 5 minutes away. Please keep your phone with you.",
  },
  {
    id: "call_112",
    icon: "📞",
    label: "Call 112",
    text: "Please call 112 immediately for emergency services. They will help you faster.",
  },
  {
    id: "keep_calm",
    icon: "💙",
    label: "Stay Calm",
    text: "Please stay calm. Help is coming. Breathe slowly and do not panic.",
  },
  {
    id: "location",
    icon: "📍",
    label: "Share Location",
    text: "Please share your exact location or describe landmarks near you.",
  },
  {
    id: "first_aid_bleeding",
    icon: "🩹",
    label: "Stop Bleeding",
    text: "Apply firm pressure on the wound with a clean cloth. Do not remove the cloth. Keep pressing until I arrive.",
  },
  {
    id: "first_aid_breathing",
    icon: "🫁",
    label: "Breathing Help",
    text: "Sit upright or lean forward slightly. Breathe slowly and deeply. Loosen any tight clothing around your neck or chest.",
  },
  {
    id: "fire_evacuate",
    icon: "🔥",
    label: "Evacuate Now",
    text: "Leave the building immediately. Do not use the elevator. Cover your nose with a wet cloth. Go to the nearest open area.",
  },
  {
    id: "safety_confirmed",
    icon: "✅",
    label: "Safe & Noted",
    text: "I have noted your situation. You are safe now. I am coordinating help for you.",
  },
]

const LANG_NAMES: Record<string, string> = {
  hi: "Hindi",
  mr: "Marathi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
  or: "Odia",
  en: "English",
}

/**
 * Feature 2 — Responder Quick Reply Templates
 *
 * Shows a responder pre-built response templates.
 * Each template is translated to the victim's detected language on click.
 * Saves critical seconds in an emergency by eliminating manual typing.
 */
export function ResponderQuickReplies({ victimLang, victimLangName, onSelectReply, className }: QuickReplyProps) {
  const [translating, setTranslating] = useState<string | null>(null)
  const [translated, setTranslated] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState(true)

  const isEnglishTarget = !victimLang || victimLang === "en" || victimLang === "en-US"

  const handleSelect = useCallback(
    async (tpl: (typeof QUICK_TEMPLATES)[number]) => {
      // If already translated, use cached version
      if (translated[tpl.id]) {
        onSelectReply(translated[tpl.id])
        return
      }

      // If target is English, use as-is
      if (isEnglishTarget) {
        onSelectReply(tpl.text)
        return
      }

      setTranslating(tpl.id)
      try {
        const res = await fetch("/api/lingo/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: tpl.text,
            targetLang: victimLang,
            sourceLang: "en",
          }),
        })
        const data = await res.json()
        const result = data.translatedText || tpl.text
        setTranslated((prev) => ({ ...prev, [tpl.id]: result }))
        onSelectReply(result)
      } catch {
        onSelectReply(tpl.text)
      } finally {
        setTranslating(null)
      }
    },
    [victimLang, isEnglishTarget, translated, onSelectReply],
  )

  return (
    <Card className={cn("border-indigo-200 dark:border-indigo-800", className)}>
      <CardHeader
        className="py-3 px-4 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold">Quick Response Templates</span>
            {!isEnglishTarget && (
              <Badge variant="secondary" className="text-xs">
                → {victimLangName || LANG_NAMES[victimLang] || victimLang}
              </Badge>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        {!isEnglishTarget && expanded && (
          <p className="text-xs text-muted-foreground mt-1">
            Click a template — it will be auto-translated to <strong>{victimLangName || LANG_NAMES[victimLang]}</strong> before sending
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-1 gap-2">
            {QUICK_TEMPLATES.map((tpl) => {
              const isTranslating = translating === tpl.id
              const isDone = !!translated[tpl.id]
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  disabled={isTranslating}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all duration-150",
                    "bg-muted/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40",
                    "border-border hover:border-indigo-300 dark:hover:border-indigo-700",
                    "group flex items-start gap-2.5",
                    isTranslating && "opacity-60 cursor-wait",
                  )}
                >
                  <span className="text-base mt-0.5 flex-shrink-0">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-indigo-700 dark:text-indigo-400">
                        {tpl.label}
                      </span>
                      {isDone && !isEnglishTarget && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 group-hover:line-clamp-none">
                      {isDone && !isEnglishTarget ? translated[tpl.id] : tpl.text}
                    </p>
                  </div>
                  {isTranslating && (
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-500 flex-shrink-0 mt-1" />
                  )}
                  {!isTranslating && (
                    <MessageSquare className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
