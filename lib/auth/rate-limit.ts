/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Phase 3: Redis-Backed Rate Limiting
 * Distributed, persistent rate limiting for production security
 *
 * SECURITY IMPROVEMENTS:
 * - Rate limits persist across server restarts
 * - Rate limits shared across all instances (distributed)
 * - Atomic operations prevent race conditions
 * - Fail-secure: denies access on Redis errors
 *
 * FIXES:
 * - CR-013: In-memory rate limiting not distributed
 * - SEC-003: Rate limit bypass on multi-instance deployments
 */

import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  current: number;
}

// Redis client singleton
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    throw new Error(
      'UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set for rate limiting'
    );
  }

  redisClient = new Redis({
    url,
    token,
  });

  return redisClient;
}

/**
 * Get client identifier (IP address)
 * Uses x-forwarded-for header if available (behind proxy)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to real-ip header
  const ip = request.headers.get('x-real-ip');
  return ip || 'unknown';
}

/**
 * Check if request should be allowed based on rate limit
 *
 * Uses Redis INCR + TTL for atomic, distributed rate limiting.
 * Each identifier gets independent bucket with windowed resets.
 *
 * PERFORMANCE: ~5ms (Redis latency)
 * SECURITY: Atomic operations, no race conditions
 * DISTRIBUTED: Works across all instances
 * PERSISTENT: Survives server restarts
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const startTime = performance.now();

  try {
    const redis = getRedisClient();
    const key = `ratelimit:${identifier}`;
    const ttl = config.windowSeconds;

    // Atomic increment (handles concurrent requests safely)
    const current = await redis.incr(key);

    // First request in window - set expiry
    if (current === 1) {
      await redis.expire(key, ttl);
    }

    // Get remaining time until reset
    const ttlRemaining = await redis.ttl(key);
    const resetAt = Date.now() + (ttlRemaining > 0 ? ttlRemaining * 1000 : ttl * 1000);

    const allowed = current <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - current);

    const duration = performance.now() - startTime;

    if (duration > 10) {
      logger.warn('Rate limit check slow', {
        identifier,
        duration,
        action: 'RATE_LIMIT_CHECK'
      });
    }

    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        current,
        max: config.maxRequests,
        window: config.windowSeconds,
        action: 'RATE_LIMIT_EXCEEDED'
      });
    }

    return {
      allowed,
      remaining,
      resetAt,
      current,
    };
  } catch (error) {
    logger.error('Rate limit check failed', {
      identifier,
      error: error instanceof Error ? error.message : String(error),
      action: 'RATE_LIMIT_CHECK'
    });

    // FAIL-SECURE: Deny access on Redis errors
    // This prevents bypass attacks if Redis is down
    // Production monitoring should alert on these errors
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + config.windowSeconds * 1000,
      current: config.maxRequests + 1,
    };
  }
}

/**
 * Rate limit by IP address
 * Returns rate limit result with detailed status
 */
export async function rateLimitByIP(
  request: NextRequest,
  config: RateLimitConfig = {
    maxRequests: 5,
    windowSeconds: 15 * 60, // 15 minutes
  }
): Promise<{
  limited: boolean;
  remaining: number;
  resetAt: number;
  current?: number;
}> {
  const identifier = getClientIdentifier(request);
  const result = await checkRateLimit(identifier, config);

  return {
    limited: !result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
    current: result.current,
  };
}

/**
 * Rate limit by user ID (for authenticated endpoints)
 * Returns rate limit result with detailed status
 */
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig = {
    maxRequests: 10,
    windowSeconds: 15 * 60, // 15 minutes
  }
): Promise<{
  limited: boolean;
  remaining: number;
  resetAt: number;
  current?: number;
}> {
  const identifier = `user:${userId}`;
  const result = await checkRateLimit(identifier, config);

  return {
    limited: !result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
    current: result.current,
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful after successful login to clear failed attempts
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `ratelimit:${identifier}`;
    await redis.del(key);

    logger.info('Rate limit reset', {
      identifier,
      action: 'RATE_LIMIT_RESET'
    });
  } catch (error) {
    logger.error('Rate limit reset failed', {
      identifier,
      error: error instanceof Error ? error.message : String(error),
      action: 'RATE_LIMIT_RESET'
    });
  }
}

/**
 * Get rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = {
    maxRequests: 5,
    windowSeconds: 15 * 60,
  }
): Promise<{ remaining: number; resetAt: number; current: number } | null> {
  try {
    const redis = getRedisClient();
    const key = `ratelimit:${identifier}`;

    const current = await redis.get<number>(key);
    const ttlRemaining = await redis.ttl(key);

    if (current === null || ttlRemaining <= 0) {
      return null;
    }

    const remaining = Math.max(0, config.maxRequests - current);
    const resetAt = Date.now() + ttlRemaining * 1000;

    return {
      remaining,
      resetAt,
      current,
    };
  } catch (error) {
    logger.error('Rate limit status check failed', {
      identifier,
      error: error instanceof Error ? error.message : String(error),
      action: 'RATE_LIMIT_STATUS'
    });
    return null;
  }
}

// Export config for common scenarios
export const RATE_LIMIT_CONFIGS = {
  LOGIN: { maxRequests: 5, windowSeconds: 900 }, // 5 attempts per 15 min
  MAGIC_LINK: { maxRequests: 3, windowSeconds: 3600 }, // 3 per hour
  GENERAL: { maxRequests: 60, windowSeconds: 60 }, // 60 per minute
  STRICT: { maxRequests: 10, windowSeconds: 3600 }, // 10 per hour
} as const;
