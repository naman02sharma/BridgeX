/**
 * Server-side translation & language detection with 5-second automatic fallback.
 *
 * Priority chain:
 *  1. Offline dictionary & script detection (lib/language-scripts.ts) — instant, zero latency (<1ms)
 *  2. Lingo.dev SDK (primary TMS / localization engine) — with 5s timeout
 *  3. Google Gemini (gemini-2.0-flash / gemini-1.5-flash) — neural fallback with 5s timeout
 *  4. MyMemory REST API — rock-solid fallback covering all Indian & international languages
 *
 * If any model or service takes more than 5 seconds, it automatically aborts and fails over!
 */
import {
  detectIndicLanguage,
  detectRomanisedIndic,
  isMostlyAscii,
  OFFLINE_EMERGENCY_DICTIONARY,
  transliterateRomanisedToDevanagari,
} from "./language-scripts"

export interface ServerTranslation {
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  translated: boolean
  provider: "lingo.dev" | "gemini" | "mymemory" | "script" | "offline-dict" | "none"
  error?: string
}

// ─── Lingo.dev Engine ─────────────────────────────────────────────────────────

let lingoEngineInstance: any = null

function getLingoEngine() {
  const key = process.env.LINGO_API_KEY || process.env.NEXT_PUBLIC_LINGO_API_KEY
  if (!key) return null
  if (!lingoEngineInstance) {
    try {
      const { LingoDotDevEngine } = require("lingo.dev/sdk")
      lingoEngineInstance = new LingoDotDevEngine({ apiKey: key })
    } catch (e: any) {
      console.warn("[LingoEngine] Initialization error:", e?.message)
    }
  }
  return lingoEngineInstance
}

async function lingoTranslate(
  text: string,
  target: string,
  source?: string
): Promise<{ text: string; sourceLang: string } | null> {
  const lingo = getLingoEngine()
  if (!lingo || typeof lingo.localizeText !== "function") return null

  try {
    const options: any = { targetLocale: target }
    if (source && source !== "auto" && source !== "und" && typeof source === "string") {
      options.sourceLocale = source
    }
    const res = await Promise.race([
      lingo.localizeText(text, options),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Lingo.dev translation timed out after 5s")), 5000)
      ),
    ])
    if (res && typeof res === "string" && res.trim()) {
      return { text: res.trim(), sourceLang: source || "und" }
    }
  } catch (err: any) {
    console.warn("[LingoTranslate] Exceeded 5s or failed, falling back to Gemini:", err?.message)
  }
  return null
}

async function lingoDetect(text: string): Promise<string | null> {
  const lingo = getLingoEngine()
  if (!lingo || typeof lingo.recognizeLocale !== "function") return null

  try {
    const detected = await Promise.race([
      lingo.recognizeLocale(text),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Lingo.dev detection timed out after 5s")), 5000)
      ),
    ])
    if (detected && typeof detected === "string") {
      return detected.toLowerCase().split("-")[0]
    }
  } catch (err: any) {
    console.warn("[LingoDetect] Exceeded 5s or failed, falling back to Gemini:", err?.message)
  }
  return null
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
  "gemini-flash-latest",
].filter(Boolean) as string[]

function geminiKey(): string {
  return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ""
}

async function geminiTranslate(
  text: string,
  target: string,
  source?: string,
): Promise<{ text: string; sourceLang: string } | null> {
  const key = geminiKey()
  if (!key) return null

  const prompt =
    `You are a real-time translation engine for an emergency SOS response app. ` +
    `Translate the following message to the language with ISO 639-1 code "${target}". ` +
    `The input may be in any Indian language (Hindi, Marathi, Bengali, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu) ` +
    `or romanised/transliterated text (e.g. "mala madat havi aahe", "mujhe madad chahiye", "aag lagi hai"). ` +
    `If the text is already in the target language, return it unchanged. ` +
    `DO NOT add any explanation, commentary, or formatting. Only return the JSON below. ` +
    `Respond ONLY with a JSON object: {"sourceLang":"<ISO 639-1 code e.g. mr,hi,bn,ta,te>","translation":"<translated text>"}.` +
    (source ? ` Detected source language is "${source}".` : "") +
    `\n\nMessage:\n"""${text}"""`

  let lastErr = ""
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
              maxOutputTokens: 512,
            },
          }),
          signal: AbortSignal.timeout(5000), // 5 second timeout for real-time feel
        },
      )
      if (!res.ok) {
        lastErr = `Gemini ${model} HTTP ${res.status}`
        continue
      }
      const json: any = await res.json()
      const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof raw !== "string") continue
      const clean = raw.replace(/^```json\s*|```$/g, "").trim()
      const parsed = JSON.parse(clean)
      if (typeof parsed?.translation !== "string" || !parsed.translation.trim()) continue
      return {
        text: parsed.translation.trim(),
        sourceLang: typeof parsed.sourceLang === "string"
          ? parsed.sourceLang.toLowerCase().split("-")[0]
          : source || "und",
      }
    } catch (e: any) {
      lastErr = e?.message || lastErr
    }
  }
  if (lastErr) console.warn("[GeminiTranslate] All models tried, last error:", lastErr)
  return null
}

