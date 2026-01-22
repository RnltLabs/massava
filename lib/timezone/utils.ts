/**
 * Timezone conversion utilities
 *
 * Uses date-fns-tz for robust timezone handling
 * All timezone strings are validated before use (SECURITY)
 */

import { toZonedTime, fromZonedTime, format, formatInTimeZone } from 'date-fns-tz';
import type { Locale } from 'date-fns';
import { validateTimezoneOrThrow } from './validation';
import type { OpeningHours } from './types';

/**
 * Convert a date from one timezone to another
 *
 * SECURITY: Validates both timezones before conversion
 *
 * @param date - Date to convert
 * @param fromTimezone - Source timezone (IANA)
 * @param toTimezone - Target timezone (IANA)
 * @returns Date in target timezone
 *
 * @throws Error if timezones are invalid
 *
 * @example
 * // Convert 10:00 Berlin time to New York time
 * convertTimezone(
 *   new Date('2025-12-01T10:00:00'),
 *   'Europe/Berlin',
 *   'America/New_York'
 * )
 */
export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date {
  validateTimezoneOrThrow(fromTimezone);
  validateTimezoneOrThrow(toTimezone);

  // Convert to UTC first (from source timezone)
  const utcDate = fromZonedTime(date, fromTimezone);

  // Then to target timezone
  return toZonedTime(utcDate, toTimezone);
}

/**
 * Get current date/time in specific timezone
 *
 * Note: Returns a Date object representing the current instant.
 * Use formatInTimezone() to display it in the specified timezone.
 *
 * @param timezone - IANA timezone (validated but not used in return value)
 * @returns Current date (same as new Date())
 *
 * @throws Error if timezone is invalid
 *
 * @example
 * const now = nowInTimezone('Europe/Berlin');
 * formatInTimezone(now, 'Europe/Berlin', 'HH:mm') // Shows Berlin time
 */
export function nowInTimezone(timezone: string): Date {
  validateTimezoneOrThrow(timezone);
  // JavaScript Date objects are always stored as UTC timestamps
  // The timezone only matters when formatting/displaying
  return new Date();
}

/**
 * Format date in specific timezone
 *
 * @param date - Date to format
 * @param timezone - IANA timezone
 * @param formatStr - date-fns format string (default: 'yyyy-MM-dd HH:mm')
 * @param options - Additional options including locale
 * @returns Formatted date string
 *
 * @throws Error if timezone is invalid
 *
 * @example
 * import { de } from 'date-fns/locale';
 *
 * formatInTimezone(
 *   new Date('2025-12-01T10:00:00Z'),
 *   'Europe/Berlin',
 *   'EEEE, d. MMMM yyyy',
 *   { locale: de }
 * )
 * // "Montag, 1. Dezember 2025"
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string = 'yyyy-MM-dd HH:mm',
  options?: { locale?: Locale }
): string {
  validateTimezoneOrThrow(timezone);
  return formatInTimeZone(date, timezone, formatStr, options);
}

// Re-export Locale type for convenience
export type { Locale };

/**
 * Get timezone offset for a date (e.g., "+01:00", "-05:00")
 *
 * Useful for displaying timezone information to users
 *
 * @param timezone - IANA timezone
 * @param date - Date to get offset for (default: now)
 * @returns Offset string in ISO 8601 format
 *
 * @throws Error if timezone is invalid
 *
 * @example
 * getTimezoneOffset('Europe/Berlin')
 * // "+01:00" (winter) or "+02:00" (summer)
 *
 * getTimezoneOffset('America/New_York')
 * // "-05:00" (winter) or "-04:00" (summer)
 */
export function getTimezoneOffset(
  timezone: string,
  date: Date = new Date()
): string {
  validateTimezoneOrThrow(timezone);
  return formatInTimeZone(date, timezone, 'XXX');
}

/**
 * Get timezone abbreviation (e.g., "CET", "EST", "PST")
 *
 * @param timezone - IANA timezone
 * @param date - Date to get abbreviation for (default: now)
 * @returns Timezone abbreviation
 *
 * @throws Error if timezone is invalid
 *
 * @example
 * getTimezoneAbbreviation('Europe/Berlin')
 * // "CET" (winter) or "CEST" (summer)
 */
