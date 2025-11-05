/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * GDPR Data Deletion API - Art. 17 (Right to Erasure)
 * Allows users to request deletion of their personal data
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';
import { sendDeletionConfirmationEmail } from '@/lib/notifications/deletion-notifier';
import { z } from 'zod';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// Request validation schema
const DeleteRequestSchema = z.object({
  userId: z.string().cuid(),
  confirmEmail: z.string().email(),
  reason: z.string().optional(),
  locale: z.enum(['de', 'en']).optional().default('de'),
});

/**
 * Soft delete user account (GDPR Art. 17)
 * POST /api/gdpr/delete-data
 *
 * This performs a soft delete, marking the user as deleted.
 * Actual deletion happens after 30-day grace period.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = DeleteRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid delete data request', {
        correlationId,
        errors: validation.error.issues,
        action: 'GDPR_DELETE_DATA',
      });

      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { userId, confirmEmail, reason, locale } = validation.data;

    // P0.2 FIX: Verify authentication - user can only delete their own data
    const session = await auth();

    if (!session || !session.user) {
      logger.warn('Unauthenticated GDPR delete attempt', {
        correlationId,
        action: 'GDPR_DELETE_DATA',
      });

      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // P0.2 FIX: IDOR Prevention - verify user can only delete their own data
    if (session.user.id !== userId) {
      logger.warn('Unauthorized GDPR delete attempt', {
        correlationId,
        sessionUserId: session.user.id,
        requestedUserId: userId,
        action: 'GDPR_DELETE_DATA',
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    logger.info('Starting data deletion request', {
      correlationId,
      userId,
      reason,
      action: 'GDPR_DELETE_DATA',
    });

    // Fetch user to verify existence and email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
      },
    });

    if (!user) {
      logger.warn('User not found for deletion', {
        correlationId,
        userId,
        action: 'GDPR_DELETE_DATA',
      });

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify email confirmation matches
    if (user.email !== confirmEmail) {
      logger.warn('Email confirmation mismatch for deletion', {
        correlationId,
        userId,
        action: 'GDPR_DELETE_DATA',
      });

      return NextResponse.json(
        {
          error: 'Email confirmation does not match',
          message: 'The confirmation email must match your account email',
        },
        { status: 400 }
      );
    }

    // Check if already deleted
    if (user.deletedAt) {
      logger.warn('User already marked for deletion', {
        correlationId,
        userId,
        deletedAt: user.deletedAt,
        action: 'GDPR_DELETE_DATA',
      });

      return NextResponse.json(
        {
          error: 'Account already scheduled for deletion',
          message: 'Your account is already scheduled for deletion',
          deletedAt: user.deletedAt,
        },
        { status: 400 }
      );
    }

    // Perform soft delete
    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: now,
        isActive: false,
      },
    });

    // Create audit log for deletion request
    await createAuditLog({
      userId,
      action: 'ACCOUNT_DELETION_REQUESTED',
      resource: 'user',
      resourceId: userId,
      metadata: {
        reason: reason || 'User requested deletion',
        confirmEmail,
        deletedAt: now,
        gracePeriodEnds: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
      request,
    });

    // Send confirmation email
    const emailResult = await sendDeletionConfirmationEmail(
      user.email,
      user.name || 'User',
      locale
    );

    if (!emailResult.success) {
      logger.warn('Failed to send deletion confirmation email', {
        correlationId,
        userId,
        error: emailResult.error,
        action: 'GDPR_DELETE_DATA',
      });
    }

    logger.info('User marked for deletion', {
      correlationId,
      userId,
      deletedAt: now,
      gracePeriodEnds: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      action: 'GDPR_DELETE_DATA',
    });

    return NextResponse.json({
      success: true,
      message: 'Your account has been scheduled for deletion',
      details: {
        deletedAt: now,
        gracePeriodEnds: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        permanentDeletionIn: '30 days',
      },
      gdprInfo: {
        article: 'GDPR Article 17 - Right to Erasure',
        gracePeriod: '30 days before permanent deletion',
        whatIsDeleted: [
          'User profile and personal data',
          'Booking history (non-health data)',
          'Health-related messages in bookings',
          'Account credentials',
          'Favorites and preferences',
        ],
        whatIsPreserved: [
          'Invoices (10 years - legal tax requirement)',
          'Anonymized audit logs (for security)',
        ],
        cancelDeletion: {
          message: 'You can cancel this deletion within 30 days by logging in',
          url: `${process.env.NEXT_PUBLIC_APP_URL}/account/cancel-deletion`,
        },
      },
    });
  } catch (error) {
    logger.error('Data deletion failed', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'GDPR_DELETE_DATA',
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * Cancel scheduled deletion (within 30-day grace period)
 * PUT /api/gdpr/delete-data
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const correlationId = getCorrelationId(request);

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // P0.2 FIX: Verify authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // P0.2 FIX: IDOR Prevention - verify user can only cancel their own deletion
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    logger.info('Cancelling scheduled deletion', {
      correlationId,
      userId,
      action: 'CANCEL_DELETION',
    });

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is actually scheduled for deletion
    if (!user.deletedAt) {
      return NextResponse.json(
        {
          error: 'No deletion scheduled',
          message: 'Your account is not scheduled for deletion',
        },
        { status: 400 }
      );
    }

    // Check if grace period has expired
    const now = new Date();
    const gracePeriodEnd = new Date(user.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (now > gracePeriodEnd) {
      logger.warn('Attempted to cancel deletion after grace period', {
        correlationId,
        userId,
        deletedAt: user.deletedAt,
        gracePeriodEnd,
        action: 'CANCEL_DELETION',
      });

      return NextResponse.json(
        {
          error: 'Grace period expired',
          message: 'The 30-day grace period has expired. Your account cannot be recovered.',
        },
        { status: 400 }
      );
    }

    // Cancel deletion
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        isActive: true,
        deletionScheduledAt: null,
        updatedAt: now, // Update activity timestamp
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'USER_UPDATED',
      resource: 'user',
      resourceId: userId,
      metadata: {
        action: 'deletion_cancelled',
        previousDeletedAt: user.deletedAt,
      },
      request,
    });

    logger.info('Deletion cancelled successfully', {
      correlationId,
      userId,
      action: 'CANCEL_DELETION',
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion has been cancelled',
      details: {
        accountRestored: true,
        restoredAt: now,
      },
    });
  } catch (error) {
    logger.error('Cancel deletion failed', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'CANCEL_DELETION',
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET method - Check deletion status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = getCorrelationId(request);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // P0.2 FIX: Verify authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // P0.2 FIX: IDOR Prevention - verify user can only check their own deletion status
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        deletedAt: true,
        deletionScheduledAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.deletedAt) {
      return NextResponse.json({
        scheduled: false,
        message: 'No deletion scheduled',
      });
    }

    const now = new Date();
    const gracePeriodEnd = new Date(user.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return NextResponse.json({
      scheduled: true,
      deletedAt: user.deletedAt,
      gracePeriodEnds: gracePeriodEnd,
      daysRemaining,
      canCancel: daysRemaining > 0,
    });
  } catch (error) {
    logger.error('Check deletion status failed', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'CHECK_DELETION_STATUS',
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    );
  }
}
