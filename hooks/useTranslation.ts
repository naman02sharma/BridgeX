import { useState, useEffect } from 'react'
import { supportedLanguages, translateText, detectLanguage as detectLang } from '@/lib/translation'
import { translations } from '@/lib/ui-translations'

interface UseTranslationReturn {
  t: (key: string, fallback?: string) => string;
  translateAsync: (text: string, target: string) => Promise<string>;
  detectLanguage: (text: string) => Promise<string>;
  currentLang: string;
  changeLanguage: (lang: string) => void;
  isLoading: boolean;
  supportedLanguages: typeof supportedLanguages;
}

const cache = new Map<string, string>();

export function useTranslation(): UseTranslationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLang = typeof window !== 'undefined' ? localStorage.getItem('bridgex-lang') : null
    if (savedLang && supportedLanguages.find(l => l.code === savedLang)) {
      setCurrentLang(savedLang)
    }

    // Load cache from localStorage
    if (typeof window !== 'undefined') {
      const savedCache = localStorage.getItem('bridgex-translation-cache')
      if (savedCache) {
        try {
          const parsed = JSON.parse(savedCache)
          Object.entries(parsed).forEach(([k, v]) => cache.set(k, v as string))
        } catch (e) {
          console.error('Failed to parse translation cache', e)
        }
      }
    }
  }, [])

  const changeLanguage = (lang: string) => {
    if (supportedLanguages.find(l => l.code === lang)) {
      setCurrentLang(lang)
      if (typeof window !== 'undefined') localStorage.setItem('bridgex-lang', lang)
    }
  }

  // Synchronous t() for UI text (reads from local translations map)
  const t = (key: string, fallback?: string): string => {
    if (translations[currentLang] && translations[currentLang][key]) return translations[currentLang][key]
    if (translations['en'] && translations['en'][key]) return translations['en'][key]
    return fallback || key
  }

  // Async translator for dynamic content when needed
  const translateAsync = async (text: string, target: string) => {
    if (target === 'en') return text
    const cacheKey = `${text}::${target}`
    if (cache.has(cacheKey)) return cache.get(cacheKey)!

    setIsLoading(true)
    try {
      const res = await translateText(text, target, 'en')
      const translated = res.translatedText
      cache.set(cacheKey, translated)
      if (typeof window !== 'undefined') localStorage.setItem('bridgex-translation-cache', JSON.stringify(Object.fromEntries(cache)))
      return translated
    } catch (e) {
      console.error('Async translation failed', e)
      return text
    } finally {
      setIsLoading(false)
    }
  }

  const detectLanguage = async (text: string): Promise<string> => {
    try {
      return await detectLang(text)
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  };

  return { t, translateAsync, detectLanguage, currentLang, changeLanguage, isLoading, supportedLanguages };
}