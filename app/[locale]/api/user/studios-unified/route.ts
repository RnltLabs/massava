/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * User Studios API - Unified User Model
 * Phase 3: RBAC + Studio Ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { logger, getCorrelationId, getClientIP } from '@/lib/logger';
import { requireAuth } from '@/lib/auth/permissions';

const prisma = new PrismaClient();

/**
 * GET /api/user/studios
 * Get studios owned by the current user
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);

  try {
    // Check authentication
    const authResult = await requireAuth();
    if (authResult.response) return authResult.response;
    const user = authResult.user!;

    // Get studios via StudioOwnership
    const ownerships = await prisma.studioOwnership.findMany({
      where: {
        userId: user.id,
      },
      include: {
        studio: {
          include: {
            services: true,
          },
        },
      },
      orderBy: {
        acceptedAt: 'desc',
      },
    });

    const studios = ownerships.map((ownership) => ({
      ...ownership.studio,
      ownership: {
        canTransfer: ownership.canTransfer,
        acceptedAt: ownership.acceptedAt,
      },
    }));

    logger.info('User studios fetched successfully', {
      correlationId,
      ipAddress,
      userId: user.id,
      action: 'LIST_USER_STUDIOS',
      resource: 'studio',
      count: studios.length,
    });

    return NextResponse.json({ studios });
  } catch (error) {
    logger.error('User studios fetch failed', {
      correlationId,
      ipAddress,
      action: 'LIST_USER_STUDIOS',
      resource: 'studio',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Abrufen fehlgeschlagen' },
      { status: 500 }
    );
  }
}
