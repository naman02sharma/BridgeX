"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ChatInterface } from "@/components/chat-interface"
import { ActiveAlerts } from "@/components/active-alerts"
import { useGlobalTranslation } from "@/components/translation-provider"

export default function ChatPage() {
  const { t } = useGlobalTranslation()
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-foreground">{t('emergencyChat', 'Emergency Chat')}</h1>
            <p className="text-muted-foreground">{t('realtimeMultilingualComm', 'Real-time multilingual communication with responders')}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChatInterface />
            </div>
            <div>
              <ActiveAlerts />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
