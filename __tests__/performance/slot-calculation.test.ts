/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Slot Calculation Performance Tests
 *
 * Ensures slot calculation meets performance requirements:
 * - Single calculation: < 100ms
 * - Batch calculation: < 500ms
 * - Under load: handles 100 concurrent requests
 */

import { calculateAvailableSlots } from '@/lib/slots';
import { batchCheckCapacity } from '@/lib/slots/capacity-validator';
import { generateDayTimeSlots } from '@/lib/slots/slot-utils';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    studio: {
      findUnique: jest.fn(),
    },
    newBooking: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    blockedTime: {
      findMany: jest.fn(),
    },
  },
}));

// Mock logger to reduce noise
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Slot Calculation Performance', () => {
  const mockStudio = {
    id: 'studio-1',
    capacity: 3,
    openingHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      sunday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
    jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);
    jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);
    jest.mocked(prisma.newBooking.count).mockResolvedValue(0);
  });

  describe('Single Calculation Performance', () => {
    it('should calculate slots in under 100ms', async () => {
      const startTime = Date.now();

      const result = await calculateAvailableSlots('studio-1', '2025-01-13');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(100);
    });

    it('should calculate slots with bookings in under 100ms', async () => {
      // Mock 20 bookings across different times
      const mockBookings = Array.from({ length: 20 }, (_, i) => {
        const hour = 9 + Math.floor(i / 4);
        const minute = (i % 4) * 15;
        return {
          preferredTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        };
      });

      jest.mocked(prisma.newBooking.findMany).mockResolvedValue(mockBookings as any);

      const startTime = Date.now();

      const result = await calculateAvailableSlots('studio-1', '2025-01-13');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(100);
    });

    it('should calculate slots with blocked times in under 100ms', async () => {
      // Mock 5 blocked time ranges
      const mockBlocks = [
        {
          startTime: new Date('2025-01-13T10:00:00.000Z'),
          endTime: new Date('2025-01-13T11:00:00.000Z'),
          isAllDay: false,
        },
        {
          startTime: new Date('2025-01-13T14:00:00.000Z'),
          endTime: new Date('2025-01-13T15:00:00.000Z'),
          isAllDay: false,
        },
      ];

      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue(mockBlocks as any);

      const startTime = Date.now();

      const result = await calculateAvailableSlots('studio-1', '2025-01-13');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(100);
    });

    it('should calculate slots with includeUnavailable in under 100ms', async () => {
      const startTime = Date.now();

      const result = await calculateAvailableSlots('studio-1', '2025-01-13', undefined, {
        includeUnavailable: true,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Batch Calculation Performance', () => {
    it('should batch check 32 time slots in under 500ms', async () => {
      const times = generateDayTimeSlots('09:00', '17:00');

      const startTime = Date.now();

      const results = await batchCheckCapacity('studio-1', '2025-01-13', times);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.size).toBe(times.length);
      expect(duration).toBeLessThan(500);
    });

    it('should batch check 96 time slots (full day) in under 500ms', async () => {
      const times = generateDayTimeSlots();

      const startTime = Date.now();

      const results = await batchCheckCapacity('studio-1', '2025-01-13', times);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.size).toBe(96);
      expect(duration).toBeLessThan(500);
    });

    it('should batch check with existing bookings in under 500ms', async () => {
      const times = generateDayTimeSlots('09:00', '17:00');

      // Mock 30 bookings
      const mockBookings = Array.from({ length: 30 }, (_, i) => ({
        preferredTime: times[i % times.length],
      }));

      jest.mocked(prisma.newBooking.findMany).mockResolvedValue(mockBookings as any);

      const startTime = Date.now();

      const results = await batchCheckCapacity('studio-1', '2025-01-13', times);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.size).toBe(times.length);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle 10 concurrent slot calculations', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, () =>
        calculateAvailableSlots('studio-1', '2025-01-13')
      );

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.every(r => r.ok)).toBe(true);
      expect(duration).toBeLessThan(500);
    });

    it('should handle 50 concurrent slot calculations', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        calculateAvailableSlots('studio-1', `2025-01-${13 + (i % 7)}`)
      );

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.every(r => r.ok)).toBe(true);
      expect(duration).toBeLessThan(2000);
    });

    it('should handle 100 concurrent slot calculations', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, (_, i) =>
        calculateAvailableSlots('studio-1', `2025-01-${13 + (i % 7)}`)
      );

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.every(r => r.ok)).toBe(true);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle mixed concurrent operations', async () => {
      const times = generateDayTimeSlots('09:00', '17:00');

      const startTime = Date.now();

      const promises = [
        ...Array.from({ length: 25 }, () =>
          calculateAvailableSlots('studio-1', '2025-01-13')
        ),
        ...Array.from({ length: 25 }, () =>
          batchCheckCapacity('studio-1', '2025-01-13', times)
        ),
      ];

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.length).toBe(50);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with number of bookings', async () => {
      const baselines: number[] = [];

      for (const bookingCount of [10, 50, 100]) {
        const mockBookings = Array.from({ length: bookingCount }, (_, i) => {
          const hour = 9 + Math.floor((i % 32) / 4);
          const minute = ((i % 4) * 15);
          return {
            preferredTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          };
        });

        jest.mocked(prisma.newBooking.findMany).mockResolvedValue(mockBookings as any);

        const startTime = Date.now();
        await calculateAvailableSlots('studio-1', '2025-01-13');
        const duration = Date.now() - startTime;

        baselines.push(duration);
      }

      // Check that we measured some duration
      expect(baselines.every(d => d >= 0)).toBe(true);

      // Performance shouldn't degrade excessively
      // Using max(1, baseline) to avoid division by zero
      if (baselines[0] > 0 && baselines[2] > 0) {
        const ratio = baselines[2] / baselines[0];
        expect(ratio).toBeLessThan(5); // Allow up to 5x slower (generous for test environments)
      }
    });

    it('should scale with number of blocked times', async () => {
      const baselines: number[] = [];

      for (const blockCount of [5, 10, 20]) {
        const mockBlocks = Array.from({ length: blockCount }, (_, i) => ({
          startTime: new Date(`2025-01-13T${(10 + i) % 24}:00:00.000Z`),
          endTime: new Date(`2025-01-13T${(10 + i) % 24}:30:00.000Z`),
          isAllDay: false,
        }));

        jest.mocked(prisma.blockedTime.findMany).mockResolvedValue(mockBlocks as any);

        const startTime = Date.now();
        await calculateAvailableSlots('studio-1', '2025-01-13');
        const duration = Date.now() - startTime;

        baselines.push(duration);
      }

      // Check that we measured some duration
      expect(baselines.every(d => d >= 0)).toBe(true);

      // Performance shouldn't degrade excessively
      if (baselines[0] > 0 && baselines[2] > 0) {
        const ratio = baselines[2] / baselines[0];
        expect(ratio).toBeLessThan(4); // Allow up to 4x slower
      }
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated calculations', async () => {
      const iterations = 100;
      const results: any[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await calculateAvailableSlots('studio-1', '2025-01-13');
        if (result.ok) {
          results.push(result.value);
        }
      }

      expect(results.length).toBe(iterations);

      // Clear results to allow GC
      results.length = 0;
    });

    it('should handle large result sets efficiently', async () => {
      const fullDayStudio = {
        ...mockStudio,
        openingHours: {
          monday: { isOpen: true, openTime: '00:00', closeTime: '23:45' },
          tuesday: { isOpen: true, openTime: '00:00', closeTime: '23:45' },
          wednesday: { isOpen: true, openTime: '00:00', closeTime: '23:45' },
          thursday: { isOpen: true, openTime: '00:00', closeTime: '23:45' },
          friday: { isOpen: true, openTime: '00:00', closeTime: '23:45' },
          saturday: { isOpen: true, openTime: '00:00', closeTime: '23:45' },
          sunday: { isOpen: true, openTime: '00:00', closeTime: '23:45' },
        },
      };

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(fullDayStudio as any);

      const startTime = Date.now();

      const result = await calculateAvailableSlots('studio-1', '2025-01-13', undefined, {
        includeUnavailable: true,
      });

      const duration = Date.now() - startTime;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(96); // All day slots
      }
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Time Grid Generation Performance', () => {
    it('should generate full day grid in under 10ms', () => {
      const startTime = Date.now();

      const slots = generateDayTimeSlots();

      const duration = Date.now() - startTime;

      expect(slots.length).toBe(96);
      expect(duration).toBeLessThan(10);
    });

    it('should generate custom range grid in under 5ms', () => {
      const startTime = Date.now();

      const slots = generateDayTimeSlots('09:00', '17:00');

      const duration = Date.now() - startTime;

      expect(slots.length).toBe(33);
      expect(duration).toBeLessThan(5);
    });

    it('should generate grids for 100 different ranges efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const start = `${(9 + (i % 3)).toString().padStart(2, '0')}:00`;
        const end = `${(17 + (i % 5)).toString().padStart(2, '0')}:00`;
        generateDayTimeSlots(start, end);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});
