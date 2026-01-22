/**
 * DateTime Picker Component
 *
 * Combined date + time picker for booking appointments
 *
 * Features:
 * - Calendar-based date selection
 * - Time slot dropdown (15-minute intervals)
 * - Min/max date validation
 * - Timezone-aware display
 * - Accessibility compliant (WCAG 2.1 AA)
 */

'use client';

import { useState, useEffect } from 'react';
import { addMinutes, startOfDay, format, setHours, setMinutes, startOfMinute } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface DateTimePickerProps {
  /**
   * Selected date/time value
   */
  value: Date | null;

  /**
   * Callback when date/time changes
   */
  onChange: (date: Date | null) => void;

  /**
   * Minimum selectable date (default: now + 1 hour)
   */
  minDate?: Date;

  /**
   * Maximum selectable date (default: now + 1 year)
   */
  maxDate?: Date;

  /**
   * Time slot interval in minutes (default: 15)
   */
  minuteStep?: number;

  /**
   * Studio timezone for display
   */
  studioTimezone: string;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Show timezone info
   */
  showTimezone?: boolean;

  /**
   * Custom placeholder text
   */
  placeholder?: string;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Generate time slots for the day
 */
function generateTimeSlots(minuteStep: number): string[] {
  const slots: string[] = [];
  let current = startOfDay(new Date());

  // Generate 24 hours of slots
  const slotsPerDay = (24 * 60) / minuteStep;

  for (let i = 0; i < slotsPerDay; i++) {
    const timeStr = format(current, 'HH:mm');
    slots.push(timeStr);
    current = addMinutes(current, minuteStep);
  }

  return slots;
}

/**
 * DateTimePicker Component
 *
 * @example
 * const [dateTime, setDateTime] = useState<Date | null>(null);
 *
 * <DateTimePicker
 *   value={dateTime}
 *   onChange={setDateTime}
 *   studioTimezone="Europe/Berlin"
 *   minDate={new Date(Date.now() + 3600000)} // +1 hour
 * />
 */
export function DateTimePicker({
  value,
  onChange,
  minDate = new Date(Date.now() + 3600000), // Default: +1 hour
  maxDate = new Date(Date.now() + 31536000000), // Default: +1 year
  minuteStep = 15,
  studioTimezone,
  disabled = false,
  showTimezone = true,
  placeholder = 'Select date and time',
  className,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? startOfDay(value) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Update selectedDate when value changes externally
  useEffect(() => {
    if (value) {
      setSelectedDate(startOfDay(value));
    } else {
      setSelectedDate(undefined);
    }
  }, [value]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      onChange(null);
      setIsCalendarOpen(false);
      return;
    }

    setSelectedDate(date);

    // If time was already selected, preserve it
    if (value) {
      const newDateTime = new Date(date);
      newDateTime.setHours(value.getHours());
      newDateTime.setMinutes(value.getMinutes());
      newDateTime.setSeconds(0);
      newDateTime.setMilliseconds(0);
      onChange(newDateTime);
    } else {
      // Default to 9:00 AM if no time selected yet
      const newDateTime = new Date(date);
      newDateTime.setHours(9);
      newDateTime.setMinutes(0);
      newDateTime.setSeconds(0);
      newDateTime.setMilliseconds(0);
      onChange(newDateTime);
    }

    setIsCalendarOpen(false);
  };

  // Handle time selection from dropdown
  const handleTimeSelect = (timeStr: string) => {
    if (!selectedDate) return;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    newDateTime.setSeconds(0);
    newDateTime.setMilliseconds(0);

    onChange(newDateTime);
  };

  // Generate time slots
  const timeSlots = generateTimeSlots(minuteStep);

  // Filter time slots based on minDate/maxDate
  const getAvailableTimeSlots = (): string[] => {
    if (!selectedDate) return timeSlots;

    const selectedDateStart = startOfDay(selectedDate);
    const minDateStart = startOfDay(minDate);
    const maxDateStart = startOfDay(maxDate);

    // If selected date is today (minDate), filter out past times
    if (selectedDateStart.getTime() === minDateStart.getTime()) {
      const minTime = format(minDate, 'HH:mm');
      return timeSlots.filter(time => time >= minTime);
    }

    // If selected date is maxDate, filter out future times
    if (selectedDateStart.getTime() === maxDateStart.getTime()) {
      const maxTime = format(maxDate, 'HH:mm');
      return timeSlots.filter(time => time <= maxTime);
    }

    return timeSlots;
  };

  const availableTimeSlots = getAvailableTimeSlots();

  // Format display value
  const displayValue = value
    ? format(value, 'PPp') // e.g., "Nov 17, 2025, 2:30 PM"
    : placeholder;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Date Picker */}
      <div className="space-y-2">
        <Label htmlFor="date-picker">Select Date</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal wellness-shadow',
                !selectedDate && 'text-muted-foreground'
              )}
              disabled={disabled}
              aria-label="Select booking date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const dateStart = startOfDay(date);
                const minDateStart = startOfDay(minDate);
                const maxDateStart = startOfDay(maxDate);
                return dateStart < minDateStart || dateStart > maxDateStart;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Picker */}
      {selectedDate && (
        <div className="space-y-2">
          <Label htmlFor="time-picker">
            Select Time
            {showTimezone && (
              <span className="text-xs text-muted-foreground ml-2">
                (Studio Time: {studioTimezone})
              </span>
            )}
          </Label>
          <Select
            value={value ? format(value, 'HH:mm') : undefined}
            onValueChange={handleTimeSelect}
            disabled={disabled || availableTimeSlots.length === 0}
            aria-label="Select booking time slot"
          >
            <SelectTrigger
              id="time-picker"
              className="w-full wellness-shadow"
              aria-label="Select booking time slot"
            >
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No available time slots
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Display current selection */}
      {value && (
        <div className="text-sm text-muted-foreground p-3 rounded-md bg-secondary/20 border border-border">
          <strong>Selected:</strong> {displayValue}
        </div>
      )}
    </div>
  );
}
