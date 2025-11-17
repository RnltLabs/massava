/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Opening Hours Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  convertToDbFormat,
  convertFromDbFormat,
  isValidTimeRange,
  formatTimeRange,
  generateTimeSlots,
  DEFAULT_DAY_HOURS,
  type OpeningHours,
} from '@/lib/types/opening-hours';

describe('Opening Hours Utilities', () => {
  describe('generateTimeSlots', () => {
    it('should generate time slots from 00:00 to 23:30', () => {
      const slots = generateTimeSlots();
      expect(slots.length).toBe(48); // 24 hours * 2 slots per hour
      expect(slots[0]).toBe('00:00');
      expect(slots[1]).toBe('00:30');
      expect(slots[slots.length - 1]).toBe('23:30');
    });

    it('should generate all slots in 30-minute intervals', () => {
      const slots = generateTimeSlots();
      expect(slots).toContain('09:00');
      expect(slots).toContain('09:30');
      expect(slots).toContain('12:00');
      expect(slots).toContain('18:00');
    });
  });

  describe('isValidTimeRange', () => {
    it('should validate that closing time is after opening time', () => {
      expect(isValidTimeRange('09:00', '18:00')).toBe(true);
      expect(isValidTimeRange('08:00', '20:00')).toBe(true);
    });

    it('should reject when closing time is before opening time', () => {
      expect(isValidTimeRange('18:00', '09:00')).toBe(false);
    });

    it('should reject when times are equal', () => {
      expect(isValidTimeRange('09:00', '09:00')).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      expect(isValidTimeRange('23:30', '00:00')).toBe(false);
      expect(isValidTimeRange('00:00', '23:30')).toBe(true);
    });
  });

  describe('formatTimeRange', () => {
    it('should format time range correctly', () => {
      expect(formatTimeRange('09:00', '18:00')).toBe('09:00 - 18:00');
      expect(formatTimeRange('08:30', '17:00')).toBe('08:30 - 17:00');
    });
  });

  describe('convertToDbFormat', () => {
    it('should convert open days to database format', () => {
      const hours: OpeningHours = {
        monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        wednesday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '10:00', closeTime: '17:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        saturday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
      };

      const dbFormat = convertToDbFormat(hours);

      expect(dbFormat.monday).toEqual({ open: '09:00', close: '18:00' });
      expect(dbFormat.tuesday).toEqual({ open: '09:00', close: '18:00' });
      expect(dbFormat.wednesday).toBeNull();
      expect(dbFormat.thursday).toEqual({ open: '10:00', close: '17:00' });
      expect(dbFormat.friday).toEqual({ open: '09:00', close: '18:00' });
      expect(dbFormat.saturday).toBeNull();
      expect(dbFormat.sunday).toBeNull();
    });

    it('should handle all days closed', () => {
      const hours: OpeningHours = {
        monday: { ...DEFAULT_DAY_HOURS },
        tuesday: { ...DEFAULT_DAY_HOURS },
        wednesday: { ...DEFAULT_DAY_HOURS },
        thursday: { ...DEFAULT_DAY_HOURS },
        friday: { ...DEFAULT_DAY_HOURS },
        saturday: { ...DEFAULT_DAY_HOURS },
        sunday: { ...DEFAULT_DAY_HOURS },
      };

      const dbFormat = convertToDbFormat(hours);

      expect(Object.values(dbFormat).every((v) => v === null)).toBe(true);
    });
  });

  describe('convertFromDbFormat', () => {
    it('should convert database format to OpeningHours', () => {
      const dbHours = {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: null,
        thursday: { open: '10:00', close: '17:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: null,
        sunday: null,
      };

      const hours = convertFromDbFormat(dbHours);

      expect(hours.monday.isOpen).toBe(true);
      expect(hours.monday.openTime).toBe('09:00');
      expect(hours.monday.closeTime).toBe('18:00');

      expect(hours.wednesday.isOpen).toBe(false);
      expect(hours.saturday.isOpen).toBe(false);

      expect(hours.thursday.openTime).toBe('10:00');
      expect(hours.thursday.closeTime).toBe('17:00');
    });

    it('should handle null/undefined database hours', () => {
      const hours = convertFromDbFormat(null);

      expect(hours.monday.isOpen).toBe(false);
      expect(hours.tuesday.isOpen).toBe(false);
      expect(hours.wednesday.isOpen).toBe(false);
    });

    it('should handle empty object', () => {
      const hours = convertFromDbFormat({});

      expect(hours.monday.isOpen).toBe(false);
      expect(hours.sunday.isOpen).toBe(false);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through conversion cycle', () => {
      const original: OpeningHours = {
        monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '08:30', closeTime: '17:30' },
        wednesday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
        saturday: { isOpen: true, openTime: '10:00', closeTime: '14:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
      };

      const dbFormat = convertToDbFormat(original);
      const restored = convertFromDbFormat(dbFormat);

      expect(restored.monday).toEqual(original.monday);
      expect(restored.tuesday).toEqual(original.tuesday);
      expect(restored.wednesday.isOpen).toBe(false);
      expect(restored.thursday).toEqual(original.thursday);
      expect(restored.friday).toEqual(original.friday);
      expect(restored.saturday).toEqual(original.saturday);
      expect(restored.sunday.isOpen).toBe(false);
    });
  });

  describe('Break times validation', () => {
    it('should validate break times are within opening hours', () => {
      const openTime = '09:00';
      const closeTime = '18:00';
      const breakStart = '12:00';
      const breakEnd = '13:00';

      expect(isValidTimeRange(openTime, breakStart)).toBe(true);
      expect(isValidTimeRange(breakStart, breakEnd)).toBe(true);
      expect(isValidTimeRange(breakEnd, closeTime)).toBe(true);
    });

    it('should reject invalid break times', () => {
      const breakStart = '13:00';
      const breakEnd = '12:00';

      expect(isValidTimeRange(breakStart, breakEnd)).toBe(false);
    });
  });
});
