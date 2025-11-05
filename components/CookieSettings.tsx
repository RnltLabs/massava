/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Cookie Settings Modal Component
 * Granular cookie category management
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

interface CookieSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookieSettings({ open, onOpenChange }: CookieSettingsProps) {
  const { consent, updateConsent } = useCookieConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Sync local state with context when dialog opens
  useEffect(() => {
    if (open && consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [open, consent]);

  const handleSave = (): void => {
    updateConsent({
      necessary: true,
      analytics,
      marketing,
    });
    onOpenChange(false);
  };

  const handleCancel = (): void => {
    // Reset to current consent state
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie-Einstellungen</DialogTitle>
          <DialogDescription>
            Wählen Sie, welche Cookies Sie zulassen möchten. Notwendige Cookies sind für die
            Funktionalität der Website erforderlich und können nicht deaktiviert werden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Necessary Cookies - Always On */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
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
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Session-Cookie (Anmeldung)</li>
                <li>Spracheinstellung</li>
                <li>Cookie-Consent-Status</li>
              </ul>
            </div>
            <Switch
              id="necessary"
              checked={true}
              disabled
              aria-label="Notwendige Cookies - immer aktiv"
            />
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b">
            <div className="flex-1 space-y-2">
              <Label htmlFor="analytics" className="text-base font-semibold cursor-pointer">
                Analyse-Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                Alle Informationen werden anonymisiert gesammelt.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Seitenaufrufe und Navigation</li>
                <li>Verweildauer</li>
                <li>Fehlerberichte (Sentry)</li>
                <li>Google Analytics</li>
              </ul>
            </div>
            <Switch
              id="analytics"
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label="Analyse-Cookies aktivieren oder deaktivieren"
            />
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="marketing" className="text-base font-semibold cursor-pointer">
                Marketing-Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen und die
                Effektivität unserer Marketingkampagnen zu messen.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Werbeanzeigen-Personalisierung</li>
                <li>Kampagnen-Tracking</li>
                <li>Conversion-Messung</li>
              </ul>
            </div>
            <Switch
              id="marketing"
              checked={marketing}
              onCheckedChange={setMarketing}
              aria-label="Marketing-Cookies aktivieren oder deaktivieren"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
            Abbrechen
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Einstellungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
