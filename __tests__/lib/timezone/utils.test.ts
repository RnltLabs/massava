/**
 * Timezone utilities tests
 *
 * Tests timezone conversion, formatting, and business hours logic
 */

import {
  convertTimezone,
  nowInTimezone,
  formatInTimezone,
  getTimezoneOffset,
  getTimezoneAbbreviation,
  toStudioLocalTime,
  toUTC,
  isWithinBusinessHours,
  isDST,
} from '@/lib/timezone/utils';
import type { OpeningHours } from '@/lib/timezone/types';

describe('Timezone Conversion', () => {
  describe('convertTimezone', () => {
    it('should convert between timezones correctly', () => {
      // Create a date at 10:00 in Berlin
      const berlinDate = new Date('2025-12-01T10:00:00');

      // Convert to New York time (UTC-5 in winter)
      // Berlin is UTC+1 in winter, so 10:00 Berlin = 04:00 NYC
      const nycDate = convertTimezone(
        berlinDate,
        'Europe/Berlin',
        'America/New_York'
      );

      // Check the hour (should be earlier)
      expect(nycDate.getHours()).toBeLessThan(berlinDate.getHours());
    });

    it('should handle UTC correctly', () => {
      const utcDate = new Date('2025-12-01T12:00:00Z');

      // Format the UTC date in Berlin timezone
      // Berlin is UTC+1 in winter, so 12:00 UTC = 13:00 Berlin
      const formatted = formatInTimezone(utcDate, 'Europe/Berlin', 'HH:mm');
      expect(formatted).toBe('13:00');
    });

    it('should throw on invalid source timezone', () => {
      expect(() =>
        convertTimezone(new Date(), 'Invalid/Zone', 'Europe/Berlin')
      ).toThrow();
    });

    it('should throw on invalid target timezone', () => {
      expect(() =>
        convertTimezone(new Date(), 'Europe/Berlin', 'Invalid/Zone')
      ).toThrow();
    });
  });

  describe('nowInTimezone', () => {
    it('should return current time in specified timezone', () => {
      const before = new Date();
      const berlinNow = nowInTimezone('Europe/Berlin');
      const nycNow = nowInTimezone('America/New_York');
      const after = new Date();

      // Both should be Date objects
      expect(berlinNow).toBeInstanceOf(Date);
      expect(nycNow).toBeInstanceOf(Date);

      // Should be between before and after (same instant, within test execution time)
      expect(berlinNow.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(berlinNow.getTime()).toBeLessThanOrEqual(after.getTime() + 100);

      expect(nycNow.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(nycNow.getTime()).toBeLessThanOrEqual(after.getTime() + 100);
    });

    it('should throw on invalid timezone', () => {
      expect(() => nowInTimezone('Invalid/Zone')).toThrow();
    });
  });

  describe('toStudioLocalTime & toUTC', () => {
    it('should convert UTC to studio local time', () => {
      const utcDate = new Date('2025-12-01T12:00:00Z');
      const berlinLocal = toStudioLocalTime(utcDate, 'Europe/Berlin');

      const formatted = formatInTimezone(
        berlinLocal,
        'Europe/Berlin',
        'HH:mm'
      );
      expect(formatted).toBe('13:00'); // UTC+1 in winter
    });

    it('should convert studio local time to UTC', () => {
      const berlinLocal = new Date('2025-12-01T13:00:00');
      const utcDate = toUTC(berlinLocal, 'Europe/Berlin');

      // Should be 12:00 UTC (1 hour behind)
      expect(utcDate.getUTCHours()).toBe(12);
    });

    it('should be reversible', () => {
      const original = new Date('2025-12-01T12:00:00Z');
      const local = toStudioLocalTime(original, 'Europe/Berlin');
      const backToUtc = toUTC(local, 'Europe/Berlin');

      // Should be very close (might differ by milliseconds due to rounding)
      const diff = Math.abs(original.getTime() - backToUtc.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });
});

describe('Timezone Formatting', () => {
  describe('formatInTimezone', () => {
    it('should format date in specified timezone', () => {
      const date = new Date('2025-12-01T12:00:00Z');

      const berlinFormatted = formatInTimezone(
        date,
        'Europe/Berlin',
        'yyyy-MM-dd HH:mm'
      );
      expect(berlinFormatted).toBe('2025-12-01 13:00'); // UTC+1

      const nycFormatted = formatInTimezone(
        date,
        'America/New_York',
        'yyyy-MM-dd HH:mm'
      );
      expect(nycFormatted).toBe('2025-12-01 07:00'); // UTC-5
    });

    it('should use default format if not specified', () => {
      const date = new Date('2025-12-01T12:00:00Z');
      const formatted = formatInTimezone(date, 'Europe/Berlin');

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('should support various date-fns format strings', () => {
      const date = new Date('2025-12-25T12:00:00Z');

      const formats = [
        { format: 'yyyy-MM-dd', expected: /^\d{4}-\d{2}-\d{2}$/ },
        { format: 'HH:mm:ss', expected: /^\d{2}:\d{2}:\d{2}$/ },
        { format: 'EEEE, MMMM d, yyyy', expected: /^\w+, \w+ \d{1,2}, \d{4}$/ },
      ];

      formats.forEach(({ format, expected }) => {
        const formatted = formatInTimezone(date, 'Europe/Berlin', format);
        expect(formatted).toMatch(expected);
      });
    });

    it('should throw on invalid timezone', () => {
      expect(() =>
        formatInTimezone(new Date(), 'Invalid/Zone', 'yyyy-MM-dd')
      ).toThrow();
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return correct offset for winter time', () => {
      const winterDate = new Date('2025-01-15T12:00:00Z');

      const berlinOffset = getTimezoneOffset('Europe/Berlin', winterDate);
      expect(berlinOffset).toBe('+01:00'); // CET

      const nycOffset = getTimezoneOffset('America/New_York', winterDate);
      expect(nycOffset).toBe('-05:00'); // EST
    });

    it('should return correct offset for summer time', () => {
      const summerDate = new Date('2025-07-15T12:00:00Z');

      const berlinOffset = getTimezoneOffset('Europe/Berlin', summerDate);
      expect(berlinOffset).toBe('+02:00'); // CEST

      const nycOffset = getTimezoneOffset('America/New_York', summerDate);
      expect(nycOffset).toBe('-04:00'); // EDT
    });

    it('should use current date if not specified', () => {
      const offset = getTimezoneOffset('Europe/Berlin');
      expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/);
    });

    it('should throw on invalid timezone', () => {
      expect(() => getTimezoneOffset('Invalid/Zone')).toThrow();
    });
  });

  describe('getTimezoneAbbreviation', () => {
    it('should return timezone abbreviation', () => {
      const winterDate = new Date('2025-01-15T12:00:00Z');
      const summerDate = new Date('2025-07-15T12:00:00Z');

      // Berlin abbreviations
      const berlinWinter = getTimezoneAbbreviation(
        'Europe/Berlin',
        winterDate
      );
      expect(berlinWinter).toMatch(/CET|GMT\+1/); // CET or fallback

      const berlinSummer = getTimezoneAbbreviation(
        'Europe/Berlin',
        summerDate
      );
      expect(berlinSummer).toMatch(/CEST|GMT\+2/); // CEST or fallback
    });

    it('should throw on invalid timezone', () => {
      expect(() => getTimezoneAbbreviation('Invalid/Zone')).toThrow();
    });
  });
});

describe('Business Hours', () => {
  const mockOpeningHours: OpeningHours = {
    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    wednesday: {
      isOpen: true,
      openTime: '09:00',
      closeTime: '18:00',
      breakStart: '12:00',
      breakEnd: '13:00',
    },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
    saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
    sunday: { isOpen: false, openTime: '00:00', closeTime: '00:00' },
  };

  describe('isWithinBusinessHours', () => {
    it('should return true for times within business hours', () => {
      // Monday at 10:00 Berlin time (within 09:00-18:00)
      const mondayMorning = new Date('2025-12-01T09:00:00Z'); // 10:00 Berlin (UTC+1)

      const result = isWithinBusinessHours(
        mondayMorning,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result).toBe(true);
    });

    it('should return false for times outside business hours', () => {
      // Monday at 08:00 Berlin time (before 09:00)
      const tooEarly = new Date('2025-12-01T07:00:00Z'); // 08:00 Berlin

      const result = isWithinBusinessHours(
        tooEarly,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result).toBe(false);
    });

    it('should return false for closed days', () => {
      // Sunday (closed)
      const sunday = new Date('2025-12-07T10:00:00Z'); // 11:00 Berlin on Sunday

      const result = isWithinBusinessHours(
        sunday,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result).toBe(false);
    });

    it('should return false during break times', () => {
      // Wednesday at 12:30 (during break 12:00-13:00)
      const duringBreak = new Date('2025-12-03T11:30:00Z'); // 12:30 Berlin

      const result = isWithinBusinessHours(
        duringBreak,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result).toBe(false);
    });

    it('should return true just before closing time', () => {
      // Monday at 17:30 (within 09:00-18:00)
      const beforeClose = new Date('2025-12-01T16:30:00Z'); // 17:30 Berlin

      const result = isWithinBusinessHours(
        beforeClose,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result).toBe(true);
    });

    it('should return false at exact closing time', () => {
      // Monday at 18:00 (closing time)
      const atClose = new Date('2025-12-01T17:00:00Z'); // 18:00 Berlin

      const result = isWithinBusinessHours(
        atClose,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result).toBe(false);
    });

    it('should handle different day schedules', () => {
      // Friday (09:00-20:00) at 19:00
      const fridayEvening = new Date('2025-12-05T18:00:00Z'); // 19:00 Berlin

      const result = isWithinBusinessHours(
        fridayEvening,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result).toBe(true);

      // Saturday (10:00-16:00) at 09:30
      const saturdayMorning = new Date('2025-12-06T08:30:00Z'); // 09:30 Berlin

      const result2 = isWithinBusinessHours(
        saturdayMorning,
        mockOpeningHours,
        'Europe/Berlin'
      );

      expect(result2).toBe(false);
    });

    it('should throw on invalid timezone', () => {
      expect(() =>
        isWithinBusinessHours(
          new Date(),
          mockOpeningHours,
          'Invalid/Zone'
        )
      ).toThrow();
    });
  });
});

describe('DST Detection', () => {
  describe('isDST', () => {
    it('should detect DST in summer for Europe/Berlin', () => {
      const summerDate = new Date('2025-07-15T12:00:00Z');
      expect(isDST('Europe/Berlin', summerDate)).toBe(true);
    });

    it('should detect no DST in winter for Europe/Berlin', () => {
      const winterDate = new Date('2025-01-15T12:00:00Z');
      expect(isDST('Europe/Berlin', winterDate)).toBe(false);
    });

    it('should detect DST in summer for America/New_York', () => {
      const summerDate = new Date('2025-07-15T12:00:00Z');
      expect(isDST('America/New_York', summerDate)).toBe(true);
    });

    it('should detect no DST in winter for America/New_York', () => {
      const winterDate = new Date('2025-01-15T12:00:00Z');
      expect(isDST('America/New_York', winterDate)).toBe(false);
    });

    it('should return false for timezones without DST', () => {
      const anyDate = new Date('2025-07-15T12:00:00Z');
      expect(isDST('Asia/Tokyo', anyDate)).toBe(false); // Japan has no DST
    });

    it('should throw on invalid timezone', () => {
      expect(() => isDST('Invalid/Zone')).toThrow();
    });
  });
});
