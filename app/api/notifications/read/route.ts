/**
 * POST /api/notifications/read
 *
 * Mark a notification as read.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { notificationService } from '@/lib/notifications/notification-service';
import { z } from 'zod';

const schema = z.object({
  notificationId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await notificationService.markAsRead(
      parsed.data.notificationId,
      session.user.id
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/notifications/read error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
