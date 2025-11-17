-- Add composite indexes for cron job performance optimization
-- Phase 4: Customer Engagement Email Notifications

-- Index for booking reminder cron job (finds confirmed bookings for tomorrow that need reminders)
CREATE INDEX IF NOT EXISTS "new_bookings_status_reminderSent_preferredDate_idx" ON "new_bookings"("status", "reminderSent", "preferredDate");

-- Index for review request cron job (finds confirmed bookings from yesterday that need review requests)
CREATE INDEX IF NOT EXISTS "new_bookings_status_reviewRequestSent_preferredDate_idx" ON "new_bookings"("status", "reviewRequestSent", "preferredDate");
