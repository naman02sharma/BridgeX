"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Phone, Loader2 } from "lucide-react"
import { signIn } from "@/lib/auth"
import { toast } from "sonner"
import { useGlobalTranslation } from "@/components/translation-provider"

export function LoginForm() {
  const { t } = useGlobalTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await signIn(email, password)
      if (typeof window !== "undefined") {
        const userPhone = phone || data?.user?.user_metadata?.phone || (data?.user as any)?.phone
        if (userPhone) {
          localStorage.setItem("bridgex_user_phone", userPhone)
        }
      }
      toast.success(t('successfullySignedIn', 'Successfully signed in!'))
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error(error.message || t('failedToSignIn', 'Failed to sign in'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 border-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            {t('email', 'Email')}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder', 'responder@example.com')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone-login" className="text-foreground">
            Mobile Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="phone-login"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            {t('password', 'Password')}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-muted-foreground">{t('rememberMe', 'Remember me')}</span>
          </label>
          <a href="#" className="text-primary hover:underline">
            {t('forgotPassword', 'Forgot password?')}
          </a>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('signingIn', 'Signing in...')}
            </>
          ) : (
            t('signIn', 'Sign in')
          )}
        </Button>
      </form>
    </Card>
  )
}
