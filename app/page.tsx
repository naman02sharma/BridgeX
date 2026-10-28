"use client"

import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { SOSInterfaceV2 } from "@/components/sos-interface-v2"
import { Features } from "@/components/features"
import { TranslationDemo } from "@/components/translation-demo"
import { HowItWorks } from "@/components/how-it-works"
import { GlobalImpact } from "@/components/global-impact"
import { ActiveAlerts } from "@/components/active-alerts"
import { NearbyResponders } from "@/components/nearby-responders"
import { MapView } from "@/components/map-view"
import { NearbyEmergencyResources } from "@/components/nearby-emergency-resources"
import { Footer } from "@/components/footer"
import { useGlobalTranslation } from "@/components/translation-provider"

export default function Home() {
  const { t } = useGlobalTranslation()
  
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      
      {/* SOS Emergency Interface - Main Feature */}
      <section id="sos-interface" className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">{t("home.emergencySOSSystem")}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.emergencySOSDescription")}
            </p>
          </div>
          <SOSInterfaceV2 />
        </div>
      </section>

      {/* Emergency Response Dashboard */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">{t("home.emergencyResponseCenter")}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.emergencyResponseCenterDescription")}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <MapView />
            </div>
            <div className="space-y-8">
              <ActiveAlerts />
              <NearbyResponders />
            </div>
          </div>

          {/* Nearby Emergency Resources Section */}
          <div className="mt-8">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
                🏥 Nearby Emergency Resources
              </h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Real emergency locations near you — hospitals, police stations, fire departments and more, powered by live geolocation.
              </p>
            </div>
            <NearbyEmergencyResources radiusMeters={5000} maxResults={12} autoRefresh={false} />
          </div>
        </div>
      </section>

      <Features />
      <TranslationDemo />
      <HowItWorks />
      <GlobalImpact />
      <Footer />
    </main>
  )
}
