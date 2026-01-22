-- ============================================
-- Review System - Rating Maintenance Scripts
-- Description: Helper SQL scripts for maintaining review ratings
-- ============================================

-- ==================================================
-- 1. MANUAL RATING UPDATE FOR A SINGLE STUDIO
-- ==================================================
-- Use this to manually recalculate ratings for a specific studio

UPDATE studios
SET
  "averageRating" = (
    SELECT AVG(rating)
    FROM reviews
    WHERE "studioId" = studios.id
      AND "isVisible" = true
  ),
  "totalReviews" = (
    SELECT COUNT(*)
    FROM reviews
    WHERE "studioId" = studios.id
      AND "isVisible" = true
  )
WHERE id = 'YOUR_STUDIO_ID_HERE';

-- ==================================================
-- 2. BULK UPDATE ALL STUDIO RATINGS
-- ==================================================
-- Use this to recalculate ratings for all studios
-- Useful after data migration or cleanup

UPDATE studios
SET
  "averageRating" = subquery."avg_rating",
  "totalReviews" = subquery."review_count"
FROM (
  SELECT
    "studioId",
    AVG(rating) as avg_rating,
    COUNT(*) as review_count
  FROM reviews
  WHERE "isVisible" = true
  GROUP BY "studioId"
) AS subquery
WHERE studios.id = subquery."studioId";

-- Reset studios with no reviews
UPDATE studios
SET
  "averageRating" = NULL,
  "totalReviews" = 0
WHERE id NOT IN (
  SELECT DISTINCT "studioId"
  FROM reviews
  WHERE "isVisible" = true
);

-- ==================================================
-- 3. CREATE AUTOMATIC TRIGGER (RECOMMENDED)
-- ==================================================
-- This trigger automatically updates studio ratings
-- when reviews are created, updated, or deleted

-- Function to update studio ratings
CREATE OR REPLACE FUNCTION update_studio_ratings()
RETURNS TRIGGER AS $$
DECLARE
  target_studio_id TEXT;
BEGIN
  -- Determine which studio to update
  IF TG_OP = 'DELETE' THEN
    target_studio_id := OLD."studioId";
  ELSE
    target_studio_id := NEW."studioId";
  END IF;

  -- Update the studio's rating statistics
  UPDATE studios
  SET
    "averageRating" = (
      SELECT AVG(rating)
      FROM reviews
      WHERE "studioId" = target_studio_id
        AND "isVisible" = true
    ),
    "totalReviews" = (
      SELECT COUNT(*)
      FROM reviews
      WHERE "studioId" = target_studio_id
        AND "isVisible" = true
    )
  WHERE id = target_studio_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS review_rating_update_trigger ON reviews;

CREATE TRIGGER review_rating_update_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_studio_ratings();

-- ==================================================
-- 4. REMOVE AUTOMATIC TRIGGER (IF NEEDED)
-- ==================================================
-- Use this if you prefer to update ratings in application code

DROP TRIGGER IF EXISTS review_rating_update_trigger ON reviews;
DROP FUNCTION IF EXISTS update_studio_ratings();

-- ==================================================
-- 5. AUDIT/VERIFICATION QUERIES
-- ==================================================

-- Check for studios with incorrect ratings
SELECT
  s.id,
  s.name,
  s."averageRating" as stored_avg,
  s."totalReviews" as stored_count,
  COALESCE(r.calculated_avg, 0) as calculated_avg,
  COALESCE(r.calculated_count, 0) as calculated_count,
  CASE
    WHEN ABS(COALESCE(s."averageRating", 0) - COALESCE(r.calculated_avg, 0)) > 0.01
      OR s."totalReviews" != COALESCE(r.calculated_count, 0)
    THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM studios s
LEFT JOIN (
  SELECT
    "studioId",
    AVG(rating) as calculated_avg,
    COUNT(*) as calculated_count
  FROM reviews
  WHERE "isVisible" = true
  GROUP BY "studioId"
) r ON s.id = r."studioId"
WHERE ABS(COALESCE(s."averageRating", 0) - COALESCE(r.calculated_avg, 0)) > 0.01
   OR s."totalReviews" != COALESCE(r.calculated_count, 0)
ORDER BY s.name;

-- ==================================================
-- 6. RATING DISTRIBUTION REPORT
-- ==================================================
-- Get overview of rating distribution across all studios

SELECT
  rating,
  COUNT(*) as review_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM reviews
WHERE "isVisible" = true
GROUP BY rating
ORDER BY rating DESC;

-- ==================================================
-- 7. STUDIOS WITHOUT REVIEWS
-- ==================================================
-- Find studios that have no reviews yet

SELECT
  s.id,
  s.name,
  s.city,
  s."totalReviews",
  s."averageRating"
FROM studios s
WHERE s."totalReviews" = 0
   OR s."averageRating" IS NULL
ORDER BY s.name;

-- ==================================================
-- 8. TOP RATED STUDIOS
-- ==================================================
-- Get top rated studios (with minimum review threshold)

SELECT
  s.id,
  s.name,
  s.city,
  s."averageRating",
  s."totalReviews"
FROM studios s
WHERE s."totalReviews" >= 5  -- Minimum reviews for ranking
  AND s."averageRating" IS NOT NULL
ORDER BY s."averageRating" DESC, s."totalReviews" DESC
LIMIT 20;

-- ==================================================
-- 9. RECENT REVIEWS REQUIRING RESPONSE
-- ==================================================
-- Find reviews without studio response (older than 7 days)

SELECT
  r.id,
  r."createdAt",
  r.rating,
  r.comment,
  s.name as studio_name,
  u.name as user_name,
  EXTRACT(DAY FROM NOW() - r."createdAt") as days_old
FROM reviews r
JOIN studios s ON r."studioId" = s.id
JOIN users u ON r."userId" = u.id
WHERE r.response IS NULL
  AND r."isVisible" = true
  AND r."createdAt" < NOW() - INTERVAL '7 days'
ORDER BY r."createdAt" ASC;

-- ==================================================
-- 10. REVIEW ACTIVITY BY MONTH
-- ==================================================
-- Get monthly review statistics

SELECT
  DATE_TRUNC('month', "createdAt") as month,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as reviews_with_response,
  ROUND(COUNT(CASE WHEN response IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as response_rate_pct
FROM reviews
WHERE "isVisible" = true
GROUP BY DATE_TRUNC('month', "createdAt")
ORDER BY month DESC
LIMIT 12;

-- ==================================================
-- USAGE NOTES
-- ==================================================
--
-- RECOMMENDATION: Use the automatic trigger (Script #3) for production
-- This ensures ratings are always up-to-date without manual intervention
--
-- If you prefer application-level updates:
-- 1. Remove the trigger (Script #4)
-- 2. Call the updateStudioRatings() function from your application
--    after each review operation (see test-examples.ts)
--
-- Periodically run the audit query (Script #5) to verify data integrity
--
-- ==================================================
