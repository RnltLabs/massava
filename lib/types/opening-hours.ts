/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Opening Hours Type Definitions
 */

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type DayHours = {
  isOpen: boolean;
  openTime: string;  // "09:00"
  closeTime: string; // "18:00"
  breakStart?: string; // "12:00"
  breakEnd?: string;   // "13:00"
};

export type OpeningHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

export const DEFAULT_DAY_HOURS: DayHours = {
  isOpen: false,
  openTime: '09:00',
  closeTime: '18:00',
};

export const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' },
];

/**
 * Generate time slots from 00:00 to 23:30 in 30min intervals
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

/**
 * Convert DayHours to database format
 */
export function convertToDbFormat(hours: OpeningHours): Record<string, { open: string; close: string } | null> {
  const result: Record<string, { open: string; close: string } | null> = {};

  for (const [day, dayHours] of Object.entries(hours)) {
    if (dayHours.isOpen) {
      result[day] = {
        open: dayHours.openTime,
        close: dayHours.closeTime,
      };
    } else {
      result[day] = null;
    }
  }

  return result;
}

/**
 * Convert from database format to DayHours
 */
export function convertFromDbFormat(
  dbHours: Record<string, { open: string; close: string } | null> | null | undefined
): OpeningHours {
  const defaultHours: OpeningHours = {
    monday: { ...DEFAULT_DAY_HOURS },
    tuesday: { ...DEFAULT_DAY_HOURS },
    wednesday: { ...DEFAULT_DAY_HOURS },
    thursday: { ...DEFAULT_DAY_HOURS },
    friday: { ...DEFAULT_DAY_HOURS },
    saturday: { ...DEFAULT_DAY_HOURS },
    sunday: { ...DEFAULT_DAY_HOURS },
  };

  if (!dbHours) {
    return defaultHours;
  }

  const result = { ...defaultHours };

  for (const [day, hours] of Object.entries(dbHours)) {
    if (hours && day in result) {
      result[day as DayOfWeek] = {
        isOpen: true,
        openTime: hours.open,
        closeTime: hours.close,
      };
    }
  }

  return result;
}

/**
 * Format hours for display (e.g., "09:00 - 18:00")
 */
export function formatTimeRange(openTime: string, closeTime: string): string {
  return `${openTime} - ${closeTime}`;
}

/**
 * Validate that closing time is after opening time
 */
export function isValidTimeRange(openTime: string, closeTime: string): boolean {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  return closeMinutes > openMinutes;
}
