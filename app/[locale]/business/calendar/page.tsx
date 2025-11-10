/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Calendar Page - Time-Slot Grid View
 * Mobile-first Google Calendar-style time-slot calendar
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@/app/generated/prisma';
import { CalendarClient } from './_components/CalendarClient';
import { CalendarSkeleton } from './_components/CalendarSkeleton';
import { FloatingActionButton } from './_components/FloatingActionButton';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { generateClosedTimeBlocks, type OpeningHours } from '@/lib/opening-hours-utils';

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
  const ownership = await prisma.studioOwnership.findFirst({
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

  // If no studio, redirect to onboarding
  if (!ownership) {
    redirect(`/${locale}/business/onboarding`);
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
  const rawBookings = await prisma.newBooking.findMany({
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
      name: booking.customer?.name || booking.customerName || 'Unknown',
      email: booking.customer?.email || booking.customerEmail || '',
      phone: booking.customer?.phone || booking.customerPhone || '',
    },
  }));

  // Get blocked times for the date range
  const blockedTimes = await prisma.blockedTime.findMany({
    where: {
      studioId: studio.id,
      startTime: {
        gte: dateRangeStart,
        lte: dateRangeEnd,
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Generate virtual blocked times for hours outside opening hours
  let virtualBlockedTimes;
  if (view === 'week') {
    // Generate for all 7 days of the week
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    virtualBlockedTimes = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      return generateClosedTimeBlocks(day, studio.openingHours as OpeningHours | null, studio.id);
    }).flat();
  } else {
    // Day view - generate for selected date only
    virtualBlockedTimes = generateClosedTimeBlocks(
      selectedDate,
      studio.openingHours as OpeningHours | null,
      studio.id
    );
  }

  // Combine real and virtual blocked times
  const allBlockedTimes = [...blockedTimes, ...virtualBlockedTimes];

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-white">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 pt-2 md:pt-4">
        {/* Time-Slot Calendar - No header on mobile for maximum space */}
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarClient
            studioId={studio.id}
            studioCapacity={studio.capacity}
            initialBookings={bookings}
            initialBlockedTimes={allBlockedTimes}
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
    </div>
  );
}
