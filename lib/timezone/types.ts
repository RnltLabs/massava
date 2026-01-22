/**
 * IANA timezone identifier (e.g., "Europe/Berlin", "America/New_York")
 */
export type TimezoneIdentifier = string;

/**
 * Opening hours for a single day
 */
export interface DayOpeningHours {
  isOpen: boolean;
  openTime: string; // "HH:mm" format
  closeTime: string; // "HH:mm" format
  breakStart?: string;
  breakEnd?: string;
}

/**
 * Weekly opening hours structure
 */
export interface OpeningHours {
  monday: DayOpeningHours;
  tuesday: DayOpeningHours;
  wednesday: DayOpeningHours;
  thursday: DayOpeningHours;
  friday: DayOpeningHours;
  saturday: DayOpeningHours;
  sunday: DayOpeningHours;
}

/**
 * Validation result for date/time operations
 */
export interface DateTimeValidationResult {
  valid: boolean;
  error?: string;
}
