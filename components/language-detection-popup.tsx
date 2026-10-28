'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/provider';
import { getLocaleByCode } from '@/i18n/config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Globe, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Language Auto-Detection Popup
 * 
 * Creative Feature: Shows on first visit with geo-detected language suggestion
 * - Detects user's location and suggests appropriate language
 * - Remembers user preference (localStorage)
 * - Shows flag/emoji for visual appeal
 * - Smooth animations with Framer Motion
 */

export function LanguageDetectionPopup() {
  const { locale, changeLocale } = useI18n();
  const [showPopup, setShowPopup] = useState(false);
  const [suggestedLocale, setSuggestedLocale] = useState<string | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<'geo' | 'browser' | 'ip'>('browser');

  useEffect(() => {
    // Check if user has already dismissed or selected language
    const hasSeenPopup = localStorage.getItem('language-popup-seen');
    if (hasSeenPopup) return;

    // Auto-detect language
    detectLanguage();
  }, []);

  const detectLanguage = async () => {
    try {
      // Try geolocation first (most accurate)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const countryCode = await getCountryFromCoords(latitude, longitude);
            const locale = mapCountryToLocale(countryCode);
            
            if (locale && locale !== 'en') {
              setSuggestedLocale(locale);
              setDetectionMethod('geo');
              setShowPopup(true);
            }
          },
          () => {
            // Fallback to browser language
            detectFromBrowser();
          }
        );
      } else {
        detectFromBrowser();
      }
    } catch (error) {
      console.error('Language detection failed:', error);
      detectFromBrowser();
    }
  };

  const detectFromBrowser = () => {
    const browserLang = navigator.language.split('-')[0];
    
    const supportedLocales = ['en', 'es', 'fr', 'ru', 'de', 'ja', 'zh', 'ar', 'ko', 'hi', 'mr', 'bn', 'pa', 'te', 'ta'];
    
    if (supportedLocales.includes(browserLang) && browserLang !== 'en') {
      setSuggestedLocale(browserLang);
      setDetectionMethod('browser');
      setShowPopup(true);
    }
  };

  const getCountryFromCoords = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await response.json();
      return data.countryCode?.toLowerCase() || 'us';
    } catch (error) {
      return 'us';
    }
  };

  const mapCountryToLocale = (countryCode: string): string => {
    const countryLocaleMap: Record<string, string> = {
      es: 'es', mx: 'es', ar: 'es', co: 'es', cl: 'es', pe: 'es', ve: 'es',
      fr: 'fr', be: 'fr', ch: 'fr', ca: 'fr',
      de: 'de', at: 'de',
      ru: 'ru', ua: 'ru', by: 'ru', kz: 'ru',
      jp: 'ja',
      kr: 'ko',
      in: 'hi', bd: 'bn',
      cn: 'zh', tw: 'zh', hk: 'zh', sg: 'zh',
      sa: 'ar', ae: 'ar', eg: 'ar', ma: 'ar', dz: 'ar', tn: 'ar', jo: 'ar', lb: 'ar',
    };

    return countryLocaleMap[countryCode] || 'en';
  };

  const handleAccept = () => {
    if (suggestedLocale) {
      changeLocale(suggestedLocale);
    }
    localStorage.setItem('language-popup-seen', 'true');
    setShowPopup(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('language-popup-seen', 'true');
    setShowPopup(false);
  };

  const getLanguageName = (code: string): string => {
    const localeConfig = getLocaleByCode(code);
    return localeConfig?.name || code.toUpperCase();
  };

  const getLanguageEmoji = (code: string): string => {
    const emojiMap: Record<string, string> = {
      en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹',
      ru: '🇷🇺', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', 'zh-TW': '🇹🇼',
      ar: '🇸🇦', hi: '🇮🇳', nl: '🇳🇱', pl: '🇵🇱', tr: '🇹🇷', sv: '🇸🇪',
      he: '🇮🇱', fa: '🇮🇷', ur: '🇵🇰', bn: '🇧🇩', vi: '🇻🇳', th: '🇹🇭', id: '🇮🇩',
    };
    return emojiMap[code] || '🌐';
  };

  if (!suggestedLocale) return null;

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Popup Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <Card className="shadow-2xl border-2">
              <CardContent className="pt-6 space-y-4">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Header with Icon */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Language Detected!</h3>
                    <p className="text-sm text-muted-foreground">
                      {detectionMethod === 'geo' && 'Based on your location'}
                      {detectionMethod === 'browser' && 'Based on your browser'}
                      {detectionMethod === 'ip' && 'Based on your IP address'}
                    </p>
                  </div>
                </div>

                {/* Suggested Language */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getLanguageEmoji(suggestedLocale)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        We detected you might prefer:
                      </p>
                      <p className="font-bold text-lg">{getLanguageName(suggestedLocale)}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      {detectionMethod === 'geo' && <MapPin className="h-3 w-3" />}
                      {detectionMethod === 'browser' && <Globe className="h-3 w-3" />}
                      Auto
                    </Badge>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Emergency alerts in your native language</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Better communication with responders</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Faster help in emergencies</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDismiss}
                  >
                    Keep English
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={handleAccept}
                  >
                    Switch to {getLanguageName(suggestedLocale)}
                  </Button>
                </div>

                {/* Footer Note */}
                <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                  You can change language anytime from settings
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
