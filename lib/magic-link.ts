/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Magic Link Generation and Verification
 * Implements STRATEGY.md Section 5.2 (Magic Link Security)
 */

import { randomBytes } from 'crypto';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a cryptographically secure magic link token
 */
export async function generateMagicLink(email: string): Promise<string> {
  // 1. Generate cryptographically secure token
  const token = randomBytes(32).toString('hex'); // 64 hex chars

  // 2. Set expiration
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

  // 3. Store in database
  await prisma.magicLinkToken.create({
    data: {
      token,
      email,
      expiresAt,
      used: false,
    },
  });

  // 4. Generate URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/auth/magic-link?token=${token}`;
}

/**
 * Verify magic link token and return email if valid
 * Returns null if token is invalid, expired, or already used
 */
export async function verifyMagicLink(token: string): Promise<string | null> {
  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
  });

  // Validation
  if (!record) return null; // Token doesn't exist
  if (record.used) return null; // Already used (replay attack prevention)
  if (record.expiresAt < new Date()) return null; // Expired

  // Mark as used (one-time use enforcement)
  await prisma.magicLinkToken.update({
    where: { token },
    data: { used: true },
  });

  // Verify email on first magic link use
  const user = await prisma.user.findUnique({
    where: { email: record.email },
  });

  if (user && !user.emailVerified) {
    await prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() },
    });
  }

  return record.email;
}

/**
 * Clean up expired magic link tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.magicLinkToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Invalidate all magic link tokens for an email
 * (useful when user changes email or requests token revocation)
 */
export async function invalidateTokensForEmail(email: string): Promise<number> {
  const result = await prisma.magicLinkToken.deleteMany({
    where: { email },
  });

  return result.count;
}
