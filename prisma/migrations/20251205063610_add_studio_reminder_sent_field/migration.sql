-- CreateEnum
CREATE TYPE "ConsentAction" AS ENUM ('GRANTED', 'REVOKED', 'UPDATED', 'CATEGORIES_CHANGED');

-- AlterTable
ALTER TABLE "new_bookings" ADD COLUMN     "studioReminderSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "push_consent_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "ConsentAction" NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "previousState" JSONB,
    "triggeredBy" TEXT,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "push_consent_logs_userId_idx" ON "push_consent_logs"("userId");

-- CreateIndex
CREATE INDEX "push_consent_logs_userId_timestamp_idx" ON "push_consent_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "push_consent_logs_timestamp_idx" ON "push_consent_logs"("timestamp");

-- CreateIndex
CREATE INDEX "push_consent_logs_action_idx" ON "push_consent_logs"("action");

-- CreateIndex
CREATE INDEX "push_consent_logs_consentVersion_idx" ON "push_consent_logs"("consentVersion");

-- CreateIndex
CREATE INDEX "new_bookings_status_studioReminderSent_preferredDateTime_idx" ON "new_bookings"("status", "studioReminderSent", "preferredDateTime");

-- AddForeignKey
ALTER TABLE "push_consent_logs" ADD CONSTRAINT "push_consent_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
