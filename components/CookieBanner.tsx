/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - GDPR-Compliant Cookie Consent Banner
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CookieConsent {
  necessary: boolean; // Always true (required for functionality)
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = 'massava_cookie_consent';
const COOKIE_CONSENT_VERSION = '1.0';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
  });

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (!savedConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved consent
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
        applyConsent(parsed);
      } catch (error) {
        console.error('Failed to parse cookie consent:', error);
        setShowBanner(true);
      }
    }
  }, []);

  const applyConsent = (consent: CookieConsent) => {
    // Analytics cookies
    if (consent.analytics) {
      // Enable analytics (e.g., Google Analytics)
      // window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    } else {
      // Disable analytics
      // window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    }

    // Marketing cookies
    if (consent.marketing) {
      // Enable marketing (e.g., Facebook Pixel)
      // window.fbq?.('consent', 'grant');
    } else {
      // Disable marketing
      // window.fbq?.('consent', 'revoke');
    }
  };

  const saveConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = {
      ...newConsent,
      timestamp: Date.now(),
      version: COOKIE_CONSENT_VERSION,
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));
    applyConsent(newConsent);
    setConsent(newConsent);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const saveSettings = () => {
    saveConsent(consent);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
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
                Mehr Informationen finden Sie in unserer{' '}
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
                  setConsent({ ...consent, analytics: checked })
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
                  setConsent({ ...consent, marketing: checked })
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
  );
}
