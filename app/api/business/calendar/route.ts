/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Calendar Data
 * GET /api/business/calendar
 *
 * Fetch calendar data (bookings + time slots) for the authenticated studio owner
 */

import { auth } from '@/auth-unified'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { calendarQuerySchema } from '@/lib/validations/business'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = calendarQuerySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      serviceId: searchParams.get('serviceId'),
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

    const { startDate, endDate, serviceId } = queryResult.data

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

    // 4. Build where clauses for time range
    const bookingWhere: any = {
      studioId: studio.id,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }

    const slotWhere: any = {
      studioId: studio.id,
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }

    // Add service filter if provided
    if (serviceId) {
      bookingWhere.serviceId = serviceId
      slotWhere.serviceId = serviceId
    }

    // 5. Fetch calendar data in parallel
    const [bookings, timeSlots, services] = await Promise.all([
      // Bookings in date range
      prisma.newBooking.findMany({
        where: bookingWhere,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),

      // Available time slots in date range
      prisma.timeSlot.findMany({
        where: slotWhere,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      }),

      // Services for the studio (for filtering)
      prisma.service.findMany({
        where: {
          studioId: studio.id,
        },
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ])

    // 6. Transform data for calendar view
    const calendarEvents = [
      // Bookings as events
      ...bookings.map((booking) => ({
        id: booking.id,
        type: 'booking' as const,
        title: `${booking.customerName} - ${booking.service?.name || 'No service'}`,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        serviceName: booking.service?.name,
        serviceId: booking.serviceId,
        status: booking.status,
        date: booking.createdAt.toISOString(),
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
        message: booking.message,
      })),

      // Time slots as events (available appointments)
      ...timeSlots.map((slot) => ({
        id: slot.id,
        type: 'slot' as const,
        title: `Available: ${slot.service?.name || 'Any service'}`,
        serviceName: slot.service?.name,
        serviceId: slot.serviceId,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        isBooked: slot.isBooked,
      })),
    ]

    // 7. Return calendar data
    return NextResponse.json({
      period: {
        startDate,
        endDate,
      },
      events: calendarEvents,
      services,
      summary: {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b) => b.status === 'PENDING').length,
        confirmedBookings: bookings.filter((b) => b.status === 'CONFIRMED')
          .length,
        availableSlots: timeSlots.filter((s) => !s.isBooked).length,
        bookedSlots: timeSlots.filter((s) => s.isBooked).length,
      },
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'BusinessPortalAccessDeniedError'
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    const correlationId = crypto.randomUUID()
    console.error(
      `[Business API - Calendar] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}
