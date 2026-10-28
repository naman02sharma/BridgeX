"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Shield, AlertTriangle, Eye, Lock, FileText, Download,
  CheckCircle2, XCircle, AlertOctagon, Info, Users, 
  Smartphone, MapPin, Database, Scale
} from "lucide-react"
import { motion } from "framer-motion"
import { useGlobalTranslation } from "@/components/translation-provider"
import Link from "next/link"

const safetyCategories = [
  {
    icon: AlertTriangle,
    title: "General Emergency Safety",
    items: [
      "Stay calm and assess your surroundings before taking action",
      "Ensure your personal safety first before helping others",
      "Call local emergency services (911, 112, etc.) for life-threatening situations",
      "Use BridgeX for coordination, translation, and locating nearby responders",
      "Keep your phone charged and carry a portable battery if possible",
      "Share your location only with verified responders through our platform",
      "Follow official evacuation routes and instructions from authorities",
      "Keep emergency contacts updated in your BridgeX profile",
    ]
  },
  {
    icon: AlertOctagon,
    title: "Natural Disaster Protocols",
    items: [
      "Earthquakes: Drop, Cover, and Hold. Stay away from windows and heavy objects",
      "Floods: Move to higher ground immediately. Never walk or drive through floodwater",
      "Hurricanes/Typhoons: Secure shelter, stock supplies, follow evacuation orders",
      "Wildfires: Evacuate early if advised. Cover nose/mouth with wet cloth if trapped",
      "Tornadoes: Seek shelter in basement or interior room on lowest floor",
      "Use BridgeX to alert nearby responders of your situation and location",
    ]
  },
  {
    icon: Users,
    title: "Medical Emergency Guidelines",
    items: [
      "For severe injuries or chest pain, call emergency services immediately",
      "Provide clear details: type of injury, symptoms, number of people affected",
      "Don't move injured persons unless they're in immediate danger",
      "Apply pressure to stop bleeding, keep victim warm and calm",
      "Share medical conditions and allergies with responders via BridgeX",
      "Stay with the victim until professional help arrives",
      "Use our platform to locate nearest hospitals and medical responders",
    ]
  },
  {
    icon: Shield,
    title: "Personal Safety & Security",
    items: [
      "In dangerous situations, prioritize your escape to a safe location",
      "Don't confront attackers or aggressors - your life is more valuable",
      "Use BridgeX discreetly if you cannot speak or call openly",
      "Share real-time location with trusted responders through our platform",
      "Trust your instincts - if something feels wrong, seek help immediately",
      "Document evidence if safe to do so (photos, videos, screenshots)",
      "Report incidents to local authorities and through BridgeX",
    ]
  },
]

const dosAndDonts = {
  dos: [
    "Enable location services for accurate emergency response",
    "Keep your profile information updated (emergency contacts, medical info)",
    "Test the app features in non-emergency situations to familiarize yourself",
    "Grant notification permissions to receive critical alerts",
    "Verify responder credentials before sharing sensitive information",
    "Use voice input if you cannot type during emergencies",
    "Update your status when the situation changes",
    "Follow responder instructions carefully",
    "Keep a backup of important medical documents in your profile",
    "Charge your device regularly and carry power banks",
  ],
  donts: [
    "Never send false or prank emergency alerts (legal consequences apply)",
    "Don't share your personal passwords or financial information",
    "Don't ignore safety warnings or responder messages",
    "Never use the platform while driving or operating machinery",
    "Don't put yourself in danger to document an emergency",
    "Never share unverified information or spread panic",
    "Don't disable location services during active emergencies",
    "Never attempt rescues beyond your capability or training",
    "Don't use public WiFi for sensitive emergency communications",
    "Never delete emergency records until resolved",
  ]
}

const privacyPoints = [
  {
    icon: Lock,
    title: "Data Encryption",
    description: "All communications are encrypted end-to-end using industry-standard TLS 1.3 protocol. Your emergency data is protected in transit and at rest."
  },
  {
    icon: Eye,
    title: "Location Privacy",
    description: "Your location is only shared with verified responders during active emergencies. Location data is automatically deleted 30 days after incident resolution."
  },
  {
    icon: Database,
    title: "Data Retention",
    description: "Emergency records are retained for 90 days for legal and safety purposes, then permanently deleted. You can request data deletion at any time after resolution."
  },
  {
    icon: Shield,
    title: "Verified Responders Only",
    description: "Only background-checked, verified responders can access your emergency information. All access is logged and monitored for security."
  },
]

