import { detectIndicLanguage, detectRomanisedIndic } from "./language-scripts"
import { classifyEmergency as classifyEmergencyMultilingual } from "./emergency-classifier"

export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  confidence: number
  emergencyType?: string
  provider?: string
}

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
  flag: string
}

// BridgeX supported languages (15 languages)
export const supportedLanguages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
]

/**
 * Translate text using the BridgeX translation API (Gemini + MyMemory fallback).
 * No Lingo.dev — works without any external SDK.
 */
export async function translateText(text: string, targetLang: string, sourceLang = "auto"): Promise<TranslationResult> {
  try {
    const baseUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        : ""

    const response = await fetch(`${baseUrl}/api/lingo/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang: sourceLang === "auto" ? undefined : sourceLang,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Translation error:", error)
    return {
      originalText: text,
      translatedText: text,
      sourceLang: sourceLang === "auto" ? "en" : sourceLang,
      targetLang,
      confidence: 0,
    }
  }
}

/**
 * Detect emergency type using multilingual keyword matching.
 */
export async function classifyEmergency(message: string): Promise<{
  type: string
  severity: "low" | "medium" | "high" | "critical"
  keywords: string[]
}> {
  try {
    const detected = classifyEmergencyMultilingual(message)
    const severityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
      high: "critical",
      medium: "high",
      low: "medium",
    }

    return {
      type: detected.category === "security" ? "security" : detected.category,
      severity: severityMap[detected.confidence] || "medium",
      keywords: detected.keywordsMatched,
    }
  } catch (error) {
    console.error("Classification error:", error)
    return {
      type: "general",
      severity: "medium",
      keywords: [],
    }
  }
}

/**
 * Detect language of text.
 * Step 1: Instant offline Indic script detection.
 * Step 2: Romanised Indic detection.
 * Step 3: Server-side Gemini detection.
 */
export async function detectLanguage(text: string): Promise<string> {
  // Step 1: Offline Indic script detection (instant)
  const script = detectIndicLanguage(text)
  if (script.lang) return script.lang

  // Step 2: Romanised Indic detection (instant)
  const romanised = detectRomanisedIndic(text)
  if (romanised) return romanised

  // Step 3: Server-side detection via Gemini
  try {
    const baseUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        : ""
    const response = await fetch(`${baseUrl}/api/lingo/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) throw new Error(`Language detection API error: ${response.status}`)

    const data = await response.json()
    return data.detectedLang || "en"
  } catch (error) {
    console.error("Language detection error:", error)
    return "en"
  }
}

/**
 * Batch translate multiple messages.
 */
export async function batchTranslate(
  messages: Array<{ text: string; targetLang: string }>,
  sourceLang = "auto",
): Promise<TranslationResult[]> {
  return Promise.all(messages.map((msg) => translateText(msg.text, msg.targetLang, sourceLang)))
}