/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingStatusBadge } from '@/components/business/BookingStatusBadge';
import { CalendarIcon, ClockIcon, UserIcon } from 'lucide-react';
import { Booking, BookingStatus } from '@/app/generated/prisma';

interface UpcomingAppointmentsProps {
  userEmail: string;
}

async function getUpcomingAppointments(
  userEmail: string
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

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get confirmed bookings for today and upcoming
  const bookings = await prisma.booking.findMany({
    where: {
      studioId,
      status: BookingStatus.CONFIRMED,
      createdAt: {
        gte: today,
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
    take: 5,
  });

  return bookings;
}

export async function UpcomingAppointments({
  userEmail,
}: UpcomingAppointmentsProps): Promise<React.JSX.Element> {
  const appointments = await getUpcomingAppointments(userEmail);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-neutral-50"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{appointment.customerName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{appointment.preferredDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{appointment.preferredTime}</p>
                  </div>
                  <p className="text-xs font-medium text-neutral-700">
                    {appointment.service?.name ?? 'No service selected'}
                  </p>
                </div>
                <BookingStatusBadge status={appointment.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
