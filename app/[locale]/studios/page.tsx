/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { StudioList } from '@/components/StudioList';
import { PrismaClient } from '@/app/generated/prisma';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; location?: string; radius?: string }>;
};

const prisma = new PrismaClient();

export default async function StudiosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const { city, location, radius } = searchParamsResolved;
  const t = await getTranslations({ locale, namespace: 'studios' });

  // Use location from search widget, fallback to legacy city param
  const searchLocation = location || city;

  // Fetch studios with optional location filter
  const studios = await prisma.studio.findMany({
    where: searchLocation
      ? {
          city: {
            contains: searchLocation,
            mode: 'insensitive',
          },
        }
      : {},
    include: {
      services: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {searchLocation ? t('title_with_city', { city: searchLocation }) : t('title')}
          </h1>
          {searchLocation && radius && (
            <p className="text-lg text-accent font-medium mb-2">
              Ergebnisse für: {searchLocation} (Umkreis: {radius} km)
            </p>
          )}
          <p className="text-lg text-muted-foreground">
            {studios.length > 0
              ? t('description', { count: studios.length })
              : 'Keine Studios gefunden'}
          </p>
          {searchLocation && studios.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Versuchen Sie eine andere Stadt oder erweitern Sie den Suchradius.
            </p>
          )}
        </div>

        {/* Studio List */}
        <StudioList studios={studios} locale={locale} />
      </div>
    </div>
  );
}
