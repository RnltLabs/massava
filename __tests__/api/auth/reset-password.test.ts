/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unit Tests: Password Reset Request API
 * POST /api/auth/reset-password
 *
 * SECURITY TEST COVERAGE:
 * - CR-001: Rate limiting (5 attempts per 15 minutes)
 * - CR-004: Structured logging with correlation IDs
 * - CR-006: Correlation IDs in all error responses
 * - CR-007: Race condition prevention (delete existing tokens)
 * - CR-008: Email normalization with toLowerCase().trim()
 * - Email enumeration prevention
 * - Token generation (32 bytes / 256 bits)
 * - Token expiry (configurable via env)
 * - Error handling and validation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/auth/reset-password/route';
import { prisma } from '@/lib/prisma';
import * as emailSend from '@/lib/email/send';
import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as loggerModule from '@/lib/logger';

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email/send');
jest.mock('@/lib/auth/rate-limit');
jest.mock('@/lib/logger');

// Type-safe mocks
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSendPasswordResetEmail = emailSend.sendPasswordResetEmail as jest.MockedFunction<
  typeof emailSend.sendPasswordResetEmail
>;
const mockRateLimitByIP = rateLimitModule.rateLimitByIP as jest.MockedFunction<
  typeof rateLimitModule.rateLimitByIP
>;
const mockGenerateCorrelationId = loggerModule.generateCorrelationId as jest.MockedFunction<
  typeof loggerModule.generateCorrelationId
>;
const mockLogger = loggerModule.logger as jest.Mocked<typeof loggerModule.logger>;

