import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { responderId, latitude, longitude, status, accuracy } = await request.json()

    if (!responderId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Update or insert responder location
    const { data, error } = await supabase
      .from('responder_locations')
      .upsert({
        responder_id: responderId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: status || 'available',
        accuracy: accuracy ? parseFloat(accuracy) : null,
        last_updated: new Date().toISOString(),
        active: true
      }, {
        onConflict: 'responder_id'
      })
      .select()

    if (error) {
      console.error('Error updating responder location:', error)
      return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
    }

    // Broadcast location update via realtime channel
    const locationChannel = supabase.channel(`responder_location_${responderId}`)
    await locationChannel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: {
        responderId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: status || 'available',
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      location: data[0],
      realtimeBroadcast: true
    })
  } catch (error) {
    console.error("Location update error:", error)
    return NextResponse.json({ error: "Location update failed" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const responderId = searchParams.get("responderId")

    if (!responderId) {
      return NextResponse.json({ error: "Responder ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('responder_locations')
      .select('*')
      .eq('responder_id', responderId)
      .eq('active', true)
      .single()

    if (error) {
      console.error('Error fetching responder location:', error)
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json({ location: data })
  } catch (error) {
    console.error("Location fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 })
  }
}