/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Change Verification API Route
 * POST /api/user/verify-email-change
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';

// Validation schema
const verifyEmailChangeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = verifyEmailChangeSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid email change verification request', {
        correlationId,
        ipAddress,
        action: 'VERIFY_EMAIL_CHANGE',
        errors: validation.error.flatten().fieldErrors,
      });
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Find token in database
    const emailChangeToken = await prisma.emailChangeToken.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        oldEmail: true,
        newEmail: true,
        expiresAt: true,
        used: true,
      },
    });

    if (!emailChangeToken) {
      logger.warn('Invalid email change token', {
        correlationId,
        ipAddress,
        action: 'VERIFY_EMAIL_CHANGE',
      });
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (emailChangeToken.used) {
      logger.warn('Email change token already used', {
        correlationId,
        ipAddress,
        action: 'VERIFY_EMAIL_CHANGE',
        userId: emailChangeToken.userId,
      });
      return NextResponse.json(
        { error: 'This verification link has already been used' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > emailChangeToken.expiresAt) {
      logger.warn('Email change token expired', {
        correlationId,
        ipAddress,
        action: 'VERIFY_EMAIL_CHANGE',
        userId: emailChangeToken.userId,
        expiresAt: emailChangeToken.expiresAt,
      });
      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if new email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: emailChangeToken.newEmail },
    });

    if (existingUser && existingUser.id !== emailChangeToken.userId) {
      logger.warn('Email change conflict - email already taken', {
        correlationId,
        ipAddress,
        action: 'VERIFY_EMAIL_CHANGE',
        userId: emailChangeToken.userId,
        newEmail: emailChangeToken.newEmail,
      });
      return NextResponse.json(
        { error: 'This email address is already in use' },
        { status: 409 }
      );
    }

    // Start transaction to update email and mark token as used
    await prisma.$transaction(async (tx) => {
      // Update user's email
      await tx.user.update({
        where: { id: emailChangeToken.userId },
        data: { email: emailChangeToken.newEmail },
      });

      // Mark token as used
      await tx.emailChangeToken.update({
        where: { id: emailChangeToken.id },
        data: { used: true },
      });

      // Optional: Delete all sessions for this user (force re-login)
      // This is recommended for security
      await tx.newSession.deleteMany({
        where: { userId: emailChangeToken.userId },
      });
    });

    logger.info('Email changed successfully', {
      correlationId,
      ipAddress,
      action: 'VERIFY_EMAIL_CHANGE',
      userId: emailChangeToken.userId,
      oldEmail: emailChangeToken.oldEmail,
      newEmail: emailChangeToken.newEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Email address changed successfully',
      redirectUrl: '/auth/login',
    });

  } catch (error) {
    logger.error('Email change verification exception', {
      correlationId,
      ipAddress,
      action: 'VERIFY_EMAIL_CHANGE',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
