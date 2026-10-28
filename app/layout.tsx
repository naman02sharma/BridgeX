import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "../styles/rtl.css"

import { ThemeProvider } from "@/components/theme-provider"
import { SupabaseProvider } from "@/components/supabase-provider"
import { OfflineAlertBanner } from "@/components/offline-indicator"
import { I18nProvider } from "@/i18n/provider"
import { LanguageDetectionPopup } from "@/components/language-detection-popup"
import { Toaster } from "sonner"

import { Inter, JetBrains_Mono, Geist_Mono as BridgeX_Font_Geist_Mono } from 'next/font/google'

// Initialize fonts
const _geistMono = BridgeX_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "BridgeX - Emergency Response Platform",
  description:
    "AI-driven multilingual emergency translation and coordination platform connecting crisis responders worldwide",
  icons: {
    icon: [
      {
        url: "/bridgex-icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/bridgex-logo.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/bridgex-logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <OfflineAlertBanner />
        <SupabaseProvider>
          <I18nProvider>
            <ThemeProvider>
              <LanguageDetectionPopup />
              {children}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </I18nProvider>
        </SupabaseProvider>
        <Analytics />
      </body>
    </html>
  )
}
