/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Reviews API Routes
 * POST /api/reviews - Create a review
 * GET /api/reviews?studioId={id} - Get reviews for a studio
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createReviewSchema, reviewListQuerySchema } from '@/lib/schemas/review.schema';
import {
  checkReviewEligibility,
  createReview,
  getStudioReviews,
} from '@/lib/db/review.queries';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reviews - Create a new review
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = createReviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { bookingId, rating, comment } = validation.data;

    // Check eligibility
    const eligibility = await checkReviewEligibility(bookingId, session.user.id);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { success: false, error: eligibility.reason || 'Not eligible to review' },
        { status: 403 }
      );
    }

    // Get booking to extract studioId
    const booking = await prisma.newBooking.findUnique({
      where: { id: bookingId },
      select: { studioId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Create review
    const review = await createReview({
      bookingId,
      userId: session.user.id,
      studioId: booking.studioId,
      rating,
      comment,
    });

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('[API] Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?studioId={id}&limit={n}&offset={n}&sortBy={sort}
 * Get reviews for a studio
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      studioId: searchParams.get('studioId') || '',
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
    };

    // Validate query parameters
    const validation = reviewListQuerySchema.safeParse(queryParams);
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

    const { studioId, limit, offset, sortBy } = validation.data;

    // Get reviews
    const { reviews, total } = await getStudioReviews({
      studioId,
      limit,
      offset,
      sortBy,
    });

    return NextResponse.json({
      success: true,
      data: reviews,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
