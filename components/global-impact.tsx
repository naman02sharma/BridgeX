"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Globe, Users, Languages, MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useGlobalTranslation } from "@/components/translation-provider"

export function GlobalImpact() {
  const { t } = useGlobalTranslation()
  const [stats, setStats] = useState({
    verifiedResponders: 50,
    countriesCovered: 12,
    languagesSupported: 100,
    availability: "24/7"
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.success && data.stats) {
          setStats({
            verifiedResponders: data.stats.verifiedResponders || 15234,
            countriesCovered: data.stats.countriesCovered || 187,
            languagesSupported: data.stats.languages || 100,
            availability: "24/7"
          })
        } else {
          // Use fallback values if API doesn't return expected format
          setStats({
            verifiedResponders: 50,
            countriesCovered: 12,
            languagesSupported: 100,
            availability: "24/7"
          })
        }
      } catch (error) {
        console.warn('Failed to fetch stats, using defaults:', error)
        // Use fallback values on any error
        setStats({
          verifiedResponders: 50,
          countriesCovered: 12,
          languagesSupported: 100,
          availability: "24/7"
        })
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Globe className="w-[700px] h-[700px]" strokeWidth={0.3} />
        </motion.div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 text-foreground tracking-tight">
            {t("globalImpact.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            {t("globalImpact.description")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-5 mb-12">
          {[
            { icon: Users, value: stats.verifiedResponders >= 1000 ? `${(stats.verifiedResponders / 1000).toFixed(1)}k+` : `${stats.verifiedResponders}+`, label: t("globalImpact.verifiedResponders"), color: "text-blue-500" },
            { icon: MapPin, value: `${stats.countriesCovered}+`, label: t("globalImpact.countriesCovered"), color: "text-green-500" },
            { icon: Languages, value: `${stats.languagesSupported}+`, label: t("globalImpact.languagesSupported"), color: "text-purple-500" },
            { icon: Globe, value: stats.availability, label: t("globalImpact.alwaysAvailable"), color: "text-orange-500" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 text-center glass-strong hover-lift group">
                <stat.icon
                  className={`w-10 h-10 ${stat.color} mx-auto mb-3 group-hover:scale-110 transition-transform`}
                  strokeWidth={2}
                />
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="p-10 sm:p-14 glass-strong relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

            <div className="relative max-w-3xl mx-auto text-center">
              <h3 className="text-3xl sm:text-4xl font-bold mb-5 text-foreground tracking-tight">
                Join the global emergency response network
              </h3>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Whether you're an NGO, hospital, volunteer, or someone who wants to help in crisis situations, become
                part of the world's most advanced emergency coordination platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all group" asChild>
                  <Link href="/responders/register">
                    Register as Responder
                    <Users className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-10 py-7 glass hover-lift bg-transparent" asChild>
                  <Link href="/docs">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
