/**
 * Browser Timezone Utilities Tests
 *
 * Tests for GDPR-compliant browser timezone detection
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  getUserTimezone,
  formatInUserTimezone,
  getUserTimezoneOffset,
  getUserTimezoneAbbreviation,
  isTimezoneDifferent,
} from '@/lib/browser/timezone';

describe('Browser Timezone Utilities', () => {
  describe('getUserTimezone', () => {
    it('should return valid IANA timezone', () => {
      const timezone = getUserTimezone();

      // Should be a string
      expect(typeof timezone).toBe('string');

      // Should match IANA format (e.g., "America/New_York", "Europe/Berlin")
      expect(timezone).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$/);
    });

    it('should fallback to UTC on error', () => {
      // Mock Intl.DateTimeFormat to throw error
      const originalDateTimeFormat = Intl.DateTimeFormat;

      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => {
        throw new Error('Mock error');
      }) as any);

      const timezone = getUserTimezone();
      expect(timezone).toBe('UTC');

      // Restore original
      jest.restoreAllMocks();
    });
  });

  describe('formatInUserTimezone', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-11-17T14:30:00Z');
      const formatted = formatInUserTimezone(date, 'HH:mm');

      // Should be a string in HH:mm format
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should use default format PPp', () => {
      const date = new Date('2025-11-17T14:30:00Z');
      const formatted = formatInUserTimezone(date);

      // Should contain date and time
      expect(formatted).toContain('2025');
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time part
    });

    it('should format date in user timezone', () => {
      const date = new Date('2025-11-17T23:30:00Z');
      const formatted = formatInUserTimezone(date, 'yyyy-MM-dd HH:mm');

      // Should be a valid date string
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });
  });

  describe('getUserTimezoneOffset', () => {
    it('should return offset in ISO 8601 format', () => {
      const offset = getUserTimezoneOffset();

      // Should match +HH:MM or -HH:MM format
      expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/);
    });

    it('should return offset for specific date', () => {
      const summerDate = new Date('2025-07-01T12:00:00Z');
      const winterDate = new Date('2025-01-01T12:00:00Z');

      const summerOffset = getUserTimezoneOffset(summerDate);
      const winterOffset = getUserTimezoneOffset(winterDate);

      // Both should be valid offsets
      expect(summerOffset).toMatch(/^[+-]\d{2}:\d{2}$/);
      expect(winterOffset).toMatch(/^[+-]\d{2}:\d{2}$/);

      // In most timezones, summer and winter offsets differ (DST)
      // But we can't assert this for all timezones
    });
  });

  describe('getUserTimezoneAbbreviation', () => {
    it('should return timezone abbreviation', () => {
      const abbr = getUserTimezoneAbbreviation();

      // Should be a string (e.g., "CET", "EST", "PST")
      expect(typeof abbr).toBe('string');
      expect(abbr.length).toBeGreaterThan(0);
    });

    it('should return abbreviation for specific date', () => {
      const date = new Date('2025-07-01T12:00:00Z');
      const abbr = getUserTimezoneAbbreviation(date);

      expect(typeof abbr).toBe('string');
      expect(abbr.length).toBeGreaterThan(0);
    });
  });

  describe('isTimezoneDifferent', () => {
    it('should return false for same timezone', () => {
      const userTz = getUserTimezone();
      const result = isTimezoneDifferent(userTz);

      expect(result).toBe(false);
    });

    it('should return true for different timezone', () => {
      const userTz = getUserTimezone();

      // Pick a timezone that's definitely different
      const differentTz = userTz === 'America/New_York'
        ? 'Europe/Berlin'
        : 'America/New_York';

      const result = isTimezoneDifferent(differentTz);

      expect(result).toBe(true);
    });

    it('should handle UTC timezone', () => {
      const result = isTimezoneDifferent('UTC');

      // Should be boolean
      expect(typeof result).toBe('boolean');
    });
  });

  describe('GDPR Compliance', () => {
    it('should not send timezone to server', () => {
      // This test verifies that getUserTimezone is purely client-side
      // and doesn't make any network requests

      const fetchSpy = jest.spyOn(global, 'fetch');

      getUserTimezone();

      // Should not have called fetch
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should not store timezone in localStorage', () => {
      // Verify no localStorage usage
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      getUserTimezone();

      expect(setItemSpy).not.toHaveBeenCalled();

      setItemSpy.mockRestore();
    });
  });
});
