import { NextResponse } from "next/server"

/**
 * Chat Translation API - Uses Lingo.dev ONLY
 * Redirects all translation requests to Lingo.dev API
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, targetLang, sourceLang, detectOnly } = body

    if (!text) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 })
    }

    // Language detection
    if (detectOnly) {
      const detectResponse = await fetch(new URL('/api/lingo/detect', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      
      const detectData = await detectResponse.json()
      return NextResponse.json({
        sourceLang: detectData.language || detectData.detectedLang || 'en',
        detected: true
      })
    }

    // Translation using Lingo.dev
    if (!targetLang) {
      return NextResponse.json({ error: "Missing targetLang parameter" }, { status: 400 })
    }

    const translateResponse = await fetch(new URL('/api/lingo/translate', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang: sourceLang || 'auto'
      }),
    })

    const data = await translateResponse.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error("❌ Chat translation error:", error)
    
    return NextResponse.json({
      originalText: "",
      translatedText: "",
      error: error.message,
    }, { status: 500 })
  }
}
