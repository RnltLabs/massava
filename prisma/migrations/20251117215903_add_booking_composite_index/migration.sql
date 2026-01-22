-- Add composite index for slot availability queries
-- This optimizes the frequent query pattern:
-- WHERE studioId = ? AND preferredDate = ? AND status IN ('CONFIRMED', 'PENDING')

CREATE INDEX IF NOT EXISTS "new_bookings_studioId_preferredDate_status_idx"
ON "new_bookings"("studioId", "preferredDate", "status");

-- Add index on preferredTime for sorting/filtering
CREATE INDEX IF NOT EXISTS "new_bookings_preferredTime_idx"
ON "new_bookings"("preferredTime");
