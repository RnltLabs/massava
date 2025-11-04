/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Vercel Cron Endpoint for Data Retention
 * Scheduled to run daily at 2 AM UTC
 * MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduledDataRetentionJob } from '@/lib/cron/data-retention-job';
import { logger } from '@/lib/logger';

/**
 * Vercel Cron Job Endpoint
 * GET /api/cron/data-retention
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-retention",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization (Vercel Cron sends a secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured', {
        action: 'CRON_DATA_RETENTION',
      });
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt', {
        action: 'CRON_DATA_RETENTION',
        authHeader: authHeader ? 'present' : 'missing',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Starting scheduled data retention job', {
      action: 'CRON_DATA_RETENTION',
    });

    // Run the data retention job
    return await scheduledDataRetentionJob();
  } catch (error) {
    logger.error('Cron job endpoint failed', {
      action: 'CRON_DATA_RETENTION',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST method not allowed (use GET for Vercel Cron)
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use GET method for cron jobs',
    },
    { status: 405 }
  );
}
