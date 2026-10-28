"use client"

/**
 * I18n Provider Compatibility Layer
 * 
 * Temporary compatibility wrapper while migrating to Lingo.dev Compiler.
 * Lingo.dev automatically translates text at build time, so we return keys as-is.
 * The actual translations happen through Lingo.dev's AST transformation.
 */

import { ReactNode, createContext, useContext } from 'react'

interface I18nContextType {
  t: (key: string, fallback?: string) => string
  currentLang: string
  locale: string
  changeLanguage: (lang: string) => void
  changeLocale: (lang: string) => void
  translateText: (text: string, targetLang?: string) => Promise<string>
  detectLanguage: (text: string) => Promise<string>
  isRTL: boolean
  isLoading: boolean
  availableLocales: Array<{code: string, name: string, nativeName: string, flag: string, rtl?: boolean}>
}

const I18nContext = createContext<I18nContextType | null>(null)

/**
 * Compatibility provider - returns translation keys as-is
 * Actual translation handled by Lingo.dev Compiler
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const value: I18nContextType = {
    t: (key: string, fallback?: string) => fallback || key,
    currentLang: 'en',
    locale: 'en',
    changeLanguage: () => {},
    changeLocale: () => {},
    translateText: async (text: string) => text,
    detectLanguage: async () => 'en',
    isRTL: false,
    isLoading: false,
    availableLocales: [
      { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
      { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
      { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
      { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
      { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
      { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
      { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
      { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
      { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
    ],
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * Compatibility hook - returns translation key as-is
 * Actual translation handled by Lingo.dev Compiler
 */
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}