-- DropIndex
DROP INDEX "public"."new_bookings_studioId_preferredDateTime_status_idx";

-- CreateIndex
CREATE INDEX "new_bookings_capacity_check_idx" ON "new_bookings"("studioId", "status", "preferredDateTime");
