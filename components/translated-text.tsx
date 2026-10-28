"use client"

import React, { useEffect, useState } from "react"
import { useGlobalTranslation } from "@/components/translation-provider"

export function TranslatedText({ text, fallback }: { text: string; fallback?: string }) {
  const { currentLang, translateText } = useGlobalTranslation()
  const [translated, setTranslated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!text) {
      setTranslated("")
      return
    }

    if (currentLang === "en") {
      setTranslated(text)
      return
    }

    setLoading(true)
    translateText(text)
      .then((res) => {
        if (!mounted) return
        setTranslated(res)
      })
      .catch(() => {
        if (!mounted) return
        setTranslated(fallback || text)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [text, currentLang, translateText, fallback])

  if (loading) {
    return <span className="opacity-60">{fallback || "…"}</span>
  }

  return <span>{translated ?? fallback ?? text}</span>
}
