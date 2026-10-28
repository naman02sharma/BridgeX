import type { SupabaseClient } from "@supabase/supabase-js"
import webpush from "web-push"

/** Which responder specializations can handle which emergency type. */
export const SPECIALIZATIONS_FOR: Record<string, string[]> = {
  medical: ["medical", "trauma", "first-aid"],
  fire: ["fire", "rescue"],
  accident: ["medical", "trauma", "rescue", "first-aid"],
  security: ["security", "rescue", "support"],
  natural_disaster: ["rescue", "fire", "medical", "support"],
  other: ["rescue", "support", "first-aid", "medical", "fire", "trauma", "security"],
}

export const EMERGENCY_LABEL: Record<string, string> = {
  medical: "Medical",
  fire: "Fire",
  accident: "Accident",
  security: "Security",
  natural_disaster: "Natural disaster",
  other: "Emergency",
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface AlertLike {
  id: string
  user_id: string | null
  emergency_type: string
  urgency_level: string
  message: string | null
  location: { lat?: number; lng?: number; address?: string } | null
}

/**
 * Notify nearby, verified, on-duty responders whose specialization fits the
 * emergency type. `widen` (used by panic escalation) triples the radius and
 * accepts every specialization. Responders already notified are skipped.
 */
export async function dispatchAlert(db: SupabaseClient, alert: AlertLike, opts: { widen?: boolean } = {}) {
  const widen = !!opts.widen
  const lat = Number(alert.location?.lat)
  const lng = Number(alert.location?.lng)
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)

  const { data: responders, error } = await db
    .from("responders")
    .select("id, user_id, organization, specializations, response_radius, active, verification_status")
    .eq("active", true)
    .eq("verification_status", "verified")
  if (error) throw error

  const candidates = (responders || []).filter((r: any) => r.user_id && r.user_id !== alert.user_id)
  if (candidates.length === 0) return { notified: 0, responderUserIds: [] as string[] }

  const { data: locations } = await db
    .from("responder_locations")
    .select("responder_id, latitude, longitude, status, last_updated, active")
    .in("responder_id", candidates.map((r: any) => r.id))
  const locationOf = new Map<string, any>((locations || []).map((l: any) => [l.responder_id, l]))

  const { data: already } = await db
    .from("notifications")
    .select("user_id")
    .eq("alert_id", alert.id)
    .eq("type", "alert")
  const alreadyNotified = new Set((already || []).map((n: any) => n.user_id))

  const wanted = SPECIALIZATIONS_FOR[alert.emergency_type] || SPECIALIZATIONS_FOR.other
  const maxAgeMs = 24 * 60 * 60 * 1000

  const targets: { userId: string; distance: number | null }[] = []
  for (const r of candidates) {
    if (alreadyNotified.has(r.user_id)) continue

    if (!widen) {
      const specs: string[] = r.specializations || []
      if (!specs.some((s) => wanted.includes(s))) continue
    }

    const loc = locationOf.get(r.id)
    const fresh = loc && loc.active !== false && loc.status !== "offline" &&
      Date.now() - new Date(loc.last_updated).getTime() < maxAgeMs

    if (hasLocation && fresh) {
      const d = distanceKm(lat, lng, Number(loc.latitude), Number(loc.longitude))
      const radius = Math.min((r.response_radius || 20) * (widen ? 3 : 1), 100)
      if (d > radius) continue
      targets.push({ userId: r.user_id, distance: d })
    } else {
      // Verified responders without an active GPS ping still receive the emergency dispatch alert
      targets.push({ userId: r.user_id, distance: null })
    }
  }

  if (targets.length === 0) return { notified: 0, responderUserIds: [] as string[] }

  const label = EMERGENCY_LABEL[alert.emergency_type] || "Emergency"
  const priority = alert.urgency_level === "critical" ? "urgent" : "high"
  const rows = targets.map((t) => ({
    user_id: t.userId,
    alert_id: alert.id,
    title: `${widen ? "🚨 ESCALATED: " : "🚨 "}${label} emergency nearby`,
    body: alert.message || `${label} emergency reported`,
    message: alert.message || `${label} emergency reported`,
    type: "alert",
    priority,
    read: false,
    status: "pending",
    data: {
      alertId: alert.id,
      emergencyType: alert.emergency_type,
      urgency: alert.urgency_level,
      distanceKm: t.distance === null ? null : Math.round(t.distance * 10) / 10,
      location: alert.location,
      escalated: widen,
    },
  }))

  const { error: insertError } = await db.from("notifications").insert(rows)
  if (insertError) throw insertError

  // Best-effort browser push (only if VAPID keys are configured)
  void sendPush(db, targets.map((t) => t.userId), rows[0].title, rows[0].message)

  return { notified: rows.length, responderUserIds: targets.map((t) => t.userId) }
}

async function sendPush(db: SupabaseClient, userIds: string[], title: string, body: string) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return
  try {
    webpush.setVapidDetails("mailto:alerts@bridgex.app", pub, priv)
    const { data } = await db.from("push_subscriptions").select("subscription").in("user_id", userIds)
    await Promise.allSettled(
      (data || []).map((row: any) =>
        webpush.sendNotification(row.subscription, JSON.stringify({ title, body, icon: "/icon-192x192.png" })),
      ),
    )
  } catch (err) {
    console.warn("[dispatch] push failed:", err)
  }
}
