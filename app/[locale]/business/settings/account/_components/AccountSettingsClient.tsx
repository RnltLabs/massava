/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MailIcon,
  KeyIcon,
  ShieldIcon,
  BellIcon,
  SettingsIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { EmailChangeDialog } from './EmailChangeDialog';
import { PasswordChangeDialog } from './PasswordChangeDialog';
import { TwoFactorDialog } from './TwoFactorDialog';
import { NotificationsPopup } from './NotificationsPopup';
import { PrivacyPopup } from './PrivacyPopup';
import { DangerZonePopup } from './DangerZonePopup';

interface AccountSettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  studio: {
    id: string;
    name: string;
  } | null;
  locale: string;
}

export function AccountSettingsClient({
  user,
  studio,
  locale,
}: AccountSettingsClientProps): React.JSX.Element {
  // Dialog states for existing components
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);

  // Popup states for new components
  const [notificationsPopupOpen, setNotificationsPopupOpen] = useState(false);
  const [privacyPopupOpen, setPrivacyPopupOpen] = useState(false);
  const [dangerZonePopupOpen, setDangerZonePopupOpen] = useState(false);

  // TODO: Get from user preferences (currently hardcoded)
  const notificationSettings = {
    bookings: true,
    cancellations: true,
    reminders: true,
    marketing: false,
  };

  const userPreferences = {
    language: 'de' as const,
    timezone: 'Europe/Berlin',
    dateFormat: 'DD.MM.YYYY' as const,
  };

  // TODO: Get 2FA status from user
  const twoFactorEnabled = false;

  const cards = [
    {
      id: 'email',
      icon: MailIcon,
      title: 'E-Mail-Adresse',
      description: 'Ändere deine E-Mail-Adresse',
      value: user.email,
      action: () => setEmailDialogOpen(true),
      badge: null,
    },
    {
      id: 'password',
      icon: KeyIcon,
      title: 'Passwort',
      description: 'Ändere dein Passwort',
      value: '••••••••',
      action: () => setPasswordDialogOpen(true),
      badge: null,
    },
    {
      id: '2fa',
      icon: ShieldIcon,
      title: 'Zwei-Faktor-Authentifizierung',
      description: 'Erhöhe die Sicherheit deines Kontos',
      value: null,
      action: () => setTwoFactorDialogOpen(true),
      badge: twoFactorEnabled ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Aktiviert
        </Badge>
      ) : (
        <Badge variant="secondary">Deaktiviert</Badge>
      ),
    },
    {
      id: 'notifications',
      icon: BellIcon,
      title: 'Benachrichtigungen',
      description: 'Verwalte deine Benachrichtigungseinstellungen',
      value: null,
      action: () => setNotificationsPopupOpen(true),
      badge: null,
    },
    {
      id: 'privacy',
      icon: SettingsIcon,
      title: 'Datenschutz & Präferenzen',
      description: 'Sprache, Zeitzone und Datenexport',
      value: null,
      action: () => setPrivacyPopupOpen(true),
      badge: null,
    },
  ];

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static md:h-full md:top-auto">
      {/* Fixed Header Section with backdrop blur */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Konto & Sicherheit"
          subtitle="Verwalte deine Konto-Einstellungen"
          breadcrumb="Einstellungen"
          backHref={`/${locale}/business/more`}
          backLabel="Einstellungen"
          showBackButton={true}
        />
      </div>

      {/* Scrollable Content with Cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-8">
        <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
          {cards.map((card) => (
            <Card
              key={card.id}
              className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <card.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold mb-1">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>
                  {card.badge && <div className="ml-2">{card.badge}</div>}
                </div>
              </CardHeader>
              {card.value && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">{card.value}</p>
                  <Button
                    onClick={card.action}
                    size="sm"
                    className="w-full bg-[#B56550] hover:bg-[#A05540] text-white"
                  >
                    Bearbeiten
                  </Button>
                </CardContent>
              )}
              {!card.value && (
                <CardContent className="pt-0">
                  <Button
                    onClick={card.action}
                    size="sm"
                    className="w-full bg-[#B56550] hover:bg-[#A05540] text-white"
                  >
                    Verwalten
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Danger Zone Card (only if studio exists) */}
          {studio && (
            <Card className="group relative overflow-hidden rounded-[1.5rem] border-2 border-red-200 bg-red-50/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-red-600 mb-1">
                        Konto löschen
                      </CardTitle>
                      <CardDescription className="text-sm text-red-700">
                        Lösche dein Studio-Konto dauerhaft (30 Tage Kulanzfrist)
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => setDangerZonePopupOpen(true)}
                  size="sm"
                  variant="destructive"
                  className="w-full md:w-auto"
                >
                  <AlertTriangleIcon className="mr-2 h-4 w-4" />
                  Konto löschen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Existing Dialogs (reused as-is) */}
      <EmailChangeDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        currentEmail={user.email}
      />

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <TwoFactorDialog
        open={twoFactorDialogOpen}
        onOpenChange={setTwoFactorDialogOpen}
        isEnabled={twoFactorEnabled}
      />

      {/* New Popups */}
      <NotificationsPopup
        open={notificationsPopupOpen}
        onOpenChange={setNotificationsPopupOpen}
        initialSettings={notificationSettings}
      />

      <PrivacyPopup
        open={privacyPopupOpen}
        onOpenChange={setPrivacyPopupOpen}
        currentPreferences={userPreferences}
        locale={locale}
      />

      {studio && (
        <DangerZonePopup
          open={dangerZonePopupOpen}
          onOpenChange={setDangerZonePopupOpen}
          studioId={studio.id}
          studioName={studio.name}
        />
      )}
    </div>
  );
}
