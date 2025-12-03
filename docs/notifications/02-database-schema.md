# Database Schema

## Overview

Add three new models to `prisma/schema.prisma`:
1. `Notification` - Stores all notification history
2. `NotificationPreference` - User settings per notification type
3. `DeviceToken` - FCM tokens for push notifications

Also add relations to the existing `User` model.

## Prisma Schema Additions

Add these models to `prisma/schema.prisma`:

```prisma
// ============================================
// NOTIFICATION SYSTEM
// ============================================

model Notification {
  id                String              @id @default(cuid())
  userId            String
  type              NotificationType
  title             String
  body              String
  metadata          Json?

  // Idempotency (prevent duplicates on retry)
  idempotencyKey    String?             @unique

  // Status tracking
  status            NotificationStatus  @default(PENDING)
  statusHistory     Json?               // [{status, timestamp, reason, channel}]

  // Channel delivery tracking
  channels          NotificationChannel[]
  pushDeliveredAt   DateTime?
  pushReadAt        DateTime?
  pushFailedAt      DateTime?
  pushError         String?
  emailSentAt       DateTime?
  emailOpenedAt     DateTime?
  emailFailedAt     DateTime?
  emailError        String?
  inAppSeenAt       DateTime?

  // Retry logic
  retryCount        Int                 @default(0)
  maxRetries        Int                 @default(3)
  lastRetryAt       DateTime?
  nextRetryAt       DateTime?

  // Scheduling
  scheduledFor      DateTime?
  expiresAt         DateTime?

  // Priority
  priority          NotificationPriority @default(NORMAL)

  // Deep link for click action
  actionUrl         String?

  // Relations
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookingId         String?
  studioId          String?

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([userId, status])
  @@index([userId, createdAt])
  @@index([userId, type])
  @@index([scheduledFor])
  @@index([idempotencyKey])
  @@index([status, nextRetryAt])
  @@index([createdAt]) // For retention cleanup
  @@map("notifications")
}

model NotificationPreference {
  id                  String            @id @default(cuid())
  userId              String            @unique

  // Global channel toggles
  pushEnabled         Boolean           @default(true)
  emailEnabled        Boolean           @default(true)
  inAppEnabled        Boolean           @default(true)

  // Quiet hours
  quietHoursEnabled   Boolean           @default(false)
  quietHoursStart     String?           // "22:00" (HH:mm format)
  quietHoursEnd       String?           // "08:00" (HH:mm format)
  timezone            String            @default("Europe/Berlin")

  // Per-type preferences stored as JSON for flexibility
  // Format: { "BOOKING_REQUEST_RECEIVED": { "push": true, "email": "instant", "inApp": true } }
  typePreferences     Json              @default("{}")

  // Email digest settings
  emailDigestEnabled  Boolean           @default(false)
  digestFrequency     DigestFrequency   @default(DAILY)
  digestTime          String?           @default("09:00") // HH:mm

  // Language for notification content
  language            String            @default("de")

  // Relations
  user                User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@map("notification_preferences")
}

model DeviceToken {
  id                String            @id @default(cuid())
  userId            String
  token             String            @unique
  platform          DevicePlatform

  // Device metadata
  deviceName        String?
  deviceModel       String?
  appVersion        String?
  osVersion         String?

  // Token validation
  isActive          Boolean           @default(true)
  lastUsedAt        DateTime          @default(now())

  // Failure tracking for token cleanup
  failureCount      Int               @default(0)
  lastFailureAt     DateTime?
  lastFailureReason String?

  // Relations
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([userId])
  @@index([userId, isActive])
  @@index([platform])
  @@index([lastUsedAt]) // For cleanup of stale tokens
  @@map("device_tokens")
}

// ============================================
// ENUMS
// ============================================

enum NotificationType {
  // Studio Owner
  BOOKING_REQUEST_RECEIVED
  BOOKING_CANCELLED_BY_CUSTOMER
  BOOKING_REMINDER_STUDIO
  PAYMENT_RECEIVED
  REVIEW_POSTED
  LOW_AVAILABILITY_ALERT

  // Customer
  BOOKING_CONFIRMED
  BOOKING_REJECTED
  BOOKING_REMINDER_CUSTOMER
  BOOKING_CANCELLED_BY_STUDIO
  REVIEW_REQUEST
  STUDIO_PROMOTION

  // Security
  ACCOUNT_LOGIN_NEW_DEVICE
  ACCOUNT_PASSWORD_CHANGED
  ACCOUNT_EMAIL_CHANGED
  ACCOUNT_TWO_FACTOR_ENABLED
  ACCOUNT_DELETION_SCHEDULED
  ACCOUNT_DELETION_CANCELLED

  // System
  SYSTEM_MAINTENANCE
  FEATURE_ANNOUNCEMENT
  TERMS_UPDATE
  WELCOME
  ONBOARDING_REMINDER
  SUBSCRIPTION_EXPIRING
  SUBSCRIPTION_EXPIRED
}

enum NotificationStatus {
  PENDING           // Created, not yet queued
  QUEUED            // In QStash queue
  SENDING           // Being processed
  DELIVERED         // Successfully sent to at least one channel
  PARTIALLY_DELIVERED // Some channels succeeded, some failed
  READ              // User has seen/interacted
  FAILED            // All channels failed after retries
  EXPIRED           // Past expiresAt, not delivered
  CANCELLED         // Manually cancelled
}

enum NotificationPriority {
  URGENT   // Immediate, bypasses quiet hours
  HIGH     // Immediate, respects quiet hours
  NORMAL   // May be slightly delayed
  LOW      // Can be batched/digested
}

enum NotificationChannel {
  PUSH
  EMAIL
  IN_APP
}

enum DevicePlatform {
  IOS
  ANDROID
  WEB
}

enum DigestFrequency {
  DAILY
  WEEKLY
}
```

