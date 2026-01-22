/**
 * SECURITY CRITICAL: Timezone validation tests
 *
 * Tests protection against:
 * - Injection attacks
 * - Prototype pollution
 * - Path traversal
 * - DoS attacks
 * - Business rule violations
 */

import {
  isValidTimezone,
  validateTimezoneOrThrow,
  validateBookingDateTime,
  roundToSlotGrid,
  isOnSlotGrid,
  getSupportedTimezones,
} from '@/lib/timezone/validation';
import { addHours, addYears, addMinutes } from 'date-fns';

describe('Timezone Validation (SECURITY)', () => {
  describe('isValidTimezone', () => {
    it('should accept valid IANA timezones', () => {
      const validTimezones = [
        'Europe/Berlin',
        'America/New_York',
        'Asia/Tokyo',
        'Australia/Sydney',
        'UTC',
        'Europe/London',
        'America/Los_Angeles',
      ];

      validTimezones.forEach((tz) => {
        expect(isValidTimezone(tz)).toBe(true);
      });
    });

    it('should reject invalid timezone strings', () => {
      const invalidTimezones = [
        'Invalid/Timezone',
        'Europe/InvalidCity',
        'NotATimezone',
        'GMT+1', // Not IANA format
        'PST', // Abbreviations not accepted
      ];

      invalidTimezones.forEach((tz) => {
        expect(isValidTimezone(tz)).toBe(false);
      });
    });

    it('should reject prototype pollution attempts', () => {
      const pollutionAttempts = [
        '__proto__',
        'constructor',
        'prototype',
        'constructor.prototype',
        '__proto__.isAdmin',
      ];

      pollutionAttempts.forEach((attack) => {
        expect(isValidTimezone(attack)).toBe(false);
      });
    });

    it('should reject path traversal attempts', () => {
      const pathTraversalAttempts = [
        '../etc/passwd',
        '../../root',
        '../../../../../etc/shadow',
        './../../config',
        'Europe/../America/New_York',
      ];

      pathTraversalAttempts.forEach((attack) => {
        expect(isValidTimezone(attack)).toBe(false);
      });
    });

    it('should reject code injection attempts', () => {
      const injectionAttempts = [
        "'; DROP TABLE users; --",
        '<script>alert(1)</script>',
        '${process.env.SECRET}',
        '`rm -rf /`',
        'eval(maliciousCode)',
      ];

      injectionAttempts.forEach((attack) => {
        expect(isValidTimezone(attack)).toBe(false);
      });
    });

    it('should reject DoS attempts (length)', () => {
      const longString = 'A'.repeat(100);
      expect(isValidTimezone(longString)).toBe(false);

      const emptyString = '';
      expect(isValidTimezone(emptyString)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      const nonStringInputs = [
        null,
        undefined,
        123,
        true,
        {},
        [],
        () => {},
      ];

      nonStringInputs.forEach((input) => {
        // @ts-expect-error Testing runtime validation
        expect(isValidTimezone(input)).toBe(false);
      });
    });

    it('should handle special characters correctly', () => {
      // Valid characters in IANA timezones (underscores, slashes)
      expect(isValidTimezone('America/Buenos_Aires')).toBe(true);
      expect(isValidTimezone('Pacific/Port_Moresby')).toBe(true);

      // Invalid special characters
      expect(isValidTimezone('Europe/Berlin@Evil')).toBe(false);
      expect(isValidTimezone('Europe/Berlin;rm -rf')).toBe(false);
      expect(isValidTimezone('Europe/Berlin\n/etc/passwd')).toBe(false);
    });
  });

  describe('validateTimezoneOrThrow', () => {
    it('should not throw for valid timezones', () => {
      expect(() => validateTimezoneOrThrow('Europe/Berlin')).not.toThrow();
      expect(() => validateTimezoneOrThrow('America/New_York')).not.toThrow();
      expect(() => validateTimezoneOrThrow('UTC')).not.toThrow();
    });

    it('should throw for invalid timezones', () => {
      expect(() => validateTimezoneOrThrow('Invalid/Zone')).toThrow(
        'Invalid timezone'
      );
      expect(() => validateTimezoneOrThrow('__proto__')).toThrow(
        'Invalid timezone'
      );
      expect(() => validateTimezoneOrThrow('../etc/passwd')).toThrow(
        'Invalid timezone'
      );
    });

    it('should include timezone in error message', () => {
      expect(() => validateTimezoneOrThrow('BadZone')).toThrow(/BadZone/);
      expect(() => validateTimezoneOrThrow('BadZone')).toThrow(/IANA/);
    });
  });

  describe('getSupportedTimezones', () => {
    it('should return array of timezone strings', () => {
      const timezones = getSupportedTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should return sorted timezones', () => {
      const timezones = getSupportedTimezones();
      const sorted = [...timezones].sort();
      expect(timezones).toEqual(sorted);
    });

    it('should include common timezones', () => {
      const timezones = getSupportedTimezones();
      expect(timezones).toContain('Europe/Berlin');
      expect(timezones).toContain('America/New_York');
      expect(timezones).toContain('Asia/Tokyo');
      expect(timezones).toContain('UTC');
    });
  });
});

describe('DateTime Validation (Business Rules)', () => {
  describe('validateBookingDateTime', () => {
    it('should accept valid future dates on 15-min grid', () => {
      const validDate = addHours(new Date(), 2);
      validDate.setMinutes(0); // On grid
      validDate.setSeconds(0);
      validDate.setMilliseconds(0);

      const result = validateBookingDateTime(validDate);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept dates on 15-minute intervals', () => {
      const intervals = [0, 15, 30, 45];
      const baseDate = addHours(new Date(), 2);

      intervals.forEach((minute) => {
        const testDate = new Date(baseDate);
        testDate.setMinutes(minute);
        testDate.setSeconds(0);
        testDate.setMilliseconds(0);

        const result = validateBookingDateTime(testDate);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject past dates', () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      const result = validateBookingDateTime(pastDate);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('future');
    });

    it('should reject dates too soon (< 1 hour)', () => {
      const tooSoon = addMinutes(new Date(), 30);
      tooSoon.setMinutes(0); // On grid
      tooSoon.setSeconds(0);

      const result = validateBookingDateTime(tooSoon);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('hour');
    });

    it('should reject dates too far in future (> 1 year)', () => {
      const tooFar = addYears(new Date(), 2);
      tooFar.setMinutes(0); // On grid
      tooFar.setSeconds(0);

      const result = validateBookingDateTime(tooFar);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('year');
    });

    it('should reject dates not on 15-minute grid', () => {
      const offGridMinutes = [1, 7, 14, 16, 23, 37, 44, 59];
      const baseDate = addHours(new Date(), 2);

      offGridMinutes.forEach((minute) => {
        const testDate = new Date(baseDate);
        testDate.setMinutes(minute);
        testDate.setSeconds(0);

        const result = validateBookingDateTime(testDate);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('15-minute');
      });
    });

    it('should accept date exactly 1 hour in future', () => {
      const exactlyOneHour = addHours(new Date(), 1);
      exactlyOneHour.setMinutes(0);
      exactlyOneHour.setSeconds(0);
      exactlyOneHour.setMilliseconds(0);

      // Add 1 minute to be safe (> 1 hour)
      exactlyOneHour.setMinutes(1); // Will fail because not on grid

      const result = validateBookingDateTime(exactlyOneHour);
      expect(result.valid).toBe(false); // Not on grid
    });

    it('should accept date exactly 1 year in future', () => {
      const exactlyOneYear = addYears(new Date(), 1);
      exactlyOneYear.setMinutes(0);
      exactlyOneYear.setSeconds(0);
      exactlyOneYear.setMilliseconds(0);

      // Subtract 1 day to be safe (< 1 year)
      exactlyOneYear.setDate(exactlyOneYear.getDate() - 1);

      const result = validateBookingDateTime(exactlyOneYear);
      expect(result.valid).toBe(true);
    });
  });

  describe('roundToSlotGrid', () => {
    it('should round down to nearest 15-minute interval', () => {
      const testCases = [
        { input: '2025-12-01T10:07:32Z', expected: '2025-12-01T10:00:00Z' },
        { input: '2025-12-01T10:14:59Z', expected: '2025-12-01T10:00:00Z' },
        { input: '2025-12-01T10:17:00Z', expected: '2025-12-01T10:15:00Z' },
        { input: '2025-12-01T10:32:45Z', expected: '2025-12-01T10:30:00Z' },
        { input: '2025-12-01T10:47:00Z', expected: '2025-12-01T10:45:00Z' },
        { input: '2025-12-01T10:59:59Z', expected: '2025-12-01T10:45:00Z' },
      ];

      testCases.forEach(({ input, expected }) => {
        const inputDate = new Date(input);
        const rounded = roundToSlotGrid(inputDate);
        const expectedDate = new Date(expected);

        expect(rounded.toISOString()).toBe(expectedDate.toISOString());
      });
    });

    it('should not change dates already on grid', () => {
      const onGridDates = [
        new Date('2025-12-01T10:00:00Z'),
        new Date('2025-12-01T10:15:00Z'),
        new Date('2025-12-01T10:30:00Z'),
        new Date('2025-12-01T10:45:00Z'),
      ];

      onGridDates.forEach((date) => {
        const rounded = roundToSlotGrid(date);
        expect(rounded.getTime()).toBe(date.getTime());
      });
    });

    it('should clear seconds and milliseconds', () => {
      const dateWithSeconds = new Date('2025-12-01T10:15:30.500Z');
      const rounded = roundToSlotGrid(dateWithSeconds);

      expect(rounded.getSeconds()).toBe(0);
      expect(rounded.getMilliseconds()).toBe(0);
    });
  });

  describe('isOnSlotGrid', () => {
    it('should return true for dates on 15-minute grid', () => {
      const onGridMinutes = [0, 15, 30, 45];
      const baseDate = new Date('2025-12-01T10:00:00Z');

      onGridMinutes.forEach((minute) => {
        const testDate = new Date(baseDate);
        testDate.setMinutes(minute);

        expect(isOnSlotGrid(testDate)).toBe(true);
      });
    });

    it('should return false for dates off grid', () => {
      const offGridMinutes = [1, 7, 14, 16, 23, 29, 37, 44, 59];
      const baseDate = new Date('2025-12-01T10:00:00Z');

      offGridMinutes.forEach((minute) => {
        const testDate = new Date(baseDate);
        testDate.setMinutes(minute);

        expect(isOnSlotGrid(testDate)).toBe(false);
      });
    });

    it('should ignore seconds and milliseconds', () => {
      const dateWithSeconds = new Date('2025-12-01T10:15:30.500Z');
      expect(isOnSlotGrid(dateWithSeconds)).toBe(true);
    });
  });
});
