/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React, { Suspense } from 'react';
import { auth } from '@/auth-unified';

import { redirect } from 'next/navigation';
import { BookingsList } from '@/components/business/BookingsList';
import { BookingFilters } from '@/components/business/BookingFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage all your booking requests</p>
      </div>

      {/* Filters */}
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
