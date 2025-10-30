-- CreateTable
CREATE TABLE "blocked_times" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_times_studioId_idx" ON "blocked_times"("studioId");

-- CreateIndex
CREATE INDEX "blocked_times_startTime_idx" ON "blocked_times"("startTime");

-- CreateIndex
CREATE INDEX "blocked_times_studioId_startTime_idx" ON "blocked_times"("studioId", "startTime");

-- AddForeignKey
ALTER TABLE "blocked_times" ADD CONSTRAINT "blocked_times_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
