/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * GDPR Art. 17 - Right to Erasure ("Right to be Forgotten")
 * Delete all user data in a transaction
 * STRATEGY.md Section 8.2 - Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@/app/generated/prisma';
import { logger, getCorrelationId, getClientIP, getUserAgent } from '@/lib/logger';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const session = await auth();

    if (!session?.user?.email) {
      logger.warn('Unauthorized account deletion attempt', {
        correlationId,
        ipAddress,
        action: 'DELETE_USER_ACCOUNT',
        resource: 'user',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    // Find unified User model
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedStudios: {
          select: { id: true, studioId: true },
        },
      },
    });

    if (!user) {
      logger.warn('Account deletion failed: User not found', {
        correlationId,
        ipAddress,
        email,
        action: 'DELETE_USER_ACCOUNT',
        resource: 'user',
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Studio owners cannot delete account if they have studios
    if (user.ownedStudios.length > 0) {
      logger.warn('Studio owner deletion blocked: Studios exist', {
        correlationId,
        ipAddress,
        email,
        userId: user.id,
        action: 'DELETE_USER_ACCOUNT',
        resource: 'user',
        studiosCount: user.ownedStudios.length,
      });
      return NextResponse.json(
        {
          error:
            'Kontolöschung nicht möglich. Bitte löschen Sie zuerst alle Ihre Studios.',
          studiosCount: user.ownedStudios.length,
        },
        { status: 400 }
      );
    }

    // Perform deletion in transaction (GDPR Art. 17)
    await prisma.$transaction([
      // Delete OAuth accounts
      prisma.newAccount.deleteMany({
        where: { userId: user.id },
      }),
      // Delete sessions
      prisma.newSession.deleteMany({
        where: { userId: user.id },
      }),
      // Delete studio ownerships
      prisma.studioOwnership.deleteMany({
        where: { userId: user.id },
      }),
      // Delete role assignments
      prisma.userRoleAssignment.deleteMany({
        where: { userId: user.id },
      }),
      // Delete bookings
      prisma.newBooking.deleteMany({
        where: { customerId: user.id },
      }),
      // Delete audit logs
      prisma.auditLog.deleteMany({
        where: { userId: user.id },
      }),
      // Delete user
      prisma.user.delete({
        where: { email },
      }),
    ]);

    logger.info('User account deleted successfully', {
      correlationId,
      ipAddress,
      userAgent,
      email,
      userId: user.id,
      action: 'DELETE_USER_ACCOUNT',
      resource: 'user',
      resourceId: user.id,
    });

    // Delete email verification tokens (cleanup)
    await prisma.emailVerificationToken.deleteMany({
      where: { email },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Ihr Konto wurde erfolgreich gelöscht. Alle personenbezogenen Daten wurden entfernt.',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Account deletion failed', {
      correlationId,
      ipAddress,
      userAgent,
      action: 'DELETE_USER_ACCOUNT',
      resource: 'user',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error:
          'Kontolöschung fehlgeschlagen. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 }
    );
  }
}
