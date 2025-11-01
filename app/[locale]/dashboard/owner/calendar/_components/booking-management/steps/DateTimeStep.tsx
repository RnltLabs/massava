/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Date/Time Step (Step 3/4)
 * Select date and time for booking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuickAddBooking } from '../QuickAddBookingContext';
import { dateTimeStepSchema } from '../validation/bookingSchemas';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
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

  // Initialize with current date or initialDate
  const today = initialDate || new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  // Round current time to next 15-minute interval
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  now.setMinutes(roundedMinutes, 0, 0);
  const defaultTime = format(now, 'HH:mm');

  const [selectedDate, setSelectedDate] = useState(state.formData.date || todayString);
  const [selectedTime, setSelectedTime] = useState(state.formData.time || defaultTime);

  // Auto-save date and time to context when they change
  // Remove setDate/setTime from dependencies to prevent infinite loop
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedTime) {
      setTime(selectedTime);
    }
  }, [selectedTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedDate(e.target.value);
    setErrors({});
  };

  const handleTimeChange = (value: string): void => {
    setSelectedTime(value);
    setErrors({});
  };

  const handleContinue = (): void => {
    const validation = dateTimeStepSchema.safeParse({
      date: selectedDate,
      time: selectedTime,
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

  // Generate time options (08:00 - 20:00 in 15-minute increments)
  const generateTimeOptions = (): string[] => {
    const times: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 20 && minute > 0) break; // Stop at 20:00
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Calculate end time
  const calculateEndTime = (): string => {
    if (!selectedTime || !selectedService) return '';
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
    return format(endDate, 'HH:mm');
  };

  const endTime = calculateEndTime();

  return (
    <div className="space-y-6">
      {/* Icon & Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Wann?</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Wähle Datum und Uhrzeit
          </p>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <Label htmlFor="booking-date">Datum *</Label>
        <Input
          id="booking-date"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={todayString}
          className="h-12"
        />
        {state.errors.date && (
          <p className="text-xs text-destructive" role="alert">
            {state.errors.date}
          </p>
        )}
      </div>

      {/* Time Selection */}
      <div className="space-y-2">
        <Label htmlFor="booking-time">Uhrzeit *</Label>
        <Select value={selectedTime} onValueChange={handleTimeChange}>
          <SelectTrigger id="booking-time" className="h-12">
            <SelectValue placeholder="Uhrzeit wählen..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors.time && (
          <p className="text-xs text-destructive" role="alert">
            {state.errors.time}
          </p>
        )}
      </div>

      {/* Duration Info */}
      {selectedService && (
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
        disabled={!selectedDate || !selectedTime}
        style={{ backgroundColor: '#B56550' }}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter
      </Button>
    </div>
  );
}
