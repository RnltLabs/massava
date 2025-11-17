/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Calendar Data
 * GET /api/business/calendar
 *
 * Fetch calendar data (bookings + time slots) for the authenticated studio owner
 *
 * Phase 4: Dynamic Slots Implementation
 * - Uses calculateAvailableSlots() when FEATURE_DYNAMIC_SLOTS_ENABLED=true
 * - Falls back to TimeSlot table when flag is false (backward compatibility)
 */

import { auth } from '@/auth'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { calendarQuerySchema } from '@/lib/validations/business'
import { NextResponse } from 'next/server'
import { calculateAvailableSlots } from '@/lib/slots'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { logger } from '@/lib/logger'

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

    // 4. Fetch services for the studio
    const services = await prisma.service.findMany({
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
    })

    // 5. Build booking where clause
    interface BookingWhereInput {
      studioId: string
      preferredDate: {
        gte: string
        lte: string
      }
      serviceId?: string
    }

    const bookingWhere: BookingWhereInput = {
      studioId: studio.id,
      preferredDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (serviceId) {
      bookingWhere.serviceId = serviceId
    }

    // 6. Fetch bookings in date range
    const bookings = await prisma.newBooking.findMany({
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
        preferredDate: 'asc',
      },
    })

    // 7. Calculate available/unavailable slots using dynamic calculation or static slots
    const calendarEvents: Array<{
      id: string
      type: 'booking' | 'slot'
      title: string
      date?: string
      startTime?: string
      endTime?: string
      available?: boolean
      remainingCapacity?: number
      reason?: string
      customerName?: string
      customerEmail?: string
      customerPhone?: string
      serviceName?: string
      serviceId?: string | null
      status?: string
      preferredDate?: string
      preferredTime?: string
      message?: string | null
    }> = []

    let totalAvailableSlots = 0
    let totalBookedSlots = 0

    if (FEATURE_FLAGS.DYNAMIC_SLOTS_ENABLED) {
      logger.info('Calendar: Using dynamic slot calculation', {
        studioId: studio.id,
        startDate,
        endDate,
      })

      // Generate date range for slot calculation
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dates: string[] = []

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0])
      }

      // Calculate slots for each date
      for (const date of dates) {
        const slotsResult = await calculateAvailableSlots(
          studio.id,
          date,
          serviceId,
          {
            includeUnavailable: true, // Include all slots for calendar view
          }
        )

        if (slotsResult.ok) {
          const daySlots = slotsResult.value

          // Add slots to calendar events
          for (const slot of daySlots) {
            calendarEvents.push({
              id: `${date}-${slot.startTime}`,
              type: 'slot',
              title: slot.available
                ? `Verfügbar (${slot.remainingCapacity} Plätze)`
                : `Nicht verfügbar${slot.reason ? `: ${getReasonText(slot.reason)}` : ''}`,
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              available: slot.available,
              remainingCapacity: slot.remainingCapacity,
              reason: slot.reason,
            })

            if (slot.available) {
              totalAvailableSlots++
            } else {
              totalBookedSlots++
            }
          }
        } else {
          logger.error('Failed to calculate slots for date', {
            date,
            errorType: slotsResult.error.type,
          })
        }
      }
    } else {
      logger.info('Calendar: Using static TimeSlot table (legacy)', {
        studioId: studio.id,
        startDate,
        endDate,
      })

      // Legacy: Fetch from TimeSlot table
      interface SlotWhereInput {
        studioId: string
        startTime: {
          gte: Date
          lte: Date
        }
        serviceId?: string
      }

      const slotWhere: SlotWhereInput = {
        studioId: studio.id,
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }

      if (serviceId) {
        slotWhere.serviceId = serviceId
      }

      const timeSlots = await prisma.timeSlot.findMany({
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
      })

      // Transform TimeSlots to calendar events
      for (const slot of timeSlots) {
        calendarEvents.push({
          id: slot.id,
          type: 'slot',
          title: `${slot.isBooked ? 'Gebucht' : 'Verfügbar'}: ${slot.service?.name || 'Jeder Service'}`,
          serviceName: slot.service?.name,
          serviceId: slot.serviceId,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          available: slot.isAvailable && !slot.isBooked,
        })

        if (slot.isAvailable && !slot.isBooked) {
          totalAvailableSlots++
        } else {
          totalBookedSlots++
        }
      }
    }

    // 8. Add bookings as events
    for (const booking of bookings) {
      calendarEvents.push({
        id: booking.id,
        type: 'booking',
        title: `${booking.customerName} - ${booking.service?.name || 'Kein Service'}`,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone ?? undefined,
        serviceName: booking.service?.name,
        serviceId: booking.serviceId,
        status: booking.status,
        date: booking.createdAt.toISOString(),
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
        message: booking.message,
      })
    }

    // 9. Return calendar data
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
        availableSlots: totalAvailableSlots,
        bookedSlots: totalBookedSlots,
      },
      meta: {
        dynamicSlotsEnabled: FEATURE_FLAGS.DYNAMIC_SLOTS_ENABLED,
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
    logger.error('Business API - Calendar Error', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Interner Serverfehler', correlationId },
      { status: 500 }
    )
  }
}

/**
 * Get German text for unavailability reason
 */
function getReasonText(
  reason: 'outside_hours' | 'at_capacity' | 'blocked' | 'in_break'
): string {
  switch (reason) {
    case 'outside_hours':
      return 'Außerhalb der Öffnungszeiten'
    case 'at_capacity':
      return 'Ausgebucht'
    case 'blocked':
      return 'Blockiert'
    case 'in_break':
      return 'Pausenzeit'
    default:
      return 'Nicht verfügbar'
  }
}
