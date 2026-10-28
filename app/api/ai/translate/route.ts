import { NextResponse } from "next/server"
import { translateServer } from "@/lib/server-translate"

/**
 * Unified Translation API – Gemini (primary) + MyMemory (fallback).
 * No Lingo.dev dependency.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, targetLang, sourceLang } = body

    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing required fields: text, targetLang" }, { status: 400 })
    }

    const result = await translateServer(text, targetLang, sourceLang)

    return NextResponse.json({
      originalText: result.originalText,
      translatedText: result.translatedText,
      sourceLang: result.sourceLang,
      targetLang: result.targetLang,
      confidence: result.translated ? 0.95 : 0,
      provider: result.provider,
      ...(result.error ? { error: result.error } : {}),
    })
  } catch (error: any) {
    console.error("Translation API error:", error.message || error)
    return NextResponse.json(
      {
        originalText: "",
        translatedText: "",
        sourceLang: "en",
        targetLang: "en",
        confidence: 0,
        provider: "error",
        error: error.message || "Translation failed",
      },
      { status: 500 },
    )
  }
}
