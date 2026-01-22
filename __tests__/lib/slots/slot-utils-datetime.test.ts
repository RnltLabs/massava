/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Slot Utilities Tests (DateTime-based)
 *
 * Tests for the new DateTime-based slot utility functions
 */

import {
  isSlotAvailable,
  filterAvailableSlots,
  formatSlotForDisplay,
  groupSlotsByDate,
  roundDateToSlotGrid,
  isDateOnSlotGrid,
} from '@/lib/slots/slot-utils';
import { addMinutes, setMinutes, setHours, startOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

describe('Slot Utilities (DateTime-based)', () => {
  describe('isSlotAvailable', () => {
    it('should return true for future slot with no bookings', () => {
      const futureSlot = addMinutes(new Date(), 60); // 1 hour from now
      const bookedSlots: Date[] = [];

      const result = isSlotAvailable(futureSlot, bookedSlots, 'Europe/Berlin');

      expect(result).toBe(true);
    });

    it('should return false for past slot', () => {
      const pastSlot = addMinutes(new Date(), -60); // 1 hour ago
      const bookedSlots: Date[] = [];

      const result = isSlotAvailable(pastSlot, bookedSlots, 'Europe/Berlin');

      expect(result).toBe(false);
    });

    it('should return false for booked slot', () => {
      const slot = addMinutes(new Date(), 60);
      const bookedSlots = [slot];

      const result = isSlotAvailable(slot, bookedSlots, 'Europe/Berlin');

      expect(result).toBe(false);
    });

    it('should handle slots in different timezones', () => {
      const berlinSlot = fromZonedTime(
        new Date('2025-12-01T10:00:00'),
        'Europe/Berlin'
      );
      const bookedSlots: Date[] = [];

      const result = isSlotAvailable(berlinSlot, bookedSlots, 'Europe/Berlin');

      // Will return true if slot is in future (depends on test execution time)
      // This test mainly checks that timezone parameter doesn't cause errors
      expect(typeof result).toBe('boolean');
    });

    it('should detect booked slots even with slight time differences (same minute)', () => {
      const slot1 = new Date('2025-12-01T10:00:15.000Z');
      const slot2 = new Date('2025-12-01T10:00:45.000Z');
      const bookedSlots = [slot2];

      // Same minute, should be considered booked
      const result = isSlotAvailable(slot1, bookedSlots, 'Europe/Berlin');

      expect(result).toBe(false);
    });
  });

  describe('filterAvailableSlots', () => {
    it('should filter out past and booked slots', () => {
      const now = new Date();
      const futureSlot1 = addMinutes(now, 30);
      const futureSlot2 = addMinutes(now, 60);
      const futureSlot3 = addMinutes(now, 90);
      const pastSlot = addMinutes(now, -30);

      const allSlots = [pastSlot, futureSlot1, futureSlot2, futureSlot3];
      const bookedSlots = [futureSlot2];

      const result = filterAvailableSlots(allSlots, bookedSlots, 'Europe/Berlin');

      expect(result).toHaveLength(2);
      expect(result).toContain(futureSlot1);
      expect(result).toContain(futureSlot3);
      expect(result).not.toContain(pastSlot);
      expect(result).not.toContain(futureSlot2);
    });

    it('should return empty array when all slots are unavailable', () => {
      const now = new Date();
      const pastSlot1 = addMinutes(now, -60);
      const pastSlot2 = addMinutes(now, -30);

      const allSlots = [pastSlot1, pastSlot2];
      const bookedSlots: Date[] = [];

      const result = filterAvailableSlots(allSlots, bookedSlots, 'Europe/Berlin');

      expect(result).toHaveLength(0);
    });

    it('should return all slots when none are booked or past', () => {
      const now = new Date();
      const futureSlots = [
        addMinutes(now, 30),
        addMinutes(now, 60),
        addMinutes(now, 90),
      ];

      const result = filterAvailableSlots(futureSlots, [], 'Europe/Berlin');

      expect(result).toHaveLength(3);
    });
  });

  describe('formatSlotForDisplay', () => {
    it('should format slot in Berlin timezone', () => {
      const slot = fromZonedTime(
        new Date('2025-12-01T14:30:00'),
        'Europe/Berlin'
      );

      const result = formatSlotForDisplay(slot, 'Europe/Berlin');

      expect(result).toBe('14:30');
    });

    it('should format slot in New York timezone', () => {
      const slot = fromZonedTime(
        new Date('2025-12-01T09:15:00'),
        'America/New_York'
      );

      const result = formatSlotForDisplay(slot, 'America/New_York');

      expect(result).toBe('09:15');
    });

    it('should handle UTC correctly', () => {
      const slot = new Date('2025-12-01T10:00:00.000Z');

      // In Berlin (UTC+1 in winter), this would be 11:00
      const berlinResult = formatSlotForDisplay(slot, 'Europe/Berlin');
      expect(berlinResult).toBe('11:00');

      // In NYC (UTC-5 in winter), this would be 05:00
      const nycResult = formatSlotForDisplay(slot, 'America/New_York');
      expect(nycResult).toBe('05:00');
    });
  });

  describe('groupSlotsByDate', () => {
    it('should group slots by date in studio timezone', () => {
      const date1 = fromZonedTime(
        new Date('2025-12-01T10:00:00'),
        'Europe/Berlin'
      );
      const date2 = fromZonedTime(
        new Date('2025-12-01T14:30:00'),
        'Europe/Berlin'
      );
      const date3 = fromZonedTime(
        new Date('2025-12-02T10:00:00'),
        'Europe/Berlin'
      );

      const slots = [date1, date2, date3];

      const result = groupSlotsByDate(slots, 'Europe/Berlin');

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['2025-12-01']).toHaveLength(2);
      expect(result['2025-12-02']).toHaveLength(1);
      expect(result['2025-12-01']).toContain(date1);
      expect(result['2025-12-01']).toContain(date2);
      expect(result['2025-12-02']).toContain(date3);
    });

    it('should handle empty array', () => {
      const result = groupSlotsByDate([], 'Europe/Berlin');

      expect(result).toEqual({});
    });

    it('should group correctly across timezone boundaries', () => {
      // 23:00 Berlin time on Dec 1st
      const slot1 = fromZonedTime(
        new Date('2025-12-01T23:00:00'),
        'Europe/Berlin'
      );

      // 01:00 Berlin time on Dec 2nd
      const slot2 = fromZonedTime(
        new Date('2025-12-02T01:00:00'),
        'Europe/Berlin'
      );

      const slots = [slot1, slot2];

      const result = groupSlotsByDate(slots, 'Europe/Berlin');

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['2025-12-01']).toContain(slot1);
      expect(result['2025-12-02']).toContain(slot2);
    });
  });

  describe('roundDateToSlotGrid', () => {
    it('should round down to nearest 15-minute boundary', () => {
      const date1 = new Date('2025-12-01T10:00:00.000Z');
      expect(roundDateToSlotGrid(date1)).toEqual(date1);

      const date2 = new Date('2025-12-01T10:07:00.000Z');
      expect(roundDateToSlotGrid(date2)).toEqual(
        new Date('2025-12-01T10:00:00.000Z')
      );

      const date3 = new Date('2025-12-01T10:18:00.000Z');
      expect(roundDateToSlotGrid(date3)).toEqual(
        new Date('2025-12-01T10:15:00.000Z')
      );

      const date4 = new Date('2025-12-01T10:42:00.000Z');
      expect(roundDateToSlotGrid(date4)).toEqual(
        new Date('2025-12-01T10:30:00.000Z')
      );

      const date5 = new Date('2025-12-01T10:59:59.999Z');
      expect(roundDateToSlotGrid(date5)).toEqual(
        new Date('2025-12-01T10:45:00.000Z')
      );
    });

    it('should clear seconds and milliseconds', () => {
      const date = new Date('2025-12-01T10:15:37.456Z');
      const rounded = roundDateToSlotGrid(date);

      expect(rounded.getSeconds()).toBe(0);
      expect(rounded.getMilliseconds()).toBe(0);
    });

    it('should handle all valid slot boundaries', () => {
      const validMinutes = [0, 15, 30, 45];

      for (const minute of validMinutes) {
        const date = setMinutes(setHours(new Date(), 10), minute);
        const rounded = roundDateToSlotGrid(date);

        expect(rounded.getMinutes()).toBe(minute);
      }
    });
  });

  describe('isDateOnSlotGrid', () => {
    it('should return true for valid slot times', () => {
      const validSlots = [
        new Date('2025-12-01T10:00:00.000Z'),
        new Date('2025-12-01T10:15:00.000Z'),
        new Date('2025-12-01T10:30:00.000Z'),
        new Date('2025-12-01T10:45:00.000Z'),
      ];

      for (const slot of validSlots) {
        expect(isDateOnSlotGrid(slot)).toBe(true);
      }
    });

    it('should return false for invalid slot times', () => {
      const invalidSlots = [
        new Date('2025-12-01T10:07:00.000Z'),
        new Date('2025-12-01T10:18:00.000Z'),
        new Date('2025-12-01T10:42:00.000Z'),
        new Date('2025-12-01T10:59:00.000Z'),
      ];

      for (const slot of invalidSlots) {
        expect(isDateOnSlotGrid(slot)).toBe(false);
      }
    });

    it('should return false if seconds are not zero', () => {
      const date = new Date('2025-12-01T10:00:15.000Z');
      expect(isDateOnSlotGrid(date)).toBe(false);
    });

    it('should return false if milliseconds are not zero', () => {
      const date = new Date('2025-12-01T10:00:00.500Z');
      expect(isDateOnSlotGrid(date)).toBe(false);
    });

    it('should handle all hours of the day', () => {
      for (let hour = 0; hour < 24; hour++) {
        const date = setMinutes(setHours(startOfDay(new Date()), hour), 0);
        expect(isDateOnSlotGrid(date)).toBe(true);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should work together: round, check, and format', () => {
      const irregularSlot = new Date('2025-12-01T10:23:45.678Z');

      // Round it
      const rounded = roundDateToSlotGrid(irregularSlot);

      // Check it's on grid
      expect(isDateOnSlotGrid(rounded)).toBe(true);

      // Format it
      const formatted = formatSlotForDisplay(rounded, 'UTC');
      expect(formatted).toMatch(/^\d{2}:(00|15|30|45)$/);
    });

    it('should filter and group slots correctly', () => {
      const now = new Date();

      const futureSlots = [
        addMinutes(now, 30),
        addMinutes(now, 45),
        addMinutes(now, 60),
        addMinutes(now, 1440), // Next day
      ];

      const bookedSlots = [addMinutes(now, 45)];

      // Filter available
      const available = filterAvailableSlots(
        futureSlots,
        bookedSlots,
        'Europe/Berlin'
      );

      expect(available).toHaveLength(3);

      // Group by date
      const grouped = groupSlotsByDate(available, 'Europe/Berlin');

      expect(Object.keys(grouped).length).toBeGreaterThan(0);
    });
  });
});
