/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * P0.4 FIX: Rate Limiting Implementation
 * In-memory rate limiting for authentication endpoints
 * Prevents brute force attacks and credential stuffing
 *
 * Phase 1: In-memory storage (simple, no infrastructure)
 * Phase 3: Redis-backed storage (scalable, production-ready)
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

// In-memory storage (Phase 1)
// Note: This resets on server restart - acceptable for Phase 1
// Phase 3 will use Redis for persistence
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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

  // Fallback to direct IP
  const ip = request.ip || request.headers.get('x-real-ip');
  return ip || 'unknown';
}

/**
 * Rate limit by IP address
 * Returns true if rate limit exceeded
 */
export function rateLimitByIP(
  request: NextRequest,
  config: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }
): { limited: boolean; remaining: number; resetAt: number } {
  const identifier = getClientIdentifier(request);
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }

  // Increment attempt count
  entry.count++;

  // Check if limit exceeded
  const limited = entry.count > config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - entry.count);

  return {
    limited,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit by user ID (for authenticated endpoints)
 * Returns true if rate limit exceeded
 */
export function rateLimitByUser(
  userId: string,
  config: RateLimitConfig = {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }
): { limited: boolean; remaining: number; resetAt: number } {
  const identifier = `user:${userId}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }

  // Increment attempt count
  entry.count++;

  // Check if limit exceeded
  const limited = entry.count > config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - entry.count);

  return {
    limited,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful after successful login to clear failed attempts
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string
): { remaining: number; resetAt: number } | null {
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < Date.now()) {
    return null;
  }

  return {
    remaining: Math.max(0, 5 - entry.count), // Default maxAttempts = 5
    resetAt: entry.resetAt,
  };
}
