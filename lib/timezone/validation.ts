/**
 * Timezone validation utilities
 *
 * SECURITY CRITICAL: Prevents injection attacks, prototype pollution, and DoS
 *
 * Critical Fixes Implemented:
 * - FIX #2: Timezone whitelist validation
 * - FIX #4: DateTime business rules validation
 */

import { addHours, addYears, isAfter, isBefore } from 'date-fns';
import type { DateTimeValidationResult } from './types';
import {
  MAX_TIMEZONE_LENGTH,
  SLOT_INTERVAL_MINUTES,
  MIN_BOOKING_HOURS_AHEAD,
  MAX_BOOKING_YEARS_AHEAD,
} from './constants';

/**
 * Cache of allowed IANA timezones
 * Generated once at module load time for performance
 *
 * Note: 'UTC' is a special case added for convenience,
 * though the canonical IANA name is 'Etc/UTC'
 */
const buildAllowedTimezones = (): Set<string> => {
  const timezones = new Set(Intl.supportedValuesOf('timeZone'));
  // Add UTC as an alias for convenience
  timezones.add('UTC');
  return timezones;
};

const ALLOWED_TIMEZONES = buildAllowedTimezones();

/**
 * SECURITY: Validate timezone identifier against IANA whitelist
 *
 * Prevents:
 * - Code injection attacks
 * - Prototype pollution
 * - Path traversal
 * - DoS attacks (length check)
 *
 * @param timezone - Timezone identifier to validate
 * @returns true if valid IANA timezone
 *
 * @example
 * isValidTimezone('Europe/Berlin') // true
 * isValidTimezone('../etc/passwd') // false
 * isValidTimezone('__proto__') // false
 */
export function isValidTimezone(timezone: string): boolean {
  // Type check
  if (typeof timezone !== 'string') {
    return false;
  }

  // Length check (DoS prevention)
  if (timezone.length === 0 || timezone.length > MAX_TIMEZONE_LENGTH) {
    return false;
  }

  // Format check (only alphanumeric, /, _, +, -)
  // This blocks path traversal (..), prototype pollution (__proto__), etc.
  if (!/^[A-Za-z/_+-]+$/.test(timezone)) {
    return false;
  }

  // Whitelist check (IANA timezones only)
  return ALLOWED_TIMEZONES.has(timezone);
}

/**
 * Validate timezone or throw error
 *
 * Use this in functions that must have valid timezone input
 *
 * @param timezone - Timezone identifier to validate
 * @throws Error if timezone is invalid
 *
 * @example
 * validateTimezoneOrThrow('Europe/Berlin') // OK
 * validateTimezoneOrThrow('Invalid/Zone') // throws
 */
export function validateTimezoneOrThrow(timezone: string): void {
  if (!isValidTimezone(timezone)) {
    throw new Error(
      `Invalid timezone: ${timezone}. Must be a valid IANA timezone identifier.`
    );
  }
}

/**
 * SECURITY: Validate booking date/time against business rules
 *
 * Business Rules:
 * - Must be at least 1 hour in the future
 * - Must be within 1 year from now
 * - Must be on 15-minute grid (00, 15, 30, 45)
 *
 * @param date - Date to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateBookingDateTime(new Date('2025-12-01T10:00:00Z'))
 * // { valid: true }
 *
 * validateBookingDateTime(new Date('2025-12-01T10:07:00Z'))
 * // { valid: false, error: 'Booking time must be on 15-minute intervals' }
 */
export function validateBookingDateTime(date: Date): DateTimeValidationResult {
  const now = new Date();
  const minFuture = addHours(now, MIN_BOOKING_HOURS_AHEAD);
  const maxFuture = addYears(now, MAX_BOOKING_YEARS_AHEAD);

  // Must be in future (at least 1 hour ahead)
  if (!isAfter(date, minFuture)) {
    return {
      valid: false,
      error: `Booking must be at least ${MIN_BOOKING_HOURS_AHEAD} hour(s) in the future`,
    };
  }

  // Must be within 1 year
  if (!isBefore(date, maxFuture)) {
    return {
      valid: false,
      error: `Booking must be within ${MAX_BOOKING_YEARS_AHEAD} year(s) from now`,
    };
  }

  // Must be on 15-minute grid
  const minutes = date.getMinutes();
  if (minutes % SLOT_INTERVAL_MINUTES !== 0) {
    return {
      valid: false,
      error: 'Booking time must be on 15-minute intervals (00, 15, 30, 45)',
    };
  }

  return { valid: true };
}

/**
 * Round date to nearest 15-minute slot grid
 *
 * Rounds DOWN to nearest slot (e.g., 10:07 -> 10:00, 10:32 -> 10:30)
 * Clears seconds and milliseconds
 *
 * @param date - Date to round
 * @returns New date rounded to slot grid
 *
 * @example
 * roundToSlotGrid(new Date('2025-12-01T10:07:32Z'))
 * // 2025-12-01T10:00:00Z
 *
 * roundToSlotGrid(new Date('2025-12-01T10:47:00Z'))
 * // 2025-12-01T10:45:00Z
 */
export function roundToSlotGrid(date: Date): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const remainder = minutes % SLOT_INTERVAL_MINUTES;

  if (remainder !== 0) {
    rounded.setMinutes(minutes - remainder);
  }

  rounded.setSeconds(0);
  rounded.setMilliseconds(0);

  return rounded;
}

/**
 * Check if a date falls on the slot grid
 *
 * @param date - Date to check
 * @returns true if minutes are 00, 15, 30, or 45
 */
export function isOnSlotGrid(date: Date): boolean {
  const minutes = date.getMinutes();
  return minutes % SLOT_INTERVAL_MINUTES === 0;
}

/**
 * Get list of all supported IANA timezones
 *
 * @returns Array of timezone identifiers
 */
export function getSupportedTimezones(): string[] {
  return Array.from(ALLOWED_TIMEZONES).sort();
}
