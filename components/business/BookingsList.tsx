/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { prisma } from '@/lib/prisma';
import { BookingCard } from '@/components/business/BookingCard';
import { CalendarIcon } from 'lucide-react';
import { NewBooking, BookingStatus } from '@/app/generated/prisma';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface BookingsListProps {
  userEmail: string;
  statusFilter?: string;
  searchQuery?: string;
}

type BookingWithService = NewBooking & { service: { name: string } | null };

/**
 * Groups bookings by date category (HEUTE, MORGEN, ÄLTERE ANFRAGEN, or specific date)
 */
function groupBookingsByDate(bookings: BookingWithService[]): Map<string, BookingWithService[]> {
  const groups = new Map<string, BookingWithService[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const booking of bookings) {
    const bookingDate = new Date(booking.preferredDateTime);
    bookingDate.setHours(0, 0, 0, 0);

    let groupKey: string;
    if (bookingDate.getTime() === today.getTime()) {
      groupKey = `HEUTE • ${format(bookingDate, 'EEEE, d. MMM', { locale: de })}`;
    } else if (bookingDate.getTime() === tomorrow.getTime()) {
      groupKey = `MORGEN • ${format(bookingDate, 'EEEE, d. MMM', { locale: de })}`;
    } else if (bookingDate < today) {
      groupKey = 'ÄLTERE ANFRAGEN';
    } else {
      groupKey = format(bookingDate, 'EEEE, d. MMMM', { locale: de }).toUpperCase();
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(booking);
  }

  return groups;
}

async function getBookings(
  userEmail: string,
  statusFilter?: string,
  searchQuery?: string
): Promise<BookingWithService[]> {
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

  // Build where clause
  interface BookingWhereInput {
    studioId: string;
    status?: BookingStatus;
    OR?: Array<{
      customerName?: { contains: string; mode: 'insensitive' };
      customerEmail?: { contains: string; mode: 'insensitive' };
      customerPhone?: { contains: string; mode: 'insensitive' };
    }>;
  }

  const where: BookingWhereInput = {
    studioId,
  };

  // Apply status filter
  if (statusFilter && statusFilter !== 'all') {
    where.status = statusFilter as BookingStatus;
  }

  // Apply search filter
  if (searchQuery) {
    where.OR = [
      { customerName: { contains: searchQuery, mode: 'insensitive' } },
      { customerEmail: { contains: searchQuery, mode: 'insensitive' } },
      { customerPhone: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Get bookings
  const bookings = await prisma.newBooking.findMany({
    where,
    include: {
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings;
}

export async function BookingsList({
  userEmail,
  statusFilter,
  searchQuery,
}: BookingsListProps): Promise<React.JSX.Element> {
  const bookings = await getBookings(userEmail, statusFilter, searchQuery);

  // Check if filters are applied
  const hasFilters = Boolean(searchQuery || (statusFilter && statusFilter !== 'all'));

  // Empty state
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Buchungen gefunden</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {hasFilters
            ? 'Versuche, deine Filter anzupassen oder die Suche zu ändern.'
            : 'Neue Buchungen werden hier automatisch angezeigt, sobald Kunden buchen.'}
        </p>
      </div>
    );
  }

  // Group bookings by date
  const groupedBookings = groupBookingsByDate(bookings);

  // Sort groups: HEUTE, MORGEN, future dates (ascending), then ÄLTERE ANFRAGEN
  const sortedGroupKeys = Array.from(groupedBookings.keys()).sort((a, b) => {
    if (a.startsWith('HEUTE')) return -1;
    if (b.startsWith('HEUTE')) return 1;
    if (a.startsWith('MORGEN')) return -1;
    if (b.startsWith('MORGEN')) return 1;
    if (a === 'ÄLTERE ANFRAGEN') return 1;
    if (b === 'ÄLTERE ANFRAGEN') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {sortedGroupKeys.map((groupKey) => {
        const groupBookings = groupedBookings.get(groupKey)!;

        return (
          <div key={groupKey} className="space-y-3">
            {/* Date Group Header - iOS-inspired minimal style */}
            <div className="pt-4 pb-1 px-1">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                {groupKey}
              </p>
            </div>

            {/* Bookings in this date group */}
            <div className="space-y-3">
              {groupBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  id={booking.id}
                  customerName={booking.customerName}
                  customerEmail={booking.customerEmail}
                  customerPhone={booking.customerPhone}
                  serviceName={booking.service?.name ?? null}
                  dateTime={booking.preferredDateTime}
                  status={booking.status}
                  message={booking.message}
                  createdAt={booking.createdAt}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
