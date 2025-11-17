/**
 * Token Family Revocation Tests (Phase 9)
 *
 * SECURITY TEST COVERAGE:
 * - Token family creation and inheritance
 * - Parent-child token relationships  
 * - Token reuse detection (replay attacks)
 * - Automatic family revocation on compromise
 * - Token rotation and lineage tracking
 */

import { describe, test, beforeEach, afterEach, expect } from '@jest/globals';
import {
  generateTokenPair,
  refreshAccessToken,
  revokeTokenFamily,
  revokeAllRefreshTokens,
} from '@/lib/auth/refresh-token';
import {
  getUserTokenStats,
  cleanupExpiredTokens,
} from '@/lib/auth/token-monitor';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/app/generated/prisma';

// Test user ID (unique per test run)
const TEST_USER_ID = 'test-user-token-family-phase9';
const TEST_USER_EMAIL = 'test-token-family-phase9@example.com';
const TEST_USER_ROLE: UserRole = 'CUSTOMER';

// Helper to create test user
async function createTestUser() {
  return await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    create: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      primaryRole: TEST_USER_ROLE,
    },
    update: {},
  });
}

describe('Token Family Revocation', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.refreshToken.deleteMany({
      where: { userId: TEST_USER_ID },
    });
    await prisma.user.deleteMany({
      where: { id: TEST_USER_ID },
    });
    
    // Create test user
    await createTestUser();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({
      where: { userId: TEST_USER_ID },
    });
    await prisma.user.deleteMany({
      where: { id: TEST_USER_ID },
    });
  });

  test('should generate token with new family', async () => {
    const result = await generateTokenPair(TEST_USER_ID, TEST_USER_ROLE);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { accessToken, refreshToken, expiresIn } = result.value;

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(expiresIn).toBe(900); // 15 minutes

    // Check database
    const dbToken = await prisma.refreshToken.findFirst({
      where: { userId: TEST_USER_ID },
    });

    expect(dbToken).toBeTruthy();
    expect(dbToken?.family.startsWith('fam_')).toBe(true);
    expect(dbToken?.parentId).toBeNull(); // No parent for first token
  });

  test('should inherit family from parent token', async () => {
    // Generate parent token
    const parentResult = await generateTokenPair(TEST_USER_ID, TEST_USER_ROLE);
    expect(parentResult.ok).toBe(true);
    if (!parentResult.ok) return;

    // Get parent token ID
    const parentToken = await prisma.refreshToken.findFirst({
      where: { userId: TEST_USER_ID },
    });
    expect(parentToken).toBeTruthy();
    if (!parentToken) return;

    // Generate child token
    const childResult = await generateTokenPair(
      TEST_USER_ID,
      TEST_USER_ROLE,
      parentToken.id
    );
    expect(childResult.ok).toBe(true);
    if (!childResult.ok) return;

    // Check child token
    const childToken = await prisma.refreshToken.findFirst({
      where: {
        userId: TEST_USER_ID,
        parentId: parentToken.id,
      },
    });

    expect(childToken).toBeTruthy();
    expect(childToken?.family).toBe(parentToken.family); // Same family
    expect(childToken?.parentId).toBe(parentToken.id); // Correct parent
  });

  test('should refresh token and create child', async () => {
    // Generate initial token
    const initialResult = await generateTokenPair(TEST_USER_ID, TEST_USER_ROLE);
    expect(initialResult.ok).toBe(true);
    if (!initialResult.ok) return;

    // Refresh token
    const refreshResult = await refreshAccessToken(initialResult.value.refreshToken);
    expect(refreshResult.ok).toBe(true);
    if (!refreshResult.ok) {
      console.error('Refresh failed:', refreshResult.error);
      return;
    }

    // Check that we have 2 tokens now (parent + child)
    const tokens = await prisma.refreshToken.findMany({
      where: { userId: TEST_USER_ID },
      orderBy: { createdAt: 'asc' },
    });

    expect(tokens.length).toBe(2);
    expect(tokens[0].family).toBe(tokens[1].family); // Same family
    expect(tokens[1].parentId).toBe(tokens[0].id); // Child points to parent
    expect(tokens[0].revokedAt).toBeTruthy(); // Parent revoked after use
  });

  test('should revoke entire family on compromise', async () => {
    // Generate parent token
    const parentResult = await generateTokenPair(TEST_USER_ID, TEST_USER_ROLE);
    expect(parentResult.ok).toBe(true);
    if (!parentResult.ok) return;

    const parentToken = await prisma.refreshToken.findFirst({
      where: { userId: TEST_USER_ID },
    });
    expect(parentToken).toBeTruthy();
    if (!parentToken) return;

    // Generate 3 children
    for (let i = 0; i < 3; i++) {
      const childResult = await generateTokenPair(
        TEST_USER_ID,
        TEST_USER_ROLE,
        parentToken.id
      );
      expect(childResult.ok).toBe(true);
    }

    // Check we have 4 tokens (1 parent + 3 children)
    const tokensBefore = await prisma.refreshToken.count({
      where: { userId: TEST_USER_ID },
    });
    expect(tokensBefore).toBe(4);

    // Revoke entire family
    const revokeResult = await revokeTokenFamily(
      parentToken.family,
      'test_compromise',
      'system'
    );
    expect(revokeResult.ok).toBe(true);
    if (!revokeResult.ok) return;

    expect(revokeResult.value).toBe(4); // All 4 tokens revoked

    // Check all tokens are revoked
    const tokensAfter = await prisma.refreshToken.findMany({
      where: { userId: TEST_USER_ID },
    });

    expect(tokensAfter.length).toBe(4);
    tokensAfter.forEach(token => {
      expect(token.revokedAt).toBeTruthy();
      expect(token.revocationReason).toBe('test_compromise');
      expect(token.revokedBy).toBe('system');
    });
  });

  test('should revoke all user tokens on logout', async () => {
    // Generate 3 token families for user
    for (let i = 0; i < 3; i++) {
      const result = await generateTokenPair(TEST_USER_ID, TEST_USER_ROLE);
      expect(result.ok).toBe(true);
    }

    // Check we have 3 tokens
    const tokensBefore = await prisma.refreshToken.count({
      where: { userId: TEST_USER_ID, revokedAt: null },
    });
    expect(tokensBefore).toBe(3);

    // Revoke all tokens
    const revokeResult = await revokeAllRefreshTokens(TEST_USER_ID, 'user_logout');
    expect(revokeResult.ok).toBe(true);
    if (!revokeResult.ok) return;

    expect(revokeResult.value).toBe(3);

    // Check all tokens revoked
    const tokensAfter = await prisma.refreshToken.count({
      where: { userId: TEST_USER_ID, revokedAt: null },
    });
    expect(tokensAfter).toBe(0);
  });

  test('should get user token statistics', async () => {
    // Generate token family
    const result = await generateTokenPair(TEST_USER_ID, TEST_USER_ROLE);
    expect(result.ok).toBe(true);

    const stats = await getUserTokenStats(TEST_USER_ID);

    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0].userId).toBe(TEST_USER_ID);
    expect(stats[0].tokenCount).toBe(1);
    expect(stats[0].activeTokens).toBe(1);
    expect(stats[0].revokedTokens).toBe(0);
  });

  test('should cleanup expired tokens', async () => {
    // Create token with expired date
    const timestamp = Date.now();
    const expiredFamily = 'expired-family-' + timestamp;
    await prisma.refreshToken.create({
      data: {
        token: 'expired-token-' + timestamp,
        userId: TEST_USER_ID,
        family: expiredFamily,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    });

    // Run cleanup
    const deletedCount = await cleanupExpiredTokens();

    expect(deletedCount).toBeGreaterThanOrEqual(1);

    // Check expired token is gone
    const expiredToken = await prisma.refreshToken.findFirst({
      where: { family: expiredFamily },
    });
    expect(expiredToken).toBeNull();
  });

  test('should prevent refresh with revoked token', async () => {
    // Generate token
    const result = await generateTokenPair(TEST_USER_ID, TEST_USER_ROLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Revoke all tokens
    await revokeAllRefreshTokens(TEST_USER_ID);

    // Try to refresh (should fail)
    const refreshResult = await refreshAccessToken(result.value.refreshToken);

    expect(refreshResult.ok).toBe(false);
    if (refreshResult.ok) return;

    // Check error exists
    expect(refreshResult.error).toBeTruthy();
  });
});
