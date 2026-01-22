/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Bookings Page
 * Route: /customer/bookings
 */

import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getCustomerBookings } from '@/app/[locale]/customer/actions/bookings';
import { CustomerBookingsClient } from './_components/CustomerBookingsClient';

interface CustomerBookingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CustomerBookingsPage({
  params,
}: CustomerBookingsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/customer/bookings`
    );
  }

  // Fetch customer bookings
  const result = await getCustomerBookings();

  // Handle error
  if (!result.success) {
    // Redirect to customer dashboard with error
    redirect(`/${locale}/customer?error=${encodeURIComponent(result.error)}`);
  }

  return (
    <CustomerBookingsClient
      bookings={result.data}
      locale={locale}
    />
  );
}
