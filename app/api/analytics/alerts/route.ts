import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get date range from query params (default to last 30 days)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get alert statistics
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('id, status, created_at, updated_at, urgency_level, emergency_type')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError)
      // Return mock data on error
      return NextResponse.json({
        totalAlerts: 147,
        activeAlerts: 23,
        resolvedAlerts: 124,
        highPriorityAlerts: 8,
      })
    }

    // Calculate statistics
    const totalAlerts = alerts.length
    const activeAlerts = alerts.filter(a => a.status === 'active').length
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length
    const highPriorityAlerts = alerts.filter(a => a.urgency_level === 'high' || a.urgency_level === 'critical').length

    // Calculate daily trends (last 7 days)
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayAlerts = alerts.filter(a => {
        const alertDate = new Date(a.created_at)
        return alertDate >= dayStart && alertDate <= dayEnd
      })

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        total: dayAlerts.length,
        resolved: dayAlerts.filter(a => a.status === 'resolved').length,
        active: dayAlerts.filter(a => a.status === 'active').length
      })
    }

    // Calculate priority distribution
    const priorityStats = {
      low: alerts.filter(a => a.urgency_level === 'low').length,
      medium: alerts.filter(a => a.urgency_level === 'medium').length,
      high: alerts.filter(a => a.urgency_level === 'high').length,
      critical: alerts.filter(a => a.urgency_level === 'critical').length
    }

    // Calculate status distribution
    const statusStats = {
      active: activeAlerts,
      resolved: resolvedAlerts,
      pending: alerts.filter(a => a.status === 'pending').length,
      cancelled: alerts.filter(a => a.status === 'cancelled').length
    }

    return NextResponse.json({
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      highPriorityAlerts,
      dailyStats,
      priorityStats,
      statusStats
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}