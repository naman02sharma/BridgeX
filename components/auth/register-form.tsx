"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Lock, User, Building2, Phone, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { signUp } from "@/lib/auth"
import { useGlobalTranslation } from "@/components/translation-provider"

export function RegisterForm() {
  const { t } = useGlobalTranslation()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    role: "user",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }

    if (!formData.phone || formData.phone.trim().length < 8) {
      toast.error("Please enter a valid mobile number for emergency contact")
      setLoading(false)
      return
    }

    try {
      await signUp(formData.email, formData.password, {
        name: formData.name,
        role: formData.role as any,
        phone: formData.phone,
        organization: formData.organization,
      })

      if (typeof window !== "undefined") {
        localStorage.setItem("bridgex_user_phone", formData.phone)
        localStorage.setItem("bridgex_user_name", formData.name)
      }

      setShowConfirmation(true)
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="p-6 border-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              {t('auth.fullName', 'Full Name')}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder={t('auth.placeholder.name', 'John Doe')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              {t('auth.email', 'Email')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t('auth.placeholder.email', 'responder@example.com')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization" className="text-foreground">
              {t('auth.organization', 'Organization')}
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="organization"
                type="text"
                placeholder={t('auth.placeholder.organization', 'Red Cross, City Hospital, etc.')}
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">
              Account Type / Role
            </Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Citizen / Emergency SOS User (Victim)</SelectItem>
                <SelectItem value="volunteer">Volunteer Responder</SelectItem>
                <SelectItem value="hospital">Hospital / Medical Center</SelectItem>
                <SelectItem value="fire">Fire Department</SelectItem>
                <SelectItem value="police">Police / Security</SelectItem>
                <SelectItem value="ngo">NGO / Relief Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground flex items-center justify-between">
              <span>Mobile Number <span className="text-red-500">*</span></span>
              <span className="text-xs text-muted-foreground font-normal">(Used automatically for your SOS alerts)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10 font-semibold"
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Responders will automatically receive this number when you broadcast an SOS.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            By registering, you agree to our Terms of Service and Privacy Policy. All responders must be verified before
            accessing the platform.
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              "Register as Responder"
            )}
          </Button>
        </form>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Check Your Email
            </DialogTitle>
            <div className="text-center space-y-3 text-sm text-muted-foreground">
              <div>
                We've sent a confirmation link to <strong className="text-foreground">{formData.email}</strong>
              </div>
              <div>
                Click the link in the email to verify your account and complete your registration.
              </div>
              <div className="text-xs">
                Didn't receive the email? Check your spam folder or contact support.
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Continue to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
