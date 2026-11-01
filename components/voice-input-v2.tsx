"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Loader2, AlertCircle, CheckCircle2, Globe, Volume2, Sparkles } from "lucide-react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { cn } from "@/lib/utils"
import { supportedVoiceLanguages } from "@/lib/language-scripts"

interface VoiceInputV2Props {
  onTranscript?: (transcript: string) => void
  onFinalTranscript?: (transcript: string, translation?: string) => void
  onClear?: () => void
  resetKey?: number
  language?: string
  languageName?: string
  onLanguageChange?: (bcp47: string) => void
  disabled?: boolean
  className?: string
}

const POPULAR_LANGUAGES = [
  { code: "mr", bcp47: "mr-IN", label: "मराठी", nativeName: "मराठी", name: "Marathi", flag: "🇮🇳" },
  { code: "hi", bcp47: "hi-IN", label: "हिन्दी", nativeName: "हिन्दी", name: "Hindi", flag: "🇮🇳" },
  { code: "en", bcp47: "en-IN", label: "English", nativeName: "English", name: "English (India)", flag: "🇮🇳" },
  { code: "bn", bcp47: "bn-IN", label: "বাংলা", nativeName: "বাংলা", name: "Bengali", flag: "🇮🇳" },
  { code: "ta", bcp47: "ta-IN", label: "தமிழ்", nativeName: "தமிழ்", name: "Tamil", flag: "🇮🇳" },
  { code: "te", bcp47: "te-IN", label: "తెలుగు", nativeName: "తెలుగు", name: "Telugu", flag: "🇮🇳" },
  { code: "gu", bcp47: "gu-IN", label: "ગુજરાતી", nativeName: "ગુજરાતી", name: "Gujarati", flag: "🇮🇳" },
]

