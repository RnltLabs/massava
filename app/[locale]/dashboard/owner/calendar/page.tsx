/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Calendar Page - Time-Slot Grid View
 * Mobile-first Google Calendar-style time-slot calendar
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { BookingStatus } from '@/app/generated/prisma';
import { BottomTabNav } from '../../_components/BottomTabNav';
import { CalendarClient } from './_components/CalendarClient';
import { CalendarSkeleton } from './_components/CalendarSkeleton';
import { FloatingActionButton } from './_components/FloatingActionButton';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; view?: 'day' | 'week' }>;
};

export default async function CalendarPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const { locale } = await params;
  const { date: dateParam, view = 'day' } = await searchParams;

  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}?openAuth=login`);
  }

  // Get user's studio
  const ownership = await db.studioOwnership.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      studio: {
        include: {
          services: true,
        },
      },
    },
    orderBy: {
      invitedAt: 'desc',
    },
  });

  // If no studio, redirect to main dashboard
  if (!ownership) {
    redirect(`/${locale}/dashboard`);
  }

  const studio = ownership.studio;

  // Parse selected date or use today
  const selectedDate = dateParam ? new Date(dateParam) : startOfDay(new Date());

  // Calculate date range based on view
  let dateRangeStart: Date;
  let dateRangeEnd: Date;
  let bookingDateFilter: string | string[];

  if (view === 'week') {
    // Week view: Monday to Sunday
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    dateRangeStart = startOfDay(weekStart);
    dateRangeEnd = endOfDay(weekEnd);

    // Generate array of dates for the week
    bookingDateFilter = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
  } else {
    // Day view: single day
    dateRangeStart = startOfDay(selectedDate);
    dateRangeEnd = endOfDay(selectedDate);
    bookingDateFilter = format(selectedDate, 'yyyy-MM-dd');
  }

  // Get bookings for the date range
  const rawBookings = await db.newBooking.findMany({
    where: {
      studioId: studio.id,
      preferredDate: Array.isArray(bookingDateFilter)
        ? { in: bookingDateFilter }
        : bookingDateFilter,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      },
    },
    include: {
      service: true,
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { preferredTime: 'asc' },
  });

  // Transform to match expected type
  const bookings = rawBookings.map((booking) => ({
    ...booking,
    customer: {
      name: booking.customer.name || 'Unknown',
      email: booking.customer.email,
      phone: booking.customer.phone,
    },
  }));

  // Get blocked times for the date range
  const blockedTimes = await db.blockedTime.findMany({
    where: {
      studioId: studio.id,
      startTime: {
        gte: dateRangeStart,
        lte: dateRangeEnd,
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Calculate badge counts for bottom nav
  const today = format(new Date(), 'yyyy-MM-dd');
  const [pendingCount, todayCount] = await Promise.all([
    db.newBooking.count({
      where: {
        studioId: studio.id,
        status: BookingStatus.PENDING,
      },
    }),
    db.newBooking.count({
      where: {
        studioId: studio.id,
        status: BookingStatus.CONFIRMED,
        preferredDate: today,
      },
    }),
  ]);

  const servicesCount = studio.services.length;

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Kalender</h1>
          <p className="text-base md:text-lg text-muted-foreground">{studio.name}</p>
        </div>

        {/* Time-Slot Calendar */}
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarClient
            studioId={studio.id}
            initialBookings={bookings}
            initialBlockedTimes={blockedTimes}
            initialDate={selectedDate}
            initialView={view}
          />
        </Suspense>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        studioId={studio.id}
        services={studio.services}
        initialDate={selectedDate}
      />

      {/* Bottom Tab Navigation */}
      <BottomTabNav
        locale={locale}
        activeTab="calendar"
        pendingCount={pendingCount}
        todayCount={todayCount}
        servicesCount={servicesCount}
      />
    </div>
  );
}
