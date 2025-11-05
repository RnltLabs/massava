/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Services Management
 * GET /api/business/services - List all services for studio
 * POST /api/business/services - Create new service
 */

import { auth } from '@/auth-unified'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { createServiceSchema } from '@/lib/validations/business'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * GET /api/business/services
 * Fetch all services for the authenticated studio owner's studio
 */
export async function GET() {
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

    // 3. Fetch all services for the studio
    const services = await prisma.service.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            newBookings: true,
          },
        },
      },
    })

    return NextResponse.json({ services })
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'BusinessPortalAccessDeniedError'
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    const correlationId = crypto.randomUUID()
    console.error(
      `[Business API - Get Services] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}

/**
 * POST /api/business/services
 * Create a new service for the studio
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = createServiceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, description, price, duration } = validationResult.data

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

    // 4. Create new service
    const service = await prisma.service.create({
      data: {
        studioId: studio.id,
        name,
        description: description || null,
        price,
        duration,
      },
    })

    return NextResponse.json(
      {
        service,
        message: 'Service created successfully',
      },
      { status: 201 }
    )
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
      `[Business API - Create Service] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}
