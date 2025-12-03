/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Rate Limiting Middleware
 *
 * Protects API routes from abuse with configurable rate limits using Upstash Redis.
 * Supports multiple limiting strategies:
 * - IP-based rate limiting (prevents DDoS attacks)
 * - User-based rate limiting (prevents authenticated user abuse)
 * - Combined limits (both must pass)
 *
 * Returns proper 429 responses with Retry-After headers per RFC 6585.
 * Integrates with notification error system for consistent error handling.
 *
 * @module lib/middleware/api-rate-limiter
 */

import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createNotificationError, formatErrorResponse } from '@/lib/notifications/errors';
import type { Session } from 'next-auth';

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
 * Rate limit configuration for a specific route
 *
 * @interface RateLimitConfig
 * @property {number} requests - Maximum requests allowed in the window
 * @property {number} windowSeconds - Time window in seconds
 * @property {boolean} [requireAuth] - If true, unauthenticated requests are blocked
 * @property {boolean} [ipLimit] - Enable IP-based rate limiting
 * @property {boolean} [userLimit] - Enable user-based rate limiting
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  requests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Block unauthenticated requests */
  requireAuth?: boolean;
  /** Enable IP-based limiting (default: true) */
  ipLimit?: boolean;
  /** Enable user-based limiting (default: true for authenticated routes) */
  userLimit?: boolean;
}

/**
 * Result of rate limit check
 *
 * @interface RateLimitResult
 * @property {boolean} allowed - Whether request should be allowed
 * @property {number} remaining - Remaining requests in current window
 * @property {number} limit - Total requests allowed per window
 * @property {number} resetAt - Unix timestamp when limit resets
 * @property {number} [retryAfter] - Seconds until retry allowed (if rate limited)
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Extract client IP address from request
 * Checks multiple headers in order of preference for proxy scenarios
 *
 * @param {NextRequest} request - Next.js request object
 * @returns {string} Client IP address or 'unknown'
 * @private
 */
function getClientIp(request: NextRequest): string {
  // Check standard proxy headers (in order of preference)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the list (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to unknown (NextRequest doesn't expose IP directly)
  return 'unknown';
}

