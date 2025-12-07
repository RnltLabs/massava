/**
 * Firebase Cloud Messaging (FCM) Push Service
 *
 * Handles sending push notifications to users' devices via Firebase Cloud Messaging.
 * Supports multi-platform delivery (iOS via APNS, Android native, and web browsers).
 *
 * @module lib/firebase/fcm-service
 */

import type { messaging } from 'firebase-admin';
import { logger } from '@/lib/logger';
import { getMessaging, isFirebaseAdminAvailable } from './firebase-admin';
import { prisma } from '@/lib/prisma';
import type { NotificationType, NotificationPriority } from '@/app/generated/prisma';

/**
 * Push notification payload to send
 *
 * @interface PushNotificationPayload
 * @property {string} userId - ID of user to notify
 * @property {string} id - Notification ID for tracking
 * @property {string} title - Notification title
 * @property {string} body - Notification body text
 * @property {NotificationType} type - Type of notification
 * @property {NotificationPriority} priority - Priority level (affects delivery)
 * @property {string} [actionUrl] - URL to open on notification tap
 * @property {Record<string, unknown>} [metadata] - Additional data for client
 */
interface PushNotificationPayload {
  userId: string;
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of sending push notifications
 *
 * @interface SendResult
 * @property {number} sent - Number of successful sends
 * @property {number} failed - Number of failed sends
 * @property {string[]} invalidTokens - Tokens that are no longer valid
 */
interface SendResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

/**
 * Validation result for payload inputs
 *
 * @interface ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string} [error] - Error message if validation failed
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Firebase Cloud Messaging service for push notifications
 *
 * Manages sending push notifications to user devices via Firebase Cloud Messaging.
 * Handles multi-platform delivery with platform-specific configurations (Android, iOS, Web).
 * Automatically tracks and removes invalid device tokens.
 *
 * @class PushService
 */
class PushService {
  /**
   * Valid notification types from Prisma schema
   */
  private readonly VALID_NOTIFICATION_TYPES: NotificationType[] = [
    'BOOKING_REQUEST_RECEIVED',
    'BOOKING_CANCELLED_BY_CUSTOMER',
    'BOOKING_REMINDER_STUDIO',
    'PAYMENT_RECEIVED',
    'REVIEW_POSTED',
    'LOW_AVAILABILITY_ALERT',
    'BOOKING_CONFIRMED',
    'BOOKING_REJECTED',
    'BOOKING_REMINDER_CUSTOMER',
    'BOOKING_CANCELLED_BY_STUDIO',
    'REVIEW_REQUEST',
    'STUDIO_PROMOTION',
    'ACCOUNT_LOGIN_NEW_DEVICE',
    'ACCOUNT_PASSWORD_CHANGED',
  ];

  /**
   * Valid notification priorities from Prisma schema
   */
  private readonly VALID_PRIORITIES: NotificationPriority[] = [
    'URGENT',
    'HIGH',
    'NORMAL',
    'LOW',
  ];

  /**
   * Validate push notification payload inputs
   *
   * Performs comprehensive validation of all payload fields to prevent runtime errors
   * and security issues. Validates string lengths, URL formats, and enum values.
   *
   * @param {PushNotificationPayload | Omit<PushNotificationPayload, 'userId'>} payload - Payload to validate
   * @param {boolean} requireUserId - Whether userId field is required (true for sendToUser)
   *
   * @returns {ValidationResult} Validation result with error message if invalid
   *
   * @private
   *
   * @example
   * ```typescript
   * const result = this.validatePayload(payload, true);
   * if (!result.valid) {
   *   logger.error('[FCM] Invalid payload:', result.error);
   *   return { sent: 0, failed: 0, invalidTokens: [] };
   * }
   * ```
   */
  private validatePayload(
    payload: PushNotificationPayload | Omit<PushNotificationPayload, 'userId'>,
    requireUserId = false
  ): ValidationResult {
    // Validate userId if required
    if (requireUserId) {
      const userId = (payload as PushNotificationPayload).userId;
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        return { valid: false, error: 'userId must be a non-empty string' };
      }
    }

    // Validate id
    if (!payload.id || typeof payload.id !== 'string' || payload.id.trim().length === 0) {
      return { valid: false, error: 'id must be a non-empty string' };
    }

    // Validate title
    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      return { valid: false, error: 'title must be a non-empty string' };
    }
    if (payload.title.length > 200) {
      return { valid: false, error: 'title must not exceed 200 characters' };
    }

    // Validate body
    if (!payload.body || typeof payload.body !== 'string' || payload.body.trim().length === 0) {
      return { valid: false, error: 'body must be a non-empty string' };
    }
    if (payload.body.length > 1000) {
      return { valid: false, error: 'body must not exceed 1000 characters' };
    }

    // Validate actionUrl if present
    if (payload.actionUrl !== undefined) {
      if (typeof payload.actionUrl !== 'string') {
        return { valid: false, error: 'actionUrl must be a string' };
      }
      if (!payload.actionUrl.startsWith('/')) {
        return { valid: false, error: 'actionUrl must be a valid relative URL starting with "/"' };
      }
    }