## Update User Model

Add these relations to the existing `User` model:

```prisma
model User {
  // ... existing fields ...

  // Add these relations
  notifications           Notification[]
  notificationPreference  NotificationPreference?
  deviceTokens            DeviceToken[]
}
```

## Migration Steps

The implementing agent should:

1. **Add the schema changes** to `prisma/schema.prisma`

2. **Create migration:**
```bash
npx prisma migrate dev --name add_notification_system
```

3. **Generate client:**
```bash
npx prisma generate
```

4. **Verify migration** by checking the generated SQL

## Default Preferences Backfill

After migration, create default preferences for existing users:

```typescript
// prisma/seed-notification-preferences.ts
import { prisma } from '@/lib/prisma';

async function backfillNotificationPreferences() {
  const usersWithoutPreferences = await prisma.user.findMany({
    where: {
      notificationPreference: null,
    },
    select: { id: true },
  });

  console.log(`Creating preferences for ${usersWithoutPreferences.length} users`);

  for (const user of usersWithoutPreferences) {
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        // All defaults from schema
      },
    });
  }

  console.log('Backfill complete');
}

backfillNotificationPreferences()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Type Safety

Create TypeScript types for the JSON fields:

```typescript
// lib/notifications/notification-types.ts

export interface StatusHistoryEntry {
  status: NotificationStatus;
  timestamp: string; // ISO 8601
  reason?: string;
  channel?: NotificationChannel;
}

export interface TypePreference {
  push: boolean;
  email: 'instant' | 'digest' | 'off';
  inApp: boolean;
}

export interface TypePreferences {
  [key: string]: TypePreference; // key is NotificationType
}

