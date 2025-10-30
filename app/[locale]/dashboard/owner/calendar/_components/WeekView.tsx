/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Week View Component
 * 7-column week calendar grid with condensed booking blocks
 */

'use client';

import { format, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { getBusinessHours, calculateBlockPosition, createDateTime } from '@/lib/calendar-utils';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import type { NewBooking, Service, BlockedTime } from '@/app/generated/prisma';

type BookingWithService = NewBooking & {
  service: Service | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
};

interface WeekViewProps {
  weekStart: Date;
  bookings: BookingWithService[];
  blockedTimes: BlockedTime[];
  onBookingClick: (booking: BookingWithService) => void;
  onBlockedTimeClick: (blocked: BlockedTime) => void;
}

const SLOT_HEIGHT = 60; // 60px per hour
const TIME_LABEL_WIDTH = 64; // 64px for time labels
const DAY_COLUMN_MIN_WIDTH = 80; // Minimum width per day column

export function WeekView({
  weekStart,
  bookings,
  blockedTimes,
  onBookingClick,
  onBlockedTimeClick,
}: WeekViewProps): React.JSX.Element {
  const hours = getBusinessHours();

  // Generate 7 days (Monday - Sunday)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter bookings by day
  const getBookingsForDay = (day: Date): BookingWithService[] => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return bookings.filter((b) => b.preferredDate === dayStr);
  };

  // Filter blocked times by day
  const getBlockedTimesForDay = (day: Date): BlockedTime[] => {
    return blockedTimes.filter((b) => isSameDay(b.startTime, day));
  };

  // Get customer/service initials
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Check if today
  const isToday = (day: Date): boolean => {
    return isSameDay(day, new Date());
  };

  return (
    <div className="relative w-full bg-background overflow-x-auto">
      <div className="min-w-max">
        {/* Week Header */}
        <div className="sticky top-0 z-30 bg-background border-b">
          <div className="flex">
            {/* Empty corner for time label column */}
            <div style={{ width: `${TIME_LABEL_WIDTH}px` }} className="flex-shrink-0" />

            {/* Day headers */}
            {weekDays.map((day) => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 text-center py-3 border-l border-border/50 ${
                    today ? 'bg-primary/5' : ''
                  }`}
                  style={{ minWidth: `${DAY_COLUMN_MIN_WIDTH}px` }}
                >
                  <div className="text-xs text-muted-foreground font-medium">
                    {format(day, 'EEE', { locale: de })}
                  </div>
                  <div className={`text-lg font-semibold ${today ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd', { locale: de })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Grid */}
        <div className="relative">
          {hours.map((hour) => {
            const timeLabel = format(new Date().setHours(hour, 0, 0, 0), 'HH:mm');

            return (
              <div
                key={hour}
                className="flex border-b border-border/50"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                {/* Time Label */}
                <div
                  className="flex-shrink-0 flex items-start justify-end pr-3 pt-1 text-xs font-medium text-muted-foreground"
                  style={{ width: `${TIME_LABEL_WIDTH}px` }}
                >
                  {timeLabel}
                </div>

                {/* Day Columns */}
                {weekDays.map((day) => {
                  const today = isToday(day);
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={`flex-1 border-l border-border/50 relative ${
                        today ? 'bg-primary/5' : ''
                      }`}
                      style={{ minWidth: `${DAY_COLUMN_MIN_WIDTH}px` }}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Bookings & Blocked Times Container */}
          {weekDays.map((day, dayIndex) => {
            const dayBookings = getBookingsForDay(day);
            const dayBlockedTimes = getBlockedTimesForDay(day);
            const today = isToday(day);

            return (
              <div
                key={`blocks-${day.toISOString()}`}
                className="absolute top-0 pointer-events-none"
                style={{
                  left: `${TIME_LABEL_WIDTH + dayIndex * DAY_COLUMN_MIN_WIDTH}px`,
                  width: `${DAY_COLUMN_MIN_WIDTH}px`,
                  height: `${hours.length * SLOT_HEIGHT}px`,
                }}
              >
                {/* Render booking blocks */}
                {dayBookings.map((booking) => {
                  const startTime = createDateTime(booking.preferredDate, booking.preferredTime);
                  const durationMinutes = booking.service?.duration || 60;
                  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
                  const { top, height } = calculateBlockPosition(startTime, endTime);

                  const initials = booking.customerName
                    ? getInitials(booking.customerName)
                    : booking.service?.name
                    ? getInitials(booking.service.name)
                    : '?';

                  return (
                    <div
                      key={booking.id}
                      className="absolute left-0.5 right-0.5 bg-green-100 border border-green-500 rounded px-1 py-0.5 cursor-pointer hover:bg-green-200 transition-colors pointer-events-auto overflow-hidden"
                      style={{ top, height: `max(${height}, 30px)` }}
                      onClick={() => onBookingClick(booking)}
                      title={`${booking.customerName} - ${booking.service?.name || 'Service'}`}
                    >
                      <div className="text-[10px] font-semibold text-green-900 leading-tight">
                        {format(startTime, 'HH:mm')}
                      </div>
                      <div className="text-xs font-bold text-green-900 leading-tight">
                        {initials}
                      </div>
                    </div>
                  );
                })}

                {/* Render blocked time blocks */}
                {dayBlockedTimes.map((blocked) => {
                  const { top, height } = calculateBlockPosition(blocked.startTime, blocked.endTime);

                  return (
                    <div
                      key={blocked.id}
                      className="absolute left-0.5 right-0.5 bg-gray-200 border border-gray-400 rounded px-1 py-0.5 cursor-pointer hover:bg-gray-300 transition-colors pointer-events-auto overflow-hidden"
                      style={{ top, height: `max(${height}, 30px)` }}
                      onClick={() => onBlockedTimeClick(blocked)}
                      title={blocked.reason || 'Blocked'}
                    >
                      <div className="text-[10px] font-semibold text-gray-700 leading-tight">
                        {format(blocked.startTime, 'HH:mm')}
                      </div>
                      <div className="text-xs font-bold text-gray-700 leading-tight">🚫</div>
                    </div>
                  );
                })}

                {/* Current time indicator (only for today) */}
                {today && <CurrentTimeIndicator />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
