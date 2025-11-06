"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Verification System
 * STRATEGY.md Section 8.2 - Phase 2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmailVerificationToken = generateEmailVerificationToken;
exports.verifyEmailVerificationToken = verifyEmailVerificationToken;
exports.generateEmailVerificationURL = generateEmailVerificationURL;
exports.markEmailAsVerified = markEmailAsVerified;
const crypto_1 = require("crypto");
const prisma_1 = require("@/lib/prisma");
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
/**
 * Generate email verification token and store in database
 * @param email - Email address to verify
 * @returns Verification token (64 hex characters)
 */
async function generateEmailVerificationToken(email) {
    // 1. Generate cryptographically secure token
    const token = (0, crypto_1.randomBytes)(32).toString('hex'); // 64 hex chars
    // 2. Set expiration (24 hours)
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);
    // 3. Delete any existing tokens for this email
    await prisma_1.prisma.emailVerificationToken.deleteMany({
        where: { email }
    });
    // 4. Store in database
    await prisma_1.prisma.emailVerificationToken.create({
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
async function verifyEmailVerificationToken(token) {
    const record = await prisma_1.prisma.emailVerificationToken.findUnique({
        where: { token }
    });
    // Validation
    if (!record)
        return null; // Token doesn't exist
    if (record.used)
        return null; // Already used (replay attack prevention)
    if (record.expiresAt < new Date())
        return null; // Expired
    // Mark as used (one-time use enforcement)
    await prisma_1.prisma.emailVerificationToken.update({
        where: { token },
        data: { used: true }
    });
    return record.email;
}
/**
 * Generate email verification URL
 * @param email - Email address to verify
 * @param locale - Locale for the URL (e.g., 'de', 'en')
 * @returns Full verification URL with locale prefix
 */
async function generateEmailVerificationURL(email, locale = 'de') {
    const token = await generateEmailVerificationToken(email);
    // NEXTAUTH_URL contains the base URL
    // Since migration to massava.app, no basePath is used
    let baseUrl = process.env.NEXTAUTH_URL;
    // If NEXTAUTH_URL is not set, try to extract from AUTH_URL
    if (!baseUrl && process.env.AUTH_URL) {
        // Remove /api/auth suffix from AUTH_URL to get base URL
        baseUrl = process.env.AUTH_URL.replace(/\/api\/auth$/, '');
    }
    // Fallback to localhost for development
    if (!baseUrl) {
        baseUrl = 'http://localhost:3000';
    }
    // Include locale prefix as required by next-intl with localePrefix: 'always'
    return `${baseUrl}/${locale}/auth/verify-email?token=${token}`;
}
/**
 * Generate email verification token (without creating URL)
 * Used by email sending service
 * @param email - Email address to verify
 * @returns Verification token only
 */
/**
 * Mark email as verified in database (Unified User Model)
 * @param email - Email address to mark as verified
 */
async function markEmailAsVerified(email) {
    await prisma_1.prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() }
    });
}