export function VoiceInputV2({
  onTranscript,
  onFinalTranscript,
  onClear,
  resetKey,
  language = "mr-IN",
  languageName,
  onLanguageChange,
  disabled = false,
  className,
}: VoiceInputV2Props) {
  const { t } = useGlobalTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAiTranscribing, setIsAiTranscribing] = useState(false)
  const [activeEngine, setActiveEngine] = useState<string>("")

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasSpokenRef = useRef<boolean>(false)

  // Clear internal transcripts whenever parent triggers a reset
  useEffect(() => {
    if (resetKey !== undefined) {
      setTranscript("")
      setInterimTranscript("")
      setError(null)
      setIsAiTranscribing(false)
      setActiveEngine("")
    }
  }, [resetKey])

  // Initialize SpeechRecognition on mount and language change
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = language
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsRecording(true)
        setError(null)
        setIsProcessing(false)
      }

      recognition.onresult = (event: any) => {
        let interimText = ""
        let finalText = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcriptPart = result[0].transcript

          if (result.isFinal) {
            finalText += transcriptPart + " "
          } else {
            interimText += transcriptPart
          }
        }

        if (interimText) {
          hasSpokenRef.current = true
          setInterimTranscript(interimText)
          onTranscript?.(interimText)
        }

        if (finalText) {
          hasSpokenRef.current = true
          setTranscript((prev) => {
            const next = (prev + " " + finalText).trim()
            onFinalTranscript?.(next)
            return next
          })
          setInterimTranscript("")

          // Reset silence timeout
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            if (isRecording) {
              handleStop()
            }
          }, 3500)
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition event:", event.error)
        if (event.error === "no-speech") {
          return
        }
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError(
            t(
              "micPermissionDenied",
              "Microphone permission was denied. Please allow microphone access in your browser settings (lock icon in address bar)."
            )
          )
          setIsRecording(false)
          setIsProcessing(false)
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
        setIsProcessing(false)
      }

      recognitionRef.current = recognition
    } catch (err) {
      console.warn("SpeechRecognition init error:", err)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [language])

  const stopActiveStream = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop())
      } catch {}
      streamRef.current = null
    }
  }

  const handleStart = async () => {
    if (disabled || isRecording) return

    try {
      setError(null)
      setIsProcessing(true)
      hasSpokenRef.current = false
      audioChunksRef.current = []

      // 1. Request microphone stream (kept open during recording for Gemini fallback & wave visualizer)
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        streamRef.current = stream
      } catch (mediaErr: any) {
        console.warn("MediaDevices getUserMedia error:", mediaErr)
        setError(
          t(
            "micDenied",
            "Microphone access blocked. Click the lock icon in your address bar, allow Microphone access, and try again."
          )
        )
        setIsProcessing(false)
        setIsRecording(false)
        return
      }

      // 2. Start MediaRecorder with the active stream to capture audio chunks
      try {
        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : ""

        const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }
        recorder.start(250) // Collect chunks every 250ms
        mediaRecorderRef.current = recorder
      } catch (recErr) {
        console.warn("MediaRecorder start error:", recErr)
      }

      // 3. Start Web Speech Recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e: any) {
          console.warn("recognition start error:", e?.message)
        }
      }

      setIsRecording(true)
      setIsProcessing(false)
    } catch (err: any) {
      console.error("Failed to start voice input:", err)
      setError(err?.message || t("failedToStartVoice", "Failed to start microphone"))
      setIsProcessing(false)
      setIsRecording(false)
      stopActiveStream()
    }
  }

  const handleStop = async () => {
    setIsRecording(false)
    setIsProcessing(false)

    // 1. Stop SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }

    // 2. Stop MediaRecorder and grab audio blob
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop()
      } catch {}
    }

    // Brief delay to allow final audio chunks to flush
    await new Promise((r) => setTimeout(r, 200))
    stopActiveStream()

    // 3. Check if we already received a satisfactory transcript from Web Speech API
    const currentText = (transcript + " " + interimTranscript).trim()
    if (currentText.length > 2 && hasSpokenRef.current) {
      setActiveEngine("Web Speech Neural Engine")
      return
    }

    // 4. Fallback to Gemini Multimodal Audio Transcription (/api/ai/transcribe)
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: audioChunksRef.current[0]?.type || "audio/webm",
      })

      // If audio is at least 2.5KB (not an accidental millisecond tap)
      if (audioBlob.size > 2500) {
        setIsAiTranscribing(true)
        try {
          const formData = new FormData()
          formData.append("audio", audioBlob, "voice-sos.webm")
          formData.append("languageHint", language.split("-")[0])

          const res = await fetch("/api/ai/transcribe", {
            method: "POST",
            body: formData,
          })

          if (res.ok) {
            const data = await res.json()
            if (data.transcript) {
              setTranscript(data.transcript)
              setInterimTranscript("")
              setActiveEngine(`Gemini Multimodal AI (${data.model || "gemini-3.5-transcribe"})`)
              onFinalTranscript?.(data.transcript, data.translation)
            }
          }
        } catch (transcribeErr) {
          console.warn("Gemini audio transcription fallback failed:", transcribeErr)
        } finally {
          setIsAiTranscribing(false)
        }
      }
    }
  }

  const handleClear = () => {
    setTranscript("")
    setInterimTranscript("")
    setError(null)
    setActiveEngine("")
    hasSpokenRef.current = false
    audioChunksRef.current = []
    onClear?.()
    onTranscript?.("")
    onFinalTranscript?.("")
  }

  const currentLangMeta =
    supportedVoiceLanguages.find((l) => l.bcp47 === language) ||
    POPULAR_LANGUAGES.find((l) => l.bcp47 === language)

  const displayText = interimTranscript || transcript

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* 1. Language Quick-Picker Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground">
            <Globe className="w-3.5 h-3.5 text-purple-600" />
            Spoken Language (Mic Input):
          </span>
          <Badge variant="outline" className="text-[11px] font-bold text-purple-600 border-purple-300">
            {currentLangMeta ? `${currentLangMeta.flag} ${currentLangMeta.nativeName} (${currentLangMeta.bcp47})` : language}
          </Badge>
        </div>

        {/* Quick Language Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {POPULAR_LANGUAGES.map((item) => {
            const active = language === item.bcp47
            return (
              <button
                key={item.bcp47}
                type="button"
                onClick={() => {
                  onLanguageChange?.(item.bcp47)
                  if (recognitionRef.current) {
                    recognitionRef.current.lang = item.bcp47
                  }
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1",
                  active
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-400/30"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border-border/60"
                )}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </button>
            )
          })}

          {/* More Languages Dropdown */}
          <select
            value={language}
            onChange={(e) => {
              onLanguageChange?.(e.target.value)
              if (recognitionRef.current) {
                recognitionRef.current.lang = e.target.value
              }
            }}
            className="text-xs font-semibold bg-muted/80 border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">More Languages...</option>
            {supportedVoiceLanguages.map((l) => (
              <option key={l.bcp47} value={l.bcp47}>
                {l.flag} {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Main Voice Controls */}
      <div className="flex items-center gap-2.5">
        {!isRecording ? (
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleStart}
            disabled={disabled || isProcessing || isAiTranscribing}
            className="flex-1 h-12 text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Accessing Microphone…
              </>
            ) : isAiTranscribing ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 text-amber-300 animate-spin" />
                Transcribing with Gemini AI…
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2 text-white animate-pulse" />
                Tap to Speak ({currentLangMeta?.nativeName || "Any Language"})
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={handleStop}
            className="flex-1 h-12 text-sm font-bold bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-500/25"
          >
            <Square className="w-4 h-4 mr-2 fill-current" />
            Stop & Process Speech
          </Button>
        )}

        {displayText && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleClear}
            disabled={disabled || isRecording || isAiTranscribing}
            className="h-12 px-4 text-xs font-semibold"
          >
            {t("clear", "Clear")}
          </Button>
        )}
      </div>

      {/* 3. Live Recording & Transcription Box */}
      <Card
        className={cn(
          "p-4 min-h-[90px] transition-all rounded-xl border-2",
          isRecording
            ? "border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 shadow-md"
            : isAiTranscribing
            ? "border-amber-400 bg-amber-50/20 dark:bg-amber-950/20"
            : "bg-card/70"
        )}
      >
        {isRecording && (
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                Listening in {currentLangMeta?.nativeName || currentLangMeta?.name || language}…
              </span>
            </div>
            {/* Animated Audio Soundwave */}
            <div className="flex items-center gap-1">
              {[6, 14, 20, 10, 16, 22, 12, 8].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-purple-600 rounded-full animate-pulse"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: "0.8s",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {isAiTranscribing && (
          <div className="flex items-center justify-center gap-2 p-3 text-xs text-amber-700 dark:text-amber-300 font-semibold animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>Transcribing audio verbatim with Gemini Neural Model…</span>
          </div>
        )}

        {displayText ? (
          <div className="space-y-2">
            <p
              className={cn(
                "text-base leading-relaxed",
                interimTranscript && !transcript
                  ? "text-muted-foreground italic animate-pulse"
                  : "text-foreground font-semibold"
              )}
            >
              {displayText}
            </p>
            {transcript && !isRecording && (
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 pt-1 border-t">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Speech Captured Successfully ({currentLangMeta?.nativeName || language})
                </span>
                {activeEngine && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {activeEngine}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : !isRecording && !isAiTranscribing ? (
          <div className="flex flex-col items-center justify-center py-2 text-center text-muted-foreground">
            <Volume2 className="w-6 h-6 mb-1 text-purple-500/70" />
            <p className="text-xs font-medium">
              Click <strong>"Tap to Speak"</strong> above in{" "}
              <strong>{currentLangMeta?.nativeName || "Marathi, Hindi, English"}</strong>.
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Dual-engine powered by Web Speech API + Google Gemini Multimodal AI.
            </p>
          </div>
        ) : null}
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-3 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 leading-snug">{error}</p>
          </div>
        </Card>
      )}
    </div>
  )
}
