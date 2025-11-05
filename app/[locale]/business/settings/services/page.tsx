/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/prisma';
import { ServicesPageClient } from '../_components/ServicesPageClient';

interface ServicesSettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getStudioServices(userEmail: string) {
  const user = await db.user.findUnique({
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

  return user?.ownedStudios[0]?.studio?.services ?? [];
}

export default async function ServicesSettingsPage({
  params,
}: ServicesSettingsPageProps): Promise<JSX.Element> {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/business/settings/services`
    );
  }

  const services = await getStudioServices(session.user?.email ?? '');

  return <ServicesPageClient services={services} />;
}
