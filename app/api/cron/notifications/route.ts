/**
 * GET /api/cron/notifications
 *
 * Cron job to process scheduled notifications and retry failed ones.
 * Runs every minute via Vercel Cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { qstashPublisher } from '@/lib/queue/qstash-publisher';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let processedScheduled = 0;
  let processedRetries = 0;

  try {
    // 1. Process scheduled notifications that are due
    const scheduledNotifications = await prisma.notification.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      take: 100, // Batch size
      select: { id: true, priority: true },
    });

    for (const notification of scheduledNotifications) {
      try {
        await qstashPublisher.publish({
          notificationId: notification.id,
          priority: notification.priority,
        });

        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'QUEUED' },
        });

        processedScheduled++;
      } catch (error) {
        console.error(`Failed to queue scheduled notification ${notification.id}:`, error);
      }
    }

    // 2. Process notifications pending retry
    const retryNotifications = await prisma.notification.findMany({
      where: {
        status: 'PENDING',
        nextRetryAt: { lte: now },
        retryCount: { lt: 3 }, // maxRetries from model default
        scheduledFor: null, // Not a scheduled notification
      },
      take: 50, // Smaller batch for retries
      select: { id: true, priority: true },
    });

    for (const notification of retryNotifications) {
      try {
        await qstashPublisher.publish({
          notificationId: notification.id,
          priority: notification.priority,
        });

        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'QUEUED' },
        });

        processedRetries++;
      } catch (error) {
        console.error(`Failed to queue retry notification ${notification.id}:`, error);
      }
    }

    // 3. Mark expired notifications
    const expiredResult = await prisma.notification.updateMany({
      where: {
        status: { in: ['PENDING', 'QUEUED'] },
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });

    console.log(`Cron: Processed ${processedScheduled} scheduled, ${processedRetries} retries, ${expiredResult.count} expired`);

    return NextResponse.json({
      scheduled: processedScheduled,
      retries: processedRetries,
      expired: expiredResult.count,
    });
  } catch (error) {
    console.error('Cron notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
