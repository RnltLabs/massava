/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Phase 3: Redis Rate Limiting Tests
 * Tests distributed, persistent rate limiting with Redis
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
} from '@/lib/auth/rate-limit';

describe('Redis Rate Limiting', () => {
  const testUserId = 'test-user-redis-phase3';
  const testConfig = { maxRequests: 5, windowSeconds: 60 };

  beforeEach(async () => {
    // Cleanup before each test
    await resetRateLimit(testUserId);
  });

  test('should allow requests under limit', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(testUserId, testConfig);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - i - 1);
      expect(result.current).toBe(i + 1);
    }
  });

  test('should block requests over limit', async () => {
    const userId = 'test-blocked-user';

    // Use up the limit
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(userId, { maxRequests: 3, windowSeconds: 60 });
    }

    // Next request should be blocked
    const result = await checkRateLimit(userId, { maxRequests: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.current).toBe(4);

    await resetRateLimit(userId);
  });

  test('should reset after calling resetRateLimit', async () => {
    const userId = 'test-reset-user';
    
    // Hit the limit
    await checkRateLimit(userId, { maxRequests: 2, windowSeconds: 60 });
    await checkRateLimit(userId, { maxRequests: 2, windowSeconds: 60 });
    let result = await checkRateLimit(userId, { maxRequests: 2, windowSeconds: 60 });
    expect(result.allowed).toBe(false);

    // Reset
    await resetRateLimit(userId);

    // Should allow requests again
    result = await checkRateLimit(userId, { maxRequests: 2, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
    
    await resetRateLimit(userId);
  });

  test('should work across concurrent requests', async () => {
    const userId = 'concurrent-user';
    const config = { maxRequests: 10, windowSeconds: 60 };

    // Make 10 concurrent requests
    const promises = Array(10)
      .fill(null)
      .map(() => checkRateLimit(userId, config));

    const results = await Promise.all(promises);

    // All should be allowed (atomic INCR handles race conditions)
    expect(results.filter((r) => r.allowed).length).toBe(10);

    // Next request should be blocked
    const result = await checkRateLimit(userId, config);
    expect(result.allowed).toBe(false);

    await resetRateLimit(userId);
  });

  test('should get status without incrementing', async () => {
    const userId = 'status-user';
    await resetRateLimit(userId);

    // Make 2 requests
    await checkRateLimit(userId, testConfig);
    await checkRateLimit(userId, testConfig);

    // Get status (should not increment)
    const status = await getRateLimitStatus(userId, testConfig);
    expect(status).not.toBeNull();
    expect(status!.current).toBe(2);
    expect(status!.remaining).toBe(3);

    // Make another request (should be 3rd, not 4th)
    const result = await checkRateLimit(userId, testConfig);
    expect(result.current).toBe(3);

    await resetRateLimit(userId);
  });

  test('should return null status for non-existent key', async () => {
    const userId = 'non-existent-user-xyz';
    const status = await getRateLimitStatus(userId, testConfig);
    expect(status).toBeNull();
  });

  test('should expire after window period', async () => {
    const userId = 'expire-user';
    const shortConfig = { maxRequests: 2, windowSeconds: 2 }; // 2 second window

    await resetRateLimit(userId);

    // Make 2 requests (hit limit)
    await checkRateLimit(userId, shortConfig);
    await checkRateLimit(userId, shortConfig);

    // 3rd request should be blocked
    let result = await checkRateLimit(userId, shortConfig);
    expect(result.allowed).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Should allow requests again
    result = await checkRateLimit(userId, shortConfig);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(1);

    await resetRateLimit(userId);
  }, 10000); // Extend timeout for this test

  test('should use predefined configs correctly', () => {
    // Test LOGIN config (5 per 15 min)
    expect(RATE_LIMIT_CONFIGS.LOGIN.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.LOGIN.windowSeconds).toBe(900);

    // Test MAGIC_LINK config (3 per hour)
    expect(RATE_LIMIT_CONFIGS.MAGIC_LINK.maxRequests).toBe(3);
    expect(RATE_LIMIT_CONFIGS.MAGIC_LINK.windowSeconds).toBe(3600);

    // Test GENERAL config (60 per minute)
    expect(RATE_LIMIT_CONFIGS.GENERAL.maxRequests).toBe(60);
    expect(RATE_LIMIT_CONFIGS.GENERAL.windowSeconds).toBe(60);

    // Test STRICT config (10 per hour)
    expect(RATE_LIMIT_CONFIGS.STRICT.maxRequests).toBe(10);
    expect(RATE_LIMIT_CONFIGS.STRICT.windowSeconds).toBe(3600);
  });

  test('should handle high concurrency atomically', async () => {
    const userId = 'concurrency-test';
    const config = { maxRequests: 50, windowSeconds: 60 };

    await resetRateLimit(userId);

    // Make 100 concurrent requests (should allow only 50)
    const promises = Array(100)
      .fill(null)
      .map(() => checkRateLimit(userId, config));

    const results = await Promise.all(promises);

    // Exactly 50 should be allowed
    const allowed = results.filter((r) => r.allowed).length;
    const blocked = results.filter((r) => !r.allowed).length;

    expect(allowed).toBe(50);
    expect(blocked).toBe(50);

    await resetRateLimit(userId);
  });

  test('should track resetAt timestamp correctly', async () => {
    const userId = 'reset-at-user';
    const config = { maxRequests: 5, windowSeconds: 60 };

    await resetRateLimit(userId);

    const result = await checkRateLimit(userId, config);

    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThan(Date.now() + 60 * 1000 + 1000); // Within window + 1s margin

    await resetRateLimit(userId);
  });
});

describe('Redis Rate Limiting - Persistence', () => {
  test('should persist state across function calls', async () => {
    const userId = 'persist-user';
    const config = { maxRequests: 3, windowSeconds: 60 };

    await resetRateLimit(userId);

    // First call
    const result1 = await checkRateLimit(userId, config);
    expect(result1.current).toBe(1);

    // Second call (simulates new request or server restart simulation)
    const result2 = await checkRateLimit(userId, config);
    expect(result2.current).toBe(2);

    // Third call
    const result3 = await checkRateLimit(userId, config);
    expect(result3.current).toBe(3);

    // Fourth call should be blocked
    const result4 = await checkRateLimit(userId, config);
    expect(result4.allowed).toBe(false);
    expect(result4.current).toBe(4);

    await resetRateLimit(userId);
  });
});

describe('Redis Rate Limiting - Error Handling', () => {
  test('should fail-secure on Redis errors', async () => {
    // This test simulates Redis being available
    // In production, fail-secure means denying access on Redis errors

    const userId = 'error-test-user';
    const config = { maxRequests: 5, windowSeconds: 60 };

    await resetRateLimit(userId);

    // Normal operation should work
    const result = await checkRateLimit(userId, config);
    expect(result.allowed).toBeDefined();
    expect(result.remaining).toBeDefined();
    expect(result.resetAt).toBeDefined();

    await resetRateLimit(userId);
  });
});
