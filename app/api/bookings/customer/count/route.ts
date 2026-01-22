/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Booking Count API
 *
 * Returns the total number of bookings for the authenticated customer.
 * Used to determine if this is the user's first booking for contextual prompts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bookings/customer/count
 *
 * Returns the count of bookings for the authenticated user.
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

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Count bookings for this customer email
    const count = await prisma.newBooking.count({
      where: {
        customerEmail: session.user.email,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[API] Error fetching customer booking count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
