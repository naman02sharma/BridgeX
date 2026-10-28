/**
 * Advanced Lingo.dev Integration Service
 * 
 * Professional translation service with:
 * - Intelligent caching
 * - Batch processing
 * - Fallback handling
 * - Performance optimization
 * - Emergency translation priorities
 */

import { locales, cacheConfig, emergencyTranslationPriority } from './config'

interface TranslationCache {
  [key: string]: {
    value: string
    timestamp: number
    locale: string
  }
}

interface TranslationOptions {
  priority?: 'high' | 'normal' | 'low'
  context?: string
  namespace?: string
  forceRefresh?: boolean
}

class LingoService {
  private cache: TranslationCache = {}
  private pendingTranslations: Map<string, Promise<string>> = new Map()
  private translationQueue: Array<{ key: string; locale: string; resolve: (value: string) => void }> = []
  private queueTimer: NodeJS.Timeout | null = null

  constructor() {
    this.loadCache()
  }

  /**
   * Get translation for a key
   */
  async translate(
    key: string,
    locale: string = 'en',
    options: TranslationOptions = {}
  ): Promise<string> {
    // Check cache first (unless force refresh)
    if (!options.forceRefresh) {
      const cached = this.getCached(key, locale)
      if (cached) return cached
    }

    // Check if translation is already pending
    const pendingKey = `${key}::${locale}`
    if (this.pendingTranslations.has(pendingKey)) {
      return this.pendingTranslations.get(pendingKey)!
    }

    // Create promise for this translation
    const translationPromise = this.fetchTranslation(key, locale, options)
    this.pendingTranslations.set(pendingKey, translationPromise)

    try {
      const result = await translationPromise
      this.setCached(key, locale, result)
      return result
    } finally {
      this.pendingTranslations.delete(pendingKey)
    }
  }

  /**
   * Batch translate multiple keys
   */
  async translateBatch(
    keys: string[],
    locale: string = 'en',
    options: TranslationOptions = {}
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {}

    // Separate cached and uncached
    const uncached: string[] = []
    
    for (const key of keys) {
      if (!options.forceRefresh) {
        const cached = this.getCached(key, locale)
        if (cached) {
          results[key] = cached
          continue
        }
      }
      uncached.push(key)
    }

    // Fetch uncached translations in parallel
    if (uncached.length > 0) {
      const translations = await Promise.all(
        uncached.map(key => this.translate(key, locale, options))
      )
      
      uncached.forEach((key, index) => {
        results[key] = translations[index]
      })
    }

    return results
  }

  /**
   * Translate text content (not keys)
   */
  async translateText(
    text: string,
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<string> {
    if (targetLang === sourceLang) return text

    try {
      // Use Lingo.dev API for text translation
      const response = await fetch('/api/lingo/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang,
        }),
      })

      if (!response.ok) {
        throw new Error(`Lingo.dev API error: ${response.status}`)
      }

      const data = await response.json()
      return data.translatedText || text
    } catch (error) {
      console.error('Lingo.dev translation error:', error)
      return text // Fallback to original
    }
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch('/api/lingo/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`Lingo.dev detection error: ${response.status}`)
      }

      const data = await response.json()
      return data.language || 'en'
    } catch (error) {
      console.error('Lingo.dev detection error:', error)
      return 'en'
    }
  }

  /**
   * Preload critical emergency translations
   */
  async preloadEmergencyTranslations(locale: string): Promise<void> {
    console.log(`Preloading emergency translations for ${locale}...`)
    
    await this.translateBatch(
      emergencyTranslationPriority,
      locale,
      { priority: 'high' }
    )
  }

  /**
   * Fetch translation from storage or API
   */
  private async fetchTranslation(
    key: string,
    locale: string,
    options: TranslationOptions
  ): Promise<string> {
    try {
      // Try to load from locale file first
      const translations = await this.loadLocaleFile(locale)
      if (translations && translations[key]) {
        return translations[key]
      }

      // Fallback to English if available
      if (locale !== 'en') {
        const enTranslations = await this.loadLocaleFile('en')
        if (enTranslations && enTranslations[key]) {
          return enTranslations[key]
        }
      }

      // Last resort: return the key itself
      return key
    } catch (error) {
      console.error(`Translation fetch error for ${key} (${locale}):`, error)
      return key
    }
  }

  /**
   * Load locale file dynamically
   */
  private async loadLocaleFile(locale: string): Promise<Record<string, string> | null> {
    try {
      const response = await fetch(`/i18n/locales/${locale}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error(`Failed to load locale file: ${locale}`, error)
      return null
    }
  }

  /**
   * Get cached translation
   */
  private getCached(key: string, locale: string): string | null {
    if (!cacheConfig.enabled) return null

    const cacheKey = `${key}::${locale}`
    const cached = this.cache[cacheKey]

    if (!cached) return null

    // Check if cache is expired
    const age = Date.now() - cached.timestamp
    if (age > cacheConfig.ttl) {
      delete this.cache[cacheKey]
      return null
    }

    return cached.value
  }

  /**
   * Set cached translation
   */
  private setCached(key: string, locale: string, value: string): void {
    if (!cacheConfig.enabled) return

    const cacheKey = `${key}::${locale}`
    this.cache[cacheKey] = {
      value,
      locale,
      timestamp: Date.now(),
    }

    // Enforce cache size limit
    const cacheSize = Object.keys(this.cache).length
    if (cacheSize > cacheConfig.maxSize) {
      this.evictOldestCache()
    }

    // Persist to localStorage if available
    this.saveCache()
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldestCache(): void {
    const entries = Object.entries(this.cache)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // Remove oldest 20%
    const toRemove = Math.floor(entries.length * 0.2)
    for (let i = 0; i < toRemove; i++) {
      delete this.cache[entries[i][0]]
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(cacheConfig.storageKey)
      if (stored) {
        this.cache = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load translation cache:', error)
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(cacheConfig.storageKey, JSON.stringify(this.cache))
    } catch (error) {
      console.error('Failed to save translation cache:', error)
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache = {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheConfig.storageKey)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: Object.keys(this.cache).length,
      maxSize: cacheConfig.maxSize,
      enabled: cacheConfig.enabled,
      ttl: cacheConfig.ttl,
    }
  }
}

// Singleton instance
export const lingoService = new LingoService()

// Export for testing
export { LingoService }
