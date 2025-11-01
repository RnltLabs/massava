/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Week View Component
 * Shows 7-day horizontal scrollable week view
 */

'use client';

import React from 'react';
import { NewBooking, Service, User, BookingStatus } from '@/app/generated/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parse, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

type BookingWithRelations = NewBooking & {
  service: Service | null;
  customer: Pick<User, 'name' | 'email' | 'phone'> | null;
};

interface WeekViewProps {
  locale: string;
  bookings: BookingWithRelations[];
  selectedDate: Date;
  studioId: string;
}

export function WeekView({
  locale,
  bookings,
  selectedDate,
  studioId,
}: WeekViewProps): React.JSX.Element {
  // Get week start (Monday)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1, locale: de });

  // Generate 7 days
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group bookings by date
  const bookingsByDate = new Map<string, BookingWithRelations[]>();
  bookings.forEach((booking) => {
    const dateKey = booking.preferredDate;
    if (!bookingsByDate.has(dateKey)) {
      bookingsByDate.set(dateKey, []);
    }
    bookingsByDate.get(dateKey)!.push(booking);
  });

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate.get(dateKey) || [];
          const isToday = isSameDay(day, today);

          return (
            <Card
              key={dateKey}
              className={cn(
                'transition-all',
                isToday && 'border-primary border-2'
              )}
            >
              <CardContent className="p-4">
                {/* Day Header */}
                <div className="text-center mb-3">
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE', { locale: de })}
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      isToday ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'MMM', { locale: de })}
                  </div>
                </div>

                {/* Bookings Count */}
                {dayBookings.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-center text-muted-foreground mb-2">
                      {dayBookings.length} {dayBookings.length === 1 ? 'Termin' : 'Termine'}
                    </div>
                    {dayBookings.map((booking) => {
                      const isPending = booking.status === BookingStatus.PENDING;
                      const isConfirmed = booking.status === BookingStatus.CONFIRMED;

                      return (
                        <div
                          key={booking.id}
                          className={cn(
                            'p-2 rounded-lg text-xs space-y-1',
                            isPending && 'bg-orange-100 dark:bg-orange-900/20',
                            isConfirmed && 'bg-green-100 dark:bg-green-900/20'
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">{booking.preferredTime}</span>
                          </div>
                          <div className="truncate">{booking.customerName}</div>
                          {booking.service && (
                            <div className="truncate text-muted-foreground text-[10px]">
                              {booking.service.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    Keine Termine
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-muted-foreground">Reserviert</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Bestätigt</span>
        </div>
      </div>
    </div>
  );
}
