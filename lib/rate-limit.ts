/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Rate Limiting Utilities
 * In-memory rate limiting for authentication endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: For production with multiple servers, use Redis (Upstash)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
  return rateLimit(identifier, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
}

/**
 * Rate limiter for magic link generation
 * Limits: 3 attempts per 15 minutes
 */
export function magicLinkRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, 3, 15 * 60 * 1000); // 3 requests per 15 minutes
}

/**
 * Rate limiter for booking endpoints
 * Limits: 10 bookings per hour
 */
export function bookingRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, 10, 60 * 60 * 1000); // 10 requests per hour
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
