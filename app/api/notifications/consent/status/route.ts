/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Push Notification Consent Status
 * GET /api/notifications/consent/status
 *
 * Retrieve current consent status for the authenticated user.
 * Returns a simplified status object without full history.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { ConsentStatusResponse } from '@/lib/schemas/notification.schema';

/**
 * GET /api/notifications/consent/status
 *
 * Get current consent status for the authenticated user.
 * This is a lightweight endpoint for checking consent state.
 *
 * Response:
 * {
 *   hasConsented: boolean,
 *   categories: {
 *     bookings: boolean,
 *     cancellations: boolean,
 *     reminders: boolean,
 *     marketing: boolean
 *   } | null,
 *   consentVersion: string | null,
 *   lastUpdated: Date | null
 * }
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Get most recent consent log for version and timestamp
    const latestLog = await prisma.pushConsentLog.findFirst({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
    });

    const hasConsented = preferences?.pushEnabled || false;

    const response: ConsentStatusResponse = {
      hasConsented,
      categories: hasConsented && preferences ? {
        bookings: preferences.pushBookings,
        cancellations: preferences.pushCancellations,
        reminders: preferences.pushReminders,
        marketing: preferences.pushMarketing,
      } : null,
      consentVersion: latestLog?.consentVersion || null,
      lastUpdated: latestLog?.timestamp || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('GET /api/notifications/consent/status error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