const legalDisclaimers = [
  {
    title: "Service Availability",
    content: "While BridgeX strives for 24/7 availability, we cannot guarantee uninterrupted service. Always call local emergency services (911, 112, etc.) for life-threatening emergencies. BridgeX is a supplementary coordination tool, not a replacement for official emergency services."
  },
  {
    title: "Responder Verification",
    content: "We conduct thorough background checks and verification of all responders. However, BridgeX is not liable for actions taken by responders. We recommend users verify credentials and use common sense when interacting with responders."
  },
  {
    title: "Translation Accuracy",
    content: "Our AI translation service aims for high accuracy but may not be perfect in all contexts. Critical medical or legal information should be verified with professional translators when possible."
  },
  {
    title: "Liability Limitations",
    content: "BridgeX provides emergency coordination services but is not liable for outcomes of emergency situations, responder actions, or delays. Users assume all risks when using the platform. See full Terms of Service for details."
  },
  {
    title: "Age Requirements",
    content: "Users must be 13 years or older. Minors under 18 should have parental consent. Parents/guardians are responsible for monitoring minor usage."
  },
  {
    title: "Prohibited Uses",
    content: "False alerts, harassment, misuse of responder information, or any illegal activity is strictly prohibited and may result in account termination and legal action."
  },
]

const responderGuidelines = [
  {
    title: "Verify Before Responding",
    description: "Assess the alert details, location, and urgency before dispatching. Confirm you have the resources and capability to help."
  },
  {
    title: "Maintain Professionalism",
    description: "Communicate clearly, calmly, and professionally. Remember that victims may be traumatized or in shock."
  },
  {
    title: "Protect Privacy",
    description: "Never share victim information publicly or with unauthorized parties. Respect confidentiality at all times."
  },
  {
    title: "Document Properly",
    description: "Record response times, actions taken, and outcomes in the system. This helps improve service quality."
  },
  {
    title: "Coordinate with Authorities",
    description: "Always coordinate with local emergency services. BridgeX is supplementary to official response systems."
  },
  {
    title: "Update Status Regularly",
    description: "Keep victims informed of your ETA, status, and any delays. Communication reduces anxiety during emergencies."
  },
]

