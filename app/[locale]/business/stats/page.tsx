/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React, { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { StatsClient } from './_components/StatsClient';
import { StatsSkeleton } from './_components/StatsSkeleton';
import { getBookingStats } from '../actions/stats';
import type { DateRange } from '@/lib/schemas/stats.schema';

interface StatsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    dateRange?: string;
    serviceId?: string;
  }>;
}

async function StatsContent({
  dateRange,
  serviceId,
}: {
  dateRange: DateRange;
  serviceId: string | null;
}): Promise<React.JSX.Element> {
  const stats = await getBookingStats(dateRange, serviceId);

  return <StatsClient initialStats={stats} initialDateRange={dateRange} />;
}

export default async function StatsPage({
  params,
  searchParams,
}: StatsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const search = await searchParams;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business/stats`);
  }

  // Parse and validate filters
  const dateRange = (search.dateRange as DateRange) || 'last30days';
  const serviceId = search.serviceId || null;

  return (
    <div className="space-y-4 pt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Statistics & Reports</h1>
        <p className="text-gray-600 mt-1">Track your business performance and insights</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent dateRange={dateRange} serviceId={serviceId} />
      </Suspense>
    </div>
  );
}
