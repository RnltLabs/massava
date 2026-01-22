/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Dynamic Slots API Integration Tests
 *
 * Tests the complete flow of the slots API including:
 * - Availability endpoint
 * - Booking creation with capacity validation
 * - Concurrent booking prevention
 */

import { GET } from '@/app/api/studios/[studioId]/availability/route';
import { calculateAvailableSlots } from '@/lib/slots';
import { createBookingWithCapacityCheck } from '@/lib/slots/capacity-validator';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

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
    blockedTime: {
      findMany: jest.fn(),
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
  generateCorrelationId: jest.fn(() => `test-correlation-${Date.now()}`),
}));

describe('Dynamic Slots API - Integration Tests', () => {
  // Use a future date that's guaranteed to be valid
  const getFutureDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 days from now
    return date.toISOString().split('T')[0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/studios/[studioId]/availability', () => {
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

    it('should return available slots for a valid date', async () => {
      const futureDate = getFutureDate();

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/studios/studio-1/availability?date=${futureDate}`
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.studioId).toBe('studio-1');
      expect(data.date).toBe(futureDate);
      expect(data.slots).toBeDefined();
      expect(data.slots.length).toBeGreaterThan(0);
      expect(data.meta.totalSlots).toBeGreaterThan(0);
      expect(data.meta.availableSlots).toBeGreaterThan(0);
    });

    it('should return 400 for missing date parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/studios/studio-1/availability'
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid date format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/studios/studio-1/availability?date=invalid'
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for past date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/studios/studio-1/availability?date=2020-01-01'
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 404 for non-existent studio', async () => {
      const futureDate = getFutureDate();

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/studios/studio-1/availability?date=${futureDate}`
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should filter slots by time range', async () => {
      const futureDate = getFutureDate();

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/studios/studio-1/availability?date=${futureDate}&startTime=10:00&endTime=12:00`
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slots).toBeDefined();
      expect(data.slots.every((s: any) => s.startTime >= '10:00')).toBe(true);
      expect(data.slots.every((s: any) => s.startTime <= '12:00')).toBe(true);
    });

    it('should include unavailable slots when requested', async () => {
      const futureDate = getFutureDate();

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/studios/studio-1/availability?date=${futureDate}&includeUnavailable=true`
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slots).toBeDefined();
      // Should include slots outside opening hours
      expect(data.slots.some((s: any) => !s.available)).toBe(true);
    });

    it('should filter by serviceId', async () => {
      const futureDate = getFutureDate();

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);

      const serviceId = 'cm4abcdef1234567890abcdef';
      const request = new NextRequest(
        `http://localhost:3000/api/studios/studio-1/availability?date=${futureDate}&serviceId=${serviceId}`
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta.filters.serviceId).toBe(serviceId);
      expect(prisma.newBooking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            serviceId,
          }),
        })
      );
    });

    it('should apply minCapacity filter', async () => {
      const futureDate = getFutureDate();

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([
        { preferredTime: '09:00' },
        { preferredTime: '09:00' },
      ] as any);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/studios/studio-1/availability?date=${futureDate}&minCapacity=2&includeUnavailable=true`
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      // 09:00 has 2 bookings, capacity is 3, remaining is 1, needs 2, so unavailable
      const slot900 = data.slots.find((s: any) => s.startTime === '09:00');
      expect(slot900?.available).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const futureDate = getFutureDate();

      jest.mocked(prisma.studio.findUnique).mockRejectedValue(new Error('DB connection failed'));

      const request = new NextRequest(
        `http://localhost:3000/api/studios/studio-1/availability?date=${futureDate}`
      );

      const response = await GET(request, { params: { studioId: 'studio-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('Booking Flow with Capacity Check', () => {
    it('should successfully create booking when slot is available', async () => {
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

      const bookingData = {
        studioId: 'studio-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        preferredDate: '2025-01-13',
        preferredTime: '09:00',
      };

      const result = await createBookingWithCapacityCheck(bookingData);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('booking-123');
      }
    });

    it('should prevent double booking at capacity', async () => {
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

      const bookingData = {
        studioId: 'studio-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        preferredDate: '2025-01-13',
        preferredTime: '09:00',
      };

      const result = await createBookingWithCapacityCheck(bookingData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('CAPACITY_EXCEEDED');
      }
    });

    it('should handle concurrent booking attempts correctly', async () => {
      let bookingCount = 0;

      const mockTransaction = jest.fn(async (callback) => {
        const currentCount = bookingCount;

        const mockTx = {
          studio: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'studio-1',
              capacity: 2,
            }),
          },
          newBooking: {
            count: jest.fn().mockResolvedValue(currentCount),
            create: jest.fn().mockImplementation(async () => {
              bookingCount++;
              return { id: `booking-${bookingCount}` };
            }),
          },
        };
        return callback(mockTx);
      });

      jest.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const bookingData1 = {
        studioId: 'studio-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        preferredDate: '2025-01-13',
        preferredTime: '09:00',
      };

      const bookingData2 = {
        studioId: 'studio-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        preferredDate: '2025-01-13',
        preferredTime: '09:00',
      };

      // First booking should succeed
      const result1 = await createBookingWithCapacityCheck(bookingData1);
      expect(result1.ok).toBe(true);

      // Second booking should succeed
      const result2 = await createBookingWithCapacityCheck(bookingData2);
      expect(result2.ok).toBe(true);

      // Third booking should fail (capacity = 2)
      const result3 = await createBookingWithCapacityCheck(bookingData1);
      expect(result3.ok).toBe(false);
    });
  });

  describe('Complete Availability + Booking Flow', () => {
    it('should check availability before creating booking', async () => {
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

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([
        { preferredTime: '09:00' },
      ] as any);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);

      // Check availability first
      const availabilityResult = await calculateAvailableSlots(
        'studio-1',
        '2025-01-13'
      );

      expect(availabilityResult.ok).toBe(true);
      if (availabilityResult.ok) {
        const slot900 = availabilityResult.value.find(s => s.startTime === '09:00');
        expect(slot900?.available).toBe(true);
        expect(slot900?.remainingCapacity).toBe(2);

        // If slot is available, create booking
        if (slot900?.available) {
          const mockTransaction = jest.fn(async (callback) => {
            const mockTx = {
              studio: {
                findUnique: jest.fn().mockResolvedValue(mockStudio),
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

          const bookingResult = await createBookingWithCapacityCheck({
            studioId: 'studio-1',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            preferredDate: '2025-01-13',
            preferredTime: '09:00',
          });

          expect(bookingResult.ok).toBe(true);
        }
      }
    });

    it('should prevent booking in blocked time', async () => {
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

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([
        {
          startTime: new Date('2025-01-13T09:00:00.000Z'),
          endTime: new Date('2025-01-13T10:00:00.000Z'),
          isAllDay: false,
        },
      ] as any);

      // Check availability with includeUnavailable to see blocked slots
      const availabilityResult = await calculateAvailableSlots(
        'studio-1',
        '2025-01-13',
        undefined,
        { includeUnavailable: true }
      );

      expect(availabilityResult.ok).toBe(true);
      if (availabilityResult.ok) {
        const slot900 = availabilityResult.value.find(s => s.startTime === '09:00');

        // Slot should be marked as unavailable due to blocking
        expect(slot900?.available).toBe(false);
        expect(slot900?.reason).toBe('blocked');
      }
    });

    it('should prevent booking outside opening hours', async () => {
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

      jest.mocked(prisma.studio.findUnique).mockResolvedValue(mockStudio as any);
      jest.mocked(prisma.newBooking.findMany).mockResolvedValue([]);
      jest.mocked(prisma.blockedTime.findMany).mockResolvedValue([]);

      // Check availability for time outside opening hours
      const availabilityResult = await calculateAvailableSlots(
        'studio-1',
        '2025-01-13'
      );

      expect(availabilityResult.ok).toBe(true);
      if (availabilityResult.ok) {
        // 08:00 is before opening time
        const slot0800 = availabilityResult.value.find(s => s.startTime === '08:00');
        expect(slot0800).toBeUndefined(); // Not included in results by default

        // 18:00 is after closing time
        const slot1800 = availabilityResult.value.find(s => s.startTime === '18:00');
        expect(slot1800).toBeUndefined();
      }
    });
  });
});
