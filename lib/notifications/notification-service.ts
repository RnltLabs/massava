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
import { isRateLimited } from './utils/rate-limiter';
import { getNotificationTemplate } from './notification-templates';
import { DEFAULT_PRIORITIES } from './notification-types';
import {
  parseStatusHistory,
  toStatusHistoryJson,
  toMetadataJson,
  parseMetadata,
} from './utils/json-helpers';
import type { StatusHistoryEntry } from '@/lib/schemas/notification.schema';
import {
  type NotificationError,
  createNotificationError,
  exceptionToNotificationError,
} from './errors';
import { sanitizeNotificationContent } from './utils/sanitizer';
import {
  recordNotificationCreated,
  recordNotificationDelivered,
  recordNotificationFailed,
  recordDeliveryDuration,
  withTiming,
} from './metrics';
import {
  createNotificationSpan,
  createDeliverySpan,
  createRetrySpan,
  createChildSpan,
  endSpan,
  addSpanAttributes,
  logSpanStart,
  logSpanEnd,
  getTraceId,
  createTraceContext,
  parseTraceparent,
  type Span,
  type TraceContext,
} from './tracing';

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
  /** Optional W3C traceparent header for distributed tracing */
  traceparent?: string;
}

// ============================================
// Service Implementation
// ============================================

class NotificationService {
  /**
   * Create and queue a notification for delivery
   *
   * Handles the complete notification creation flow including validation, duplicate detection,
   * preference checking, and queueing for asynchronous delivery. Uses idempotency keys to prevent
   * duplicate notifications when retrying, and checks user preferences to determine delivery channels.
   *
   * @description
   * The creation process performs multiple steps:
   * 1. Validates that the user exists
   * 2. Checks rate limiting to prevent notification spam
   * 3. Generates idempotency key for deduplication
   * 4. Checks for duplicate notification (within 1-minute window)
   * 5. Retrieves notification template if title/body not provided
   * 6. Determines channels based on user preferences
   * 7. Sets default priority if not specified
   * 8. Creates notification record in database
   * 9. Queues for processing (unless scheduled for later)
   *
   * @param {CreateNotificationInput} input - Notification creation parameters
   * @param {string} input.userId - ID of the user to notify
   * @param {NotificationType} input.type - Type of notification (e.g., 'BOOKING_CONFIRMED')
   * @param {string} [input.title] - Notification title (uses template if not provided)
   * @param {string} [input.body] - Notification body (uses template if not provided)
   * @param {Record<string, unknown>} [input.metadata] - Additional data for template rendering
   * @param {NotificationPriority} [input.priority] - Priority level (URGENT, HIGH, NORMAL, LOW)
   * @param {NotificationChannel[]} [input.channels] - Delivery channels (uses preferences if not specified)
   * @param {string} [input.actionUrl] - URL to open when notification is tapped
   * @param {Date} [input.scheduledFor] - Schedule notification for later delivery
   * @param {Date} [input.expiresAt] - Notification expiration time
   * @param {string} [input.bookingId] - Related booking ID for context
   * @param {string} [input.studioId] - Related studio ID for context
   *
   * @returns {Promise<Result<{id: string; status: NotificationStatus}, NotificationServiceError>>}
   * Success: Returns notification ID and current status (PENDING for scheduled, QUEUED for immediate)
   * Error: USER_NOT_FOUND, RATE_LIMITED, INVALID_INPUT, QUEUE_ERROR, or DATABASE_ERROR
   *
   * @example
   * ```typescript
   * const result = await notificationService.create({
   *   userId: 'user-123',
   *   type: 'BOOKING_CONFIRMED',
   *   metadata: {
   *     bookingId: 'booking-456',
   *     studioName: 'Studio ABC',
   *     appointmentTime: '2025-01-15T14:00:00Z',
   *   },
   * });
   *
   * if (result.ok) {
   *   console.log(`Notification queued: ${result.value.id}`);
   * } else {
   *   console.error(`Failed: ${result.error.code}`);
   * }
   * ```
   *
   * @see {@link markAsRead} - Mark notification as read
   * @see {@link process} - Process a queued notification
   * @see {@link checkUserPreferences} - Determine channels from preferences
   */
  async create(
    input: CreateNotificationInput
  ): Promise<Result<{ id: string; status: NotificationStatus }, NotificationError>> {
    // Create root span for notification creation
    let span: Span;
    if (input.traceparent) {
      // Continue existing trace if traceparent is provided
      const parsedContext = parseTraceparent(input.traceparent);
      if (parsedContext) {
        const traceContext = createTraceContext(
          parsedContext.traceId,
          parsedContext.parentSpanId,
          parsedContext.traceFlags
        );
        span = createChildSpan(
          traceContext,
          'notification.create',
          'Create Notification',
          {
            'user.id': input.userId,
            'notification.type': input.type,
            'notification.priority': input.priority || 'NORMAL',
          }
        );
      } else {
        // Invalid traceparent, create new root span
        span = createNotificationSpan(
          input.userId,
          input.type,
          input.priority || 'NORMAL'
        );
      }
    } else {
      // Create new root span
      span = createNotificationSpan(
        input.userId,
        input.type,
        input.priority || 'NORMAL'
      );
    }

    logSpanStart(span);

    try {
      // 1. Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { notificationPreference: true },
      });

