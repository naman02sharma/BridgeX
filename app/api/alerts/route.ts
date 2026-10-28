import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getServerSupabase } from "@/lib/supabase-server"
import type { EmergencyType } from "@/lib/sos-system"
import { translateToEnglish } from "@/lib/server-translate"
import { dispatchAlert } from "@/lib/dispatch"
import { classifyEmergency } from "@/lib/emergency-classifier"

export async function POST(request: Request) {
  try {
    const { userId, emergencyType, urgencyLevel, message, originalMessage, location, metadata, sourceLanguage, phone } = await request.json()

    console.log('[API] Creating alert:', { userId, emergencyType, urgencyLevel, messageLength: message?.length })

    // Translate the SOS message to English so responders can always read it.
    // The original text is kept in `original_message`.
    const rawMessage = (originalMessage || message || '').trim()
    let languageCode = sourceLanguage || 'en'
    let translatedMessage = message
    let translationProvider = 'none'
    let translationError: string | undefined

    try {
      const result = await translateToEnglish(rawMessage, sourceLanguage)
      languageCode = result.sourceLang && result.sourceLang !== 'und' ? result.sourceLang : (sourceLanguage || 'en')
      translationProvider = result.provider
      translationError = result.error
      if (result.translated) {
        translatedMessage = result.translatedText
      } else if (result.error) {
        console.warn('[API] Translation failed, sending original text:', result.error)
      }
    } catch (translationErr) {
      console.warn('[API] Translation skipped:', translationErr)
    }
    const wasTranslated = translatedMessage !== rawMessage

    // Auto-detect emergency type and target organization from text/translation
    const detected = classifyEmergency(rawMessage, translatedMessage)
    const finalEmergencyType = detected.category !== 'other' 
      ? detected.category 
      : (emergencyType && emergencyType !== 'other' ? emergencyType : 'medical')

    // Save the alert. The id is generated here so we never need to read the row back
    // (reading would be blocked by row-level security for guests).
    const isUuid = (v: unknown) =>
      typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
    const victimPhone = phone || metadata?.phone || metadata?.victim_phone || null
    const alertRow = {
      id: crypto.randomUUID(),
      user_id: isUuid(userId) ? userId : null,
      emergency_type: finalEmergencyType,
      urgency_level: urgencyLevel || (finalEmergencyType === "medical" || finalEmergencyType === "fire" ? "high" : "medium"),
      message: translatedMessage || rawMessage,
      original_message: rawMessage,
      language_code: languageCode,
      location,
      metadata: {
        ...metadata,
        phone: victimPhone,
        victim_phone: victimPhone,
        routed_organization: detected.organization,
        routed_helpline: detected.helpline,
        emergency_department: detected.organization,
        emergency_helpline: detected.helpline,
        detected_category: detected.category,
        detected_confidence: detected.confidence,
        matched_keywords: detected.keywordsMatched,
        address_details: location?.address || location?.details || metadata?.address_details || null,
        ...(isUuid(userId) ? {} : { guest_id: userId }),
        language_code: languageCode,
        translated: wasTranslated,
        translation_provider: translationProvider,
        translation_error: translationError
      },
    }

    // Fall back to a mock response if the database is not reachable
    let alert
    let dispatch = { notified: 0 }
    try {
      const db = getServerSupabase()
      let { error } = await db.from('alerts').insert(alertRow)

      // The user has no profile row yet (foreign key): save the alert without the link
      if (error && error.code === '23503') {
        ;({ error } = await db.from('alerts').insert({ ...alertRow, user_id: null }))
      }

      if (error) {
        console.error('[API] Supabase insert error:', error)
        throw error
      }

      if (isUuid(userId) && victimPhone) {
        try {
          await db.from('profiles').update({ phone: victimPhone }).eq('id', userId)
        } catch {
          // Ignore profile sync errors
        }
      }

      alert = {
        ...alertRow,
        status: 'active',
        panic_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      console.log('[API] Alert created in database:', alert.id)

      // Notify nearby verified responders whose specialization matches this emergency type
      try {
        dispatch = await dispatchAlert(db, alertRow as any)
        console.log('[API] Responders notified:', dispatch.notified)
      } catch (dispatchErr: any) {
        console.warn('[API] Responder dispatch failed:', dispatchErr?.message || dispatchErr)
      }

    } catch (dbError: any) {
      console.warn('[API] Database unavailable, using mock response:', dbError.message)
      
      // Mock alert response when database is not available
      alert = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        emergency_type: emergencyType,
        urgency_level: urgencyLevel,
        message: translatedMessage,
        original_message: message,
        language_code: languageCode,
        location,
        metadata: {
          ...metadata,
          language_code: languageCode,
          translated: wasTranslated,
          translation_provider: translationProvider,
          translation_error: translationError,
          mock: true,
          note: 'Database not configured - this is a demo alert'
        },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('[API] Mock alert created:', alert.id)
    }

    return NextResponse.json({
      success: true,
      alert,
      dispatch: { notified: dispatch.notified },
      message: "SOS alert created successfully",
    })
  } catch (error: any) {
    console.error("[API] Alert creation error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to create alert",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit")

    const db = getServerSupabase()
    let query = db
      .from('alerts')
      .select('*, profiles:user_id(name, phone)')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (userId) {
      query = query.or(`user_id.eq.${userId},responders.cs.{${userId}}`)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    let { data: alerts, error } = await query

    if (error) {
      console.warn("[API] Joining profiles failed, falling back to alerts only:", error.message)
      let fb = db.from('alerts').select('*').order('created_at', { ascending: false })
      if (status) fb = fb.eq('status', status)
      if (limit) fb = fb.limit(parseInt(limit))
      const res = await fb
      alerts = res.data
    }

    return NextResponse.json(alerts || [])
  } catch (error) {
    console.error("[API] Alert fetch error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
