-- Add click tracking fields to Notification model
-- Tracks when and how users interact with push notifications

ALTER TABLE "notifications"
ADD COLUMN "pushClickedAt" TIMESTAMP(3),
ADD COLUMN "pushDismissedAt" TIMESTAMP(3),
ADD COLUMN "clickAction" TEXT;

-- Add indexes for analytics queries
CREATE INDEX "notifications_pushClickedAt_idx" ON "notifications"("pushClickedAt");
CREATE INDEX "notifications_pushDismissedAt_idx" ON "notifications"("pushDismissedAt");
CREATE INDEX "notifications_userId_pushClickedAt_idx" ON "notifications"("userId", "pushClickedAt");

-- Add comment for documentation
COMMENT ON COLUMN "notifications"."pushClickedAt" IS 'Timestamp when the push notification was clicked';
COMMENT ON COLUMN "notifications"."pushDismissedAt" IS 'Timestamp when the push notification was dismissed';
COMMENT ON COLUMN "notifications"."clickAction" IS 'Action button clicked (e.g., "confirm", "view", "review") or NULL for main notification click';
