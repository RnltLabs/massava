/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { MapPinIcon, ClockIcon, ImageIcon, InfoIcon, PhoneIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsSection, SettingsListItem } from '@/components/business/settings';
import { BasicInfoPopup } from './BasicInfoPopup';
import { AddressPopup } from './AddressPopup';
import { ContactPopup } from './ContactPopup';
import { OpeningHoursPopup } from './OpeningHoursPopup';
import { ImagesPopup } from './ImagesPopup';

interface StudioData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours: Record<string, { open: string; close: string } | null>;
  logoUrl?: string | null;
  galleryImages?: Array<{
    url: string;
    coverPhoto: boolean;
    order: number;
  }>;
}

interface StudioSettingsClientProps {
  studio: StudioData;
  locale: string;
}

export function StudioSettingsClient({ studio, locale }: StudioSettingsClientProps): React.JSX.Element {
  const [activePopup, setActivePopup] = useState<'basic' | 'address' | 'contact' | 'hours' | 'images' | null>(null);

  const formatOpeningHours = (hours: Record<string, { open: string; close: string } | null>): string => {
    const openDays = Object.entries(hours).filter(([, value]) => value !== null);
    if (openDays.length === 0) return 'Nicht festgelegt';
    if (openDays.length === 7) return 'Täglich geöffnet';
    return `${openDays.length} Tage`;
  };

  const galleryCount = studio.galleryImages?.length || 0;
  const formatAddress = (): string => {
    if (!studio.address) return 'Nicht festgelegt';
    return `${studio.address}, ${studio.postalCode}`;
  };

  const formatImages = (): string => {
    const parts: string[] = [];
    if (studio.logoUrl) parts.push('Logo');
    if (galleryCount > 0) parts.push(`${galleryCount} Fotos`);
    return parts.length > 0 ? parts.join(' + ') : 'Keine Bilder';
  };

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static md:h-full md:top-auto">
      {/* Fixed Header Section with backdrop blur */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Studio-Einstellungen"
          subtitle="Verwalte deine Studio-Informationen"
          breadcrumb="Studio"
          backHref={`/${locale}/business/settings`}
          backLabel="Einstellungen"
          showBackButton={true}
        />
      </div>

      {/* Scrollable Content - iOS-style Lists */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-8">
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Grundinformationen */}
          <SettingsSection title="Grundinformationen">
            <SettingsListItem
              icon={InfoIcon}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Name & Beschreibung"
              description="Studio-Name und Beschreibungstext"
              preview={studio.name}
              onClick={() => setActivePopup('basic')}
            />
          </SettingsSection>

          {/* Standort & Kontakt */}
          <SettingsSection title="Standort & Kontakt">
            <SettingsListItem
              icon={MapPinIcon}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              label="Adresse"
              description="Standort deines Studios"
              preview={formatAddress()}
              onClick={() => setActivePopup('address')}
            />
            <SettingsListItem
              icon={PhoneIcon}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              label="Kontaktdaten"
              description="Telefon, E-Mail und Website"
              preview={studio.phone || 'Nicht festgelegt'}
              onClick={() => setActivePopup('contact')}
            />
          </SettingsSection>

          {/* Öffnungszeiten & Medien */}
          <SettingsSection title="Öffnungszeiten & Medien">
            <SettingsListItem
              icon={ClockIcon}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              label="Öffnungszeiten"
              description="Wann ist dein Studio geöffnet"
              preview={formatOpeningHours(studio.openingHours)}
              onClick={() => setActivePopup('hours')}
            />
            <SettingsListItem
              icon={ImageIcon}
              iconBg="bg-pink-100"
              iconColor="text-pink-600"
              label="Bilder"
              description="Logo und Galerie-Fotos"
              preview={formatImages()}
              onClick={() => setActivePopup('images')}
            />
          </SettingsSection>
        </div>
      </div>

      {/* Popups */}
      <BasicInfoPopup
        open={activePopup === 'basic'}
        onOpenChange={(open) => setActivePopup(open ? 'basic' : null)}
        initialData={{
          name: studio.name,
          description: studio.description,
        }}
      />

      <AddressPopup
        open={activePopup === 'address'}
        onOpenChange={(open) => setActivePopup(open ? 'address' : null)}
        initialData={{
          street: studio.address,
          city: studio.city,
          postalCode: studio.postalCode,
          latitude: studio.latitude || undefined,
          longitude: studio.longitude || undefined,
        }}
      />

      <ContactPopup
        open={activePopup === 'contact'}
        onOpenChange={(open) => setActivePopup(open ? 'contact' : null)}
        initialData={{
          phone: studio.phone,
          email: studio.email,
          website: studio.website || undefined,
        }}
      />

      <OpeningHoursPopup
        open={activePopup === 'hours'}
        onOpenChange={(open) => setActivePopup(open ? 'hours' : null)}
        initialData={studio.openingHours}
      />

      <ImagesPopup
        open={activePopup === 'images'}
        onOpenChange={(open) => setActivePopup(open ? 'images' : null)}
        studioId={studio.id}
        studioName={studio.name}
        currentLogo={studio.logoUrl}
        currentGallery={studio.galleryImages}
      />
    </div>
  );
}
