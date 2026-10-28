"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Users, Shield, Award, Globe, CheckCircle2, Upload, 
  FileText, Building2, Hospital, Heart, Briefcase, 
  MapPin, Mail, Phone, ArrowRight, Star, Clock
} from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { useToast } from "@/hooks/use-toast"

const benefits = [
  {
    icon: Globe,
    title: "Global Impact",
    description: "Join responders from 150+ countries helping people worldwide. Make a difference across borders."
  },
  {
    icon: Shield,
    title: "Verified Badge",
    description: "Get official verification badge and increased visibility in emergency situations."
  },
  {
    icon: Award,
    title: "Professional Tools",
    description: "Access to advanced responder dashboard, analytics, and coordination tools."
  },
  {
    icon: Users,
    title: "Network Access",
    description: "Connect with other verified responders, NGOs, hospitals, and emergency services."
  },
  {
    icon: Clock,
    title: "Real-Time Alerts",
    description: "Receive instant emergency notifications in your service area with priority routing."
  },
  {
    icon: Star,
    title: "Recognition",
    description: "Build your reputation with ratings, reviews, and response statistics."
  },
]

const verificationSteps = [
  {
    step: 1,
    title: "Submit Application",
    description: "Fill out detailed application form with organization/individual information",
    status: "active"
  },
  {
    step: 2,
    title: "Upload Documents",
    description: "Provide verification documents (licenses, certifications, references)",
    status: "pending"
  },
  {
    step: 3,
    title: "Background Check",
    description: "We verify credentials and conduct background screening (2-5 business days)",
    status: "pending"
  },
  {
    step: 4,
    title: "Platform Training",
    description: "Complete online training course and platform familiarization",
    status: "pending"
  },
  {
    step: 5,
    title: "Activation",
    description: "Profile approved and activated - start receiving emergency alerts",
    status: "pending"
  },
]

