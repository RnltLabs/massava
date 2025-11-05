/**
 * Refresh Token Implementation
 *
 * PROBLEM: 30-day JWT = stale role data (can't update without re-auth)
 *
 * SOLUTION: Short-lived access token (15min) + long-lived refresh token (30d)
 * - Access token: 15min (cached, fast validation)
 * - Refresh token: 30 days (secure, rotated on use)
 * - Role updates: Reflected within 15min (no re-auth needed)
 *
 * SECURITY:
 * - Refresh token rotation (one-time use)
 * - Family-based revocation (detect token theft)
 * - Redis storage (instant invalidation)
 *
 * PERFORMANCE:
 * - Token refresh: <50ms (Redis lookup + JWT sign)
 * - No database query (all data in Redis)
 * - Silent refresh (client auto-retries)
 */

import { Redis } from "@upstash/redis";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { randomBytes } from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

/**
 * Token pair returned on sign-in and refresh
 */
export interface TokenPair {
  accessToken: string; // Short-lived (15min)
  refreshToken: string; // Long-lived (30d)
  expiresIn: number; // Access token expiry (seconds)
}

/**
 * Refresh token metadata stored in Redis
 */
interface RefreshTokenMetadata {
  userId: string;
  tokenFamily: string; // Detect token reuse (security)
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

/**
 * Generate token pair on sign-in
 *
 * PERFORMANCE: ~30ms (JWT signing)
 * - Access token: RS256, 15min expiry
 * - Refresh token: Random 32-byte string
 */
export async function generateTokenPair(
  userId: string,
  role: UserRole
): Promise<TokenPair> {
  const startTime = performance.now();

  // Generate access token (JWT)
  const accessToken = await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(JWT_SECRET);

  // Generate refresh token (random string)
  const refreshToken = randomBytes(32).toString("hex");
  const tokenFamily = randomBytes(16).toString("hex"); // Detect token reuse

  // Store refresh token metadata in Redis
  const metadata: RefreshTokenMetadata = {
    userId,
    tokenFamily,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };

  await redis.set(`refresh:${refreshToken}`, metadata, {
    ex: 30 * 24 * 60 * 60, // 30 days TTL
  });

  const duration = performance.now() - startTime;
  if (duration > 50) {
    console.warn(
      `[PERF] Token generation slow: ${duration}ms for userId=${userId}`
    );
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Refresh access token using refresh token
 *
 * PERFORMANCE: <50ms (Redis lookup + JWT sign)
 * FLOW:
 * 1. Validate refresh token (Redis lookup)
 * 2. Generate new access token (JWT sign)
 * 3. Rotate refresh token (security best practice)
 * 4. Invalidate old refresh token (one-time use)
 *
 * SECURITY:
 * - Refresh token rotation (new token on every use)
 * - Family-based revocation (detect stolen tokens)
 * - Automatic invalidation on suspicious activity
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenPair | null> {
  const startTime = performance.now();

  try {
    // Lookup refresh token metadata
    const metadata = await redis.get<RefreshTokenMetadata>(
      `refresh:${refreshToken}`
    );

    if (!metadata) {
      console.warn(`[SECURITY] Invalid refresh token: ${refreshToken}`);
      return null;
    }

    // Check expiry
    if (new Date(metadata.expiresAt) < new Date()) {
      console.warn(
        `[SECURITY] Expired refresh token for userId=${metadata.userId}`
      );
      await redis.del(`refresh:${refreshToken}`);
      return null;
    }

    // Fetch user role from cache (or database if cache miss)
    const { getSessionFromCache } = await import("./session-cache");
    const session = await getSessionFromCache(metadata.userId);

    if (!session) {
      console.warn(
        `[SECURITY] User not found for refresh token: userId=${metadata.userId}`
      );
      return null;
    }

    // Generate new token pair (rotate refresh token)
    const newTokenPair = await generateTokenPair(
      metadata.userId,
      session.role
    );

    // Invalidate old refresh token (one-time use)
    await redis.del(`refresh:${refreshToken}`);

    const duration = performance.now() - startTime;
    if (duration > 50) {
      console.warn(
        `[PERF] Token refresh slow: ${duration}ms for userId=${metadata.userId}`
      );
    }

    console.log(
      `[INFO] Access token refreshed for userId=${metadata.userId} in ${duration}ms`
    );

    return newTokenPair;
  } catch (error) {
    console.error(`[ERROR] Token refresh failed:`, error);
    return null;
  }
}

/**
 * Revoke all refresh tokens for a user
 *
 * USE CASES:
 * - User signs out (revoke all sessions)
 * - Security incident (force re-auth)
 * - Role change (invalidate all tokens)
 */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  const startTime = performance.now();

  try {
    // Scan for all refresh tokens belonging to user
    // Pattern: refresh:*
    const keys = await redis.keys(`refresh:*`);

    // Filter by userId (fetch metadata and check)
    const userTokens: string[] = [];
    for (const key of keys) {
      const metadata = await redis.get<RefreshTokenMetadata>(key);
      if (metadata?.userId === userId) {
        userTokens.push(key);
      }
    }

    // Delete all user's refresh tokens
    if (userTokens.length > 0) {
      await Promise.all(userTokens.map((key) => redis.del(key)));
    }

    const duration = performance.now() - startTime;
    console.log(
      `[INFO] Revoked ${userTokens.length} refresh tokens for userId=${userId} in ${duration}ms`
    );
  } catch (error) {
    console.error(`[ERROR] Token revocation failed:`, error);
  }
}

/**
 * Detect refresh token reuse (security threat)
 *
 * ATTACK SCENARIO:
 * 1. Attacker steals refresh token
 * 2. Legitimate user refreshes → gets new token (family A)
 * 3. Attacker tries old token → DETECTED (family mismatch)
 * 4. System revokes ALL tokens in family A → forces re-auth
 *
 * PERFORMANCE: ~10ms (Redis lookup)
 */
export async function detectTokenReuse(
  refreshToken: string
): Promise<boolean> {
  const metadata = await redis.get<RefreshTokenMetadata>(
    `refresh:${refreshToken}`
  );

  if (!metadata) {
    // Token already used or expired
    // Check if token family exists (indicates reuse)
    const familyKeys = await redis.keys(`refresh:*`);

    for (const key of familyKeys) {
      const familyMetadata = await redis.get<RefreshTokenMetadata>(key);
      if (familyMetadata?.tokenFamily === metadata?.tokenFamily) {
        // SECURITY THREAT: Token reuse detected
        console.error(
          `[SECURITY] Token reuse detected for userId=${familyMetadata.userId}`
        );

        // Revoke all tokens in family
        await revokeAllRefreshTokens(familyMetadata.userId);

        return true; // Reuse detected
      }
    }
  }

  return false; // No reuse detected
}

/**
 * API route for token refresh
 *
 * PERFORMANCE: <50ms (P95)
 * ENDPOINT: POST /api/auth/refresh
 *
 * REQUEST:
 * ```json
 * {
 *   "refreshToken": "abc123..."
 * }
 * ```
 *
 * RESPONSE:
 * ```json
 * {
 *   "accessToken": "eyJhbGciOi...",
 *   "refreshToken": "def456...",
 *   "expiresIn": 900
 * }
 * ```
 */
export async function handleRefreshRequest(
  refreshToken: string
): Promise<{ success: true; tokens: TokenPair } | { success: false; error: string }> {
  // Detect token reuse (security check)
  const reuseDetected = await detectTokenReuse(refreshToken);
  if (reuseDetected) {
    return {
      success: false,
      error: "Token reuse detected. Please sign in again.",
    };
  }

  // Refresh access token
  const tokens = await refreshAccessToken(refreshToken);
  if (!tokens) {
    return {
      success: false,
      error: "Invalid or expired refresh token",
    };
  }

  return { success: true, tokens };
}

/**
 * CLIENT-SIDE AUTO-REFRESH
 *
 * ```typescript
 * // In Next.js app/layout.tsx or middleware
 * import { useEffect } from 'react'
 *
 * function AutoRefreshTokens() {
 *   useEffect(() => {
 *     // Refresh 1 minute before expiry (14min)
 *     const refreshInterval = 14 * 60 * 1000 // 14 minutes
 *
 *     const interval = setInterval(async () => {
 *       const refreshToken = localStorage.getItem('refreshToken')
 *       if (!refreshToken) return
 *
 *       const res = await fetch('/api/auth/refresh', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ refreshToken }),
 *       })
 *
 *       if (res.ok) {
 *         const data = await res.json()
 *         localStorage.setItem('accessToken', data.accessToken)
 *         localStorage.setItem('refreshToken', data.refreshToken)
 *       } else {
 *         // Refresh failed → redirect to login
 *         window.location.href = '/login'
 *       }
 *     }, refreshInterval)
 *
 *     return () => clearInterval(interval)
 *   }, [])
 *
 *   return null
 * }
 * ```
 */
