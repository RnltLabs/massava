/**
 * Redis Pub/Sub for SSE
 *
 * Uses Upstash Redis to publish messages that SSE clients poll for.
 * Since Upstash REST API doesn't support true pub/sub, we use a list-based approach.
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }
  return redis;
}

const CHANNEL_PREFIX = 'notifications:';
const MESSAGE_TTL = 60; // Messages expire after 60 seconds

export interface SSEMessage {
  type: 'notification' | 'badge_update' | 'connected';
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * SSE Publisher - publishes messages to Redis for SSE clients to consume
 */
class SSEPublisher {
  /**
   * Publish a notification to a user's channel
   */
  async publishToUser(userId: string, notification: Record<string, unknown>): Promise<void> {
    const redis = getRedis();
    const channel = `${CHANNEL_PREFIX}${userId}:queue`;

    const message: SSEMessage = {
      type: 'notification',
      data: notification,
      timestamp: Date.now(),
    };

    // Push to list and set expiry
    await redis.lpush(channel, JSON.stringify(message));
    await redis.expire(channel, MESSAGE_TTL);
  }

  /**
   * Publish a badge count update to a user
   */
  async publishBadgeUpdate(userId: string, count: number): Promise<void> {
    const redis = getRedis();
    const channel = `${CHANNEL_PREFIX}${userId}:queue`;

    const message: SSEMessage = {
      type: 'badge_update',
      data: { count },
      timestamp: Date.now(),
    };

    await redis.lpush(channel, JSON.stringify(message));
    await redis.expire(channel, MESSAGE_TTL);
  }

  /**
   * Broadcast a message to multiple users
   */
  async broadcast(userIds: string[], notification: Record<string, unknown>): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.publishToUser(userId, notification))
    );
  }
}

/**
 * SSE Subscriber - retrieves messages from Redis for SSE endpoint
 */
class SSESubscriber {
  /**
   * Get all pending messages for a user and clear the queue
   */
  async getMessages(userId: string): Promise<SSEMessage[]> {
    const redis = getRedis();
    const channel = `${CHANNEL_PREFIX}${userId}:queue`;

    // Get all messages
    const rawMessages = await redis.lrange(channel, 0, -1);

    if (rawMessages.length === 0) {
      return [];
    }

    // Clear the queue
    await redis.del(channel);

    // Parse messages (they come in reverse order from lpush)
    const messages: SSEMessage[] = rawMessages
      .reverse()
      .map((raw) => {
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          return null;
        }
      })
      .filter((m): m is SSEMessage => m !== null);

    return messages;
  }

  /**
   * Check if user has pending messages
   */
  async hasPendingMessages(userId: string): Promise<boolean> {
    const redis = getRedis();
    const channel = `${CHANNEL_PREFIX}${userId}:queue`;
    const length = await redis.llen(channel);
    return length > 0;
  }
}

export const ssePublisher = new SSEPublisher();
export const sseSubscriber = new SSESubscriber();
