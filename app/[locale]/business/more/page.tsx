/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MoreMenuClient } from '@/components/business/MoreMenuClient';

interface MorePageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getStudioProfile(userEmail: string) {
  // Get user's studio via User->StudioOwnership->Studio path
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedStudios: {
        include: {
          studio: {
            include: {
              services: true,
            },
          },
        },
      },
    },
  });

  if (!user || user.ownedStudios.length === 0) {
    return {
      id: '',
      name: 'Studio',
      logoUrl: null,
      averageRating: null,
      totalReviews: 0,
      servicesCount: 0,
    };
  }

  const studio = user.ownedStudios[0].studio;

  return {
    id: studio.id,
    name: studio.name,
    logoUrl: studio.logoUrl,
    averageRating: null, // TODO: Calculate from reviews when review system is implemented
    totalReviews: 0, // TODO: Calculate from reviews when review system is implemented
    servicesCount: studio.services.length,
  };
}

export default async function MorePage({
  params,
}: MorePageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business/more`);
  }

  const studioProfile = await getStudioProfile(session.user?.email ?? '');

  return <MoreMenuClient locale={locale} studioProfile={studioProfile} />;
}
