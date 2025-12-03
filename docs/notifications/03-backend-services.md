# Backend Services

## Overview

This document covers:
1. Notification Service (core business logic)
2. QStash Queue Integration
3. Server-Sent Events (SSE) for real-time
4. API Routes

## 1. Notification Service

### Core Service

```typescript
// lib/notifications/notification-service.ts

import { prisma } from '@/lib/prisma';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel
} from '@/app/generated/prisma';
import { qstashPublisher } from '@/lib/queue/qstash-publisher';
import { Result, ok, err } from '@/lib/result';
import { generateIdempotencyKey } from './utils/idempotency';
import { checkUserPreferences } from './utils/preference-checker';
import { isInQuietHours } from './utils/quiet-hours';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  actionUrl?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  bookingId?: string;
  studioId?: string;
}

export interface NotificationServiceError {
  code: 'USER_NOT_FOUND' | 'RATE_LIMITED' | 'INVALID_INPUT' | 'QUEUE_ERROR' | 'DATABASE_ERROR';
  message: string;
  details?: unknown;
}

class NotificationService {
  /**
   * Create and queue a notification
   */
  async create(
    input: CreateNotificationInput
  ): Promise<Result<{ id: string; status: NotificationStatus }, NotificationServiceError>> {
    try {
      // 1. Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { notificationPreference: true },
      });

      if (!user) {
        return err({ code: 'USER_NOT_FOUND', message: 'User not found' });
      }

      // 2. Generate idempotency key
      const idempotencyKey = generateIdempotencyKey({
        userId: input.userId,
        type: input.type,
        bookingId: input.bookingId,
        timestamp: Date.now(),
      });

      // 3. Check if duplicate
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        return ok({ id: existing.id, status: existing.status });
      }

      // 4. Determine channels based on user preferences
      const channels = input.channels ??
        await checkUserPreferences(user.notificationPreference, input.type);

      // 5. Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          metadata: input.metadata,
          priority: input.priority ?? 'NORMAL',
          channels,
          actionUrl: input.actionUrl,
          scheduledFor: input.scheduledFor,
          expiresAt: input.expiresAt,
          bookingId: input.bookingId,
          studioId: input.studioId,
          idempotencyKey,
          status: input.scheduledFor ? 'PENDING' : 'QUEUED',
          statusHistory: [{
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            reason: 'Created',
          }],
        },
      });

      // 6. Queue for processing (unless scheduled for later)
      if (!input.scheduledFor) {
        await qstashPublisher.publish({
          notificationId: notification.id,
          priority: notification.priority,
        });

        await this.updateStatus(notification.id, 'QUEUED', 'Added to queue');
      }

      return ok({ id: notification.id, status: notification.status });
    } catch (error) {
      console.error('NotificationService.create error:', error);
      return err({
        code: 'DATABASE_ERROR',
        message: 'Failed to create notification',
        details: error,
      });
    }
  }

  /**
   * Process a notification (called by QStash webhook)
   */
  async process(notificationId: string): Promise<Result<void, NotificationServiceError>> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          include: {
            notificationPreference: true,
            deviceTokens: { where: { isActive: true } },
          }
        }
      },
    });

    if (!notification) {
      return err({ code: 'INVALID_INPUT', message: 'Notification not found' });
    }

    // Check if expired
    if (notification.expiresAt && notification.expiresAt < new Date()) {
      await this.updateStatus(notificationId, 'EXPIRED', 'Past expiration time');
      return ok(undefined);
    }

    // Check quiet hours (unless URGENT)
    if (notification.priority !== 'URGENT') {
      const prefs = notification.user.notificationPreference;
      if (prefs && isInQuietHours(prefs)) {
        // Reschedule for end of quiet hours
        const nextDelivery = this.calculateNextDeliveryTime(prefs);
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            scheduledFor: nextDelivery,
            status: 'PENDING',
          },
        });
        return ok(undefined);
      }
    }

    await this.updateStatus(notificationId, 'SENDING', 'Processing channels');

    // Process each channel
    const results = await Promise.allSettled(
      notification.channels.map(channel =>
        this.deliverToChannel(notification, channel)
      )
    );

    // Determine final status
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    if (successes === notification.channels.length) {
      await this.updateStatus(notificationId, 'DELIVERED', 'All channels succeeded');
    } else if (successes > 0) {
      await this.updateStatus(notificationId, 'PARTIALLY_DELIVERED',
        `${successes}/${notification.channels.length} channels succeeded`);
    } else if (notification.retryCount < notification.maxRetries) {
      // Schedule retry
      await this.scheduleRetry(notificationId);
    } else {
      await this.updateStatus(notificationId, 'FAILED', 'Max retries exceeded');
    }

    return ok(undefined);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Result<void, NotificationServiceError>> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return err({ code: 'INVALID_INPUT', message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        inAppSeenAt: new Date(),
      },
    });

    return ok(undefined);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<Result<{ count: number }, NotificationServiceError>> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
        inAppSeenAt: null,
      },
      data: {
        status: 'READ',
        inAppSeenAt: new Date(),
      },
    });

    return ok({ count: result.count });
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      status?: NotificationStatus[];
      type?: NotificationType[];
      limit?: number;
      cursor?: string;
    } = {}
  ) {
    const { status, type, limit = 20, cursor } = options;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(status && { status: { in: status } }),
        ...(type && { type: { in: type } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return { items, hasMore, nextCursor };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
        inAppSeenAt: null,
      },
    });
  }

  // Private helper methods
  private async deliverToChannel(
    notification: any, // Full notification with relations
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel) {
      case 'PUSH':
        await this.deliverPush(notification);
        break;
      case 'EMAIL':
        await this.deliverEmail(notification);
        break;
      case 'IN_APP':
        await this.deliverInApp(notification);
        break;
    }
  }

  private async deliverPush(notification: any): Promise<void> {
    // Implementation in 04-push-notifications.md
    const { pushService } = await import('@/lib/firebase/fcm-service');
    await pushService.sendToUser(notification);
  }

  private async deliverEmail(notification: any): Promise<void> {
    // Use existing Resend integration
    const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
    await sendNotificationEmail(notification);
  }

  private async deliverInApp(notification: any): Promise<void> {
    // Publish to SSE via Redis
    const { ssePublisher } = await import('@/lib/sse/redis-pubsub');
    await ssePublisher.publishToUser(notification.userId, notification);

    await prisma.notification.update({
      where: { id: notification.id },
      data: { inAppSeenAt: null }, // Will be set when user views
    });
  }

  private async updateStatus(
    id: string,
    status: NotificationStatus,
    reason: string
  ): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { statusHistory: true },
    });

    const history = (notification?.statusHistory as any[]) ?? [];
    history.push({
      status,
      timestamp: new Date().toISOString(),
      reason,
    });

    await prisma.notification.update({
      where: { id },
      data: { status, statusHistory: history },
    });
  }

  private async scheduleRetry(id: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) return;

    const backoffMs = Math.pow(2, notification.retryCount) * 1000; // Exponential backoff
    const nextRetry = new Date(Date.now() + backoffMs);

    await prisma.notification.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
        nextRetryAt: nextRetry,
        status: 'PENDING',
      },
    });

    // Schedule via QStash
    await qstashPublisher.publishDelayed({
      notificationId: id,
      priority: notification.priority,
    }, backoffMs);
  }

  private calculateNextDeliveryTime(prefs: any): Date {
    // Calculate when quiet hours end
    const now = new Date();
    const [endHour, endMinute] = (prefs.quietHoursEnd ?? '08:00').split(':').map(Number);

    const nextDelivery = new Date(now);
    nextDelivery.setHours(endHour, endMinute, 0, 0);

    if (nextDelivery <= now) {
      nextDelivery.setDate(nextDelivery.getDate() + 1);
    }

    return nextDelivery;
  }
}

export const notificationService = new NotificationService();
```

