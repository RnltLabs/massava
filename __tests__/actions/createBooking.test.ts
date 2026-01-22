/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Create Booking Server Action - Unit Tests (Phase 3)
 *
 * Tests for both legacy slotId-based booking and new dynamic slot booking.
 */


import { createBooking } from '@/app/actions/createBooking';
import { ok, err } from '@/lib/result';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    studio: {
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    timeSlot: {
      findUnique: jest.fn(),
    },
    studioOwnership: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/slots', () => ({
  checkSlotCapacity: jest.fn(),
  createBookingWithCapacityCheck: jest.fn(),
}));

jest.mock('@/lib/email/send', () => ({
  sendBookingRequestReceivedEmail: jest.fn(),
  sendNewBookingNotificationToOwner: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { checkSlotCapacity } from '@/lib/slots';

describe('createBooking - Dynamic Slots (Phase 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    jest.mocked(auth).mockResolvedValue(null);
    jest.mocked(prisma.studio.findUnique).mockResolvedValue({
      id: 'studio-1',
      name: 'Test Studio',
      capacity: 3,
    } as any);
    jest.mocked(prisma.service.findUnique).mockResolvedValue({
      id: 'service-1',
      name: 'Thai Massage',
    } as any);
    jest.mocked(prisma.studioOwnership.findMany).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Dynamic Slot Mode', () => {
    it('should create booking with dynamic slot validation', async () => {
      const mockBooking = {
        id: 'booking-123',
        studioId: 'studio-1',
        serviceId: 'service-1',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        status: 'CONFIRMED',
        studio: { name: 'Test Studio' },
        service: { name: 'Thai Massage' },
      };

      jest.mocked(checkSlotCapacity).mockResolvedValue(
        ok({
          available: true,
          currentBookings: 1,
          capacity: 3,
          remainingCapacity: 2,
        })
      );

      jest.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          newBooking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
        });
      });

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+49 123 456789',
      });

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('booking-123');

      expect(checkSlotCapacity).toHaveBeenCalledWith('studio-1', '2025-12-01', '10:00');
    });

    it('should validate preferredTime is on 15-minute grid', async () => {
      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2025-12-01',
        preferredTime: '10:13', // Not on grid
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('15-Minuten-Raster');
    });

    it('should reject booking when capacity is exceeded', async () => {
      jest.mocked(checkSlotCapacity).mockResolvedValue(
        ok({
          available: false,
          currentBookings: 3,
          capacity: 3,
          remainingCapacity: 0,
        })
      );

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('nicht mehr verfügbar');
    });

    it('should handle capacity check error', async () => {
      jest.mocked(checkSlotCapacity).mockResolvedValue(
        err({ type: 'STUDIO_NOT_FOUND', studioId: 'studio-1' })
      );

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('existiert nicht mehr');
    });

    it('should reject booking with date in the past', async () => {
      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2020-01-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Legacy Slot Mode (Backward Compatibility)', () => {
    it('should create booking with legacy slotId', async () => {
      const mockTimeSlot = {
        id: 'slot-123',
        startTime: new Date('2025-12-01T10:00:00.000Z'),
        endTime: new Date('2025-12-01T10:15:00.000Z'),
        isAvailable: true,
        isBooked: false,
      };

      const mockBooking = {
        id: 'booking-123',
        studioId: 'studio-1',
        serviceId: 'service-1',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        status: 'CONFIRMED',
        studio: { name: 'Test Studio' },
        service: { name: 'Thai Massage' },
      };

      jest.mocked(prisma.timeSlot.findUnique).mockResolvedValue(mockTimeSlot as any);

      jest.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          newBooking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
          timeSlot: {
            update: jest.fn().mockResolvedValue(mockTimeSlot),
          },
        });
      });

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        slotId: 'slot-123',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('booking-123');
    });

    it('should reject booking when legacy slot is unavailable', async () => {
      const mockTimeSlot = {
        id: 'slot-123',
        startTime: new Date('2025-12-01T10:00:00.000Z'),
        endTime: new Date('2025-12-01T10:15:00.000Z'),
        isAvailable: false,
        isBooked: true,
      };

      jest.mocked(prisma.timeSlot.findUnique).mockResolvedValue(mockTimeSlot as any);

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        slotId: 'slot-123',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('nicht mehr verfügbar');
    });

    it('should reject booking when legacy slot does not exist', async () => {
      jest.mocked(prisma.timeSlot.findUnique).mockResolvedValue(null);

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        slotId: 'slot-123',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('existiert nicht mehr');
    });
  });

  describe('Validation', () => {
    it('should require either slotId or (preferredDate + preferredTime)', async () => {
      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
    });

    it('should validate studio exists', async () => {
      jest.mocked(prisma.studio.findUnique).mockResolvedValue(null);

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Studio existiert nicht');
    });

    it('should validate service exists', async () => {
      jest.mocked(prisma.service.findUnique).mockResolvedValue(null);

      const result = await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Leistung existiert nicht');
    });
  });

  describe('GDPR Compliance', () => {
    it('should store health consent information', async () => {
      const mockBooking = {
        id: 'booking-123',
        studioId: 'studio-1',
        serviceId: 'service-1',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        status: 'CONFIRMED',
        explicitHealthConsent: true,
        healthConsentGivenAt: expect.any(Date),
        healthConsentText: expect.stringContaining('GDPR'),
        studio: { name: 'Test Studio' },
        service: { name: 'Thai Massage' },
      };

      jest.mocked(checkSlotCapacity).mockResolvedValue(
        ok({
          available: true,
          currentBookings: 0,
          capacity: 3,
          remainingCapacity: 3,
        })
      );

      let capturedBookingData: any;
      jest.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          newBooking: {
            create: jest.fn().mockImplementation((data) => {
              capturedBookingData = data;
              return Promise.resolve(mockBooking);
            }),
          },
        });
      });

      await createBooking({
        studioId: 'studio-1',
        serviceId: 'service-1',
        preferredDate: '2025-12-01',
        preferredTime: '10:00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        explicitHealthConsent: true,
      });

      expect(capturedBookingData.data.explicitHealthConsent).toBe(true);
      expect(capturedBookingData.data.healthConsentGivenAt).toBeInstanceOf(Date);
      expect(capturedBookingData.data.healthConsentText).toContain('GDPR');
    });
  });
});
