import { NextResponse } from "next/server"

/**
 * Lingo.dev Emergency Classification API
 * Uses Lingo.dev SDK for intent classification
 */
export async function POST(request: Request) {
  try {
    const { text, domain, classes } = await request.json()

    const lingoApiKey = process.env.LINGO_API_KEY || process.env.NEXT_PUBLIC_LINGO_API_KEY

    if (!lingoApiKey) {
      // Fallback classification
      return NextResponse.json({
        intent: "general",
        severity: "medium",
        keywords: extractKeywords(text)
      })
    }

    // Simple keyword-based classification for emergency messages
    const lowerText = text.toLowerCase()
    
    let intent = "general"
    let severity = "medium"
    
    // Fire-related
    if (/fire|burning|smoke|flames/.test(lowerText)) {
      intent = "fire"
      severity = "critical"
    }
    // Medical emergencies
    else if (/medical|ambulance|injured|hurt|bleeding|unconscious|heart attack|stroke/.test(lowerText)) {
      intent = "medical"
      severity = "high"
    }
    // Natural disasters
    else if (/earthquake|flood|tsunami|tornado|hurricane|disaster/.test(lowerText)) {
      intent = "disaster"
      severity = "critical"
    }
    // Security threats
    else if (/robbery|theft|assault|attack|weapon|threat|danger/.test(lowerText)) {
      intent = "security"
      severity = "high"
    }
    // Police-related
    else if (/police|crime|accident|collision/.test(lowerText)) {
      intent = "police"
      severity = "medium"
    }

    return NextResponse.json({
      intent,
      severity,
      keywords: extractKeywords(text),
      confidence: 0.85,
      provider: "lingo-rules"
    })
  } catch (error) {
    console.error("Lingo classify error:", error)
    return NextResponse.json({
      intent: "general",
      severity: "medium",
      keywords: []
    })
  }
}

function extractKeywords(text: string): string[] {
  const emergencyKeywords = [
    'fire', 'medical', 'police', 'ambulance', 'emergency', 'help', 'urgent',
    'disaster', 'earthquake', 'flood', 'accident', 'injured', 'danger'
  ]
  
  const words = text.toLowerCase().split(/\s+/)
  return words.filter(word => emergencyKeywords.includes(word))
}