## 2. QStash Integration

### Publisher

```typescript
// lib/queue/qstash-publisher.ts

import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/webhook`;

interface QueueMessage {
  notificationId: string;
  priority: string;
}

class QStashPublisher {
  async publish(message: QueueMessage): Promise<void> {
    await qstash.publishJSON({
      url: WEBHOOK_URL,
      body: message,
      retries: 3,
    });
  }

  async publishDelayed(message: QueueMessage, delayMs: number): Promise<void> {
    await qstash.publishJSON({
      url: WEBHOOK_URL,
      body: message,
      delay: Math.ceil(delayMs / 1000), // QStash uses seconds
      retries: 3,
    });
  }

  async publishScheduled(message: QueueMessage, scheduleAt: Date): Promise<void> {
    const delay = Math.max(0, Math.ceil((scheduleAt.getTime() - Date.now()) / 1000));

    await qstash.publishJSON({
      url: WEBHOOK_URL,
      body: message,
      delay,
      retries: 3,
    });
  }
}

export const qstashPublisher = new QStashPublisher();
```

### Webhook Handler

```typescript
// app/api/qstash/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { notificationService } from '@/lib/notifications/notification-service';

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Missing notificationId' },
        { status: 400 }
      );
    }

    const result = await notificationService.process(notificationId);

    if (!result.ok) {
      console.error('Notification processing failed:', result.error);
      // Return 200 to prevent QStash retry for known errors
      return NextResponse.json({ processed: false, error: result.error });
    }

    return NextResponse.json({ processed: true });
  } catch (error) {
    console.error('QStash webhook error:', error);
    // Return 500 to trigger QStash retry
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify QStash signature
export const POST = verifySignatureAppRouter(handler);
```

## 3. SSE (Server-Sent Events)

### Redis Pub/Sub

```typescript
// lib/sse/redis-pubsub.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CHANNEL_PREFIX = 'notifications:';

class SSEPublisher {
  async publishToUser(userId: string, notification: any): Promise<void> {
    const channel = `${CHANNEL_PREFIX}${userId}`;
    await redis.publish(channel, JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: Date.now(),
    }));
  }

  async publishBadgeUpdate(userId: string, count: number): Promise<void> {
    const channel = `${CHANNEL_PREFIX}${userId}`;
    await redis.publish(channel, JSON.stringify({
      type: 'badge_update',
      data: { count },
      timestamp: Date.now(),
    }));
  }
}

