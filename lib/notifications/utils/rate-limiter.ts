/**
 * Notification Rate Limiter
 *
 * Prevents notification spam using Redis-based rate limiting with two tiers:
 * - Per-user: Max 100 notifications per hour
 * - Per-type-per-user: Max 10 of same type per hour
 *
 * URGENT priority notifications bypass rate limiting to ensure important alerts are delivered.
 *
 * @module lib/notifications/utils/rate-limiter
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Initialize Redis client (reuse existing Upstash connection)
let redis: Redis | null = null;

/**
 * Get or initialize Redis client for rate limiting storage
 *
 * @returns {Redis} Redis client instance
 * @private
 */
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }
  return redis;
}

/**
 * Rate limiting configuration for a tier
 *
 * @interface RateLimitConfig
 * @property {number} limit - Maximum notifications allowed in the window
 * @property {number} windowSeconds - Time window in seconds
 */
interface RateLimitConfig {
  /** Maximum notifications per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

/**
 * Default rate limiting thresholds
 *
 * @constant {Record<string, RateLimitConfig>} DEFAULT_LIMITS
 */
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  perUser: { limit: 100, windowSeconds: 3600 }, // 100 per hour
  perTypePerUser: { limit: 10, windowSeconds: 3600 }, // 10 per type per hour
};

/**
 * Check if notification creation should be rate limited
 *
 * Enforces two rate limits:
 * 1. Per-user: Maximum 100 notifications per hour
 * 2. Per-type-per-user: Maximum 10 notifications of same type per hour
 *
 * URGENT priority notifications bypass all rate limiting to ensure critical alerts
 * (e.g., subscription expiring, account security) always reach users.
 *
 * Uses Redis for efficient distributed rate limiting across server instances.
 * On Redis error, allows notification (fail-open) rather than blocking delivery.
 *
 * @param {string} userId - ID of user being notified
 * @param {string} notificationType - Type of notification
 * @param {string} priority - Priority level (URGENT bypasses limits)
 *
 * @returns {Promise<boolean>} True if rate limited (should not send), false if OK to send
 *
 * @example
 * ```typescript
 * // Check before creating notification
 * const limited = await isRateLimited('user-123', 'BOOKING_REMINDER', 'NORMAL');
 *
 * if (limited) {
 *   return { error: 'Too many notifications in short time' };
 * }
 *
 * // Proceed with notification creation
 * const result = await notificationService.create({ ... });
 * ```
 *
 * @see {@link resetRateLimits} - Clear limits for testing
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
 * Clear all rate limit counters for a user (testing/debugging only)
 *
 * Removes all Redis rate limit keys associated with a user, resetting their
 * notification counter to zero. Useful for testing or manually clearing limits.
 *
 * Should only be exposed in admin/testing endpoints, not in production UI.
 *
 * @param {string} userId - ID of user whose limits should be reset
 *
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // In test setup
 * before(async () => {
 *   await resetRateLimits('test-user-123');
 * });
 *
 * // Or in admin endpoint
 * app.post('/admin/reset-rate-limits', async (req) => {
 *   await resetRateLimits(req.body.userId);
 *   return { success: true };
 * });
 * ```
 *
 * @see {@link isRateLimited} - Check current rate limit status
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
