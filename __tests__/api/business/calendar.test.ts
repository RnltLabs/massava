/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Calendar API Tests
 * Phase 4: Dynamic Slots Implementation
 */

import { GET } from '@/app/api/business/calendar/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateAvailableSlots } from '@/lib/slots'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

// Mock dependencies
jest.mock('@/auth')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    studio: {
      findFirst: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    newBooking: {
      findMany: jest.fn(),
    },
    timeSlot: {
      findMany: jest.fn(),
    },
  },
}))
jest.mock('@/lib/slots')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('Business Calendar API - Phase 4', () => {
  const mockStudioId = 'studio_test_123'
  const mockServiceId = 'service_test_123'
  const mockUserId = 'user_test_123'

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock auth session
    ;(auth as jest.Mock).mockResolvedValue({
      user: {
        id: mockUserId,
        email: 'owner@example.com',
        name: 'Studio Owner',
        primaryRole: 'STUDIO_OWNER',
      },
      expires: '2025-12-31',
    })

    // Mock studio lookup
    ;(prisma.studio.findFirst as jest.Mock).mockResolvedValue({
      id: mockStudioId,
      name: 'Test Studio',
      capacity: 3,
      openingHours: {
        monday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '17:00',
        },
        tuesday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '17:00',
        },
        wednesday: {
          isOpen: false,
        },
      },
    } as any)

    // Mock services
    ;(prisma.service.findMany as jest.Mock).mockResolvedValue([
      {
        id: mockServiceId,
        name: 'Test Service',
        duration: 60,
        price: 50,
      } as any,
    ])

    // Mock bookings
    ;(prisma.newBooking.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'booking_1',
        customerName: 'Anna Müller',
        customerEmail: 'anna@example.com',
        customerPhone: '+49123456789',
        serviceId: mockServiceId,
        status: 'CONFIRMED',
        preferredDate: '2025-11-18',
        preferredTime: '10:00',
        createdAt: new Date('2025-11-17'),
        message: null,
        service: {
          id: mockServiceId,
          name: 'Test Service',
          duration: 60,
          price: 50,
        },
        customer: {
          id: 'customer_1',
          name: 'Anna Müller',
        },
      } as any,
    ])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Dynamic Slots Enabled', () => {
    beforeEach(() => {
      // Mock feature flag as enabled
      jest
        .spyOn(FEATURE_FLAGS, 'DYNAMIC_SLOTS_ENABLED', 'get')
        .mockReturnValue(true)

      // Mock calculateAvailableSlots
      ;(calculateAvailableSlots as jest.Mock).mockResolvedValue({
        ok: true,
        value: [
          {
            startTime: '09:00',
            endTime: '09:15',
            available: true,
            remainingCapacity: 3,
          },
          {
            startTime: '09:15',
            endTime: '09:30',
            available: true,
            remainingCapacity: 2,
          },
          {
            startTime: '10:00',
            endTime: '10:15',
            available: false,
            remainingCapacity: 0,
            reason: 'at_capacity',
          },
        ],
      } as any)
    })

    it('should use calculateAvailableSlots when feature flag is enabled', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(calculateAvailableSlots).toHaveBeenCalled()
      expect(data.meta.dynamicSlotsEnabled).toBe(true)
    })

    it('should return available and unavailable slots', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toBeDefined()

      // Should have both slot events and booking events
      const slotEvents = data.events.filter((e: any) => e.type === 'slot')
      const bookingEvents = data.events.filter((e: any) => e.type === 'booking')

      expect(slotEvents.length).toBeGreaterThan(0)
      expect(bookingEvents.length).toBeGreaterThan(0)
    })

    it('should include remainingCapacity in slot events', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      const slotEvents = data.events.filter((e: any) => e.type === 'slot')
      const availableSlot = slotEvents.find((e: any) => e.available === true)

      expect(availableSlot).toBeDefined()
      expect(availableSlot.remainingCapacity).toBeGreaterThanOrEqual(0)
    })

    it('should include reason for unavailable slots', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      const slotEvents = data.events.filter((e: any) => e.type === 'slot')
      const unavailableSlot = slotEvents.find((e: any) => e.available === false)

      expect(unavailableSlot).toBeDefined()
      expect(unavailableSlot.reason).toBeDefined()
      expect(['outside_hours', 'at_capacity', 'blocked', 'in_break']).toContain(
        unavailableSlot.reason
      )
    })

    it('should calculate slots for multiple dates', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-20T00:00:00Z'
      )

      await GET(request)

      // Should call calculateAvailableSlots for each date
      expect(calculateAvailableSlots).toHaveBeenCalledTimes(3) // 3 days
    })

    it('should filter slots by serviceId', async () => {
      const request = new Request(
        `http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z&serviceId=${mockServiceId}`
      )

      await GET(request)

      expect(calculateAvailableSlots).toHaveBeenCalledWith(
        mockStudioId,
        expect.any(String),
        mockServiceId,
        expect.any(Object)
      )
    })

    it('should handle calculateAvailableSlots errors gracefully', async () => {
      vi.mocked(calculateAvailableSlots).mockResolvedValue({
        ok: false,
        error: {
          type: 'DATABASE_ERROR',
          message: 'Test error',
        },
      } as any)

      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      // Should still return successfully, just without slots for that date
      expect(response.status).toBe(200)
      expect(data.events).toBeDefined()
    })
  })

  describe('Dynamic Slots Disabled (Legacy Mode)', () => {
    beforeEach(() => {
      // Mock feature flag as disabled
      jest
        .spyOn(FEATURE_FLAGS, 'DYNAMIC_SLOTS_ENABLED', 'get')
        .mockReturnValue(false)

      // Mock TimeSlot table query
      ;(prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'slot_1',
          studioId: mockStudioId,
          serviceId: mockServiceId,
          startTime: new Date('2025-11-18T09:00:00Z'),
          endTime: new Date('2025-11-18T10:00:00Z'),
          isAvailable: true,
          isBooked: false,
          service: {
            id: mockServiceId,
            name: 'Test Service',
            duration: 60,
          },
        } as any,
      ])
    })

    it('should use TimeSlot table when feature flag is disabled', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(prisma.timeSlot.findMany).toHaveBeenCalled()
      expect(calculateAvailableSlots).not.toHaveBeenCalled()
      expect(data.meta.dynamicSlotsEnabled).toBe(false)
    })

    it('should return TimeSlot data in legacy format', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const slotEvents = data.events.filter((e: any) => e.type === 'slot')
      expect(slotEvents.length).toBeGreaterThan(0)

      // Legacy format includes isBooked
      const slot = slotEvents[0]
      expect(slot.id).toBeDefined()
      expect(slot.serviceName).toBeDefined()
    })
  })

  describe('Authentication & Authorization', () => {
    it('should return 403 if user is not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should return 404 if studio not found', async () => {
      ;(prisma.studio.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)

      expect(response.status).toBe(404)
    })
  })

  describe('Input Validation', () => {
    it('should reject invalid date format', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=invalid&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should reject missing required parameters', async () => {
      const request = new Request('http://localhost/api/business/calendar')

      const response = await GET(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Summary Statistics', () => {
    it('should return correct booking statistics', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.summary).toBeDefined()
      expect(data.summary.totalBookings).toBe(1)
      expect(data.summary.confirmedBookings).toBe(1)
      expect(data.summary.pendingBookings).toBe(0)
    })

    it('should return correct slot statistics', async () => {
      const request = new Request(
        'http://localhost/api/business/calendar?startDate=2025-11-18T00:00:00Z&endDate=2025-11-19T00:00:00Z'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.summary.availableSlots).toBeGreaterThanOrEqual(0)
      expect(data.summary.bookedSlots).toBeGreaterThanOrEqual(0)
    })
  })
})
