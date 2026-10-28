"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useGlobalTranslation } from '@/components/translation-provider'
import { cn } from '@/lib/utils'

interface VoiceInputV2Props {
  onTranscript?: (transcript: string) => void
  onFinalTranscript?: (transcript: string) => void
  onClear?: () => void
  resetKey?: number
  language?: string
  languageName?: string
  disabled?: boolean
  className?: string
}

export function VoiceInputV2({
  onTranscript,
  onFinalTranscript,
  onClear,
  resetKey,
  language = 'en-US',
  languageName,
  disabled = false,
  className
}: VoiceInputV2Props) {
  const { t } = useGlobalTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear internal transcripts whenever parent triggers a reset
  useEffect(() => {
    if (resetKey !== undefined) {
      setTranscript('')
      setInterimTranscript('')
      setError(null)
    }
  }, [resetKey])

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      initializeRecognition(SpeechRecognition)
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [language])

  const initializeRecognition = (SpeechRecognition: any) => {
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
        let interimText = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcriptPart = result[0].transcript

          if (result.isFinal) {
            finalText += transcriptPart + ' '
          } else {
            interimText += transcriptPart
          }
        }

        if (interimText) {
          setInterimTranscript(interimText)
          onTranscript?.(interimText)
        }

        if (finalText) {
          const newFinalTranscript = transcript + finalText
          setTranscript(newFinalTranscript)
          setInterimTranscript('')
          onFinalTranscript?.(newFinalTranscript)
          
          // Reset timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          
          // Auto-stop after 2 seconds of silence
          timeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isRecording) {
              handleStop()
            }
          }, 2000)
        }
      }

      recognition.onerror = (event: any) => {
        // Suppress network errors (expected when offline, voice still works locally in some browsers)
        if (event.error === 'network') {
          console.warn('Voice recognition network error (may be expected):', event.error)
          // Don't show error to user, just stop recording
          setIsRecording(false)
          setIsProcessing(false)
          return
        }
        
        console.error('Speech recognition error:', event.error)
        
        let errorMessage = t('voiceInputError', 'Voice input error')
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = t('noSpeechDetected', 'No speech detected. Please try again.')
            break
          case 'audio-capture':
            errorMessage = t('microphoneError', 'Microphone not accessible. Please check permissions.')
            break
          case 'not-allowed':
            errorMessage = t('microphonePermissionDenied', 'Microphone permission denied. Please allow access in browser settings.')
            break
          case 'aborted':
            // User stopped - not an error
            return
          default:
            errorMessage = t('voiceInputError', `Voice input error: ${event.error}`)
        }
        
        setError(errorMessage)
        setIsRecording(false)
        setIsProcessing(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
        setIsProcessing(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }

      recognitionRef.current = recognition
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err)
      setIsSupported(false)
      setError(t('voiceInitError', 'Failed to initialize voice input'))
    }
  }

  const handleStart = async () => {
    if (!recognitionRef.current || disabled) return

    try {
      setError(null)
      setIsProcessing(true)
      
      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      } catch (permErr) {
        console.warn('Microphone not available:', permErr)
        setError(
          t(
            'micDenied',
            'Microphone access is blocked. Click the lock icon in the address bar, allow Microphone, then try again. You can also type your message.'
          )
        )
        setIsProcessing(false)
        setIsRecording(false)
        return
      }

      recognitionRef.current.start()
    } catch (err: any) {
      console.warn('Failed to start recording:', err)
      setError(err.message || t('failedToStart', 'Failed to start voice input'))
      setIsProcessing(false)
      setIsRecording(false)
    }
  }

  const handleStop = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        console.error('Error stopping recognition:', err)
      }
    }
  }

  const handleClear = () => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    onClear?.()
    onTranscript?.('')
    onFinalTranscript?.('')
  }

  // Loading state while checking support
  if (isSupported === null) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('checkingVoiceSupport', 'Checking voice support...')}</span>
        </div>
      </Card>
    )
  }

  // Not supported fallback
  if (!isSupported) {
    return (
      <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {t('voiceNotSupported', 'Voice input not available')}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {t('voiceNotSupportedDesc', 'Your browser doesn\'t support voice input. Please type your message or use Chrome/Edge browser.')}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const displayText = interimTranscript || transcript

  return (
    <div className={cn("space-y-3", className)}>
      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={handleStart}
            disabled={disabled || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('initializing', 'Initializing...')}
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                {t('startRecording', 'Start Voice Input')}
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="default"
            onClick={handleStop}
            className="animate-pulse"
          >
            <Square className="w-4 h-4 mr-2 fill-current" />
            {t('stopRecording', 'Stop Recording')}
          </Button>
        )}

        {displayText && (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleClear}
            disabled={disabled || isRecording}
          >
            {t('clear', 'Clear')}
          </Button>
        )}
      </div>

      {/* Transcript Display */}
      <Card className={cn(
        "p-4 min-h-[100px] transition-all duration-200",
        isRecording && "border-blue-500 shadow-lg shadow-blue-500/20"
      )}>
        {isRecording && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-600">
                {t('recording', 'Recording')} {languageName ? `in ${languageName}` : ''}...
              </span>
            </div>
            <div className="flex-1"></div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {displayText ? (
          <div className="space-y-2">
            <p className={cn(
              "text-base leading-relaxed",
              interimTranscript && !transcript ? "text-muted-foreground italic" : "text-foreground font-medium"
            )}>
              {displayText}
            </p>
            {transcript && !isRecording && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t('transcriptionComplete', 'Transcription complete')} ({languageName || language})</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Mic className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {isRecording 
                  ? `${t('speakNow', 'Speak now')} in ${languageName || 'your language'}...`
                  : `${t('clickToStartVoice', 'Click "Start Voice Input" to speak')} in ${languageName || 'your language'}`}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-3 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </Card>
      )}

      {/* Info */}
      {!isRecording && !error && (
        <p className="text-xs text-muted-foreground">
          {t('voiceInputHint', '💡 Speak clearly and pause briefly between sentences for best results')}
        </p>
      )}
    </div>
  )
}
