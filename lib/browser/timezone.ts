/**
 * Browser Timezone Utilities
 *
 * GDPR-Compliant timezone detection (client-side only)
 *
 * CRITICAL: User timezone is NEVER sent to server or stored in database.
 * Only used for local display in the browser.
 *
 * Security Notes:
 * - Uses Intl.DateTimeFormat API (built into browsers)
 * - No external dependencies
 * - No data sent to server
 * - GDPR Article 6(1)(f) - Legitimate Interest for UI display
 */

import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Get user's timezone from browser (GDPR-compliant, never sent to server)
 *
 * This is used ONLY for client-side display, NOT stored in database.
 *
 * @returns IANA timezone identifier (e.g., "America/New_York", "Europe/Berlin")
 *
 * @example
 * const userTz = getUserTimezone();
 * console.log(userTz); // "Europe/Berlin"
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect timezone:', error);
    return 'UTC'; // Fallback to UTC if detection fails
  }
}

/**
 * Format date in user's local timezone
 *
 * Client-side only, uses date-fns-tz
 *
 * @param date - Date to format
 * @param formatStr - date-fns format string (default: 'PPp' = "Nov 17, 2025, 2:30 PM")
 * @returns Formatted date string in user's timezone
 *
 * @example
 * const date = new Date('2025-11-17T14:30:00Z');
 * formatInUserTimezone(date); // "Nov 17, 2025, 2:30 PM" (in user's local time)
 * formatInUserTimezone(date, 'HH:mm'); // "14:30"
 */
export function formatInUserTimezone(
  date: Date,
  formatStr: string = 'PPp'
): string {
  const userTz = getUserTimezone();
  const zonedDate = toZonedTime(date, userTz);
  return format(zonedDate, formatStr);
}

/**
 * Get user's timezone offset (e.g., "+01:00", "-05:00")
 *
 * @param date - Date to get offset for (default: now)
 * @returns Offset string in ISO 8601 format
 *
 * @example
 * getUserTimezoneOffset(); // "+01:00" (if in CET)
 */
export function getUserTimezoneOffset(date: Date = new Date()): string {
  const userTz = getUserTimezone();

  try {
    // Use Intl.DateTimeFormat to get offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTz,
      timeZoneName: 'longOffset',
    });

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');

    if (offsetPart?.value) {
      // Convert "GMT+1" to "+01:00"
      const match = offsetPart.value.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const hours = match[1].padStart(3, '+0');
        const minutes = match[2] || '00';
        return `${hours}:${minutes}`;
      }
    }
  } catch (error) {
    console.error('Failed to get timezone offset:', error);
  }

  // Fallback: calculate offset manually
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get user's timezone abbreviation (e.g., "CET", "EST", "PST")
 *
 * @param date - Date to get abbreviation for (default: now)
 * @returns Timezone abbreviation
 *
 * @example
 * getUserTimezoneAbbreviation(); // "CET" (if in Europe/Berlin during winter)
 */
export function getUserTimezoneAbbreviation(date: Date = new Date()): string {
  const userTz = getUserTimezone();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTz,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');

    return timeZonePart?.value || userTz;
  } catch (error) {
    console.error('Failed to get timezone abbreviation:', error);
    return userTz;
  }
}

/**
 * Check if user's timezone differs from studio timezone
 *
 * @param studioTimezone - Studio's IANA timezone
 * @returns true if timezones differ
 *
 * @example
 * isTimezoneDifferent('Europe/Berlin'); // false (if user is in Berlin)
 * isTimezoneDifferent('America/New_York'); // true (if user is in Berlin)
 */
export function isTimezoneDifferent(studioTimezone: string): boolean {
  const userTz = getUserTimezone();
  return userTz !== studioTimezone;
}
