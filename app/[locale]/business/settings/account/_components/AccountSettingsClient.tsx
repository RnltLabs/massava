/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import {
  MailIcon,
  KeyIcon,
  ShieldIcon,
  BellIcon,
  LockIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { SettingsSection, SettingsListItem } from '@/components/business/settings';
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
  showBackButton?: boolean;
}

export function AccountSettingsClient({
  user,
  studio,
  locale,
  showBackButton = true,
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
          title="Konto"
          subtitle="Verwalte deine Konto-Einstellungen"
          breadcrumb="Konto"
          backHref={`/${locale}/business/settings`}
          backLabel="Einstellungen"
          showBackButton={showBackButton}
        />
      </div>

      {/* Scrollable Content - iOS-style Lists */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-8">
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Anmeldedaten */}
          <SettingsSection title="Anmeldedaten">
            <SettingsListItem
              icon={MailIcon}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="E-Mail-Adresse"
              description="Deine Login-E-Mail"
              preview={user.email}
              onClick={() => setEmailDialogOpen(true)}
            />
            <SettingsListItem
              icon={KeyIcon}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              label="Passwort"
              description="Ändere dein Passwort"
              preview="••••••••"
              onClick={() => setPasswordDialogOpen(true)}
            />
          </SettingsSection>

          {/* Sicherheit */}
          <SettingsSection title="Sicherheit">
            <SettingsListItem
              icon={ShieldIcon}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              label="Zwei-Faktor-Authentifizierung"
              description="Erhöhe die Sicherheit deines Kontos"
              preview={twoFactorEnabled ? 'Aktiviert' : 'Deaktiviert'}
              onClick={() => setTwoFactorDialogOpen(true)}
            />
          </SettingsSection>

          {/* Präferenzen */}
          <SettingsSection title="Präferenzen">
            <SettingsListItem
              icon={BellIcon}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              label="Benachrichtigungen"
              description="Verwalte deine Benachrichtigungseinstellungen"
              onClick={() => setNotificationsPopupOpen(true)}
            />
            <SettingsListItem
              icon={LockIcon}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
              label="Datenschutz & Präferenzen"
              description="Sprache, Zeitzone und Datenexport"
              onClick={() => setPrivacyPopupOpen(true)}
            />
          </SettingsSection>

          {/* Gefahrenzone */}
          {studio && (
            <SettingsSection title="Gefahrenzone" variant="danger">
              <SettingsListItem
                icon={AlertTriangleIcon}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                label="Konto löschen"
                description="Lösche dein Studio-Konto dauerhaft (30 Tage Kulanzfrist)"
                onClick={() => setDangerZonePopupOpen(true)}
                variant="danger"
              />
            </SettingsSection>
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
