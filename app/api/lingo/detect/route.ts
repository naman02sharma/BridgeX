import { NextResponse } from "next/server"
import { detectLanguageServer } from "@/lib/server-translate"
import { detectIndicLanguage, detectRomanisedIndic } from "@/lib/language-scripts"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Missing required field: text" }, { status: 400 })
    }

    // 1. Offline Indic script detection (instant, zero latency)
    const script = detectIndicLanguage(text)
    if (script.lang) {
      return NextResponse.json({
        detectedLang: script.lang,
        language: script.lang,
        confidence: Math.min(1, script.share + 0.1),
        provider: "script",
      })
    }

    // 2. Romanised Indic detection (instant)
    const romanised = detectRomanisedIndic(text)
    if (romanised) {
      return NextResponse.json({
        detectedLang: romanised,
        language: romanised,
        confidence: 0.75,
        provider: "romanised",
      })
    }

    // 3. Gemini-powered detection for Latin/other scripts
    const detected = await detectLanguageServer(text)
    return NextResponse.json({
      detectedLang: detected,
      language: detected,
      confidence: 0.9,
      provider: "gemini",
    })
  } catch (error: any) {
    console.error("Language detection API error:", error)
    return NextResponse.json(
      { detectedLang: "en", language: "en", confidence: 0, provider: "fallback", error: error.message },
      { status: 200 }, // still return 200 so clients don't crash
    )
  }
}