describe('POST /api/auth/reset-password', () => {
  const testEmail = 'test@example.com';
  const testUserId = 'test-user-123';
  const testCorrelationId = 'corr-123-456';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockGenerateCorrelationId.mockReturnValue(testCorrelationId);
    mockRateLimitByIP.mockResolvedValue({
      limited: false,
      remaining: 4,
      resetAt: Date.now() + 900000,
      current: 1,
    });
    mockSendPasswordResetEmail.mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    // Mock logger methods
    mockLogger.warn = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();

    // Set default environment variables
    process.env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS = '1';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS;
    delete process.env.NEXTAUTH_URL;
  });

  /**
   * Helper function to create a mock NextRequest
   */
  function createMockRequest(body: unknown): NextRequest {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
      }),
    } as unknown as NextRequest;
  }

  describe('Rate Limiting (CR-001)', () => {
    it('should enforce rate limiting (5 attempts per 15 minutes)', async () => {
      mockRateLimitByIP.mockResolvedValueOnce({
        limited: true,
        remaining: 0,
        resetAt: Date.now() + 900000,
        current: 6,
      });

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many password reset attempts');
      expect(data.correlationId).toBe(testCorrelationId);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password reset rate limit exceeded',
        expect.objectContaining({
          action: 'PASSWORD_RESET_RATE_LIMIT',
          correlationId: testCorrelationId,
        })
      );
    });

    it('should call rateLimitByIP with correct configuration', async () => {
      const request = createMockRequest({ email: testEmail });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await POST(request);

      expect(mockRateLimitByIP).toHaveBeenCalledWith(request, {
        maxRequests: 5,
        windowSeconds: 900, // 15 minutes
      });
    });

    it('should allow requests under rate limit', async () => {
      mockRateLimitByIP.mockResolvedValueOnce({
        limited: false,
        remaining: 3,
        resetAt: Date.now() + 900000,
        current: 2,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email format', async () => {
      const request = createMockRequest({ email: 'invalid-email' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email address');
      expect(data.correlationId).toBe(testCorrelationId);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid password reset request',
        expect.objectContaining({
          action: 'PASSWORD_RESET_INVALID',
          correlationId: testCorrelationId,
        })
      );
    });

    it('should reject missing email', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should accept valid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Email Normalization (CR-008)', () => {
    it('should normalize email with toLowerCase()', async () => {
      const upperEmail = 'TEST@EXAMPLE.COM';
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: 'test@example.com',
        isActive: true,
      } as any);

      const request = createMockRequest({ email: upperEmail });
      await POST(request);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, email: true, isActive: true },
      });
    });

    it('should normalize email with trim()', async () => {
      const spacedEmail = '  test@example.com  ';
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        email: 'test@example.com',
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValueOnce({} as any);

      const request = createMockRequest({ email: spacedEmail });
      await POST(request);

      const findUniqueCall = mockPrisma.user.findUnique.mock.calls[mockPrisma.user.findUnique.mock.calls.length - 1];
      expect(findUniqueCall[0]).toEqual({
        where: { email: 'test@example.com' },
        select: { id: true, email: true, isActive: true },
      });
    });

    it('should normalize email with both toLowerCase() and trim()', async () => {
      const messyEmail = '  TEST@EXAMPLE.COM  ';
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        email: 'test@example.com',
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValueOnce({} as any);

      const request = createMockRequest({ email: messyEmail });
      await POST(request);

      // The user.findUnique should be called with normalized email
      const findUniqueCall = mockPrisma.user.findUnique.mock.calls[mockPrisma.user.findUnique.mock.calls.length - 1];
      expect(findUniqueCall[0]).toEqual({
        where: { email: 'test@example.com' },
        select: { id: true, email: true, isActive: true },
      });
    });
  });

  describe('User Existence Check (Email Enumeration Prevention)', () => {
    it('should return success even if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('If an account with that email exists');
      expect(data.correlationId).toBe(testCorrelationId);

      // Find the specific log call for user not found
      const logCalls = mockLogger.info.mock.calls;
      const userNotFoundLog = logCalls.find(call => call[1]?.action === 'PASSWORD_RESET_USER_NOT_FOUND');
      expect(userNotFoundLog).toBeDefined();
      expect(userNotFoundLog[0]).toBe('Password reset requested for non-existent or inactive user');
      expect(userNotFoundLog[1]).toEqual(
        expect.objectContaining({
          action: 'PASSWORD_RESET_USER_NOT_FOUND',
          correlationId: testCorrelationId,
          email: testEmail,
        })
      );
    });

    it('should not send email if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('should return success even if user is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: false,
      } as any);

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('Token Generation', () => {
    it('should generate token for active user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'token-id-123',
        token: 'generated-token',
        email: testEmail,
        expiresAt: new Date(),
        used: false,
      } as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          token: expect.any(String),
          email: testEmail,
          expiresAt: expect.any(Date),
          used: false,
        }),
      });

      // Verify token is 64 characters (32 bytes in hex)
      const createCall = mockPrisma.passwordResetToken.create.mock.calls[0][0];
      expect(createCall.data.token.length).toBe(64);
    });

    it('should use configurable expiry from environment variable', async () => {
      process.env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS = '2';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({} as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      const createCall = mockPrisma.passwordResetToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt;
      const now = new Date();
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThan(1.9);
      expect(hoursDiff).toBeLessThan(2.1);
    });

    it('should default to 1 hour expiry if not configured', async () => {
      delete process.env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({} as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      const createCall = mockPrisma.passwordResetToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt;
      const now = new Date();
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThan(0.9);
      expect(hoursDiff).toBeLessThan(1.1);
    });
  });

  describe('Race Condition Prevention (CR-007)', () => {
    it('should delete existing unused valid tokens before creating new one', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 2 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({} as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      // Verify deleteMany was called before create
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          email: testEmail,
          used: false,
          expiresAt: { gte: expect.any(Date) },
        },
      });

      // Verify order: deleteMany should be called before create
      const deleteManyCallOrder = mockPrisma.passwordResetToken.deleteMany.mock.invocationCallOrder[0];
      const createCallOrder = mockPrisma.passwordResetToken.create.mock.invocationCallOrder[0];
      expect(deleteManyCallOrder).toBeLessThan(createCallOrder);
    });

    it('should only delete unused and valid tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({} as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      const deleteCall = mockPrisma.passwordResetToken.deleteMany.mock.calls[0][0];
      expect(deleteCall.where.used).toBe(false);
      expect(deleteCall.where.expiresAt).toEqual({ gte: expect.any(Date) });
    });
  });

  describe('Email Sending', () => {
    it('should send password reset email to active user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        token: 'test-token-123',
      } as any);

      const request = createMockRequest({ email: testEmail, locale: 'de' });
      await POST(request);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        expect.stringContaining('http://localhost:3000/de/auth/reset-password/'),
        'de'
      );
    });

    it('should default to "de" locale if not provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        token: 'test-token-123',
      } as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        expect.any(String),
        'de'
      );
    });

    it('should use correct reset URL format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({} as any);

      const request = createMockRequest({ email: testEmail, locale: 'en' });
      await POST(request);

      // Verify the URL structure (token is generated randomly, so we can't predict it)
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        expect.stringMatching(/^http:\/\/localhost:3000\/en\/auth\/reset-password\/[a-f0-9]{64}$/),
        'en'
      );
    });

    it('should log error but still return success if email fails to send', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        token: 'test-token',
      } as any);
      mockSendPasswordResetEmail.mockResolvedValue({
        success: false,
        error: 'SMTP error',
      });

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send password reset email',
        expect.objectContaining({
          action: 'PASSWORD_RESET_EMAIL_FAILED',
          correlationId: testCorrelationId,
          email: testEmail,
          error: 'SMTP error',
        })
      );
    });

    it('should log success when email is sent', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        token: 'test-token',
      } as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password reset email sent',
        expect.objectContaining({
          action: 'PASSWORD_RESET_EMAIL_SENT',
          correlationId: testCorrelationId,
          email: testEmail,
        })
      );
    });
  });

  describe('Correlation IDs (CR-004, CR-006)', () => {
    it('should include correlation ID in all responses', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should include correlation ID in error responses', async () => {
      const request = createMockRequest({ email: 'invalid' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should include correlation ID in rate limit responses', async () => {
      mockRateLimitByIP.mockResolvedValueOnce({
        limited: true,
        remaining: 0,
        resetAt: Date.now() + 900000,
        current: 6,
      });

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should log correlation ID in all log statements', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        token: 'test-token',
      } as any);

      const request = createMockRequest({ email: testEmail });
      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ correlationId: testCorrelationId })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An error occurred processing your request');
      expect(data.correlationId).toBe(testCorrelationId);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Password reset request error',
        expect.objectContaining({
          action: 'PASSWORD_RESET_ERROR',
          correlationId: testCorrelationId,
          error: 'Database error',
        })
      );
    });

    it('should handle JSON parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Headers(),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should handle unknown errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue('Unknown error');

      const request = createMockRequest({ email: testEmail });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Password reset request error',
        expect.objectContaining({
          error: 'Unknown error',
        })
      );
    });
  });

  describe('Locale Handling', () => {
    it('should accept and use locale parameter', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        token: 'test-token',
      } as any);

      const request = createMockRequest({ email: testEmail, locale: 'en' });
      await POST(request);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        expect.stringContaining('/en/auth/reset-password/'),
        'en'
      );
    });

    it('should handle different locales correctly', async () => {
      const locales = ['de', 'en'];

      for (const locale of locales) {
        jest.clearAllMocks();
        mockPrisma.user.findUnique.mockResolvedValue({
          id: testUserId,
          email: testEmail,
          isActive: true,
        } as any);
        mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as any);
        mockPrisma.passwordResetToken.create.mockResolvedValue({
          token: 'test-token',
        } as any);

        const request = createMockRequest({ email: testEmail, locale });
        await POST(request);

        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
          testEmail,
          expect.any(String),
          locale
        );
      }
    });
  });

  describe('Integration Test', () => {
    it('should complete full password reset flow for valid user', async () => {
      const testToken = 'a'.repeat(64);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: testEmail,
        isActive: true,
      } as any);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 } as any);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      } as any);

      const request = createMockRequest({ email: testEmail, locale: 'de' });
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.correlationId).toBe(testCorrelationId);

      // Verify rate limiting was checked
      expect(mockRateLimitByIP).toHaveBeenCalled();

      // Verify user lookup
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testEmail },
        select: { id: true, email: true, isActive: true },
      });

      // Verify existing tokens were deleted
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalled();

      // Verify new token was created
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();

      // Verify email was sent
      expect(mockSendPasswordResetEmail).toHaveBeenCalled();

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password reset email sent',
        expect.any(Object)
      );
    });
  });
});
