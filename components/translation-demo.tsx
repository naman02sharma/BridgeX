"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Languages, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supportedLanguages } from "@/lib/translation"
import { motion } from "framer-motion"
import { useGlobalTranslation } from "@/components/translation-provider"

export function TranslationDemo() {
  // const { t } = useGlobalTranslation() // Temporarily disabled
  const [inputText, setInputText] = useState("")
  const [targetLang, setTargetLang] = useState("es")
  const [translatedText, setTranslatedText] = useState("")
  const [emergencyType, setEmergencyType] = useState<string>("")
  const [severity, setSeverity] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [translationTime, setTranslationTime] = useState<number>(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    languages: 100,
    avgTime: 1.2,
    accuracy: 95
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
            languages: data.stats.languages || 100,
            avgTime: data.stats.avgTranslationTime || 0.8,
            accuracy: data.stats.translationAccuracy || 99
          })
        } else {
          // Use fallback values if API doesn't return expected format
          setStats({
            languages: 100,
            avgTime: 1.2,
            accuracy: 95
          })
        }
      } catch (error) {
        console.warn('Failed to fetch stats, using defaults:', error)
        // Use fallback values on any error
        setStats({
          languages: 100,
          avgTime: 1.2,
          accuracy: 95
        })
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
    // Auto-refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleTranslate = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    setTranslationTime(0) // Reset translation time
    const startTime = Date.now()

    try {
      // Translate using Lingo.dev API
      const translateRes = await fetch("/api/lingo/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          targetLang,
          sourceLang: "auto",
        }),
      })

      if (!translateRes.ok) {
        throw new Error(`Translation failed: ${translateRes.statusText}`)
      }

      const translateData = await translateRes.json()

      // Extract translated text from Lingo.dev response
      const translated = translateData.translatedText || translateData.text || inputText
      setTranslatedText(translated)

      const endTime = Date.now()
      const timeInSeconds = (endTime - startTime) / 1000
      setTranslationTime(timeInSeconds)

      // Classify emergency (don't block on errors)
      try {
        const classifyRes = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: inputText }),
        })

        if (classifyRes.ok) {
          const classifyData = await classifyRes.json()
          setEmergencyType(classifyData.type)
          setSeverity(classifyData.severity)
        }
      } catch (classifyError) {
        console.warn("Classification failed (non-critical):", classifyError)
      }
    } catch (error) {
      console.error("Translation error:", error)
      setTranslatedText("Translation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,87,87,0.1),transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-6 px-6 py-2.5 text-sm font-medium">
            <Languages className="w-4 h-4 mr-2" />
            AI-Powered Translation
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-5 text-foreground tracking-tight">Try Live Translation</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Experience instant multilingual communication
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Card className="p-7 glass-strong h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-lg text-foreground">Emergency Message</h3>
                <Badge variant="outline" className="font-medium">
                  Auto-detect
                </Badge>
              </div>
              <Textarea
                placeholder="Type your emergency message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[220px] mb-5 text-base resize-none"
              />
              <div className="flex items-center gap-3">
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleTranslate} disabled={loading || !inputText.trim()} size="lg" className="group">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      Translate
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Card className="p-7 glass-strong h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-lg text-foreground">Translation</h3>
                {targetLang && (
                  <Badge variant="secondary" className="font-medium">
                    {supportedLanguages.find((l) => l.code === targetLang)?.flag}{" "}
                    {supportedLanguages.find((l) => l.code === targetLang)?.name}
                  </Badge>
                )}
              </div>

              {translatedText ? (
                <>
                  <div className="min-h-[220px] p-5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl mb-5">
                    <p className="text-foreground leading-relaxed text-base">{translatedText}</p>
                  </div>

                  {emergencyType && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">AI Classification</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize font-medium">
                          Type: {emergencyType.replace("_", " ")}
                        </Badge>
                        <Badge variant={getSeverityColor(severity) as any} className="capitalize font-medium">
                          {severity}
                        </Badge>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="min-h-[220px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Languages className="w-16 h-16 mx-auto mb-4 opacity-30" strokeWidth={1.5} />
                    <p className="font-medium">Translation will appear here</p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-5"
        >
          {[
            { value: `${stats.languages}+`, label: 'Languages Supported' },
            { value: translationTime > 0 ? `${translationTime.toFixed(2)}s` : `<${stats.avgTime}s`, label: 'Translation Time' },
            { value: `${stats.accuracy}%`, label: 'Accuracy Rate' },
          ].map((stat, i) => (
            <Card key={i} className="p-6 text-center glass hover-lift">
              <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