      if (!user) {
        const finishedSpan = endSpan(span, 'error', {
          message: 'User not found',
          type: 'USER_NOT_FOUND',
        });
        logSpanEnd(finishedSpan);

        return err(
          createNotificationError('USER_NOT_FOUND', 'User not found', {
            userId: input.userId,
          })
        );
      }

      // 2. Check rate limiting
      const rateLimited = await isRateLimited(
        input.userId,
        input.type,
        input.priority || 'NORMAL'
      );

      if (rateLimited) {
        const finishedSpan = endSpan(span, 'error', {
          message: 'Too many notifications',
          type: 'RATE_LIMITED',
        });
        logSpanEnd(finishedSpan);

        return err(
          createNotificationError('RATE_LIMITED', 'Too many notifications', {
            userId: input.userId,
            retryAfter: 60,
            limit: 100,
            notificationType: input.type,
          })
        );
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
        // Duplicate notification detected
        const finishedSpan = endSpan(
          addSpanAttributes(span, {
            'notification.id': existing.id,
            'notification.duplicate': true,
          }),
          'ok'
        );
        logSpanEnd(finishedSpan);

        return ok({ id: existing.id, status: existing.status });
      }

      // 5. Get template for title/body if not provided
      const template = getNotificationTemplate(input.type, input.metadata || {});
      const rawTitle = input.title || template.title;
      const rawBody = input.body || template.body;
      const rawActionUrl = input.actionUrl || template.actionUrl;
      const rawMetadata = input.metadata;

      // 5a. Sanitize all content to prevent XSS attacks
      const sanitized = sanitizeNotificationContent({
        title: rawTitle,
        body: rawBody,
        actionUrl: rawActionUrl,
        metadata: rawMetadata,
      });

      // Log warning if sanitization modified input (potential XSS attempt)
      if (sanitized.wasModified) {
        logger.warn('Notification content was sanitized (potential XSS attempt)', {
          userId: input.userId,
          type: input.type,
          bookingId: input.bookingId,
          sanitizationPerformed: true,
          traceId: getTraceId(span),
          spanId: span.context.spanId,
        });
      }

      const title = sanitized.title || '';
      const body = sanitized.body || '';
      const actionUrl = sanitized.actionUrl;
      // Add trace ID to metadata for distributed tracing
      const metadata = {
        ...sanitized.metadata,
        _traceId: getTraceId(span),
        _spanId: span.context.spanId,
      };

      // 6. Determine channels based on user preferences
      const channels = input.channels ??
        checkUserPreferences(user.notificationPreference, input.type);

      // 7. Get default priority if not specified
      const priority = input.priority ?? DEFAULT_PRIORITIES[input.type] ?? 'NORMAL';

