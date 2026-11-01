"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Loader2, AlertCircle, CheckCircle2, Sparkles, Languages, Radio } from "lucide-react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { cn } from "@/lib/utils"

interface VoiceInputV2Props {
  onTranscript?: (transcript: string) => void
  onFinalTranscript?: (
    transcript: string,
    translation?: string,
    category?: string,
    sourceLang?: string
  ) => void
  onClear?: () => void
  resetKey?: number
  disabled?: boolean
  className?: string
}

export function VoiceInputV2({
  onTranscript,
  onFinalTranscript,
  onClear,
  resetKey,
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
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [detectedResult, setDetectedResult] = useState<{
    languageName?: string
    category?: string
    translation?: string
  } | null>(null)

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clear internal state on resetKey change
  useEffect(() => {
    if (resetKey !== undefined) {
      setTranscript("")
      setInterimTranscript("")
      setError(null)
      setIsAiTranscribing(false)
      setDetectedResult(null)
      setRecordingSeconds(0)
    }
  }, [resetKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopActiveStream()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [])

  const stopActiveStream = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop())
      } catch {}
      streamRef.current = null
    }
  }

  const handleStart = async () => {
    if (disabled || isRecording || isAiTranscribing) return

    try {
      setError(null)
      setIsProcessing(true)
      setDetectedResult(null)
      audioChunksRef.current = []
      setRecordingSeconds(0)

      // Request microphone access
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
        console.warn("Microphone access error:", mediaErr)
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

      // Start MediaRecorder to capture audio for Gemini Multimodal AI
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
        recorder.start(250)
        mediaRecorderRef.current = recorder
      } catch (recErr) {
        console.warn("MediaRecorder start error:", recErr)
      }

      // Start SpeechRecognition in background if supported for live interim feedback
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.maxAlternatives = 1
            recognition.onresult = (e: any) => {
              let text = ""
              for (let i = e.resultIndex; i < e.results.length; i++) {
                text += e.results[i][0].transcript + " "
              }
              if (text.trim()) {
                setInterimTranscript(text.trim())
                onTranscript?.(text.trim())
              }
            }
            recognition.onerror = () => {}
            recognition.start()
            recognitionRef.current = recognition
          } catch {}
        }
      }

      // Start recording duration timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1)
      }, 1000)

      setIsRecording(true)
      setIsProcessing(false)
    } catch (err: any) {
      console.error("Failed to start voice recording:", err)
      setError(err?.message || "Failed to start microphone")
      setIsProcessing(false)
      setIsRecording(false)
      stopActiveStream()
    }
  }

  const handleStop = async () => {
    setIsRecording(false)
    setIsProcessing(false)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    // Stop browser recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }

    // Stop MediaRecorder and flush data immediately
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== "inactive") {
      try {
        if (typeof recorder.requestData === "function") {
          recorder.requestData()
        }
      } catch {}
      try {
        recorder.stop()
      } catch {}
    }

    await new Promise((r) => setTimeout(r, 60))
    stopActiveStream()

    // Process recorded audio with Gemini AI
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: audioChunksRef.current[0]?.type || "audio/webm",
      })

      if (audioBlob.size > 400) {
        setIsAiTranscribing(true)
        try {
          const formData = new FormData()
          formData.append("audio", audioBlob, "voice-distress.webm")

          const res = await fetch("/api/ai/transcribe", {
            method: "POST",
            body: formData,
          })

          if (res.ok) {
            const data = await res.json()
            if (data.transcript) {
              setTranscript(data.transcript)
              setInterimTranscript("")
              setDetectedResult({
                languageName: data.languageName,
                category: data.category,
                translation: data.translation,
              })
              onFinalTranscript?.(
                data.transcript,
                data.translation,
                data.category,
                data.sourceLang
              )
              return
            }
          }
        } catch (transcribeErr) {
          console.warn("AI transcription error:", transcribeErr)
        } finally {
          setIsAiTranscribing(false)
        }
      }
    }

    // Fallback to interim speech recognition text if AI route had network problem
    const fallbackText = interimTranscript.trim()
    if (fallbackText) {
      setTranscript(fallbackText)
      setInterimTranscript("")
      onFinalTranscript?.(fallbackText)
    }
  }

  const handleClear = () => {
    setTranscript("")
    setInterimTranscript("")
    setError(null)
    setDetectedResult(null)
    setRecordingSeconds(0)
    audioChunksRef.current = []
    onClear?.()
    onTranscript?.("")
    onFinalTranscript?.("")
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const displayText = interimTranscript || transcript

  return (
    <div className={cn("space-y-3", className)}>
      {/* Voice Action Button */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleStart}
            disabled={disabled || isProcessing || isAiTranscribing}
            className="flex-1 h-14 text-base font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Accessing Microphone…
              </>
            ) : isAiTranscribing ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 text-amber-300 animate-spin" />
                AI Detecting Language & Routing…
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2 text-white animate-pulse" />
                Tap to Speak in Any Language
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={handleStop}
            className="flex-1 h-14 text-base font-bold bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-xl shadow-red-500/30"
          >
            <Square className="w-5 h-5 mr-2 fill-current" />
            Stop & Auto-Process Speech ({formatTimer(recordingSeconds)})
          </Button>
        )}

        {displayText && !isRecording && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleClear}
            disabled={disabled || isAiTranscribing}
            className="h-14 px-4 text-xs font-semibold"
          >
            {t("clear", "Clear")}
          </Button>
        )}
      </div>

      {/* Live Recording / AI Processing Card */}
      <Card
        className={cn(
          "p-4 min-h-[90px] transition-all rounded-xl border-2",
          isRecording
            ? "border-red-500 bg-red-50/20 dark:bg-red-950/20 shadow-md"
            : isAiTranscribing
            ? "border-purple-500 bg-purple-50/20 dark:bg-purple-950/20"
            : "bg-card/70"
        )}
      >
        {isRecording && (
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                Listening… Speak freely in Marathi, Hindi, English, or any language
              </span>
            </div>
            {/* Animated Audio Soundwave */}
            <div className="flex items-center gap-1">
              {[8, 16, 24, 12, 20, 26, 14, 10].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-600 rounded-full animate-pulse"
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
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 font-bold">
              <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
              <span>AI is auto-detecting language, transcribing & classifying department…</span>
            </div>
          </div>
        )}

        {displayText && !isAiTranscribing ? (
          <div className="space-y-2.5">
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

            {detectedResult && (
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Auto-Detected: {detectedResult.languageName || "Native Language"}</span>
                </div>
                {detectedResult.category && (
                  <Badge className="bg-purple-600 text-white font-semibold capitalize text-xs">
                    Target: {detectedResult.category} Department
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : !isRecording && !isAiTranscribing ? (
          <div className="flex flex-col items-center justify-center py-2 text-center text-muted-foreground">
            <Radio className="w-6 h-6 mb-1 text-purple-500 animate-pulse" />
            <p className="text-xs font-semibold text-foreground">
              Just tap the mic and speak in <strong>Marathi, Hindi, Bengali, Tamil, Telugu, English</strong>, or any language.
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              The AI automatically detects your language, transcribes it, translates it to English, and routes to the right department.
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
