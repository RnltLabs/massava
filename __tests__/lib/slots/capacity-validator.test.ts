/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Capacity Validator Tests - Comprehensive Coverage
 */

import {
  checkSlotCapacity,
  batchCheckCapacity,
  createBookingWithCapacityCheck,
  type BookingData,
} from '@/lib/slots/capacity-validator';
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
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Capacity Validator - checkSlotCapacity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkSlotCapacity', () => {
    it('should return error if studio not found', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue(null);

      const result = await checkSlotCapacity('studio-1', '2025-01-15', '09:00');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('STUDIO_NOT_FOUND');
        expect(result.error.studioId).toBe('studio-1');
      }
    });

    it('should return available capacity when no bookings exist', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 3,
      } as any);

      jest.mocked(prisma.newBooking.count).mockResolvedValue(0);

      const result = await checkSlotCapacity('studio-1', '2025-01-15', '09:00');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.available).toBe(true);
        expect(result.value.capacity).toBe(3);
        expect(result.value.currentBookings).toBe(0);
        expect(result.value.remainingCapacity).toBe(3);
      }
    });

    it('should reduce capacity based on existing bookings', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 3,
      } as any);

      jest.mocked(prisma.newBooking.count).mockResolvedValue(2);

      const result = await checkSlotCapacity('studio-1', '2025-01-15', '09:00');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.available).toBe(true);
        expect(result.value.capacity).toBe(3);
        expect(result.value.currentBookings).toBe(2);
        expect(result.value.remainingCapacity).toBe(1);
      }
    });

    it('should return unavailable when at capacity', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 2,
      } as any);

      jest.mocked(prisma.newBooking.count).mockResolvedValue(2);

      const result = await checkSlotCapacity('studio-1', '2025-01-15', '09:00');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.available).toBe(false);
        expect(result.value.capacity).toBe(2);
        expect(result.value.currentBookings).toBe(2);
        expect(result.value.remainingCapacity).toBe(0);
      }
    });

    it('should normalize time to grid', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 2,
      } as any);

      jest.mocked(prisma.newBooking.count).mockResolvedValue(0);

      await checkSlotCapacity('studio-1', '2025-01-15', '09:07');

      // Verify count was called with normalized time
      expect(prisma.newBooking.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            preferredTime: '09:00', // Normalized from 09:07
          }),
        })
      );
    });

    it('should only count CONFIRMED and PENDING bookings', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 2,
      } as any);

      jest.mocked(prisma.newBooking.count).mockResolvedValue(0);

      await checkSlotCapacity('studio-1', '2025-01-15', '09:00');

      expect(prisma.newBooking.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['CONFIRMED', 'PENDING'] },
          }),
        })
      );
    });

    it('should handle database errors', async () => {
      jest.mocked(prisma.studio.findUnique).mockRejectedValue(new Error('DB error'));

      const result = await checkSlotCapacity('studio-1', '2025-01-15', '09:00');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('batchCheckCapacity', () => {
    it('should check capacity for multiple time slots', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 3,
      } as any);

      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([
        { preferredTime: '09:00' },
        { preferredTime: '09:00' },
        { preferredTime: '10:00' },
      ] as any);

      const times = ['09:00', '09:15', '10:00', '10:15'];
      const results = await batchCheckCapacity('studio-1', '2025-01-15', times);

      expect(results.size).toBe(4);

      const result900 = results.get('09:00');
      expect(result900?.ok).toBe(true);
      if (result900?.ok) {
        expect(result900.value.currentBookings).toBe(2);
        expect(result900.value.remainingCapacity).toBe(1);
      }

      const result915 = results.get('09:15');
      expect(result915?.ok).toBe(true);
      if (result915?.ok) {
        expect(result915.value.currentBookings).toBe(0);
        expect(result915.value.remainingCapacity).toBe(3);
      }

      const result1000 = results.get('10:00');
      expect(result1000?.ok).toBe(true);
      if (result1000?.ok) {
        expect(result1000.value.currentBookings).toBe(1);
        expect(result1000.value.remainingCapacity).toBe(2);
      }
    });

    it('should return error for all slots if studio not found', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue(null);

      const times = ['09:00', '09:15', '10:00'];
      const results = await batchCheckCapacity('studio-1', '2025-01-15', times);

      expect(results.size).toBe(3);

      for (const [time, result] of results.entries()) {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.type).toBe('STUDIO_NOT_FOUND');
        }
      }
    });

    it('should handle database errors', async () => {
      jest.mocked(prisma.studio.findUnique).mockRejectedValue(new Error('DB error'));

      const times = ['09:00', '09:15'];
      const results = await batchCheckCapacity('studio-1', '2025-01-15', times);

      expect(results.size).toBe(2);

      for (const result of results.values()) {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.type).toBe('DATABASE_ERROR');
        }
      }
    });

    it('should normalize times to grid', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 2,
      } as any);

      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);

      const times = ['09:07', '10:23']; // Off-grid times
      await batchCheckCapacity('studio-1', '2025-01-15', times);

      // Verify query was made with normalized times
      expect(prisma.newBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            preferredTime: {
              in: expect.arrayContaining(['09:00', '10:15']),
            },
          }),
        })
      );
    });

    it('should fetch bookings only once for efficiency', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue({
        id: 'studio-1',
        capacity: 2,
      } as any);

      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);

      const times = ['09:00', '09:15', '09:30', '09:45'];
      await batchCheckCapacity('studio-1', '2025-01-15', times);

      // Should only call findMany once
      expect(prisma.newBooking.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('createBookingWithCapacityCheck', () => {
    const validBookingData: BookingData = {
      studioId: 'studio-1',
      serviceId: 'service-1',
      customerId: 'customer-1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+49 123 456789',
      preferredDate: '2025-01-15',
      preferredTime: '09:00',
      message: 'Test booking',
      explicitHealthConsent: true,
      healthConsentGivenAt: new Date('2025-01-15T08:00:00Z'),
      healthConsentText: 'I consent to health data processing',
    };

    it('should create booking successfully when capacity is available', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 3,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(1),
            create: jest.fn().mockResolvedValue({
              id: 'booking-123',
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('booking-123');
      }

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable',
        })
      );
    });

    it('should fail when studio not found', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          newBooking: {
            count: jest.fn(),
            create: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('STUDIO_NOT_FOUND');
        expect(result.error.studioId).toBe('studio-1');
      }
    });

    it('should fail when capacity is exceeded', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 2,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(2), // At capacity
            create: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('CAPACITY_EXCEEDED');
        expect(result.error.capacity).toBe(2);
        expect(result.error.currentBookings).toBe(2);
      }
    });

    it('should normalize off-grid time with warning', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 3,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              id: 'booking-123',
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const offGridBooking = {
        ...validBookingData,
        preferredTime: '09:07', // Off-grid time
      };

      const result = await createBookingWithCapacityCheck(offGridBooking);

      expect(result.ok).toBe(true);

      // Verify logger.warn was called for time normalization
      expect(jest.mocked(require('@/lib/logger').logger.warn)).toHaveBeenCalledWith(
        'Time normalized to grid',
        expect.objectContaining({
          originalTime: '09:07',
          normalizedTime: '09:00',
        })
      );
    });

    it('should retry on serialization failure', async () => {
      let attemptCount = 0;

      const mockTransaction = jest.fn(async (callback) => {
        attemptCount++;

        if (attemptCount === 1) {
          // First attempt: serialization failure
          throw new Error('Transaction aborted due to serialization failure');
        }

        // Second attempt: success
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 3,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              id: 'booking-123',
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('booking-123');
      }

      // Should have retried
      expect(attemptCount).toBe(2);
      expect(jest.mocked(require('@/lib/logger').logger.warn)).toHaveBeenCalledWith(
        'Concurrent booking conflict, retrying',
        expect.any(Object)
      );
    });

    it('should fail after max retries on serialization failures', async () => {
      let attemptCount = 0;

      const mockTransaction = jest.fn(async () => {
        attemptCount++;
        throw new Error('Transaction aborted due to serialization failure');
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData, 3);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        // After exhausting retries, should return DATABASE_ERROR or CONCURRENT_BOOKING_CONFLICT
        expect(['CONCURRENT_BOOKING_CONFLICT', 'DATABASE_ERROR']).toContain(result.error.type);
      }

      // Should have tried 3 times
      expect(attemptCount).toBe(3);
    });

    it('should not retry on capacity exceeded errors', async () => {
      let attemptCount = 0;

      const mockTransaction = jest.fn(async (callback) => {
        attemptCount++;

        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 2,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(2), // At capacity
            create: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData, 3);

      expect(result.ok).toBe(false);

      // Should only try once (no retries for capacity errors)
      expect(attemptCount).toBe(1);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      const mockTransaction = jest.fn(async () => {
        throw new Error('Connection timeout');
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('DATABASE_ERROR');
        expect(result.error.message).toContain('Connection timeout');
      }
    });

    it('should create booking with PENDING status', async () => {
      let createdBookingData: any;

      const mockTransaction = jest.fn(async (callback) => {
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 3,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockImplementation((data) => {
              createdBookingData = data.data;
              return Promise.resolve({ id: 'booking-123' });
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(validBookingData);

      expect(result.ok).toBe(true);
      expect(createdBookingData.status).toBe('PENDING');
      expect(createdBookingData.studioId).toBe('studio-1');
      expect(createdBookingData.customerEmail).toBe('john@example.com');
      expect(createdBookingData.preferredTime).toBe('09:00');
    });

    it('should handle minimal booking data (optional fields omitted)', async () => {
      const minimalBookingData: BookingData = {
        studioId: 'studio-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        preferredDate: '2025-01-15',
        preferredTime: '10:00',
      };

      const mockTransaction = jest.fn(async (callback) => {
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 3,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              id: 'booking-456',
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const result = await createBookingWithCapacityCheck(minimalBookingData);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('booking-456');
      }
    });

    it('should use Serializable isolation level', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 3,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              id: 'booking-123',
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      await createBookingWithCapacityCheck(validBookingData);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 10000,
        })
      );
    });

    it('should implement exponential backoff on retries', async () => {
      jest.useFakeTimers();

      let attemptCount = 0;
      const attemptTimes: number[] = [];

      const mockTransaction = jest.fn(async (callback) => {
        attemptCount++;
        attemptTimes.push(Date.now());

        if (attemptCount < 3) {
          throw new Error('Transaction aborted due to serialization failure');
        }

        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 3,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              id: 'booking-123',
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const resultPromise = createBookingWithCapacityCheck(validBookingData, 3);

      // Fast-forward through the backoff periods
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result.ok).toBe(true);
      expect(attemptCount).toBe(3);

      jest.useRealTimers();
    });
  });
});
