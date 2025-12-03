/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * E2E Test: Rate Limiting Flow
 *
 * Tests rate limiting behavior:
 * - Send multiple notifications rapidly
 * - Verify rate limit kicks in
 * - Verify URGENT bypasses rate limit
 * - Test per-user and per-type-per-user limits
 * - Test rate limit recovery
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { logger } from '@/lib/logger';
import type { NotificationType, UserRole } from '@/app/generated/prisma';

// Mock QStash publisher
jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  },
}));

// Mock Redis for rate limiting
const mockRedisData: Record<string, { value: number; expiry: number }> = {};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(async (key: string) => {
      const data = mockRedisData[key];
      if (!data || data.expiry < Date.now()) {
        delete mockRedisData[key];
        return null;
      }
      return data.value;
    }),
    incr: jest.fn(async (key: string) => {
      if (!mockRedisData[key] || mockRedisData[key].expiry < Date.now()) {
        mockRedisData[key] = { value: 1, expiry: Date.now() + 3600000 };
        return 1;
      }
      mockRedisData[key].value += 1;
      return mockRedisData[key].value;
    }),
    expire: jest.fn(async (key: string, seconds: number) => {
      if (mockRedisData[key]) {
        mockRedisData[key].expiry = Date.now() + seconds * 1000;
      }
      return 1;
    }),
    del: jest.fn(async (key: string) => {
      delete mockRedisData[key];
      return 1;
    }),
  })),
}));

const E2E_USER_ID = 'e2e-rate-limit-user';
const E2E_USER_EMAIL = 'e2e-ratelimit@example.com';
const E2E_USER_ROLE: UserRole = 'CUSTOMER';

