/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Calendar View Toggle
 * Switch between Week, Day, and Month views
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarViewToggleProps {
  locale: string;
  currentView: 'week' | 'day' | 'month';
  currentDate: Date;
}

export function CalendarViewToggle({
  locale,
  currentView,
  currentDate,
}: CalendarViewToggleProps): React.JSX.Element {
  const router = useRouter();

  const handleViewChange = (view: 'week' | 'day' | 'month'): void => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    router.push(`/${locale}/dashboard/owner/calendar?view=${view}&date=${dateStr}`);
  };

  const handlePrevious = (): void => {
    let newDate: Date;
    if (currentView === 'week') {
      newDate = subWeeks(currentDate, 1);
    } else if (currentView === 'day') {
      newDate = subDays(currentDate, 1);
    } else {
      newDate = subMonths(currentDate, 1);
    }
    const dateStr = format(newDate, 'yyyy-MM-dd');
    router.push(`/${locale}/dashboard/owner/calendar?view=${currentView}&date=${dateStr}`);
  };

  const handleNext = (): void => {
    let newDate: Date;
    if (currentView === 'week') {
      newDate = addWeeks(currentDate, 1);
    } else if (currentView === 'day') {
      newDate = addDays(currentDate, 1);
    } else {
      newDate = addMonths(currentDate, 1);
    }
    const dateStr = format(newDate, 'yyyy-MM-dd');
    router.push(`/${locale}/dashboard/owner/calendar?view=${currentView}&date=${dateStr}`);
  };

  const handleToday = (): void => {
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');
    router.push(`/${locale}/dashboard/owner/calendar?view=${currentView}&date=${dateStr}`);
  };

  // Format current date display
  let dateDisplay: string;
  if (currentView === 'week') {
    dateDisplay = format(currentDate, "'KW' ww, yyyy", { locale: de });
  } else if (currentView === 'day') {
    dateDisplay = format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de });
  } else {
    dateDisplay = format(currentDate, 'MMMM yyyy', { locale: de });
  }

  return (
    <div className="space-y-4">
      {/* View Type Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={currentView === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleViewChange('week')}
          className="flex-shrink-0"
        >
          Woche
        </Button>
        <Button
          variant={currentView === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleViewChange('day')}
          className="flex-shrink-0"
        >
          Tag
        </Button>
        <Button
          variant={currentView === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleViewChange('month')}
          className="flex-shrink-0"
        >
          Monat
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="text-sm md:text-base font-semibold text-foreground">
            {dateDisplay}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs"
          >
            Heute
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
