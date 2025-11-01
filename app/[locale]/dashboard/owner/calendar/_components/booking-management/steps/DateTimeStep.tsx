/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Date/Time Step (Step 3/4)
 * Select date and time for booking
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useQuickAddBooking } from '../QuickAddBookingContext';
import { dateTimeStepSchema } from '../validation/bookingSchemas';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  duration: number;
}

interface DateTimeStepProps {
  studioId: string;
  services: Service[];
  initialDate?: Date;
}

export function DateTimeStep({ studioId, services, initialDate }: DateTimeStepProps): React.JSX.Element {
  const { state, setDate, setTime, goToNextStep, setErrors } = useQuickAddBooking();

  // Get selected service
  const selectedService = services.find((s) => s.id === state.formData.serviceId);

  // Initialize selectedDateTime from context or default
  const getInitialDateTime = (): Date | undefined => {
    if (state.formData.date && state.formData.time) {
      // Parse existing date + time from context
      try {
        const dateTimeString = `${state.formData.date} ${state.formData.time}`;
        return parse(dateTimeString, 'yyyy-MM-dd HH:mm', new Date());
      } catch {
        return undefined;
      }
    }
    return initialDate;
  };

  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(getInitialDateTime());

  // Handle date-time change from DateTimePicker
  const handleDateTimeChange = (dateTime: Date | undefined): void => {
    setSelectedDateTime(dateTime);
    setErrors({});

    if (dateTime) {
      // Convert Date to separate date and time strings
      const dateString = format(dateTime, 'yyyy-MM-dd');
      const timeString = format(dateTime, 'HH:mm');

      setDate(dateString);
      setTime(timeString);
    }
  };

  const handleContinue = (): void => {
    if (!selectedDateTime) {
      setErrors({
        date: 'Bitte wähle ein Datum und eine Uhrzeit',
      });
      return;
    }

    const dateString = format(selectedDateTime, 'yyyy-MM-dd');
    const timeString = format(selectedDateTime, 'HH:mm');

    const validation = dateTimeStepSchema.safeParse({
      date: dateString,
      time: timeString,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        date: fieldErrors.date?.[0] || '',
        time: fieldErrors.time?.[0] || '',
      });
      return;
    }

    goToNextStep();
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Calculate end time
  const calculateEndTime = (): string => {
    if (!selectedDateTime || !selectedService) return '';
    const endDate = new Date(selectedDateTime.getTime() + selectedService.duration * 60000);
    return format(endDate, 'HH:mm');
  };

  const endTime = calculateEndTime();
  const minDate = new Date(); // Today as minimum date

  return (
    <div className="space-y-6">
      {/* Icon & Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <CalendarIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Wann?</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Wähle Datum und Uhrzeit
          </p>
        </div>
      </div>

      {/* Date-Time Picker */}
      <div className="space-y-2">
        <DateTimePicker
          value={selectedDateTime}
          onChange={handleDateTimeChange}
          minDate={minDate}
          placeholder="Datum und Uhrzeit wählen..."
          className="h-14 text-base"
          showAnyDate={false}
        />
        {state.errors.date && (
          <p className="text-xs text-destructive" role="alert">
            {state.errors.date}
          </p>
        )}
        {state.errors.time && (
          <p className="text-xs text-destructive" role="alert">
            {state.errors.time}
          </p>
        )}
      </div>

      {/* Duration Info */}
      {selectedService && selectedDateTime && (
        <div className="p-4 bg-muted rounded-lg space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dauer:</span>
            <span className="font-medium">{formatDuration(selectedService.duration)}</span>
          </div>
          {endTime && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Endet um:</span>
              <span className="font-medium">{endTime}</span>
            </div>
          )}
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedDateTime}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter
      </Button>
    </div>
  );
}
