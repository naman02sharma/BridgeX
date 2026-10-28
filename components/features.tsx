"use client"

import { Card } from "@/components/ui/card"
import { Languages, MapPin, Shield, Zap, Users, Globe2 } from "lucide-react"
import { motion } from "framer-motion"
import { useGlobalTranslation } from "@/components/translation-provider"

export function Features() {
  const { t } = useGlobalTranslation()

  const features = [
    {
      icon: Languages,
      title: t("features.aiTranslation"),
      description: t("features.aiTranslationDescription"),
      gradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: MapPin,
      title: t("features.smartLocation"),
      description: t("features.smartLocationDescription"),
      gradient: "from-green-500/10 to-emerald-500/10",
    },
    {
      icon: Zap,
      title: t("features.realTimeAlerts"),
      description: t("features.realTimeAlertsDescription"),
      gradient: "from-yellow-500/10 to-orange-500/10",
    },
    {
      icon: Shield,
      title: t("features.verifiedNetwork"),
      description: t("features.verifiedNetworkDescription"),
      gradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      icon: Users,
      title: t("features.responderDashboard"),
      description: t("features.responderDashboardDescription"),
      gradient: "from-red-500/10 to-rose-500/10",
    },
    {
      icon: Globe2,
      title: t("features.globalCoverage"),
      description: t("features.globalCoverageDescription"),
      gradient: "from-indigo-500/10 to-blue-500/10",
    },
  ]
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 text-foreground tracking-tight">
            {t("features.title")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            {t("features.description")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="p-7 hover:shadow-xl transition-all hover-lift group glass h-full">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-7 h-7 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-card-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
