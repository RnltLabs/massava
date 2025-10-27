/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Verification System
 * STRATEGY.md Section 8.2 - Phase 2
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate email verification token and store in database
 * @param email - Email address to verify
 * @returns Verification token (64 hex characters)
 */
export async function generateEmailVerificationToken(email: string): Promise<string> {
  // 1. Generate cryptographically secure token
  const token = randomBytes(32).toString('hex'); // 64 hex chars

  // 2. Set expiration (24 hours)
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

  // 3. Delete any existing tokens for this email
  await prisma.emailVerificationToken.deleteMany({
    where: { email }
  });

  // 4. Store in database
  await prisma.emailVerificationToken.create({
    data: {
      token,
      email,
      expiresAt,
      used: false,
    }
  });

  return token;
}

/**
 * Verify email verification token
 * @param token - Token from verification URL
 * @returns Email address if valid, null if invalid/expired/used
 */
export async function verifyEmailVerificationToken(token: string): Promise<string | null> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token }
  });

  // Validation
  if (!record) return null;  // Token doesn't exist
  if (record.used) return null;  // Already used (replay attack prevention)
  if (record.expiresAt < new Date()) return null;  // Expired

  // Mark as used (one-time use enforcement)
  await prisma.emailVerificationToken.update({
    where: { token },
    data: { used: true }
  });

  return record.email;
}

/**
 * Generate email verification URL
 * @param email - Email address to verify
 * @returns Full verification URL
 */
export async function generateEmailVerificationURL(email: string): Promise<string> {
  const token = await generateEmailVerificationToken(email);
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const basePath = process.env.NODE_ENV === 'production' ? '/massava' : '';
  return `${baseUrl}${basePath}/auth/verify-email?token=${token}`;
}

/**
 * Generate email verification token (without creating URL)
 * Used by email sending service
 * @param email - Email address to verify
 * @returns Verification token only
 */

/**
 * Mark email as verified in database
 * @param email - Email address to mark as verified
 * @param userType - 'customer' or 'studio-owner'
 */
export async function markEmailAsVerified(email: string, userType: 'customer' | 'studio-owner'): Promise<void> {
  if (userType === 'customer') {
    await prisma.customer.update({
      where: { email },
      data: { emailVerified: new Date() }
    });
  } else {
    await prisma.studioOwner.update({
      where: { email },
      data: { emailVerified: new Date() }
    });
  }
}
