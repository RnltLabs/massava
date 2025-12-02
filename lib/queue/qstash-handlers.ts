/**
 * QStash Webhook Handlers
 *
 * Processes messages received from QStash queue.
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { QueueMessage } from './qstash-publisher';

export interface WebhookHandlerResult {
  processed: boolean;
  error?: string;
}

/**
 * Handle a notification queue message
 */
export async function handleNotificationMessage(
  message: QueueMessage
): Promise<WebhookHandlerResult> {
  const { notificationId } = message;

  if (!notificationId) {
    return { processed: false, error: 'Missing notificationId' };
  }

  // Import notification service dynamically to avoid circular deps
  const { notificationService } = await import(
    '@/lib/notifications/notification-service'
  );

  const result = await notificationService.process(notificationId);

  if (!result.ok) {
    logger.error('Notification processing failed:', {
      error: new Error(result.error.message),
    });
    return { processed: false, error: result.error.message };
  }

  return { processed: true };
}

/**
 * Verify that a notification exists and is in a processable state
 */
export async function verifyNotification(
  notificationId: string
): Promise<boolean> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { status: true },
  });

  if (!notification) {
    return false;
  }

  // Only process notifications that are queued or pending retry
  const processableStatuses = ['QUEUED', 'PENDING'];
  return processableStatuses.includes(notification.status);
}
