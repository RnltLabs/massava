/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { BookingForm } from '@/components/BookingForm';
import { PrismaClient } from '@/app/generated/prisma';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const prisma = new PrismaClient();

export default async function StudioProfilePage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'studio_profile' });

  // Fetch studio with services
  const studio = await prisma.studio.findUnique({
    where: { id },
    include: {
      services: true,
    },
  });

  if (!studio) {
    notFound();
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Studio Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="wellness-shadow rounded-3xl bg-card p-8">
              <h1 className="text-4xl font-bold mb-4">{studio.name}</h1>

              {/* Location */}
              <div className="flex items-start gap-3 text-muted-foreground mb-6">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-1" />
                <div>
                  {studio.address}
                  <br />
                  {studio.postalCode && `${studio.postalCode} `}
                  {studio.city}
                </div>
              </div>

              {/* Description */}
              {studio.description && (
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {studio.description}
                </p>
              )}

              {/* Contact */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${studio.phone}`} className="hover:text-primary transition-colors">
                    {studio.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${studio.email}`} className="hover:text-primary transition-colors">
                    {studio.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Services */}
            {studio.services.length > 0 && (
              <div className="wellness-shadow rounded-3xl bg-card p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  {t('services')}
                </h2>

                <div className="space-y-4">
                  {studio.services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 border-2 border-muted rounded-2xl hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {service.price.toFixed(2)}€
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {service.duration} min
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {studio.openingHours && typeof studio.openingHours === 'object' && (
              <div className="wellness-shadow rounded-3xl bg-card p-8">
                <h2 className="text-2xl font-bold mb-6">{t('opening_hours')}</h2>

                <div className="space-y-2">
                  {Object.entries(studio.openingHours as Record<string, string>).map(
                    ([day, hours]) => (
                      <div key={day} className="flex justify-between py-2 border-b border-muted/20 last:border-0">
                        <span className="font-medium capitalize">{t(`day_${day}`)}</span>
                        <span className="text-muted-foreground">{hours}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="wellness-shadow rounded-3xl bg-card p-8">
                <h2 className="text-2xl font-bold mb-6">{t('book_now')}</h2>
                <BookingForm
                  studioId={studio.id}
                  studioName={studio.name}
                  services={studio.services}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
