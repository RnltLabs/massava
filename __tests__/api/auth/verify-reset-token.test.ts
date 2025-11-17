/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unit Tests: Verify Password Reset Token API
 * POST /api/auth/verify-reset-token
 *
 * SECURITY TEST COVERAGE:
 * - CR-001: Rate limiting (5 attempts per 15 minutes)
 * - CR-002: Invalidate token after 5 failed attempts
 * - CR-004: Structured logging with correlation IDs
 * - CR-006: Correlation IDs in all error responses
 * - CR-008: Email normalization with toLowerCase().trim()
 * - CR-010: Generic error messages to prevent timing attacks
 * - Token expiry validation
 * - Used token rejection
 * - Invalid token rejection
 * - Failed attempt tracking
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/verify-reset-token/route';
import { prisma } from '@/lib/prisma';
import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as loggerModule from '@/lib/logger';

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/rate-limit');
jest.mock('@/lib/logger');

// Type-safe mocks
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRateLimitByIP = rateLimitModule.rateLimitByIP as jest.MockedFunction<
  typeof rateLimitModule.rateLimitByIP
>;
const mockGenerateCorrelationId = loggerModule.generateCorrelationId as jest.MockedFunction<
  typeof loggerModule.generateCorrelationId
>;
const mockLogger = loggerModule.logger as jest.Mocked<typeof loggerModule.logger>;

