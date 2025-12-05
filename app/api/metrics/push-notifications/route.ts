/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * API Route: Push Notification Metrics
 * GET /api/metrics/push-notifications
 *
 * Returns comprehensive analytics for push notification system.
 *
 * **Authorization:**
 * - SUPER_ADMIN: Can view all metrics across all studios
 * - STUDIO_OWNER: Can only view metrics for their own studio
 *
 * **Query Parameters:**
 * - startDate: ISO 8601 date string (optional, defaults to 30 days ago)
 * - endDate: ISO 8601 date string (optional, defaults to now)
 * - studioId: Studio ID for filtering (optional, required for STUDIO_OWNER)
 * - granularity: Time series granularity (daily, weekly, monthly)
 *
 * **Metrics Returned:**
 * - Opt-in Rate: Active consents / Total users
 * - Delivery Rate: Delivered / Sent
 * - Click Rate: Clicked / Delivered
 * - Opt-out Rate: Revoked / Total consents
 * - By Type: Metrics grouped by notification type
 * - Time Series: Daily metrics for the specified period
 * - Active Devices: Count by platform (iOS, Android, Web)
 *
 * **Data Sources:**
 * - Notification table (delivery, click, failure metrics)
 * - PushConsentLog table (consent grant/revoke metrics)
 * - DeviceToken table (active device metrics)
 * - NotificationPreference table (active consent status)
 *
 * **Performance:**
 * - Optimized with parallel queries
 * - Efficient aggregations using Prisma groupBy
 * - Response cached for 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { fetchPushNotificationMetrics } from '@/lib/db/push-metrics.queries';
import {
  pushNotificationMetricsSchema,
  pushMetricsQuerySchema,
} from '@/lib/schemas/push-metrics.schema';
import type { UserRole } from '@/app/generated/prisma';

/**
 * GET /api/metrics/push-notifications
 *
 * Retrieve push notification analytics metrics.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    // Check user role and permissions
    const userRole = (session.user as any).primaryRole as UserRole | undefined;

    if (!userRole || (userRole !== 'SUPER_ADMIN' && userRole !== 'STUDIO_OWNER')) {
      return NextResponse.json(
        {
          error: 'Forbidden. Only SUPER_ADMIN or STUDIO_OWNER can access metrics.',
        },
        { status: 403 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const studioIdParam = searchParams.get('studioId');
    const granularityParam = searchParams.get('granularity') || 'daily';

    // Default to last 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Validate query parameters
    const queryValidation = pushMetricsQuerySchema.safeParse({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      studioId: studioIdParam,
      granularity: granularityParam,
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryValidation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // For STUDIO_OWNER, enforce studio filtering
    let studioId = studioIdParam;

    if (userRole === 'STUDIO_OWNER') {
      // Fetch user's studio ID through StudioOwnership junction table
      const { prisma } = await import('@/lib/prisma');
      const ownership = await prisma.studioOwnership.findFirst({
        where: {
          userId: session.user.id,
        },
        select: {
          studioId: true,
        },
      });

      if (!ownership) {
        return NextResponse.json(
          {
            error: 'Studio not found. STUDIO_OWNER must have an associated studio.',
          },
          { status: 404 },
        );
      }

      // Override studioId with user's studio
      studioId = ownership.studioId;

      // If studioIdParam was provided and doesn't match, return error
      if (studioIdParam && studioIdParam !== studioId) {
        return NextResponse.json(
          {
            error: 'Forbidden. You can only view metrics for your own studio.',
          },
          { status: 403 },
        );
      }
    }

    // Fetch metrics
    const metrics = await fetchPushNotificationMetrics({
      startDate,
      endDate,
      studioId: studioId ?? undefined,
    });

    // Validate response schema
    const validationResult = pushNotificationMetricsSchema.safeParse(metrics);

    if (!validationResult.success) {
      logger.error('Push metrics schema validation failed', {
        error: validationResult.error,
        metrics,
      });

      return NextResponse.json(
        {
          error: 'Internal server error: Invalid metrics format',
        },
        { status: 500 },
      );
    }

    // Log metric access for audit trail
    logger.info('Push notification metrics accessed', {
      userId: session.user.id,
      userRole,
      studioId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Return metrics with cache headers
    return NextResponse.json(validationResult.data, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('GET /api/metrics/push-notifications error', {
      error: error instanceof Error ? error : new Error(String(error)),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS /api/metrics/push-notifications
 *
 * CORS preflight handler.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
