/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Rate Limiting Utilities
 * Distributed rate limiting with Upstash Redis (with in-memory fallback)
 */

import { Redis } from '@upstash/redis';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limiting constants
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5; // Maximum authentication attempts
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAGIC_LINK_RATE_LIMIT_MAX_ATTEMPTS = 3; // Maximum magic link requests
const MAGIC_LINK_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const BOOKING_RATE_LIMIT_MAX_ATTEMPTS = 10; // Maximum bookings per hour
const BOOKING_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const DELETION_RATE_LIMIT_MAX_ATTEMPTS = 3; // Maximum deletion attempts
const DELETION_RATE_LIMIT_WINDOW_SECONDS = 60 * 60; // 1 hour in seconds
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up old entries every 5 minutes

// In-memory store for rate limiting (fallback for development)
const rateLimitStore = new Map<string, RateLimitEntry>();

// In-memory store for deletion rate limiting (fallback)
const deletionAttempts = new Map<string, { count: number; resetAt: number }>();

// Initialize Redis client (lazy initialization)
let redis: Redis | null = null;

/**
 * Get Redis client instance (singleton pattern)
 */
function getRedisClient(): Redis | null {
  if (redis) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set in production. Using in-memory fallback (NOT recommended).'
      );
    }
    return null;
  }

  redis = new Redis({
    url,
    token,
  });

  return redis;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  // Also clean up deletion attempts
  for (const [key, entry] of deletionAttempts.entries()) {
    if (entry.resetAt < now) {
      deletionAttempts.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Simple in-memory rate limiter using sliding window
 *
 * @param identifier - Unique identifier (IP address or email)
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: newEntry.resetTime,
    };
  }

  // Entry exists and not expired
  entry.count++;

  if (entry.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Rate limiter for authentication endpoints
 * Limits: 5 attempts per 15 minutes
 */
export function authRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, AUTH_RATE_LIMIT_MAX_ATTEMPTS, AUTH_RATE_LIMIT_WINDOW_MS);
}

/**
 * Rate limiter for magic link generation
 * Limits: 3 attempts per 15 minutes
 */
export function magicLinkRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, MAGIC_LINK_RATE_LIMIT_MAX_ATTEMPTS, MAGIC_LINK_RATE_LIMIT_WINDOW_MS);
}

/**
 * Rate limiter for booking endpoints
 * Limits: 10 bookings per hour
 */
export function bookingRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, BOOKING_RATE_LIMIT_MAX_ATTEMPTS, BOOKING_RATE_LIMIT_WINDOW_MS);
}

/**
 * Get client IP address from request
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Try various headers (in order of preference)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
    // We want the first one (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to 'unknown' if no IP found
  return 'unknown';
}

/**
 * Format rate limit error response
 */
export function rateLimitErrorResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return {
    error: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.',
    retryAfter,
    limit: result.limit,
    remaining: result.remaining,
  };
}

/**
 * In-memory deletion rate limiting (fallback for development)
 */
function checkInMemoryDeletionRateLimit(
  userId: string,
  maxAttempts: number,
  windowSeconds: number
): { allowed: boolean; error?: string; attemptsLeft?: number } {
  const now = Date.now();
  const userAttempts = deletionAttempts.get(userId);

  if (!userAttempts || now > userAttempts.resetAt) {
    // Reset or initialize
    deletionAttempts.set(userId, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { allowed: true, attemptsLeft: maxAttempts - 1 };
  }

  userAttempts.count += 1;

  if (userAttempts.count > maxAttempts) {
    const secondsLeft = Math.ceil((userAttempts.resetAt - now) / 1000);
    const minutes = Math.ceil(secondsLeft / 60);
    return {
      allowed: false,
      error: `Zu viele Löschversuche. Bitte versuchen Sie es in ${minutes} Minute${minutes === 1 ? '' : 'n'} erneut.`,
    };
  }

  return { allowed: true, attemptsLeft: maxAttempts - userAttempts.count };
}

/**
 * Check deletion rate limit for a user (production-ready with Upstash Redis)
 *
 * @param userId - User ID to check
 * @returns Object with allowed status, error message if denied, and attempts left
 *
 * @example
 * ```typescript
 * const result = await checkDeletionRateLimit(userId);
 * if (!result.allowed) {
 *   return { success: false, error: result.error };
 * }
 * ```
 */
export async function checkDeletionRateLimit(userId: string): Promise<{
  allowed: boolean;
  error?: string;
  attemptsLeft?: number;
}> {
  const redisClient = getRedisClient();

  // Fallback to in-memory if Redis not configured
  if (!redisClient) {
    return checkInMemoryDeletionRateLimit(
      userId,
      DELETION_RATE_LIMIT_MAX_ATTEMPTS,
      DELETION_RATE_LIMIT_WINDOW_SECONDS
    );
  }

  try {
    const key = `studio:deletion:${userId}`;

    // Increment counter
    const count = await redisClient.incr(key);

    // Set expiry on first attempt
    if (count === 1) {
      await redisClient.expire(key, DELETION_RATE_LIMIT_WINDOW_SECONDS);
    }

    // Check if limit exceeded
    if (count > DELETION_RATE_LIMIT_MAX_ATTEMPTS) {
      const ttl = await redisClient.ttl(key);
      const minutes = Math.ceil(ttl / 60);
      return {
        allowed: false,
        error: `Zu viele Löschversuche. Bitte versuchen Sie es in ${minutes} Minute${minutes === 1 ? '' : 'n'} erneut.`,
      };
    }

    return {
      allowed: true,
      attemptsLeft: DELETION_RATE_LIMIT_MAX_ATTEMPTS - count,
    };
  } catch (error) {
    console.error('[rate-limit] Redis error, falling back to in-memory:', error);
    // Fallback to in-memory on Redis errors
    return checkInMemoryDeletionRateLimit(
      userId,
      DELETION_RATE_LIMIT_MAX_ATTEMPTS,
      DELETION_RATE_LIMIT_WINDOW_SECONDS
    );
  }
}

/**
 * Reset deletion rate limit for a user
 * Useful for testing or manual admin actions
 *
 * @param userId - User ID to reset
 */
export async function resetDeletionRateLimit(userId: string): Promise<void> {
  const redisClient = getRedisClient();

  if (!redisClient) {
    deletionAttempts.delete(userId);
    return;
  }

  try {
    const key = `studio:deletion:${userId}`;
    await redisClient.del(key);
  } catch (error) {
    console.error('[rate-limit] Error resetting rate limit:', error);
    // Also clear in-memory fallback
    deletionAttempts.delete(userId);
  }
}
