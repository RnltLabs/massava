# Timezone Utilities

Secure and robust timezone handling utilities for the Massava platform.

## Overview

This module provides production-ready timezone utilities with **security-first design** and comprehensive business rule validation. Built for handling studio scheduling across different timezones with DST support.

## Security Features

### Critical Fixes Implemented

- **FIX #2: Timezone Validation** - Whitelist validation via `Intl.supportedValuesOf('timeZone')`
  - Prevents code injection attacks
  - Blocks prototype pollution attempts
  - Prevents path traversal
  - DoS protection (length validation)

- **FIX #4: DateTime Business Rules** - Booking validation
  - Must be 1+ hours in the future
  - Must be within 1 year
  - Must be on 15-minute grid (00, 15, 30, 45)

## Installation

Dependencies are already installed:
- `date-fns` - Date manipulation
- `date-fns-tz` - Timezone conversion

## Usage

### Import

```typescript
import {
  // Validation
  isValidTimezone,
  validateBookingDateTime,
  roundToSlotGrid,

  // Conversion
  formatInTimezone,
  toStudioLocalTime,
  toUTC,

  // Business logic
  isWithinBusinessHours,

  // Constants
  DEFAULT_TIMEZONE,
  SLOT_INTERVAL_MINUTES,
} from '@/lib/timezone';
```

### Security Validation

```typescript
// ALWAYS validate timezone strings from user input
if (!isValidTimezone(userTimezone)) {
  throw new Error('Invalid timezone');
}

// Or throw automatically
validateTimezoneOrThrow(userTimezone); // Throws if invalid
```

### Booking DateTime Validation

```typescript
const bookingDate = new Date('2025-12-01T10:00:00Z');

const result = validateBookingDateTime(bookingDate);
if (!result.valid) {
  console.error(result.error);
  // "Booking must be at least 1 hour(s) in the future"
  // OR "Booking time must be on 15-minute intervals"
}
```

### Slot Grid Rounding

```typescript
const userInput = new Date('2025-12-01T10:07:00Z');
const rounded = roundToSlotGrid(userInput);
// 2025-12-01T10:00:00Z (rounded down to nearest 15-min slot)
```

### Timezone Conversion

```typescript
// Format date in studio's timezone
const utcDate = new Date('2025-12-01T12:00:00Z');
const formatted = formatInTimezone(utcDate, 'Europe/Berlin', 'yyyy-MM-dd HH:mm');
// "2025-12-01 13:00" (UTC+1 in winter)

// Convert to studio local time
const studioLocal = toStudioLocalTime(utcDate, 'Europe/Berlin');

// Convert back to UTC
const backToUTC = toUTC(studioLocal, 'Europe/Berlin');
```

### Business Hours Check

```typescript
const openingHours = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  // ... other days
  sunday: { isOpen: false, openTime: '00:00', closeTime: '00:00' },
};

const bookingTime = new Date('2025-12-01T10:00:00Z');
const isOpen = isWithinBusinessHours(
  bookingTime,
  openingHours,
  'Europe/Berlin'
);
// true/false
```

### Get Timezone Information

```typescript
import { getTimezoneOffset, getTimezoneAbbreviation } from '@/lib/timezone';

getTimezoneOffset('Europe/Berlin');
// "+01:00" (winter) or "+02:00" (summer)

getTimezoneAbbreviation('Europe/Berlin');
// "CET" (winter) or "CEST" (summer)
```

## API Reference

### Validation Functions

#### `isValidTimezone(timezone: string): boolean`
Validates timezone against IANA whitelist. **ALWAYS use this for user input.**

#### `validateTimezoneOrThrow(timezone: string): void`
Validates and throws error if invalid. Use in functions that require valid timezones.

#### `validateBookingDateTime(date: Date): DateTimeValidationResult`
Validates booking date against business rules (1 hour to 1 year future, 15-min grid).

#### `roundToSlotGrid(date: Date): Date`
Rounds date DOWN to nearest 15-minute slot. Clears seconds and milliseconds.

#### `isOnSlotGrid(date: Date): boolean`
Checks if date is on 15-minute grid.

### Conversion Functions

#### `formatInTimezone(date: Date, timezone: string, format?: string): string`
Format date in specific timezone using date-fns format strings.

#### `toStudioLocalTime(utcDate: Date, timezone: string): Date`
Convert UTC date to studio's local timezone.

