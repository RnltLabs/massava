/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Update Booking Status
 * PATCH /api/business/bookings/[id]/status
 *
 * Update the status of a booking (PENDING -> CONFIRMED or CANCELLED)
 */

import { auth } from '@/auth-unified'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { updateBookingStatusSchema } from '@/lib/validations/business'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    const { id: bookingId } = await params

    // Validate booking ID format
    if (!bookingId || bookingId.length < 20) {
      return NextResponse.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = updateBookingStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { status, notes } = validationResult.data

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

    // 4. Fetch booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify the booking belongs to the studio
    if (booking.studioId !== studio.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this booking' },
        { status: 403 }
      )
    }

    // 5. Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Send notification email to customer about status change
    // This should be handled by a notification service in the future

    // 6. Return updated booking
    return NextResponse.json({
      booking: updatedBooking,
      message: `Booking ${status.toLowerCase()}`,
    })
  } catch (error) {
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    if (
      error instanceof Error &&
      error.name === 'BusinessPortalAccessDeniedError'
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 403 }
      )
    }

    // Log error with correlation ID
    const correlationId = crypto.randomUUID()
    console.error(
      `[Business API - Update Booking Status] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    )
  }
}
