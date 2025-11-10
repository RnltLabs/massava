/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { BookingStatusBadge } from '@/components/business/BookingStatusBadge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, MailIcon, PhoneIcon, MessageSquareIcon } from 'lucide-react';
import { NewBooking, BookingStatus } from '@/app/generated/prisma';

interface BookingsListProps {
  userEmail: string;
  statusFilter?: string;
  searchQuery?: string;
}

async function getBookings(
  userEmail: string,
  statusFilter?: string,
  searchQuery?: string
): Promise<Array<NewBooking & { service: { name: string } | null }>> {
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

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-neutral-900">Keine Buchungen gefunden</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery || statusFilter
              ? 'Versuchen Sie, Ihre Filter anzupassen'
              : 'Neue Buchungen werden hier angezeigt'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              {/* Booking Info */}
              <div className="flex-1 space-y-4">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {booking.customerName}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MailIcon className="h-4 w-4" />
                      <span>{booking.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{booking.customerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Datum:</span>
                    <span className="text-muted-foreground">{booking.preferredDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Uhrzeit:</span>
                    <span className="text-muted-foreground">{booking.preferredTime}</span>
                  </div>
                </div>

                {/* Service */}
                {booking.service && (
                  <div className="text-sm">
                    <span className="font-medium">Service:</span>
                    <span className="ml-2 text-muted-foreground">{booking.service.name}</span>
                  </div>
                )}

                {/* Message */}
                {booking.message && (
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <div className="flex items-start gap-2">
                      <MessageSquareIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-neutral-700 mb-1">
                          Kundennachricht:
                        </p>
                        <p className="text-sm text-neutral-600">{booking.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking Date */}
                <p className="text-xs text-muted-foreground">
                  Angefragt am {new Date(booking.createdAt).toLocaleDateString('de-DE')} um{' '}
                  {new Date(booking.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-3">
                <BookingStatusBadge status={booking.status} />

                {booking.status === BookingStatus.PENDING && (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Button size="sm" className="w-full sm:w-auto">
                      Bestätigen
                    </Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      Ablehnen
                    </Button>
                  </div>
                )}

                {booking.status === BookingStatus.CONFIRMED && (
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    Kunde kontaktieren
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
