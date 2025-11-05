/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Service Update/Delete
 * PATCH /api/business/services/[id] - Update service
 * DELETE /api/business/services/[id] - Delete service
 */

import { auth } from '@/auth-unified'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { updateServiceSchema } from '@/lib/validations/business'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * PATCH /api/business/services/[id]
 * Update an existing service
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    const { id: serviceId } = await params

    // Validate service ID format
    if (!serviceId || serviceId.length < 20) {
      return NextResponse.json(
        { error: 'Invalid service ID format' },
        { status: 400 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = updateServiceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

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

    // 4. Fetch service and verify ownership
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify the service belongs to the studio
    if (service.studioId !== studio.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this service' },
        { status: 403 }
      )
    }

    // 5. Update service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      service: updatedService,
      message: 'Service updated successfully',
    })
  } catch (error) {
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
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    const correlationId = crypto.randomUUID()
    console.error(
      `[Business API - Update Service] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/business/services/[id]
 * Delete a service (only if no active bookings)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    const { id: serviceId } = await params

    // Validate service ID format
    if (!serviceId || serviceId.length < 20) {
      return NextResponse.json(
        { error: 'Invalid service ID format' },
        { status: 400 }
      )
    }

    // 2. Get user's studio
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

    // 3. Fetch service and verify ownership
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED'],
                },
              },
            },
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Verify the service belongs to the studio
    if (service.studioId !== studio.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this service' },
        { status: 403 }
      )
    }

    // 4. Check for active bookings
    if (service._count.bookings > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete service with active bookings. Please cancel or complete all bookings first.',
          activeBookings: service._count.bookings,
        },
        { status: 409 }
      )
    }

    // 5. Delete service
    await prisma.service.delete({
      where: { id: serviceId },
    })

    return NextResponse.json({
      message: 'Service deleted successfully',
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
      `[Business API - Delete Service] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}
