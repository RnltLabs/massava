/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { MapPinIcon, ClockIcon, ImageIcon, InfoIcon, PhoneIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsCard } from '@/components/business/settings';
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
    return `${openDays.length} Tage geöffnet`;
  };

  const galleryCount = studio.galleryImages?.length || 0;

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

      {/* Scrollable Content - Bento Grid Layout */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Featured Card - Grundinformationen */}
          <SettingsCard
            icon={InfoIcon}
            title="Grundinformationen"
            subtitle="Name, Beschreibung deines Studios"
            variant="featured"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            onEdit={() => setActivePopup('basic')}
            preview={
              <div className="space-y-1">
                <p className="font-medium text-foreground">{studio.name}</p>
                <p className="text-muted-foreground line-clamp-2">{studio.description}</p>
              </div>
            }
          />

          {/* Standort */}
          <SettingsCard
            icon={MapPinIcon}
            title="Standort"
            subtitle="Adresse deines Studios"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            onEdit={() => setActivePopup('address')}
            preview={
              <div className="space-y-1">
                <p className="text-foreground">{studio.address}</p>
                <p className="text-muted-foreground">
                  {studio.postalCode} {studio.city}
                </p>
              </div>
            }
          />

          {/* Kontakt */}
          <SettingsCard
            icon={PhoneIcon}
            title="Kontakt"
            subtitle="Telefon, E-Mail und Website"
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            onEdit={() => setActivePopup('contact')}
            preview={
              <div className="space-y-1">
                <p className="text-foreground">{studio.phone}</p>
                <p className="text-muted-foreground">{studio.email}</p>
              </div>
            }
          />

          {/* Öffnungszeiten */}
          <SettingsCard
            icon={ClockIcon}
            title="Öffnungszeiten"
            subtitle="Wann ist dein Studio geöffnet"
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            onEdit={() => setActivePopup('hours')}
            preview={
              <div className="space-y-1">
                <p className="font-medium text-foreground">{formatOpeningHours(studio.openingHours)}</p>
                {Object.entries(studio.openingHours)
                  .filter(([, value]) => value !== null)
                  .slice(0, 2)
                  .map(([day, value]) => (
                    <p key={day} className="text-muted-foreground capitalize">
                      {day}: {value?.open} - {value?.close}
                    </p>
                  ))}
              </div>
            }
          />

          {/* Bilder */}
          <SettingsCard
            icon={ImageIcon}
            title="Bilder"
            subtitle="Logo und Galerie-Fotos"
            iconBg="bg-pink-100"
            iconColor="text-pink-600"
            onEdit={() => setActivePopup('images')}
            preview={
              <div className="space-y-1">
                <p className="text-foreground">
                  {studio.logoUrl ? '✓ Logo vorhanden' : 'Kein Logo'}
                </p>
                <p className="text-muted-foreground">
                  {galleryCount} Galerie-{galleryCount === 1 ? 'Bild' : 'Bilder'}
                </p>
              </div>
            }
          />
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
