/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Cookie Consent Banner Component
 * GDPR & ePrivacy Directive Compliant
 */

'use client';

import { useState } from 'react';
import { Cookie, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { CookieSettings } from '@/components/CookieSettings';

export function CookieConsent() {
  const { hasConsent, acceptAll, rejectAll } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);

  // Don't show banner if user has already given consent
  if (hasConsent) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner - Fixed at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <Card className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Cookie className="w-8 h-8 text-primary flex-shrink-0" aria-hidden="true" />

            <div className="flex-1 space-y-2">
              <h2 id="cookie-consent-title" className="text-lg font-semibold">
                Wir respektieren Ihre Privatsphäre
              </h2>
              <p id="cookie-consent-description" className="text-sm text-muted-foreground">
                Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu
                bieten. Notwendige Cookies sind für die Funktionalität der Website erforderlich.
                Optionale Cookies helfen uns, die Website zu verbessern und auf Ihre Bedürfnisse
                zuzuschneiden.
              </p>
              <p className="text-xs text-muted-foreground">
                Mehr Informationen finden Sie in unserer{' '}
                <a
                  href="/datenschutz#cookies"
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Datenschutzerklärung
                </a>
                .
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              onClick={acceptAll}
              className="flex-1 sm:flex-none"
              aria-label="Alle Cookies akzeptieren"
            >
              Alle akzeptieren
            </Button>
            <Button
              onClick={rejectAll}
              variant="outline"
              className="flex-1 sm:flex-none"
              aria-label="Nur notwendige Cookies akzeptieren"
            >
              Nur notwendige
            </Button>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              className="flex-1 sm:flex-none"
              aria-label="Cookie-Einstellungen anpassen"
            >
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Einstellungen
            </Button>
          </div>
        </Card>
      </div>

      {/* Cookie Settings Dialog */}
      <CookieSettings open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
