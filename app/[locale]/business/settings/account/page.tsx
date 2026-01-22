/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Account Settings Page
 * Route: /business/settings/account
 */

import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AccountSettingsClient } from './_components/AccountSettingsClient';

interface AccountPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

async function getUserData(userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      name: true,
      ownedStudios: {
        include: {
          studio: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return user;
}

export default async function AccountPage({
  params,
  searchParams,
}: AccountPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const { from } = await searchParams;
  const session = await auth();

  if (!session) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/business/settings/account`
    );
  }

  const user = await getUserData(session.user?.email ?? '');

  if (!user) {
    redirect(`/${locale}/business/more`);
  }

  const studio = user.ownedStudios[0]?.studio ?? null;

  // Hide back button if user comes from header navigation
  const showBackButton = from !== 'header';

  return (
    <AccountSettingsClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
      }}
      studio={studio}
      locale={locale}
      showBackButton={showBackButton}
    />
  );
}
