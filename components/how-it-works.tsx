"use client"

import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Radio, Zap, Users, MessageCircle } from "lucide-react"
import { useGlobalTranslation } from "@/components/translation-provider"

export function HowItWorks() {
  const { t } = useGlobalTranslation()
  
  const steps = [
    {
      number: "01",
      icon: Radio,
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Desc"),
    },
    {
      number: "02",
      icon: Zap,
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Desc"),
    },
    {
      number: "03",
      icon: Users,
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Desc"),
    },
    {
      number: "04",
      icon: MessageCircle,
      title: t("howItWorks.step4Title"),
      description: t("howItWorks.step4Desc"),
    },
  ]

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-delayed"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="mb-6 px-6 py-2.5 font-medium">
            {t("howItWorks.badge")}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 text-foreground tracking-tight">{t("howItWorks.title")}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            {t("howItWorks.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-[2px] bg-gradient-to-r from-border via-primary/30 to-border z-0" />
              )}

              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center mb-6 mx-auto relative z-10"
                >
                  <step.icon className="w-10 h-10 text-primary" strokeWidth={2} />
                </motion.div>

                <div className="text-7xl font-bold text-primary/5 absolute top-0 right-0 -z-10">{step.number}</div>

                <h3 className="text-xl font-semibold mb-3 text-foreground text-center">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-center">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