// Default preferences per notification type
export const DEFAULT_TYPE_PREFERENCES: Record<NotificationType, TypePreference> = {
  BOOKING_REQUEST_RECEIVED: { push: true, email: 'instant', inApp: true },
  BOOKING_CANCELLED_BY_CUSTOMER: { push: true, email: 'instant', inApp: true },
  BOOKING_REMINDER_STUDIO: { push: true, email: 'off', inApp: true },
  PAYMENT_RECEIVED: { push: true, email: 'instant', inApp: true },
  REVIEW_POSTED: { push: true, email: 'off', inApp: true },
  LOW_AVAILABILITY_ALERT: { push: false, email: 'instant', inApp: true },

  BOOKING_CONFIRMED: { push: true, email: 'instant', inApp: true },
  BOOKING_REJECTED: { push: true, email: 'instant', inApp: true },
  BOOKING_REMINDER_CUSTOMER: { push: true, email: 'off', inApp: true },
  BOOKING_CANCELLED_BY_STUDIO: { push: true, email: 'instant', inApp: true },
  REVIEW_REQUEST: { push: true, email: 'instant', inApp: false },
  STUDIO_PROMOTION: { push: false, email: 'digest', inApp: false },

  ACCOUNT_LOGIN_NEW_DEVICE: { push: true, email: 'instant', inApp: false },
  ACCOUNT_PASSWORD_CHANGED: { push: false, email: 'instant', inApp: false },
  ACCOUNT_EMAIL_CHANGED: { push: false, email: 'instant', inApp: false },
  ACCOUNT_TWO_FACTOR_ENABLED: { push: false, email: 'instant', inApp: false },
  ACCOUNT_DELETION_SCHEDULED: { push: false, email: 'instant', inApp: true },
  ACCOUNT_DELETION_CANCELLED: { push: false, email: 'instant', inApp: true },

  SYSTEM_MAINTENANCE: { push: true, email: 'instant', inApp: true },
  FEATURE_ANNOUNCEMENT: { push: false, email: 'off', inApp: true },
  TERMS_UPDATE: { push: false, email: 'instant', inApp: true },
  WELCOME: { push: false, email: 'instant', inApp: false },
  ONBOARDING_REMINDER: { push: true, email: 'instant', inApp: false },
  SUBSCRIPTION_EXPIRING: { push: true, email: 'instant', inApp: true },
  SUBSCRIPTION_EXPIRED: { push: true, email: 'instant', inApp: true },
};
```

## Notification Metadata Types

```typescript
// lib/notifications/notification-metadata.ts

export interface BookingNotificationMetadata {
  bookingId: string;
  customerName: string;
  serviceName: string;
  servicePrice?: number;
  appointmentTime: string; // ISO 8601
  studioName: string;
  studioId: string;
}

export interface PaymentNotificationMetadata {
  bookingId: string;
  amount: number;
  currency: string;
  customerName: string;
}

export interface ReviewNotificationMetadata {
  reviewId: string;
  bookingId: string;
  rating: number;
  reviewerName: string;
  studioName: string;
}

export interface SecurityNotificationMetadata {
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
}

export interface SystemNotificationMetadata {
  maintenanceStart?: string;
  maintenanceEnd?: string;
  featureName?: string;
  version?: string;
}

// Discriminated union for type safety
export type NotificationMetadata =
  | { type: 'BOOKING_REQUEST_RECEIVED'; data: BookingNotificationMetadata }
  | { type: 'BOOKING_CONFIRMED'; data: BookingNotificationMetadata }
  | { type: 'BOOKING_REJECTED'; data: BookingNotificationMetadata }
  | { type: 'BOOKING_CANCELLED_BY_CUSTOMER'; data: BookingNotificationMetadata }
  | { type: 'BOOKING_CANCELLED_BY_STUDIO'; data: BookingNotificationMetadata }
  | { type: 'BOOKING_REMINDER_STUDIO'; data: BookingNotificationMetadata }
  | { type: 'BOOKING_REMINDER_CUSTOMER'; data: BookingNotificationMetadata }
  | { type: 'PAYMENT_RECEIVED'; data: PaymentNotificationMetadata }
  | { type: 'REVIEW_POSTED'; data: ReviewNotificationMetadata }
  | { type: 'REVIEW_REQUEST'; data: ReviewNotificationMetadata }
  | { type: 'ACCOUNT_LOGIN_NEW_DEVICE'; data: SecurityNotificationMetadata }
  | { type: 'SYSTEM_MAINTENANCE'; data: SystemNotificationMetadata }
  // ... add remaining types
  | { type: string; data: Record<string, unknown> }; // Fallback
```

## Indexes Explained

| Index | Purpose |
|-------|---------|
| `[userId, status]` | Fetch user's unread notifications |
| `[userId, createdAt]` | Chronological listing with pagination |
| `[userId, type]` | Filter by notification type |
| `[scheduledFor]` | Cron job for scheduled notifications |
| `[idempotencyKey]` | Fast duplicate detection |
| `[status, nextRetryAt]` | Retry queue processing |
| `[createdAt]` | Data retention cleanup |

## Verification

After implementation, verify:

1. `npx prisma migrate status` shows no pending migrations
2. `npx prisma generate` succeeds
3. TypeScript compiles without errors
4. Can create/read/update/delete notifications via Prisma client
