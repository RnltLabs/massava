/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { auth } from '@/auth';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ServicesPageClient } from '../_components/ServicesPageClient';

interface ServicesSettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getStudioData(userEmail: string) {
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

  const studioData = user?.ownedStudios[0]?.studio;
  return {
    services: studioData?.services ?? [],
    studioId: studioData?.id ?? '',
  };
}

export default async function ServicesSettingsPage({
  params,
}: ServicesSettingsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/business/settings/services`
    );
  }

  const { services, studioId } = await getStudioData(session.user?.email ?? '');

  return <ServicesPageClient services={services} studioId={studioId} locale={locale} />;
}
