/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Verify Password Reset Token
 * POST /api/auth/verify-reset-token
 *
 * SECURITY FIXES:
 * - CR-001: Rate limiting added (5 attempts per 15 minutes)
 * - CR-002: Invalidate token after 5 failed attempts
 * - CR-004: Structured logging with correlation IDs
 * - CR-006: Correlation IDs in all error responses
 * - CR-008: Email normalization with toLowerCase().trim()
 * - CR-010: Generic error messages to prevent timing attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimitByIP } from '@/lib/auth/rate-limit';
import { logger, generateCorrelationId } from '@/lib/logger';

// Validation schema
const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

type VerifyTokenRequest = z.infer<typeof verifyTokenSchema>;

// Track failed verification attempts per token (in-memory for simplicity)
// In production, consider using Redis for distributed systems
const failedAttempts = new Map<string, number>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId();

  try {
    // SECURITY FIX #1: Rate limiting - 5 attempts per 15 minutes
    const rateLimit = await rateLimitByIP(request, {
      maxRequests: 5,
      windowSeconds: 15 * 60, // 15 minutes
    });

    if (rateLimit.limited) {
      logger.warn('Token verification rate limit exceeded', {
        action: 'TOKEN_VERIFY_RATE_LIMIT',
        correlationId,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      });

      return NextResponse.json(
        {
          valid: false,
          error: 'Too many verification attempts. Please try again later.',
          correlationId,
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body: unknown = await request.json();
    const validationResult = verifyTokenSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Invalid token verification request', {
        action: 'TOKEN_VERIFY_INVALID',
        correlationId,
        errors: validationResult.error.flatten().fieldErrors,
      });

      // SECURITY FIX #10: Generic error message to prevent timing attacks
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired token',
          correlationId,
        },
        { status: 400 }
      );
    }

    const { token }: VerifyTokenRequest = validationResult.data;

    // SECURITY FIX #2: Check failed attempts for this token
    const attempts = failedAttempts.get(token) || 0;
    if (attempts >= 5) {
      logger.warn('Token invalidated due to too many failed attempts', {
        action: 'TOKEN_VERIFY_INVALIDATED',
        correlationId,
        attempts,
      });

      // Invalidate token in database
      await prisma.passwordResetToken.updateMany({
        where: { token, used: false },
        data: { used: true },
      });

      // Clean up failed attempts tracking
      failedAttempts.delete(token);

      // SECURITY FIX #10: Generic error message
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired token',
          correlationId,
        },
        { status: 400 }
      );
    }

    // Find token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        used: true,
      },
    });

    // SECURITY FIX #10: Generic error message for all invalid cases (timing attack prevention)
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      // SECURITY FIX #2: Track failed attempt
      failedAttempts.set(token, attempts + 1);

      logger.warn('Token verification failed', {
        action: 'TOKEN_VERIFY_FAILED',
        correlationId,
        tokenExists: !!resetToken,
        used: resetToken?.used,
        expired: resetToken ? resetToken.expiresAt < new Date() : false,
        attempts: attempts + 1,
      });

      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired token',
          correlationId,
        },
        { status: 400 }
      );
    }

    // Token is valid - clear any failed attempts
    failedAttempts.delete(token);

    // SECURITY FIX #8: Normalize email
    const normalizedEmail = resetToken.email.toLowerCase().trim();

    logger.info('Token verification successful', {
      action: 'TOKEN_VERIFY_SUCCESS',
      correlationId,
      email: normalizedEmail,
    });

    // Token is valid
    return NextResponse.json({
      valid: true,
      email: normalizedEmail,
      correlationId,
    });
  } catch (error) {
    // SECURITY FIX #4: Structured logging instead of console.error
    logger.error('Token verification error', {
      action: 'TOKEN_VERIFY_ERROR',
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // SECURITY FIX #6: Include correlation ID in error response
    // SECURITY FIX #10: Generic error message
    return NextResponse.json(
      {
        valid: false,
        error: 'Invalid or expired token',
        correlationId,
      },
      { status: 500 }
    );
  }
}
