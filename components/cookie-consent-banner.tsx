/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - GDPR-Compliant Cookie Consent Banner
 */

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Cookie, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  getConsent,
  setConsent,
  type CookieConsent,
} from "@/lib/cookie-consent"

export function CookieConsentBanner() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsentState] = useState<Omit<CookieConsent, "timestamp" | "version">>({
    necessary: true,
    analytics: false,
    marketing: false,
  })

  // Check if any mobile nav will be shown (customer OR business)
  const mobileNavVisible = (() => {
    if (status !== 'authenticated' || !session?.user) return false
    if (pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/verify')) return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryRole = (session.user as any)?.primaryRole || 'CUSTOMER'
    // Studio owners on /business - business layout handles its own nav
    if (primaryRole === 'STUDIO_OWNER' && pathname?.includes('/business')) return false
    // Studio owners outside /business - business nav shows
    if (primaryRole === 'STUDIO_OWNER') return true
    // Customers on /business - shouldn't happen
    if (pathname?.includes('/business')) return false
    // Customers elsewhere - customer nav shows
    return true
  })()

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = getConsent()

    if (!savedConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // Load saved consent
      setConsentState({
        necessary: savedConsent.necessary,
        analytics: savedConsent.analytics,
        marketing: savedConsent.marketing,
      })
    }
  }, [])

  const saveConsent = (newConsent: Omit<CookieConsent, "timestamp" | "version">) => {
    setConsent(newConsent)
    setConsentState(newConsent)
    setShowBanner(false)
    setShowSettings(false)

    // Dispatch custom event for GoogleAnalytics component
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cookie-consent-changed"))
    }

    // Reload if analytics consent changed to load/unload scripts
    if (newConsent.analytics) {
      window.location.reload()
    }
  }

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    })
  }

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    })
  }

  const saveSettings = () => {
    saveConsent(consent)
  }

  if (!showBanner) {
    return null
  }

  return (
    <>
      {/* Cookie Banner */}
      {/* Position above MobileCustomerNav when it's visible */}
      <div className={cn(
        "fixed left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg",
        mobileNavVisible ? "bottom-16 md:bottom-0" : "bottom-0"
      )}>
        <Card className="max-w-6xl mx-auto p-6">
          <div className="flex items-start gap-4">
            <Cookie className="w-8 h-8 text-primary flex-shrink-0 mt-1" />

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Wir respektieren Ihre Privatsphäre
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu
                bieten. Notwendige Cookies sind für die Funktionalität der Website erforderlich.
                Optionale Cookies helfen uns, die Website zu verbessern und auf Ihre Bedürfnisse
                zuzuschneiden.
              </p>
              <p className="text-xs text-muted-foreground">
                Mehr Informationen finden Sie in unserer{" "}
                <a
                  href="/datenschutz#cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Datenschutzerklärung
                </a>
                .
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={acceptNecessary}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Banner schließen</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button onClick={acceptAll} className="flex-1 sm:flex-none">
              Alle akzeptieren
            </Button>
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              Nur notwendige
            </Button>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Settings className="mr-2 h-4 w-4" />
              Einstellungen
            </Button>
          </div>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie-Einstellungen</DialogTitle>
            <DialogDescription>
              Wählen Sie, welche Cookies Sie zulassen möchten. Notwendige Cookies sind für die
              Funktionalität der Website erforderlich und können nicht deaktiviert werden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="necessary" className="text-base font-semibold cursor-pointer">
                    Notwendige Cookies
                  </Label>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Erforderlich
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Diese Cookies sind für den Betrieb der Website unerlässlich und ermöglichen
                  grundlegende Funktionen wie Authentifizierung und Spracheinstellungen.
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• Session-Cookie (Anmeldung)</li>
                  <li>• Spracheinstellung</li>
                  <li>• Cookie-Consent-Status</li>
                </ul>
              </div>
              <Switch id="necessary" checked={true} disabled />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="flex-1">
                <Label htmlFor="analytics" className="text-base font-semibold cursor-pointer">
                  Analyse-Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                  Alle Informationen werden anonymisiert gesammelt.
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• Seitenaufrufe und Navigation</li>
                  <li>• Verweildauer</li>
                  <li>• Fehlerberichte (Sentry)</li>
                </ul>
              </div>
              <Switch
                id="analytics"
                checked={consent.analytics}
                onCheckedChange={(checked) =>
                  setConsentState({ ...consent, analytics: checked })
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="marketing" className="text-base font-semibold cursor-pointer">
                  Marketing-Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen und die
                  Effektivität unserer Marketingkampagnen zu messen.
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• Werbeanzeigen-Personalisierung</li>
                  <li>• Kampagnen-Tracking</li>
                </ul>
              </div>
              <Switch
                id="marketing"
                checked={consent.marketing}
                onCheckedChange={(checked) =>
                  setConsentState({ ...consent, marketing: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveSettings}>Einstellungen speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
