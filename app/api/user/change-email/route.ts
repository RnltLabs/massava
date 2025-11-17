/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Change Request API Route
 * POST /api/user/change-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';
import { authRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { sendEmailChangeVerification } from '@/lib/email/send';
import crypto from 'crypto';

// Validation schema
const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  locale: z.string().optional().default('de'),
});

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Rate limiting: 5 attempts per hour per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = authRateLimit(clientIp);

    if (!rateLimitResult.success) {
      logger.warn('Email change rate limit exceeded', {
        correlationId,
        ipAddress,
        action: 'CHANGE_EMAIL_REQUEST',
        resource: 'user',
      });
      return NextResponse.json(
        rateLimitErrorResponse(rateLimitResult),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      logger.warn('Unauthorized email change request', {
        correlationId,
        ipAddress,
        action: 'CHANGE_EMAIL_REQUEST',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = changeEmailSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid email change request', {
        correlationId,
        ipAddress,
        action: 'CHANGE_EMAIL_REQUEST',
        errors: validation.error.flatten().fieldErrors,
      });
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { newEmail, locale } = validation.data;
    const normalizedNewEmail = newEmail.toLowerCase().trim();
    const currentEmail = session.user.email.toLowerCase().trim();

    // Check if new email is same as current
    if (normalizedNewEmail === currentEmail) {
      logger.warn('New email same as current', {
        correlationId,
        ipAddress,
        action: 'CHANGE_EMAIL_REQUEST',
        email: currentEmail,
      });
      return NextResponse.json(
        { error: 'New email must be different from current email' },
        { status: 400 }
      );
    }

    // Check if new email already exists (prevent email enumeration by not revealing)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedNewEmail },
    });

    if (existingUser) {
      logger.warn('Email change requested with existing email', {
        correlationId,
        ipAddress,
        action: 'CHANGE_EMAIL_REQUEST',
        newEmail: normalizedNewEmail,
        currentEmail,
      });
      // Don't reveal that email exists - return success
      return NextResponse.json({
        success: true,
        message: 'Verification email sent to new address',
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: currentEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      logger.error('User not found for email change', {
        correlationId,
        ipAddress,
        action: 'CHANGE_EMAIL_REQUEST',
        email: currentEmail,
      });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate secure token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store token in database
    await prisma.emailChangeToken.create({
      data: {
        token,
        userId: user.id,
        oldEmail: currentEmail,
        newEmail: normalizedNewEmail,
        expiresAt,
        used: false,
      },
    });

    // Generate verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/${locale}/account/verify-email-change?token=${token}`;

    // Send verification email to NEW email address
    const emailResult = await sendEmailChangeVerification(
      normalizedNewEmail,
      user.name || 'User',
      normalizedNewEmail,
      verificationUrl,
      currentEmail,
      locale
    );

    if (!emailResult.success) {
      logger.error('Failed to send email change verification', {
        correlationId,
        ipAddress,
        action: 'CHANGE_EMAIL_REQUEST',
        email: normalizedNewEmail,
        error: emailResult.error,
      });
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    logger.info('Email change verification sent', {
      correlationId,
      ipAddress,
      action: 'CHANGE_EMAIL_REQUEST',
      userId: user.id,
      oldEmail: currentEmail,
      newEmail: normalizedNewEmail,
      messageId: emailResult.messageId,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent to new address',
    });

  } catch (error) {
    logger.error('Email change request exception', {
      correlationId,
      ipAddress,
      action: 'CHANGE_EMAIL_REQUEST',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