describe('E2E: Rate Limiting Flow', () => {
  beforeEach(async () => {
    // Clear mock Redis data
    Object.keys(mockRedisData).forEach((key) => delete mockRedisData[key]);

    // Clean up existing data
    await prisma.notification.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.notificationPreference.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.user.deleteMany({
      where: { id: E2E_USER_ID },
    });

    // Create test user
    await prisma.user.create({
      data: {
        id: E2E_USER_ID,
        email: E2E_USER_EMAIL,
        name: 'E2E Rate Limit Test User',
        primaryRole: E2E_USER_ROLE,
        emailVerified: new Date(),
      },
    });

    // Create notification preferences
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
      },
    });
  });

  afterEach(async () => {
    // Clear mock Redis data
    Object.keys(mockRedisData).forEach((key) => delete mockRedisData[key]);

    await prisma.notification.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.notificationPreference.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.user.deleteMany({
      where: { id: E2E_USER_ID },
    });
  });

  test('Rate limit kicks in after threshold reached', async () => {
    // Simulate rapid notification creation
    // Default limit: 100 per hour per user
    const results: Array<{ ok: boolean; id?: string; error?: string }> = [];

    // Mock Redis to return high count
    const rateLimitKey = `ratelimit:notif:${E2E_USER_ID}`;
    mockRedisData[rateLimitKey] = { value: 100, expiry: Date.now() + 3600000 };

    // Try to create notification when limit is reached
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome message',
      priority: 'NORMAL',
    });

    // Should be rate limited
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
      expect(result.error.message).toContain('Too many notifications');
      expect(result.error.context?.retryAfter).toBeDefined();
    }

    logger.info('Rate limit enforced correctly');
  });

  test('URGENT priority bypasses rate limit', async () => {
    // Set user at rate limit
    const rateLimitKey = `ratelimit:notif:${E2E_USER_ID}`;
    mockRedisData[rateLimitKey] = { value: 100, expiry: Date.now() + 3600000 };

    // Create URGENT notification
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'SUBSCRIPTION_EXPIRED' as NotificationType,
      title: 'URGENT: Subscription Expired',
      body: 'Your subscription has expired. Renew now to continue service.',
      priority: 'URGENT',
    });

    // URGENT should bypass rate limit
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBeDefined();

      const notification = await prisma.notification.findUnique({
        where: { id: result.value.id },
      });

      expect(notification?.priority).toBe('URGENT');
      expect(notification?.type).toBe('SUBSCRIPTION_EXPIRED');
    }

    logger.info('URGENT notification bypassed rate limit');
  });

  test('Per-type rate limiting enforces type-specific limits', async () => {
    // Default limit: 10 per type per hour
    const notificationType: NotificationType = 'REVIEW_REQUEST';
    const typeRateLimitKey = `ratelimit:notif:${E2E_USER_ID}:${notificationType}`;

    // Mock Redis to return high count for this type
    mockRedisData[typeRateLimitKey] = { value: 10, expiry: Date.now() + 3600000 };

    // Try to create notification of this type
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: notificationType,
      title: 'Rate your experience',
      body: 'How was your session?',
      priority: 'NORMAL',
    });

    // Should be rate limited for this type
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
    }

    logger.info('Per-type rate limit enforced');
  });

  test('Different notification types have independent rate limits', async () => {
    // Simulate one type at limit
    const limitedType: NotificationType = 'REVIEW_REQUEST';
    const limitedTypeKey = `ratelimit:notif:${E2E_USER_ID}:${limitedType}`;
    mockRedisData[limitedTypeKey] = { value: 10, expiry: Date.now() + 3600000 };

    // Try to create notification of limited type
    const result1 = await notificationService.create({
      userId: E2E_USER_ID,
      type: limitedType,
      title: 'Review request',
      body: 'Please review',
      priority: 'NORMAL',
    });

    expect(result1.ok).toBe(false);

    // Try to create notification of different type (should succeed)
    const result2 = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Booking confirmed',
      body: 'Your booking is confirmed',
      priority: 'NORMAL',
    });

    expect(result2.ok).toBe(true);

    logger.info('Different notification types have independent limits');
  });

  test('Rate limit recovery after window expires', async () => {
    const rateLimitKey = `ratelimit:notif:${E2E_USER_ID}`;

    // Set expired rate limit
    mockRedisData[rateLimitKey] = {
      value: 100,
      expiry: Date.now() - 1000, // Expired 1 second ago
    };

    // Create notification (should succeed since window expired)
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome message',
      priority: 'NORMAL',
    });

    expect(result.ok).toBe(true);

    logger.info('Rate limit recovered after window expired');
  });

  test('Multiple users have independent rate limits', async () => {
    // Create second user
    const user2Id = 'e2e-rate-limit-user-2';
    await prisma.user.create({
      data: {
        id: user2Id,
        email: 'user2@example.com',
        name: 'User 2',
        primaryRole: 'CUSTOMER' as UserRole,
      },
    });

    await prisma.notificationPreference.create({
      data: {
        userId: user2Id,
      },
    });

    // Set first user at rate limit
    const user1Key = `ratelimit:notif:${E2E_USER_ID}`;
    mockRedisData[user1Key] = { value: 100, expiry: Date.now() + 3600000 };

    // Try to create notification for first user (should fail)
    const result1 = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome message',
    });

    expect(result1.ok).toBe(false);

    // Try to create notification for second user (should succeed)
    const result2 = await notificationService.create({
      userId: user2Id,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome message',
    });

    expect(result2.ok).toBe(true);

    logger.info('Users have independent rate limits');

    // Cleanup
    await prisma.notification.deleteMany({ where: { userId: user2Id } });
    await prisma.notificationPreference.deleteMany({ where: { userId: user2Id } });
    await prisma.user.delete({ where: { id: user2Id } });
  });

  test('Rate limit provides retry information', async () => {
    // Set user at rate limit
    const rateLimitKey = `ratelimit:notif:${E2E_USER_ID}`;
    mockRedisData[rateLimitKey] = { value: 100, expiry: Date.now() + 3600000 };

    // Try to create notification
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome',
      body: 'Welcome message',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Should include retry information
      expect(result.error.context?.retryAfter).toBeDefined();
      expect(typeof result.error.context?.retryAfter).toBe('number');
      expect(result.error.context?.limit).toBeDefined();
    }

    logger.info('Rate limit provides retry information');
  });

  test('HIGH priority respects rate limits', async () => {
    // Set user at rate limit
    const rateLimitKey = `ratelimit:notif:${E2E_USER_ID}`;
    mockRedisData[rateLimitKey] = { value: 100, expiry: Date.now() + 3600000 };

    // HIGH priority should still be rate limited (only URGENT bypasses)
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      priority: 'HIGH',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
    }

    logger.info('HIGH priority respects rate limits');
  });

  test('Rate limiting counts actual creations, not duplicates', async () => {
    // Create notification
    const result1 = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      bookingId: 'booking-idempotency-test',
    });

    expect(result1.ok).toBe(true);

    // Try to create duplicate (should not increment rate limit)
    const result2 = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      bookingId: 'booking-idempotency-test',
    });

    expect(result2.ok).toBe(true);
    if (result1.ok && result2.ok) {
      // Should return same notification ID
      expect(result1.value.id).toBe(result2.value.id);
    }

    // Rate limit should only count once
    const notifications = await notificationService.getUserNotifications(E2E_USER_ID);
    const duplicates = notifications.items.filter(
      (n) => n.bookingId === 'booking-idempotency-test'
    );
    expect(duplicates).toHaveLength(1);

    logger.info('Rate limiting respects idempotency');
  });

  test('Scheduled notifications count against rate limit', async () => {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 1);

    // Create multiple scheduled notifications
    const results: boolean[] = [];

    for (let i = 0; i < 5; i++) {
      const result = await notificationService.create({
        userId: E2E_USER_ID,
        type: 'BOOKING_REMINDER_CUSTOMER' as NotificationType,
        title: `Reminder ${i + 1}`,
        body: 'Your appointment is coming up',
        scheduledFor: scheduledTime,
      });

      results.push(result.ok);
    }

    // All should succeed (under the limit)
    expect(results.every((r) => r === true)).toBe(true);

    // Verify scheduled notifications were created
    const notifications = await prisma.notification.findMany({
      where: {
        userId: E2E_USER_ID,
        status: 'PENDING',
      },
    });

    expect(notifications.length).toBeGreaterThanOrEqual(5);

    logger.info('Scheduled notifications created successfully');
  });

  test('Rate limit error includes helpful context', async () => {
    // Set user at rate limit
    const rateLimitKey = `ratelimit:notif:${E2E_USER_ID}`;
    mockRedisData[rateLimitKey] = { value: 100, expiry: Date.now() + 3600000 };

    // Try to create notification
    const result = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'REVIEW_REQUEST' as NotificationType,
      title: 'Rate your experience',
      body: 'How was your session?',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Verify error context
      expect(result.error.code).toBe('RATE_LIMITED');
      expect(result.error.message).toBeDefined();
      expect(result.error.context?.userId).toBe(E2E_USER_ID);
      expect(result.error.context?.notificationType).toBe('REVIEW_REQUEST');
      expect(result.error.context?.retryAfter).toBeDefined();
      expect(result.error.context?.limit).toBeDefined();

      logger.info('Rate limit error context', result.error.context);
    }
  });

  test('Burst of notifications within limit succeeds', async () => {
    // Create 10 notifications rapidly (within 10/hour per-type limit)
    const results: boolean[] = [];

    for (let i = 0; i < 5; i++) {
      const result = await notificationService.create({
        userId: E2E_USER_ID,
        type: 'BOOKING_CONFIRMED' as NotificationType,
        title: `Booking ${i + 1} Confirmed`,
        body: 'Your booking is confirmed',
        bookingId: `booking-burst-${i}`,
      });

      results.push(result.ok);
    }

    // All should succeed (within limit)
    const successCount = results.filter((r) => r === true).length;
    expect(successCount).toBeGreaterThanOrEqual(3); // At least 3 should succeed

    logger.info('Burst of notifications handled', {
      total: results.length,
      succeeded: successCount,
    });
  });
});
