/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Vercel Cron Endpoint for Review Requests
 * Scheduled to run every 2 hours to send review request notifications
 * Sends notifications 2 hours after appointment end time
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReviewRequestEmail } from '@/lib/email/send';
import { sendReviewRequestNotification } from '@/lib/notifications/booking-notification-helper';
import { logger } from '@/lib/logger';
import { format, addMinutes, subHours } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

/**
 * Vercel Cron Job Endpoint
 * GET /api/cron/review-requests
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/review-requests",
 *     "schedule": "0 *\/2 * * *"
 *   }]
 * }
 *
 * Runs every 2 hours to send review request emails and push notifications
 * for bookings completed 2 hours ago.
 * Checks: preferredDateTime + service.duration + 2 hours < now
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

    const now = new Date();
    const twoHoursAgo = subHours(now, 2);
    const fourHoursAgo = subHours(now, 4); // 2-hour window for cron timing

    logger.info('Searching for completed bookings to request reviews', {
      action: 'CRON_REVIEW_REQUESTS',
      timeWindow: {
        start: fourHoursAgo.toISOString(),
        end: twoHoursAgo.toISOString(),
      },
    });

    // Find all confirmed bookings that:
    // 1. Haven't received a review request yet
    // 2. Don't have a review already
    // 3. Ended between 2-4 hours ago (appointment time + service duration + 2 hours)
    // Note: We only check CONFIRMED status as COMPLETED doesn't exist in the schema
    // The filter below ensures the appointment time has passed
    const bookings = await prisma.newBooking.findMany({
      where: {
        status: 'CONFIRMED',
        reviewRequestSent: false,
        review: null, // No review posted yet
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true, // Service duration in minutes
          },
        },
      },
    });

    // Filter bookings where appointment ended at least 2 hours ago
    const eligibleBookings = bookings.filter((booking) => {
      if (!booking.service?.duration) {
        logger.warn('Booking has no service duration, skipping', {
          action: 'CRON_REVIEW_REQUESTS',
          bookingId: booking.id,
        });
        return false;
      }

      // Calculate appointment end time: preferredDateTime + service duration
      const appointmentEnd = addMinutes(
        booking.preferredDateTime,
        booking.service.duration
      );

      // Add 2 hours to appointment end time
      const reviewRequestTime = addMinutes(appointmentEnd, 120); // 2 hours = 120 minutes

      // Check if review request time is in the past
      const isEligible = reviewRequestTime <= now;

      // Only include if within our processing window (to avoid re-processing old bookings)
      const isInWindow = reviewRequestTime >= fourHoursAgo;

      return isEligible && isInWindow;
    });

    logger.info('Found eligible bookings for review requests', {
      action: 'CRON_REVIEW_REQUESTS',
      totalBookings: bookings.length,
      eligibleBookings: eligibleBookings.length,
    });

    if (eligibleBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible bookings to request reviews',
        reviewRequestsSent: 0,
        pushSent: 0,
      });
    }

    // Send review request emails and push notifications
    let emailsSent = 0;
    let pushSent = 0;
    let pushFailed = 0;
    let failures = 0;
    const errors: Array<{ bookingId: string; error: string }> = [];

    for (const booking of eligibleBookings) {
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
        const emailResult = await sendReviewRequestEmail(
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

        if (emailResult.success) {
          emailsSent++;
          logger.info('Review request email sent', {
            action: 'CRON_REVIEW_REQUESTS',
            bookingId: booking.id,
            studioName: booking.studio.name,
          });
        } else {
          logger.error('Failed to send review request email', {
            action: 'CRON_REVIEW_REQUESTS',
            bookingId: booking.id,
            error: emailResult.error,
          });
        }

        // Send push notification to customer (if registered user)
        if (booking.customerId) {
          const pushResult = await sendReviewRequestNotification({
            bookingId: booking.id,
            studioId: booking.studio.id,
            studioName: booking.studio.name,
            studioTimezone: booking.studio.timezone || 'Europe/Berlin',
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            serviceName: booking.service?.name || 'Service',
            preferredDateTime: booking.preferredDateTime,
            customerId: booking.customerId,
          });

          if (pushResult.ok) {
            pushSent += pushResult.value.sent;
            pushFailed += pushResult.value.failed;
            logger.info('Review request push notification sent', {
              action: 'CRON_REVIEW_REQUESTS',
              bookingId: booking.id,
              sent: pushResult.value.sent,
              failed: pushResult.value.failed,
            });
          }
        }

        // Mark review request as sent
        await prisma.newBooking.update({
          where: { id: booking.id },
          data: { reviewRequestSent: true },
        });

        logger.info('Review request processed successfully', {
          action: 'CRON_REVIEW_REQUESTS',
          bookingId: booking.id,
          studioName: booking.studio.name,
        });
      } catch (error) {
        failures++;
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
      totalBookings: eligibleBookings.length,
      emailsSent,
      pushSent,
      pushFailed,
      failures,
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