export const ssePublisher = new SSEPublisher();
```

### SSE Endpoint

```typescript
// app/api/notifications/stream/route.ts

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const channel = `notifications:${userId}`;

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Heartbeat interval
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Poll for messages (Upstash REST doesn't support true pub/sub)
      // For production, consider using Upstash's serverless Redis with pub/sub
      const pollInterval = setInterval(async () => {
        try {
          const messages = await redis.lrange(`${channel}:queue`, 0, -1);

          if (messages.length > 0) {
            for (const msg of messages) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
              );
            }
            await redis.del(`${channel}:queue`);
          }
        } catch (error) {
          console.error('SSE poll error:', error);
        }
      }, 1000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
```

### Updated Publisher for Queue-based SSE

```typescript
// lib/sse/redis-pubsub.ts (updated)

class SSEPublisher {
  async publishToUser(userId: string, notification: any): Promise<void> {
    const channel = `notifications:${userId}:queue`;
    const message = {
      type: 'notification',
      data: notification,
      timestamp: Date.now(),
    };

    // Push to list and set expiry
    await redis.lpush(channel, JSON.stringify(message));
    await redis.expire(channel, 60); // 60 second expiry
  }

  async publishBadgeUpdate(userId: string, count: number): Promise<void> {
    const channel = `notifications:${userId}:queue`;
    const message = {
      type: 'badge_update',
      data: { count },
      timestamp: Date.now(),
    };

    await redis.lpush(channel, JSON.stringify(message));
    await redis.expire(channel, 60);
  }
}
```

## 4. API Routes

### Notifications CRUD

```typescript
// app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notificationService } from '@/lib/notifications/notification-service';
import { z } from 'zod';

const querySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = querySchema.parse(Object.fromEntries(searchParams));

  const result = await notificationService.getUserNotifications(
    session.user.id,
    {
      status: params.status?.split(',') as any,
      type: params.type?.split(',') as any,
      limit: params.limit,
      cursor: params.cursor,
    }
  );

  return NextResponse.json(result);
}
```

### Mark as Read

```typescript
// app/api/notifications/read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notificationService } from '@/lib/notifications/notification-service';
import { z } from 'zod';

const bodySchema = z.object({
  notificationId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { notificationId } = bodySchema.parse(body);

  const result = await notificationService.markAsRead(
    notificationId,
    session.user.id
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
```

### Mark All as Read

```typescript
// app/api/notifications/read-all/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notificationService } from '@/lib/notifications/notification-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await notificationService.markAllAsRead(session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, count: result.value.count });
}
```

### Unread Count

```typescript
// app/api/notifications/unread-count/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notificationService } from '@/lib/notifications/notification-service';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = await notificationService.getUnreadCount(session.user.id);

  return NextResponse.json({ count });
}
```

## 5. Utility Functions

### Idempotency Key Generator

```typescript
// lib/notifications/utils/idempotency.ts

import { createHash } from 'crypto';

interface IdempotencyInput {
  userId: string;
  type: string;
  bookingId?: string;
  timestamp: number;
}

export function generateIdempotencyKey(input: IdempotencyInput): string {
  // Round timestamp to nearest minute to allow some tolerance
  const roundedTimestamp = Math.floor(input.timestamp / 60000) * 60000;

  const data = JSON.stringify({
    userId: input.userId,
    type: input.type,
    bookingId: input.bookingId,
    timestamp: roundedTimestamp,
  });

  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}
```

### Preference Checker

```typescript
// lib/notifications/utils/preference-checker.ts

import { NotificationType, NotificationChannel } from '@/app/generated/prisma';
import { DEFAULT_TYPE_PREFERENCES } from '../notification-types';

export async function checkUserPreferences(
  preferences: any | null,
  type: NotificationType
): Promise<NotificationChannel[]> {
  const channels: NotificationChannel[] = [];

  // Use defaults if no preferences set
  const typePrefs = preferences?.typePreferences?.[type] ??
    DEFAULT_TYPE_PREFERENCES[type];

  if (!typePrefs) {
    // Fallback to all channels
    return ['PUSH', 'EMAIL', 'IN_APP'];
  }

  // Check global toggles first
  if (preferences?.pushEnabled !== false && typePrefs.push) {
    channels.push('PUSH');
  }

  if (preferences?.emailEnabled !== false && typePrefs.email !== 'off') {
    channels.push('EMAIL');
  }

  if (preferences?.inAppEnabled !== false && typePrefs.inApp) {
    channels.push('IN_APP');
  }

  return channels;
}
```

### Quiet Hours Checker

```typescript
// lib/notifications/utils/quiet-hours.ts

export function isInQuietHours(preferences: {
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
}): boolean {
  if (!preferences.quietHoursEnabled) return false;
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) return false;

  const now = new Date();

  // Get current time in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: preferences.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentTime = formatter.format(now);
  const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);

  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}
```

## 6. Dependencies to Install

```bash
npm install @upstash/qstash
```

Note: `@upstash/redis` is already installed.

## Verification Checklist

After implementation:
- [ ] QStash webhook receives messages
- [ ] Notifications are created in database
- [ ] SSE endpoint streams events
- [ ] Mark as read works
- [ ] Unread count updates correctly
- [ ] Retry logic triggers on failure
- [ ] Quiet hours are respected
