/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * GDPR Art. 17 - Right to Erasure ("Right to be Forgotten")
 * Delete all user data in a transaction
 * STRATEGY.md Section 8.2 - Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth-unified';
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

    // Check if user is a customer or studio owner
    const customer = await prisma.customer.findUnique({
      where: { email },
      include: {
        bookings: {
          select: { id: true },
        },
      },
    });

    const studioOwner = await prisma.studioOwner.findUnique({
      where: { email },
    });

    // Also check new unified User model
    const unifiedUser = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedStudios: {
          select: { id: true, studioId: true },
        },
      },
    });

    if (!customer && !studioOwner && !unifiedUser) {
      logger.warn('Account deletion failed: User not found', {
        correlationId,
        ipAddress,
        email,
        action: 'DELETE_USER_ACCOUNT',
        resource: 'user',
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Perform deletion in transaction (GDPR Art. 17)
    if (customer) {
      await prisma.$transaction([
        // Delete all bookings (cascade will handle relations)
        prisma.booking.deleteMany({
          where: { customerEmail: email },
        }),
        // Delete customer (cascade will handle favorites)
        prisma.customer.delete({
          where: { email },
        }),
      ]);

      logger.info('Customer account deleted successfully', {
        correlationId,
        ipAddress,
        userAgent,
        email,
        userId: customer.id,
        action: 'DELETE_USER_ACCOUNT',
        resource: 'customer',
        resourceId: customer.id,
        bookingsDeleted: customer.bookings.length,
      });
    } else if (unifiedUser) {
      // Studio owners cannot delete account if they have studios
      if (unifiedUser.ownedStudios.length > 0) {
        logger.warn('Studio owner deletion blocked: Studios exist', {
          correlationId,
          ipAddress,
          email,
          userId: unifiedUser.id,
          action: 'DELETE_USER_ACCOUNT',
          resource: 'user',
          studiosCount: unifiedUser.ownedStudios.length,
        });
        return NextResponse.json(
          {
            error:
              'Kontolöschung nicht möglich. Bitte löschen Sie zuerst alle Ihre Studios.',
            studiosCount: unifiedUser.ownedStudios.length,
          },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        // Delete OAuth accounts
        prisma.newAccount.deleteMany({
          where: { userId: unifiedUser.id },
        }),
        // Delete sessions
        prisma.newSession.deleteMany({
          where: { userId: unifiedUser.id },
        }),
        // Delete studio ownerships
        prisma.studioOwnership.deleteMany({
          where: { userId: unifiedUser.id },
        }),
        // Delete role assignments
        prisma.userRoleAssignment.deleteMany({
          where: { userId: unifiedUser.id },
        }),
        // Delete bookings
        prisma.newBooking.deleteMany({
          where: { customerId: unifiedUser.id },
        }),
        // Delete audit logs
        prisma.auditLog.deleteMany({
          where: { userId: unifiedUser.id },
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
        userId: unifiedUser.id,
        action: 'DELETE_USER_ACCOUNT',
        resource: 'user',
        resourceId: unifiedUser.id,
      });
    } else if (studioOwner) {
      // Legacy StudioOwner deletion (kept for backward compatibility)

      await prisma.$transaction([
        // Delete OAuth accounts
        prisma.account.deleteMany({
          where: { userId: studioOwner.id },
        }),
        // Delete sessions
        prisma.session.deleteMany({
          where: { userId: studioOwner.id },
        }),
        // Delete studio owner
        prisma.studioOwner.delete({
          where: { email },
        }),
      ]);

      logger.info('Studio owner account deleted successfully', {
        correlationId,
        ipAddress,
        userAgent,
        email,
        userId: studioOwner.id,
        action: 'DELETE_USER_ACCOUNT',
        resource: 'studio_owner',
        resourceId: studioOwner.id,
      });
    }

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