    // Validate type (must be valid NotificationType enum)
    if (!this.VALID_NOTIFICATION_TYPES.includes(payload.type)) {
      return { valid: false, error: `type must be a valid NotificationType enum value` };
    }

    // Validate priority (must be valid NotificationPriority enum)
    if (!this.VALID_PRIORITIES.includes(payload.priority)) {
      return { valid: false, error: `priority must be a valid NotificationPriority enum value` };
    }

    return { valid: true };
  }

  /**
   * Send push notification to all active devices of a user
   *
   * Retrieves user's active device tokens from database and sends push notification
   * to all of them using Firebase Cloud Messaging. Automatically marks invalid tokens
   * as inactive and updates their failure count.
   *
   * @param {PushNotificationPayload} payload - Notification content and metadata
   *
   * @returns {Promise<SendResult>} Result with count of sent/failed and invalid tokens
   *
   * @example
   * ```typescript
   * const result = await pushService.sendToUser({
   *   userId: 'user-123',
   *   id: 'notif-456',
   *   title: 'Booking Confirmed',
   *   body: 'Your booking at Studio ABC has been confirmed',
   *   type: 'BOOKING_CONFIRMED',
   *   priority: 'HIGH',
   *   actionUrl: '/bookings/booking-123',
   *   metadata: { bookingId: 'booking-123', studioName: 'Studio ABC' },
   * });
   *
   * console.log(`Sent to ${result.sent} devices, ${result.failed} failed`);
   * ```
   *
   * @see {@link sendToTokens} - Send to specific tokens
   */
  async sendToUser(payload: PushNotificationPayload): Promise<SendResult> {
    // Validate payload first
    const validation = this.validatePayload(payload, true);
    if (!validation.valid) {
      logger.error(`[FCM] Invalid payload for sendToUser: ${validation.error}`);
      return { sent: 0, failed: 0, invalidTokens: [] };
    }

    if (!isFirebaseAdminAvailable()) {
      logger.warn('[FCM] Firebase Admin not available, skipping push');
      return { sent: 0, failed: 0, invalidTokens: [] };
    }

    // Get user's active device tokens
    const devices = await prisma.deviceToken.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
      },
      select: { id: true, token: true, platform: true },
    });

    if (devices.length === 0) {
      logger.info(`[FCM] No active devices for user ${payload.userId}`);
      return { sent: 0, failed: 0, invalidTokens: [] };
    }

    const messaging = getMessaging();
    if (!messaging) {
      return { sent: 0, failed: devices.length, invalidTokens: [] };
    }

    // Build FCM message
    const message = this.buildMessage(payload);

    // Send to all devices
    const tokens = devices.map((d) => d.token);
    const result = await this.sendMulticast(messaging, message, tokens);

    // Handle invalid tokens
    if (result.invalidTokens.length > 0) {
      await this.handleInvalidTokens(result.invalidTokens);
    }

    // Update device last used
    await prisma.deviceToken.updateMany({
      where: {
        token: { in: tokens.filter((t) => !result.invalidTokens.includes(t)) },
      },
      data: { lastUsedAt: new Date() },
    });

    return result;
  }

  /**
   * Send push notification to specific device tokens
   *
   * Sends a push notification directly to given tokens, bypassing device lookup.
   * Useful for admin notifications or targeting specific devices.
   *
   * @param {string[]} tokens - Array of device tokens to send to
   * @param {Omit<PushNotificationPayload, 'userId'>} payload - Notification content
   *
   * @returns {Promise<SendResult>} Result with sent/failed counts and invalid tokens
   *
   * @example
   * ```typescript
   * const result = await pushService.sendToTokens(
   *   ['token1', 'token2', 'token3'],
   *   {
   *     id: 'notif-123',
   *     title: 'System Maintenance',
   *     body: 'We are performing scheduled maintenance',
   *     type: 'SYSTEM_MAINTENANCE',
   *     priority: 'NORMAL',
   *   }
   * );
   * ```
   *
   * @see {@link sendToUser} - Send to all user devices
   */
  async sendToTokens(
    tokens: string[],
    payload: Omit<PushNotificationPayload, 'userId'>
  ): Promise<SendResult> {
    // Validate payload first
    const validation = this.validatePayload(payload, false);
    if (!validation.valid) {
      logger.error(`[FCM] Invalid payload for sendToTokens: ${validation.error}`);
      return { sent: 0, failed: 0, invalidTokens: [] };
    }

    if (!isFirebaseAdminAvailable()) {
      logger.warn('[FCM] Firebase Admin not available, skipping push');
      return { sent: 0, failed: 0, invalidTokens: [] };
    }

    const messaging = getMessaging();
    if (!messaging) {
      return { sent: 0, failed: tokens.length, invalidTokens: [] };
    }

    const message = this.buildMessage(payload as PushNotificationPayload);
    return this.sendMulticast(messaging, message, tokens);
  }

  /**
   * Build a multi-platform FCM message from notification payload
   *
   * Creates platform-specific configurations for Android, iOS (APNS), and Web.
   * Maps notification priority to platform-specific priorities and notification channels.
   * Includes all required fields for proper delivery and display.
   *
   * NOTE: Web browsers use data-only messages (no notification object) to prevent duplicate
   * notifications. The Service Worker reads title/body from the data payload and displays
   * the notification manually. This is a Firebase best practice for web push.
   *
   * @param {PushNotificationPayload} payload - Notification content
   *
   * @returns {Omit<messaging.MulticastMessage, 'tokens'>} FCM message configuration
   *
   * @private
   */
  private buildMessage(
    payload: PushNotificationPayload
  ): Omit<messaging.MulticastMessage, 'tokens'> {
    // Map priority to FCM priority
    const fcmPriority = ['URGENT', 'HIGH'].includes(payload.priority)
      ? 'high'
      : 'normal';

    // Get Android channel based on priority
    const androidChannel = this.getAndroidChannel(payload.priority);

    return {
      // No top-level notification object (web browsers would show duplicate notifications)
      data: {
        notificationId: payload.id,
        type: payload.type,
        priority: payload.priority,
        title: payload.title, // For Service Worker to read
        body: payload.body,   // For Service Worker to read
        ...(payload.actionUrl && { actionUrl: payload.actionUrl }),
        ...(payload.metadata && { metadata: JSON.stringify(payload.metadata) }),
      },
      android: {
        priority: fcmPriority,
        notification: {
          channelId: androidChannel,
          priority: fcmPriority === 'high' ? 'high' : 'default',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          title: payload.title,
          body: payload.body,
        },
      },
      apns: {
        headers: {
          'apns-priority': fcmPriority === 'high' ? '10' : '5',
        },
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: 1, // Will be updated by client
            'mutable-content': 1,
          },
        },
      },
      webpush: {
        // No notification object for web (prevents duplicate notifications)
        fcmOptions: {
          link: payload.actionUrl || '/',
        },
      },
    };
  }

  /**
   * Get Android notification channel ID based on priority
   *
   * Android uses notification channels for grouping and user control of notifications.
   * Different channels for different priority levels allow users to manage notifications per type.
   *
   * @param {NotificationPriority} priority - Notification priority level
   *
   * @returns {string} Android notification channel ID
   *
   * @private
   */
  private getAndroidChannel(priority: NotificationPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'urgent_notifications';
      case 'HIGH':
        return 'high_priority_notifications';
      default:
        return 'default_notifications';
    }
  }

  /**
   * Send multicast message to multiple device tokens with error handling
   *
   * Sends a single message to multiple tokens in one batch operation. Collects results
   * and identifies invalid tokens for cleanup. Handles FCM errors gracefully with logging.
   *
   * @param {messaging.Messaging} messaging - Firebase messaging instance
   * @param {Omit<messaging.MulticastMessage, 'tokens'>} message - FCM message configuration
   * @param {string[]} tokens - Array of device tokens to send to
   *
   * @returns {Promise<SendResult>} Send result with counts and invalid tokens
   *
   * @private
   */
  private async sendMulticast(
    messaging: messaging.Messaging,
    message: Omit<messaging.MulticastMessage, 'tokens'>,
    tokens: string[]
  ): Promise<SendResult> {
    const result: SendResult = { sent: 0, failed: 0, invalidTokens: [] };

    if (tokens.length === 0) {
      return result;
    }

    try {
      const response = await messaging.sendEachForMulticast({
        ...message,
        tokens,
      });

      result.sent = response.successCount;
      result.failed = response.failureCount;

      // Collect invalid tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          // These error codes indicate the token is invalid
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            result.invalidTokens.push(tokens[idx]);
          }
        }
      });

      logger.info(`[FCM] Sent ${result.sent}/${tokens.length}, failed ${result.failed}, invalid ${result.invalidTokens.length}`);
    } catch (error) {
      logger.error('[FCM] Send error:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      result.failed = tokens.length;
    }

    return result;
  }

  /**
   * Mark invalid device tokens as inactive in the database
   *
   * Tokens that consistently fail to deliver are marked as inactive to prevent
   * future delivery attempts. Updates failure count and records reason for debugging.
   *
   * @param {string[]} tokens - Array of invalid tokens to deactivate
   *
   * @returns {Promise<void>}
   *
   * @private
   */
  private async handleInvalidTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;

    await prisma.deviceToken.updateMany({
      where: { token: { in: tokens } },
      data: {
        isActive: false,
        failureCount: { increment: 1 },
        lastFailureAt: new Date(),
        lastFailureReason: 'Token no longer valid',
      },
    });

    logger.info(`[FCM] Deactivated ${tokens.length} invalid tokens`);
  }
}

export const pushService = new PushService();
