/**
 * Default timezone for MVP (Germany-based studios)
 */
export const DEFAULT_TIMEZONE = 'Europe/Berlin';

/**
 * Common timezones for quick reference
 */
export const COMMON_TIMEZONES = [
  'Europe/Berlin',
  'Europe/Vienna',
  'Europe/Zurich',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

/**
 * Slot grid interval in minutes
 */
export const SLOT_INTERVAL_MINUTES = 15;

/**
 * Maximum timezone identifier length (DoS prevention)
 */
export const MAX_TIMEZONE_LENGTH = 50;

/**
 * Minimum booking window (hours in advance)
 * Set to 0 to allow booking any slot in the future
 * TODO: Consider increasing to 0.5-1 hour for production
 */
export const MIN_BOOKING_HOURS_AHEAD = 0; // No minimum - any future slot can be booked

/**
 * Maximum booking window (years in advance)
 */
export const MAX_BOOKING_YEARS_AHEAD = 1;
