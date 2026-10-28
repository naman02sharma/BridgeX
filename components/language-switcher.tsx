"use client"

import { useState } from "react"
import { useI18n } from "@/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Globe, Check, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Professional Language Switcher Component
 * 
 * Features:
 * - Crisp UI with flags and native names
 * - Fast language switching
 * - Persisted preferred language
 * - No layout shift
 * - Accessible design
 * - RTL support indicator
 */
export function LanguageSwitcher() {
  const { locale, changeLocale, availableLocales, isLoading, isRTL } = useI18n()
  const [isChanging, setIsChanging] = useState(false)

  const currentLocale = availableLocales.find(l => l.code === locale)

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return
    
    setIsChanging(true)
    
    try {
      await changeLocale(newLocale)
    } catch (error) {
      console.error("Failed to change language:", error)
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "gap-2 min-w-[120px] transition-all",
            isRTL && "flex-row-reverse"
          )}
          disabled={isChanging || isLoading}
        >
          {isChanging || isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {currentLocale?.flag} {currentLocale?.nativeName || 'English'}
          </span>
          <span className="sm:hidden">
            {currentLocale?.flag}
          </span>
          {isRTL && (
            <Badge variant="secondary" className="text-xs px-1">
              RTL
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[400px] overflow-y-auto">
          {availableLocales
            .filter(l => l.enabled)
            .map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  "cursor-pointer flex items-center gap-3 py-2.5",
                  language.code === locale && "bg-accent"
                )}
              >
                <span className="text-2xl">{language.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-muted-foreground">
                    {language.name}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {language.rtl && (
                    <Badge variant="outline" className="text-xs px-1">
                      RTL
                    </Badge>
                  )}
                  <AnimatePresence>
                    {language.code === locale && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </DropdownMenuItem>
            ))}
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Powered by Lingo.dev</span>
            <Badge variant="secondary" className="text-xs">
              {availableLocales.filter(l => l.enabled).length} languages
            </Badge>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact Language Switcher (for mobile)
 */
export function LanguageSwitcherCompact() {
  const { locale, changeLocale, availableLocales, isLoading } = useI18n()
  const [isChanging, setIsChanging] = useState(false)

  const currentLocale = availableLocales.find(l => l.code === locale)

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return
    
    setIsChanging(true)
    try {
      await changeLocale(newLocale)
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          disabled={isChanging || isLoading}
        >
          {isChanging || isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="text-xl">{currentLocale?.flag || '🌐'}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {availableLocales
            .filter(l => l.enabled)
            .map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className="cursor-pointer"
              >
                <span className="text-xl mr-2">{language.flag}</span>
                <span className="flex-1">{language.nativeName}</span>
                {language.code === locale && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
