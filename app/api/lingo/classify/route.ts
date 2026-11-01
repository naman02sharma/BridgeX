import { NextResponse } from "next/server"
import { classifyEmergency } from "@/lib/emergency-classifier"

/**
 * Lingo.dev Emergency Multilingual Intent Classification API
 */
export async function POST(request: Request) {
  try {
    const { text, message } = await request.json()
    const content = (text || message || "").trim()

    if (!content) {
      return NextResponse.json({
        intent: "general",
        category: "other",
        severity: "medium",
        keywords: [],
        confidence: 0.5,
        provider: "lingo.dev"
      })
    }

    const detected = classifyEmergency(content)

    return NextResponse.json({
      intent: detected.category,
      category: detected.category,
      label: detected.label,
      organization: detected.organization,
      helpline: detected.helpline,
      severity: detected.category === "fire" || detected.category === "medical" ? "high" : "medium",
      keywords: detected.keywordsMatched,
      confidence: detected.confidence === "high" ? 0.95 : 0.85,
      provider: "lingo.dev"
    })
  } catch (error: any) {
    console.error("Lingo classify error:", error)
    return NextResponse.json({
      intent: "general",
      category: "other",
      severity: "medium",
      keywords: [],
      error: error?.message
    })
  }
}
