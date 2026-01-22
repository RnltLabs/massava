/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Device Registration Integration Tests
 * Tests for POST /api/notifications/devices with token validation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/notifications/devices/route';

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    deviceToken: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/middleware/api-rate-limiter', () => ({
  withRateLimit: jest.fn((req, limits, session, handler) => handler()),
  NOTIFICATION_RATE_LIMITS: {
    listNotifications: { maxRequests: 100, windowMs: 60000 },
    registerDevice: { maxRequests: 10, windowMs: 60000 },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

describe('POST /api/notifications/devices - Token Validation', () => {
  const mockUserId = 'user-123';
  const mockSession = {
    user: {
      id: mockUserId,
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(mockSession as any);
  });

  // ============================================
  // Successful Registration Tests
  // ============================================

  describe('Valid token registration', () => {
    it('should accept valid FCM token for Android', async () => {
      const validFCMToken = 'c' + 'A'.repeat(151);

      (prisma.deviceToken.upsert as jest.MockedFunction<any>).mockResolvedValue({
        id: 'device-1',
        userId: mockUserId,
        token: validFCMToken,
        platform: 'ANDROID',
        isActive: true,
      });

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: validFCMToken,
          platform: 'ANDROID',
          deviceName: 'Pixel 8',
          deviceModel: 'Pixel 8 Pro',
          appVersion: '1.0.0',
          osVersion: '14',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.device).toBeDefined();
      expect(data.device.platform).toBe('ANDROID');
    });

    it('should accept valid APNS token for iOS', async () => {
      const validAPNSToken = 'a'.repeat(64);

      (prisma.deviceToken.upsert as jest.MockedFunction<any>).mockResolvedValue({
        id: 'device-2',
        userId: mockUserId,
        token: validAPNSToken,
        platform: 'IOS',
        isActive: true,
      });

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: validAPNSToken,
          platform: 'IOS',
          deviceName: 'iPhone 15',
          deviceModel: 'iPhone 15 Pro',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.device).toBeDefined();
    });

    it('should accept valid FCM token for iOS (fallback)', async () => {
      const validFCMToken = 'cPdK8zRxQ:APA91bH' + 'a'.repeat(135);

      (prisma.deviceToken.upsert as jest.MockedFunction<any>).mockResolvedValue({
        id: 'device-3',
        userId: mockUserId,
        token: validFCMToken,
        platform: 'IOS',
        isActive: true,
      });

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: validFCMToken,
          platform: 'IOS',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should accept valid Web Push URL', async () => {
      // URL must be at least 50 characters
      const validWebToken = 'https://fcm.googleapis.com/fcm/send/abc123def456ghi';

      (prisma.deviceToken.upsert as jest.MockedFunction<any>).mockResolvedValue({
        id: 'device-4',
        userId: mockUserId,
        token: validWebToken,
        platform: 'WEB',
        isActive: true,
      });

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: validWebToken,
          platform: 'WEB',
          deviceName: 'Chrome Browser',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should sanitize token with whitespace', async () => {
      const tokenWithSpaces = '  c' + 'A'.repeat(151) + '  ';
      const cleanToken = 'c' + 'A'.repeat(151);

      (prisma.deviceToken.upsert as jest.MockedFunction<any>).mockResolvedValue({
        id: 'device-5',
        userId: mockUserId,
        token: cleanToken,
        platform: 'ANDROID',
        isActive: true,
      });

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: tokenWithSpaces,
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Verify the token was sanitized before storage
      const upsertCall = (prisma.deviceToken.upsert as jest.MockedFunction<any>).mock.calls[0][0];
      expect(upsertCall.create.token).toBe(cleanToken);
    });

    it('should sanitize APNS token with iOS formatting', async () => {
      const iosFormattedToken = '<' + 'a'.repeat(64) + '>';
      const cleanToken = 'a'.repeat(64);

      (prisma.deviceToken.upsert as jest.MockedFunction<any>).mockResolvedValue({
        id: 'device-6',
        userId: mockUserId,
        token: cleanToken,
        platform: 'IOS',
        isActive: true,
      });

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: iosFormattedToken,
          platform: 'IOS',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // Token Validation Failure Tests (422)
  // ============================================

  describe('Invalid token format (422 errors)', () => {
    it('should reject token that is too short', async () => {
      const shortToken = 'abc123';

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: shortToken,
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
      expect(data.message).toContain('Token too short');
    });

    it('should reject token that is too long', async () => {
      const longToken = 'c' + 'A'.repeat(350);

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: longToken,
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
      expect(data.message).toContain('Token too long');
    });

    it('should reject token with invalid characters', async () => {
      const invalidToken = 'c' + 'A'.repeat(100) + '@#$%^&*()';

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: invalidToken,
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
      expect(data.message).toContain('Invalid token format');
    });

    it('should reject SQL injection attempt', async () => {
      const sqlInjection = "c' OR '1'='1" + 'A'.repeat(90);

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: sqlInjection,
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
      // Will fail on invalid character format before suspicious content check
      expect(['Invalid token format', 'Suspicious token content']).toContain(data.message);
    });

    it('should reject XSS attempt', async () => {
      const xssAttempt = '<script>alert(1)</script>' + 'A'.repeat(80);

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: xssAttempt,
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
    });

    it('should reject JavaScript protocol injection', async () => {
      const jsInjection = 'javascript:alert(1)' + 'A'.repeat(85);

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: jsInjection,
          platform: 'WEB',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
    });

    it('should reject template literal injection', async () => {
      const templateInjection = 'c${alert(1)}' + 'A'.repeat(90);

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: templateInjection,
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
      // Will fail on invalid character format (braces/parens) before suspicious content check
      expect(data.message).toBeDefined();
    });

    it('should reject APNS token with invalid length for iOS', async () => {
      const invalidAPNSToken = 'a'.repeat(32); // Too short

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: invalidAPNSToken,
          platform: 'IOS',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
      expect(data.message).toContain('Invalid iOS token');
    });

    it('should reject malformed Web Push URL', async () => {
      const malformedUrl = 'https://invalid url with spaces.com/endpoint';

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: malformedUrl,
          platform: 'WEB',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid device token');
    });
  });

  // ============================================
  // General Validation Errors (400)
  // ============================================

  describe('General validation errors (400 or 422)', () => {
    it('should reject missing token', async () => {
      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Missing token will be caught by Zod and treated as token error (422)
      expect([400, 422]).toContain(response.status);
      expect(['Invalid request', 'Invalid device token']).toContain(data.error);
    });

    it('should reject missing platform', async () => {
      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: 'c' + 'A'.repeat(151),
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should reject invalid platform value', async () => {
      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: 'c' + 'A'.repeat(151),
          platform: 'INVALID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should reject empty token', async () => {
      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: '',
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Empty token will be caught by Zod min(1) and treated as token error (422)
      expect([400, 422]).toContain(response.status);
      expect(['Invalid request', 'Invalid device token']).toContain(data.error);
    });
  });

  // ============================================
  // Authentication Tests
  // ============================================

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: 'c' + 'A'.repeat(151),
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject request without user ID', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: {},
      } as any);

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: 'c' + 'A'.repeat(151),
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================

  describe('Edge cases', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.deviceToken.upsert as jest.MockedFunction<any>).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({
          token: 'c' + 'A'.repeat(151),
          platform: 'ANDROID',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/notifications/devices', {
        method: 'POST',
        body: 'invalid json{',
      });

      const response = await POST(request);
      expect(response.status).toBe(500); // JSON parse error
    });
  });
});
