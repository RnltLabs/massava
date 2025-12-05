/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Booking Request Count API
 *
 * Returns the total number of booking requests for the authenticated studio owner's studio.
 * Used to determine if this is the studio's first booking request for contextual prompts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/studio/bookings/count
 *
 * Returns the count of booking requests for the authenticated studio owner's studio.
 *
 * Response:
 * {
 *   count: number
 * }
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's studio ownership
    const ownership = await prisma.studioOwnership.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        studioId: true,
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });

    if (!ownership) {
      return NextResponse.json(
        { error: 'No studio found' },
        { status: 404 }
      );
    }

    // Count all booking requests for this studio
    const count = await prisma.newBooking.count({
      where: {
        studioId: ownership.studioId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[API] Error fetching studio booking count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
