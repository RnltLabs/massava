/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Time Slot Grid Component
 * Mobile-first time-slot calendar grid (08:00 - 20:00)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { getBusinessHours, formatTimeSlot } from '@/lib/calendar-utils';
import { BookingBlock } from './BookingBlock';
import { BlockedTimeBlock } from './BlockedTimeBlock';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { CapacityBadge } from './CapacityBadge';
import type { NewBooking, Service, BlockedTime } from '@/app/generated/prisma';
import type { VirtualBlockedTime } from '@/lib/opening-hours-utils';

type BookingWithService = NewBooking & {
  service: Service | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
};

interface TimeSlotGridProps {
  bookings: BookingWithService[];
  blockedTimes: (BlockedTime | VirtualBlockedTime)[];
  studioCapacity: number;
  onSlotPress: (time: string) => void;
  onBookingClick: (booking: BookingWithService) => void;
  onBlockedTimeClick: (blocked: BlockedTime | VirtualBlockedTime) => void;
}

const SLOT_HEIGHT = 60; // 60px per hour
const TIME_LABEL_WIDTH = 64; // 64px for time labels

export function TimeSlotGrid({
  bookings,
  blockedTimes,
  studioCapacity,
  onSlotPress,
  onBookingClick,
  onBlockedTimeClick,
}: TimeSlotGridProps): React.JSX.Element {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [pressedSlot, setPressedSlot] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const hours = getBusinessHours();

  // Count bookings per timeslot
  const getBookingCountForTime = (timeSlot: string): number => {
    return bookings.filter((b) => b.preferredTime === timeSlot && b.status === 'CONFIRMED').length;
  };

  // Handle long press start
  const handleTouchStart = (timeSlot: string) => {
    setPressedSlot(timeSlot);
    const timer = setTimeout(() => {
      // Haptic feedback (if available)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      onSlotPress(timeSlot);
      setPressedSlot(null);
    }, 500); // 500ms = long press
    setLongPressTimer(timer);
  };

  // Handle touch/press end
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setPressedSlot(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div className="relative w-full bg-background">
      {/* Time Grid */}
      <div ref={gridRef} className="relative">
        {hours.map((hour) => {
          const timeSlot = formatTimeSlot(hour);
          const isPressed = pressedSlot === timeSlot;
          const bookingCount = getBookingCountForTime(timeSlot);

          return (
            <div
              key={hour}
              className="flex border-b border-border/50 last:border-b-0"
              style={{ height: `${SLOT_HEIGHT}px` }}
            >
              {/* Time Label */}
              <div
                className="flex-shrink-0 flex items-start justify-end pr-3 pt-1 text-sm font-medium text-muted-foreground"
                style={{ width: `${TIME_LABEL_WIDTH}px` }}
              >
                {timeSlot}
              </div>

              {/* Booking Area */}
              <div
                className={`flex-1 relative transition-colors ${
                  isPressed ? 'bg-primary/10' : 'hover:bg-muted/30'
                }`}
                onTouchStart={() => handleTouchStart(timeSlot)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(timeSlot)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                {/* Capacity Badge (top right) */}
                {bookingCount > 0 && (
                  <div className="absolute top-1 right-2 z-10">
                    <CapacityBadge current={bookingCount} max={studioCapacity} />
                  </div>
                )}
                {/* Grid line */}
                <div className="absolute inset-0 pointer-events-none" />
              </div>
            </div>
          );
        })}

        {/* Bookings Container (absolute positioned) */}
        <div
          className="absolute top-0 pointer-events-none"
          style={{
            left: `${TIME_LABEL_WIDTH}px`,
            right: 0,
            height: `${hours.length * SLOT_HEIGHT}px`,
          }}
        >
          {/* Render booking blocks */}
          {bookings.map((booking) => (
            <div key={booking.id} className="pointer-events-auto">
              <BookingBlock booking={booking} onClick={() => onBookingClick(booking)} />
            </div>
          ))}

          {/* Render blocked time blocks */}
          {blockedTimes.map((blocked) => (
            <div key={blocked.id} className="pointer-events-auto">
              <BlockedTimeBlock blocked={blocked} onClick={() => onBlockedTimeClick(blocked)} />
            </div>
          ))}

          {/* Current time indicator */}
          <CurrentTimeIndicator />
        </div>
      </div>
    </div>
  );
}
