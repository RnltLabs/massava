/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Integration Tests
 * MASTER_ORCHESTRATION_PLAN.md - Task 2.4: Business Portal API Routes
 *
 * Tests for all business portal API endpoints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GET as getBookings } from '@/app/api/business/bookings/route'
import { PATCH as updateBookingStatus } from '@/app/api/business/bookings/[id]/status/route'
import { GET as getServices, POST as createService } from '@/app/api/business/services/route'
import { PATCH as updateService, DELETE as deleteService } from '@/app/api/business/services/[id]/route'
import { GET as getStats } from '@/app/api/business/stats/route'
import { GET as getOpeningHours, POST as updateOpeningHours } from '@/app/api/business/opening-hours/route'
import { GET as getCalendar } from '@/app/api/business/calendar/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { BookingStatus, UserRole } from '@/app/generated/prisma'

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    studio: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    timeSlot: {
      findMany: vi.fn(),
    },
  },
}))

describe('Business Portal API', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'owner@example.com',
      name: 'Studio Owner',
      primaryRole: UserRole.STUDIO_OWNER,
      roles: [UserRole.STUDIO_OWNER],
    },
  }

  const mockStudio = {
    id: 'studio-123',
    name: 'Test Studio',
    ownerships: [{ userId: 'user-123' }],
    openingHours: {
      monday: { open: true, ranges: ['09:00-17:00'] },
      tuesday: { open: true, ranges: ['09:00-17:00'] },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/business/bookings', () => {
    it('should return bookings for authenticated studio owner', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.booking.findMany).mockResolvedValue([
        {
          id: 'booking-1',
          studioId: 'studio-123',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '+1234567890',
          status: BookingStatus.PENDING,
          service: { id: 'service-1', name: 'Massage', price: 60, duration: 60 },
        },
      ] as any)
      vi.mocked(prisma.booking.count).mockResolvedValue(1)

      const request = new Request(
        'http://localhost:3000/api/business/bookings?limit=50&offset=0'
      )
      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should reject unauthenticated requests', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/business/bookings')
      const response = await getBookings(request)

      expect(response.status).toBe(403)
    })

    it('should filter bookings by status', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.booking.findMany).mockResolvedValue([])
      vi.mocked(prisma.booking.count).mockResolvedValue(0)

      const request = new Request(
        'http://localhost:3000/api/business/bookings?status=CONFIRMED'
      )
      const response = await getBookings(request)

      expect(response.status).toBe(200)
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BookingStatus.CONFIRMED,
          }),
        })
      )
    })
  })

  describe('PATCH /api/business/bookings/[id]/status', () => {
    it('should update booking status', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        id: 'booking-1',
        studioId: 'studio-123',
        status: BookingStatus.PENDING,
      } as any)
      vi.mocked(prisma.booking.update).mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
      } as any)

      const request = new Request(
        'http://localhost:3000/api/business/bookings/booking-1/status',
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'CONFIRMED' }),
        }
      )
      const response = await updateBookingStatus(request, {
        params: { id: 'booking-1' },
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking.status).toBe(BookingStatus.CONFIRMED)
    })

    it('should reject update for booking not owned by studio', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        id: 'booking-1',
        studioId: 'different-studio',
        status: BookingStatus.PENDING,
      } as any)

      const request = new Request(
        'http://localhost:3000/api/business/bookings/booking-1/status',
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'CONFIRMED' }),
        }
      )
      const response = await updateBookingStatus(request, {
        params: { id: 'booking-1' },
      })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/business/services', () => {
    it('should return services for studio', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.service.findMany).mockResolvedValue([
        {
          id: 'service-1',
          name: 'Massage',
          price: 60,
          duration: 60,
          _count: { bookings: 5 },
        },
      ] as any)

      const response = await getServices()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.services).toHaveLength(1)
    })
  })

  describe('POST /api/business/services', () => {
    it('should create new service', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.service.create).mockResolvedValue({
        id: 'service-new',
        name: 'New Service',
        price: 75,
        duration: 90,
      } as any)

      const request = new Request('http://localhost:3000/api/business/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Service',
          description: 'A new service',
          price: 75,
          duration: 90,
        }),
      })
      const response = await createService(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.service.name).toBe('New Service')
    })

    it('should validate service data', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)

      const request = new Request('http://localhost:3000/api/business/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'AB', // Too short
          price: -10, // Negative
          duration: 5, // Too short
        }),
      })
      const response = await createService(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/business/stats', () => {
    it('should return dashboard statistics', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.booking.count).mockResolvedValue(10)
      vi.mocked(prisma.booking.findMany).mockResolvedValue([
        { service: { price: 60 } },
        { service: { price: 75 } },
      ] as any)
      vi.mocked(prisma.service.findMany).mockResolvedValue([])

      const request = new Request(
        'http://localhost:3000/api/business/stats?period=month'
      )
      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview).toBeDefined()
      expect(data.overview.totalRevenue).toBeGreaterThan(0)
    })
  })

  describe('GET /api/business/opening-hours', () => {
    it('should return current opening hours', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)

      const response = await getOpeningHours()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.openingHours).toBeDefined()
    })
  })

  describe('POST /api/business/opening-hours', () => {
    it('should update opening hours', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.studio.update).mockResolvedValue({
        ...mockStudio,
        openingHours: {
          monday: { open: true, ranges: ['10:00-18:00'] },
        },
      } as any)

      const request = new Request(
        'http://localhost:3000/api/business/opening-hours',
        {
          method: 'POST',
          body: JSON.stringify({
            monday: { open: true, ranges: ['10:00-18:00'] },
          }),
        }
      )
      const response = await updateOpeningHours(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('updated successfully')
    })
  })

  describe('GET /api/business/calendar', () => {
    it('should return calendar data', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any)
      vi.mocked(prisma.studio.findFirst).mockResolvedValue(mockStudio as any)
      vi.mocked(prisma.booking.findMany).mockResolvedValue([])
      vi.mocked(prisma.timeSlot.findMany).mockResolvedValue([])
      vi.mocked(prisma.service.findMany).mockResolvedValue([])

      const startDate = new Date().toISOString()
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const request = new Request(
        `http://localhost:3000/api/business/calendar?startDate=${startDate}&endDate=${endDate}`
      )
      const response = await getCalendar(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toBeDefined()
      expect(data.summary).toBeDefined()
    })
  })
})
