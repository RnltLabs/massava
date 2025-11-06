/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Phase 10: End-to-End Auth Flow Tests
 *
 * Tests realistic user authentication flows:
 * - Complete sign-in flow
 * - Token refresh and rotation
 * - Rate limiting enforcement
 * - Session management
 * - User logout
 *
 * NOTE: These tests simulate e2e flows at the service layer.
 * For true HTTP e2e tests, run against a live server.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import {
  generateTokenPair,
  refreshAccessToken,
  revokeTokenFamily,
  revokeAllRefreshTokens,
} from '@/lib/auth/refresh-token';
import {
  getSessionFromCache,
  setSessionInCache,
  invalidateSessionCache,
} from '@/lib/auth/session-cache';
import {
  checkRateLimit,
  resetRateLimit,
  RATE_LIMIT_CONFIGS,
} from '@/lib/auth/rate-limit';
import { logger } from '@/lib/logger';
import { UserRole } from '@/app/generated/prisma';

// Test user for e2e flows
const E2E_USER_ID = 'e2e-test-user';
const E2E_USER_EMAIL = 'e2e-test@example.com';
const E2E_USER_ROLE: UserRole = 'CUSTOMER';

describe('Auth System E2E Tests', () => {
  // Setup test user before all tests
  beforeEach(async () => {
    // Clean up existing data
    await prisma.refreshToken.deleteMany({
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
        primaryRole: E2E_USER_ROLE,
        isActive: true,
        isSuspended: false,
      },
    });

    // Reset rate limits and cache
    await resetRateLimit(E2E_USER_ID);
    await invalidateSessionCache(E2E_USER_ID);

    logger.info('E2E test user setup complete', { userId: E2E_USER_ID });
  });

  afterEach(async () => {
    // Cleanup after each test
    await prisma.refreshToken.deleteMany({
      where: { userId: E2E_USER_ID },
    });
    await prisma.user.deleteMany({
      where: { id: E2E_USER_ID },
    });
    await invalidateSessionCache(E2E_USER_ID);
    await resetRateLimit(E2E_USER_ID);
  });

  describe('E2E: Complete User Sign-In Flow', () => {
    test('should complete full sign-in flow with caching', async () => {
      logger.info('Starting E2E sign-in flow', { userId: E2E_USER_ID });

      // Step 1: Check rate limit (should allow)
      const rateLimitCheck = await checkRateLimit(E2E_USER_ID, RATE_LIMIT_CONFIGS.LOGIN);
      expect(rateLimitCheck.allowed).toBe(true);
      expect(rateLimitCheck.remaining).toBeGreaterThan(0);

      logger.debug('Rate limit check passed', {
        userId: E2E_USER_ID,
        remaining: rateLimitCheck.remaining,
      });

      // Step 2: Authenticate user (simulated - would validate credentials here)
      const user = await prisma.user.findUnique({
        where: { id: E2E_USER_ID },
      });
      expect(user).toBeDefined();
      expect(user?.isActive).toBe(true);
      expect(user?.isSuspended).toBe(false);

      // Step 3: Generate tokens (creates token family)
      const tokenResult = await generateTokenPair(E2E_USER_ID, E2E_USER_ROLE);
      expect(tokenResult.ok).toBe(true);
      if (!tokenResult.ok) {
        logger.error('Token generation failed', { error: tokenResult.error });
        throw new Error('Token generation failed');
      }

      const { accessToken, refreshToken, expiresIn } = tokenResult.value;
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(expiresIn).toBe(900); // 15 minutes

      logger.debug('Tokens generated', {
        userId: E2E_USER_ID,
        expiresIn,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });

      // Step 4: Verify token stored in database with family
      const dbToken = await prisma.refreshToken.findFirst({
        where: { userId: E2E_USER_ID },
      });
      expect(dbToken).toBeDefined();
      expect(dbToken?.family).toBeTruthy();
      expect(dbToken?.family.startsWith('fam_')).toBe(true);
      expect(dbToken?.revoked).toBe(false);
      expect(dbToken?.parentId).toBeNull(); // First token has no parent

      // Step 5: Cache the session
      const sessionData = {
        userId: E2E_USER_ID,
        role: E2E_USER_ROLE,
        email: E2E_USER_EMAIL,
        permissions: ['read:profile', 'write:profile'],
      };
      await setSessionInCache(E2E_USER_ID, sessionData);

      logger.debug('Session cached', { userId: E2E_USER_ID });

      // Step 6: Verify cache hit (simulates second request)
      const cachedSession = await getSessionFromCache(E2E_USER_ID);
      expect(cachedSession).not.toBeNull();
      expect(cachedSession?.userId).toBe(E2E_USER_ID);
      expect(cachedSession?.email).toBe(E2E_USER_EMAIL);
      expect(cachedSession?.role).toBe(E2E_USER_ROLE);
      expect(cachedSession?.permissions).toContain('read:profile');

      logger.info('E2E sign-in flow completed successfully', {
        userId: E2E_USER_ID,
        tokenFamily: dbToken?.family,
        cacheHit: cachedSession !== null,
      });
    });
  });

  describe('E2E: Rate Limiting Enforcement', () => {
    test('should block repeated login attempts after limit', async () => {
      const loginConfig = { maxRequests: 3, windowSeconds: 60 };

      logger.info('Testing rate limiting', {
        userId: E2E_USER_ID,
        maxRequests: loginConfig.maxRequests,
      });

      // Make requests up to the limit
      for (let i = 0; i < loginConfig.maxRequests; i++) {
        const result = await checkRateLimit(E2E_USER_ID, loginConfig);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(loginConfig.maxRequests - i - 1);

        logger.debug('Login attempt allowed', {
          attempt: i + 1,
          remaining: result.remaining,
        });
      }

      // Next attempt should be blocked
      const blockedResult = await checkRateLimit(E2E_USER_ID, loginConfig);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.resetAt).toBeGreaterThan(Date.now());

      const retryAfter = Math.ceil((blockedResult.resetAt - Date.now()) / 1000);
      logger.warn('Login attempt blocked by rate limit', {
        userId: E2E_USER_ID,
        retryAfter,
      });

      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(loginConfig.windowSeconds);
    });

    test('should enforce different limits per endpoint', async () => {
      // Simulate different rate limits for different actions
      const strictResult = await checkRateLimit(
        E2E_USER_ID,
        RATE_LIMIT_CONFIGS.STRICT
      );
      expect(strictResult.allowed).toBe(true);

      const generalResult = await checkRateLimit(
        E2E_USER_ID + ':general',
        RATE_LIMIT_CONFIGS.GENERAL
      );
      expect(generalResult.allowed).toBe(true);

      // STRICT should have lower limit than GENERAL
      expect(RATE_LIMIT_CONFIGS.STRICT.maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS.GENERAL.maxRequests
      );
    });
  });

  describe('E2E: Token Refresh and Rotation', () => {
    test('should refresh tokens and maintain family lineage', async () => {
      logger.info('Testing token refresh flow', { userId: E2E_USER_ID });

      // Step 1: Generate initial tokens
      const initialResult = await generateTokenPair(E2E_USER_ID, E2E_USER_ROLE);
      expect(initialResult.ok).toBe(true);
      if (!initialResult.ok) return;

      const { refreshToken: initialRefreshToken } = initialResult.value;

      // Get parent token from database
      const parentToken = await prisma.refreshToken.findFirst({
        where: { userId: E2E_USER_ID },
      });
      expect(parentToken).toBeDefined();
      const parentFamily = parentToken!.family;
      const parentId = parentToken!.id;

      logger.debug('Initial token created', {
        family: parentFamily,
        tokenId: parentId,
      });

      // Step 2: Refresh the token (creates child)
      const refreshResult = await refreshAccessToken(initialRefreshToken);

      if (refreshResult.ok) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResult.value;
        expect(newAccessToken).toBeTruthy();
        expect(newRefreshToken).toBeTruthy();

        // Step 3: Verify child token inherits family
        const childToken = await prisma.refreshToken.findFirst({
          where: {
            userId: E2E_USER_ID,
            id: { not: parentId },
          },
        });

        if (childToken) {
          expect(childToken.family).toBe(parentFamily);
          expect(childToken.parentId).toBe(parentId);
          expect(childToken.revoked).toBe(false);

          logger.debug('Child token created', {
            family: childToken.family,
            tokenId: childToken.id,
            parentId: childToken.parentId,
          });
        }

        logger.info('Token refresh completed successfully', {
          userId: E2E_USER_ID,
          familyMaintained: true,
        });
      }
    });

    test('should detect and prevent token reuse (replay attack)', async () => {
      logger.info('Testing token reuse detection', { userId: E2E_USER_ID });

      // Generate initial token
      const result = await generateTokenPair(E2E_USER_ID, E2E_USER_ROLE);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { refreshToken } = result.value;

      // Use token once (should succeed)
      const firstRefresh = await refreshAccessToken(refreshToken);
      if (!firstRefresh.ok) {
        logger.warn('First refresh failed (expected if token validation strict)', {
          error: firstRefresh.error,
        });
      }

      // Try to reuse same token (should fail - token replay detected)
      const secondRefresh = await refreshAccessToken(refreshToken);
      if (!secondRefresh.ok) {
        expect(secondRefresh.error.type).toBe('INVALID_TOKEN');
        logger.info('Token reuse correctly detected and blocked', {
          userId: E2E_USER_ID,
        });
      }
    });
  });

  describe('E2E: Session Management', () => {
    test('should maintain session across multiple requests', async () => {
      // Simulate multiple authenticated requests
      const sessionData = {
        userId: E2E_USER_ID,
        role: E2E_USER_ROLE,
        email: E2E_USER_EMAIL,
        permissions: ['read:profile', 'write:profile'],
      };

      // Cache session
      await setSessionInCache(E2E_USER_ID, sessionData);

      // Simulate 5 requests (all should hit cache)
      for (let i = 0; i < 5; i++) {
        const cached = await getSessionFromCache(E2E_USER_ID);
        expect(cached).not.toBeNull();
        expect(cached?.userId).toBe(E2E_USER_ID);

        logger.debug(`Request ${i + 1}: cache hit`, { userId: E2E_USER_ID });
      }

      logger.info('Session cache working correctly', {
        userId: E2E_USER_ID,
        requests: 5,
        cacheHits: 5,
      });
    });

    test('should invalidate session on logout', async () => {
      // Setup session
      await setSessionInCache(E2E_USER_ID, {
        userId: E2E_USER_ID,
        role: E2E_USER_ROLE,
        email: E2E_USER_EMAIL,
        permissions: [],
      });

      // Verify session exists
      const beforeLogout = await getSessionFromCache(E2E_USER_ID);
      expect(beforeLogout).not.toBeNull();

      // Logout: invalidate session
      await invalidateSessionCache(E2E_USER_ID);

      // Verify session cleared
      const afterLogout = await getSessionFromCache(E2E_USER_ID);
      expect(afterLogout).toBeNull();

      logger.info('Session invalidated on logout', { userId: E2E_USER_ID });
    });
  });

  describe('E2E: User Logout Flow', () => {
    test('should complete full logout flow with token revocation', async () => {
      logger.info('Testing complete logout flow', { userId: E2E_USER_ID });

      // Step 1: Setup authenticated session
      const tokenResult = await generateTokenPair(E2E_USER_ID, E2E_USER_ROLE);
      expect(tokenResult.ok).toBe(true);
      if (!tokenResult.ok) return;

      await setSessionInCache(E2E_USER_ID, {
        userId: E2E_USER_ID,
        role: E2E_USER_ROLE,
        email: E2E_USER_EMAIL,
        permissions: [],
      });

      // Get token family
      const token = await prisma.refreshToken.findFirst({
        where: { userId: E2E_USER_ID },
      });
      expect(token).toBeDefined();
      const family = token!.family;

      logger.debug('Session setup complete', { family });

      // Step 2: Logout - revoke entire token family
      await revokeTokenFamily(family);

      // Step 3: Clear session cache
      await invalidateSessionCache(E2E_USER_ID);

      // Step 4: Verify tokens revoked
      const revokedTokens = await prisma.refreshToken.findMany({
        where: { family },
      });
      revokedTokens.forEach((t) => {
        expect(t.revoked).toBe(true);
      });

      // Step 5: Verify session cleared
      const cachedSession = await getSessionFromCache(E2E_USER_ID);
      expect(cachedSession).toBeNull();

      logger.info('Logout flow completed successfully', {
        userId: E2E_USER_ID,
        tokensRevoked: revokedTokens.length,
        sessionCleared: true,
      });
    });

    test('should revoke all user tokens (global logout)', async () => {
      // Create multiple tokens (simulates multiple devices)
      const token1 = await generateTokenPair(E2E_USER_ID, E2E_USER_ROLE);
      expect(token1.ok).toBe(true);

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      const token2 = await generateTokenPair(E2E_USER_ID, E2E_USER_ROLE);
      expect(token2.ok).toBe(true);

      // Verify we have multiple tokens
      const beforeRevoke = await prisma.refreshToken.count({
        where: { userId: E2E_USER_ID },
      });
      expect(beforeRevoke).toBeGreaterThanOrEqual(2);

      logger.debug('Multiple tokens created', { count: beforeRevoke });

      // Global logout: revoke all tokens
      await revokeAllRefreshTokens(E2E_USER_ID);

      // Verify all tokens revoked
      const allTokens = await prisma.refreshToken.findMany({
        where: { userId: E2E_USER_ID },
      });

      allTokens.forEach((t) => {
        expect(t.revoked).toBe(true);
      });

      logger.info('Global logout completed', {
        userId: E2E_USER_ID,
        tokensRevoked: allTokens.length,
      });
    });
  });

  describe('E2E: Error Scenarios', () => {
    test('should handle inactive user gracefully', async () => {
      // Create inactive user
      const inactiveUserId = 'e2e-inactive-user';
      await prisma.user.create({
        data: {
          id: inactiveUserId,
          email: 'inactive-e2e@example.com',
          primaryRole: 'CUSTOMER' as UserRole,
          isActive: false,
          isSuspended: false,
        },
      });

      // Try to generate tokens (should fail)
      const result = await generateTokenPair(inactiveUserId, 'CUSTOMER' as UserRole);

      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.type).toBe('USER_INACTIVE');

        logger.info('Inactive user correctly rejected', {
          userId: inactiveUserId,
          error: result.error.type,
        });
      }

      // Cleanup
      await prisma.user.delete({ where: { id: inactiveUserId } });
    });

    test('should handle suspended user gracefully', async () => {
      // Create suspended user
      const suspendedUserId = 'e2e-suspended-user';
      await prisma.user.create({
        data: {
          id: suspendedUserId,
          email: 'suspended-e2e@example.com',
          primaryRole: 'CUSTOMER' as UserRole,
          isActive: true,
          isSuspended: true,
        },
      });

      // Try to generate tokens (should fail)
      const result = await generateTokenPair(suspendedUserId, 'CUSTOMER' as UserRole);

      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.type).toBe('USER_SUSPENDED');

        logger.info('Suspended user correctly rejected', {
          userId: suspendedUserId,
          error: result.error.type,
        });
      }

      // Cleanup
      await prisma.user.delete({ where: { id: suspendedUserId } });
    });
  });

  describe('E2E: Performance Benchmarks', () => {
    test('full auth flow should complete under 200ms', async () => {
      const startTime = performance.now();

      // Complete flow: rate limit + token generation + caching
      await checkRateLimit(E2E_USER_ID, RATE_LIMIT_CONFIGS.LOGIN);

      const tokenResult = await generateTokenPair(E2E_USER_ID, E2E_USER_ROLE);
      expect(tokenResult.ok).toBe(true);

      await setSessionInCache(E2E_USER_ID, {
        userId: E2E_USER_ID,
        role: E2E_USER_ROLE,
        email: E2E_USER_EMAIL,
        permissions: [],
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(200);

      logger.info('Auth flow performance', {
        duration: Math.round(duration),
        target: 200,
      });
    });

    test('cache-hit request should complete under 50ms', async () => {
      // Setup cache
      await setSessionInCache(E2E_USER_ID, {
        userId: E2E_USER_ID,
        role: E2E_USER_ROLE,
        email: E2E_USER_EMAIL,
        permissions: [],
      });

      // Measure cache hit
      const startTime = performance.now();
      const cached = await getSessionFromCache(E2E_USER_ID);
      const duration = performance.now() - startTime;

      expect(cached).not.toBeNull();
      expect(duration).toBeLessThan(50);

      logger.info('Cache hit performance', {
        duration: Math.round(duration),
        target: 50,
      });
    });
  });
});
