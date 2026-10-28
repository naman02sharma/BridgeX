"use client"

import { useState, useRef, useCallback } from 'react'

// Extend window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface VoiceInputOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

interface VoiceInputResult {
  transcript: string
  confidence: number
  isFinal: boolean
  language?: string
}

export function useVoiceInput(options: VoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [results, setResults] = useState<VoiceInputResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  // Check if speech recognition is supported
  const checkSupport = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const isSupported = !!SpeechRecognition
    setIsSupported(isSupported)
    return isSupported
  }, [])

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!checkSupport()) {
      setError('Voice input not supported')
      return null
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = options.language || 'en-US'
    recognition.continuous = options.continuous || false
    recognition.interimResults = options.interimResults || true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
      setError(null)
      setResults([])
    }

    recognition.onresult = (event: any) => {
      const newResults: VoiceInputResult[] = []

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        newResults.push({
          transcript,
          confidence,
          isFinal: result.isFinal,
          language: recognition.lang
        })
      }

      setResults(newResults)
    }

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    return recognition
  }, [checkSupport, options.language, options.continuous, options.interimResults])

  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      initRecognition()
    }

    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        setError('Failed to start recording')
      }
    }
  }, [initRecognition, isRecording])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }, [isRecording])

  // Get final transcript
  const getFinalTranscript = useCallback(() => {
    const finalResult = results.find(r => r.isFinal)
    return finalResult?.transcript || ''
  }, [results])

  // Get interim transcript
  const getInterimTranscript = useCallback(() => {
    const interimResults = results.filter(r => !r.isFinal)
    return interimResults.map(r => r.transcript).join(' ')
  }, [results])

  // Reset results
  const reset = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    isRecording,
    isSupported,
    results,
    error,
    startRecording,
    stopRecording,
    getFinalTranscript,
    getInterimTranscript,
    reset,
    checkSupport
  }
}