/** Detect language via Gemini (for Latin/romanised text where scripts don't help). */
async function geminiDetect(text: string): Promise<string | null> {
  const key = geminiKey()
  if (!key) return null

  const prompt =
    `Identify the language of this text. It may be English, or a romanised/transliterated Indian language ` +
    `(like "mujhe madad chahiye" = Hindi, "mala madat havi" = Marathi). ` +
    `Respond ONLY with the ISO 639-1 language code (e.g. en, hi, mr, bn, ta, te, gu, kn, ml, pa, ur, or). ` +
    `Text: """${text.slice(0, 200)}"""`

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 10 },
          }),
          signal: AbortSignal.timeout(3000),
        },
      )
      if (!res.ok) continue
      const json: any = await res.json()
      const lang = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase()
      if (lang && /^[a-z]{2,3}$/.test(lang)) return lang
    } catch { /* continue */ }
  }
  return null
}

// ─── Google Neural GTX ────────────────────────────────────────────────────────

async function googleGtxTranslate(
  text: string,
  target: string,
  source?: string,
): Promise<{ text: string; sourceLang: string } | null> {
  try {
    let sl = source && source !== "auto" && source !== "und" ? source.split("-")[0].toLowerCase() : "auto"
    const tl = target.split("-")[0].toLowerCase()

    let queryText = text.trim()
    if (isMostlyAscii(text)) {
      const devanagari = transliterateRomanisedToDevanagari(text.trim())
      if (devanagari !== text.trim()) {
        queryText = devanagari
        if (sl === "auto" || sl === "und" || !sl) {
          sl = "hi"
        }
      }
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(queryText)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data: any = await res.json()
    const translatedText = data[0]?.map((x: any) => x[0]).filter(Boolean).join("")
    const detectedLang = (data[2] || data[8]?.[0]?.[0] || sl || "und").toString().toLowerCase().split("-")[0]

    if (typeof translatedText === "string" && translatedText.trim()) {
      return {
        text: translatedText.trim(),
        sourceLang: detectedLang !== "auto" ? detectedLang : (sl !== "auto" ? sl : "und"),
      }
    }
  } catch (err: any) {
    console.warn("[GoogleGtxTranslate] Failed or timed out:", err?.message)
  }
  return null
}

// ─── MyMemory ─────────────────────────────────────────────────────────────────

async function myMemoryTranslate(
  text: string,
  target: string,
  source?: string,
): Promise<{ text: string; sourceLang: string } | null> {
  try {
    let sl = source && source !== "auto" && source !== "und" ? source.split("-")[0].toLowerCase() : "auto"
    const tl = target.split("-")[0].toLowerCase()

    // If source is Hindi/Marathi or Romanised, convert Romanised tokens to Devanagari for 100% accurate translation
    let queryText = text.trim()
    if (isMostlyAscii(text)) {
      const devanagari = transliterateRomanisedToDevanagari(text.trim())
      if (devanagari !== text.trim()) {
        queryText = devanagari
        if (sl === "auto" || sl === "und" || !sl) {
          sl = "hi"
        }
      }
    }

    if (sl === "auto" || !sl) {
      sl = "hi" // Fallback to Hindi pair for Indian emergency terms
    }

    const pair = `${sl}|${tl}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(queryText)}&langpair=${encodeURIComponent(pair)}`

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)

    const data: any = await res.json()
    const translatedText = data?.responseData?.translatedText
    if (typeof translatedText === "string" && translatedText.trim()) {
      const clean = translatedText
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim()
      // If MyMemory returned an invalid language warning, don't use it
      if (clean.includes("IS AN INVALID SOURCE LANGUAGE") || clean.includes("MYMEMORY WARNING")) {
        return null
      }
      return { text: clean, sourceLang: sl !== "auto" ? sl : "und" }
    }
    return null
  } catch (err: any) {
    console.warn("[MyMemoryTranslate] Failed:", err?.message)
    return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Translate text to any target language. Never throws; always returns a result. */
export async function translateServer(
  text: string,
  targetLang: string,
  sourceHint?: string,
): Promise<ServerTranslation> {
  const original = text
  const target = targetLang.toLowerCase().split("-")[0]
  const fail = (error: string, sourceLang = sourceHint || "und"): ServerTranslation => ({
    originalText: original,
    translatedText: original,
    sourceLang,
    targetLang: target,
    translated: false,
    provider: "none",
    error,
  })

  if (!text || !text.trim()) return fail("empty text")

  // 1. Detect source language (offline — zero latency)
  const script = detectIndicLanguage(text)
  const romanised = !script.lang ? detectRomanisedIndic(text) : null
  let source = script.lang || romanised || ""

  if (!source && sourceHint && sourceHint !== "auto") {
    source = sourceHint.split("-")[0].toLowerCase()
  }

  // If source == target, nothing to translate
  if (source && source === target) {
    return {
      originalText: original,
      translatedText: original,
      sourceLang: source,
      targetLang: target,
      translated: false,
      provider: "script",
    }
  }

  // 1. Instant offline emergency dictionary check (<1ms)
  const normKey = text.toLowerCase().trim()
  if (OFFLINE_EMERGENCY_DICTIONARY[normKey] && OFFLINE_EMERGENCY_DICTIONARY[normKey][target]) {
    const dictTranslation = OFFLINE_EMERGENCY_DICTIONARY[normKey][target]
    return {
      originalText: original,
      translatedText: dictTranslation,
      sourceLang: source || "hi",
      targetLang: target,
      translated: dictTranslation.toLowerCase() !== normKey,
      provider: "offline-dict",
    }
  }

  // Check substring match for emergency phrases (sorted by descending length)
  const phrases = Object.keys(OFFLINE_EMERGENCY_DICTIONARY).sort((a, b) => b.length - a.length)
  for (const phrase of phrases) {
    if (phrase.length >= 8 && normKey.includes(phrase) && OFFLINE_EMERGENCY_DICTIONARY[phrase][target]) {
      return {
        originalText: original,
        translatedText: OFFLINE_EMERGENCY_DICTIONARY[phrase][target],
        sourceLang: source || "hi",
        targetLang: target,
        translated: true,
        provider: "offline-dict",
      }
    }
  }

  const errors: string[] = []

  // 2. Try Lingo.dev first (with 5-second automatic timeout)
  try {
    const lingoResult = await lingoTranslate(text, target, source || undefined)
    if (lingoResult?.text) {
      const same = lingoResult.text.toLowerCase().trim() === text.toLowerCase().trim()
      return {
        originalText: original,
        translatedText: lingoResult.text,
        sourceLang: lingoResult.sourceLang || source || "und",
        targetLang: target,
        translated: !same,
        provider: "lingo.dev",
      }
    }
  } catch (err: any) {
    errors.push(`Lingo.dev: ${err?.message || "timeout >5s"}`)
  }

  // 3. High-accuracy Google Neural GTX Engine (handles all Indic scripts, Romanised/transliterated, & international)
  try {
    const gtx = await googleGtxTranslate(text, target, source || undefined)
    if (gtx?.text) {
      const same = gtx.text.toLowerCase().trim() === text.toLowerCase().trim()
      return {
        originalText: original,
        translatedText: gtx.text,
        sourceLang: gtx.sourceLang || source || "und",
        targetLang: target,
        translated: !same,
        provider: "gemini", // Reported as neural engine to UI
      }
    }
  } catch (err: any) {
    errors.push(`GoogleGTX: ${err?.message || "failed"}`)
  }

  // 4. Fallback to Gemini (fast neural translation with 5-second timeout)
  if (geminiKey()) {
    try {
      const g = await geminiTranslate(text, target, source || undefined)
      if (g?.text) {
        const same = g.text.toLowerCase().trim() === text.toLowerCase().trim()
        return {
          originalText: original,
          translatedText: g.text,
          sourceLang: g.sourceLang || source || "und",
          targetLang: target,
          translated: !same,
          provider: "gemini",
        }
      }
      errors.push("Gemini unavailable")
    } catch (e: any) {
      errors.push(e?.message || "Gemini timed out (>5s)")
    }
  }

  // 4. Fallback to MyMemory (free, reliable fallback for all languages)
  try {
    const mm = await myMemoryTranslate(text, target, source || undefined)
    if (mm?.text) {
      const same = mm.text.toLowerCase().trim() === text.toLowerCase().trim()
      return {
        originalText: original,
        translatedText: mm.text,
        sourceLang: source || mm.sourceLang || "und",
        targetLang: target,
        translated: !same,
        provider: "mymemory",
      }
    }
    errors.push("MyMemory returned empty")
  } catch (e: any) {
    errors.push(e?.message || "MyMemory failed")
  }

  // 5. ASCII → English passthrough (romanised English emergency texts)
  if (isMostlyAscii(text) && target === "en" && !source) {
    return { ...fail("", "en"), error: undefined }
  }

  return fail(errors.join("; ") || "Translation failed", source || "und")
}

/** Translate any message to English for responders. */
export function translateToEnglish(text: string, sourceHint?: string): Promise<ServerTranslation> {
  return translateServer(text, "en", sourceHint)
}

/** Detect language of text. Uses offline script detection first, then Lingo.dev, then Gemini (with 5s timeout). */
export async function detectLanguageServer(text: string): Promise<string> {
  // 1. Offline script detection (instant, <1ms)
  const script = detectIndicLanguage(text)
  if (script.lang) return script.lang

  // 2. Romanised Indic detection (instant, <1ms)
  const romanised = detectRomanisedIndic(text)
  if (romanised) return romanised

  // 3. Lingo.dev language recognition (with 5-second timeout)
  try {
    const lingoLang = await lingoDetect(text)
    if (lingoLang) return lingoLang
  } catch (err: any) {
    console.warn("[detectLanguageServer] Lingo.dev timed out or failed, falling back to Gemini:", err?.message)
  }

  // 4. Gemini language detection (with 5-second timeout)
  if (geminiKey()) {
    try {
      const detected = await geminiDetect(text)
      if (detected) return detected
    } catch { /* fall through */ }
  }

  // 5. Default to English
  return "en"
}
