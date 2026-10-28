"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { useOfflineSupport } from "@/hooks/useOfflineSupport"
import { useGlobalTranslation } from "@/components/translation-provider"
import { translations } from "@/lib/ui-translations"

interface OfflineIndicatorProps {
  className?: string
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { t } = useGlobalTranslation()
  const { isOnline, offlineQueue, isSyncing, syncOfflineAlerts, clearOfflineQueue, unsyncedCount } = useOfflineSupport()
  const [showQueue, setShowQueue] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')

  useEffect(() => {
    setIsClient(true)
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('bridgex-lang') || 'en'
    setCurrentLanguage(savedLang)
  }, [])

  // Synchronous translation for static UI text
  const getTranslation = (key: string) => {
    return translations[currentLanguage]?.[key] || translations['en'][key] || key
  }

  if (isOnline && offlineQueue.length === 0) {
    return null // Don't show anything when online and no queued items
  }

  return (
    <div className={className}>
      <Alert className={`border-l-4 ${isOnline ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription className="flex items-center gap-2">
              <span className={isOnline ? 'text-green-800' : 'text-red-800'}>
                {isOnline ? getTranslation('onlineMode') : getTranslation('offlineMode')}
              </span>
              {offlineQueue.length > 0 && (
                <Badge variant={isOnline ? "secondary" : "destructive"} className="ml-2">
                  {unsyncedCount} {getTranslation('queued').toLowerCase()}
                </Badge>
              )}
              {isSyncing && (
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
              )}
            </AlertDescription>
          </div>

          <div className="flex items-center gap-2">
            {offlineQueue.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowQueue(!showQueue)}
              >
                {showQueue ? getTranslation('close') : getTranslation('view')} {getTranslation('alerts').toLowerCase()}
              </Button>
            )}
            {isOnline && unsyncedCount > 0 && (
              <Button
                size="sm"
                onClick={syncOfflineAlerts}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    {getTranslation('syncing')}...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {getTranslation('syncData')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {showQueue && offlineQueue.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{getTranslation('offlineMode')} {getTranslation('alerts')} {getTranslation('queued').toLowerCase()}</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearOfflineQueue}
                className="text-red-600 hover:text-red-700"
              >
                {getTranslation('clear')} {getTranslation('delete').toLowerCase()}
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {offlineQueue.map((alert) => (
                <Card key={alert.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-medium text-orange-700">
                          {alert.type.toUpperCase()}
                        </span>
                        {alert.synced ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {alert.attachments && alert.attachments.length > 0 && (
                          <span>
                            📎 {alert.attachments.length} file{alert.attachments.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Alert>
    </div>
  )
}

interface OfflineAlertBannerProps {
  className?: string
}

export function OfflineAlertBanner({ className }: OfflineAlertBannerProps) {
  const { isOnline, unsyncedCount } = useOfflineSupport()

  // Synchronous translation for static UI text
  const getTranslation = (key: string) => {
    const currentLang = localStorage.getItem('bridgex-lang') || 'en'
    return translations[currentLang]?.[key] || translations['en'][key] || key
  }

  if (isOnline || unsyncedCount === 0) {
    return null
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 text-center text-sm ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>
          {getTranslation('offlineMode')}. {unsyncedCount} {getTranslation('alert')}{unsyncedCount > 1 ? 's' : ''} {getTranslation('queued').toLowerCase()} {getTranslation('willSendWhenOnline').toLowerCase()}.
        </span>
      </div>
    </div>
  )
}