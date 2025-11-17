/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Password Reset Request
 * POST /api/auth/reset-password
 *
 * SECURITY FIXES:
 * - CR-001: Rate limiting added (5 attempts per 15 minutes)
 * - CR-004: Structured logging with correlation IDs
 * - CR-006: Correlation IDs in all error responses
 * - CR-007: Race condition prevention (delete existing tokens)
 * - CR-008: Email normalization with toLowerCase().trim()
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email/send';
import { randomBytes } from 'crypto';
import { rateLimitByIP } from '@/lib/auth/rate-limit';
import { logger, generateCorrelationId } from '@/lib/logger';

// Security constants
const RESET_TOKEN_BYTES = 32; // Length of cryptographic token (256 bits)
const RATE_LIMIT_MAX_REQUESTS = 5; // Maximum password reset requests
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 15 minutes in seconds

// Validation schema
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.string().optional().default('de'),
});

type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId();

  try {
    // SECURITY FIX #1: Rate limiting - 5 attempts per 15 minutes
    const rateLimit = await rateLimitByIP(request, {
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });

    if (rateLimit.limited) {
      logger.warn('Password reset rate limit exceeded', {
        action: 'PASSWORD_RESET_RATE_LIMIT',
        correlationId,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Too many password reset attempts. Please try again later.',
          correlationId,
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body: unknown = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Invalid password reset request', {
        action: 'PASSWORD_RESET_INVALID',
        correlationId,
        errors: validationResult.error.flatten().fieldErrors,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
          correlationId,
        },
        { status: 400 }
      );
    }

    const { email, locale }: ResetPasswordRequest = validationResult.data;

    // SECURITY FIX #8: Normalize email consistently
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    // Note: For security, we always return success even if user doesn't exist
    // This prevents email enumeration attacks
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, isActive: true },
    });

    // If user exists and is active, create reset token
    if (user && user.isActive) {
      // SECURITY FIX #7: Delete existing unused valid tokens to prevent race conditions
      // Use Date objects for Prisma DateTime comparisons (not timestamps)
      const now = new Date();
      await prisma.passwordResetToken.deleteMany({
        where: {
          email: user.email,
          used: false,
          expiresAt: { gte: now },
        },
      });

      // Generate secure random token
      const resetToken = randomBytes(RESET_TOKEN_BYTES).toString('hex');

      // Create expiry time (configurable via environment variable, defaults to 1 hour)
      const expiryHours = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS || '1', 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          email: user.email,
          expiresAt,
          used: false,
        },
      });

      // Generate reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${locale}/auth/reset-password/${resetToken}`;

      // Send password reset email
      const emailResult = await sendPasswordResetEmail(
        user.email,
        resetUrl,
        locale
      );

      if (!emailResult.success) {
        // SECURITY FIX #4: Structured logging instead of console.error
        logger.error('Failed to send password reset email', {
          action: 'PASSWORD_RESET_EMAIL_FAILED',
          correlationId,
          email: user.email,
          error: emailResult.error,
        });
        // Don't expose email sending errors to the client
      } else {
        logger.info('Password reset email sent', {
          action: 'PASSWORD_RESET_EMAIL_SENT',
          correlationId,
          email: user.email,
        });
      }
    } else {
      logger.info('Password reset requested for non-existent or inactive user', {
        action: 'PASSWORD_RESET_USER_NOT_FOUND',
        correlationId,
        email: normalizedEmail,
      });
    }

    // Always return success for security
    // This prevents attackers from determining if an email exists in the system
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      correlationId,
    });
  } catch (error) {
    // SECURITY FIX #4: Structured logging instead of console.error
    logger.error('Password reset request error', {
      action: 'PASSWORD_RESET_ERROR',
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // SECURITY FIX #6: Include correlation ID in error response
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred processing your request',
        correlationId,
      },
      { status: 500 }
    );
  }
}
