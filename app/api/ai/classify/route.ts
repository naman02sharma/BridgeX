import { NextResponse } from "next/server"
import { classifyEmergency } from "@/lib/emergency-classifier"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const detected = classifyEmergency(message)
    const severityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
      high: "high",
      medium: "medium",
      low: "low",
    }

    return NextResponse.json({
      type: detected.category === "security" ? "security" : detected.category,
      category: detected.category,
      severity: severityMap[detected.confidence] || "medium",
      keywords: detected.keywordsMatched,
      organization: detected.organization,
      helpline: detected.helpline,
      label: detected.label,
    })
  } catch (error) {
    console.error("Classification API error:", error)
    return NextResponse.json({ error: "Classification failed" }, { status: 500 })
  }
}
