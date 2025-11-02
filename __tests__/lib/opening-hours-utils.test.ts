/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Opening Hours Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { generateClosedTimeBlocks, type OpeningHours } from '@/lib/opening-hours-utils';
import { format } from 'date-fns';

describe('generateClosedTimeBlocks', () => {
  const studioId = 'test-studio-id';

  it('should return empty array when no opening hours configured', () => {
    const date = new Date('2025-11-01T12:00:00'); // Friday
    const result = generateClosedTimeBlocks(date, null, studioId);
    expect(result).toEqual([]);
  });

  it('should block entire day when studio is closed', () => {
    const openingHours: OpeningHours = {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: null, // Closed on Wednesday
    };

    const wednesday = new Date('2025-11-05T12:00:00'); // Wednesday
    const result = generateClosedTimeBlocks(wednesday, openingHours, studioId);

    expect(result).toHaveLength(1);
    expect(result[0].isAllDay).toBe(true);
    expect(result[0].isVirtual).toBe(true);
    expect(result[0].reason).toBe('Geschlossen');
  });

  it('should block before and after opening hours', () => {
    const openingHours: OpeningHours = {
      everyday: { open: '09:00', close: '18:00' },
    };

    const date = new Date('2025-11-01T12:00:00');
    const result = generateClosedTimeBlocks(date, openingHours, studioId);

    expect(result).toHaveLength(2);

    // Before opening (00:00 - 09:00)
    const beforeBlock = result.find((block) => block.id.includes('before-open'));
    expect(beforeBlock).toBeDefined();
    expect(beforeBlock?.startTime.getHours()).toBe(0);
    expect(beforeBlock?.endTime.getHours()).toBe(9);
    expect(beforeBlock?.isVirtual).toBe(true);
    expect(beforeBlock?.isAllDay).toBe(false);

    // After closing (18:00 - 23:59)
    const afterBlock = result.find((block) => block.id.includes('after-close'));
    expect(afterBlock).toBeDefined();
    expect(afterBlock?.startTime.getHours()).toBe(18);
    expect(afterBlock?.endTime.getHours()).toBe(23);
    expect(afterBlock?.isVirtual).toBe(true);
    expect(afterBlock?.isAllDay).toBe(false);
  });

  it('should handle different hours per day', () => {
    const openingHours: OpeningHours = {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '10:00', close: '16:00' },
    };

    // Monday: 08:00-20:00
    const monday = new Date('2025-11-03T12:00:00');
    const mondayResult = generateClosedTimeBlocks(monday, openingHours, studioId);
    expect(mondayResult).toHaveLength(2);
    expect(mondayResult[0].endTime.getHours()).toBe(8); // Before 08:00
    expect(mondayResult[1].startTime.getHours()).toBe(20); // After 20:00

    // Tuesday: 10:00-16:00
    const tuesday = new Date('2025-11-04T12:00:00');
    const tuesdayResult = generateClosedTimeBlocks(tuesday, openingHours, studioId);
    expect(tuesdayResult).toHaveLength(2);
    expect(tuesdayResult[0].endTime.getHours()).toBe(10); // Before 10:00
    expect(tuesdayResult[1].startTime.getHours()).toBe(16); // After 16:00
  });

  it('should handle 24-hour opening (no blocks)', () => {
    const openingHours: OpeningHours = {
      everyday: { open: '00:00', close: '23:59' },
    };

    const date = new Date('2025-11-01T12:00:00');
    const result = generateClosedTimeBlocks(date, openingHours, studioId);

    // Should only have "after close" block for the last minute
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('should set correct studioId for all blocks', () => {
    const openingHours: OpeningHours = {
      everyday: { open: '09:00', close: '18:00' },
    };

    const date = new Date('2025-11-01T12:00:00');
    const result = generateClosedTimeBlocks(date, openingHours, studioId);

    result.forEach((block) => {
      expect(block.studioId).toBe(studioId);
    });
  });

  it('should generate unique IDs for different dates', () => {
    const openingHours: OpeningHours = {
      everyday: { open: '09:00', close: '18:00' },
    };

    const date1 = new Date('2025-11-01T12:00:00');
    const date2 = new Date('2025-11-02T12:00:00');

    const result1 = generateClosedTimeBlocks(date1, openingHours, studioId);
    const result2 = generateClosedTimeBlocks(date2, openingHours, studioId);

    const ids1 = result1.map((block) => block.id);
    const ids2 = result2.map((block) => block.id);

    // IDs should be different for different dates
    ids1.forEach((id) => {
      expect(ids2).not.toContain(id);
    });
  });
});
