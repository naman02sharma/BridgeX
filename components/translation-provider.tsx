"use client"

/**
 * Translation Provider - Global Translation Wrapper
 * 
 * Re-exports i18n provider functionality for backward compatibility
 * with components using useGlobalTranslation hook.
 */

import { ReactNode } from 'react'
import { useI18n } from '@/i18n/provider'

/**
 * Re-export I18nProvider as TranslationProvider for compatibility
 */
export { I18nProvider as TranslationProvider } from '@/i18n/provider'

/**
 * Global translation hook that wraps useI18n
 */
export function useGlobalTranslation() {
  const { t, locale, changeLocale, translateText, detectLanguage, isRTL, isLoading } = useI18n()
  
  return {
    t,
    currentLang: locale,
    changeLanguage: changeLocale,
    translateText,
    detectLanguage,
    isRTL,
    isLoading,
  }
}

