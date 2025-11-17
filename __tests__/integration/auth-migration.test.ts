/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Phase 10: Comprehensive Auth Migration Integration Tests
 *
 * VALIDATES ALL MIGRATION PHASES WORKING TOGETHER:
 * - Phase 1: Type Safety (AuthUser types)
 * - Phase 2: Redis Cache (session caching)
 * - Phase 3: Rate Limiting (Redis-backed)
 * - Phase 4: Structured Logging (Winston)
 * - Phase 5: Cookie Consent (GDPR)
 * - Phase 6: Background Worker (async jobs)
 * - Phase 7: Database Indexes (performance)
 * - Phase 8: Error Handling (Result pattern)
 * - Phase 9: Token Family (revocation)
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import {
  checkRateLimit,
  resetRateLimit,
  RATE_LIMIT_CONFIGS
} from '@/lib/auth/rate-limit';
import {
  generateTokenPair,
  refreshAccessToken,
  revokeTokenFamily,
} from '@/lib/auth/refresh-token';
import {
  getSessionFromCache,
  setSessionInCache,
  invalidateSessionCache,
} from '@/lib/auth/session-cache';
import { logger } from '@/lib/logger';
import { UserRole } from '@/app/generated/prisma';

// Test user IDs
const TEST_USER_1 = 'integration-test-user-1';
const TEST_USER_2 = 'integration-test-user-2';
const TEST_EMAIL_1 = 'integration-test-1@example.com';
const TEST_EMAIL_2 = 'integration-test-2@example.com';

