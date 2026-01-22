-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_REQUEST_RECEIVED', 'BOOKING_CANCELLED_BY_CUSTOMER', 'BOOKING_REMINDER_STUDIO', 'PAYMENT_RECEIVED', 'REVIEW_POSTED', 'LOW_AVAILABILITY_ALERT', 'BOOKING_CONFIRMED', 'BOOKING_REJECTED', 'BOOKING_REMINDER_CUSTOMER', 'BOOKING_CANCELLED_BY_STUDIO', 'REVIEW_REQUEST', 'STUDIO_PROMOTION', 'ACCOUNT_LOGIN_NEW_DEVICE', 'ACCOUNT_PASSWORD_CHANGED', 'ACCOUNT_EMAIL_CHANGED', 'ACCOUNT_TWO_FACTOR_ENABLED', 'ACCOUNT_DELETION_SCHEDULED', 'ACCOUNT_DELETION_CANCELLED', 'SYSTEM_MAINTENANCE', 'FEATURE_ANNOUNCEMENT', 'TERMS_UPDATE', 'WELCOME', 'ONBOARDING_REMINDER', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENDING', 'DELIVERED', 'PARTIALLY_DELIVERED', 'READ', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "idempotencyKey" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "statusHistory" JSONB,
    "channels" "NotificationChannel"[],
    "pushDeliveredAt" TIMESTAMP(3),
    "pushReadAt" TIMESTAMP(3),
    "pushFailedAt" TIMESTAMP(3),
    "pushError" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "emailOpenedAt" TIMESTAMP(3),
    "emailFailedAt" TIMESTAMP(3),
    "emailError" TEXT,
    "inAppSeenAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "actionUrl" TEXT,
    "bookingId" TEXT,
    "studioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushBookings" BOOLEAN NOT NULL DEFAULT true,
    "pushCancellations" BOOLEAN NOT NULL DEFAULT true,
    "pushReminders" BOOLEAN NOT NULL DEFAULT true,
    "pushMarketing" BOOLEAN NOT NULL DEFAULT false,
    "emailBookings" BOOLEAN NOT NULL DEFAULT true,
    "emailCancellations" BOOLEAN NOT NULL DEFAULT true,
    "emailReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
    "typePreferences" JSONB NOT NULL DEFAULT '{}',
    "emailDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'DAILY',
    "digestTime" TEXT DEFAULT '09:00',
    "language" TEXT NOT NULL DEFAULT 'de',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "deviceName" TEXT,
    "deviceModel" TEXT,
    "appVersion" TEXT,
    "osVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureAt" TIMESTAMP(3),
    "lastFailureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_idempotencyKey_key" ON "notifications"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_type_idx" ON "notifications"("userId", "type");

-- CreateIndex
CREATE INDEX "notifications_scheduledFor_idx" ON "notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "notifications_idempotencyKey_idx" ON "notifications"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notifications_status_nextRetryAt_idx" ON "notifications"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "device_tokens_userId_isActive_idx" ON "device_tokens"("userId", "isActive");

-- CreateIndex
CREATE INDEX "device_tokens_platform_idx" ON "device_tokens"("platform");

-- CreateIndex
CREATE INDEX "device_tokens_lastUsedAt_idx" ON "device_tokens"("lastUsedAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
