/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Calendar Client Component
 * Main client-side calendar container with state management
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TimeSlotGrid } from './TimeSlotGrid';
import { WeekView } from './WeekView';
import { BlockTimeDialog } from './BlockTimeDialog';
import { BookingDetailSheet } from './BookingDetailSheet';
import { UnblockConfirmDialog } from './UnblockConfirmDialog';
import { addDays, subDays, addWeeks, subWeeks, format, startOfDay, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import type { NewBooking, Service, BlockedTime } from '@/app/generated/prisma';

type BookingWithService = NewBooking & {
  service: Service | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
};

interface CalendarClientProps {
  studioId: string;
  initialBookings: BookingWithService[];
  initialBlockedTimes: BlockedTime[];
  initialDate: Date;
  initialView?: 'day' | 'week';
}

export function CalendarClient({
  studioId,
  initialBookings,
  initialBlockedTimes,
  initialDate,
  initialView = 'day',
}: CalendarClientProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<'day' | 'week'>(initialView);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe view initialization
  useEffect(() => {
    setMounted(true);

    // Check localStorage preference first
    const savedView = localStorage.getItem('calendar-view-preference') as 'day' | 'week' | null;
    if (savedView) {
      setView(savedView);
      return;
    }

    // Default based on screen size (only after mount)
    if (window.innerWidth >= 1024) {
      setView('week');
    } else {
      setView('day');
    }
  }, []);

  // Save view preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendar-view-preference', view);
    }
  }, [view]);

  // Dialog states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>(undefined);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithService | null>(null);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [selectedBlocked, setSelectedBlocked] = useState<BlockedTime | null>(null);

  // Handle view toggle
  const handleViewChange = (newView: 'day' | 'week') => {
    setView(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`);
  };

  // Handle date navigation
  const handlePrevious = () => {
    const newDate = view === 'week' ? subWeeks(selectedDate, 1) : subDays(selectedDate, 1);
    setSelectedDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', format(newDate, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`);
  };

  const handleNext = () => {
    const newDate = view === 'week' ? addWeeks(selectedDate, 1) : addDays(selectedDate, 1);
    setSelectedDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', format(newDate, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`);
  };

  const handleToday = () => {
    const today = startOfDay(new Date());
    setSelectedDate(today);
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', format(today, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`);
  };

  // Handle long press on empty slot
  const handleSlotPress = (timeSlot: string) => {
    setPrefilledTime(timeSlot);
    setBlockDialogOpen(true);
  };

  // Handle booking click
  const handleBookingClick = (booking: BookingWithService) => {
    setSelectedBooking(booking);
    setBookingSheetOpen(true);
  };

  // Handle blocked time click
  const handleBlockedTimeClick = (blocked: BlockedTime) => {
    setSelectedBlocked(blocked);
    setUnblockDialogOpen(true);
  };

  // Calculate week start for week view
  const weekStartDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday

  // Filter bookings based on view
  const displayBookings = view === 'day'
    ? initialBookings.filter((booking) => booking.preferredDate === format(selectedDate, 'yyyy-MM-dd'))
    : initialBookings; // Week view shows all bookings (filtered by WeekView component)

  // Filter blocked times based on view
  const displayBlockedTimes = view === 'day'
    ? initialBlockedTimes.filter((blocked) => {
        const blockedDate = format(blocked.startTime, 'yyyy-MM-dd');
        return blockedDate === format(selectedDate, 'yyyy-MM-dd');
      })
    : initialBlockedTimes; // Week view shows all blocked times (filtered by WeekView component)

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Format date display (use initialView until mounted to prevent hydration mismatch)
  const currentView = mounted ? view : initialView;
  const dateDisplay = currentView === 'week'
    ? `${format(weekStartDate, 'd. MMM', { locale: de })} - ${format(addDays(weekStartDate, 6), 'd. MMM yyyy', { locale: de })}`
    : format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b pb-4">
        {/* View Toggle - Hidden on mobile, visible on tablet/desktop */}
        <div className="hidden sm:flex items-center justify-center gap-2 mb-4">
          <Button
            variant={currentView === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('day')}
          >
            Tag
          </Button>
          <Button
            variant={currentView === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('week')}
            className="hidden lg:inline-flex"
          >
            Woche
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            ←
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold">
              {dateDisplay}
            </h2>
            {!isToday && (
              <Button variant="outline" size="sm" onClick={handleToday}>
                Heute
              </Button>
            )}
          </div>

          <Button variant="outline" size="icon" onClick={handleNext}>
            →
          </Button>
        </div>

        {/* Summary - Only show in day view */}
        {currentView === 'day' && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{displayBookings.length} Buchung(en)</span>
            <span>•</span>
            <span>{displayBlockedTimes.length} Blockierung(en)</span>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {view === 'day' ? (
          <TimeSlotGrid
            bookings={displayBookings}
            blockedTimes={displayBlockedTimes}
            onSlotPress={handleSlotPress}
            onBookingClick={handleBookingClick}
            onBlockedTimeClick={handleBlockedTimeClick}
          />
        ) : (
          <WeekView
            weekStart={weekStartDate}
            bookings={initialBookings}
            blockedTimes={initialBlockedTimes}
            onBookingClick={handleBookingClick}
            onBlockedTimeClick={handleBlockedTimeClick}
          />
        )}
      </div>

      {/* Dialogs */}
      <BlockTimeDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        studioId={studioId}
        selectedDate={selectedDate}
        prefilledTime={prefilledTime}
      />

      <BookingDetailSheet
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
        booking={selectedBooking}
      />

      <UnblockConfirmDialog
        open={unblockDialogOpen}
        onOpenChange={setUnblockDialogOpen}
        blocked={selectedBlocked}
      />
    </div>
  );
}
