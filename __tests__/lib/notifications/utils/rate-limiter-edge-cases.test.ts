/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Rate Limiter Edge Cases Tests
 * Tests for branch coverage of critical edge cases
 */

import { isRateLimited, resetRateLimits } from '@/lib/notifications/utils/rate-limiter';
import { Redis } from '@upstash/redis';

// ============================================
// Mocks
// ============================================

jest.mock('@upstash/redis', () => {
  const mockRedis = {
    incr: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  };

  return {
    Redis: jest.fn(() => mockRedis),
  };
});

// ============================================
// Helper to get mock Redis instance
// ============================================

function getMockRedis() {
  // Redis is instantiated lazily on first call
  return new Redis({
    url: 'mock-url',
    token: 'mock-token',
  });
}

// ============================================
// Edge Case Tests
// ============================================

describe('Rate Limiter - Edge Cases', () => {
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis = getMockRedis();
    (mockRedis.incr as jest.Mock).mockResolvedValue(1);
    (mockRedis.expire as jest.Mock).mockResolvedValue(1);
    (mockRedis.keys as jest.Mock).mockResolvedValue([]);
    (mockRedis.del as jest.Mock).mockResolvedValue(0);
  });

  describe('isRateLimited() - Redis Connection Failure (Fail Open)', () => {
    it('should return false (allow) when Redis incr fails', async () => {
      (mockRedis.incr as jest.Mock).mockRejectedValue(new Error('Redis connection timeout'));

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false); // Fail open - allow the notification
    });

    it('should return false (allow) when Redis expire fails', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.expire as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false); // Fail open - allow the notification
    });

    it('should return false (allow) when Redis is completely unavailable', async () => {
      (mockRedis.incr as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false); // Fail open - allow the notification
    });

    it('should return false (allow) when Redis throws unexpected error', async () => {
      (mockRedis.incr as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false); // Fail open - allow the notification
    });

    it('should return false (allow) when Redis network times out', async () => {
      (mockRedis.incr as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false); // Fail open - allow the notification
    });
  });

  describe('isRateLimited() - First Request in Window (TTL Setting)', () => {
    it('should set TTL when counter is 1 (first request)', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(1); // First per-user request
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(1); // First per-type request

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);

      // Should set TTL for both keys
      expect(mockRedis.expire).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123',
        3600 // 1 hour
      );
      expect(mockRedis.expire).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123:type:BOOKING_CONFIRMED',
        3600 // 1 hour
      );
    });

    it('should not set TTL when counter is greater than 1', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50); // Not first request
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(5); // Not first request

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);

      // Should NOT set TTL since not first request
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should set TTL only for first per-user request', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(1); // First per-user request
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(3); // Not first per-type

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);

      // Should only set TTL for user key
      expect(mockRedis.expire).toHaveBeenCalledTimes(1);
      expect(mockRedis.expire).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123',
        3600
      );
    });

    it('should set TTL only for first per-type request', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50); // Not first per-user
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(1); // First per-type request

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);

      // Should only set TTL for type key
      expect(mockRedis.expire).toHaveBeenCalledTimes(1);
      expect(mockRedis.expire).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123:type:BOOKING_CONFIRMED',
        3600
      );
    });
  });

  describe('isRateLimited() - URGENT Priority Bypass', () => {
    it('should bypass rate limiting for URGENT priority', async () => {
      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'URGENT');

      expect(result).toBe(false);

      // Should not even check Redis for URGENT
      expect(mockRedis.incr).not.toHaveBeenCalled();
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should check rate limits for HIGH priority', async () => {
      (mockRedis.incr as jest.Mock)
        .mockResolvedValueOnce(50) // Per-user count
        .mockResolvedValueOnce(5); // Per-type count

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'HIGH');

      expect(result).toBe(false);

      // Should check Redis for HIGH
      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('should check rate limits for NORMAL priority', async () => {
      (mockRedis.incr as jest.Mock)
        .mockResolvedValueOnce(50) // Per-user count
        .mockResolvedValueOnce(5); // Per-type count

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);

      // Should check Redis for NORMAL
      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('should check rate limits for LOW priority', async () => {
      (mockRedis.incr as jest.Mock)
        .mockResolvedValueOnce(50) // Per-user count
        .mockResolvedValueOnce(5); // Per-type count

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'LOW');

      expect(result).toBe(false);

      // Should check Redis for LOW
      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('should bypass even when user is at limit', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(150); // Way over limit

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'URGENT');

      expect(result).toBe(false); // Still bypass for URGENT

      // Should not check Redis
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });
  });

  describe('isRateLimited() - Per-User Limit', () => {
    it('should return true when per-user limit exceeded (101 notifications)', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(101); // Over limit

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(true);

      // Should not check per-type limit if per-user already exceeded
      expect(mockRedis.incr).toHaveBeenCalledTimes(1);
    });

    it('should return true when per-user limit exactly at 101', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(101);

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(true);
    });

    it('should return false when per-user limit at 100 (not exceeded)', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(100); // At limit but not over
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(5); // Per-type OK

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);
    });

    it('should return false when per-user limit at 99', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(99);
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(5);

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);
    });

    it('should use correct Redis key for per-user limit', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(50);

      await isRateLimited('user-456', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:notifications:user:user-456');
    });
  });

  describe('isRateLimited() - Per-Type Limit', () => {
    it('should return true when per-type limit exceeded (11 notifications)', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50); // Per-user OK
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(11); // Per-type over

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(true);
    });

    it('should return true when per-type limit exactly at 11', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50);
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(11);

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(true);
    });

    it('should return false when per-type limit at 10 (not exceeded)', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50);
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(10); // At limit but not over

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);
    });

    it('should return false when per-type limit at 9', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50);
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(9);

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);
    });

    it('should use correct Redis key for per-type limit', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(5);

      await isRateLimited('user-123', 'BOOKING_REMINDER', 'NORMAL');

      expect(mockRedis.incr).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123:type:BOOKING_REMINDER'
      );
    });

    it('should handle different notification types independently', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(5);

      await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');
      await isRateLimited('user-123', 'BOOKING_CANCELLED', 'NORMAL');

      expect(mockRedis.incr).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123:type:BOOKING_CONFIRMED'
      );
      expect(mockRedis.incr).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123:type:BOOKING_CANCELLED'
      );
    });
  });

  describe('isRateLimited() - Combined Scenarios', () => {
    it('should pass when both limits are within bounds', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50); // Per-user OK
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(5); // Per-type OK

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(false);
    });

    it('should fail when only per-user limit exceeded', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(101); // Per-user over

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(true);
    });

    it('should fail when only per-type limit exceeded', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(50); // Per-user OK
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(11); // Per-type over

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(true);
    });

    it('should fail when both limits exceeded', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValueOnce(101); // Per-user over

      const result = await isRateLimited('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(result).toBe(true);
    });
  });

  describe('resetRateLimits()', () => {
    it('should delete all rate limit keys for a user', async () => {
      const keys = [
        'ratelimit:notifications:user:user-123',
        'ratelimit:notifications:user:user-123:type:BOOKING_CONFIRMED',
        'ratelimit:notifications:user:user-123:type:BOOKING_CANCELLED',
      ];

      (mockRedis.keys as jest.Mock).mockResolvedValue(keys);
      (mockRedis.del as jest.Mock).mockResolvedValue(3);

      await resetRateLimits('user-123');

      expect(mockRedis.keys).toHaveBeenCalledWith('ratelimit:notifications:user:user-123*');
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });

    it('should not crash when no keys found', async () => {
      (mockRedis.keys as jest.Mock).mockResolvedValue([]);

      await expect(resetRateLimits('user-123')).resolves.not.toThrow();

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should not crash when Redis keys fails', async () => {
      (mockRedis.keys as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

      await expect(resetRateLimits('user-123')).resolves.not.toThrow();
    });

    it('should not crash when Redis del fails', async () => {
      (mockRedis.keys as jest.Mock).mockResolvedValue(['key-1', 'key-2']);
      (mockRedis.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(resetRateLimits('user-123')).resolves.not.toThrow();
    });

    it('should handle pattern matching for specific user', async () => {
      await resetRateLimits('user-456');

      expect(mockRedis.keys).toHaveBeenCalledWith('ratelimit:notifications:user:user-456*');
    });
  });

  describe('Edge Cases - Key Generation', () => {
    it('should handle user IDs with special characters', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(5);

      await isRateLimited('user-with-dash-123', 'BOOKING_CONFIRMED', 'NORMAL');

      expect(mockRedis.incr).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-with-dash-123'
      );
    });

    it('should handle notification types with underscores', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(5);

      await isRateLimited('user-123', 'BOOKING_CANCELLED_BY_STUDIO', 'NORMAL');

      expect(mockRedis.incr).toHaveBeenCalledWith(
        'ratelimit:notifications:user:user-123:type:BOOKING_CANCELLED_BY_STUDIO'
      );
    });

    it('should handle very long user IDs', async () => {
      const longUserId = 'user-' + 'a'.repeat(100);
      (mockRedis.incr as jest.Mock).mockResolvedValue(5);

      await isRateLimited(longUserId, 'BOOKING_CONFIRMED', 'NORMAL');

      expect(mockRedis.incr).toHaveBeenCalledWith(
        `ratelimit:notifications:user:${longUserId}`
      );
    });
  });
});
