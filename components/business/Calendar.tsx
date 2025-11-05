/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { BookingStatusBadge } from '@/components/business/BookingStatusBadge';
import { CalendarIcon } from 'lucide-react';
import { Booking, BookingStatus } from '@/app/generated/prisma';

interface CalendarProps {
  userEmail: string;
  view: 'day' | 'week' | 'month';
  date: string;
}

async function getCalendarBookings(
  userEmail: string,
  date: string,
  view: 'day' | 'week' | 'month'
): Promise<Array<Booking & { service: { name: string } | null }>> {
  // Get user's studio via User->StudioOwnership->Studio path
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  if (!user || user.ownedStudios.length === 0) {
    return [];
  }

  const studioId = user.ownedStudios[0].studioId;

  // Calculate date range based on view
  const currentDate = new Date(date);
  let startDate: Date;
  let endDate: Date;

  switch (view) {
    case 'day':
      startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week': {
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  // Get bookings in date range
  const bookings = await prisma.booking.findMany({
    where: {
      studioId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      },
    },
    include: {
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return bookings;
}

export async function Calendar({ userEmail, view, date }: CalendarProps): Promise<React.JSX.Element> {
  const bookings = await getCalendarBookings(userEmail, date, view);

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-neutral-900">No appointments</p>
          <p className="text-sm text-muted-foreground mt-1">
            No appointments scheduled for this period
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group bookings by date for better display
  const bookingsByDate = bookings.reduce(
    (acc, booking) => {
      const dateKey = new Date(booking.createdAt).toLocaleDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(booking);
      return acc;
    },
    {} as Record<string, typeof bookings>
  );

  return (
    <div className="space-y-6">
      {Object.entries(bookingsByDate).map(([dateKey, dateBookings]) => (
        <Card key={dateKey}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">{dateKey}</h3>
            <div className="space-y-3">
              {dateBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-neutral-900">{booking.customerName}</p>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.preferredTime} • {booking.service?.name ?? 'No service'}
                    </p>
                    <p className="text-xs text-muted-foreground">{booking.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-700">
                      {new Date(booking.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