export default function SafetyGuidelinesPage() {
  const { t } = useGlobalTranslation()

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-orange-500/5 via-transparent to-transparent">
          <div className="container max-w-7xl mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Shield className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h1 className="text-4xl font-bold">{t('safetyGuidelines', 'Safety Guidelines')}</h1>
              </div>
              <p className="text-xl text-muted-foreground mb-6">
                {t('safetySubtitle', 'Essential safety information, privacy policies, and best practices for using BridgeX. Your safety and security are our top priorities.')}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link href="#emergency-protocols">
                  <Button variant="outline" size="lg">
                    <AlertTriangle className="mr-2 w-4 h-4" />
                    {t('emergencyProtocols', 'Emergency Protocols')}
                  </Button>
                </Link>
                <Link href="#privacy-policy">
                  <Button variant="outline" size="lg">
                    <Lock className="mr-2 w-4 h-4" />
                    {t('privacyPolicy', 'Privacy Policy')}
                  </Button>
                </Link>
                <Button variant="outline" size="lg" asChild>
                  <a href="#download-pdf">
                    <Download className="mr-2 w-4 h-4" />
                    {t('downloadPDF', 'Download PDF')}
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container max-w-7xl mx-auto px-4 py-12 space-y-16">
          {/* Critical Warning Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
                      {t('criticalReminder', 'Critical Reminder')}
                    </h3>
                    <p className="text-red-600 dark:text-red-300">
                      {t('criticalReminderText', 'For life-threatening emergencies, always call your local emergency services first (911, 112, 999, etc.). BridgeX is a supplementary coordination and translation platform designed to enhance emergency response, not replace official services.')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Emergency Safety Protocols */}
          <section id="emergency-protocols">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-primary" />
                {t('emergencySafetyProtocols', 'Emergency Safety Protocols')}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {safetyCategories.map((category, index) => {
                  const Icon = category.icon
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {category.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </motion.div>
          </section>

          {/* Do's and Don'ts */}
          <section id="dos-donts">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Info className="w-7 h-7 text-primary" />
                {t('dosAndDonts', "Do's and Don'ts")}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* DO's */}
                <Card className="border-green-500/50">
                  <CardHeader>
                    <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {t('thingsToDo', 'Things You Should Do')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {dosAndDonts.dos.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* DON'Ts */}
                <Card className="border-red-500/50">
                  <CardHeader>
                    <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      {t('thingsNotToDo', 'Things You Should NOT Do')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {dosAndDonts.donts.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Privacy & Data Handling */}
          <section id="privacy-policy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Lock className="w-7 h-7 text-primary" />
                {t('privacyDataHandling', 'Privacy & Data Handling')}
              </h2>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{t('yourPrivacyMatters', 'Your Privacy Matters')}</CardTitle>
                  <CardDescription>
                    {t('privacyDescription', 'We are committed to protecting your personal information and emergency data. Here\'s how we handle your information:')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {privacyPoints.map((point, index) => {
                      const Icon = point.icon
                      return (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">{point.title}</h4>
                            <p className="text-sm text-muted-foreground">{point.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-500/50">
                <CardHeader>
                  <CardTitle className="text-blue-700 dark:text-blue-400">
                    {t('gdprCompliance', 'GDPR & Compliance')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                    {t('gdprText', 'BridgeX is fully compliant with GDPR, CCPA, and international data protection regulations. You have the right to:')}
                  </p>
                  <ul className="space-y-2">
                    {[
                      t('right1', 'Access your personal data at any time'),
                      t('right2', 'Request data deletion (after emergency resolution)'),
                      t('right3', 'Export your data in machine-readable format'),
                      t('right4', 'Opt-out of non-essential data collection'),
                      t('right5', 'File complaints with data protection authorities'),
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Legal Disclaimers */}
          <section id="legal-disclaimers">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Scale className="w-7 h-7 text-primary" />
                {t('legalDisclaimers', 'Legal Disclaimers & Policies')}
              </h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                {legalDisclaimers.map((item, index) => (
                  <AccordionItem key={index} value={`legal-${index}`} className="border rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-semibold">{item.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <Card className="mt-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('fullTerms', 'For complete Terms of Service, Privacy Policy, and legal agreements, please visit our')}{' '}
                    <Link href="/legal" className="underline font-semibold">
                      {t('legalPage', 'Legal Documents page')}
                    </Link>
                    {'. '}
                    {t('lastUpdated', 'Last updated: November 15, 2025')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Responder Best Practices */}
          <section id="responder-safety">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Users className="w-7 h-7 text-primary" />
                {t('responderBestPractices', 'Safety Best Practices for Responders')}
              </h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('responderGuidelines', 'Responder Guidelines')}</CardTitle>
                  <CardDescription>
                    {t('responderGuidelinesDesc', 'Essential safety and professional standards for verified responders on the BridgeX platform.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {responderGuidelines.map((guideline, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{guideline.title}</h4>
                          <p className="text-sm text-muted-foreground">{guideline.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Download Section */}
          <section id="download-pdf">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <h3 className="text-2xl font-bold">{t('downloadGuidelines', 'Download Complete Guidelines')}</h3>
                      </div>
                      <p className="text-muted-foreground">
                        {t('downloadGuidelinesDesc', 'Get the complete safety guidelines, privacy policy, and usage instructions as a PDF. Keep it handy for offline reference during emergencies.')}
                      </p>
                    </div>
                    <Button size="lg" className="flex-shrink-0">
                      <Download className="mr-2 w-5 h-5" />
                      {t('downloadPDF', 'Download PDF')}
                      <span className="ml-2 text-xs opacity-70">(2.4 MB)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Contact Support CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-bold mb-3">{t('questionsOrConcerns', 'Questions or Concerns?')}</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  {t('supportTeamAvailable', 'Our support team is available 24/7 to answer your questions about safety, privacy, or platform usage.')}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/contact">
                    <Button size="lg">
                      {t('contactSupport', 'Contact Support')}
                    </Button>
                  </Link>
                  <Link href="/docs">
                    <Button size="lg" variant="outline">
                      {t('viewDocumentation', 'View Documentation')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  )
}
