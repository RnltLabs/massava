/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Device Token Management (Single Device)
 * DELETE /api/notifications/devices/:id
 *
 * Remove a device token (unregister from push notifications).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from '@/lib/middleware/api-rate-limiter';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.deleteDevice,
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

    const { id } = await params;

    // Only allow deleting own devices
    const device = await prisma.deviceToken.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    await prisma.deviceToken.delete({
      where: { id },
    });

        return NextResponse.json({ success: true });
      } catch (error) {
        logger.error('DELETE /api/notifications/devices/:id error:', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  );
}
