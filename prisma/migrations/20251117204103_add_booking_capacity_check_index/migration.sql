-- CreateIndex
CREATE INDEX "new_bookings_studioId_preferredDate_preferredTime_status_idx" ON "new_bookings"("studioId", "preferredDate", "preferredTime", "status");
