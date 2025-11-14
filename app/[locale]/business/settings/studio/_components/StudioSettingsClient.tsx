/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2Icon, MapPinIcon, ClockIcon, ImageIcon, InfoIcon, PhoneIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
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
    const openDays = Object.entries(hours).filter(([_, value]) => value !== null);
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
          breadcrumb="Einstellungen"
          backHref={`/${locale}/business/settings`}
          backLabel="Einstellungen"
          showBackButton={true}
        />
      </div>

      {/* Scrollable Content - Only cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-0">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card 1: Basic Info */}
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            {/* Header with Edit Button */}
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <InfoIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  Grundinformationen
                </h3>
                <p className="text-sm text-muted-foreground">
                  Name, Beschreibung
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setActivePopup('basic')}
                className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10"
              >
                <Edit2Icon className="h-4 w-4 text-primary" />
              </Button>
            </div>

            {/* Content Preview */}
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{studio.name}</p>
              <p className="line-clamp-2 text-muted-foreground">{studio.description}</p>
            </div>
          </div>

          {/* Card 2: Standort (Address) */}
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            {/* Header with Edit Button */}
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPinIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  Standort
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adresse
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setActivePopup('address')}
                className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10"
              >
                <Edit2Icon className="h-4 w-4 text-primary" />
              </Button>
            </div>

            {/* Content Preview */}
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{studio.address}</p>
              <p className="text-muted-foreground">
                {studio.postalCode} {studio.city}
              </p>
            </div>
          </div>

          {/* Card 3: Kontakt (Contact) */}
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            {/* Header with Edit Button */}
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <PhoneIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  Kontakt
                </h3>
                <p className="text-sm text-muted-foreground">
                  Telefon, E-Mail
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setActivePopup('contact')}
                className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10"
              >
                <Edit2Icon className="h-4 w-4 text-primary" />
              </Button>
            </div>

            {/* Content Preview */}
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{studio.phone}</p>
              <p className="text-muted-foreground">{studio.email}</p>
            </div>
          </div>

          {/* Card 4: Opening Hours */}
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            {/* Header with Edit Button */}
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ClockIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  Öffnungszeiten
                </h3>
                <p className="text-sm text-muted-foreground">
                  Wann ist dein Studio geöffnet
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setActivePopup('hours')}
                className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10"
              >
                <Edit2Icon className="h-4 w-4 text-primary" />
              </Button>
            </div>

            {/* Content Preview */}
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{formatOpeningHours(studio.openingHours)}</p>
              {Object.entries(studio.openingHours)
                .filter(([_, value]) => value !== null)
                .slice(0, 2)
                .map(([day, value]) => (
                  <p key={day} className="text-muted-foreground capitalize">
                    {day}: {value?.open} - {value?.close}
                  </p>
                ))}
            </div>
          </div>

          {/* Card 5: Images */}
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            {/* Header with Edit Button */}
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  Bilder
                </h3>
                <p className="text-sm text-muted-foreground">
                  Logo und Galerie-Fotos
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setActivePopup('images')}
                className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10"
              >
                <Edit2Icon className="h-4 w-4 text-primary" />
              </Button>
            </div>

            {/* Content Preview */}
            <div className="space-y-1 text-sm">
              <p className="text-foreground">
                {studio.logoUrl ? '✓ Logo vorhanden' : 'Kein Logo'}
              </p>
              <p className="text-muted-foreground">
                {galleryCount} Galerie-{galleryCount === 1 ? 'Bild' : 'Bilder'}
              </p>
            </div>
          </div>
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
