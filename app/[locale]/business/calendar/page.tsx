/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Calendar } from '@/components/business/Calendar';
import { CalendarToolbar } from '@/components/business/CalendarToolbar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    view?: 'day' | 'week' | 'month';
    date?: string;
  }>;
}

function CalendarSkeleton(): JSX.Element {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  );
}

export default async function CalendarPage({
  params,
  searchParams,
}: CalendarPageProps): Promise<JSX.Element> {
  const { locale } = await params;
  const search = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business/calendar`);
  }

  const view = search.view ?? 'week';
  const date = search.date ?? new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Calendar</h1>
        <p className="text-muted-foreground mt-1">View and manage your appointment schedule</p>
      </div>

      {/* Calendar Toolbar */}
      <CalendarToolbar currentView={view} currentDate={date} />

      {/* Calendar */}
      <Suspense fallback={<CalendarSkeleton />}>
        <Calendar userEmail={session.user?.email ?? ''} view={view} date={date} />
      </Suspense>
    </div>
  );
}
