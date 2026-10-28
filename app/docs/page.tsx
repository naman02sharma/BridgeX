"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Search, Book, Smartphone, Users, Globe, Shield, 
  Radio, MapPin, MessageSquare, AlertTriangle, CheckCircle2,
  ArrowRight, FileText, HelpCircle, Zap, Star
} from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useGlobalTranslation } from "@/components/translation-provider"
import Link from "next/link"

const sidebarSections = [
  { id: "overview", label: "Overview", icon: Book },
  { id: "how-it-works", label: "How It Works", icon: Zap },
  { id: "features", label: "Features", icon: Star },
  { id: "multilingual", label: "Multilingual Support", icon: Globe },
  { id: "user-guide", label: "User Onboarding", icon: Smartphone },
  { id: "responder-guide", label: "Responder Onboarding", icon: Users },
  { id: "emergency-usage", label: "Emergency Usage", icon: AlertTriangle },
  { id: "faq", label: "FAQ", icon: HelpCircle },
]

const features = [
  {
    icon: AlertTriangle,
    title: "SOS Alert System",
    description: "Send emergency alerts instantly to verified responders within 2km radius. Real-time broadcasting with location sharing."
  },
  {
    icon: MapPin,
    title: "Real-Time Emergency Map",
    description: "Interactive map showing nearby hospitals, NGOs, verified responders, and active emergency situations."
  },
  {
    icon: MessageSquare,
    title: "Multilingual Chat",
    description: "Chat with responders in any language. AI-powered instant translation in 100+ languages via Lingo.dev."
  },
  {
    icon: Users,
    title: "Verified Responder Network",
    description: "Background-checked network of NGOs, hospitals, rescue teams, and trained volunteers worldwide."
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "End-to-end encryption, secure data handling, and compliance with international emergency response standards."
  },
  {
    icon: Radio,
    title: "Real-Time Coordination",
    description: "WebSocket-powered instant updates, push notifications, and live status tracking for all parties."
  },
]

const faqs = [
  {
    question: "What is BridgeX and how does it work?",
    answer: "BridgeX is an AI-powered multilingual emergency response platform that connects people in crisis with verified responders worldwide. When you send an SOS alert, it's instantly broadcast to nearby hospitals, NGOs, and trained volunteers with your location and emergency details."
  },
  {
    question: "Is BridgeX free to use?",
    answer: "Yes, BridgeX is completely free for individuals in emergency situations. Our mission is to save lives without barriers. Organizations and responders may have premium features available."
  },
  {
    question: "How do I send an emergency alert?",
    answer: "Click the 'Send SOS Alert' button on the home page, allow location access, describe your emergency (AI will auto-translate), and submit. Verified responders within your area will be notified immediately."
  },
  {
    question: "What languages are supported?",
    answer: "BridgeX supports 100+ languages through AI-powered translation via Lingo.dev. Speak or type in your native language - we'll translate everything in real-time for responders."
  },
  {
    question: "How are responders verified?",
    answer: "All responders undergo background checks, document verification, and trust scoring. We verify NGOs, hospitals, rescue teams, and volunteers through official credentials and references."
  },
  {
    question: "Can I use BridgeX offline?",
    answer: "BridgeX requires internet connection for real-time alerts and translation. However, we're developing offline emergency protocols for areas with limited connectivity."
  },
  {
    question: "How fast is the response time?",
    answer: "Alerts reach responders in under 2 seconds via WebSocket technology. Actual physical response time depends on responder location and emergency type, averaging 8-15 minutes in urban areas."
  },
  {
    question: "Is my location data safe?",
    answer: "Yes. Location data is encrypted, only shared with verified responders during active emergencies, and automatically deleted after 30 days. We follow strict GDPR and privacy regulations."
  },
  {
    question: "Can I become a responder?",
    answer: "Yes! Visit our 'Join Network' page to apply. You'll need to complete verification, background checks, and training. We welcome NGOs, hospitals, rescue teams, and trained volunteers."
  },
  {
    question: "What should I include in an emergency alert?",
    answer: "Include your exact location (auto-filled), type of emergency, number of people affected, specific help needed, and any medical conditions. AI will help classify and prioritize your alert."
  },
]

