/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Cookie Settings Page
 * Dedicated page for managing cookie preferences
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Cookie, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CookieSettingsPage() {
  const router = useRouter();
  const { consent, updateConsent, clearConsent } = useCookieConsent();
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);
  const [saved, setSaved] = useState(false);

  const handleSave = (): void => {
    updateConsent({
      necessary: true,
      analytics,
      marketing,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearConsent = (): void => {
    if (confirm('Möchten Sie Ihre Cookie-Einstellungen wirklich zurücksetzen?')) {
      clearConsent();
      setAnalytics(false);
      setMarketing(false);
    }
  };

  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'Nicht verfügbar';
    return new Date(timestamp).toLocaleString('de-DE', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Cookie className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Cookie-Einstellungen</h1>
        </div>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Cookie-Präferenzen und Datenschutzeinstellungen
        </p>
      </div>

      {/* Current Status */}
      {consent && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Aktuelle Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Zuletzt aktualisiert: {formatTimestamp(consent.timestamp)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cookie Categories */}
      <div className="space-y-6">
        {/* Necessary Cookies */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle>Notwendige Cookies</CardTitle>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Erforderlich
                  </span>
                </div>
                <CardDescription>
                  Diese Cookies sind für den Betrieb der Website unerlässlich und ermöglichen
                  grundlegende Funktionen.
                </CardDescription>
              </div>
              <Switch checked={true} disabled aria-label="Notwendige Cookies - immer aktiv" />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Session-Cookie für sichere Anmeldung</li>
              <li>Spracheinstellung (Deutsch/Englisch)</li>
              <li>Cookie-Consent-Status</li>
              <li>CSRF-Schutz Token</li>
            </ul>
          </CardContent>
        </Card>

        {/* Analytics Cookies */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>Analyse-Cookies</CardTitle>
                <CardDescription>
                  Helfen uns zu verstehen, wie Besucher mit der Website interagieren. Alle
                  Informationen werden anonymisiert.
                </CardDescription>
              </div>
              <Switch
                id="analytics"
                checked={analytics}
                onCheckedChange={setAnalytics}
                aria-label="Analyse-Cookies aktivieren oder deaktivieren"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Seitenaufrufe und Navigation (Google Analytics)</li>
              <li>Verweildauer auf der Website</li>
              <li>Fehlerberichte und Performance-Monitoring (Sentry)</li>
              <li>Nutzungsstatistiken zur Website-Optimierung</li>
            </ul>
          </CardContent>
        </Card>

        {/* Marketing Cookies */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>Marketing-Cookies</CardTitle>
                <CardDescription>
                  Werden verwendet, um relevante Werbung anzuzeigen und die Effektivität unserer
                  Kampagnen zu messen.
                </CardDescription>
              </div>
              <Switch
                id="marketing"
                checked={marketing}
                onCheckedChange={setMarketing}
                aria-label="Marketing-Cookies aktivieren oder deaktivieren"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Personalisierte Werbeanzeigen</li>
              <li>Kampagnen-Tracking und Conversion-Messung</li>
              <li>Social Media Integration</li>
              <li>Remarketing und Retargeting</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button onClick={handleSave} className="flex-1 sm:flex-none" disabled={saved}>
          {saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Gespeichert
            </>
          ) : (
            'Einstellungen speichern'
          )}
        </Button>
        <Button
          onClick={handleClearConsent}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          Einstellungen zurücksetzen
        </Button>
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="flex-1 sm:flex-none"
        >
          Zurück
        </Button>
      </div>

      {/* Additional Information */}
      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Weitere Informationen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Wir nehmen Ihre Privatsphäre ernst und halten uns an die DSGVO und ePrivacy-Richtlinie.
            Sie können Ihre Einstellungen jederzeit ändern.
          </p>
          <p>
            Weitere Details zu unserer Datenverarbeitung finden Sie in unserer{' '}
            <a href="/datenschutz" className="text-primary hover:underline">
              Datenschutzerklärung
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
