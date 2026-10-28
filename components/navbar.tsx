"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, AlertCircle, User, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSwitcher, LanguageSwitcherCompact } from "./language-switcher"
import { useSupabase } from "./supabase-provider"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useGlobalTranslation } from "@/components/translation-provider"
import { EmergencyBeacon } from "@/components/emergency-beacon"
import { FirstAidGuide } from "@/components/first-aid-guide"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, loading } = useSupabase()
  const { t } = useGlobalTranslation()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const navLinks = [
    { href: "/", label: "navigation.home" },
    { href: "/about", label: "navigation.about" },
    { href: "/map", label: "navigation.map" },
    { href: "/responders", label: "navigation.responders" },
    { href: "/contact", label: "navigation.contact" },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-gradient-to-br from-red-600 to-orange-600 p-2.5 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground tracking-tight">
                  Bridge<span className="text-red-600">X</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wide">EMERGENCY RESPONSE</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1.5 xl:gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group rounded-lg hover:bg-muted/50"
                >
                  {t(link.label)}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-red-600 to-orange-600 group-hover:w-3/4 transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Action Tools & Controls */}
            <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
              <FirstAidGuide size="sm" variant="outline" label="First Aid" />
              <EmergencyBeacon size="sm" variant="destructive" label="Beacon & Siren" />

              <div className="h-5 w-px bg-border/60 mx-0.5" />

              <ThemeToggle />
              <LanguageSwitcher />

              <div className="h-5 w-px bg-border/60 mx-0.5" />

              {loading ? (
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="font-medium flex items-center gap-2 px-2.5">
                      <User className="w-4 h-4 text-red-500" />
                      <span className="hidden xl:inline text-xs font-semibold max-w-[100px] truncate">{user.name || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      {t('navigation.dashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('navigation.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="font-medium text-xs h-8 px-2.5" asChild>
                    <Link href="/auth/login">{t('navigation.login')}</Link>
                  </Button>
                  <Button size="sm" className="font-semibold text-xs h-8 px-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-sm" asChild>
                    <Link href="/auth/register">{t('navigation.register')}</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-background border-l border-border shadow-2xl z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="bg-gradient-to-br from-red-600 to-orange-600 p-2 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold">
                      Bridge<span className="text-red-600">X</span>
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageSwitcherCompact />
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Links */}
                <nav className="flex-1 overflow-y-auto p-6">
                  <div className="flex flex-col gap-2">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                        >
                          {t(link.label)}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </nav>

                {/* Mobile Emergency Quick Actions */}
                <div className="px-6 py-3 border-t border-border space-y-2">
                  <EmergencyBeacon triggerClassName="w-full justify-center" />
                  <FirstAidGuide triggerClassName="w-full justify-center" />
                </div>

                {/* Mobile Auth Buttons */}
                <div className="p-6 border-t border-border space-y-3">
                  {loading ? (
                    <div className="w-full h-10 bg-muted rounded animate-pulse" />
                  ) : user ? (
                    <div className="space-y-3">
                      <div className="text-center text-sm text-muted-foreground">
                        Signed in as {user.name || user.email}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full font-medium"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          router.push("/dashboard")
                        }}
                      >
                        {t('navigation.dashboard')}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full font-medium"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          handleSignOut()
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('navigation.logout')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                        asChild
                      >
                        <Link href="/auth/login">{t('navigation.login')}</Link>
                      </Button>
                      <Button
                        className="w-full font-medium bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                        asChild
                      >
                        <Link href="/auth/register">{t('navigation.register')}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
