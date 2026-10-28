'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/provider';
import { LingoService } from '@/i18n/lingo-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Languages, AlertTriangle, CheckCircle, Globe, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Multilingual Emergency Assistant
 * 
 * Creative Lingo.dev Integration Features:
 * - Real-time multi-language emergency description translation
 * - AI-powered emergency classification across 24 languages
 * - Language detection from user input
 * - Emergency keyword highlighting in native languages
 * - Batch translation for emergency responders
 * - Intelligent caching for faster responses
 */

interface EmergencyClassification {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  keywords: string[];
}

export function MultilingualEmergencyAssistant() {
  const { locale, t, changeLocale, isRTL } = useI18n();
  const [description, setDescription] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [classification, setClassification] = useState<EmergencyClassification | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [selectedTargetLanguages, setSelectedTargetLanguages] = useState<string[]>([
    'en', 'es', 'fr', 'ar', 'zh'
  ]);

  const lingoService = new LingoService();

  // Auto-detect language as user types
  useEffect(() => {
    const detectLanguage = async () => {
      if (description.length > 10) {
        try {
          const detected = await lingoService.detectLanguage(description);
          setDetectedLanguage(detected);
        } catch (error) {
          console.error('Language detection failed:', error);
        }
      }
    };

    const debounceTimer = setTimeout(detectLanguage, 500);
    return () => clearTimeout(debounceTimer);
  }, [description]);

  // Classify emergency type using AI
  const classifyEmergency = async () => {
    if (!description.trim()) return;

    setIsClassifying(true);
    try {
      const response = await fetch('/api/lingo/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: description,
          language: detectedLanguage || locale,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClassification(data.classification);
      }
    } catch (error) {
      console.error('Classification failed:', error);
    } finally {
      setIsClassifying(false);
    }
  };

  // Translate emergency description to multiple languages
  const translateToMultipleLanguages = async () => {
    if (!description.trim()) return;

    setIsTranslating(true);
    try {
      // Batch translate to all selected languages
      const translationPromises = selectedTargetLanguages.map(async (targetLang) => {
        if (targetLang === detectedLanguage) {
          return { lang: targetLang, text: description };
        }
        const translated = await lingoService.translateText(
          description,
          detectedLanguage || locale,
          targetLang
        );
        return { lang: targetLang, text: translated };
      });

      const results = await Promise.all(translationPromises);
      const translationsMap: Record<string, string> = {};
      results.forEach(({ lang, text }) => {
        translationsMap[lang] = text;
      });

      setTranslations(translationsMap);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ar: 'العربية',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    ru: 'Русский',
    hi: 'हिन्दी',
    pt: 'Português',
    it: 'Italiano',
  };

  const toggleLanguage = (lang: string) => {
    setSelectedTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={`w-full ${isRTL ? 'rtl' : 'ltr'}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <CardTitle>{t('emergency.multilingualAssistant')}</CardTitle>
        </div>
        <CardDescription>
          {t('emergency.assistantDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Language Detection Status */}
        <AnimatePresence>
          {detectedLanguage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {t('emergency.detectedLanguage')}: <strong>{languageNames[detectedLanguage] || detectedLanguage}</strong>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency Description Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('emergency.describeEmergency')}
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('emergency.descriptionPlaceholder')}
            className={`min-h-[120px] ${isRTL ? 'text-right' : 'text-left'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Target Languages Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Languages className="h-4 w-4" />
            {t('emergency.translateTo')}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(languageNames).map(([code, name]) => (
              <Badge
                key={code}
                variant={selectedTargetLanguages.includes(code) ? 'default' : 'outline'}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleLanguage(code)}
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={classifyEmergency}
            disabled={!description.trim() || isClassifying}
            variant="outline"
            className="gap-2"
          >
            {isClassifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {t('emergency.classifyType')}
          </Button>

          <Button
            onClick={translateToMultipleLanguages}
            disabled={!description.trim() || isTranslating || selectedTargetLanguages.length === 0}
            className="gap-2"
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            {t('emergency.translateNow')}
          </Button>
        </div>

        {/* Classification Results */}
        <AnimatePresence>
          {classification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {t('emergency.classification')}
                </h3>
                <Badge className={getSeverityColor(classification.severity)}>
                  {classification.severity.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <strong>{t('emergency.category')}:</strong> {classification.category}
                </p>
                <p className="text-sm">
                  <strong>{t('emergency.confidence')}:</strong> {(classification.confidence * 100).toFixed(1)}%
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium">{t('emergency.keywords')}:</span>
                  {classification.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation Results */}
        <AnimatePresence>
          {Object.keys(translations).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-3"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {t('emergency.translations')}
              </h3>

              <div className="space-y-2">
                {Object.entries(translations).map(([lang, text]) => (
                  <div
                    key={lang}
                    className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{languageNames[lang] || lang}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                        }}
                      >
                        {t('common.copy')}
                      </Button>
                    </div>
                    <p className={`text-sm ${['ar', 'he', 'fa', 'ur'].includes(lang) ? 'text-right' : 'text-left'}`}
                       dir={['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr'}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency Tips */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 <strong>{t('emergency.tip')}:</strong> {t('emergency.tipText')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
