"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { SOSInterfaceV2 } from "@/components/sos-interface-v2"
import { Features } from "@/components/features"
import { TranslationDemo } from "@/components/translation-demo"
import { HowItWorks } from "@/components/how-it-works"
import { GlobalImpact } from "@/components/global-impact"
import { ActiveAlerts } from "@/components/active-alerts"
import { MapView } from "@/components/map-view"
import { NearbyEmergencyResources } from "@/components/nearby-emergency-resources"
import { Footer } from "@/components/footer"
import { useGlobalTranslation } from "@/components/translation-provider"
import { useSupabase } from "@/components/supabase-provider"
import { Siren, ArrowRight } from "lucide-react"

export default function Home() {
  const { t } = useGlobalTranslation()
  const { user } = useSupabase()

  const isResponder = Boolean(
    user &&
    user.role !== "user" &&
    user.role !== "victim" &&
    (
      user.role === "responder" ||
      user.role === "hospital" ||
      user.role === "fire" ||
      user.role === "police" ||
      user.role === "volunteer" ||
      user.role === "ngo" ||
      Boolean(user.organization) ||
      Boolean((user as any)?.specialization) ||
      Boolean((user as any)?.user_metadata?.organization) ||
      Boolean((user as any)?.user_metadata?.responderRole) ||
      Boolean((user as any)?.user_metadata?.specificRole)
    )
  )

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Top Banner for Responders - One-click access to Operations Dashboard */}
      {isResponder && (
        <div className="pt-20 bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 shadow-lg flex items-center justify-center gap-2">
          <Siren className="w-4 h-4 animate-spin text-yellow-300" />
          <span>
            Logged in as verified responder ({user?.organization || user?.name || user?.email}).
          </span>
          <Link
            href="/dashboard"
            className="underline font-bold text-yellow-200 hover:text-white flex items-center gap-1 ml-1"
          >
            Open Operations Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <Hero />

      {/* SOS Emergency Interface - Main Feature for Citizens / Victims */}
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

      {/* Emergency Tactical Map & Citizen Safety Hub */}
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
            </div>
          </div>

          {/* Nearby Emergency Resources Section: Real Nearby Hospitals, Fire Stations, Police */}
          <div className="mt-8">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
                🏥 Nearby Emergency Centers & Resources
              </h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Real emergency locations near you — verified hospitals, police stations, fire departments and clinics, powered by live geolocation.
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
