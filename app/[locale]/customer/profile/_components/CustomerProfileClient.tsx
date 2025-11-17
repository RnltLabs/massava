/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Profile Client Component
 */

'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  SettingsIcon,
  LockIcon,
  Edit2Icon,
} from 'lucide-react';
import { PersonalInfoPopup } from './PersonalInfoPopup';
import { AddressPopup } from './AddressPopup';
import { PhonePopup } from './PhonePopup';
import { PreferencesPopup } from './PreferencesPopup';
import { PasswordChangePopup } from './PasswordChangePopup';

interface CustomerProfileClientProps {
  customer: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    language: string | null;
    emailNotifications: {
      bookingConfirmed: boolean;
      bookingReminder: boolean;
      bookingCancelled: boolean;
      marketing: boolean;
    } | null;
  };
  locale: string;
}

type PopupType = 'personalInfo' | 'address' | 'phone' | 'preferences' | 'password' | null;

export function CustomerProfileClient({
  customer,
  locale,
}: CustomerProfileClientProps): React.JSX.Element {
  const [activePopup, setActivePopup] = useState<PopupType>(null);

  // Default notification settings if not set
  const emailNotifications = customer.emailNotifications ?? {
    bookingConfirmed: true,
    bookingReminder: true,
    bookingCancelled: true,
    marketing: false,
  };

  // Default language if not set
  const language = (customer.language ?? 'de') as 'de' | 'en';

  const cards = [
    {
      id: 'personalInfo',
      icon: UserIcon,
      title: 'Persönliche Informationen',
      description: 'Name und E-Mail-Adresse',
      value: customer.name || customer.email,
      action: () => setActivePopup('personalInfo'),
    },
    {
      id: 'address',
      icon: MapPinIcon,
      title: 'Adresse',
      description: 'Deine Lieferadresse',
      value: customer.address
        ? `${customer.address}, ${customer.postalCode} ${customer.city}`
        : 'Noch nicht gesetzt',
      action: () => setActivePopup('address'),
    },
    {
      id: 'phone',
      icon: PhoneIcon,
      title: 'Telefonnummer',
      description: 'Kontaktnummer für Benachrichtigungen',
      value: customer.phone || 'Noch nicht gesetzt',
      action: () => setActivePopup('phone'),
    },
    {
      id: 'preferences',
      icon: SettingsIcon,
      title: 'Einstellungen',
      description: 'Sprache und Benachrichtigungen',
      value: language === 'de' ? 'Deutsch' : 'English',
      action: () => setActivePopup('preferences'),
    },
    {
      id: 'password',
      icon: LockIcon,
      title: 'Passwort',
      description: 'Ändere dein Passwort',
      value: '••••••••',
      action: () => setActivePopup('password'),
    },
  ];

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static md:h-full md:top-auto">
      {/* Fixed Header Section with backdrop blur */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Mein Profil"
          subtitle="Verwalte deine persönlichen Daten"
          breadcrumb="Profil"
          backHref={`/${locale}/customer`}
          backLabel="Zurück"
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
                <div className="flex items-start justify-between gap-2">
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={card.action}
                    className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10"
                  >
                    <Edit2Icon className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground truncate">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Popups */}
      <PersonalInfoPopup
        open={activePopup === 'personalInfo'}
        onOpenChange={(open) => setActivePopup(open ? 'personalInfo' : null)}
        name={customer.name}
        email={customer.email}
      />

      <AddressPopup
        open={activePopup === 'address'}
        onOpenChange={(open) => setActivePopup(open ? 'address' : null)}
        initialData={{
          street: customer.address || '',
          line2: '',
          city: customer.city || '',
          postalCode: customer.postalCode || '',
          latitude: customer.latitude ?? undefined,
          longitude: customer.longitude ?? undefined,
        }}
      />

      <PhonePopup
        open={activePopup === 'phone'}
        onOpenChange={(open) => setActivePopup(open ? 'phone' : null)}
        initialPhone={customer.phone || ''}
      />

      <PreferencesPopup
        open={activePopup === 'preferences'}
        onOpenChange={(open) => setActivePopup(open ? 'preferences' : null)}
        initialData={{
          language,
          emailNotifications,
        }}
      />

      <PasswordChangePopup
        open={activePopup === 'password'}
        onOpenChange={(open) => setActivePopup(open ? 'password' : null)}
      />
    </div>
  );
}
