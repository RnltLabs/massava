-- Add composite indexes for analytics performance optimization
-- These indexes were added to support efficient querying for booking analytics

-- Composite index for studio bookings by status
CREATE INDEX IF NOT EXISTS "new_bookings_studioId_status_idx" ON "new_bookings"("studioId", "status");

-- Composite index for studio bookings by date
CREATE INDEX IF NOT EXISTS "new_bookings_studioId_preferredDate_idx" ON "new_bookings"("studioId", "preferredDate");

-- Composite index for studio bookings by status and confirmation time
CREATE INDEX IF NOT EXISTS "new_bookings_studioId_status_confirmedAt_idx" ON "new_bookings"("studioId", "status", "confirmedAt");