export default function JoinNetworkPage() {
  const { t } = useGlobalTranslation()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [formData, setFormData] = useState({
    organizationType: "",
    organizationName: "",
    individualName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    description: "",
    documents: null as File | null,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: t('error', 'Error'),
          description: t('fileTooLarge20MB', 'File size must be less than 20MB'),
          variant: 'destructive'
        })
        return
      }
      setFormData({ ...formData, documents: file })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!acceptedTerms) {
      toast({
        title: 'Error',
        description: 'Please accept the Terms & Conditions to continue',
        variant: 'destructive'
      })
      return
    }

    if (!formData.organizationType || !formData.email || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, acceptedTerms })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      toast({
        title: 'Application Submitted!',
        description: data.message || 'Your application has been received. We\'ll review it and contact you within 2-5 business days.',
      })
      
      // Reset form
      setFormData({
        organizationType: "",
        organizationName: "",
        individualName: "",
        email: "",
        phone: "",
        country: "",
        city: "",
        address: "",
        description: "",
        documents: null,
      })
      setAcceptedTerms(false)

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
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
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Users className="w-4 h-4" />
                <span className="text-sm font-semibold">{t('joinGlobalNetwork', 'Join Our Global Network')}</span>
              </div>
              <h1 className="text-5xl font-bold mb-6">{t('becomeVerifiedResponder', 'Become a Verified Responder')}</h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t('joinNetworkDesc', 'Join our trusted network of NGOs, hospitals, rescue teams, and volunteers. Help save lives across borders with verified emergency response.')}
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>{t('backgroundVerified', 'Background Verified')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>{t('professionalTools', 'Professional Tools')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>{t('globalImpact', 'Global Impact')}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container max-w-7xl mx-auto px-4 py-12 space-y-16">
          {/* Who Can Join */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-center">{t('whoCanJoin', 'Who Can Join?')}</h2>
              <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('whoCanJoinDesc', 'We welcome verified organizations and trained individuals committed to emergency response and saving lives.')}
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: Building2,
                    title: t('ngos', 'NGOs'),
                    description: t('ngosDesc', 'Registered non-profit organizations focused on humanitarian aid and emergency response.')
                  },
                  {
                    icon: Hospital,
                    title: t('hospitals', 'Hospitals & Clinics'),
                    description: t('hospitalsDesc', 'Medical facilities and healthcare providers offering emergency services.')
                  },
                  {
                    icon: Shield,
                    title: t('rescueTeams', 'Rescue Teams'),
                    description: t('rescueTeamsDesc', 'Professional rescue teams, firefighters, and emergency response units.')
                  },
                  {
                    icon: Heart,
                    title: t('volunteers', 'Trained Volunteers'),
                    description: t('volunteersDesc', 'Certified first responders, paramedics, and trained emergency volunteers.')
                  },
                ].map((type, index) => {
                  const Icon = type.icon
                  return (
                    <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-bold mb-2">{type.title}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </motion.div>
          </section>

          {/* Benefits */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-center">{t('benefitsOfJoining', 'Benefits of Joining')}</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{benefit.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </motion.div>
          </section>

          {/* Verification Process */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-center">{t('verificationProcess', 'Verification Process')}</h2>
              <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('verificationProcessDesc', 'Our thorough verification process ensures all responders meet our high standards for safety and professionalism.')}
              </p>
              
              <div className="max-w-4xl mx-auto">
                {verificationSteps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex gap-4 mb-8">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                          step.status === 'active' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.step}
                        </div>
                        {index < verificationSteps.length - 1 && (
                          <div className="w-0.5 h-16 bg-border mx-auto mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Application Form */}
          <section id="application-form">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">{t('submitApplication', 'Submit Your Application')}</CardTitle>
                  <CardDescription>
                    {t('applicationFormDesc', 'Complete the form below to begin the verification process. Fields marked with * are required.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Organization Type */}
                    <div className="space-y-2">
                      <Label htmlFor="organizationType">{t('organizationType', 'I am applying as')} <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.organizationType}
                        onValueChange={(value) => setFormData({ ...formData, organizationType: value })}
                        required
                      >
                        <SelectTrigger id="organizationType">
                          <SelectValue placeholder={t('selectType', 'Select type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ngo">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>{t('ngo', 'NGO / Non-Profit Organization')}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="hospital">
                            <div className="flex items-center gap-2">
                              <Hospital className="w-4 h-4" />
                              <span>{t('hospital', 'Hospital / Medical Facility')}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rescue">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span>{t('rescueTeam', 'Rescue Team / Emergency Services')}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="volunteer">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4" />
                              <span>{t('volunteer', 'Trained Volunteer / Individual')}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Organization/Individual Name */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {formData.organizationType && formData.organizationType !== 'volunteer' && (
                        <div className="space-y-2">
                          <Label htmlFor="organizationName">{t('organizationName', 'Organization Name')} <span className="text-red-500">*</span></Label>
                          <Input
                            id="organizationName"
                            placeholder={t('orgNamePlaceholder', 'e.g., Red Cross International')}
                            value={formData.organizationName}
                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                            required={formData.organizationType !== 'volunteer'}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="individualName">{t('contactPersonName', 'Contact Person / Your Name')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="individualName"
                          placeholder={t('namePlaceholder', 'John Doe')}
                          value={formData.individualName}
                          onChange={(e) => setFormData({ ...formData, individualName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('emailAddress', 'Email Address')} <span className="text-red-500">*</span></Label>
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
                        <Label htmlFor="phone">{t('phoneNumber', 'Phone Number')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="country">{t('country', 'Country')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="country"
                          placeholder={t('countryPlaceholder', 'United States')}
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">{t('city', 'City')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="city"
                          placeholder={t('cityPlaceholder', 'New York')}
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">{t('address', 'Address')}</Label>
                        <Input
                          id="address"
                          placeholder={t('addressPlaceholder', 'Street address')}
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">{t('describeExpertise', 'Describe Your Expertise & Services')} <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="description"
                        placeholder={t('descriptionPlaceholder', 'Tell us about your organization, experience, specializations, and how you can help in emergency situations...')}
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('descriptionHelp', 'Include your areas of expertise, certifications, and any relevant experience.')}
                      </p>
                    </div>

                    {/* Document Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="documents">{t('verificationDocuments', 'Verification Documents')} <span className="text-red-500">*</span></Label>
                      <Input
                        id="documents"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('documentsHelp', 'Upload: Medical licenses, NGO registration, certifications, background check, references (PDF, JPG, PNG, DOC - Max 20MB)')}
                      </p>
                      {formData.documents && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {formData.documents.name} ({(formData.documents.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                      )}
                    </div>

                    {/* Required Documents Info */}
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-500/20">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          {t('requiredDocuments', 'Required Documents')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{t('doc1', 'Official registration/license (NGO registration, medical license, etc.)')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{t('doc2', 'Professional certifications or training certificates')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{t('doc3', 'Government-issued ID or organizational credentials')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{t('doc4', 'Professional references (at least 2)')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{t('doc5', 'Background check clearance (if available)')}</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="terms" className="text-sm cursor-pointer">
                          {t('agreeToTerms', 'I agree to the')}{' '}
                          <a href="/legal" className="text-primary hover:underline">
                            {t('termsAndConditions', 'Terms & Conditions')}
                          </a>
                          {', '}
                          <a href="/safety" className="text-primary hover:underline">
                            {t('privacyPolicy', 'Privacy Policy')}
                          </a>
                          {', '}
                          {t('andResponderCode', 'and Responder Code of Conduct')}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('termsNote', 'You must accept our terms to complete the application.')}
                        </p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting || !acceptedTerms}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          {t('submitting', 'Submitting Application...')}
                        </>
                      ) : (
                        <>
                          {t('submitApplication', 'Submit Application')}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* What Happens Next */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardHeader>
                  <CardTitle className="text-center">{t('whatHappensNext', 'What Happens Next?')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    {[
                      {
                        icon: Mail,
                        title: t('confirmationEmail', 'Confirmation Email'),
                        description: t('confirmationEmailDesc', 'You\'ll receive an immediate confirmation email with your application ID.')
                      },
                      {
                        icon: FileText,
                        title: t('reviewProcess', 'Review Process'),
                        description: t('reviewProcessDesc', 'Our team reviews your application and documents within 2-5 business days.')
                      },
                      {
                        icon: CheckCircle2,
                        title: t('activation', 'Activation'),
                        description: t('activationDesc', 'Once approved, you\'ll receive credentials and training materials to get started.')
                      },
                    ].map((item, index) => {
                      const Icon = item.icon
                      return (
                        <div key={index}>
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="font-bold mb-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
