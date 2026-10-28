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

    // Get alerts with response data
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select(`
        id,
        status,
        created_at,
        resolved_at,
        priority,
        responses!inner(
          id,
          created_at,
          responder_id,
          status
        )
      `)
      .gte('created_at', startDate.toISOString())
      .eq('responses.status', 'accepted')
      .order('created_at', { ascending: false })

    if (alertsError) {
      console.error('Error fetching response times:', alertsError)
      return NextResponse.json({ error: 'Failed to fetch response times' }, { status: 500 })
    }

    // Calculate response times
    const responseTimes = alerts.map(alert => {
      const alertTime = new Date(alert.created_at)
      const firstResponse = alert.responses
        .filter(r => r.status === 'accepted')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]

      if (!firstResponse) return null

      const responseTime = new Date(firstResponse.created_at)
      const timeDiff = responseTime.getTime() - alertTime.getTime()
      const minutes = Math.round(timeDiff / (1000 * 60))

      return {
        id: alert.id,
        priority: alert.priority,
        responseTime: minutes,
        resolved: alert.status === 'resolved',
        date: alert.created_at.split('T')[0]
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null)

    // Calculate average response times by priority
    const priorityGroups = responseTimes.reduce((acc, item) => {
      if (!acc[item.priority]) {
        acc[item.priority] = []
      }
      acc[item.priority].push(item.responseTime)
      return acc
    }, {} as Record<string, number[]>)

    const avgResponseTimes = Object.entries(priorityGroups).map(([priority, times]) => ({
      priority,
      average: Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length),
      count: times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    }))

    // Calculate response time distribution (buckets)
    const timeBuckets = [
      { range: '0-5min', min: 0, max: 5, count: 0 },
      { range: '5-15min', min: 5, max: 15, count: 0 },
      { range: '15-30min', min: 15, max: 30, count: 0 },
      { range: '30-60min', min: 30, max: 60, count: 0 },
      { range: '60min+', min: 60, max: Infinity, count: 0 }
    ]

    responseTimes.forEach(item => {
      const bucket = timeBuckets.find(b =>
        item.responseTime >= b.min && item.responseTime < b.max
      )
      if (bucket) bucket.count++
    })

    // Calculate daily response time trends
    const dailyTrends: Array<{ date: string; average: number; count: number }> = []
    const dateMap = new Map<string, number[]>()

    responseTimes.forEach(item => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, [])
      }
      dateMap.get(item.date)!.push(item.responseTime)
    })

    Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, times]) => {
        dailyTrends.push({
          date,
          average: Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length),
          count: times.length
        })
      })

    return NextResponse.json({
      responseTimes,
      avgResponseTimes,
      timeBuckets,
      dailyTrends,
      totalResponses: responseTimes.length
    })

  } catch (error) {
    console.error('Response times analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}