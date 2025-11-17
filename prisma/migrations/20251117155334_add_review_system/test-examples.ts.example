/**
 * Review System - Usage Examples and Tests
 *
 * This file demonstrates how to use the new review system
 * with the Prisma client.
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// ============================================
// 1. CREATE A REVIEW
// ============================================

/**
 * Create a new review for a completed booking
 */
async function createReview(
  bookingId: string,
  userId: string,
  studioId: string,
  rating: number,
  comment?: string
) {
  try {
    const review = await prisma.review.create({
      data: {
        bookingId,
        userId,
        studioId,
        rating,
        comment,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        studio: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('Review created:', review);

    // Update studio rating aggregates
    await updateStudioRatings(studioId);

    return review;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('rating_check')) {
        throw new Error('Rating must be between 1 and 5');
      }
      if (error.message.includes('Unique constraint')) {
        throw new Error('This booking already has a review');
      }
    }
    throw error;
  }
}

// ============================================
// 2. GET STUDIO REVIEWS
// ============================================

/**
 * Fetch all visible reviews for a studio
 */
async function getStudioReviews(
  studioId: string,
  options: {
    page?: number;
    limit?: number;
    includeHidden?: boolean;
  } = {}
) {
  const { page = 1, limit = 10, includeHidden = false } = options;
  const skip = (page - 1) * limit;

  const where = {
    studioId,
    ...(includeHidden ? {} : { isVisible: true }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// 3. UPDATE STUDIO RATING AGGREGATES
// ============================================

/**
 * Calculate and update studio rating statistics
 * Should be called after any review is created, updated, or deleted
 */
async function updateStudioRatings(studioId: string) {
  const stats = await prisma.review.aggregate({
    where: {
      studioId,
      isVisible: true,
    },
    _avg: {
      rating: true,
    },
    _count: true,
  });

  await prisma.studio.update({
    where: { id: studioId },
    data: {
      averageRating: stats._avg.rating || null,
      totalReviews: stats._count,
    },
  });

  console.log(`Updated ratings for studio ${studioId}:`, {
    averageRating: stats._avg.rating,
    totalReviews: stats._count,
  });
}

// ============================================
// 4. ADD STUDIO RESPONSE TO REVIEW
// ============================================

/**
 * Allow studio owner to respond to a review
 */
async function addStudioResponse(
  reviewId: string,
  response: string,
  respondedBy: string
) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      response,
      respondedAt: new Date(),
      respondedBy,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  console.log('Response added to review:', review);
  return review;
}

// ============================================
// 5. TOGGLE REVIEW VISIBILITY
// ============================================

/**
 * Hide or show a review (admin/moderation feature)
 */
async function toggleReviewVisibility(reviewId: string, isVisible: boolean) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { isVisible },
  });

  // Update studio ratings after visibility change
  await updateStudioRatings(review.studioId);

  return review;
}

// ============================================
// 6. GET USER'S REVIEWS
// ============================================

/**
 * Get all reviews written by a user
 */
async function getUserReviews(userId: string) {
  return await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      studio: {
        select: {
          name: true,
          city: true,
        },
      },
      booking: {
        select: {
          preferredDate: true,
          preferredTime: true,
        },
      },
    },
  });
}

// ============================================
// 7. GET STUDIOS BY RATING
// ============================================

/**
 * Find top-rated studios
 */
async function getTopRatedStudios(limit: number = 10, minReviews: number = 5) {
  return await prisma.studio.findMany({
    where: {
      totalReviews: {
        gte: minReviews,
      },
      averageRating: {
        not: null,
      },
    },
    orderBy: {
      averageRating: 'desc',
    },
    take: limit,
    select: {
      id: true,
      name: true,
      city: true,
      averageRating: true,
      totalReviews: true,
    },
  });
}

// ============================================
// 8. CHECK IF USER CAN REVIEW BOOKING
// ============================================

/**
 * Validate if a user can leave a review for a booking
 */
async function canUserReviewBooking(bookingId: string, userId: string) {
  const booking = await prisma.newBooking.findUnique({
    where: { id: bookingId },
    include: {
      review: true,
    },
  });

  if (!booking) {
    return { canReview: false, reason: 'Booking not found' };
  }

  if (booking.customerId !== userId) {
    return { canReview: false, reason: 'Not your booking' };
  }

  if (booking.status !== 'CONFIRMED') {
    return { canReview: false, reason: 'Booking not confirmed/completed' };
  }

  if (booking.review) {
    return { canReview: false, reason: 'Review already exists' };
  }

  // Optional: Check if booking date has passed
  const bookingDate = new Date(booking.preferredDate);
  if (bookingDate > new Date()) {
    return { canReview: false, reason: 'Booking date has not passed yet' };
  }

  return { canReview: true };
}

// ============================================
// 9. GET REVIEW STATISTICS BY RATING
// ============================================

/**
 * Get rating distribution for a studio
 */
async function getStudioRatingDistribution(studioId: string) {
  const reviews = await prisma.review.groupBy({
    by: ['rating'],
    where: {
      studioId,
      isVisible: true,
    },
    _count: {
      rating: true,
    },
  });

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((group) => {
    distribution[group.rating as keyof typeof distribution] = group._count.rating;
  });

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  return {
    distribution,
    total,
    percentages: Object.fromEntries(
      Object.entries(distribution).map(([rating, count]) => [
        rating,
        total > 0 ? ((count / total) * 100).toFixed(1) : '0.0',
      ])
    ),
  };
}

// ============================================
// 10. BULK UPDATE ALL STUDIO RATINGS
// ============================================

/**
 * Recalculate ratings for all studios
 * Useful for maintenance or after data migration
 */
async function recalculateAllStudioRatings() {
  const studios = await prisma.studio.findMany({
    select: { id: true },
  });

  console.log(`Recalculating ratings for ${studios.length} studios...`);

  for (const studio of studios) {
    await updateStudioRatings(studio.id);
  }

  console.log('All studio ratings updated');
}

// ============================================
// EXAMPLE USAGE
// ============================================

async function exampleUsage() {
  try {
    // Example 1: Create a review
    const newReview = await createReview(
      'booking-id-123',
      'user-id-456',
      'studio-id-789',
      5,
      'Amazing experience! Highly recommend.'
    );

    // Example 2: Get studio reviews
    const studioReviews = await getStudioReviews('studio-id-789', {
      page: 1,
      limit: 10,
    });
    console.log('Studio reviews:', studioReviews);

    // Example 3: Add studio response
    await addStudioResponse(
      newReview.id,
      'Thank you for your kind words!',
      'studio-owner-id'
    );

    // Example 4: Get rating distribution
    const distribution = await getStudioRatingDistribution('studio-id-789');
    console.log('Rating distribution:', distribution);

    // Example 5: Get top-rated studios
    const topStudios = await getTopRatedStudios(10, 5);
    console.log('Top rated studios:', topStudios);

    // Example 6: Check if user can review
    const canReview = await canUserReviewBooking('booking-id-123', 'user-id-456');
    console.log('Can review:', canReview);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export all functions
export {
  createReview,
  getStudioReviews,
  updateStudioRatings,
  addStudioResponse,
  toggleReviewVisibility,
  getUserReviews,
  getTopRatedStudios,
  canUserReviewBooking,
  getStudioRatingDistribution,
  recalculateAllStudioRatings,
};

// Uncomment to run examples
// exampleUsage();
