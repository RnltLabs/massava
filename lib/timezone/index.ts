/**
 * Timezone utilities module
 *
 * Provides secure timezone handling with:
 * - Whitelist validation (prevents injection attacks)
 * - Business rules validation (15-min grid, booking windows)
 * - Robust timezone conversion (date-fns-tz)
 * - DST support
 */

// Types
export type {
  TimezoneIdentifier,
  DayOpeningHours,
  OpeningHours,
  DateTimeValidationResult,
} from './types';

// Constants
export {
  DEFAULT_TIMEZONE,
  COMMON_TIMEZONES,
  SLOT_INTERVAL_MINUTES,
  MAX_TIMEZONE_LENGTH,
  MIN_BOOKING_HOURS_AHEAD,
  MAX_BOOKING_YEARS_AHEAD,
} from './constants';

// Validation (SECURITY CRITICAL)
export {
  isValidTimezone,
  validateTimezoneOrThrow,
  validateBookingDateTime,
  roundToSlotGrid,
  isOnSlotGrid,
  getSupportedTimezones,
} from './validation';

// Utilities
export {
  convertTimezone,
  nowInTimezone,
  formatInTimezone,
  getTimezoneOffset,
  getTimezoneAbbreviation,
  toStudioLocalTime,
  toUTC,
  isWithinBusinessHours,
  isDST,
} from './utils';
