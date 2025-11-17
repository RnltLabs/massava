/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Review Response API Route
 * PATCH /api/reviews/{id}/response - Studio owner responds to review
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createReviewResponseSchema } from '@/lib/schemas/review.schema';
import {
  addReviewResponse,
  getReviewById,
  checkStudioOwnership,
} from '@/lib/db/review.queries';

/**
 * PATCH /api/reviews/{id}/response
 * Studio owner responds to a review
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = createReviewResponseSchema.safeParse({
      ...body,
      reviewId,
    });

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

    const { response } = validation.data;

    // Check if review exists
    const review = await getReviewById(reviewId);
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user owns the studio
    const isOwner = await checkStudioOwnership(reviewId, session.user.id);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to respond to this review' },
        { status: 403 }
      );
    }

    // Add response to review
    const updatedReview = await addReviewResponse(
      reviewId,
      response,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: updatedReview,
    });
  } catch (error) {
    console.error('[API] Error adding review response:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
