/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Rate Limiter Tests
 *
 * Tests for API-level rate limiting middleware with Redis backend.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import {
  rateLimit,
  withRateLimit,
  resetRateLimits,
  NOTIFICATION_RATE_LIMITS,
  type RateLimitConfig,
} from '@/lib/middleware/api-rate-limiter';
import type { Session } from 'next-auth';

// Mock Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock notification error system
jest.mock('@/lib/notifications/errors', () => ({
  createNotificationError: jest.fn((type, message, context) => ({
    type,
    message,
    correlationId: context?.correlationId || 'test-correlation-id',
    userId: context?.userId || 'unknown',
    retryAfter: context?.retryAfter || 60,
    limit: context?.limit || 100,
  })),
  formatErrorResponse: jest.fn((error) => ({
    error: error.type,
    message: error.message,
    correlationId: error.correlationId,
    statusCode: 429,
    details: {
      retryAfter: error.retryAfter,
      limit: error.limit,
    },
  })),
}));

describe('API Rate Limiter', () => {
  let mockRedis: jest.Mocked<Redis>;
  let mockSession: Session;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock Redis
    mockRedis = {
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
    } as any;

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);

    // Setup mock session
    mockSession = {
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };
  });

  describe('rateLimit()', () => {
    it('should allow request when under rate limit', async () => {
      // With session, it checks IP (default) and user limits
      mockRedis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const result = await rateLimit(request, config, mockSession);

      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
        expect(result.limit).toBe(10);
      }
    });

    it('should block request when rate limit exceeded', async () => {
      // Both IP and user checks will be over limit
      mockRedis.incr.mockResolvedValueOnce(11).mockResolvedValueOnce(11);
      mockRedis.ttl.mockResolvedValue(45);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const result = await rateLimit(request, config, mockSession);

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        const json = await result.json();
        expect(json.error).toBe('RATE_LIMITED');
        expect(result.status).toBe(429);
        expect(result.headers.get('Retry-After')).toBeTruthy();
        expect(result.headers.get('X-RateLimit-Limit')).toBe('10');
        expect(result.headers.get('X-RateLimit-Remaining')).toBe('0');
      }
    });

    it('should set expiry on first request', async () => {
      // Both limits check: IP (first) and user (first)
      mockRedis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      await rateLimit(request, config, mockSession);

      // Should set expiry for both limits (IP and user)
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:api:'),
        60
      );
      expect(mockRedis.expire).toHaveBeenCalledTimes(2);
    });

    it('should not set expiry on subsequent requests', async () => {
      // Not first request for either limit
      mockRedis.incr.mockResolvedValueOnce(5).mockResolvedValueOnce(5);
      mockRedis.ttl.mockResolvedValue(55);

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      await rateLimit(request, config, mockSession);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should check IP-based rate limit when ipLimit is true', async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: false,
      };

      await rateLimit(request, config, mockSession);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:api:ip:/api/notifications:192.168.1.1')
      );
      expect(mockRedis.incr).toHaveBeenCalledTimes(1);
    });

    it('should check user-based rate limit when userLimit is true', async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications');

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: false,
        userLimit: true,
      };

      await rateLimit(request, config, mockSession);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:api:user:/api/notifications:test-user-123')
      );
      expect(mockRedis.incr).toHaveBeenCalledTimes(1);
    });

    it('should check both IP and user limits when both enabled', async () => {
      mockRedis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: true,
      };

      await rateLimit(request, config, mockSession);

      expect(mockRedis.incr).toHaveBeenCalledTimes(2);
      expect(mockRedis.incr).toHaveBeenNthCalledWith(1,
        expect.stringContaining('ratelimit:api:ip:')
      );
      expect(mockRedis.incr).toHaveBeenNthCalledWith(2,
        expect.stringContaining('ratelimit:api:user:')
      );
    });

    it('should return most restrictive limit when multiple limits checked', async () => {
      // IP limit: 5 requests used (5 remaining)
      // User limit: 8 requests used (2 remaining)
      mockRedis.incr
        .mockResolvedValueOnce(5) // IP
        .mockResolvedValueOnce(8); // User
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: true,
      };

      const result = await rateLimit(request, config, mockSession);

      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.remaining).toBe(2); // Most restrictive (user limit)
      }
    });

    it('should fail if any limit is exceeded', async () => {
      // IP limit: OK (5 requests)
      // User limit: EXCEEDED (11 requests)
      mockRedis.incr
        .mockResolvedValueOnce(5) // IP - OK
        .mockResolvedValueOnce(11); // User - EXCEEDED
      mockRedis.ttl.mockResolvedValue(45);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: true,
      };

      const result = await rateLimit(request, config, mockSession);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should require authentication when requireAuth is true', async () => {
      const request = createMockRequest('/api/notifications');

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        requireAuth: true,
      };

      const result = await rateLimit(request, config, null); // No session

      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        const json = await result.json();
        expect(json.error).toBe('Unauthorized');
        expect(result.status).toBe(401);
      }
    });

    it('should fail-open on Redis error', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection failed'));

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const result = await rateLimit(request, config, mockSession);

      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.allowed).toBe(true);
      }
    });

    it('should extract IP from x-forwarded-for header', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }, // Multiple IPs
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: false,
      };

      await rateLimit(request, config, null);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(':192.168.1.1') // First IP only
      );
    });

    it('should extract IP from x-real-ip header', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-real-ip': '203.0.113.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: false,
      };

      await rateLimit(request, config, null);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(':203.0.113.1')
      );
    });

    it('should extract IP from cf-connecting-ip header (Cloudflare)', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications', {
        headers: { 'cf-connecting-ip': '198.51.100.1' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: false,
      };

      await rateLimit(request, config, null);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(':198.51.100.1')
      );
    });
  });

  describe('withRateLimit()', () => {
    it('should execute handler when rate limit passes', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const handler = jest.fn(async () => NextResponse.json({ success: true }));

      const response = await withRateLimit(request, config, mockSession, handler);

      expect(handler).toHaveBeenCalled();
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
    });

    it('should not execute handler when rate limited', async () => {
      mockRedis.incr.mockResolvedValue(11); // Over limit
      mockRedis.ttl.mockResolvedValue(45);

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const handler = jest.fn(async () => NextResponse.json({ success: true }));

      const response = await withRateLimit(request, config, mockSession, handler);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
    });

    it('should add rate limit headers to successful response', async () => {
      mockRedis.incr.mockResolvedValue(5);
      mockRedis.ttl.mockResolvedValue(45);

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const handler = jest.fn(async () => NextResponse.json({ data: 'test' }));

      const response = await withRateLimit(request, config, mockSession, handler);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();

      const json = await response.json();
      expect(json.data).toBe('test');
    });
  });

  describe('resetRateLimits()', () => {
    it('should reset limits for a specific user', async () => {
      mockRedis.keys.mockResolvedValue([
        'ratelimit:api:user:/api/notifications:user-123',
        'ratelimit:api:user:/api/notifications/devices:user-123',
      ]);

      await resetRateLimits({ userId: 'user-123' });

      expect(mockRedis.keys).toHaveBeenCalledWith(
        'ratelimit:api:user:*:user-123'
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'ratelimit:api:user:/api/notifications:user-123',
        'ratelimit:api:user:/api/notifications/devices:user-123'
      );
    });

    it('should reset limits for a specific IP', async () => {
      mockRedis.keys.mockResolvedValue([
        'ratelimit:api:ip:/api/notifications:192.168.1.1',
      ]);

      await resetRateLimits({ ip: '192.168.1.1' });

      expect(mockRedis.keys).toHaveBeenCalledWith(
        'ratelimit:api:ip:*:192.168.1.1'
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'ratelimit:api:ip:/api/notifications:192.168.1.1'
      );
    });

    it('should reset limits for specific route', async () => {
      mockRedis.keys.mockResolvedValue([
        'ratelimit:api:user:/api/notifications:user-123',
      ]);

      await resetRateLimits({
        userId: 'user-123',
        route: '/api/notifications',
      });

      expect(mockRedis.keys).toHaveBeenCalledWith(
        'ratelimit:api:user:/api/notifications:user-123'
      );
    });

    it('should handle no matching keys gracefully', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await resetRateLimits({ userId: 'user-123' });

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      await expect(
        resetRateLimits({ userId: 'user-123' })
      ).resolves.not.toThrow();
    });
  });

  describe('NOTIFICATION_RATE_LIMITS', () => {
    it('should have createNotification config', () => {
      expect(NOTIFICATION_RATE_LIMITS.createNotification).toEqual({
        requests: 10,
        windowSeconds: 60,
        requireAuth: true,
        ipLimit: true,
        userLimit: true,
      });
    });

    it('should have listNotifications config', () => {
      expect(NOTIFICATION_RATE_LIMITS.listNotifications).toEqual({
        requests: 60,
        windowSeconds: 60,
        requireAuth: true,
        ipLimit: false,
        userLimit: true,
      });
    });

    it('should have registerDevice config', () => {
      expect(NOTIFICATION_RATE_LIMITS.registerDevice).toEqual({
        requests: 5,
        windowSeconds: 60,
        requireAuth: true,
        ipLimit: true,
        userLimit: true,
      });
    });

    it('should have unreadCount config with high limit', () => {
      expect(NOTIFICATION_RATE_LIMITS.unreadCount).toEqual({
        requests: 120,
        windowSeconds: 60,
        requireAuth: true,
        ipLimit: false,
        userLimit: true,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero TTL gracefully', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(0); // Expired

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const result = await rateLimit(request, config, mockSession);

      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.allowed).toBe(true);
        expect(result.resetAt).toBeGreaterThan(0);
      }
    });

    it('should handle negative TTL gracefully', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(-1); // No expiry set

      const request = createMockRequest('/api/notifications');
      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      const result = await rateLimit(request, config, mockSession);

      expect(result).not.toBeInstanceOf(NextResponse);
    });

    it('should handle missing IP address', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('/api/notifications'); // No IP headers

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
        ipLimit: true,
        userLimit: false,
      };

      await rateLimit(request, config, null);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(':unknown')
      );
    });

    it('should handle correlation ID from request headers', async () => {
      mockRedis.incr.mockResolvedValue(11); // Over limit
      mockRedis.ttl.mockResolvedValue(45);

      const request = createMockRequest('/api/notifications', {
        headers: { 'x-correlation-id': 'custom-correlation-123' },
      });

      const config: RateLimitConfig = {
        requests: 10,
        windowSeconds: 60,
      };

      await rateLimit(request, config, mockSession);

      const { createNotificationError } = require('@/lib/notifications/errors');
      expect(createNotificationError).toHaveBeenCalledWith(
        'RATE_LIMITED',
        'Too many requests',
        expect.objectContaining({
          correlationId: 'custom-correlation-123',
        })
      );
    });
  });
});

/**
 * Helper to create mock Next.js request
 */
function createMockRequest(
  pathname: string,
  options: {
    headers?: Record<string, string>;
    method?: string;
  } = {}
): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers = new Headers(options.headers || {});

  return {
    nextUrl: {
      pathname,
      href: url,
    },
    headers,
    method: options.method || 'GET',
    url,
    ip: undefined,
  } as NextRequest;
}
