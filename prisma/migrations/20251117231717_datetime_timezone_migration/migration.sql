/*
  Warnings:

  - You are about to drop the column `preferredDate` on the `new_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `preferredTime` on the `new_bookings` table. All the data in the column will be lost.
  - Added the required column `preferredDateTime` to the `new_bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."new_bookings_preferredTime_idx";

-- DropIndex
DROP INDEX "public"."new_bookings_status_reminderSent_preferredDate_idx";

-- DropIndex
DROP INDEX "public"."new_bookings_status_reviewRequestSent_preferredDate_idx";

-- DropIndex
DROP INDEX "public"."new_bookings_studioId_preferredDate_idx";

-- DropIndex
DROP INDEX "public"."new_bookings_studioId_preferredDate_preferredTime_status_idx";

-- DropIndex
DROP INDEX "public"."new_bookings_studioId_preferredDate_status_idx";

-- AlterTable
ALTER TABLE "new_bookings" DROP COLUMN "preferredDate",
DROP COLUMN "preferredTime",
ADD COLUMN     "preferredDateTime" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "studios" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin';

-- CreateIndex
CREATE INDEX "new_bookings_studioId_preferredDateTime_idx" ON "new_bookings"("studioId", "preferredDateTime");

-- CreateIndex
CREATE INDEX "new_bookings_status_reminderSent_preferredDateTime_idx" ON "new_bookings"("status", "reminderSent", "preferredDateTime");

-- CreateIndex
CREATE INDEX "new_bookings_status_reviewRequestSent_preferredDateTime_idx" ON "new_bookings"("status", "reviewRequestSent", "preferredDateTime");

-- CreateIndex
CREATE INDEX "new_bookings_studioId_preferredDateTime_status_idx" ON "new_bookings"("studioId", "preferredDateTime", "status");
