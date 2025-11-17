-- ============================================
-- Rollback Migration: Remove Review System
-- Description: Safely removes reviews table and rating fields from studios
-- Date: 2025-11-17
-- WARNING: This will permanently delete all review data!
-- ============================================

-- Step 1: Drop foreign key constraints first
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_userId_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_studioId_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_bookingId_fkey";

-- Step 2: Drop indexes
DROP INDEX IF EXISTS "studios_averageRating_idx";
DROP INDEX IF EXISTS "reviews_studioId_createdAt_idx";
DROP INDEX IF EXISTS "reviews_studioId_isVisible_idx";
DROP INDEX IF EXISTS "reviews_rating_idx";
DROP INDEX IF EXISTS "reviews_bookingId_idx";
DROP INDEX IF EXISTS "reviews_userId_idx";
DROP INDEX IF EXISTS "reviews_studioId_idx";
DROP INDEX IF EXISTS "reviews_bookingId_key";

-- Step 3: Drop reviews table
-- This will permanently delete all review data
DROP TABLE IF EXISTS "reviews";

-- Step 4: Remove rating aggregation fields from studios
ALTER TABLE "studios" DROP COLUMN IF EXISTS "totalReviews";
ALTER TABLE "studios" DROP COLUMN IF EXISTS "averageRating";

-- ============================================
-- Rollback Complete
-- All review system components have been removed
-- ============================================
