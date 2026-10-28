"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Globe, Heart, Shield, Users, Zap, Award } from "lucide-react"
import { motion } from "framer-motion"
import { useGlobalTranslation } from "@/components/translation-provider"

export default function AboutPage() {
  const { t } = useGlobalTranslation()
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-foreground tracking-tight">
              {t("about.title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("about.subtitle")}
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <Card className="p-10 sm:p-14 glass-strong relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <div className="relative">
                <h2 className="text-3xl font-bold mb-6 text-foreground">{t("about.mission.title")}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  {t("about.mission.description1")}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t("about.mission.description2")}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">{t("about.values.title")}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Heart,
                  title: t("about.values.humanity.title"),
                  description: t("about.values.humanity.description"),
                  color: "text-red-500",
                },
                {
                  icon: Zap,
                  title: t("about.values.speed.title"),
                  description: t("about.values.speed.description"),
                  color: "text-yellow-500",
                },
                {
                  icon: Globe,
                  title: t("about.values.access.title"),
                  description: t("about.values.access.description"),
                  color: "text-blue-500",
                },
              ].map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-6 glass-strong hover-lift h-full">
                    <value.icon className={`w-12 h-12 ${value.color} mb-4`} strokeWidth={1.5} />
                    <h3 className="text-xl font-bold mb-3 text-foreground">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How We Work */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">{t("about.howWeWork.title")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Shield,
                  title: t("about.howWeWork.network.title"),
                  description: t("about.howWeWork.network.description"),
                },
                {
                  icon: Zap,
                  title: t("about.howWeWork.translation.title"),
                  description: t("about.howWeWork.translation.description"),
                },
                {
                  icon: Users,
                  title: t("about.howWeWork.coordination.title"),
                  description: t("about.howWeWork.coordination.description"),
                },
                {
                  icon: Award,
                  title: t("about.howWeWork.availability.title"),
                  description: t("about.howWeWork.availability.description"),
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-6 glass-strong hover-lift">
                    <item.icon className="w-10 h-10 text-primary mb-4" strokeWidth={1.5} />
                    <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Impact Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="p-10 sm:p-14 glass-strong text-center">
              <h2 className="text-3xl font-bold mb-8 text-foreground">{t("about.impact.title")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "15,000+", label: t("about.impact.responders") },
                  { value: "180+", label: t("about.impact.countries") },
                  { value: "100+", label: t("about.impact.languages") },
                  { value: "<2s", label: t("about.impact.responseTime") },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
