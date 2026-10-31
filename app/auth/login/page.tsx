"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Globe, Loader2 } from "lucide-react"
import Link from "next/link"
import { useGlobalTranslation } from "@/components/translation-provider"

export default function LoginPage() {
  const { t } = useGlobalTranslation()
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <div className="relative">
                <Globe className="w-12 h-12 text-primary" strokeWidth={1.5} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">{t('brand.name', 'BridgeX')}</h1>
            </Link>
            <h2 className="text-2xl font-bold mb-2 text-foreground">{t('auth.welcomeBack')}</h2>
            <p className="text-muted-foreground">{t('auth.signInToDashboard')}</p>
          </div>

          <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.dontHaveAccount')}{" "}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              {t('auth.registerAsResponder')}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
