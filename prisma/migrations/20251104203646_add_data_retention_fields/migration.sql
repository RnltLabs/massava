-- AlterTable
-- Add GDPR data retention fields to users table
-- MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion

ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletionScheduledAt" TIMESTAMP(3);

-- Create indexes for efficient queries
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");
CREATE INDEX "users_deletionScheduledAt_idx" ON "users"("deletionScheduledAt");
