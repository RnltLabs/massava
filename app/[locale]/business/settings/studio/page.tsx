/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { StudioSettingsClient } from './_components/StudioSettingsClient';

interface StudioSettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Get user's studio with all data
 */
async function getUserStudio(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  return user?.ownedStudios[0]?.studio ?? null;
}

export default async function StudioSettingsPage({
  params,
}: StudioSettingsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;

  // 1. Authenticate
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin`);
  }

  // 2. Get user's studio
  const studio = await getUserStudio(session.user.id);

  if (!studio) {
    redirect(`/${locale}/dashboard`);
  }

  // 3. Transform data for client component
  const galleryImages = studio.galleryImages
    ? (Array.isArray(studio.galleryImages)
        ? studio.galleryImages
        : JSON.parse(JSON.stringify(studio.galleryImages))) as Array<{
      url: string;
      coverPhoto: boolean;
      order: number;
    }>
    : [];

  const studioData = {
    id: studio.id,
    name: studio.name,
    description: studio.description || '',
    address: studio.address || '',
    city: studio.city || '',
    postalCode: studio.postalCode || '',
    phone: studio.phone || '',
    email: studio.email || '',
    website: studio.website,
    latitude: studio.latitude,
    longitude: studio.longitude,
    openingHours: (studio.openingHours as Record<string, { open: string; close: string } | null>) || {},
    logoUrl: studio.logoUrl,
    galleryImages: galleryImages,
  };

  return <StudioSettingsClient studio={studioData} locale={locale} />;
}
