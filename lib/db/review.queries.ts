/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Database Queries for Reviews
 */

import { prisma } from '@/lib/prisma';
import type { Review, BookingStatus } from '@/app/generated/prisma';

/**
 * Check if a user is eligible to review a booking
 */
export async function checkReviewEligibility(
  bookingId: string,
  userId: string
): Promise<{
  eligible: boolean;
  reason?: string;
}> {
  // Get booking with review info
  const booking = await prisma.newBooking.findUnique({
    where: { id: bookingId },
    include: {
      review: true,
    },
  });

  if (!booking) {
    return { eligible: false, reason: 'Booking not found' };
  }

  // Check if booking belongs to user
  if (booking.customerId !== userId) {
    return { eligible: false, reason: 'Not your booking' };
  }

  // Check if booking is confirmed
  if (booking.status !== 'CONFIRMED') {
    return { eligible: false, reason: 'Booking must be confirmed' };
  }

  // Check if booking date is in the past
  const bookingDate = new Date(`${booking.preferredDate}T${booking.preferredTime}`);
  if (bookingDate > new Date()) {
    return { eligible: false, reason: 'Booking date must be in the past' };
  }

  // Check if review already exists
  if (booking.review) {
    return { eligible: false, reason: 'Review already submitted' };
  }

  return { eligible: true };
}

/**
 * Create a new review
 */
export async function createReview(data: {
  bookingId: string;
  userId: string;
  studioId: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  // Create review in a transaction
  return await prisma.$transaction(async (tx) => {
    // Create the review
    const review = await tx.review.create({
      data: {
        bookingId: data.bookingId,
        userId: data.userId,
        studioId: data.studioId,
        rating: data.rating,
        comment: data.comment,
        isVisible: true,
      },
    });

    // Mark booking as review submitted
    await tx.newBooking.update({
      where: { id: data.bookingId },
      data: { reviewRequestSent: true },
    });

    // Recalculate studio rating
    const stats = await tx.review.aggregate({
      where: {
        studioId: data.studioId,
        isVisible: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // Update studio with new average rating and total reviews
    await tx.studio.update({
      where: { id: data.studioId },
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id,
      },
    });

    return review;
  });
}

/**
 * Get reviews for a studio
 */
export async function getStudioReviews(params: {
  studioId: string;
  limit: number;
  offset: number;
  sortBy: 'newest' | 'highest' | 'lowest';
}): Promise<{
  reviews: Array<Review & {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
  total: number;
}> {
  const { studioId, limit, offset, sortBy } = params;

  // Determine order by clause
  let orderBy: Record<string, unknown>;
  switch (sortBy) {
    case 'highest':
      orderBy = { rating: 'desc' };
      break;
    case 'lowest':
      orderBy = { rating: 'asc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  // Get reviews with user info
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        studioId,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.review.count({
      where: {
        studioId,
        isVisible: true,
      },
    }),
  ]);

  return { reviews, total };
}

/**
 * Add studio owner response to a review
 */
export async function addReviewResponse(
  reviewId: string,
  response: string,
  respondedBy: string
): Promise<Review> {
  return await prisma.review.update({
    where: { id: reviewId },
    data: {
      response,
      respondedBy,
      respondedAt: new Date(),
    },
  });
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
  return await prisma.review.findUnique({
    where: { id: reviewId },
  });
}

/**
 * Check if user is owner of the studio for a review
 */
export async function checkStudioOwnership(
  reviewId: string,
  userId: string
): Promise<boolean> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      studioId: true,
    },
  });

  if (!review) {
    return false;
  }

  const ownership = await prisma.studioOwnership.findFirst({
    where: {
      studioId: review.studioId,
      userId,
    },
  });

  return !!ownership;
}
