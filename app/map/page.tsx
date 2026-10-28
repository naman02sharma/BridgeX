"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MapView } from "@/components/map-view"
import { NearbyEmergencyResources } from "@/components/nearby-emergency-resources"
import { useGlobalTranslation } from "@/components/translation-provider"

export default function MapPage() {
  const { t } = useGlobalTranslation()
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-foreground">{t('emergencyMap', 'Emergency Map')}</h1>
            <p className="text-muted-foreground">{t('findNearbyResponders', 'Find nearby hospitals, NGOs, and verified responders')}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MapView />
            </div>
            <div>
              <NearbyEmergencyResources radiusMeters={20000} maxResults={15} autoRefresh={true} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
