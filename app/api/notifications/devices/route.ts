/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Device Token Management
 * GET, POST /api/notifications/devices
 *
 * Manage push notification device tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { registerDeviceSchema } from '@/lib/schemas/notification.schema';
import { sanitizeToken } from '@/lib/notifications/utils/token-validator';
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from '@/lib/middleware/api-rate-limiter';
import type { DevicePlatform } from '@/app/generated/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.listNotifications, // Same as regular list
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

    const devices = await prisma.deviceToken.findMany({
      where: { userId: session.user.id },
      orderBy: { lastUsedAt: 'desc' },
    });

        return NextResponse.json({ devices });
      } catch (error) {
        logger.error('GET /api/notifications/devices error:', {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.registerDevice,
    session,
    async () => {
      try {
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

    const body = await request.json();

    // Sanitize token before validation (removes whitespace/formatting)
    if (body.token && typeof body.token === 'string') {
      body.token = sanitizeToken(body.token);
    }

    // Validate with comprehensive token format validation
    const parsed = registerDeviceSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten();
      const tokenError = errors.fieldErrors.token?.[0];

      // Return 422 for token validation failures (invalid format)
      if (tokenError) {
        return NextResponse.json(
          {
            error: 'Invalid device token',
            message: tokenError,
            details: errors,
          },
          { status: 422 }
        );
      }

      // Return 400 for other validation failures (missing fields, etc.)
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Request validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Upsert the device token (same token might be registered again)
    const device = await prisma.deviceToken.upsert({
      where: { token: parsed.data.token },
      update: {
        userId: session.user.id, // Update ownership if token moved to new user
        platform: parsed.data.platform as DevicePlatform,
        deviceName: parsed.data.deviceName,
        deviceModel: parsed.data.deviceModel,
        appVersion: parsed.data.appVersion,
        osVersion: parsed.data.osVersion,
        isActive: true,
        lastUsedAt: new Date(),
        failureCount: 0, // Reset failures on re-registration
        lastFailureAt: null,
        lastFailureReason: null,
      },
      create: {
        userId: session.user.id,
        token: parsed.data.token,
        platform: parsed.data.platform as DevicePlatform,
        deviceName: parsed.data.deviceName,
        deviceModel: parsed.data.deviceModel,
        appVersion: parsed.data.appVersion,
        osVersion: parsed.data.osVersion,
      },
    });

    logger.info('Device token registered successfully', {
      deviceId: device.id,
      platform: device.platform,
      userId: session.user.id,
    });

        return NextResponse.json({ device });
      } catch (error) {
        logger.error('POST /api/notifications/devices error:', {
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
