/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Update Password with Reset Token
 * POST /api/auth/update-password
 *
 * SECURITY FIXES:
 * - CR-001: Rate limiting added (5 attempts per 15 minutes)
 * - CR-003: Use unified password validation (min 10 chars + uppercase + number)
 * - CR-004: Structured logging with correlation IDs
 * - CR-006: Correlation IDs in all error responses
 * - CR-008: Email normalization with toLowerCase().trim()
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { unifiedPasswordSchema } from '@/lib/validation';
import { rateLimitByIP } from '@/lib/auth/rate-limit';
import { logger, generateCorrelationId } from '@/lib/logger';

// SECURITY FIX #3: Use unified password validation schema
const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: unifiedPasswordSchema,
});

type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId();

  try {
    // SECURITY FIX #1: Rate limiting - 5 attempts per 15 minutes
    const rateLimit = await rateLimitByIP(request, {
      maxRequests: 5,
      windowSeconds: 15 * 60, // 15 minutes
    });

    if (rateLimit.limited) {
      logger.warn('Password update rate limit exceeded', {
        action: 'PASSWORD_UPDATE_RATE_LIMIT',
        correlationId,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Too many password update attempts. Please try again later.',
          correlationId,
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body: unknown = await request.json();
    const validationResult = updatePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Invalid password update request', {
        action: 'PASSWORD_UPDATE_INVALID',
        correlationId,
        errors: validationResult.error.flatten().fieldErrors,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
          correlationId,
        },
        { status: 400 }
      );
    }

    const { token, password }: UpdatePasswordRequest = validationResult.data;

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

    // Validate token
    if (!resetToken) {
      logger.warn('Password update attempted with invalid token', {
        action: 'PASSWORD_UPDATE_INVALID_TOKEN',
        correlationId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
          correlationId,
        },
        { status: 404 }
      );
    }

    if (resetToken.used) {
      logger.warn('Password update attempted with used token', {
        action: 'PASSWORD_UPDATE_TOKEN_USED',
        correlationId,
        email: resetToken.email,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Token has already been used',
          correlationId,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    if (resetToken.expiresAt < now) {
      logger.warn('Password update attempted with expired token', {
        action: 'PASSWORD_UPDATE_TOKEN_EXPIRED',
        correlationId,
        email: resetToken.email,
        expiresAt: resetToken.expiresAt,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Token has expired',
          expired: true,
          correlationId,
        },
        { status: 400 }
      );
    }

    // SECURITY FIX #8: Normalize email
    const normalizedEmail = resetToken.email.toLowerCase().trim();

    // Hash password server-side
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    logger.info('Password updated successfully', {
      action: 'PASSWORD_UPDATE_SUCCESS',
      correlationId,
      email: normalizedEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      correlationId,
    });
  } catch (error) {
    // SECURITY FIX #4: Structured logging instead of console.error
    logger.error('Password update error', {
      action: 'PASSWORD_UPDATE_ERROR',
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // SECURITY FIX #6: Include correlation ID in error response
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred updating your password',
        correlationId,
      },
      { status: 500 }
    );
  }
}
