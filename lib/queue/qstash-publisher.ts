/**
 * QStash Publisher
 *
 * Publishes notification messages to the QStash queue for async processing.
 */

import { getQStashClient, getWebhookUrl } from './qstash-client';

export interface QueueMessage {
  notificationId: string;
  priority: string;
}

class QStashPublisher {
  /**
   * Publish a notification for immediate processing
   */
  async publish(message: QueueMessage): Promise<{ messageId: string }> {
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
   */
  async publishDelayed(
    message: QueueMessage,
    delayMs: number
  ): Promise<{ messageId: string }> {
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
   */
  async publishBatch(
    messages: QueueMessage[]
  ): Promise<{ messageIds: string[] }> {
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
