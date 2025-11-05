/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API - Opening Hours Management
 * GET /api/business/opening-hours - Get current opening hours
 * POST /api/business/opening-hours - Update opening hours
 */

import { auth } from '@/auth-unified'
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard'
import { prisma } from '@/lib/prisma'
import { updateOpeningHoursSchema } from '@/lib/validations/business'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * GET /api/business/opening-hours
 * Fetch current opening hours for the studio
 */
export async function GET() {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    // 2. Get user's studio with opening hours
    const studio = await prisma.studio.findFirst({
      where: {
        ownerships: {
          some: {
            userId: session!.user!.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        openingHours: true,
      },
    })

    if (!studio) {
      return NextResponse.json(
        { error: 'Studio not found. Please ensure you own a studio.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      studioId: studio.id,
      studioName: studio.name,
      openingHours: studio.openingHours || {},
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
      `[Business API - Get Opening Hours] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}

/**
 * POST /api/business/opening-hours
 * Update opening hours for the studio
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate and authorize
    const session = await auth()
    requireBusinessAccess(session?.user)

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = updateOpeningHoursSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const openingHoursData = validationResult.data

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

    // 4. Get current opening hours
    const currentOpeningHours =
      (studio.openingHours as Record<string, any>) || {}

    // 5. Merge with new opening hours (partial update)
    const updatedOpeningHours = {
      ...currentOpeningHours,
      ...openingHoursData,
    }

    // 6. Update studio opening hours
    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: {
        openingHours: updatedOpeningHours,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        openingHours: true,
      },
    })

    return NextResponse.json({
      studioId: updatedStudio.id,
      studioName: updatedStudio.name,
      openingHours: updatedStudio.openingHours,
      message: 'Opening hours updated successfully',
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
      `[Business API - Update Opening Hours] Error [${correlationId}]:`,
      error
    )

    return NextResponse.json(
      { error: 'Internal server error', correlationId },
      { status: 500 }
    )
  }
}
