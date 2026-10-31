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

    const isCitizen = formData.role === "user" || formData.role === "victim"
    if (!isCitizen && (!formData.organization || formData.organization.trim().length === 0)) {
      toast.error("Please enter your organization or agency name")
      setLoading(false)
      return
    }

    try {
      const data = await signUp(formData.email, formData.password, {
        name: formData.name,
        role: formData.role as any,
        phone: formData.phone,
        organization: isCitizen ? undefined : formData.organization,
      })

      if (typeof window !== "undefined") {
        localStorage.setItem("bridgex_user_phone", formData.phone)
        localStorage.setItem("bridgex_user_name", formData.name)
        localStorage.setItem("bridgex_user_role", formData.role)
      }

      toast.success(
        isCitizen
          ? "Account created successfully! Welcome to BridgeX."
          : "Responder account registered successfully!"
      )

      // Direct redirection - NO email verification popup
      if (data?.session) {
        router.push(isCitizen ? "/" : "/dashboard")
      } else {
        router.push(`/auth/login?email=${encodeURIComponent(formData.email)}`)
      }
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

          {/* Organization: only required and shown for responders (Hospitals, Police, Fire, NGOs, Volunteers) */}
          {formData.role !== "user" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label htmlFor="organization" className="text-foreground">
                {t('auth.organization', 'Organization / Agency Name')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="organization"
                  type="text"
                  placeholder={t('auth.placeholder.organization', 'Red Cross, City Hospital, Fire Brigade, etc.')}
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="pl-10"
                  required={formData.role !== "user"}
                />
              </div>
            </div>
          )}

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
            {formData.role === "user"
              ? "By registering, you agree to our Terms of Service and Privacy Policy. Your account enables real-time SOS broadcasts and instant help tracking."
              : "By registering, you agree to our Terms of Service and Privacy Policy. All responders are verified before receiving emergency dispatch assignments."}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : formData.role === "user" ? (
              "Create Citizen / SOS Account"
            ) : (
              "Register as Verified Responder"
            )}
          </Button>
        </form>
      </Card>
    </>
  )
}