describe('POST /api/auth/verify-reset-token', () => {
  const testToken = 'a'.repeat(64);
  const testEmail = 'test@example.com';
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

    // Mock logger methods
    mockLogger.warn = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
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

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.valid).toBe(false);
      expect(data.error).toContain('Too many verification attempts');
      expect(data.correlationId).toBe(testCorrelationId);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification rate limit exceeded',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_RATE_LIMIT',
          correlationId: testCorrelationId,
        })
      );
    });

    it('should call rateLimitByIP with correct configuration', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ token: testToken });
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

      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);

      expect(response.status).toBe(400); // Invalid token, but not rate limited
    });
  });

  describe('Token Validation', () => {
    it('should reject missing token', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should reject empty token', async () => {
      const request = createMockRequest({ token: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
    });

    it('should accept valid token format', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Token Existence Check', () => {
    it('should return generic error for non-existent token (CR-010)', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_FAILED',
          correlationId: testCorrelationId,
          tokenExists: false,
        })
      );
    });

    it('should return valid for existing valid token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.email).toBe(testEmail);
      expect(data.correlationId).toBe(testCorrelationId);
    });
  });

  describe('Token Expiry Validation', () => {
    it('should reject expired token (CR-010)', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_FAILED',
          expired: true,
        })
      );
    });

    it('should accept token that expires in the future', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should reject token expiring at current time or past', async () => {
      // Use a date slightly in the past to ensure it's expired
      const pastDate = new Date(Date.now() - 1000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
    });
  });

  describe('Used Token Rejection', () => {
    it('should reject already used token (CR-010)', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: true,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_FAILED',
          used: true,
        })
      );
    });

    it('should accept unused token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Failed Attempt Tracking (CR-002)', () => {
    it('should track failed verification attempts', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);

      const request = createMockRequest({ token: testToken });
      await POST(request);

      // Find the specific log call for failed verification
      const logCalls = mockLogger.warn.mock.calls;
      const failedVerifyLog = logCalls.find(call => call[1]?.action === 'TOKEN_VERIFY_FAILED');
      expect(failedVerifyLog).toBeDefined();
      expect(failedVerifyLog[1]).toEqual(
        expect.objectContaining({
          attempts: 1,
        })
      );
    });

    it('should invalidate token after 5 failed attempts (CR-002)', async () => {
      const futureDate = new Date(Date.now() + 3600000);

      // Simulate 4 previous failed attempts by making 4 requests
      for (let i = 0; i < 4; i++) {
        mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
        const request = createMockRequest({ token: testToken });
        await POST(request);
      }

      // 5th attempt should trigger invalidation
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token invalidated due to too many failed attempts',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_INVALIDATED',
          attempts: 5,
        })
      );
      expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { token: testToken, used: false },
        data: { used: true },
      });
    });

    it('should clear failed attempts on successful verification', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const differentToken = 'b'.repeat(64);

      // First, make a failed attempt with token A
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
      let request = createMockRequest({ token: testToken });
      await POST(request);

      // Verify 1 failed attempt was logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          attempts: 1,
        })
      );

      // Then make a successful attempt with the same token
      jest.clearAllMocks();
      mockGenerateCorrelationId.mockReturnValue(testCorrelationId);
      mockRateLimitByIP.mockResolvedValue({
        limited: false,
        remaining: 4,
        resetAt: Date.now() + 900000,
        current: 1,
      });
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      request = createMockRequest({ token: testToken });
      const response = await POST(request);

      expect(response.status).toBe(200);

      // Make another failed attempt with a different token to verify counter was reset
      jest.clearAllMocks();
      mockGenerateCorrelationId.mockReturnValue(testCorrelationId);
      mockRateLimitByIP.mockResolvedValue({
        limited: false,
        remaining: 4,
        resetAt: Date.now() + 900000,
        current: 1,
      });
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
      request = createMockRequest({ token: differentToken });
      await POST(request);

      // The new token should start at attempt 1
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          attempts: 1,
        })
      );
    });
  });

  describe('Email Normalization (CR-008)', () => {
    it('should normalize email with toLowerCase()', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: 'TEST@EXAMPLE.COM',
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('test@example.com');
    });

    it('should normalize email with trim()', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: '  test@example.com  ',
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('test@example.com');
    });

    it('should normalize email with both toLowerCase() and trim()', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: '  TEST@EXAMPLE.COM  ',
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('test@example.com');
    });
  });

  describe('Timing Attack Prevention (CR-010)', () => {
    it('should return same error message for different failure reasons', async () => {
      const errors: string[] = [];

      // Non-existent token
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
      let request = createMockRequest({ token: testToken });
      let response = await POST(request);
      let data = await response.json();
      errors.push(data.error);

      // Expired token
      const pastDate = new Date(Date.now() - 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      });
      request = createMockRequest({ token: testToken });
      response = await POST(request);
      data = await response.json();
      errors.push(data.error);

      // Used token
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: true,
        createdAt: new Date(),
      });
      request = createMockRequest({ token: testToken });
      response = await POST(request);
      data = await response.json();
      errors.push(data.error);

      // All errors should be identical
      expect(errors[0]).toBe('Invalid or expired token');
      expect(errors[1]).toBe('Invalid or expired token');
      expect(errors[2]).toBe('Invalid or expired token');
    });

    it('should return same status code for different failure reasons', async () => {
      const statusCodes: number[] = [];

      // Non-existent token
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
      let request = createMockRequest({ token: testToken });
      let response = await POST(request);
      statusCodes.push(response.status);

      // Expired token
      const pastDate = new Date(Date.now() - 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      });
      request = createMockRequest({ token: testToken });
      response = await POST(request);
      statusCodes.push(response.status);

      // Used token
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: true,
        createdAt: new Date(),
      });
      request = createMockRequest({ token: testToken });
      response = await POST(request);
      statusCodes.push(response.status);

      // All status codes should be identical
      expect(statusCodes[0]).toBe(400);
      expect(statusCodes[1]).toBe(400);
      expect(statusCodes[2]).toBe(400);
    });
  });

  describe('Correlation IDs (CR-004, CR-006)', () => {
    it('should include correlation ID in all responses', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should include correlation ID in error responses', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ token: testToken });
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

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should log correlation ID in all log statements', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token verification successful',
        expect.objectContaining({ correlationId: testCorrelationId })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.passwordResetToken.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(data.correlationId).toBe(testCorrelationId);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Token verification error',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_ERROR',
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
      expect(data.valid).toBe(false);
      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should handle unknown errors', async () => {
      mockPrisma.passwordResetToken.findUnique.mockRejectedValue('Unknown error');

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Token verification error',
        expect.objectContaining({
          error: 'Unknown error',
        })
      );
    });
  });

  describe('Logging', () => {
    it('should log all relevant information on verification failure', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      await POST(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_FAILED',
          correlationId: testCorrelationId,
          tokenExists: true,
          used: false,
          expired: true,
          attempts: expect.any(Number),
        })
      );
    });

    it('should log success on valid token verification', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token verification successful',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_SUCCESS',
          correlationId: testCorrelationId,
          email: testEmail,
        })
      );
    });
  });

  describe('Integration Test', () => {
    it('should complete full verification flow for valid token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.email).toBe(testEmail);
      expect(data.correlationId).toBe(testCorrelationId);

      // Verify rate limiting was checked
      expect(mockRateLimitByIP).toHaveBeenCalled();

      // Verify token lookup
      expect(mockPrisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: testToken },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          used: true,
        },
      });

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token verification successful',
        expect.any(Object)
      );
    });

    it('should complete full verification flow for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(data.correlationId).toBe(testCorrelationId);

      // Verify logging
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          action: 'TOKEN_VERIFY_FAILED',
        })
      );
    });
  });
});
