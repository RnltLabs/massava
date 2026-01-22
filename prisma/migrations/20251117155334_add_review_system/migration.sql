-- ============================================
-- Migration: Add Review System
-- Description: Creates reviews table and adds rating aggregation fields to studios
-- Date: 2025-11-17
-- ============================================

-- Step 1: Add review aggregation fields to studios table
-- These fields will store calculated review statistics
ALTER TABLE "studios" ADD COLUMN "averageRating" DOUBLE PRECISION,
ADD COLUMN "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- Step 2: Create reviews table
-- Stores customer reviews for completed bookings
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Step 3: Create indexes for efficient querying
-- Unique constraint: One review per booking
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- Single column indexes for basic lookups
CREATE INDEX "reviews_studioId_idx" ON "reviews"("studioId");
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");
CREATE INDEX "reviews_bookingId_idx" ON "reviews"("bookingId");
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- Composite indexes for common query patterns
-- For fetching visible reviews for a studio
CREATE INDEX "reviews_studioId_isVisible_idx" ON "reviews"("studioId", "isVisible");

-- For fetching recent reviews for a studio (ordered by date)
CREATE INDEX "reviews_studioId_createdAt_idx" ON "reviews"("studioId", "createdAt");

-- Index on studios for sorting by rating
CREATE INDEX "studios_averageRating_idx" ON "studios"("averageRating");

-- Step 4: Add foreign key constraints with CASCADE delete
-- When a booking is deleted, its review should be deleted
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "new_bookings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- When a studio is deleted, all its reviews should be deleted
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_studioId_fkey"
    FOREIGN KEY ("studioId") REFERENCES "studios"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- When a user is deleted, their reviews should be deleted
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Migration Complete
-- Next Steps:
-- 1. Apply this migration with: npx prisma migrate deploy
-- 2. Test the rating constraint by inserting a review
-- 3. Implement application logic to update averageRating and totalReviews
-- 4. Create triggers or use application logic to maintain rating aggregations
-- ============================================
