"use client"

import type React from "react"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MapPin, Phone, Clock, Send, Upload, MessageSquare, Bug, HelpCircle, AlertCircle, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useGlobalTranslation } from "@/components/translation-provider"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const { t } = useGlobalTranslation()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
    attachment: null as File | null,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('error', 'Error'),
          description: t('fileTooLarge', 'File size must be less than 10MB'),
          variant: 'destructive'
        })
        return
      }
      setFormData({ ...formData, attachment: file })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name || !formData.email || !formData.category || !formData.subject || !formData.message) {
      toast({
        title: t('error', 'Error'),
        description: t('contact.fillAllFields', 'Please fill in all required fields'),
        variant: 'destructive'
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: t('error', 'Error'),
        description: t('contact.invalidEmail', 'Please enter a valid email address'),
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setIsSuccess(true)
      
      toast({
        title: 'Success!',
        description: t('contact.submitSuccess', 'Your support request has been submitted. We\'ll respond within 24 hours.'),
      })
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          category: "",
          subject: "",
          message: "",
          attachment: null,
        })
        setIsSuccess(false)
      }, 3000)

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 text-foreground tracking-tight">
              {t('contact.title', 'Contact Support')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('contact.subtitle', 'Need help or have questions? We are here to help you.')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t('contactInfo', 'Contact Information')}</CardTitle>
                  <CardDescription>{t('multipleWaysToReach', 'Multiple ways to reach us')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t('contact.email', 'Email')}</div>
                      <div className="text-sm font-medium text-foreground">{t('contact.email.support', 'support@bridgex.org')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t('contact.emergencyHotline', 'Emergency Hotline')}</div>
                      <div className="text-sm font-medium text-foreground">
                        <div>{t('contact.phone.us', 'US: +1 (800) SOS-HELP')}</div>
                        <div>{t('contact.phone.uk', 'UK: +44 20 SOS-HELP')}</div>
                        <div>{t('contact.phone.eu', 'EU: +33 1 SOS-HELP')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t('contact.headquarters', 'Headquarters')}</div>
                      <div className="text-sm font-medium text-foreground">{t('contact.headquarters.location', 'San Francisco, CA')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t('contact.availability', 'Availability')}</div>
                      <div className="text-sm font-medium text-foreground">{t('contact.availability247', '24/7 Emergency Support')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    {t('responseTime', 'Response Time')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('emergencyIssues', 'Emergency Issues')}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">&lt; 1 hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('technicalSupport', 'Technical Support')}</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">&lt; 4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('generalInquiries', 'General Inquiries')}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">&lt; 24 hours</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-600/10 to-orange-600/10 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-700 dark:text-red-400">{t('inEmergency', 'In an Emergency?')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('useSOSAlert', 'If you\'re in an emergency situation, use our SOS alert system for immediate assistance.')}
                  </p>
                  <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                    <AlertCircle className="mr-2 w-4 h-4" />
                    {t('sendSOSAlert', 'Send SOS Alert')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    {t('liveChatSoon', 'Live Chat (Coming Soon)')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('liveChatDesc', 'We\'re working on adding real-time chat support. Stay tuned!')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              {isSuccess ? (
                <Card className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{t('requestSubmitted', 'Request Submitted!')}</h3>
                    <p className="text-muted-foreground mb-6">
                      {t('requestSubmittedDesc', 'Your support request has been received. Our team will respond within the timeframe specified for your issue category.')}
                    </p>
                    <div className="flex flex-col gap-3 max-w-sm mx-auto">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{t('ticketCreated', 'Ticket created and assigned')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{t('emailConfirmation', 'Confirmation email sent')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{t('teamNotified', 'Support team notified')}</span>
                      </div>
                    </div>
                  </motion.div>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('contact.form.submit', 'Submit a Support Request')}</CardTitle>
                    <CardDescription>
                      {t('contact.subtitle', 'Need help or have questions? We are here to help you.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('contact.form.name', 'Name')} <span className="text-red-500">*</span></Label>
                          <Input
                            id="name"
                            placeholder={t('contact.form.namePlaceholder', 'Your full name')}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('contact.form.email', 'Email')} <span className="text-red-500">*</span></Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t('contact.form.emailPlaceholder', 'your.email@example.com')}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">{t('contact.form.category', 'Issue Category')} <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                          required
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder={t('selectCategory', 'Select a category')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emergency">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span>{t('emergencySupport', 'Emergency Support')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="technical">
                              <div className="flex items-center gap-2">
                                <Bug className="w-4 h-4 text-orange-500" />
                                <span>{t('technicalIssue', 'Technical Issue')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="account">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-blue-500" />
                                <span>{t('accountHelp', 'Account Help')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="bug">
                              <div className="flex items-center gap-2">
                                <Bug className="w-4 h-4 text-purple-500" />
                                <span>{t('bugReport', 'Bug Report')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="feature">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-green-500" />
                                <span>{t('featureRequest', 'Feature Request')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="general">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-gray-500" />
                                <span>{t('generalInquiry', 'General Inquiry')}</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t('categoryHelp', 'This helps us route your request to the right team for faster resolution.')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">{t('subject', 'Subject')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="subject"
                          placeholder={t('subjectPlaceholder', 'Brief description of your issue')}
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{t('contact.form.message', 'Message')} <span className="text-red-500">*</span></Label>
                        <Textarea
                          id="message"
                          placeholder={t('contact.form.messagePlaceholder', 'Describe your assistance request...')}
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('messageHelp', 'The more details you provide, the faster we can help you.')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attachment">{t('attachment', 'Attachment')} <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="attachment"
                            type="file"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          {t('attachmentHelp', 'Max file size: 10MB. Supported formats: JPG, PNG, PDF, DOC, TXT')}
                        </p>
                        {formData.attachment && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {formData.attachment.name} ({(formData.attachment.size / 1024).toFixed(2)} KB)
                          </div>
                        )}
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            {t('contact.form.sending', 'Sending...')}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {t('contact.form.submit', 'Send Message')}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          {/* Bug Reporting Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  {t('foundBug', 'Found a Bug?')}
                </CardTitle>
                <CardDescription>
                  {t('bugReportingInstructions', 'Help us improve BridgeX by reporting bugs you encounter.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">{t('whatToInclude', 'What to Include in Bug Reports:')}</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        t('bugItem1', 'Steps to reproduce the issue'),
                        t('bugItem2', 'Expected vs actual behavior'),
                        t('bugItem3', 'Device and browser information'),
                        t('bugItem4', 'Screenshots or screen recordings'),
                        t('bugItem5', 'Error messages (if any)'),
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">{t('priorityLevels', 'Priority Levels:')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span><strong>{t('critical', 'Critical')}:</strong> {t('criticalDesc', 'App crashes, data loss')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span><strong>{t('high', 'High')}:</strong> {t('highDesc', 'Major features broken')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span><strong>{t('medium', 'Medium')}:</strong> {t('mediumDesc', 'Minor functionality issues')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span><strong>{t('low', 'Low')}:</strong> {t('lowDesc', 'Cosmetic issues')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