/**
 * Check rate limit for a specific key
 *
 * Implements sliding window rate limiting using Redis.
 * Uses INCR + EXPIRE pattern for atomic counting.
 *
 * @param {string} key - Redis key for this limit
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {Promise<RateLimitResult>} Rate limit check result
 * @private
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();

    // Get current count and increment atomically
    const count = await redis.incr(key);

    // Set expiry on first increment
    if (count === 1) {
      await redis.expire(key, config.windowSeconds);
    }

    // Get TTL to calculate reset time
    const ttl = await redis.ttl(key);
    const resetAt = Math.floor(Date.now() / 1000) + Math.max(ttl, 0);

    const allowed = count <= config.requests;
    const remaining = Math.max(0, config.requests - count);

    return {
      allowed,
      remaining,
      limit: config.requests,
      resetAt,
      retryAfter: allowed ? undefined : Math.max(ttl, 1),
    };
  } catch (error) {
    // On Redis error, allow the request (fail-open for availability)
    logger.error('Rate limiter Redis error:', {
      error: error instanceof Error ? error : new Error(String(error)),
      key,
    });

    return {
      allowed: true,
      remaining: config.requests,
      limit: config.requests,
      resetAt: Math.floor(Date.now() / 1000) + config.windowSeconds,
    };
  }
}

/**
 * Apply rate limiting to an API request
 *
 * Checks both IP-based and user-based rate limits (if configured).
 * Returns 429 Too Many Requests with Retry-After header if rate limited.
 *
 * @param {NextRequest} request - Next.js request object
 * @param {RateLimitConfig} config - Rate limit configuration
 * @param {Session | null} [session] - Optional authentication session
 * @returns {Promise<RateLimitResult | NextResponse>} Rate limit result or error response
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const session = await auth();
 *   const rateLimitResult = await rateLimit(request, {
 *     requests: 60,
 *     windowSeconds: 60,
 *     requireAuth: false,
 *   }, session);
 *
 *   if (rateLimitResult instanceof NextResponse) {
 *     return rateLimitResult; // Rate limited
 *   }
 *
 *   // Proceed with request...
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  session?: Session | null
): Promise<RateLimitResult | NextResponse> {
  const { requireAuth = false, ipLimit = true, userLimit = !!session } = config;

  // Check authentication requirement
  if (requireAuth && !session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  const clientIp = getClientIp(request);
  const userId = session?.user?.id;
  const route = request.nextUrl.pathname;

  // Track which limits to check
  const limitsToCheck: Array<{ key: string; identifier: string }> = [];

  if (ipLimit) {
    limitsToCheck.push({
      key: `ratelimit:api:ip:${route}:${clientIp}`,
      identifier: `IP ${clientIp}`,
    });
  }

  if (userLimit && userId) {
    limitsToCheck.push({
      key: `ratelimit:api:user:${route}:${userId}`,
      identifier: `User ${userId}`,
    });
  }

  // Check all applicable rate limits
  let mostRestrictiveResult: RateLimitResult | null = null;
  let failedIdentifier: string | null = null;

  for (const { key, identifier } of limitsToCheck) {
    const result = await checkRateLimit(key, config);

    if (!result.allowed) {
      // Rate limited - find most restrictive (longest retry time)
      if (
        !mostRestrictiveResult ||
        (result.retryAfter || 0) > (mostRestrictiveResult.retryAfter || 0)
      ) {
        mostRestrictiveResult = result;
        failedIdentifier = identifier;
      }
    }

    // Also track the most restrictive successful result for headers
    if (
      result.allowed &&
      (!mostRestrictiveResult || result.remaining < mostRestrictiveResult.remaining)
    ) {
      mostRestrictiveResult = result;
    }
  }

  // If any limit was exceeded, return error response
  if (mostRestrictiveResult && !mostRestrictiveResult.allowed) {
    logger.warn('Rate limit exceeded', {
      route,
      identifier: failedIdentifier,
      limit: mostRestrictiveResult.limit,
      retryAfter: mostRestrictiveResult.retryAfter,
      ip: clientIp,
      userId,
    });

    // Create notification error for consistent error handling
    const error = createNotificationError('RATE_LIMITED', 'Too many requests', {
      userId: userId || clientIp,
      retryAfter: mostRestrictiveResult.retryAfter || 60,
      limit: mostRestrictiveResult.limit,
      correlationId: request.headers.get('x-correlation-id') || undefined,
    });

    const errorResponse = formatErrorResponse(error);

    return NextResponse.json(errorResponse, {
      status: 429,
      headers: {
        'Retry-After': String(mostRestrictiveResult.retryAfter || 60),
        'X-RateLimit-Limit': String(mostRestrictiveResult.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(mostRestrictiveResult.resetAt),
      },
    });
  }

  // Return the most restrictive successful result (for setting headers)
  return (
    mostRestrictiveResult || {
      allowed: true,
      remaining: config.requests,
      limit: config.requests,
      resetAt: Math.floor(Date.now() / 1000) + config.windowSeconds,
    }
  );
}

/**
 * Convenience wrapper for rate limiting middleware
 * Applies rate limiting and sets rate limit headers on successful requests
 *
 * @param {NextRequest} request - Next.js request object
 * @param {RateLimitConfig} config - Rate limit configuration
 * @param {Session | null} [session] - Optional authentication session
 * @param {Function} handler - Request handler to execute if rate limit passes
 * @returns {Promise<NextResponse>} Response from handler or rate limit error
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const session = await auth();
 *
 *   return withRateLimit(
 *     request,
 *     { requests: 60, windowSeconds: 60 },
 *     session,
 *     async () => {
 *       // Your route handler logic here
 *       return NextResponse.json({ data: 'success' });
 *     }
 *   );
 * }
 * ```
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  session: Session | null | undefined,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await rateLimit(request, config, session);

  // If rate limited, return error response
  if (result instanceof NextResponse) {
    return result;
  }

  // Execute handler and add rate limit headers
  const response = await handler();

  // Add rate limit headers to successful response
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.resetAt));

  return response;
}

/**
 * Predefined rate limit configurations for notification API routes
 *
 * @constant {Record<string, RateLimitConfig>} NOTIFICATION_RATE_LIMITS
 */
