/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Push Notification Consent Management
 * POST, GET /api/notifications/consent
 *
 * GDPR-compliant consent logging for push notifications.
 * Implements requirements from GDPR Art. 7 (Conditions for consent).
 *
 * Features:
 * - POST: Create new consent log entry with proof of consent
 * - GET: Retrieve consent history for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { Prisma, ConsentAction } from '@/app/generated/prisma';
import {
  createConsentLogSchema,
  type ConsentHistoryResponse,
  type ConsentLogResponse,
} from '@/lib/schemas/notification.schema';

/**
 * Helper function to extract IP address from request
 * Supports X-Forwarded-For header for proxied requests
 */
function getIpAddress(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP (not available in Edge Runtime)
  return null;
}

/**
 * Helper function to extract User-Agent from request
 */
function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}

/**
 * Transform database consent log to API response format
 */
function transformConsentLog(log: any): ConsentLogResponse {
  return {
    id: log.id,
    userId: log.userId,
    action: log.action as ConsentAction,
    consentVersion: log.consentVersion,
    categories: log.categories as any,
    method: log.method,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    deviceInfo: log.deviceInfo as any,
    previousState: log.previousState as any,
    triggeredBy: log.triggeredBy,
    notes: log.notes,
    timestamp: log.timestamp,
  };
}

/**
 * POST /api/notifications/consent
 *
 * Create a new consent log entry.
 * Automatically captures IP address and User-Agent as proof of consent.
 *
 * Request body:
 * {
 *   action: ConsentAction,
 *   categories: { bookings, cancellations, reminders, marketing },
 *   consentVersion: string,
 *   method: string,
 *   deviceInfo?: object,
 *   previousState?: object,
 *   triggeredBy?: "user" | "admin" | "system_migration",
 *   notes?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   consentId: string,
 *   log: ConsentLogResponse
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = createConsentLogSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn('POST /api/notifications/consent - Invalid request body', {
        userId: session.user.id,
        errors: parsed.error.flatten(),
      });

      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { action, categories, consentVersion, method, deviceInfo, previousState, triggeredBy, notes } = parsed.data;

    // Capture IP address and User-Agent for proof of consent (GDPR Art. 7.1)
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Create consent log entry
    const consentLog = await prisma.pushConsentLog.create({
      data: {
        userId: session.user.id,
        action,
        categories: categories as Prisma.InputJsonValue,
        consentVersion,
        method,
        ipAddress,
        userAgent,
        deviceInfo: deviceInfo as Prisma.InputJsonValue | undefined,
        previousState: previousState as Prisma.InputJsonValue | undefined,
        triggeredBy: triggeredBy || 'user',
        notes,
      },
    });

    // Update NotificationPreference based on consent action
    if (action === 'GRANTED' || action === 'UPDATED' || action === 'CATEGORIES_CHANGED') {
      // Update preferences to reflect new consent state
      await prisma.notificationPreference.upsert({
        where: { userId: session.user.id },
        update: {
          pushEnabled: true,
          pushBookings: categories.bookings,
          pushCancellations: categories.cancellations,
          pushReminders: categories.reminders,
          pushMarketing: categories.marketing,
        },
        create: {
          userId: session.user.id,
          pushEnabled: true,
          pushBookings: categories.bookings,
          pushCancellations: categories.cancellations,
          pushReminders: categories.reminders,
          pushMarketing: categories.marketing,
        },
      });
    } else if (action === 'REVOKED') {
      // Disable all push notifications
      await prisma.notificationPreference.upsert({
        where: { userId: session.user.id },
        update: {
          pushEnabled: false,
          pushBookings: false,
          pushCancellations: false,
          pushReminders: false,
          pushMarketing: false,
        },
        create: {
          userId: session.user.id,
          pushEnabled: false,
          pushBookings: false,
          pushCancellations: false,
          pushReminders: false,
          pushMarketing: false,
        },
      });
    }

    logger.info('Consent log created', {
      userId: session.user.id,
      consentId: consentLog.id,
      action,
      method,
      triggeredBy: triggeredBy || 'user',
    });

    const responseLog = transformConsentLog(consentLog);

    return NextResponse.json({
      success: true,
      consentId: consentLog.id,
      log: responseLog,
    });
  } catch (error) {
    logger.error('POST /api/notifications/consent error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/consent
 *
 * Retrieve consent history for the authenticated user.
 * Returns the last 10 consent log entries and current consent status.
 *
 * Response:
 * {
 *   logs: ConsentLogResponse[],
 *   currentStatus: {
 *     hasConsented: boolean,
 *     categories: ConsentCategories | null,
 *     consentVersion: string | null,
 *     lastUpdated: Date | null
 *   }
 * }
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch last 10 consent logs
    const logs = await prisma.pushConsentLog.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Get current notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Determine current consent status from most recent log
    const latestLog = logs[0];
    const hasConsented = preferences?.pushEnabled || false;

    const currentStatus = {
      hasConsented,
      categories: hasConsented && latestLog ? (latestLog.categories as any) : null,
      consentVersion: latestLog?.consentVersion || null,
      lastUpdated: latestLog?.timestamp || null,
    };

    const response: ConsentHistoryResponse = {
      logs: logs.map(transformConsentLog),
      currentStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('GET /api/notifications/consent error:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
