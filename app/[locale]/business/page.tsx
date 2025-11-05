/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React, { Suspense } from 'react';
import { auth } from '@/auth';

import { redirect } from 'next/navigation';
import { DashboardStats } from '@/components/business/DashboardStats';
import { RecentBookings } from '@/components/business/RecentBookings';
import { UpcomingAppointments } from '@/components/business/UpcomingAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessDashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

function DashboardSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function BusinessDashboardPage({
  params,
}: BusinessDashboardPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business`);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats userEmail={session.user?.email ?? ''} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Appointments */}
        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          }
        >
          <UpcomingAppointments userEmail={session.user?.email ?? ''} />
        </Suspense>

        {/* Recent Bookings */}
        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          }
        >
          <RecentBookings userEmail={session.user?.email ?? ''} />
        </Suspense>
      </div>
    </div>
  );
}
