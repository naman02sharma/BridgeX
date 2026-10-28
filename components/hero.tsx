"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Globe, Shield, MessageCircle, ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useGlobalTranslation } from "@/components/translation-provider"

export function Hero() {
  const { t } = useGlobalTranslation()
  const [stats, setStats] = useState({
    languages: 100,
    responseTime: 5,
    availability: "24/7",
    coverage: "Global"
  })

  useEffect(() => {
    // Fetch real-time stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.success && data.stats) {
          setStats({
            languages: data.stats.languages || 100,
            responseTime: data.stats.responseTime || 2,
            availability: "24/7",
            coverage: "Global"
          })
        } else {
          // Use fallback values if API doesn't return expected format
          setStats({
            languages: 100,
            responseTime: 5,
            availability: "24/7",
            coverage: "Global"
          })
        }
      } catch (error) {
        console.warn('Failed to fetch stats, using defaults:', error)
        // Use fallback values on any error
        setStats({
          languages: 100,
          responseTime: 5,
          availability: "24/7",
          coverage: "Global"
        })
      }
    }

    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-background pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-12"
          >
            <div className="relative">
              <Globe className="w-14 h-14 text-primary" strokeWidth={1.5} />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full"
              />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">BridgeX</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance mb-6 leading-[1.1] tracking-tight">
              {t("home.emergencyResponseWithoutBorders")}
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 text-pretty leading-relaxed font-normal"
          >
            {t("home.aiPoweredPlatformDescription")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <Button
              size="lg"
              className="text-lg px-8 py-7 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group relative overflow-hidden"
              onClick={() => {
                document.getElementById('sos-interface')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            >
              <span className="relative z-10 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                {t("sendSOSAlert", "Send SOS Alert")}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-7 glass hover-lift group bg-transparent" asChild>
              <Link href="/responders/register">
                <MessageCircle className="w-5 h-5 mr-2" />
                {t("registerAsResponder", "Register as Responder")}
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            {[
              { value: stats.responseTime > 0 ? `<${stats.responseTime}s` : "<2s", label: t("responseTime", "Response Time"), icon: Sparkles },
              { value: stats.availability, label: t("available", "Available"), icon: Sparkles },
              { value: stats.coverage, label: t("coverage", "Coverage"), icon: Sparkles },
            ].map((stat, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} className="glass-strong rounded-2xl p-6 hover-lift">
                <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
