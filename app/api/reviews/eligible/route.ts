/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Review Eligibility API Route
 * GET /api/reviews/eligible?bookingId={id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkEligibilitySchema } from '@/lib/schemas/review.schema';
import { checkReviewEligibility } from '@/lib/db/review.queries';

/**
 * GET /api/reviews/eligible?bookingId={id}
 * Check if user can review a booking
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      bookingId: searchParams.get('bookingId') || '',
    };

    // Validate input
    const validation = checkEligibilitySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { bookingId } = validation.data;

    // Check eligibility
    const eligibility = await checkReviewEligibility(bookingId, session.user.id);

    return NextResponse.json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    console.error('[API] Error checking review eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
