/**
 * Firebase Cloud Messaging Service
 *
 * Handles sending push notifications via FCM.
 */

import type { messaging } from 'firebase-admin';
import { logger } from '@/lib/logger';
import { getMessaging, isFirebaseAdminAvailable } from './firebase-admin';
import { prisma } from '@/lib/prisma';
import type { NotificationType, NotificationPriority } from '@/app/generated/prisma';

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

interface SendResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

class PushService {
  /**
   * Send push notification to a user's devices
   */
  async sendToUser(payload: PushNotificationPayload): Promise<SendResult> {
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
   * Send push notification to specific tokens
   */
  async sendToTokens(
    tokens: string[],
    payload: Omit<PushNotificationPayload, 'userId'>
  ): Promise<SendResult> {
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
   * Build FCM message from payload
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
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        notificationId: payload.id,
        type: payload.type,
        priority: payload.priority,
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
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png',
        },
        fcmOptions: {
          link: payload.actionUrl || '/',
        },
      },
    };
  }

  /**
   * Get Android notification channel based on priority
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
   * Send multicast message to multiple tokens
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
   * Handle invalid tokens by marking them inactive
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