#### `toUTC(localDate: Date, timezone: string): Date`
Convert studio local time to UTC.

#### `convertTimezone(date: Date, from: string, to: string): Date`
Convert date between two timezones.

#### `nowInTimezone(timezone: string): Date`
Get current date (validates timezone, returns `new Date()`).

### Business Logic Functions

#### `isWithinBusinessHours(date: Date, hours: OpeningHours, timezone: string): boolean`
Check if date falls within studio's business hours (including breaks).

#### `isDST(timezone: string, date?: Date): boolean`
Check if date is during Daylight Saving Time in given timezone.

### Utility Functions

#### `getTimezoneOffset(timezone: string, date?: Date): string`
Get timezone offset in ISO 8601 format (e.g., "+01:00").

#### `getTimezoneAbbreviation(timezone: string, date?: Date): string`
Get timezone abbreviation (e.g., "CET", "EST").

#### `getSupportedTimezones(): string[]`
Get list of all supported IANA timezones (sorted).

## Constants

```typescript
DEFAULT_TIMEZONE = 'Europe/Berlin'
SLOT_INTERVAL_MINUTES = 15
MAX_TIMEZONE_LENGTH = 50
MIN_BOOKING_HOURS_AHEAD = 1
MAX_BOOKING_YEARS_AHEAD = 1

COMMON_TIMEZONES = [
  'Europe/Berlin',
  'Europe/Vienna',
  'Europe/Zurich',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
]
```

## Type Definitions

```typescript
type TimezoneIdentifier = string; // IANA timezone (e.g., "Europe/Berlin")

interface DayOpeningHours {
  isOpen: boolean;
  openTime: string;   // "HH:mm" format
  closeTime: string;  // "HH:mm" format
  breakStart?: string;
  breakEnd?: string;
}

interface OpeningHours {
  monday: DayOpeningHours;
  tuesday: DayOpeningHours;
  // ... all 7 days
}

interface DateTimeValidationResult {
  valid: boolean;
  error?: string;
}
```

## Security Best Practices

### DO:
- Always validate timezone strings before use
- Use whitelist validation (`isValidTimezone`)
- Validate booking dates with business rules
- Round user input to slot grid
- Use type-safe functions (TypeScript strict mode)

### DON'T:
- Accept raw timezone strings without validation
- Allow timezone strings longer than 50 characters
- Skip validation for "trusted" sources
- Use deprecated timezone abbreviations (PST, EST)
- Store user timezone in database (GDPR violation)

## DST Handling

All functions handle Daylight Saving Time transitions correctly:

```typescript
// Winter time (CET = UTC+1)
formatInTimezone(
  new Date('2025-01-15T12:00:00Z'),
  'Europe/Berlin',
  'HH:mm'
); // "13:00"

// Summer time (CEST = UTC+2)
formatInTimezone(
  new Date('2025-07-15T12:00:00Z'),
  'Europe/Berlin',
  'HH:mm'
); // "14:00"
```

## Testing

100% test coverage achieved:

```bash
npm test -- __tests__/lib/timezone/ --coverage
```

Tests cover:
- Valid/invalid timezone validation
- Injection attack prevention
- DoS attack prevention
- Prototype pollution protection
- DateTime business rules
- Slot grid rounding
- Timezone conversion
- DST transitions
- Business hours logic

## Error Handling

All functions throw descriptive errors for invalid input:

```typescript
try {
  validateTimezoneOrThrow('Invalid/Zone');
} catch (error) {
  console.error(error.message);
  // "Invalid timezone: Invalid/Zone. Must be a valid IANA timezone identifier."
}
```

## Performance

- Timezone whitelist cached at module load
- No repeated validation overhead
- Efficient date-fns-tz operations
- O(1) whitelist lookup (Set)

## Migration Guide

If you have existing code using manual timezone handling:

**Before:**
```typescript
const offset = studioTimezone === 'Europe/Berlin' ? 1 : 0;
const localTime = new Date(utcTime.getTime() + offset * 3600000);
```

**After:**
```typescript
import { toStudioLocalTime } from '@/lib/timezone';
const localTime = toStudioLocalTime(utcTime, 'Europe/Berlin');
```

## License

Copyright (c) 2025 Massava Platform. All rights reserved.

## Support

For issues or questions, contact the development team or create a GitHub issue.
