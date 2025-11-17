/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Unit Tests: Update Password with Reset Token API
 * POST /api/auth/update-password
 *
 * SECURITY TEST COVERAGE:
 * - CR-001: Rate limiting (5 attempts per 15 minutes)
 * - CR-003: Unified password validation (min 10 chars + uppercase + number)
 * - CR-004: Structured logging with correlation IDs
 * - CR-006: Correlation IDs in all error responses
 * - CR-008: Email normalization with toLowerCase().trim()
 * - Password hashing (bcrypt)
 * - Token verification (valid, not used, not expired)
 * - Transaction (password update + token marked as used)
 * - Error handling and validation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/update-password/route';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as loggerModule from '@/lib/logger';

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));
jest.mock('@/lib/auth/rate-limit');
jest.mock('@/lib/logger');

// Type-safe mocks
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockRateLimitByIP = rateLimitModule.rateLimitByIP as jest.MockedFunction<
  typeof rateLimitModule.rateLimitByIP
>;
const mockGenerateCorrelationId = loggerModule.generateCorrelationId as jest.MockedFunction<
  typeof loggerModule.generateCorrelationId
>;
const mockLogger = loggerModule.logger as jest.Mocked<typeof loggerModule.logger>;

describe('POST /api/auth/update-password', () => {
  const testToken = 'a'.repeat(64);
  const testEmail = 'test@example.com';
  const testPassword = 'StrongPass123';
  const testHashedPassword = 'hashed-password-123';
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
    (mockBcrypt.hash as jest.MockedFunction<typeof mockBcrypt.hash>).mockResolvedValue(testHashedPassword as never);

    // Mock logger methods
    mockLogger.warn = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();

    // Mock transaction to execute callbacks
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      if (Array.isArray(callback)) {
        // Array of promises
        return Promise.all(callback);
      }
      // Function callback
      return callback(mockPrisma);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many password update attempts');
      expect(data.correlationId).toBe(testCorrelationId);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password update rate limit exceeded',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_RATE_LIMIT',
          correlationId: testCorrelationId,
        })
      );
    });

    it('should call rateLimitByIP with correct configuration', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
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

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);

      expect(response.status).toBe(404); // Invalid token, but not rate limited
    });
  });

  describe('Password Validation (CR-003)', () => {
    it('should accept password with min 10 chars, uppercase, and number', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const validPasswords = [
        'Password123',
        'MySecureP4ss',
        'Testing1234567890',
        'Abc1234567',
      ];

      for (const password of validPasswords) {
        jest.clearAllMocks();
        mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
          id: 'token-id',
          token: testToken,
          email: testEmail,
          expiresAt: futureDate,
          used: false,
          createdAt: new Date(),
        });
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);

        const request = createMockRequest({ token: testToken, password });
        const response = await POST(request);

        expect(response.status).toBe(200);
      }
    });

    it('should reject password with less than 10 characters', async () => {
      const request = createMockRequest({
        token: testToken,
        password: 'Short1',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid password update request',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_INVALID',
        })
      );
    });

    it('should reject password without uppercase letter', async () => {
      const request = createMockRequest({
        token: testToken,
        password: 'lowercase123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject password without number', async () => {
      const request = createMockRequest({
        token: testToken,
        password: 'NoNumbersHere',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject missing password', async () => {
      const request = createMockRequest({ token: testToken });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject empty password', async () => {
      const request = createMockRequest({
        token: testToken,
        password: '',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Token Validation', () => {
    it('should reject missing token', async () => {
      const request = createMockRequest({ password: testPassword });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject non-existent token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password update attempted with invalid token',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_INVALID_TOKEN',
        })
      );
    });

    it('should reject already used token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: true,
        createdAt: new Date(),
      });

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Token has already been used');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password update attempted with used token',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_TOKEN_USED',
          email: testEmail,
        })
      );
    });

    it('should reject expired token', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Token has expired');
      expect(data.expired).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password update attempted with expired token',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_TOKEN_EXPIRED',
          email: testEmail,
        })
      );
    });

    it('should accept valid unused non-expired token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Email Normalization (CR-008)', () => {
    it('should normalize email with toLowerCase()', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: 'TEST@EXAMPLE.COM',
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      const transaction = mockPrisma.$transaction.mock.calls[0][0];
      expect(transaction[0].where.email).toBe('test@example.com');
    });

    it('should normalize email with trim()', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: '  test@example.com  ',
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      const transaction = mockPrisma.$transaction.mock.calls[0][0];
      expect(transaction[0].where.email).toBe('test@example.com');
    });

    it('should normalize email with both toLowerCase() and trim()', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: '  TEST@EXAMPLE.COM  ',
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      const transaction = mockPrisma.$transaction.mock.calls[0][0];
      expect(transaction[0].where.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(testPassword, 10);
    });

    it('should use bcrypt with cost factor 10', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(
        expect.any(String),
        10 // Cost factor
      );
    });

    it('should store hashed password, not plain text', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      const transaction = mockPrisma.$transaction.mock.calls[0][0];
      expect(transaction[0].data.password).toBe(testHashedPassword);
      expect(transaction[0].data.password).not.toBe(testPassword);
    });
  });

  describe('Transaction (Atomic Update)', () => {
    it('should update password and mark token as used in transaction', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const tokenId = 'token-id-123';
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: tokenId,
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transaction = mockPrisma.$transaction.mock.calls[0][0];

      // Verify it's an array transaction (atomic)
      expect(Array.isArray(transaction)).toBe(true);
      expect(transaction).toHaveLength(2);

      // Verify password update
      expect(transaction[0].where.email).toBe(testEmail);
      expect(transaction[0].data.password).toBe(testHashedPassword);

      // Verify token marked as used
      expect(transaction[1].where.id).toBe(tokenId);
      expect(transaction[1].data.used).toBe(true);
    });

    it('should rollback if transaction fails', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Password update error',
        expect.objectContaining({
          error: 'Transaction failed',
        })
      );
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
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should include correlation ID in error responses', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should include correlation ID in validation error responses', async () => {
      const request = createMockRequest({
        token: testToken,
        password: 'weak',
      });
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
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password updated successfully',
        expect.objectContaining({ correlationId: testCorrelationId })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.passwordResetToken.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An error occurred updating your password');
      expect(data.correlationId).toBe(testCorrelationId);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Password update error',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_ERROR',
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

    it('should handle bcrypt hashing errors', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      (mockBcrypt.hash as jest.MockedFunction<typeof mockBcrypt.hash>).mockRejectedValueOnce(new Error('Hashing failed') as never);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle unknown errors', async () => {
      mockPrisma.passwordResetToken.findUnique.mockRejectedValue('Unknown error');

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Password update error',
        expect.objectContaining({
          error: 'Unknown error',
        })
      );
    });
  });

  describe('Logging', () => {
    it('should log success on password update', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password updated successfully',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_SUCCESS',
          correlationId: testCorrelationId,
          email: testEmail,
        })
      );
    });

    it('should log validation errors', async () => {
      const request = createMockRequest({
        token: testToken,
        password: 'weak',
      });
      await POST(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid password update request',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_INVALID',
          correlationId: testCorrelationId,
        })
      );
    });

    it('should log token errors', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      await POST(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password update attempted with invalid token',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_INVALID_TOKEN',
        })
      );
    });
  });

  describe('Response Format', () => {
    it('should return success response on password update', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Password updated successfully',
        correlationId: testCorrelationId,
      });
    });

    it('should include validation details in error response', async () => {
      const request = createMockRequest({
        token: testToken,
        password: 'weak',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
      expect(data.correlationId).toBe(testCorrelationId);
    });

    it('should include expired flag for expired tokens', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      });

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.expired).toBe(true);
    });
  });

  describe('Integration Test', () => {
    it('should complete full password update flow', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const tokenId = 'token-id-123';
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: tokenId,
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([
        { email: testEmail, password: testHashedPassword },
        { id: tokenId, used: true },
      ]);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password updated successfully');
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

      // Verify password was hashed
      expect(mockBcrypt.hash).toHaveBeenCalledWith(testPassword, 10);

      // Verify transaction
      expect(mockPrisma.$transaction).toHaveBeenCalled();

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password updated successfully',
        expect.objectContaining({
          action: 'PASSWORD_UPDATE_SUCCESS',
          email: testEmail,
        })
      );
    });

    it('should handle complete error flow', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        token: testToken,
        password: testPassword,
      });
      const response = await POST(request);
      const data = await response.json();

      // Verify error response
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
      expect(data.correlationId).toBe(testCorrelationId);

      // Verify no password hashing occurred
      expect(mockBcrypt.hash).not.toHaveBeenCalled();

      // Verify no transaction occurred
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();

      // Verify error logging
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password update attempted with invalid token',
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const longPassword = 'A1' + 'a'.repeat(100);
      const request = createMockRequest({
        token: testToken,
        password: longPassword,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
    });

    it('should handle special characters in password', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const specialPassword = 'P@ssw0rd!#$%^&*()';
      const request = createMockRequest({
        token: testToken,
        password: specialPassword,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle unicode characters in password', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: testToken,
        email: testEmail,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const unicodePassword = 'Pässw0rd123';
      const request = createMockRequest({
        token: testToken,
        password: unicodePassword,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
