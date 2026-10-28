import { NextResponse } from "next/server"
import { translateServer } from "@/lib/server-translate"

export async function POST(req: Request) {
  let body: { text?: string; targetLang?: string; sourceLang?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

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
}
