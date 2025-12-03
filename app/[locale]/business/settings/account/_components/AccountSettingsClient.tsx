/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
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
import { SettingsCard } from '@/components/business/settings';
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

  const userPreferences = {
    language: 'de' as const,
    timezone: 'Europe/Berlin',
    dateFormat: 'DD.MM.YYYY' as const,
  };

  // TODO: Get 2FA status from user
  const twoFactorEnabled = false;

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static md:h-full md:top-auto">
      {/* Fixed Header Section with backdrop blur */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Konto & Sicherheit"
          subtitle="Verwalte deine Konto-Einstellungen"
          breadcrumb="Konto"
          backHref={`/${locale}/business/settings`}
          backLabel="Einstellungen"
          showBackButton={true}
        />
      </div>

      {/* Scrollable Content with Bento Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {/* Email Card */}
          <SettingsCard
            icon={MailIcon}
            title="E-Mail-Adresse"
            subtitle="Ändere deine E-Mail-Adresse"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            onEdit={() => setEmailDialogOpen(true)}
            preview={<p className="text-muted-foreground">{user.email}</p>}
          />

          {/* Password Card */}
          <SettingsCard
            icon={KeyIcon}
            title="Passwort"
            subtitle="Ändere dein Passwort"
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            onEdit={() => setPasswordDialogOpen(true)}
            preview={<p className="text-muted-foreground">••••••••</p>}
          />

          {/* 2FA Card with Badge */}
          <SettingsCard
            icon={ShieldIcon}
            title="Zwei-Faktor-Authentifizierung"
            subtitle="Erhöhe die Sicherheit deines Kontos"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            onEdit={() => setTwoFactorDialogOpen(true)}
            preview={
              <Badge
                className={
                  twoFactorEnabled ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                }
                variant={twoFactorEnabled ? 'default' : 'secondary'}
              >
                {twoFactorEnabled ? 'Aktiviert' : 'Deaktiviert'}
              </Badge>
            }
          />

          {/* Notifications Card */}
          <SettingsCard
            icon={BellIcon}
            title="Benachrichtigungen"
            subtitle="Verwalte deine Benachrichtigungseinstellungen"
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            onEdit={() => setNotificationsPopupOpen(true)}
          />

          {/* Privacy & Preferences Card */}
          <SettingsCard
            icon={SettingsIcon}
            title="Datenschutz & Präferenzen"
            subtitle="Sprache, Zeitzone und Datenexport"
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
            onEdit={() => setPrivacyPopupOpen(true)}
          />

          {/* Danger Zone Card - Full Width with Custom Styling */}
          {studio && (
            <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border-2 border-red-200 bg-red-50/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 group-hover:scale-105 transition-transform duration-300"
                  aria-hidden="true"
                >
                  <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-red-600">
                      Konto löschen
                    </h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDangerZonePopupOpen(true)}
                      className="h-8 w-8 shrink-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100"
                      aria-label="Konto löschen bearbeiten"
                    >
                      <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <p className="text-sm text-red-700 mt-0.5">
                    Lösche dein Studio-Konto dauerhaft (30 Tage Kulanzfrist)
                  </p>
                </div>
              </div>
            </div>
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