export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date()
): string {
  validateTimezoneOrThrow(timezone);
  return formatInTimeZone(date, timezone, 'zzz');
}

/**
 * Convert UTC date to studio's local timezone
 *
 * @param utcDate - Date in UTC
 * @param studioTimezone - Studio's IANA timezone
 * @returns Date in studio's local time
 *
 * @throws Error if timezone is invalid
 */
export function toStudioLocalTime(utcDate: Date, studioTimezone: string): Date {
  validateTimezoneOrThrow(studioTimezone);
  return toZonedTime(utcDate, studioTimezone);
}

/**
 * Convert studio's local time to UTC
 *
 * @param localDate - Date in studio's local time
 * @param studioTimezone - Studio's IANA timezone
 * @returns Date in UTC
 *
 * @throws Error if timezone is invalid
 */
export function toUTC(localDate: Date, studioTimezone: string): Date {
  validateTimezoneOrThrow(studioTimezone);
  return fromZonedTime(localDate, studioTimezone);
}

/**
 * Check if a date is within business hours
 *
 * Converts the date to studio's local timezone and checks against opening hours
 *
 * @param date - Date to check (in any timezone)
 * @param openingHours - Opening hours object (from Studio.openingHours)
 * @param studioTimezone - Studio's timezone
 * @returns true if within business hours
 *
 * @throws Error if timezone is invalid
 *
 * @example
 * const openingHours = {
 *   monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
 *   // ... other days
 * }
 *
 * isWithinBusinessHours(
 *   new Date('2025-12-01T10:00:00Z'),
 *   openingHours,
 *   'Europe/Berlin'
 * )
 */
export function isWithinBusinessHours(
  date: Date,
  openingHours: OpeningHours,
  studioTimezone: string
): boolean {
  validateTimezoneOrThrow(studioTimezone);

  // Convert date to studio's local timezone
  const zonedDate = toZonedTime(date, studioTimezone);

  // Get day of week (lowercase: "monday", "tuesday", etc.)
  const dayOfWeek = formatInTimeZone(zonedDate, studioTimezone, 'EEEE')
    .toLowerCase() as keyof OpeningHours;

  const dayHours = openingHours[dayOfWeek];

  // If studio is closed that day, return false
  if (!dayHours || !dayHours.isOpen) {
    return false;
  }

  // Get time in HH:mm format
  const timeStr = formatInTimeZone(zonedDate, studioTimezone, 'HH:mm');
  const [hours, minutes] = timeStr.split(':').map(Number);
  const timeMinutes = hours * 60 + minutes;

  // Parse opening time
  const [openHour, openMin] = dayHours.openTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;

  // Parse closing time
  const [closeHour, closeMin] = dayHours.closeTime.split(':').map(Number);
  const closeMinutes = closeHour * 60 + closeMin;

  // Check if within opening hours (excluding close time)
  if (timeMinutes < openMinutes || timeMinutes >= closeMinutes) {
    return false;
  }

  // Check if within break time (if defined)
  if (dayHours.breakStart && dayHours.breakEnd) {
    const [breakStartHour, breakStartMin] = dayHours.breakStart
      .split(':')
      .map(Number);
    const breakStartMinutes = breakStartHour * 60 + breakStartMin;

    const [breakEndHour, breakEndMin] = dayHours.breakEnd.split(':').map(Number);
    const breakEndMinutes = breakEndHour * 60 + breakEndMin;

    if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a specific date is during Daylight Saving Time in given timezone
 *
 * @param timezone - IANA timezone
 * @param date - Date to check (default: now)
 * @returns true if DST is in effect
 *
 * @throws Error if timezone is invalid
 */
export function isDST(timezone: string, date: Date = new Date()): boolean {
  validateTimezoneOrThrow(timezone);

  // Get offset in January (winter) and July (summer)
  const january = new Date(date.getFullYear(), 0, 1);
  const july = new Date(date.getFullYear(), 6, 1);

  const janOffset = getTimezoneOffset(timezone, january);
  const julyOffset = getTimezoneOffset(timezone, july);

  // If offsets are different, timezone observes DST
  // Current date is in DST if its offset matches the summer offset
  if (janOffset === julyOffset) {
    return false; // No DST in this timezone
  }

  const currentOffset = getTimezoneOffset(timezone, date);
  return currentOffset === julyOffset;
}