export const NOTIFICATION_RATE_LIMITS = {
  // POST /api/notifications - Admin only, strict limit
  createNotification: {
    requests: 10,
    windowSeconds: 60, // 10 per minute
    requireAuth: true,
    ipLimit: true,
    userLimit: true,
  },

  // GET /api/notifications - Normal reading
  listNotifications: {
    requests: 60,
    windowSeconds: 60, // 60 per minute
    requireAuth: true,
    ipLimit: false, // Skip IP limit for authenticated routes
    userLimit: true,
  },

  // GET /api/notifications/:id - Normal reading
  getNotification: {
    requests: 60,
    windowSeconds: 60, // 60 per minute
    requireAuth: true,
    ipLimit: false,
    userLimit: true,
  },

  // POST /api/notifications/devices - Device registration
  registerDevice: {
    requests: 5,
    windowSeconds: 60, // 5 per minute (infrequent operation)
    requireAuth: true,
    ipLimit: true, // Check IP to prevent device token spam
    userLimit: true,
  },

  // DELETE /api/notifications/devices/:id - Device removal
  deleteDevice: {
    requests: 10,
    windowSeconds: 60, // 10 per minute
    requireAuth: true,
    ipLimit: false,
    userLimit: true,
  },

  // GET /api/notifications/unread-count - Polled frequently
  unreadCount: {
    requests: 120,
    windowSeconds: 60, // 120 per minute (allow polling every 30s with buffer)
    requireAuth: true,
    ipLimit: false,
    userLimit: true,
  },

  // Additional routes
  readNotification: {
    requests: 60,
    windowSeconds: 60, // 60 per minute
    requireAuth: true,
    ipLimit: false,
    userLimit: true,
  },

  preferences: {
    requests: 30,
    windowSeconds: 60, // 30 per minute
    requireAuth: true,
    ipLimit: false,
    userLimit: true,
  },

  stream: {
    requests: 10,
    windowSeconds: 60, // 10 per minute (SSE connections)
    requireAuth: true,
    ipLimit: true, // Prevent connection flooding
    userLimit: true,
  },
} as const;

/**
 * Clear rate limit counters for a user or IP (testing/debugging only)
 *
 * Removes all Redis rate limit keys for the given identifier.
 * Should only be exposed in admin/testing endpoints.
 *
 * @param {Object} params - Reset parameters
 * @param {string} [params.userId] - User ID to reset
 * @param {string} [params.ip] - IP address to reset
 * @param {string} [params.route] - Specific route to reset (optional)
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Reset all limits for a user
 * await resetRateLimits({ userId: 'user-123' });
 *
 * // Reset all limits for an IP
 * await resetRateLimits({ ip: '192.168.1.1' });
 *
 * // Reset specific route for a user
 * await resetRateLimits({ userId: 'user-123', route: '/api/notifications' });
 * ```
 */
export async function resetRateLimits(params: {
  userId?: string;
  ip?: string;
  route?: string;
}): Promise<void> {
  try {
    const redis = getRedis();
    const patterns: string[] = [];

    if (params.userId) {
      const pattern = params.route
        ? `ratelimit:api:user:${params.route}:${params.userId}`
        : `ratelimit:api:user:*:${params.userId}`;
      patterns.push(pattern);
    }

    if (params.ip) {
      const pattern = params.route
        ? `ratelimit:api:ip:${params.route}:${params.ip}`
        : `ratelimit:api:ip:*:${params.ip}`;
      patterns.push(pattern);
    }

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }

    logger.debug('Rate limits reset', params);
  } catch (error) {
    logger.error('Failed to reset rate limits:', {
      error: error instanceof Error ? error : new Error(String(error)),
      params,
    });
  }
}
