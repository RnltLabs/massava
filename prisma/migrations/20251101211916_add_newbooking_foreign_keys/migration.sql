-- DropForeignKey
ALTER TABLE "public"."new_bookings" DROP CONSTRAINT "new_bookings_customerId_fkey";

-- CreateIndex
CREATE INDEX "new_bookings_serviceId_idx" ON "new_bookings"("serviceId");

-- AddForeignKey
ALTER TABLE "new_bookings" ADD CONSTRAINT "new_bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
