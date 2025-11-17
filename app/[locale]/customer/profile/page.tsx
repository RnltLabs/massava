/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Profile Page
 * Route: /customer/profile
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
}

interface CustomerData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  language: string | null;
  emailNotifications: {
    bookingConfirmed: boolean;
    bookingReminder: boolean;
    bookingCancelled: boolean;
    marketing: boolean;
  } | null;
}

async function getCustomerData(userEmail: string): Promise<CustomerData | null> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      // Note: These fields need to be added to User model:
      // address: true,
      // city: true,
      // postalCode: true,
      // latitude: true,
      // longitude: true,
      // language: true,
      // emailNotifications: true,
    },
  });

  if (!user) {
    return null;
  }

  // TODO: Once schema is updated, replace this with actual data
  // For now, return mock data structure
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: null, // TODO: user.address
    city: null, // TODO: user.city
    postalCode: null, // TODO: user.postalCode
    latitude: null, // TODO: user.latitude
    longitude: null, // TODO: user.longitude
    language: null, // TODO: user.language
    emailNotifications: null, // TODO: user.emailNotifications as CustomerData['emailNotifications']
  };
}

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/customer/profile`
    );
  }

  const customer = await getCustomerData(session.user?.email ?? '');

  if (!customer) {
    redirect(`/${locale}/customer`);
  }

  return (
    <CustomerProfileClient
      customer={customer}
      locale={locale}
    />
  );
}
