/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MoreMenuClient } from '@/components/business/MoreMenuClient';

interface SettingsPageProps {
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
      servicesCount: 0,
      studioName: 'Mein Studio',
      studioLogo: null,
    };
  }

  const studio = user.ownedStudios[0].studio;

  return {
    servicesCount: studio.services.length,
    studioName: studio.name,
    studioLogo: studio.logoUrl ?? null,
  };
}

export default async function SettingsPage({
  params,
}: SettingsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business/settings`);
  }

  const studioProfile = await getStudioProfile(session.user?.email ?? '');

  return <MoreMenuClient locale={locale} studioProfile={studioProfile} />;
}
