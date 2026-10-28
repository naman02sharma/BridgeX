/**
 * BridgeX i18n Configuration
 * Professional internationalization setup with Lingo.dev integration
 */

export interface LocaleConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
  enabled: boolean
}

export const locales: LocaleConfig[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", rtl: false, enabled: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", rtl: false, enabled: true },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", rtl: false, enabled: true },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", rtl: false, enabled: true },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", rtl: false, enabled: true },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", rtl: false, enabled: true },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", rtl: false, enabled: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true, enabled: true },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", rtl: false, enabled: true },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", rtl: false, enabled: true },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", rtl: false, enabled: true },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳", rtl: false, enabled: true },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳", rtl: false, enabled: true },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", rtl: false, enabled: true },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", rtl: false, enabled: true },
]

export const defaultLocale = "en"
export const fallbackLocale = "en"

/**
 * Namespace organization for translations
 */
export const namespaces = {
  common: "common",           // Common UI elements
  navigation: "navigation",   // Navbar, footer, links
  emergency: "emergency",     // SOS, alerts, emergency types
  forms: "forms",            // Form labels, placeholders, validation
  messages: "messages",      // User feedback, notifications
  pages: "pages",           // Page-specific content
  errors: "errors",         // Error messages
  auth: "auth",            // Authentication
  dashboard: "dashboard",   // Dashboard content
  responder: "responder",   // Responder-specific
} as const

/**
 * Translation cache configuration
 */
export const cacheConfig = {
  enabled: true,
  ttl: 3600000, // 1 hour
  maxSize: 1000,
  storageKey: "bridgex-i18n-cache",
}

/**
 * Language detection sources (in order of priority)
 */
export const detectionSources = [
  "user-preference",    // User's manual selection
  "browser-geo",       // Browser geolocation API
  "browser-language",  // Browser Accept-Language header
  "ip-geolocation",   // IP-based detection
  "default",          // Fallback to default
] as const

/**
 * RTL-specific configuration
 */
export const rtlConfig = {
  // CSS class to apply for RTL layouts
  rtlClass: "rtl",
  // Direction attribute
  dirAttribute: "dir",
  // Mirror icons/images in RTL
  mirrorIcons: true,
}

/**
 * Emergency-specific translation priorities
 */
export const emergencyTranslationPriority = [
  "sos",
  "sendAlert",
  "emergency",
  "help",
  "fire",
  "medical",
  "police",
  "disaster",
  "location",
  "cancel",
]

/**
 * Get locale by code
 */
export function getLocaleByCode(code: string): LocaleConfig | undefined {
  return locales.find(locale => locale.code === code)
}

/**
 * Get enabled locales only
 */
export function getEnabledLocales(): LocaleConfig[] {
  return locales.filter(locale => locale.enabled)
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale: string): boolean {
  const localeConfig = getLocaleByCode(locale)
  return localeConfig?.rtl ?? false
}
