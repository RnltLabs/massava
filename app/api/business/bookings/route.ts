/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Bookings List
 * GET /api/business/bookings
 *
 * Fetch bookings for the authenticated studio owner's studio
 */

import { auth } from '@/auth'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { bookingsQuerySchema } from '@/lib/validations/business'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

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

    // 3. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = bookingsQuerySchema.safeParse({
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      serviceId: searchParams.get('serviceId'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
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

    // 4. Build where clause
    interface BookingWhereInput {
      studioId: string;
      status?: z.infer<typeof bookingsQuerySchema>['status'];
      serviceId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: BookingWhereInput = {
      studioId: studio.id,
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.serviceId) {
      where.serviceId = query.serviceId
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate)
      }
    }

    // 5. Fetch bookings with related data
    const [bookings, total] = await Promise.all([
      prisma.newBooking.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.newBooking.count({ where }),
    ])

    // 6. Return response with pagination metadata
    return NextResponse.json({
      bookings,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
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
    console.error(`[Business API - Bookings] Error [${correlationId}]:`, error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    )
  }
}
