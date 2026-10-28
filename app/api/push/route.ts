import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import webpush from 'web-push'

// Only configure web-push when VAPID keys exist, otherwise importing this route throws
const vapidConfigured = !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
if (vapidConfigured) {
  webpush.setVapidDetails(
    'mailto:alerts@bridgex.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const { userId, title, message, type, priority, subscription } = await request.json()

    // Store push subscription for the user
    if (subscription) {
      const { error: subError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription,
          updated_at: new Date().toISOString(),
        })

      if (subError) console.error('Error storing subscription:', subError)
    }

    // Store notification in database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type: type || 'info',
        user_id: userId,
        priority: priority || 'normal',
        read: false,
      })
      .select()
      .single()

    if (error) throw error

    // Send push notification if subscription exists
    if (subscription && vapidConfigured) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          JSON.stringify({
            title: title || 'BridgeX Alert',
            body: message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: {
              type: type || 'info',
              priority: priority || 'normal',
              userId,
            },
          })
        )
        console.log('Push notification sent successfully')
      } catch (pushError) {
        console.error('Error sending push notification:', pushError)
        // Don't fail the request if push fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      notification,
      message: "Notification processed successfully",
    })
  } catch (error) {
    console.error("[BridgeX] Push notification error:", error)
    return NextResponse.json({ success: false, error: "Failed to process notification" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    // Get user's push subscription
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return NextResponse.json({
      success: true,
      subscription: subscription?.subscription || null,
    })
  } catch (error) {
    console.error("[BridgeX] Get subscription error:", error)
    return NextResponse.json({ success: false, error: "Failed to get subscription" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    // Remove push subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Push subscription removed successfully",
    })
  } catch (error) {
    console.error("[BridgeX] Delete subscription error:", error)
    return NextResponse.json({ success: false, error: "Failed to remove subscription" }, { status: 500 })
  }
}