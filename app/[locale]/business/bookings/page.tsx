/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React, { Suspense } from 'react';
import { auth } from '@/auth';

import { redirect } from 'next/navigation';
import { BookingsList } from '@/components/business/BookingsList';
import { BookingFilters } from '@/components/business/BookingFilters';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

function BookingsListSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function BookingsPage({
  params,
  searchParams,
}: BookingsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const search = await searchParams;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business/bookings`);
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Filters - Sticky */}
      <BookingFilters />

      {/* Bookings List */}
      <Suspense fallback={<BookingsListSkeleton />}>
        <BookingsList
          userEmail={session.user?.email ?? ''}
          statusFilter={search.status}
          searchQuery={search.search}
        />
      </Suspense>
    </div>
  );
}
