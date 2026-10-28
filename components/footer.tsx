"use client"

import { Globe, Mail, Heart } from "lucide-react"
import { useGlobalTranslation } from "@/components/translation-provider"

export function Footer() {
  const { t } = useGlobalTranslation()

  return (
    <footer className="bg-background border-t relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-muted/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <Globe className="w-10 h-10 text-primary" strokeWidth={1.5} />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
              </div>
              <span className="text-3xl font-bold text-foreground">BridgeX</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-md">
              {t("footer.description")}
            </p>
            <div className="flex gap-3">
              {[
                { icon: Mail, href: "mailto:support@bridgex.org", label: "Email" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-11 h-11 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary hover-lift transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-5 text-foreground text-lg">{t("footer.platform")}</h4>
            <ul className="space-y-3 text-sm">
              {[
                { key: "pages.emergencyMap", label: "Emergency Map", href: "/map" },
                { key: "pages.joinNetwork", label: "Join Network", href: "/join" },
                { key: "pages.responderPortal", label: "Responder Portal", href: "/portal" },
                { key: "navigation.dashboard", label: "Dashboard", href: "/dashboard" },
              ].map((item, i) => (
                <li key={i}>
                  <a
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-5 text-foreground text-lg">{t("footer.resources")}</h4>
            <ul className="space-y-3 text-sm">
              {[
                { key: "pages.documentation", label: "Documentation", href: "/docs" },
                { key: "pages.safetyGuidelines", label: "Safety Guidelines", href: "/safety" },
                { key: "pages.contactSupport", label: "Contact Support", href: "/contact" },
                { key: "navigation.about", label: "About", href: "/about" },
              ].map((item, i) => (
                <li key={i}>
                  <a
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Built using <a href="https://github.com/lingodotdev/lingo.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Lingo.dev</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
