/**
 * GET /api/notifications/unread-count
 *
 * Get unread notification count for badge display.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { notificationService } from '@/lib/notifications/notification-service';
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from '@/lib/middleware/api-rate-limiter';

export async function GET(request: NextRequest) {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.unreadCount,
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const count = await notificationService.getUnreadCount(session.user.id);

        return NextResponse.json({ count });
      } catch (error) {
        logger.error('GET /api/notifications/unread-count error:', {
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
