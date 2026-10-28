"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { detectIndicLanguage, detectRomanisedIndic } from "@/lib/language-scripts"

interface LiveTranslation {
  translatedText: string
  sourceLang: string
  provider: string
  isTranslating: boolean
}

const DEBOUNCE_MS = 400 // translate 400 ms after typing stops — real-time feel

/**
 * Hook: useLiveTranslation
 *
 * Translates `text` to `targetLang` with a debounce.
 * - Script detection is INSTANT (no debounce needed for Indic scripts).
 * - Romanised detection is INSTANT.
 * - Server translation (Gemini/MyMemory) fires after debounce.
 *
 * Feature 3 — Live Translation Preview
 */
export function useLiveTranslation(text: string, targetLang: string = "en") {
  const [state, setState] = useState<LiveTranslation>({
    translatedText: "",
    sourceLang: "",
    provider: "",
    isTranslating: false,
  })
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const translate = useCallback(
    async (input: string, signal: AbortSignal) => {
      if (!input.trim() || input.trim().length < 3) {
        setState((s) => ({ ...s, translatedText: "", sourceLang: "", isTranslating: false }))
        return
      }

      // Step 1: offline detection (sync, instant)
      const script = detectIndicLanguage(input)
      const romanised = !script.lang ? detectRomanisedIndic(input) : null
      const detectedSource = script.lang || romanised || ""

      // If source == target, no need to translate
      if (detectedSource && detectedSource === targetLang.split("-")[0]) {
        setState({ translatedText: input, sourceLang: detectedSource, provider: "script", isTranslating: false })
        return
      }

      setState((s) => ({ ...s, isTranslating: true }))

      try {
        const res = await fetch("/api/lingo/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: input.trim(),
            targetLang,
            sourceLang: detectedSource || undefined,
          }),
          signal,
        })

        if (!res.ok || signal.aborted) return

        const data = await res.json()
        if (!signal.aborted) {
          setState({
            translatedText: data.translatedText || input,
            sourceLang: data.sourceLang || detectedSource || "und",
            provider: data.provider || "gemini",
            isTranslating: false,
          })
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setState((s) => ({ ...s, isTranslating: false }))
        }
      }
    },
    [targetLang],
  )

  useEffect(() => {
    // Cancel pending requests
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (!text.trim()) {
      setState({ translatedText: "", sourceLang: "", provider: "", isTranslating: false })
      return
    }

    // Instant check for Indic script — no debounce needed
    const script = detectIndicLanguage(text)
    const romanised = !script.lang ? detectRomanisedIndic(text) : null
    const hasIndicScript = !!script.lang || !!romanised

    const delay = hasIndicScript ? 0 : DEBOUNCE_MS

    debounceRef.current = setTimeout(() => {
      abortRef.current = new AbortController()
      translate(text, abortRef.current.signal)
    }, delay)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [text, targetLang, translate])

  return state
}
