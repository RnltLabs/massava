/*
  Warnings:

  - You are about to drop the column `preferredDate` on the `new_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `preferredTime` on the `new_bookings` table. All the data in the column will be lost.
  - Added the required column `preferredDateTime` to the `new_bookings` table without a default value. This is not possible if the table is not empty.

*/

-- STEP 1: Add timezone to studios with default
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin';

-- STEP 2: Add preferredDateTime as NULLABLE first
ALTER TABLE "new_bookings" ADD COLUMN IF NOT EXISTS "preferredDateTime" TIMESTAMPTZ;

-- STEP 3: Migrate data from preferredDate + preferredTime to preferredDateTime
-- Combine date and time into a proper TIMESTAMPTZ (assumes Europe/Berlin timezone)
UPDATE "new_bookings"
SET "preferredDateTime" = (
  CASE
    WHEN "preferredDate" IS NOT NULL AND "preferredTime" IS NOT NULL
    THEN ("preferredDate"::text || ' ' || "preferredTime"::text)::timestamp AT TIME ZONE 'Europe/Berlin'
    ELSE NULL
  END
)
WHERE "preferredDateTime" IS NULL;

-- STEP 4: Make preferredDateTime NOT NULL (only after data is migrated)
ALTER TABLE "new_bookings" ALTER COLUMN "preferredDateTime" SET NOT NULL;

-- STEP 5: Drop old indexes
DROP INDEX IF EXISTS "public"."new_bookings_preferredTime_idx";
DROP INDEX IF EXISTS "public"."new_bookings_status_reminderSent_preferredDate_idx";
DROP INDEX IF EXISTS "public"."new_bookings_status_reviewRequestSent_preferredDate_idx";
DROP INDEX IF EXISTS "public"."new_bookings_studioId_preferredDate_idx";
DROP INDEX IF EXISTS "public"."new_bookings_studioId_preferredDate_preferredTime_status_idx";
DROP INDEX IF EXISTS "public"."new_bookings_studioId_preferredDate_status_idx";

-- STEP 6: Drop old columns (only after data is safely migrated)
ALTER TABLE "new_bookings" DROP COLUMN IF EXISTS "preferredDate";
ALTER TABLE "new_bookings" DROP COLUMN IF EXISTS "preferredTime";

-- STEP 7: Create new indexes for preferredDateTime
-- CreateIndex
CREATE INDEX "new_bookings_studioId_preferredDateTime_idx" ON "new_bookings"("studioId", "preferredDateTime");

-- CreateIndex
CREATE INDEX "new_bookings_status_reminderSent_preferredDateTime_idx" ON "new_bookings"("status", "reminderSent", "preferredDateTime");

-- CreateIndex
CREATE INDEX "new_bookings_status_reviewRequestSent_preferredDateTime_idx" ON "new_bookings"("status", "reviewRequestSent", "preferredDateTime");

-- CreateIndex
CREATE INDEX "new_bookings_studioId_preferredDateTime_status_idx" ON "new_bookings"("studioId", "preferredDateTime", "status");
