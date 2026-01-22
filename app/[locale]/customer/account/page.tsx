/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Profile Page
 * Route: /customer/account
 */

import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CustomerProfileClient } from './_components/CustomerProfileClient';

interface CustomerProfilePageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
}

async function getUserData(userEmail: string): Promise<UserData | null> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export default async function CustomerProfilePage({
  params,
  searchParams,
}: CustomerProfilePageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const { from } = await searchParams;
  const session = await auth();

  if (!session) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/customer/account`
    );
  }

  const user = await getUserData(session.user?.email ?? '');

  if (!user) {
    redirect(`/${locale}/customer`);
  }

  // Hide back button if user comes from header navigation
  const showBackButton = from !== 'header';

  return (
    <CustomerProfileClient
      user={user}
      locale={locale}
      showBackButton={showBackButton}
    />
  );
}
