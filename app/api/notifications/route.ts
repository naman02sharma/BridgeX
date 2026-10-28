import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { title, message, type, userId, priority } = await request.json()

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        user_id: userId,
        priority: priority || 'normal',
        read: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      notification,
      message: "Notification sent successfully",
    })
  } catch (error) {
    console.error("[BridgeX] Notification creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query.limit(50)

    if (error) throw error

    return NextResponse.json({
      success: true,
      notifications: data,
    })
  } catch (error) {
    console.error("[BridgeX] Notification fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}