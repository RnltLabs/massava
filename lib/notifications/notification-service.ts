/**
 * Notification Service
 *
 * Core service for creating, processing, and managing notifications.
 * Uses Result pattern for error handling.
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/app/generated/prisma';
import type {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  Notification,
} from '@/app/generated/prisma';
import { qstashPublisher } from '@/lib/queue/qstash-publisher';
import { Result, ok, err } from '@/lib/result';
import { generateIdempotencyKey } from './utils/idempotency';
import { checkUserPreferences } from './utils/preference-checker';
import { isInQuietHours, getQuietHoursEndTime } from './utils/quiet-hours';
import { isRateLimited } from './utils/rate-limiter';
import { getNotificationTemplate } from './notification-templates';
import { DEFAULT_PRIORITIES } from './notification-types';
import type { StatusHistoryEntry } from './notification-types';

// ============================================
// Types
// ============================================

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title?: string;
  body?: string;
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

// ============================================
// Service Implementation
// ============================================

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

      // 2. Check rate limiting
      const rateLimited = await isRateLimited(
        input.userId,
        input.type,
        input.priority || 'NORMAL'
      );

      if (rateLimited) {
        return err({ code: 'RATE_LIMITED', message: 'Too many notifications' });
      }

      // 3. Generate idempotency key
      const idempotencyKey = generateIdempotencyKey({
        userId: input.userId,
        type: input.type,
        bookingId: input.bookingId,
        timestamp: Date.now(),
      });

      // 4. Check for duplicate
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        return ok({ id: existing.id, status: existing.status });
      }

      // 5. Get template for title/body if not provided
      const template = getNotificationTemplate(input.type, input.metadata || {});
      const title = input.title || template.title;
      const body = input.body || template.body;
      const actionUrl = input.actionUrl || template.actionUrl;

      // 6. Determine channels based on user preferences
      const channels = input.channels ??
        checkUserPreferences(user.notificationPreference, input.type);

      // 7. Get default priority if not specified
      const priority = input.priority ?? DEFAULT_PRIORITIES[input.type] ?? 'NORMAL';

      // 8. Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title,
          body,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
          priority,
          channels,
          actionUrl,
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
          }] as Prisma.InputJsonValue,
        },
      });

      // 9. Queue for processing (unless scheduled for later)
      if (!input.scheduledFor) {
        try {
          await qstashPublisher.publish({
            notificationId: notification.id,
            priority: notification.priority,
          });

          await this.updateStatus(notification.id, 'QUEUED', 'Added to queue');
        } catch (queueError) {
          logger.error('Failed to queue notification:', {
            error: queueError instanceof Error ? queueError : new Error(String(queueError)),
          });
          // Don't fail the creation, just log the error
          // The cron job will pick up pending notifications
        }
      }

      return ok({ id: notification.id, status: notification.status });
    } catch (error) {
      logger.error('NotificationService.create error:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
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
  async process(
    notificationId: string
  ): Promise<Result<void, NotificationServiceError>> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          include: {
            notificationPreference: true,
            deviceTokens: { where: { isActive: true } },
          },
        },
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
        const nextDelivery = getQuietHoursEndTime(prefs);
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            scheduledFor: nextDelivery,
            status: 'PENDING',
          },
        });
        await this.updateStatus(notificationId, 'PENDING', 'Delayed for quiet hours');

        // Schedule for later
        await qstashPublisher.publishScheduled(
          { notificationId, priority: notification.priority },
          nextDelivery
        );

        return ok(undefined);
      }
    }

    await this.updateStatus(notificationId, 'SENDING', 'Processing channels');

    // Process each channel
    const results = await Promise.allSettled(
      notification.channels.map((channel) =>
        this.deliverToChannel(notification, channel)
      )
    );

    // Determine final status
    const successes = results.filter((r) => r.status === 'fulfilled').length;

    if (successes === notification.channels.length) {
      await this.updateStatus(notificationId, 'DELIVERED', 'All channels succeeded');
    } else if (successes > 0) {
      await this.updateStatus(
        notificationId,
        'PARTIALLY_DELIVERED',
        `${successes}/${notification.channels.length} channels succeeded`
      );
    } else if (notification.retryCount < notification.maxRetries) {
      await this.scheduleRetry(notificationId);
    } else {
      await this.updateStatus(notificationId, 'FAILED', 'Max retries exceeded');
    }

    return ok(undefined);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Result<void, NotificationServiceError>> {
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
  async markAllAsRead(
    userId: string
  ): Promise<Result<{ count: number }, NotificationServiceError>> {
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

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<Result<void, NotificationServiceError>> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return err({ code: 'INVALID_INPUT', message: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return ok(undefined);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async deliverToChannel(
    notification: Notification & { user: { deviceTokens: { token: string }[] } },
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

  private async deliverPush(notification: Notification & { user: { deviceTokens: { token: string }[] } }): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const { pushService } = await import('@/lib/firebase/fcm-service');
      await pushService.sendToUser({
        userId: notification.userId,
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl || undefined,
        metadata: notification.metadata as Record<string, unknown> | undefined,
      });

      await prisma.notification.update({
        where: { id: notification.id },
        data: { pushDeliveredAt: new Date() },
      });
    } catch (error) {
      logger.error('Push delivery failed:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          pushFailedAt: new Date(),
          pushError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  private async deliverEmail(notification: Notification): Promise<void> {
    try {
      // Use existing Resend integration
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      await sendNotificationEmail(notification);

      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailSentAt: new Date() },
      });
    } catch (error) {
      logger.error('Email delivery failed:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailFailedAt: new Date(),
          emailError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  private async deliverInApp(notification: Notification): Promise<void> {
    try {
      // Publish to SSE via Redis
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');
      await ssePublisher.publishToUser(notification.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (error) {
      logger.error('In-app delivery failed:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
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

    const history = (notification?.statusHistory as unknown as StatusHistoryEntry[]) ?? [];
    history.push({
      status,
      timestamp: new Date().toISOString(),
      reason,
    });

    await prisma.notification.update({
      where: { id },
      data: { status, statusHistory: history as unknown as Prisma.InputJsonValue },
    });
  }

  private async scheduleRetry(id: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) return;

    // Exponential backoff: 2^retryCount seconds (1s, 2s, 4s, 8s, ...)
    const backoffMs = Math.pow(2, notification.retryCount) * 1000;
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

    await this.updateStatus(id, 'PENDING', `Scheduled retry #${notification.retryCount + 1}`);

    // Schedule via QStash
    await qstashPublisher.publishDelayed(
      { notificationId: id, priority: notification.priority },
      backoffMs
    );
  }
}

export const notificationService = new NotificationService();
