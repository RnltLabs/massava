/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Vercel Cron Endpoint for Review Requests
 * Scheduled to run daily to send review request emails
 * EMAIL_IMPLEMENTATION_PLAN.md Task 4.2: Review Requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReviewRequestEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

/**
 * Vercel Cron Job Endpoint
 * GET /api/cron/review-requests
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/review-requests",
 *     "schedule": "0 11 * * *"
 *   }]
 * }
 *
 * Sends review request emails for bookings completed 24 hours ago
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization (Vercel Cron sends a secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured', {
        action: 'CRON_REVIEW_REQUESTS',
      });
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt', {
        action: 'CRON_REVIEW_REQUESTS',
        authHeader: authHeader ? 'present' : 'missing',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Starting review requests cron job', {
      action: 'CRON_REVIEW_REQUESTS',
    });

    // Calculate yesterday's date range (24 hours ago)
    const now = new Date();
    const yesterday = subDays(now, 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    const yesterdayDate = format(yesterday, 'yyyy-MM-dd');

    logger.info('Searching for bookings to request reviews', {
      action: 'CRON_REVIEW_REQUESTS',
      targetDateRange: {
        start: yesterdayStart.toISOString(),
        end: yesterdayEnd.toISOString(),
      },
    });

    // Find all confirmed bookings from yesterday that haven't received a review request
    const bookings = await prisma.newBooking.findMany({
      where: {
        status: 'CONFIRMED',
        reviewRequestSent: false,
        preferredDateTime: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
      include: {
        studio: {
          select: {
            name: true,
            id: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    logger.info('Found bookings to request reviews', {
      action: 'CRON_REVIEW_REQUESTS',
      count: bookings.length,
      targetDate: yesterdayDate,
    });

    if (bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings to request reviews for yesterday',
        reviewRequestsSent: 0,
        targetDate: yesterdayDate,
      });
    }

    // Send review request emails
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ bookingId: string; error: string }> = [];

    for (const booking of bookings) {
      try {
        // Determine locale based on studio or default to 'de'
        const locale = 'de'; // TODO: Add locale field to Studio model in future

        // Build review URL
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const reviewUrl = `${appUrl}/${locale}/studio/${booking.studio.id}/review?bookingId=${booking.id}`;

        // Format booking date for display
        const bookingDate = format(
          booking.preferredDateTime,
          'PPPP',
          { locale: locale === 'de' ? de : enUS }
        );

        // Send review request email
        const result = await sendReviewRequestEmail(
          booking.customerEmail,
          {
            customerName: booking.customerName,
            studioName: booking.studio.name,
            serviceName: booking.service?.name || 'Service',
            bookingDate,
            reviewUrl,
          },
          locale
        );

        if (result.success) {
          // Mark review request as sent
          await prisma.newBooking.update({
            where: { id: booking.id },
            data: { reviewRequestSent: true },
          });

          successCount++;
          logger.info('Review request sent successfully', {
            action: 'CRON_REVIEW_REQUESTS',
            bookingId: booking.id,
            studioName: booking.studio.name,
          });
        } else {
          failureCount++;
          errors.push({
            bookingId: booking.id,
            error: result.error || 'Unknown error',
          });
          logger.error('Failed to send review request', {
            action: 'CRON_REVIEW_REQUESTS',
            bookingId: booking.id,
            error: result.error,
          });
        }
      } catch (error) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          bookingId: booking.id,
          error: errorMessage,
        });
        logger.error('Exception while sending review request', {
          action: 'CRON_REVIEW_REQUESTS',
          bookingId: booking.id,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    const responseData = {
      success: true,
      message: 'Review requests cron job completed',
      targetDate: yesterdayDate,
      totalBookings: bookings.length,
      reviewRequestsSent: successCount,
      failures: failureCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info('Review requests cron job completed', {
      action: 'CRON_REVIEW_REQUESTS',
      ...responseData,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Cron job endpoint failed', {
      action: 'CRON_REVIEW_REQUESTS',
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
