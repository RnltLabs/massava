/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth-unified';
import { PrismaClient } from '@/app/generated/prisma';
import { logger, getCorrelationId, getClientIP } from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const ipAddress = getClientIP(request);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn('Unauthorized studios access attempt', {
        correlationId,
        ipAddress,
        action: 'LIST_USER_STUDIOS',
        resource: 'studio',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studios = await prisma.studio.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('User studios fetched successfully', {
      correlationId,
      ipAddress,
      userId: session.user.id,
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
      { error: 'Failed to fetch studios' },
      { status: 500 }
    );
  }
}
