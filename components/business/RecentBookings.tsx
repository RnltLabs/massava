/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingStatusBadge } from '@/components/business/BookingStatusBadge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { NewBooking, BookingStatus } from '@/app/generated/prisma';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RecentBookingsProps {
  userEmail: string;
}

async function getRecentBookings(
  userEmail: string
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

  // Get recent bookings
  const bookings = await prisma.newBooking.findMany({
    where: {
      studioId,
    },
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
    take: 5,
  });

  return bookings;
}

export async function RecentBookings({ userEmail }: RecentBookingsProps): Promise<React.JSX.Element> {
  const bookings = await getRecentBookings(userEmail);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/business/bookings">
            View all
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{booking.customerName}</p>
                  <p className="text-sm text-muted-foreground">{booking.customerEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.service?.name ?? 'No service selected'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(booking.preferredDateTime, 'dd.MM.yyyy', { locale: de })} at{' '}
                    {format(booking.preferredDateTime, 'HH:mm')}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