      // 8. Create notification record
      const initialStatusHistory: StatusHistoryEntry[] = [{
        status: 'PENDING',
        timestamp: new Date().toISOString(),
        reason: 'Created',
      }];

      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title,
          body,
          metadata: toMetadataJson(metadata),
          priority,
          channels,
          actionUrl,
          scheduledFor: input.scheduledFor,
          expiresAt: input.expiresAt,
          bookingId: input.bookingId,
          studioId: input.studioId,
          idempotencyKey,
          status: input.scheduledFor ? 'PENDING' : 'QUEUED',
          statusHistory: toStatusHistoryJson(initialStatusHistory),
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
            traceId: getTraceId(span),
            spanId: span.context.spanId,
            notificationId: notification.id,
          });
          // Don't fail the creation, just log the error
          // The cron job will pick up pending notifications
        }
      }

      // Record metrics for notification creation
      recordNotificationCreated(notification.type, notification.priority);

      // Add notification ID to span and end successfully
      const finishedSpan = endSpan(
        addSpanAttributes(span, { 'notification.id': notification.id }),
        'ok'
      );
      logSpanEnd(finishedSpan);

      return ok({ id: notification.id, status: notification.status });
    } catch (error) {
      const finishedSpan = endSpan(span, 'error', {
        message: error instanceof Error ? error.message : String(error),
        type: 'INTERNAL_ERROR',
      });
      logSpanEnd(finishedSpan);

      return err(
        exceptionToNotificationError(error, {
          userId: input.userId,
          operation: 'create',
        })
      );
    }
  }

  /**
   * Process a queued notification and deliver to configured channels
   *
   * Called by QStash webhook to handle actual delivery to users. This method manages the complete
   * delivery flow: checking expiration, sending to all channels, handling failures, and scheduling
   * retries with exponential backoff.
   *
   * @description
   * The processing flow:
   * 1. Retrieves notification and user with device tokens and preferences
   * 2. Checks if notification is expired
   * 3. Sends to all configured channels (PUSH, EMAIL, IN_APP) in parallel
   * 4. Determines final status: DELIVERED, PARTIALLY_DELIVERED, or reschedules for retry
   * 6. Uses exponential backoff (2^retryCount seconds) for retries
   *
   * @param {string} notificationId - ID of notification to process
   *
   * @returns {Promise<Result<void, NotificationServiceError>>}
   * Success: Notification processed (delivered, partially delivered, or scheduled for retry)
   * Error: INVALID_INPUT if notification not found
   *
   * @example
   * ```typescript
   * // Called automatically by QStash webhook
   * const result = await notificationService.process('notif-123');
   *
   * if (result.ok) {
   *   console.log('Notification processed successfully');
   * } else {
   *   console.error('Failed to process notification');
   * }
   * ```
   *
   * @see {@link create} - Create and queue notification
   * @see {@link deliverToChannel} - Deliver to single channel
   * @see {@link updateStatus} - Update notification status with history
   * @see {@link scheduleRetry} - Schedule retry with backoff
   */
  async process(
    notificationId: string
  ): Promise<Result<void, NotificationError>> {
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
      return err(
        createNotificationError('NOTIFICATION_NOT_FOUND', 'Notification not found', {
          notificationId,
        })
      );
    }

    // Extract trace context from notification metadata
    const metadata = parseMetadata(notification.metadata);
    const traceId = metadata._traceId as string | undefined;
    const parentSpanId = metadata._spanId as string | undefined;

    // Create processing span (continue trace if available)
    let span: Span;
    if (traceId && parentSpanId) {
      const traceContext = createTraceContext(traceId, parentSpanId);
      span = createChildSpan(
        traceContext,
        'notification.process',
        'Process Notification',
        {
          'notification.id': notification.id,
          'user.id': notification.userId,
          'notification.type': notification.type,
          'notification.priority': notification.priority,
        }
      );
    } else {
      // No trace context available, create new root span
      span = createNotificationSpan(
        notification.userId,
        notification.type,
        notification.priority
      );
      span = addSpanAttributes(span, { 'notification.id': notification.id });
    }

    logSpanStart(span);

    // Check if expired
    if (notification.expiresAt && notification.expiresAt < new Date()) {
      await this.updateStatus(notificationId, 'EXPIRED', 'Past expiration time');

      const finishedSpan = endSpan(
        addSpanAttributes(span, { status: 'EXPIRED' }),
        'ok'
      );
      logSpanEnd(finishedSpan);

      return ok(undefined);
    }

    await this.updateStatus(notificationId, 'SENDING', 'Processing channels');

    // Process each channel with tracing
    const results = await Promise.allSettled(
      notification.channels.map((channel) =>
        this.deliverToChannel(notification, channel, span)
      )
    );

    // Determine final status
    const successes = results.filter((r) => r.status === 'fulfilled').length;

    if (successes === notification.channels.length) {
      await this.updateStatus(notificationId, 'DELIVERED', 'All channels succeeded');

      const finishedSpan = endSpan(
        addSpanAttributes(span, { status: 'DELIVERED', channels_succeeded: successes }),
        'ok'
      );
      logSpanEnd(finishedSpan);
    } else if (successes > 0) {
      await this.updateStatus(
        notificationId,
        'PARTIALLY_DELIVERED',
        `${successes}/${notification.channels.length} channels succeeded`
      );

      const finishedSpan = endSpan(
        addSpanAttributes(span, {
          status: 'PARTIALLY_DELIVERED',
          channels_succeeded: successes,
          channels_total: notification.channels.length,
        }),
        'ok'
      );
      logSpanEnd(finishedSpan);
    } else if (notification.retryCount < notification.maxRetries) {
      await this.scheduleRetry(notificationId, span);

      const finishedSpan = endSpan(
        addSpanAttributes(span, {
          status: 'RETRY_SCHEDULED',
          retry_count: notification.retryCount + 1,
        }),
        'ok'
      );
      logSpanEnd(finishedSpan);
    } else {
      await this.updateStatus(notificationId, 'FAILED', 'Max retries exceeded');

      const finishedSpan = endSpan(
        addSpanAttributes(span, { status: 'FAILED', max_retries_exceeded: true }),
        'error',
        {
          message: 'Max retries exceeded',
          type: 'MAX_RETRIES',
        }
      );
      logSpanEnd(finishedSpan);
    }

    return ok(undefined);
  }

  /**
   * Mark a single notification as read by the user
   *
   * Updates notification status to READ and records the time when the user viewed it in the app.
   * This is typically called when a user opens a notification in the notification center.
   *
   * @param {string} notificationId - ID of notification to mark as read
   * @param {string} userId - ID of user (for authorization check)
   *
   * @returns {Promise<Result<void, NotificationServiceError>>}
   * Success: Notification marked as read with timestamp
   * Error: INVALID_INPUT if notification not found or doesn't belong to user
   *
   * @example
   * ```typescript
   * const result = await notificationService.markAsRead('notif-123', 'user-123');
   * if (result.ok) {
   *   console.log('Notification marked as read');
   * }
   * ```
   *
   * @see {@link markAllAsRead} - Mark all notifications as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Result<void, NotificationError>> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return err(
        createNotificationError('NOTIFICATION_NOT_FOUND', 'Notification not found', {
          notificationId,
          userId,
        })
      );
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
   * Mark all unread notifications as read for a user
   *
   * Batch marks all undelivered notifications as read. Typically called when user opens
   * the notification center and views all notifications at once.
   *
   * @param {string} userId - ID of user whose notifications to mark as read
   *
   * @returns {Promise<Result<{count: number}, NotificationServiceError>>}
   * Success: Returns the number of notifications marked as read
   * Error: Only returns success (count may be 0 if none were unread)
   *
   * @example
   * ```typescript
   * const result = await notificationService.markAllAsRead('user-123');
   * if (result.ok) {
   *   console.log(`Marked ${result.value.count} notifications as read`);
   * }
   * ```
   *
   * @see {@link markAsRead} - Mark single notification as read
   * @see {@link getUserNotifications} - Fetch user notifications
   */
  async markAllAsRead(
    userId: string
  ): Promise<Result<{ count: number }, NotificationError>> {
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
   * Fetch paginated notifications for a user with optional filtering
   *
   * Retrieves user's notifications in reverse chronological order with cursor-based pagination
   * for efficient loading. Supports filtering by status and type for advanced use cases.
   *
   * @param {string} userId - ID of user to fetch notifications for
   * @param {object} [options] - Query options
   * @param {NotificationStatus[]} [options.status] - Filter by status (e.g., DELIVERED, READ)
   * @param {NotificationType[]} [options.type] - Filter by type (e.g., BOOKING_CONFIRMED)
   * @param {number} [options.limit=20] - Maximum number of notifications to return
   * @param {string} [options.cursor] - Cursor ID for pagination (ID of last item from previous page)
   *
   * @returns {Promise<{items: Notification[], hasMore: boolean, nextCursor?: string}>}
   * Returns paginated results with cursor for next page if more items exist
   *
   * @example
   * ```typescript
   * // First page
   * const page1 = await notificationService.getUserNotifications('user-123', {
   *   limit: 20,
   *   status: ['DELIVERED', 'READ'],
   * });
   *
   * // Next page using cursor
   * const page2 = await notificationService.getUserNotifications('user-123', {
   *   limit: 20,
   *   cursor: page1.nextCursor,
   * });
   * ```
   *
   * @see {@link getUnreadCount} - Get count of unread notifications
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
   * Get the count of unread notifications for a user
   *
   * Returns count of notifications that have been delivered to the user but not yet viewed.
   * Used to update UI badges and notification center indicators.
   *
   * @param {string} userId - ID of user to get unread count for
   *
   * @returns {Promise<number>} Count of unread notifications (0 if none)
   *
   * @example
   * ```typescript
   * const count = await notificationService.getUnreadCount('user-123');
   * console.log(`${count} unread notifications`);
   * ```
   *
   * @see {@link markAsRead} - Mark notification as read
   * @see {@link markAllAsRead} - Mark all notifications as read
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
   * Delete a notification permanently
   *
   * Removes notification from the system entirely. Used when users dismiss/delete notifications
   * from their notification center.
   *
   * @param {string} notificationId - ID of notification to delete
   * @param {string} userId - ID of user (for authorization check)
   *
   * @returns {Promise<Result<void, NotificationServiceError>>}
   * Success: Notification deleted
   * Error: INVALID_INPUT if notification not found or doesn't belong to user
   *
   * @example
   * ```typescript
   * const result = await notificationService.deleteNotification('notif-123', 'user-123');
   * if (result.ok) {
   *   console.log('Notification deleted');
   * }
   * ```
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<Result<void, NotificationError>> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return err(
        createNotificationError('NOTIFICATION_NOT_FOUND', 'Notification not found', {
          notificationId,
          userId,
        })
      );
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
    channel: NotificationChannel,
    parentSpan: Span
  ): Promise<void> {
    // Create delivery span for this channel
    const span = createDeliverySpan(parentSpan, notification.id, channel);
    logSpanStart(span);

    try {
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

      const finishedSpan = endSpan(span, 'ok');
      logSpanEnd(finishedSpan);
    } catch (error) {
      const finishedSpan = endSpan(span, 'error', {
        message: error instanceof Error ? error.message : String(error),
        type: 'DELIVERY_ERROR',
      });
      logSpanEnd(finishedSpan);
      throw error;
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
        metadata: parseMetadata(notification.metadata),
      });

      await prisma.notification.update({
        where: { id: notification.id },
        data: { pushDeliveredAt: new Date() },
      });
    } catch (error) {
      const notificationError = createNotificationError(
        'DELIVERY_ERROR',
        'Push notification delivery failed',
        {
          channel: 'PUSH',
          notificationId: notification.id,
          originalError: error,
          retryable: true,
        }
      );

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          pushFailedAt: new Date(),
          pushError: notificationError.message,
        },
      });
      throw notificationError;
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
      const notificationError = createNotificationError(
        'DELIVERY_ERROR',
        'Email notification delivery failed',
        {
          channel: 'EMAIL',
          notificationId: notification.id,
          originalError: error,
          retryable: true,
        }
      );

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailFailedAt: new Date(),
          emailError: notificationError.message,
        },
      });
      throw notificationError;
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
      const notificationError = createNotificationError(
        'DELIVERY_ERROR',
        'In-app notification delivery failed',
        {
          channel: 'IN_APP',
          notificationId: notification.id,
          originalError: error,
          retryable: true,
        }
      );
      throw notificationError;
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

    const history = parseStatusHistory(notification?.statusHistory ?? null);
    history.push({
      status,
      timestamp: new Date().toISOString(),
      reason,
    });

    await prisma.notification.update({
      where: { id },
      data: { status, statusHistory: toStatusHistoryJson(history) },
    });
  }

  private async scheduleRetry(id: string, parentSpan: Span): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) return;

    // Create retry span
    const span = createRetrySpan(parentSpan, id, notification.retryCount + 1);
    logSpanStart(span);

    try {
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

      const finishedSpan = endSpan(
        addSpanAttributes(span, { backoff_ms: backoffMs }),
        'ok'
      );
      logSpanEnd(finishedSpan);
    } catch (error) {
      const finishedSpan = endSpan(span, 'error', {
        message: error instanceof Error ? error.message : String(error),
        type: 'RETRY_SCHEDULE_ERROR',
      });
      logSpanEnd(finishedSpan);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
