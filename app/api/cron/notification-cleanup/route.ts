/**
 * GET /api/cron/notification-cleanup
 *
 * Daily cleanup of old notifications (GDPR compliance).
 * Runs at 3am UTC via Vercel Cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete old notifications (GDPR compliance)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    // Deactivate inactive device tokens (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deactivatedTokens = await prisma.deviceToken.updateMany({
      where: {
        lastUsedAt: { lt: thirtyDaysAgo },
        isActive: true,
      },
      data: { isActive: false },
    });

    // Delete very old device tokens (90 days inactive)
    const deletedTokens = await prisma.deviceToken.deleteMany({
      where: {
        lastUsedAt: { lt: ninetyDaysAgo },
        isActive: false,
      },
    });

    console.log(`Cleanup: Deleted ${deletedNotifications.count} notifications, deactivated ${deactivatedTokens.count} tokens, deleted ${deletedTokens.count} old tokens`);

    return NextResponse.json({
      deletedNotifications: deletedNotifications.count,
      deactivatedTokens: deactivatedTokens.count,
      deletedTokens: deletedTokens.count,
    });
  } catch (error) {
    console.error('Notification cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
