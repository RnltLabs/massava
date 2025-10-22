/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { StudioList } from '@/components/StudioList';
import { PrismaClient } from '@/app/generated/prisma';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string }>;
};

const prisma = new PrismaClient();

export default async function StudiosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { city } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'studios' });

  // Fetch studios with optional city filter
  const studios = await prisma.studio.findMany({
    where: city
      ? {
          city: {
            contains: city,
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
            {city ? t('title_with_city', { city }) : t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('description', { count: studios.length })}
          </p>
        </div>

        {/* Studio List */}
        <StudioList studios={studios} locale={locale} />
      </div>
    </div>
  );
}