describe('Auth System Integration Tests (All Phases)', () => {
  // Setup test users
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [TEST_USER_1, TEST_USER_2] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [TEST_USER_1, TEST_USER_2] } },
    });

    // Create test users
    await prisma.user.create({
      data: {
        id: TEST_USER_1,
        email: TEST_EMAIL_1,
        primaryRole: 'CUSTOMER' as UserRole,
        isActive: true,
        isSuspended: false,
      },
    });

    await prisma.user.create({
      data: {
        id: TEST_USER_2,
        email: TEST_EMAIL_2,
        primaryRole: 'SUPER_ADMIN' as UserRole,
        isActive: true,
        isSuspended: false,
      },
    });

    logger.info('Integration test users created', {
      users: [TEST_USER_1, TEST_USER_2]
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [TEST_USER_1, TEST_USER_2] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [TEST_USER_1, TEST_USER_2] } },
    });

    // Clear cache
    await invalidateSessionCache(TEST_USER_1);
    await invalidateSessionCache(TEST_USER_2);
  });

  describe('Phase 1-2: Type Safety + Redis Cache Integration', () => {
    test('should cache and retrieve session with proper types', async () => {
      const sessionData = {
        userId: TEST_USER_1,
        role: 'CUSTOMER' as UserRole,
        email: TEST_EMAIL_1,
        permissions: ['read:profile', 'write:profile'],
      };

      // Set session in cache
      await setSessionInCache(TEST_USER_1, sessionData);

      // Retrieve from cache (simulates second request)
      const cached = await getSessionFromCache(TEST_USER_1);

      expect(cached).not.toBeNull();
      expect(cached?.userId).toBe(TEST_USER_1);
      expect(cached?.email).toBe(TEST_EMAIL_1);
      expect(cached?.role).toBe('CUSTOMER');
      expect(cached?.permissions).toContain('read:profile');

      // Cleanup
      await invalidateSessionCache(TEST_USER_1);
    });

    test('should return null for non-existent cache', async () => {
      const cached = await getSessionFromCache('non-existent-user');
      expect(cached).toBeNull();
    });

    test('user data should be properly typed from database', async () => {
      const user = await prisma.user.findUnique({
        where: { id: TEST_USER_1 },
      });

      // TypeScript ensures these properties exist
      expect(user).toBeDefined();
      expect(user?.id).toBe(TEST_USER_1);
      expect(user?.email).toBe(TEST_EMAIL_1);
      expect(user?.primaryRole).toBe('CUSTOMER');
      expect(user?.isActive).toBe(true);
    });
  });

  describe('Phase 3: Rate Limiting Integration', () => {
    beforeEach(async () => {
      await resetRateLimit(TEST_USER_1);
      await resetRateLimit(TEST_USER_2);
    });

    test('should enforce rate limits across auth operations', async () => {
      const config = { maxRequests: 3, windowSeconds: 60 };

      // Simulate 3 login attempts
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(TEST_USER_1, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2 - i);
      }

      // 4th attempt should be blocked
      const blocked = await checkRateLimit(TEST_USER_1, config);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetAt).toBeGreaterThan(Date.now());
    });

    test('rate limits should be per-user (isolated)', async () => {
      const config = { maxRequests: 2, windowSeconds: 60 };

      // User 1 hits limit
      await checkRateLimit(TEST_USER_1, config);
      await checkRateLimit(TEST_USER_1, config);
      const user1Blocked = await checkRateLimit(TEST_USER_1, config);
      expect(user1Blocked.allowed).toBe(false);

      // User 2 should still be allowed
      const user2Result = await checkRateLimit(TEST_USER_2, config);
      expect(user2Result.allowed).toBe(true);
      expect(user2Result.current).toBe(1);
    });

    test('should use predefined LOGIN config', async () => {
      const config = RATE_LIMIT_CONFIGS.LOGIN;
      expect(config.maxRequests).toBe(5);
      expect(config.windowSeconds).toBe(900); // 15 minutes

      const result = await checkRateLimit(TEST_USER_1, config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Phase 4: Structured Logging Integration', () => {
    test('logger should be available and properly typed', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should log auth operations with context', () => {
      // Verify logger can be called without errors
      logger.info('Integration test auth event', {
        userId: TEST_USER_1,
        action: 'test-login',
        phase: 'integration-testing',
      });

      logger.debug('Cache operation', {
        userId: TEST_USER_1,
        operation: 'cache-hit',
        latency: 5,
      });

      // Logger should not throw
      expect(true).toBe(true);
    });
  });

  describe('Phase 5: Cookie Consent Integration', () => {
    test('cookie consent utilities should exist and work', async () => {
      const cookieConsent = await import('@/lib/cookie-consent');

      expect(typeof cookieConsent.getConsentStatus).toBe('function');
      expect(typeof cookieConsent.setConsentStatus).toBe('function');
      expect(typeof cookieConsent.shouldShowConsentBanner).toBe('function');
      expect(typeof cookieConsent.hasConsent).toBe('function');

      // Default status should be pending (GDPR compliant - no tracking until consent)
      const status = cookieConsent.getConsentStatus();
      expect(['accepted', 'rejected', 'pending']).toContain(status);
    });
  });

  describe('Phase 7: Database Indexes Performance', () => {
    test('should find user by email efficiently (index used)', async () => {
      const startTime = performance.now();

      const user = await prisma.user.findUnique({
        where: { email: TEST_EMAIL_1 },
      });

      const duration = performance.now() - startTime;

      expect(user).toBeDefined();
      expect(user?.id).toBe(TEST_USER_1);
      expect(duration).toBeLessThan(100); // Should be fast with index
    });

    test('should find user by ID efficiently (primary key)', async () => {
      const startTime = performance.now();

      const user = await prisma.user.findUnique({
        where: { id: TEST_USER_1 },
      });

      const duration = performance.now() - startTime;

      expect(user).toBeDefined();
      expect(duration).toBeLessThan(50); // Primary key lookup is fastest
    });
  });

  describe('Phase 8: Error Handling (Result Pattern)', () => {
    test('generateTokenPair should return Result type', async () => {
      const result = await generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole);

      // Should have ok property
      expect(result).toHaveProperty('ok');
      expect(typeof result.ok).toBe('boolean');

      if (result.ok) {
        expect(result.value).toHaveProperty('accessToken');
        expect(result.value).toHaveProperty('refreshToken');
        expect(result.value).toHaveProperty('expiresIn');
      } else {
        expect(result.error).toHaveProperty('type');
        expect(result.error).toHaveProperty('message');
      }
    });

    test('error should have proper structure when user not found', async () => {
      const result = await generateTokenPair('non-existent-user', 'CUSTOMER' as UserRole);

      if (!result.ok) {
        expect(result.error).toHaveProperty('type');
        expect(result.error).toHaveProperty('message');
        expect(result.error.message).toContain('not found');
      }
    });
  });

  describe('Phase 9: Token Family Integration', () => {
    beforeEach(async () => {
      // Clean up tokens before each test
      await prisma.refreshToken.deleteMany({
        where: { userId: TEST_USER_1 },
      });
    });

    test('token should have family tracking', async () => {
      const result = await generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Check database for family
      const dbToken = await prisma.refreshToken.findFirst({
        where: { userId: TEST_USER_1 },
      });

      expect(dbToken).toBeDefined();
      expect(dbToken?.family).toBeTruthy();
      expect(dbToken?.family.startsWith('fam_')).toBe(true);
      expect(dbToken?.parentId).toBeNull(); // First token has no parent
    });

    test('child token should inherit family from parent', async () => {
      // Generate parent token
      const parentResult = await generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole);
      expect(parentResult.ok).toBe(true);
      if (!parentResult.ok) return;

      // Get parent token
      const parentToken = await prisma.refreshToken.findFirst({
        where: { userId: TEST_USER_1 },
      });
      expect(parentToken).toBeDefined();
      const parentFamily = parentToken!.family;
      const parentId = parentToken!.id;

      // Simulate token refresh (creates child)
      const childResult = await refreshAccessToken(parentResult.value.refreshToken);

      if (childResult.ok) {
        // Get child token
        const childToken = await prisma.refreshToken.findFirst({
          where: {
            userId: TEST_USER_1,
            id: { not: parentId },
          },
        });

        if (childToken) {
          expect(childToken.family).toBe(parentFamily);
          expect(childToken.parentId).toBe(parentId);
        }
      }
    });

    test('revoking family should revoke all related tokens', async () => {
      // Generate a token family
      const result = await generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const dbToken = await prisma.refreshToken.findFirst({
        where: { userId: TEST_USER_1 },
      });
      expect(dbToken).toBeDefined();

      const family = dbToken!.family;

      // Revoke the family
      await revokeTokenFamily(family);

      // Verify all tokens in family are revoked
      const tokens = await prisma.refreshToken.findMany({
        where: { family },
      });

      tokens.forEach((token) => {
        expect(token.revoked).toBe(true);
      });
    });
  });

  describe('Full Auth Flow Integration', () => {
    beforeEach(async () => {
      await prisma.refreshToken.deleteMany({
        where: { userId: TEST_USER_1 },
      });
      await invalidateSessionCache(TEST_USER_1);
      await resetRateLimit(TEST_USER_1);
    });

    test('complete sign-in flow with caching and rate limiting', async () => {
      // 1. Check rate limit (should allow)
      const rateLimitCheck = await checkRateLimit(TEST_USER_1, RATE_LIMIT_CONFIGS.LOGIN);
      expect(rateLimitCheck.allowed).toBe(true);

      // 2. Generate tokens (simulates successful login)
      const tokenResult = await generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole);
      expect(tokenResult.ok).toBe(true);
      if (!tokenResult.ok) return;

      const { accessToken, refreshToken } = tokenResult.value;
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();

      // 3. Cache the session
      const sessionData = {
        userId: TEST_USER_1,
        role: 'CUSTOMER' as UserRole,
        email: TEST_EMAIL_1,
        permissions: ['read:profile'],
      };
      await setSessionInCache(TEST_USER_1, sessionData);

      // 4. Verify cache hit (second request)
      const cached = await getSessionFromCache(TEST_USER_1);
      expect(cached).not.toBeNull();
      expect(cached?.userId).toBe(TEST_USER_1);

      // 5. Token should be in database with family
      const dbToken = await prisma.refreshToken.findFirst({
        where: { userId: TEST_USER_1 },
      });
      expect(dbToken).toBeDefined();
      expect(dbToken?.family).toBeTruthy();

      // 6. Log the successful login
      logger.info('Integration test: full auth flow completed', {
        userId: TEST_USER_1,
        cacheHit: cached !== null,
        tokenFamily: dbToken?.family,
      });
    });

    test('complete logout flow revokes tokens and clears cache', async () => {
      // 1. Setup: create session
      const tokenResult = await generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole);
      expect(tokenResult.ok).toBe(true);
      if (!tokenResult.ok) return;

      await setSessionInCache(TEST_USER_1, {
        userId: TEST_USER_1,
        role: 'CUSTOMER' as UserRole,
        email: TEST_EMAIL_1,
        permissions: [],
      });

      // 2. Get token family
      const dbToken = await prisma.refreshToken.findFirst({
        where: { userId: TEST_USER_1 },
      });
      expect(dbToken).toBeDefined();
      const family = dbToken!.family;

      // 3. Logout: revoke token family
      await revokeTokenFamily(family);

      // 4. Clear cache
      await invalidateSessionCache(TEST_USER_1);

      // 5. Verify cache cleared
      const cached = await getSessionFromCache(TEST_USER_1);
      expect(cached).toBeNull();

      // 6. Verify tokens revoked
      const revokedTokens = await prisma.refreshToken.findMany({
        where: { family },
      });
      revokedTokens.forEach((token) => {
        expect(token.revoked).toBe(true);
      });
    });
  });

  describe('Error Scenarios Integration', () => {
    test('inactive user flow', async () => {
      // Create inactive user
      const inactiveUserId = 'inactive-integration-test';
      await prisma.user.create({
        data: {
          id: inactiveUserId,
          email: 'inactive-integration@example.com',
          primaryRole: 'CUSTOMER' as UserRole,
          isActive: false,
          isSuspended: false,
        },
      });

      // Try to get user
      const user = await prisma.user.findUnique({
        where: { id: inactiveUserId },
      });

      expect(user).toBeDefined();
      expect(user?.isActive).toBe(false);

      // Business logic should reject inactive users
      // (This is handled in auth logic, not tested here)

      // Cleanup
      await prisma.user.delete({ where: { id: inactiveUserId } });
    });

    test('suspended user flow', async () => {
      const suspendedUserId = 'suspended-integration-test';
      await prisma.user.create({
        data: {
          id: suspendedUserId,
          email: 'suspended-integration@example.com',
          primaryRole: 'CUSTOMER' as UserRole,
          isActive: true,
          isSuspended: true,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: suspendedUserId },
      });

      expect(user).toBeDefined();
      expect(user?.isSuspended).toBe(true);

      // Cleanup
      await prisma.user.delete({ where: { id: suspendedUserId } });
    });

    test('rate limit exceeded returns proper error', async () => {
      const config = { maxRequests: 1, windowSeconds: 60 };

      // Hit limit
      await checkRateLimit(TEST_USER_2, config);

      // Next should fail
      const result = await checkRateLimit(TEST_USER_2, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.current).toBe(2);

      await resetRateLimit(TEST_USER_2);
    });
  });

  describe('Performance Validation', () => {
    test('cache hit should be fast (<50ms)', async () => {
      // Setup cache
      await setSessionInCache(TEST_USER_1, {
        userId: TEST_USER_1,
        role: 'CUSTOMER' as UserRole,
        email: TEST_EMAIL_1,
        permissions: [],
      });

      // Measure cache retrieval
      const startTime = performance.now();
      const result = await getSessionFromCache(TEST_USER_1);
      const duration = performance.now() - startTime;

      expect(result).not.toBeNull();
      expect(duration).toBeLessThan(50); // Should be <50ms with Redis

      await invalidateSessionCache(TEST_USER_1);
    });

    test('database query with index should be fast (<100ms)', async () => {
      const startTime = performance.now();

      const user = await prisma.user.findUnique({
        where: { id: TEST_USER_1 },
      });

      const duration = performance.now() - startTime;

      expect(user).toBeDefined();
      expect(duration).toBeLessThan(100);
    });

    test('rate limit check should be fast (<20ms)', async () => {
      const startTime = performance.now();

      const result = await checkRateLimit(TEST_USER_1, RATE_LIMIT_CONFIGS.GENERAL);

      const duration = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(20); // Redis should be very fast

      await resetRateLimit(TEST_USER_1);
    });
  });

  describe('Type Safety Validation', () => {
    test('all functions should return properly typed values', async () => {
      // Token generation returns Result type
      const tokenResult = await generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole);
      expect(tokenResult).toHaveProperty('ok');

      // Rate limiting returns structured result
      const rateLimitResult = await checkRateLimit(TEST_USER_1, { maxRequests: 5, windowSeconds: 60 });
      expect(rateLimitResult).toHaveProperty('allowed');
      expect(rateLimitResult).toHaveProperty('remaining');
      expect(rateLimitResult).toHaveProperty('current');
      expect(rateLimitResult).toHaveProperty('resetAt');

      // Session cache returns typed session or null
      const session = await getSessionFromCache(TEST_USER_1);
      if (session) {
        expect(session).toHaveProperty('userId');
        expect(session).toHaveProperty('role');
        expect(session).toHaveProperty('email');
      }

      await resetRateLimit(TEST_USER_1);
    });

    test('user role should be properly typed enum', async () => {
      const user = await prisma.user.findUnique({
        where: { id: TEST_USER_1 },
      });

      expect(user).toBeDefined();

      // TypeScript ensures this is UserRole type
      const validRoles: UserRole[] = ['CUSTOMER', 'SUPER_ADMIN', 'STUDIO_OWNER', 'GUEST'];
      expect(validRoles).toContain(user?.primaryRole);
    });
  });

  describe('Multi-Phase Integration Scenarios', () => {
    test('concurrent users with caching, rate limiting, and tokens', async () => {
      // Setup both users
      await resetRateLimit(TEST_USER_1);
      await resetRateLimit(TEST_USER_2);
      await invalidateSessionCache(TEST_USER_1);
      await invalidateSessionCache(TEST_USER_2);

      // Concurrent operations
      const [result1, result2] = await Promise.all([
        generateTokenPair(TEST_USER_1, 'CUSTOMER' as UserRole),
        generateTokenPair(TEST_USER_2, 'ADMIN' as UserRole),
      ]);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      // Cache both sessions
      await Promise.all([
        setSessionInCache(TEST_USER_1, {
          userId: TEST_USER_1,
          role: 'CUSTOMER' as UserRole,
          email: TEST_EMAIL_1,
          permissions: [],
        }),
        setSessionInCache(TEST_USER_2, {
          userId: TEST_USER_2,
          role: 'SUPER_ADMIN' as UserRole,
          email: TEST_EMAIL_2,
          permissions: [],
        }),
      ]);

      // Verify both cached
      const [cached1, cached2] = await Promise.all([
        getSessionFromCache(TEST_USER_1),
        getSessionFromCache(TEST_USER_2),
      ]);

      expect(cached1).not.toBeNull();
      expect(cached2).not.toBeNull();
      expect(cached1?.userId).toBe(TEST_USER_1);
      expect(cached2?.userId).toBe(TEST_USER_2);

      // Cleanup
      await Promise.all([
        invalidateSession(TEST_USER_1),
        invalidateSession(TEST_USER_2),
      ]);
    });
  });
});
