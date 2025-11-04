/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Dashboard Statistics
 * GET /api/business/stats
 *
 * Fetch dashboard statistics for the authenticated studio owner
 */

import { auth } from '@/auth-unified'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { statsQuerySchema } from '@/lib/validations/business'
import { BookingStatus } from '@/app/generated/prisma'
import { NextResponse } from 'next/server'

/**
 * Calculate date range based on period
 */
function getDateRange(period: 'day' | 'week' | 'month' | 'year') {
  const now = new Date()
  const startDate = new Date()

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      startDate.setHours(0, 0, 0, 0)
      break
  }

  return { startDate, endDate: now }
}

export async function GET(request: Request) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = statsQuerySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      period: searchParams.get('period') || 'month',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const query = queryResult.data

    // 3. Get user's studio
    const studio = await prisma.studio.findFirst({
      where: {
        ownerships: {
          some: {
            userId: session!.user!.id,
          },
        },
      },
    })

    if (!studio) {
      return NextResponse.json(
        { error: 'Studio not found. Please ensure you own a studio.' },
        { status: 404 }
      )
    }

    // 4. Determine date range
    let startDate: Date
    let endDate: Date

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate)
      endDate = new Date(query.endDate)
    } else {
      const range = getDateRange(query.period)
      startDate = range.startDate
      endDate = range.endDate
    }

    // 5. Fetch statistics in parallel
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      revenueData,
      topServices,
      recentBookings,
    ] = await Promise.all([
      // Total bookings in period
      prisma.booking.count({
        where: {
          studioId: studio.id,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Pending bookings (current)
      prisma.booking.count({
        where: {
          studioId: studio.id,
          status: BookingStatus.PENDING,
        },
      }),

      // Confirmed bookings in period
      prisma.booking.count({
        where: {
          studioId: studio.id,
          status: BookingStatus.CONFIRMED,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Cancelled bookings in period
      prisma.booking.count({
        where: {
          studioId: studio.id,
          status: BookingStatus.CANCELLED,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Revenue calculation (confirmed bookings only)
      prisma.booking.findMany({
        where: {
          studioId: studio.id,
          status: BookingStatus.CONFIRMED,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          service: {
            select: {
              price: true,
            },
          },
        },
      }),

      // Top services by booking count
      prisma.service.findMany({
        where: {
          studioId: studio.id,
        },
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
          _count: {
            select: {
              bookings: {
                where: {
                  createdAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          bookings: {
            _count: 'desc',
          },
        },
        take: 5,
      }),

      // Recent bookings
      prisma.booking.findMany({
        where: {
          studioId: studio.id,
        },
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ])

    // Calculate total revenue
    const totalRevenue = revenueData.reduce((sum, booking) => {
      return sum + (booking.service?.price || 0)
    }, 0)

    // 6. Return statistics
    return NextResponse.json({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: query.period,
      },
      overview: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        averageBookingValue:
          confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0,
      },
      topServices: topServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        bookingCount: service._count.bookings,
      })),
      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        serviceName: booking.service?.name,
        status: booking.status,
        createdAt: booking.createdAt,
      })),
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'BusinessPortalAccessDeniedError'
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    const correlationId = crypto.randomUUID()
    console.error(`[Business API - Stats] Error [${correlationId}]:`, error)

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}
