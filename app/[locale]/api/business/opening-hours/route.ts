/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth-unified';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Opening Hours Schema
 */
const openingHoursSchema = z.record(
  z.string(),
  z
    .object({
      open: z.string(),
      close: z.string(),
    })
    .nullable()
);

/**
 * Get user's studio
 */
async function getUserStudio(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  return user?.ownedStudios[0]?.studio ?? null;
}

/**
 * GET /api/business/opening-hours
 * Get opening hours for the authenticated user's studio
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return NextResponse.json({ error: 'No studio found' }, { status: 404 });
    }

    return NextResponse.json({ openingHours: studio.openingHours });
  } catch (error) {
    console.error('GET /api/business/opening-hours error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/business/opening-hours
 * Update opening hours for the authenticated user's studio
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studio = await getUserStudio(session.user.id);

    if (!studio) {
      return NextResponse.json({ error: 'No studio found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = openingHoursSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updatedStudio = await prisma.studio.update({
      where: { id: studio.id },
      data: {
        openingHours: validated.data as any,
      },
    });

    return NextResponse.json({ openingHours: updatedStudio.openingHours });
  } catch (error) {
    console.error('PUT /api/business/opening-hours error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
