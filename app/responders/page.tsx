"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Languages, Star, Phone, Clock, Shield } from "lucide-react"
import { motion } from "framer-motion"
import { ResponderVerification } from "@/components/responder-verification"
import { ResponderInbox } from "@/components/responder-inbox"
import { useGlobalTranslation } from "@/components/translation-provider"
import Link from "next/link"

export default function RespondersPage() {
  const { t } = useGlobalTranslation()
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 text-foreground tracking-tight">
              {t('responder.verifiedResponders', 'Verified')} <span className="gradient-text">{t('responder.verified', 'Responders')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('responder.description', 'Connect with trusted emergency responders in your area. All responders are verified and background-checked.')}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {[
              { value: "15,000+", label: t('responder.stats.verifiedResponders', 'Verified Responders') },
              { value: "180+", label: t('responder.stats.countries', 'Countries') },
              { value: "24/7", label: t('responder.stats.availability', 'Availability') },
              { value: "<2s", label: t('responder.stats.avgResponse', 'Avg Response') },
            ].map((stat, i) => (
              <Card key={i} className="p-6 text-center glass-strong">
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </Card>
            ))}
          </motion.div>

          {/* Live inbox for registered responders: incoming SOS alerts, accept / decline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12 max-w-3xl mx-auto"
          >
            <ResponderInbox />
          </motion.div>

          {/* Responder Verification Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <ResponderVerification />
          </motion.div>

          {/* Legacy Responders List - Keep for reference */}
          <div className="hidden">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: "Red Cross International",
                  type: "NGO",
                  location: "Global Network",
                  languages: ["English", "Spanish", "French", "Arabic", "Mandarin"],
                  rating: 4.9,
                  responseTime: "< 2 min",
                  verified: true,
                },
                // ... other responders
              ].map((responder, i) => (
                <Card key={i} className="p-6 glass-strong hover-lift h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-red-600 to-orange-600 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{responder.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {responder.type}
                        </Badge>
                      </div>
                    </div>
                    {responder.verified && (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">{t('responder.verified', 'Verified')}</Badge>
                    )}
                  </div>
                  {/* ... rest of the card content */}
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <Card className="p-10 glass-strong text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">{t('becomeVerifiedResponder', 'Become a Verified Responder')}</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                {t('joinResponderNetwork', 'Join our network of trusted emergency responders. Complete verification and background checks to help save lives globally.')}
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">{t('backgroundVerified', 'Background Verified')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{t('trustScored', 'Trust Scored')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">{t('24/7Support', '24/7 Support')}</span>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                asChild
              >
                <Link href="/responders/register">
                  {t('startVerificationProcess', 'Start Verification Process')}
                </Link>
              </Button>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
