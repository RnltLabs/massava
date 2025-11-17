/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Phase 3: Redis-Backed Rate Limiting Test Endpoint
 * Demonstrates distributed rate limiting with Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIP, RATE_LIMIT_CONFIGS } from '@/lib/auth/rate-limit';

/**
 * Rate limit check endpoint
 * Returns 429 if rate limit exceeded
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const result = await rateLimitByIP(request, RATE_LIMIT_CONFIGS.LOGIN);

  if (result.limited) {
    const resetDate = new Date(result.resetAt);
    const minutesRemaining = Math.ceil((result.resetAt - Date.now()) / 60000);

    return NextResponse.json(
      {
        error: 'Too many login attempts',
        message: `Please try again in ${minutesRemaining} minutes`,
        resetAt: resetDate.toISOString(),
        current: result.current,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT_CONFIGS.LOGIN.maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return NextResponse.json({
    success: true,
    remaining: result.remaining,
    resetAt: new Date(result.resetAt).toISOString(),
    current: result.current,
    message: 'Rate limit check passed - Redis-backed',
  });
}

/**
 * GET endpoint - check rate limit status without incrementing
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Get IP for status check
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  return NextResponse.json({
    ip,
    message: 'Rate limiting is active (Redis-backed). POST to this endpoint to test.',
    config: RATE_LIMIT_CONFIGS.LOGIN,
  });
}
