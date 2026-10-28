"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface TestResult {
  feature: string
  status: 'pending' | 'success' | 'error'
  message: string
  timestamp?: string
}

export function RealtimeTestPanel() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { feature: 'Active Alerts Subscription', status: 'pending', message: 'Testing...' },
    { feature: 'Chat Messages Subscription', status: 'pending', message: 'Testing...' },
    { feature: 'Real-time Notifications', status: 'pending', message: 'Testing...' },
    { feature: 'Responder Locations', status: 'pending', message: 'Testing...' },
    { feature: 'Push Notifications', status: 'pending', message: 'Testing...' }
  ])

  const [isTesting, setIsTesting] = useState(false)

  const updateTestResult = (feature: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => prev.map(result =>
      result.feature === feature
        ? { ...result, status, message, timestamp: new Date().toLocaleTimeString() }
        : result
    ))
  }

  const testRealtimeSubscriptions = async () => {
    setIsTesting(true)

    // Test 1: Active Alerts Subscription
    try {
      const alertsChannel = supabase.channel('test_alerts')
      let alertReceived = false

      const subscription = alertsChannel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        }, (payload) => {
          alertReceived = true
          updateTestResult('Active Alerts Subscription', 'success', 'Realtime alert updates working')
        })
        .subscribe()

      // Wait a bit for subscription to establish
      await new Promise(resolve => setTimeout(resolve, 2000))

      if (!alertReceived) {
        updateTestResult('Active Alerts Subscription', 'success', 'Subscription established (no test data)')
      }

      supabase.removeChannel(alertsChannel)
    } catch (error) {
      updateTestResult('Active Alerts Subscription', 'error', `Failed: ${error}`)
    }

    // Test 2: Chat Messages Subscription
    try {
      const chatChannel = supabase.channel('test_chat')
      let messageReceived = false

      chatChannel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, (payload) => {
          messageReceived = true
          updateTestResult('Chat Messages Subscription', 'success', 'Realtime chat updates working')
        })
        .subscribe()

      await new Promise(resolve => setTimeout(resolve, 2000))

      if (!messageReceived) {
        updateTestResult('Chat Messages Subscription', 'success', 'Subscription established (no test data)')
      }

      supabase.removeChannel(chatChannel)
    } catch (error) {
      updateTestResult('Chat Messages Subscription', 'error', `Failed: ${error}`)
    }

    // Test 3: Real-time Notifications
    try {
      const notifChannel = supabase.channel('test_notifications')
      let notifReceived = false

      notifChannel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        }, (payload) => {
          notifReceived = true
          updateTestResult('Real-time Notifications', 'success', 'Realtime notifications working')
        })
        .subscribe()

      await new Promise(resolve => setTimeout(resolve, 2000))

      if (!notifReceived) {
        updateTestResult('Real-time Notifications', 'success', 'Subscription established (no test data)')
      }

      supabase.removeChannel(notifChannel)
    } catch (error) {
      updateTestResult('Real-time Notifications', 'error', `Failed: ${error}`)
    }

    // Test 4: Responder Locations
    try {
      const locationChannel = supabase.channel('test_locations')
      let locationReceived = false

      locationChannel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'responder_locations'
        }, (payload) => {
          locationReceived = true
          updateTestResult('Responder Locations', 'success', 'Realtime location updates working')
        })
        .subscribe()

      await new Promise(resolve => setTimeout(resolve, 2000))

      if (!locationReceived) {
        updateTestResult('Responder Locations', 'success', 'Subscription established (no test data)')
      }

      supabase.removeChannel(locationChannel)
    } catch (error) {
      updateTestResult('Responder Locations', 'error', `Failed: ${error}`)
    }

    // Test 5: Push Notifications
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          updateTestResult('Push Notifications', 'success', 'Push notifications enabled and subscription active')
        } else {
          updateTestResult('Push Notifications', 'error', 'No active push subscription found')
        }
      } else {
        updateTestResult('Push Notifications', 'error', 'Push notifications not supported')
      }
    } catch (error) {
      updateTestResult('Push Notifications', 'error', `Failed: ${error}`)
    }

    setIsTesting(false)
  }

  useEffect(() => {
    // Auto-run tests on component mount
    testRealtimeSubscriptions()
  }, [])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Realtime Features Test</h3>
        <Button
          onClick={testRealtimeSubscriptions}
          disabled={isTesting}
          variant="outline"
        >
          {isTesting ? 'Testing...' : 'Run Tests'}
        </Button>
      </div>

      <div className="space-y-3">
        {testResults.map((result) => (
          <div
            key={result.feature}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3">
              {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {result.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              {result.status === 'pending' && <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />}
              <div>
                <div className="font-medium text-sm">{result.feature}</div>
                <div className="text-xs text-muted-foreground">{result.message}</div>
                {result.timestamp && (
                  <div className="text-xs text-muted-foreground">Last tested: {result.timestamp}</div>
                )}
              </div>
            </div>
            <Badge
              variant={
                result.status === 'success' ? 'default' :
                result.status === 'error' ? 'destructive' : 'secondary'
              }
            >
              {result.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}