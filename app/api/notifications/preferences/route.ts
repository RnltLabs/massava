/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Notification Preferences
 * GET, PATCH /api/notifications/preferences
 *
 * Get and update notification preferences for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { Prisma, DigestFrequency } from '@/app/generated/prisma';
import {
  updateNotificationPreferencesSchema,
  type GranularPreferencesResponse,
} from '@/lib/schemas/notification.schema';

/**
 * Transform database preferences to API response format
 */
function transformToResponse(prefs: any): GranularPreferencesResponse {
  return {
    push: {
      enabled: prefs.pushEnabled,
      bookings: prefs.pushBookings,
      cancellations: prefs.pushCancellations,
      reminders: prefs.pushReminders,
      marketing: prefs.pushMarketing,
    },
    email: {
      enabled: prefs.emailEnabled,
      bookings: prefs.emailBookings,
      cancellations: prefs.emailCancellations,
      reminders: prefs.emailReminders,
      marketing: prefs.emailMarketing,
    },
    inApp: {
      enabled: prefs.inAppEnabled,
    },
    digest: {
      enabled: prefs.emailDigestEnabled,
      frequency: prefs.digestFrequency,
      time: prefs.digestTime,
    },
    language: prefs.language,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    // Transform to granular response format
    const response = transformToResponse(preferences);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('GET /api/notifications/preferences error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateNotificationPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Transform parsed data to Prisma-compatible format
    const updateData: Prisma.NotificationPreferenceUpdateInput = {
      ...parsed.data,
      typePreferences: parsed.data.typePreferences as Prisma.InputJsonValue | undefined,
      digestFrequency: parsed.data.digestFrequency as DigestFrequency | undefined,
    };

    const createData: Prisma.NotificationPreferenceCreateInput = {
      user: { connect: { id: session.user.id } },
      ...parsed.data,
      typePreferences: parsed.data.typePreferences as Prisma.InputJsonValue | undefined,
      digestFrequency: parsed.data.digestFrequency as DigestFrequency | undefined,
    };

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: createData,
    });

    // Transform to granular response format
    const response = transformToResponse(preferences);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('PATCH /api/notifications/preferences error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
