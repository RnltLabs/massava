/**
 * POST /api/notifications/read-all
 *
 * Mark all notifications as read.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { notificationService } from '@/lib/notifications/notification-service';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await notificationService.markAllAsRead(session.user.id);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, count: result.value.count });
  } catch (error) {
    logger.error('POST /api/notifications/read-all error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
