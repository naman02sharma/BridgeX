"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Shield, Globe, MapPin, MessageSquare, BarChart3, Clock,
  CheckCircle2, ArrowRight, Eye, EyeOff, AlertTriangle,
  Users, Radio, FileText, Award
} from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const portalFeatures = [
  {
    icon: MapPin,
    title: "Emergency Dashboard",
    description: "Real-time emergency map showing active alerts in your service area with priority levels and urgency indicators."
  },
  {
    icon: Radio,
    title: "Live Alert System",
    description: "Instant push notifications for emergencies within your radius. Accept or decline based on availability and capability."
  },
  {
    icon: MessageSquare,
    title: "Multilingual Chat",
    description: "AI-powered translation for seamless communication with victims in 100+ languages. No barriers, just help."
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track your response times, success rates, and impact metrics. Build your professional reputation with verified stats."
  },
  {
    icon: Users,
    title: "Network Coordination",
    description: "Collaborate with other responders, hospitals, and NGOs. Share resources and coordinate complex emergency responses."
  },
  {
    icon: FileText,
    title: "Resource Management",
    description: "Manage your availability, service radius, specializations, and emergency resources all in one place."
  },
]

const stats = [
  {
    value: "10,000+",
    label: "Active Responders",
    icon: Users
  },
  {
    value: "< 2s",
    label: "Alert Speed",
    icon: Radio
  },
  {
    value: "150+",
    label: "Countries",
    icon: Globe
  },
  {
    value: "24/7",
    label: "Availability",
    icon: Clock
  },
]

export default function ResponderPortalPage() {
  const { t } = useGlobalTranslation()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      })
      return
    }

    setIsLoggingIn(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      toast({
        title: 'Welcome Back!',
        description: 'Successfully logged in to your responder dashboard.',
      })
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-7xl mx-auto px-4 py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-semibold">{t('verifiedRespondersOnly', 'Verified Responders Only')}</span>
                </div>
                <h1 className="text-5xl font-bold mb-6">{t('responderPortal', 'Responder Portal')}</h1>
                <p className="text-xl text-muted-foreground mb-8">
                  {t('responderPortalDesc', 'Access your emergency response dashboard. Manage alerts, coordinate with teams, and make a real difference in crisis situations worldwide.')}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <Card key={index}>
                        <CardContent className="pt-6 text-center">
                          <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                          <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t('notResponderYet', 'Not a verified responder yet?')}{' '}
                          <Link href="/join" className="text-primary font-semibold hover:underline">
                            {t('applyNow', 'Apply now')}
                          </Link>
                          {' '}
                          {t('toJoinNetwork', 'to join our global emergency response network.')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right: Login Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">{t('signInToPortal', 'Sign In to Portal')}</CardTitle>
                    <CardDescription>
                      {t('accessDashboard', 'Access your emergency response dashboard and manage active alerts.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('email', 'Email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t('emailPlaceholder', 'responder@example.com')}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">{t('password', 'Password')}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="remember"
                            checked={formData.rememberMe}
                            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                            className="w-4 h-4 rounded border-input"
                          />
                          <Label htmlFor="remember" className="text-sm cursor-pointer">
                            {t('rememberMe', 'Remember me')}
                          </Label>
                        </div>
                        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                          {t('forgotPassword', 'Forgot password?')}
                        </Link>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            {t('signingIn', 'Signing in...')}
                          </>
                        ) : (
                          <>
                            {t('signIn', 'Sign In')}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t">
                      <p className="text-center text-sm text-muted-foreground">
                        {t('newToBridgeX', 'New to BridgeX?')}{' '}
                        <Link href="/join" className="text-primary font-semibold hover:underline">
                          {t('applyAsResponder', 'Apply as a Responder')}
                        </Link>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                          {t('secureLogin', 'Secure Login')}
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          {t('secureLoginDesc', 'Your credentials are encrypted and protected. We use industry-standard security protocols.')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 border-b">
          <div className="container max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">{t('portalFeatures', 'Portal Features')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('portalFeaturesDesc', 'Access powerful tools designed specifically for emergency responders. Everything you need to save lives efficiently.')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portalFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How It Works for Responders */}
        <section className="py-16 border-b bg-gradient-to-b from-transparent to-primary/5">
          <div className="container max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">{t('howItWorks', 'How It Works')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('responderWorkflow', 'Your streamlined workflow from alert to resolution.')}
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-8">
              {[
                {
                  step: 1,
                  title: t('receiveAlert', 'Receive Emergency Alert'),
                  description: t('receiveAlertDesc', 'Get instant push notification when emergency occurs in your service area. See location, urgency level, and victim details.'),
                  icon: Radio
                },
                {
                  step: 2,
                  title: t('reviewDetails', 'Review & Accept'),
                  description: t('reviewDetailsDesc', 'Quickly assess if you can help based on location, type of emergency, and your current availability. Accept or decline.'),
                  icon: CheckCircle2
                },
                {
                  step: 3,
                  title: t('communicateVictim', 'Communicate with Victim'),
                  description: t('communicateVictimDesc', 'Use AI-translated chat to get more details, provide instructions, and coordinate meetup. Language barriers eliminated.'),
                  icon: MessageSquare
                },
                {
                  step: 4,
                  title: t('respondOnSite', 'Respond On-Site'),
                  description: t('respondOnSiteDesc', 'Navigate using real-time map, coordinate with other responders if needed, and provide emergency assistance on location.'),
                  icon: MapPin
                },
                {
                  step: 5,
                  title: t('documentResolve', 'Document & Resolve'),
                  description: t('documentResolveDesc', 'Update status, document outcome, and mark case resolved. Your stats and reputation automatically updated.'),
                  icon: Award
                },
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                              {step.step}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <Icon className="w-6 h-6 text-primary mt-1" />
                              <div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <CardContent className="pt-12 pb-12 text-center">
                  <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h2 className="text-3xl font-bold mb-4">{t('readyToMakeDifference', 'Ready to Make a Difference?')}</h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {t('joinThousandsOfResponders', 'Join thousands of verified responders saving lives worldwide. Complete verification and start your journey today.')}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/join">
                      <Button size="lg" className="text-lg px-8">
                        {t('applyAsResponder', 'Apply as a Responder')}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link href="/docs">
                      <Button size="lg" variant="outline" className="text-lg px-8">
                        {t('learnMore', 'Learn More')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
