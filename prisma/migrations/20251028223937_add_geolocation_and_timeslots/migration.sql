-- AlterTable
ALTER TABLE "studios" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "time_slots" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_bookingId_key" ON "time_slots"("bookingId");

-- CreateIndex
CREATE INDEX "time_slots_studioId_idx" ON "time_slots"("studioId");

-- CreateIndex
CREATE INDEX "time_slots_serviceId_idx" ON "time_slots"("serviceId");

-- CreateIndex
CREATE INDEX "time_slots_startTime_idx" ON "time_slots"("startTime");

-- CreateIndex
CREATE INDEX "time_slots_isAvailable_isBooked_idx" ON "time_slots"("isAvailable", "isBooked");

-- CreateIndex
CREATE INDEX "time_slots_studioId_startTime_isAvailable_idx" ON "time_slots"("studioId", "startTime", "isAvailable");

-- CreateIndex
CREATE INDEX "studios_latitude_longitude_idx" ON "studios"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
