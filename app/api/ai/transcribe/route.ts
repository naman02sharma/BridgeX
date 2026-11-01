import { NextResponse } from "next/server"
import { classifyEmergency } from "@/lib/emergency-classifier"

export const runtime = "nodejs"
export const maxDuration = 30 // Allow up to 30s for audio transcription

const TRANSCRIBE_MODELS = [
  "gemini-3.5-transcribe",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
]

function getGeminiKey(): string {
  return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ""
}

const LANGUAGE_MAP: Record<string, string> = {
  mr: "Marathi",
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
  or: "Odia",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
}

export async function POST(req: Request) {
  try {
    const key = getGeminiKey()
    if (!key) {
      return NextResponse.json({ error: "AI transcription API key is not configured" }, { status: 500 })
    }

    let base64Audio = ""
    let mimeType = "audio/webm"
    let languageHint = ""

    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("audio") as Blob | null
      languageHint = (formData.get("languageHint") as string) || ""

      if (!file) {
        return NextResponse.json({ error: "No audio file provided in form data" }, { status: 400 })
      }

      mimeType = file.type || "audio/webm"
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      base64Audio = buffer.toString("base64")
    } else {
      let json: any = {}
      try {
        json = await req.json()
      } catch {}
      base64Audio = json?.audio || ""
      mimeType = json?.mimeType || "audio/webm"
      languageHint = json?.languageHint || ""

      // Strip data URL prefix if present
      if (base64Audio.includes(",")) {
        base64Audio = base64Audio.split(",")[1]
      }
    }

    if (!base64Audio || base64Audio.length < 50) {
      return NextResponse.json({ error: "Empty or invalid audio data" }, { status: 400 })
    }

    // Clean up mimeType (remove codecs=... parameter for Gemini inlineData)
    const normalizedMimeType = mimeType.split(";")[0].trim() || "audio/webm"

    const systemPrompt =
      `You are an emergency voice SOS response assistant for BridgeX. ` +
      `Your job is to transcribe the user's spoken distress audio verbatim. ` +
      `The speaker may be talking in any Indian language: Marathi (मराठी), Hindi (हिन्दी), Bengali (বাংলা), ` +
      `Tamil (தமிழ்), Telugu (తెలుగు), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), ` +
      `Punjabi (ਪੰਜਾਬੀ), Urdu (اردو), Odia (ଓଡ଼ିଆ), or English. ` +
      (languageHint ? `The user selected language hint is "${languageHint}". ` : "") +
      `\n\nInstructions:\n` +
      `1. Transcribe what the speaker said verbatim in the original native script (Devanagari for Marathi/Hindi, etc.). ` +
      `2. Identify the language code (ISO 639-1 e.g. mr, hi, bn, ta, te, gu, pa, en). ` +
      `3. Provide an accurate English translation of what was said. ` +
      `4. Classify the emergency department: "medical" | "fire" | "security" | "other". ` +
      `\n\nRespond ONLY with a valid JSON object matching this schema: ` +
      `{"transcript": "<native text in proper script>", "sourceLang": "<iso code>", "translation": "<english translation>", "category": "<medical|fire|security|other>", "confidence": 0.95}`

    let lastError = ""

    for (const model of TRANSCRIBE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: normalizedMimeType,
                        data: base64Audio,
                      },
                    },
                    {
                      text: systemPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
                maxOutputTokens: 1024,
              },
            }),
            signal: AbortSignal.timeout(15000), // 15 second timeout
          }
        )

        if (!response.ok) {
          const errText = await response.text()
          lastError = `Model ${model} returned HTTP ${response.status}: ${errText}`
          continue
        }

        const data = await response.json()
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!rawText) continue

        const cleanJson = rawText.replace(/^```json\s*|```$/g, "").trim()
        const parsed = JSON.parse(cleanJson)

        const transcript = (parsed.transcript || "").trim()
        const translation = (parsed.translation || transcript).trim()
        const sourceLang = (parsed.sourceLang || languageHint || "und").toLowerCase().split("-")[0]
        const category = parsed.category || classifyEmergency(transcript, translation).category

        return NextResponse.json({
          success: true,
          transcript,
          translation,
          sourceLang,
          languageName: LANGUAGE_MAP[sourceLang] || sourceLang,
          category,
          model,
          provider: "gemini",
        })
      } catch (err: any) {
        lastError = err?.message || String(err)
      }
    }

    console.warn("[TranscribeRoute] All models failed, last error:", lastError)
    return NextResponse.json(
      { error: "Audio transcription failed. Please speak clearly or type your message.", details: lastError },
      { status: 502 }
    )
  } catch (err: any) {
    console.error("[TranscribeRoute] Unexpected error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal server error during audio transcription" },
      { status: 500 }
    )
  }
}
