/**
 * Notification Rate Limiter
 *
 * Prevents notification spam using Redis-based rate limiting.
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Initialize Redis client (reuse existing Upstash connection)
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

interface RateLimitConfig {
  /** Maximum notifications per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  perUser: { limit: 100, windowSeconds: 3600 }, // 100 per hour
  perTypePerUser: { limit: 10, windowSeconds: 3600 }, // 10 per type per hour
};

/**
 * Check if a notification is rate limited
 *
 * @returns true if rate limited (should not send), false if OK to send
 */
export async function isRateLimited(
  userId: string,
  notificationType: string,
  priority: string
): Promise<boolean> {
  // URGENT notifications bypass rate limiting
  if (priority === 'URGENT') {
    return false;
  }

  try {
    const redis = getRedis();

    // Check per-user limit
    const userKey = `ratelimit:notifications:user:${userId}`;
    const userCount = await redis.incr(userKey);

    if (userCount === 1) {
      await redis.expire(userKey, DEFAULT_LIMITS.perUser.windowSeconds);
    }

    if (userCount > DEFAULT_LIMITS.perUser.limit) {
      logger.warn(`Rate limit exceeded for user ${userId}: ${userCount}/${DEFAULT_LIMITS.perUser.limit}`);
      return true;
    }

    // Check per-type-per-user limit
    const typeKey = `ratelimit:notifications:user:${userId}:type:${notificationType}`;
    const typeCount = await redis.incr(typeKey);

    if (typeCount === 1) {
      await redis.expire(typeKey, DEFAULT_LIMITS.perTypePerUser.windowSeconds);
    }

    if (typeCount > DEFAULT_LIMITS.perTypePerUser.limit) {
      logger.warn(`Rate limit exceeded for user ${userId} type ${notificationType}: ${typeCount}/${DEFAULT_LIMITS.perTypePerUser.limit}`);
      return true;
    }

    return false;
  } catch (error) {
    // On Redis error, allow the notification (fail open)
    logger.error('Rate limiter error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return false;
  }
}

/**
 * Reset rate limits for a user (for testing)
 */
export async function resetRateLimits(userId: string): Promise<void> {
  try {
    const redis = getRedis();
    const pattern = `ratelimit:notifications:user:${userId}*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Failed to reset rate limits:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
