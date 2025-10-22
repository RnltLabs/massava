/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
};

type Studio = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  phone: string;
  email: string;
  services: Service[];
};

type Props = {
  studios: Studio[];
  locale: string;
};

export function StudioList({ studios, locale }: Props) {
  const t = useTranslations('studios');

  if (studios.length === 0) {
    return (
      <div className="text-center py-12 wellness-shadow rounded-3xl bg-card">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-4">{t('no_studios_title')}</h2>
        <p className="text-muted-foreground">{t('no_studios_description')}</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {studios.map((studio) => (
        <Link
          key={studio.id}
          href={`/${locale}/studios/${studio.id}`}
          className="wellness-shadow rounded-3xl bg-card p-6 hover:scale-105 transition-transform"
        >
          {/* Studio Name */}
          <h3 className="text-xl font-bold mb-2">{studio.name}</h3>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              {studio.address}
              <br />
              {studio.postalCode && `${studio.postalCode} `}
              {studio.city}
            </div>
          </div>

          {/* Description */}
          {studio.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {studio.description}
            </p>
          )}

          {/* Services Preview */}
          {studio.services.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="h-4 w-4" />
                {t('services')} ({studio.services.length})
              </div>
              <div className="space-y-1">
                {studio.services.slice(0, 2).map((service) => (
                  <div
                    key={service.id}
                    className="text-sm text-muted-foreground flex items-center justify-between"
                  >
                    <span className="truncate">{service.name}</span>
                    <span className="font-medium text-foreground ml-2">
                      {service.price.toFixed(2)}€
                    </span>
                  </div>
                ))}
                {studio.services.length > 2 && (
                  <div className="text-sm text-primary">
                    +{studio.services.length - 2} {t('more_services')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {studio.phone}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {studio.email}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-4 pt-4 border-t border-muted/20">
            <div className="text-sm font-medium text-primary">
              {t('view_details')} →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
