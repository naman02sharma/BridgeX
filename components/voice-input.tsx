"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Square } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useGlobalTranslation } from '@/components/translation-provider'
import { cn } from '@/lib/utils'

interface VoiceInputProps {
  onTranscript?: (transcript: string) => void
  onFinalTranscript?: (transcript: string) => void
  placeholder?: string
  className?: string
  language?: string
  disabled?: boolean
}

export function VoiceInput({
  onTranscript,
  onFinalTranscript,
  placeholder,
  className,
  language,
  disabled = false
}: VoiceInputProps) {
  const { t } = useGlobalTranslation()
  const [currentTranscript, setCurrentTranscript] = useState('')

  const {
    isRecording,
    isSupported,
    results,
    error,
    startRecording,
    stopRecording,
    getFinalTranscript,
    getInterimTranscript,
    reset
  } = useVoiceInput({
    language: language || 'en-US',
    continuous: false,
    interimResults: true
  })

  // Update transcript when results change
  useEffect(() => {
    const finalTranscript = getFinalTranscript()
    const interimTranscript = getInterimTranscript()

    if (finalTranscript) {
      setCurrentTranscript(finalTranscript)
      onFinalTranscript?.(finalTranscript)
    } else if (interimTranscript) {
      setCurrentTranscript(interimTranscript)
      onTranscript?.(interimTranscript)
    }
  }, [results, getFinalTranscript, getInterimTranscript, onTranscript, onFinalTranscript])

  const handleStartRecording = () => {
    reset()
    setCurrentTranscript('')
    startRecording()
  }

  const handleStopRecording = () => {
    stopRecording()
  }

  const handleClear = () => {
    reset()
    setCurrentTranscript('')
  }

  if (!isSupported) {
    return (
      <div className={cn("flex items-center gap-2 p-3 border rounded-lg bg-muted/50", className)}>
        <MicOff className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t('voiceNotSupported')}</span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Voice Input Controls */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStartRecording}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            {t('startRecording')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleStopRecording}
            className="flex items-center gap-2 animate-pulse"
          >
            <Square className="w-4 h-4" />
            {t('stopRecording')}
          </Button>
        )}

        {currentTranscript && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
          >
            {t('clear')}
          </Button>
        )}
      </div>

      {/* Transcript Display */}
      <div className="min-h-[60px] p-3 border rounded-lg bg-muted/20">
        {isRecording && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 font-medium">{t('recording')}</span>
          </div>
        )}

        {currentTranscript ? (
          <p className={cn(
            "text-sm",
            isRecording && !getFinalTranscript() ? "text-muted-foreground italic" : "text-foreground"
          )}>
            {currentTranscript}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {isRecording ? t('speakNow') : (placeholder || t('voiceInput'))}
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}