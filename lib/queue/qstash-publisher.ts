/**
 * QStash Publisher
 *
 * Publishes notification messages to the QStash queue for async processing.
 * Falls back to synchronous processing if QStash is not configured.
 */

import { getQStashClient, getWebhookUrl } from './qstash-client';
import { logger } from '@/lib/logger';

export interface QueueMessage {
  notificationId: string;
  priority: string;
}

/**
 * Check if QStash is configured and can be used
 * Returns false for localhost URLs since QStash cannot reach them
 */
function isQStashConfigured(): boolean {
  if (!process.env.QSTASH_TOKEN) {
    return false;
  }

  // QStash cannot reach localhost/loopback addresses
  // Fall back to sync processing in local development
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    '';

  if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    return false;
  }

  return true;
}

/**
 * Process notification synchronously (fallback when QStash is not configured)
 */
async function processSync(message: QueueMessage): Promise<{ messageId: string }> {
  // Import dynamically to avoid circular dependencies
  const { handleNotificationMessage } = await import('./qstash-handlers');

  logger.info('QStash not configured, processing notification synchronously', {
    notificationId: message.notificationId,
  });

  const result = await handleNotificationMessage(message);

  if (!result.processed) {
    throw new Error(result.error || 'Sync processing failed');
  }

  return { messageId: `sync-${message.notificationId}` };
}

class QStashPublisher {
  /**
   * Publish a notification for immediate processing
   * Falls back to sync processing if QStash is not configured
   */
  async publish(message: QueueMessage): Promise<{ messageId: string }> {
    if (!isQStashConfigured()) {
      return processSync(message);
    }

    const client = getQStashClient();
    const webhookUrl = getWebhookUrl();

    const response = await client.publishJSON({
      url: webhookUrl,
      body: message,
      retries: 3,
    });

    return { messageId: response.messageId };
  }

  /**
   * Publish a notification with delay (for retries)
   * Falls back to immediate sync processing if QStash is not configured
   */
  async publishDelayed(
    message: QueueMessage,
    delayMs: number
  ): Promise<{ messageId: string }> {
    if (!isQStashConfigured()) {
      // Without QStash, process immediately (no delay support in sync mode)
      logger.warn('QStash not configured, ignoring delay and processing immediately', {
        notificationId: message.notificationId,
        requestedDelayMs: delayMs,
      });
      return processSync(message);
    }

    const client = getQStashClient();
    const webhookUrl = getWebhookUrl();

    // QStash uses seconds for delay
    const delaySeconds = Math.max(1, Math.ceil(delayMs / 1000));

    const response = await client.publishJSON({
      url: webhookUrl,
      body: message,
      delay: delaySeconds,
      retries: 3,
    });

    return { messageId: response.messageId };
  }

  /**
   * Schedule a notification for a specific time
   */
  async publishScheduled(
    message: QueueMessage,
    scheduleAt: Date
  ): Promise<{ messageId: string }> {
    const delayMs = Math.max(0, scheduleAt.getTime() - Date.now());
    return this.publishDelayed(message, delayMs);
  }

  /**
   * Publish a batch of notifications
   * Falls back to sequential sync processing if QStash is not configured
   */
  async publishBatch(
    messages: QueueMessage[]
  ): Promise<{ messageIds: string[] }> {
    if (!isQStashConfigured()) {
      logger.info('QStash not configured, processing batch synchronously', {
        count: messages.length,
      });
      const messageIds: string[] = [];
      for (const message of messages) {
        const result = await processSync(message);
        messageIds.push(result.messageId);
      }
      return { messageIds };
    }

    const client = getQStashClient();
    const webhookUrl = getWebhookUrl();

    const batchMessages = messages.map((message) => ({
      destination: webhookUrl,
      body: JSON.stringify(message),
    }));

    const responses = await client.batchJSON(batchMessages);

    return {
      messageIds: responses.map((r) => r.messageId),
    };
  }
}

export const qstashPublisher = new QStashPublisher();
