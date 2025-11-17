/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Slot Utilities Tests
 */

import {
  normalizeToGrid,
  isOnGrid,
  getNextGridSlot,
  getPreviousGridSlot,
  generateDayTimeSlots,
  getTimeDifferenceMinutes,
  isTimeInRange,
  isValidTimeFormat,
  addMinutes,
  GRID_INTERVAL_MINUTES,
} from '@/lib/slots/slot-utils';

describe('Slot Utils', () => {
  describe('GRID_INTERVAL_MINUTES', () => {
    it('should be 15 minutes', () => {
      expect(GRID_INTERVAL_MINUTES).toBe(15);
    });
  });

  describe('normalizeToGrid', () => {
    it('should keep time on grid unchanged', () => {
      expect(normalizeToGrid('09:00')).toBe('09:00');
      expect(normalizeToGrid('09:15')).toBe('09:15');
      expect(normalizeToGrid('09:30')).toBe('09:30');
      expect(normalizeToGrid('09:45')).toBe('09:45');
    });

    it('should round down to nearest grid slot', () => {
      expect(normalizeToGrid('09:01')).toBe('09:00');
      expect(normalizeToGrid('09:07')).toBe('09:00');
      expect(normalizeToGrid('09:14')).toBe('09:00');
      expect(normalizeToGrid('09:16')).toBe('09:15');
      expect(normalizeToGrid('09:29')).toBe('09:15');
      expect(normalizeToGrid('09:31')).toBe('09:30');
      expect(normalizeToGrid('09:42')).toBe('09:30');
      expect(normalizeToGrid('09:59')).toBe('09:45');
    });

    it('should handle edge cases at day boundaries', () => {
      expect(normalizeToGrid('00:00')).toBe('00:00');
      expect(normalizeToGrid('00:07')).toBe('00:00');
      expect(normalizeToGrid('23:45')).toBe('23:45');
      expect(normalizeToGrid('23:59')).toBe('23:45');
    });

    it('should throw error for invalid time format', () => {
      expect(() => normalizeToGrid('9:00')).toThrow('Ungültiges Zeitformat');
      expect(() => normalizeToGrid('25:00')).toThrow('Ungültiges Zeitformat');
      expect(() => normalizeToGrid('09:60')).toThrow('Ungültiges Zeitformat');
      expect(() => normalizeToGrid('invalid')).toThrow('Ungültiges Zeitformat');
      expect(() => normalizeToGrid('09-00')).toThrow('Ungültiges Zeitformat');
    });
  });

  describe('isOnGrid', () => {
    it('should return true for times on grid', () => {
      expect(isOnGrid('09:00')).toBe(true);
      expect(isOnGrid('09:15')).toBe(true);
      expect(isOnGrid('09:30')).toBe(true);
      expect(isOnGrid('09:45')).toBe(true);
      expect(isOnGrid('00:00')).toBe(true);
      expect(isOnGrid('23:45')).toBe(true);
    });

    it('should return false for times not on grid', () => {
      expect(isOnGrid('09:01')).toBe(false);
      expect(isOnGrid('09:07')).toBe(false);
      expect(isOnGrid('09:14')).toBe(false);
      expect(isOnGrid('09:16')).toBe(false);
      expect(isOnGrid('09:29')).toBe(false);
      expect(isOnGrid('09:59')).toBe(false);
    });

    it('should return false for invalid time format', () => {
      expect(isOnGrid('9:00')).toBe(false);
      expect(isOnGrid('25:00')).toBe(false);
      expect(isOnGrid('invalid')).toBe(false);
    });
  });

  describe('getNextGridSlot', () => {
    it('should get next grid slot for times on grid', () => {
      expect(getNextGridSlot('09:00')).toBe('09:15');
      expect(getNextGridSlot('09:15')).toBe('09:30');
      expect(getNextGridSlot('09:30')).toBe('09:45');
      expect(getNextGridSlot('09:45')).toBe('10:00');
    });

    it('should get next grid slot for times not on grid', () => {
      expect(getNextGridSlot('09:01')).toBe('09:15');
      expect(getNextGridSlot('09:07')).toBe('09:15');
      expect(getNextGridSlot('09:16')).toBe('09:30');
      expect(getNextGridSlot('09:42')).toBe('09:45');
    });

    it('should handle day boundary wrap-around', () => {
      expect(getNextGridSlot('23:45')).toBe('00:00');
      expect(getNextGridSlot('23:59')).toBe('00:00');
    });

    it('should throw error for invalid time format', () => {
      expect(() => getNextGridSlot('invalid')).toThrow('Ungültiges Zeitformat');
    });
  });

  describe('getPreviousGridSlot', () => {
    it('should get previous grid slot for times on grid', () => {
      expect(getPreviousGridSlot('09:15')).toBe('09:00');
      expect(getPreviousGridSlot('09:30')).toBe('09:15');
      expect(getPreviousGridSlot('09:45')).toBe('09:30');
      expect(getPreviousGridSlot('10:00')).toBe('09:45');
    });

    it('should normalize down for times not on grid', () => {
      expect(getPreviousGridSlot('09:01')).toBe('09:00');
      expect(getPreviousGridSlot('09:07')).toBe('09:00');
      expect(getPreviousGridSlot('09:16')).toBe('09:15');
      expect(getPreviousGridSlot('09:42')).toBe('09:30');
    });

    it('should handle day boundary wrap-around', () => {
      expect(getPreviousGridSlot('00:00')).toBe('23:45');
      expect(getPreviousGridSlot('00:07')).toBe('00:00');
    });

    it('should throw error for invalid time format', () => {
      expect(() => getPreviousGridSlot('invalid')).toThrow('Ungültiges Zeitformat');
    });
  });

  describe('generateDayTimeSlots', () => {
    it('should generate all slots for a full day', () => {
      const slots = generateDayTimeSlots();
      expect(slots.length).toBe(96); // 24 hours * 4 slots per hour
      expect(slots[0]).toBe('00:00');
      expect(slots[slots.length - 1]).toBe('23:45');
    });

    it('should generate slots within custom range', () => {
      const slots = generateDayTimeSlots('09:00', '17:00');
      expect(slots.length).toBe(33); // 8 hours * 4 + 1
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('17:00');
    });

    it('should normalize start time to grid', () => {
      const slots = generateDayTimeSlots('09:07', '10:00');
      expect(slots[0]).toBe('09:00');
    });

    it('should include all grid increments', () => {
      const slots = generateDayTimeSlots('09:00', '10:00');
      expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00']);
    });

    it('should throw error for invalid time range', () => {
      expect(() => generateDayTimeSlots('invalid', '10:00')).toThrow('Ungültige Start- oder Endzeit');
      expect(() => generateDayTimeSlots('09:00', 'invalid')).toThrow('Ungültige Start- oder Endzeit');
    });
  });

  describe('getTimeDifferenceMinutes', () => {
    it('should calculate positive time difference', () => {
      expect(getTimeDifferenceMinutes('09:00', '10:00')).toBe(60);
      expect(getTimeDifferenceMinutes('09:00', '09:15')).toBe(15);
      expect(getTimeDifferenceMinutes('09:00', '09:45')).toBe(45);
      expect(getTimeDifferenceMinutes('09:00', '12:30')).toBe(210);
    });

    it('should calculate negative time difference', () => {
      expect(getTimeDifferenceMinutes('10:00', '09:00')).toBe(-60);
      expect(getTimeDifferenceMinutes('09:30', '09:00')).toBe(-30);
    });

    it('should return zero for same time', () => {
      expect(getTimeDifferenceMinutes('09:00', '09:00')).toBe(0);
    });

    it('should throw error for invalid time format', () => {
      expect(() => getTimeDifferenceMinutes('invalid', '10:00')).toThrow('Ungültige Zeit für Differenzberechnung');
      expect(() => getTimeDifferenceMinutes('09:00', 'invalid')).toThrow('Ungültige Zeit für Differenzberechnung');
    });
  });

  describe('isTimeInRange', () => {
    it('should return true for time within range', () => {
      expect(isTimeInRange('10:00', '09:00', '11:00')).toBe(true);
      expect(isTimeInRange('09:30', '09:00', '10:00')).toBe(true);
    });

    it('should return true for time at range boundaries', () => {
      expect(isTimeInRange('09:00', '09:00', '10:00')).toBe(true);
      expect(isTimeInRange('10:00', '09:00', '10:00')).toBe(true);
    });

    it('should return false for time outside range', () => {
      expect(isTimeInRange('08:59', '09:00', '10:00')).toBe(false);
      expect(isTimeInRange('10:01', '09:00', '10:00')).toBe(false);
    });

    it('should return false for invalid time format', () => {
      expect(isTimeInRange('invalid', '09:00', '10:00')).toBe(false);
      expect(isTimeInRange('10:00', 'invalid', '10:00')).toBe(false);
      expect(isTimeInRange('10:00', '09:00', 'invalid')).toBe(false);
    });
  });

  describe('isValidTimeFormat', () => {
    it('should return true for valid time format', () => {
      expect(isValidTimeFormat('00:00')).toBe(true);
      expect(isValidTimeFormat('09:30')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
      expect(isValidTimeFormat('12:00')).toBe(true);
    });

    it('should return false for invalid time format', () => {
      expect(isValidTimeFormat('9:00')).toBe(false);
      expect(isValidTimeFormat('09:0')).toBe(false);
      expect(isValidTimeFormat('25:00')).toBe(false);
      expect(isValidTimeFormat('09:60')).toBe(false);
      expect(isValidTimeFormat('invalid')).toBe(false);
      expect(isValidTimeFormat('09-00')).toBe(false);
      expect(isValidTimeFormat('')).toBe(false);
    });
  });

  describe('addMinutes', () => {
    it('should add positive minutes', () => {
      expect(addMinutes('09:00', 15)).toBe('09:15');
      expect(addMinutes('09:00', 30)).toBe('09:30');
      expect(addMinutes('09:00', 60)).toBe('10:00');
      expect(addMinutes('09:45', 15)).toBe('10:00');
      expect(addMinutes('09:30', 90)).toBe('11:00');
    });

    it('should subtract with negative minutes', () => {
      expect(addMinutes('09:00', -15)).toBe('08:45');
      expect(addMinutes('10:00', -60)).toBe('09:00');
      expect(addMinutes('09:15', -30)).toBe('08:45');
    });

    it('should handle day overflow', () => {
      expect(addMinutes('23:45', 15)).toBe('00:00');
      expect(addMinutes('23:30', 60)).toBe('00:30');
      expect(addMinutes('23:00', 90)).toBe('00:30');
    });

    it('should handle day underflow', () => {
      expect(addMinutes('00:00', -15)).toBe('23:45');
      expect(addMinutes('00:30', -60)).toBe('23:30');
      expect(addMinutes('01:00', -90)).toBe('23:30');
    });

    it('should handle large time additions', () => {
      expect(addMinutes('09:00', 1440)).toBe('09:00'); // +24 hours
      expect(addMinutes('09:00', 1500)).toBe('10:00'); // +25 hours
    });

    it('should throw error for invalid time format', () => {
      expect(() => addMinutes('invalid', 15)).toThrow('Ungültiges Zeitformat');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle midnight correctly', () => {
      expect(normalizeToGrid('00:00')).toBe('00:00');
      expect(isOnGrid('00:00')).toBe(true);
      expect(getNextGridSlot('00:00')).toBe('00:15');
      expect(getPreviousGridSlot('00:00')).toBe('23:45');
    });

    it('should handle end of day correctly', () => {
      expect(normalizeToGrid('23:59')).toBe('23:45');
      expect(isOnGrid('23:45')).toBe(true);
      expect(getNextGridSlot('23:45')).toBe('00:00');
      expect(getPreviousGridSlot('23:45')).toBe('23:30');
    });

    it('should handle noon correctly', () => {
      expect(normalizeToGrid('12:00')).toBe('12:00');
      expect(isOnGrid('12:00')).toBe(true);
      expect(getNextGridSlot('12:00')).toBe('12:15');
      expect(getPreviousGridSlot('12:00')).toBe('11:45');
    });
  });
});
