/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Rate Limiting Integration Tests
 *
 * Tests rate limiting behavior across notification API routes.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET as getNotifications, POST as createNotification } from '@/app/api/notifications/route';
import { GET as getNotificationById } from '@/app/api/notifications/[id]/route';
import { GET as getDevices, POST as registerDevice } from '@/app/api/notifications/devices/route';
import { DELETE as deleteDevice } from '@/app/api/notifications/devices/[id]/route';
import { GET as getUnreadCount } from '@/app/api/notifications/unread-count/route';
import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/notifications/notification-service', () => ({
  notificationService: {
    getUserNotifications: jest.fn().mockResolvedValue({ notifications: [], cursor: null }),
    create: jest.fn().mockResolvedValue({ ok: true, value: { id: 'test-id', status: 'PENDING' } }),
    getUnreadCount: jest.fn().mockResolvedValue(5),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findUnique: jest.fn(),
    },
    deviceToken: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('API Rate Limiting Integration', () => {
  let mockRedis: jest.Mocked<Redis>;
  const mockAuth = require('@/auth').auth;

  beforeEach(() => {
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

    // Setup default auth session
    mockAuth.mockResolvedValue({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        primaryRole: 'CUSTOMER',
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  describe('GET /api/notifications', () => {
    it('should apply rate limiting', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('http://localhost:3000/api/notifications');
      const response = await getNotifications(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    });

    it('should block when rate limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(61); // Over limit of 60
      mockRedis.ttl.mockResolvedValue(45);

      const request = createMockRequest('http://localhost:3000/api/notifications');
      const response = await getNotifications(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('45');

      const json = await response.json();
      expect(json.error).toBe('RATE_LIMITED');
    });

    it('should require authentication', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/notifications');
      const response = await getNotifications(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/notifications', () => {
    beforeEach(() => {
      // Admin user for create notifications
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-user-123',
          email: 'admin@example.com',
          primaryRole: 'SUPER_ADMIN',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });
    });

    it('should apply strict rate limiting (10 req/min)', async () => {
      mockRedis.incr.mockResolvedValue(5);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: {
          userId: 'user-123',
          type: 'WELCOME',
          title: 'Welcome',
          body: 'Welcome to the platform',
        },
      });

      const response = await createNotification(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
    });

    it('should block when strict limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(11); // Over limit of 10
      mockRedis.ttl.mockResolvedValue(30);

      const request = createMockRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: {
          userId: 'user-123',
          type: 'WELCOME',
        },
      });

      const response = await createNotification(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('30');
    });

    it('should check both IP and user limits', async () => {
      mockRedis.incr.mockResolvedValueOnce(5).mockResolvedValueOnce(8); // IP then user
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' },
        body: {
          userId: 'user-123',
          type: 'WELCOME',
        },
      });

      await createNotification(request);

      expect(mockRedis.incr).toHaveBeenCalledTimes(2);
      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:api:ip:')
      );
      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:api:user:')
      );
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should apply rate limiting', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notification.findUnique.mockResolvedValue({
        id: 'notif-123',
        userId: 'test-user-123',
        type: 'WELCOME',
        title: 'Welcome',
        body: 'Welcome message',
      });

      mockRedis.incr.mockResolvedValue(10);
      mockRedis.ttl.mockResolvedValue(50);

      const request = createMockRequest('http://localhost:3000/api/notifications/notif-123');
      const params = Promise.resolve({ id: 'notif-123' });

      const response = await getNotificationById(request, { params });

      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('50');
    });
  });

  describe('POST /api/notifications/devices', () => {
    it('should apply device registration rate limiting (5 req/min)', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.deviceToken.upsert.mockResolvedValue({
        id: 'device-123',
        token: 'test-token',
        platform: 'WEB',
        userId: 'test-user-123',
      });

      mockRedis.incr.mockResolvedValue(2);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('http://localhost:3000/api/notifications/devices', {
        method: 'POST',
        body: {
          token: 'test-fcm-token-123',
          platform: 'WEB',
        },
      });

      const response = await registerDevice(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('3');
    });

    it('should block when device registration limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(6); // Over limit of 5
      mockRedis.ttl.mockResolvedValue(40);

      const request = createMockRequest('http://localhost:3000/api/notifications/devices', {
        method: 'POST',
        body: {
          token: 'test-token',
          platform: 'WEB',
        },
      });

      const response = await registerDevice(request);

      expect(response.status).toBe(429);
    });

    it('should check both IP and user limits for device registration', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.deviceToken.upsert.mockResolvedValue({
        id: 'device-123',
        token: 'test-token',
        platform: 'WEB',
      });

      mockRedis.incr.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
      mockRedis.ttl.mockResolvedValue(60);

      const request = createMockRequest('http://localhost:3000/api/notifications/devices', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.1' },
        body: {
          token: 'test-token',
          platform: 'WEB',
        },
      });

      await registerDevice(request);

      expect(mockRedis.incr).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE /api/notifications/devices/:id', () => {
    it('should apply rate limiting', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.deviceToken.findFirst.mockResolvedValue({
        id: 'device-123',
        userId: 'test-user-123',
        token: 'test-token',
      });

      mockRedis.incr.mockResolvedValue(3);
      mockRedis.ttl.mockResolvedValue(55);

      const request = createMockRequest('http://localhost:3000/api/notifications/devices/device-123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: 'device-123' });

      const response = await deleteDevice(request, { params });

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('7');
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should apply high rate limiting (120 req/min for polling)', async () => {
      mockRedis.incr.mockResolvedValue(50);
      mockRedis.ttl.mockResolvedValue(30);

      const request = createMockRequest('http://localhost:3000/api/notifications/unread-count');
      const response = await getUnreadCount(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('120');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('70');
    });

    it('should block when polling limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(121); // Over limit of 120
      mockRedis.ttl.mockResolvedValue(25);

      const request = createMockRequest('http://localhost:3000/api/notifications/unread-count');
      const response = await getUnreadCount(request);

      expect(response.status).toBe(429);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include all required rate limit headers', async () => {
      mockRedis.incr.mockResolvedValue(15);
      mockRedis.ttl.mockResolvedValue(45);

      const request = createMockRequest('http://localhost:3000/api/notifications/unread-count');
      const response = await getUnreadCount(request);

      expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });

    it('should include Retry-After header when rate limited', async () => {
      mockRedis.incr.mockResolvedValue(121);
      mockRedis.ttl.mockResolvedValue(35);

      const request = createMockRequest('http://localhost:3000/api/notifications/unread-count');
      const response = await getUnreadCount(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('35');
    });
  });

  describe('Fail-Open Behavior', () => {
    it('should allow requests when Redis is unavailable', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection failed'));

      const request = createMockRequest('http://localhost:3000/api/notifications/unread-count');
      const response = await getUnreadCount(request);

      expect(response.status).toBe(200); // Request succeeds despite Redis error
    });
  });

  describe('IP Address Extraction', () => {
    it('should use x-forwarded-for header for IP', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          primaryRole: 'SUPER_ADMIN',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
        body: {
          userId: 'user-123',
          type: 'WELCOME',
        },
      });

      await createNotification(request);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(':198.51.100.1')
      );
    });

    it('should use cf-connecting-ip header (Cloudflare)', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          primaryRole: 'SUPER_ADMIN',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'cf-connecting-ip': '203.0.113.42' },
        body: {
          userId: 'user-123',
          type: 'WELCOME',
        },
      });

      await createNotification(request);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(':203.0.113.42')
      );
    });
  });
});

/**
 * Helper to create mock Next.js request
 */
function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): NextRequest {
  const headers = new Headers(options.headers || {});
  const urlObj = new URL(url);

  const request = {
    nextUrl: {
      pathname: urlObj.pathname,
      href: url,
      searchParams: urlObj.searchParams,
    },
    headers,
    method: options.method || 'GET',
    url,
    ip: undefined,
    json: async () => options.body || {},
  } as any;

  return request as NextRequest;
}