export default function DocumentationPage() {
  const { t } = useGlobalTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSection, setActiveSection] = useState("overview")
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    title: string
    content: string
    section: string
  }>>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery)
    }, 200)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const performSearch = (query: string) => {
    const lowerQuery = query.toLowerCase()
    const results: Array<{ id: string; title: string; content: string; section: string }> = []

    // Search through all sections
    const searchableContent = [
      // Overview
      { id: 'overview', section: 'Overview', title: 'BridgeX Overview', content: 'BridgeX Global SOS System AI-powered emergency response platform multilingual connects people crisis verified responders worldwide 100+ languages alert speed 24/7 available mission instant assistance regardless language location' },
      
      // How It Works
      { id: 'how-it-works', section: 'How It Works', title: 'How It Works', content: 'Send emergency alert SOS button location access AI classifies translates Instant broadcasting WebSocket technology Responders notified hospitals NGOs volunteers push notifications Real-time communication multilingual chat Help arrives track responder status ETA coordinate meetup points' },
      
      // Features
      { id: 'features-sos', section: 'Features', title: 'SOS Alert System', content: 'Send emergency alerts instantly verified responders 2km radius Real-time broadcasting location sharing' },
      { id: 'features-map', section: 'Features', title: 'Real-Time Emergency Map', content: 'Interactive map nearby hospitals NGOs verified responders active emergency situations' },
      { id: 'features-chat', section: 'Features', title: 'Multilingual Chat', content: 'Chat responders any language AI-powered instant translation 100+ languages Lingo.dev' },
      { id: 'features-network', section: 'Features', title: 'Verified Responder Network', content: 'Background-checked network NGOs hospitals rescue teams trained volunteers worldwide' },
      { id: 'features-security', section: 'Features', title: 'Privacy & Security', content: 'End-to-end encryption secure data handling compliance international emergency response standards' },
      { id: 'features-coordination', section: 'Features', title: 'Real-Time Coordination', content: 'WebSocket-powered instant updates push notifications live status tracking' },
      
      // Multilingual
      { id: 'multilingual', section: 'Multilingual Support', title: 'AI Translation', content: 'Powered by Lingo.dev AI translation 100+ languages instant accurate real-time translation Context-aware emergency terminology medical terms Voice support speak transcribe Offline cache common phrases limited connectivity' },
      
      // User Guide
      { id: 'user-guide', section: 'User Onboarding', title: 'Getting Started', content: 'Create account sign up email social login emergency contact medical details Enable location services accurate alerts responders Push notifications updates critical alerts Choose language 100+ options Test system familiarize interface voice input map features' },
      
      // Responder Guide
      { id: 'responder-guide', section: 'Responder Onboarding', title: 'Become Verified Responder', content: 'Submit application organization individual credentials NGO Hospital Rescue Team Volunteer Upload verification documents medical license background check training certificates professional references Background check 2-5 business days Platform training videos quiz responder dashboard alert protocols Activate profile availability service radius specializations' },
      
      // Emergency Usage
      { id: 'emergency-usage', section: 'Emergency Usage', title: 'Emergency Usage Guide', content: 'Report emergency type medical accident natural disaster violence location landmark people affected severity critical urgent moderate injuries medical conditions help needed ambulance police rescue supplies Stay calm exact location follow instructions keep phone charged update status false alerts injured sensitive data panic' },
      
      // FAQ
      ...faqs.map((faq, i) => ({
        id: `faq-${i}`,
        section: 'FAQ',
        title: faq.question,
        content: `${faq.question} ${faq.answer}`
      }))
    ]

    searchableContent.forEach(item => {
      if (item.title.toLowerCase().includes(lowerQuery) || item.content.toLowerCase().includes(lowerQuery)) {
        // Calculate relevance score
        const titleMatch = item.title.toLowerCase().includes(lowerQuery) ? 10 : 0
        const contentMatch = item.content.toLowerCase().split(lowerQuery).length - 1
        
        results.push({
          ...item,
          content: item.content.slice(0, 150) + '...'
        })
      }
    })

    setSearchResults(results)
    setIsSearching(false)
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">{part}</mark>
        : part
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-7xl mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Book className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-bold">{t('docsTitle', 'Documentation')}</h1>
              </div>
              <p className="text-xl text-muted-foreground mb-8">
                {t('docsSubtitle', 'Everything you need to know about using BridgeX - from sending your first emergency alert to becoming a verified responder.')}
              </p>
              
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('docs.searchDocs', 'Search documentation...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
                
                {/* Search Results Dropdown */}
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">{t('docs.searching', 'Searching...')}</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs text-muted-foreground font-semibold">
                          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                        </div>
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setActiveSection(result.id.split('-')[0])
                              document.getElementById(result.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              setSearchQuery("")
                            }}
                            className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold mb-1">
                                  {highlightText(result.title, searchQuery)}
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {result.section}
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {highlightText(result.content, searchQuery)}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-1">{t('docs.noResultsFound', 'No results found')}</h3>
                        <p className="text-sm text-muted-foreground">
                          Try different keywords or browse the sections below
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content with Sidebar */}
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('contents', 'Contents')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {sidebarSections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section.id)
                          document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-left ${
                          activeSection === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="space-y-16">
              {/* Overview Section */}
              <section id="overview" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    <Book className="w-7 h-7 text-primary" />
                    {t('docsOverview', 'Overview')}
                  </h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg text-muted-foreground mb-6">
                      {t('docsOverviewText', 'BridgeX (Global SOS System) is a revolutionary AI-powered emergency response platform that breaks down language barriers and connects people in crisis with verified responders worldwide.')}
                    </p>
                    
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>{t('ourMission', 'Our Mission')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {t('missionText', 'To provide instant, multilingual emergency assistance to anyone, anywhere, regardless of language or location. We believe that help should never be delayed by communication barriers.')}
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-primary mb-2">100+</div>
                          <div className="text-sm text-muted-foreground">{t('languages', 'Languages')}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-primary mb-2">&lt;2s</div>
                          <div className="text-sm text-muted-foreground">{t('alertSpeed', 'Alert Speed')}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                          <div className="text-sm text-muted-foreground">{t('available', 'Available')}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* How It Works Section */}
              <section id="how-it-works" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Zap className="w-7 h-7 text-primary" />
                    {t('howItWorks', 'How It Works')}
                  </h2>
                  
                  <div className="space-y-6">
                    {[
                      {
                        step: 1,
                        title: t('step1Title', 'Send Emergency Alert'),
                        description: t('step1Desc', 'Click the SOS button, allow location access, and describe your emergency in any language. Our AI instantly classifies and translates your message.'),
                        icon: AlertTriangle,
                      },
                      {
                        step: 2,
                        title: t('step2Title', 'Instant Broadcasting'),
                        description: t('step2Desc', 'Your alert is broadcast within 2 seconds to all verified responders within a 2km radius using WebSocket technology.'),
                        icon: Radio,
                      },
                      {
                        step: 3,
                        title: t('step3Title', 'Responders Notified'),
                        description: t('step3Desc', 'Nearby hospitals, NGOs, and volunteers receive push notifications with your exact location and emergency details in their language.'),
                        icon: Users,
                      },
                      {
                        step: 4,
                        title: t('step4Title', 'Real-Time Communication'),
                        description: t('step4Desc', 'Chat with responders through our multilingual interface. Every message is instantly translated so everyone understands.'),
                        icon: MessageSquare,
                      },
                      {
                        step: 5,
                        title: t('step5Title', 'Help Arrives'),
                        description: t('step5Desc', 'Track responder status in real-time. Receive updates, ETA, and coordinate meetup points through the live map.'),
                        icon: MapPin,
                      },
                    ].map((step, index) => {
                      const Icon = step.icon
                      return (
                        <Card key={index} className="relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-primary/50" />
                          <CardContent className="pt-6 pl-8">
                            <div className="flex gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-semibold text-primary">
                                    {t('step', 'Step')} {step.step}
                                  </span>
                                  <h3 className="text-xl font-bold">{step.title}</h3>
                                </div>
                                <p className="text-muted-foreground">{step.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </motion.div>
              </section>

              {/* Features Section */}
              <section id="features" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Star className="w-7 h-7 text-primary" />
                    {t('features', 'Features')}
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, index) => {
                      const Icon = feature.icon
                      return (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle>{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">{feature.description}</p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </motion.div>
              </section>

              {/* Multilingual Support Section */}
              <section id="multilingual" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Globe className="w-7 h-7 text-primary" />
                    {t('multilingualSupport', 'Multilingual Support')}
                  </h2>
                  
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {t('poweredByLingo', 'Powered by Lingo.dev')}
                        <span className="text-sm font-normal text-muted-foreground">- AI Translation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        {t('lingoDescription', 'BridgeX uses advanced AI translation technology from Lingo.dev to provide instant, accurate translation in over 100 languages. Every message, alert, and chat is automatically translated in real-time.')}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-1" />
                          <div>
                            <h4 className="font-semibold mb-1">{t('instantTranslation', 'Instant Translation')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('instantTransDesc', 'Messages translated in milliseconds with AI accuracy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-1" />
                          <div>
                            <h4 className="font-semibold mb-1">{t('contextAware', 'Context-Aware')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('contextDesc', 'Understands emergency terminology and medical terms')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-1" />
                          <div>
                            <h4 className="font-semibold mb-1">{t('voiceSupport', 'Voice Support')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('voiceDesc', 'Speak in your language - AI transcribes and translates')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-1" />
                          <div>
                            <h4 className="font-semibold mb-1">{t('offlineCache', 'Offline Cache')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('offlineDesc', 'Common phrases cached for limited connectivity')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </section>

              {/* User Onboarding Section */}
              <section id="user-guide" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Smartphone className="w-7 h-7 text-primary" />
                    {t('userOnboarding', 'User Onboarding Guide')}
                  </h2>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('gettingStarted', 'Getting Started')}</CardTitle>
                      <CardDescription>
                        {t('gettingStartedDesc', 'Follow these steps to set up your BridgeX account and be prepared for emergencies.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        {
                          title: t('createAccount', 'Create Your Account'),
                          content: t('createAccountDesc', 'Sign up with your email or use social login. Add emergency contact information and medical details (optional but recommended).')
                        },
                        {
                          title: t('enableLocation', 'Enable Location Services'),
                          content: t('enableLocationDesc', 'Allow BridgeX to access your location for accurate emergency alerts. This is crucial for responders to find you quickly.')
                        },
                        {
                          title: t('setupNotifications', 'Setup Push Notifications'),
                          content: t('setupNotificationsDesc', 'Enable notifications to receive updates from responders and critical alerts in your area.')
                        },
                        {
                          title: t('chooseLanguage', 'Choose Your Language'),
                          content: t('chooseLanguageDesc', 'Select your preferred language from 100+ options. You can change this anytime from settings.')
                        },
                        {
                          title: t('testSystem', 'Test the System'),
                          content: t('testSystemDesc', 'Familiarize yourself with the interface in non-emergency mode. Practice using voice input and map features.')
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2">{item.title}</h4>
                            <p className="text-muted-foreground text-sm">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </section>

              {/* Responder Onboarding Section */}
              <section id="responder-guide" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Users className="w-7 h-7 text-primary" />
                    {t('responderOnboarding', 'Responder Onboarding Guide')}
                  </h2>
                  
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle>{t('becomeResponder', 'Become a Verified Responder')}</CardTitle>
                      <CardDescription>
                        {t('becomeResponderDesc', 'Join our global network of emergency responders. Complete these steps to get verified and start saving lives.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        {
                          title: t('submitApplication', 'Submit Application'),
                          content: t('submitApplicationDesc', 'Fill out the responder application form with your organization details or individual credentials. Specify your type: NGO, Hospital, Rescue Team, or Volunteer.'),
                          status: 'required'
                        },
                        {
                          title: t('uploadDocuments', 'Upload Verification Documents'),
                          content: t('uploadDocumentsDesc', 'Provide official documents: Medical license, NGO registration, background check, training certificates, and professional references.'),
                          status: 'required'
                        },
                        {
                          title: t('backgroundCheck', 'Background Check & Verification'),
                          content: t('backgroundCheckDesc', 'Our team verifies your credentials (2-5 business days). We check licenses, references, and conduct background screenings.'),
                          status: 'automated'
                        },
                        {
                          title: t('platformTraining', 'Complete Platform Training'),
                          content: t('platformTrainingDesc', 'Watch training videos, complete quiz, and familiarize yourself with responder dashboard, alert protocols, and communication tools.'),
                          status: 'required'
                        },
                        {
                          title: t('activateProfile', 'Activate Your Profile'),
                          content: t('activateProfileDesc', 'Once verified, activate your responder profile. Set your availability, service radius, and specializations.'),
                          status: 'final'
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                item.status === 'required' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                item.status === 'automated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">{item.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t">
                        <Link href="/join">
                          <Button size="lg" className="w-full">
                            {t('startApplication', 'Start Your Application')}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </section>

              {/* Emergency Usage Guide */}
              <section id="emergency-usage" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-7 h-7 text-primary" />
                    {t('emergencyUsageGuide', 'Emergency Usage Guide')}
                  </h2>
                  
                  <div className="space-y-6">
                    <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                      <CardHeader>
                        <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          {t('howToReport', 'How to Report an Emergency')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">{t('includeInSOS', 'What to Include in Your SOS Message:')}</h4>
                          <ul className="space-y-2">
                            {[
                              t('sosItem1', 'Type of emergency (medical, accident, natural disaster, violence, etc.)'),
                              t('sosItem2', 'Exact location or nearest landmark if possible'),
                              t('sosItem3', 'Number of people affected'),
                              t('sosItem4', 'Severity level (critical, urgent, moderate)'),
                              t('sosItem5', 'Any injuries or medical conditions'),
                              t('sosItem6', 'Immediate help needed (ambulance, police, rescue, supplies)'),
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-green-700 dark:text-green-400">
                            {t('safetyDos', "DO's")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {[
                              t('do1', 'Stay calm and assess the situation'),
                              t('do2', 'Share your exact location'),
                              t('do3', 'Follow responder instructions'),
                              t('do4', 'Keep your phone charged'),
                              t('do5', 'Update status if situation changes'),
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-red-700 dark:text-red-400">
                            {t('safetyDonts', "DON'Ts")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {[
                              t('dont1', 'Don\'t send false or prank alerts'),
                              t('dont2', 'Don\'t move if you\'re injured'),
                              t('dont3', 'Don\'t share sensitive personal data publicly'),
                              t('dont4', 'Don\'t ignore responder messages'),
                              t('dont5', 'Don\'t panic or make hasty decisions'),
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* FAQ Section */}
              <section id="faq" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <HelpCircle className="w-7 h-7 text-primary" />
                    {t('faq', 'Frequently Asked Questions')}
                  </h2>
                  
                  <Accordion type="single" collapsible className="space-y-4">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-6">
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="font-semibold">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <Card className="mt-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">{t('stillHaveQuestions', 'Still have questions?')}</h3>
                        <p className="text-muted-foreground mb-4">
                          {t('contactSupportText', 'Our support team is available 24/7 to help you with any queries.')}
                        </p>
                        <Link href="/contact">
                          <Button>
                            {t('contactSupport', 'Contact Support')}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
