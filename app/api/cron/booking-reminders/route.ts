/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Vercel Cron Endpoint for Booking Reminders
 * Scheduled to run daily to send 24-hour booking reminders
 * EMAIL_IMPLEMENTATION_PLAN.md Task 4.1: Booking Reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBookingReminderEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';

/**
 * Vercel Cron Job Endpoint
 * GET /api/cron/booking-reminders
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/booking-reminders",
 *     "schedule": "0 10 * * *"
 *   }]
 * }
 *
 * Sends reminder emails for bookings happening in 24 hours
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization (Vercel Cron sends a secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured', {
        action: 'CRON_BOOKING_REMINDERS',
      });
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt', {
        action: 'CRON_BOOKING_REMINDERS',
        authHeader: authHeader ? 'present' : 'missing',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Starting booking reminders cron job', {
      action: 'CRON_BOOKING_REMINDERS',
    });

    // Calculate tomorrow's date range (24 hours from now)
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);
    const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

    logger.info('Searching for bookings to remind', {
      action: 'CRON_BOOKING_REMINDERS',
      targetDateRange: {
        start: tomorrowStart.toISOString(),
        end: tomorrowEnd.toISOString(),
      },
    });

    // Find all confirmed bookings for tomorrow that haven't received a reminder
    const bookings = await prisma.newBooking.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSent: false,
        preferredDateTime: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        studio: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    logger.info('Found bookings to remind', {
      action: 'CRON_BOOKING_REMINDERS',
      count: bookings.length,
      targetDate: tomorrowDate,
    });

    if (bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings to remind for tomorrow',
        remindersSent: 0,
        targetDate: tomorrowDate,
      });
    }

    // Send reminder emails
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ bookingId: string; error: string }> = [];

    for (const booking of bookings) {
      try {
        // Determine locale based on studio or default to 'de'
        const locale = 'de'; // TODO: Add locale field to Studio model in future

        // Send reminder email
        const result = await sendBookingReminderEmail(
          booking.customerEmail,
          {
            bookingId: booking.id,
            customerName: booking.customerName,
            studioName: booking.studio.name,
            serviceName: booking.service?.name || 'Service',
            bookingDate: format(booking.preferredDateTime, 'yyyy-MM-dd'),
            bookingTime: format(booking.preferredDateTime, 'HH:mm'),
            studioAddress: booking.studio.address || undefined,
            studioPhone: booking.studio.phone || undefined,
          },
          locale
        );

        if (result.success) {
          // Mark reminder as sent
          await prisma.newBooking.update({
            where: { id: booking.id },
            data: { reminderSent: true },
          });

          successCount++;
          logger.info('Booking reminder sent successfully', {
            action: 'CRON_BOOKING_REMINDERS',
            bookingId: booking.id,
            studioName: booking.studio.name,
          });
        } else {
          failureCount++;
          errors.push({
            bookingId: booking.id,
            error: result.error || 'Unknown error',
          });
          logger.error('Failed to send booking reminder', {
            action: 'CRON_BOOKING_REMINDERS',
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
        logger.error('Exception while sending booking reminder', {
          action: 'CRON_BOOKING_REMINDERS',
          bookingId: booking.id,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    const responseData = {
      success: true,
      message: 'Booking reminders cron job completed',
      targetDate: tomorrowDate,
      totalBookings: bookings.length,
      remindersSent: successCount,
      failures: failureCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info('Booking reminders cron job completed', {
      action: 'CRON_BOOKING_REMINDERS',
      ...responseData,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Cron job endpoint failed', {
      action: 'CRON_BOOKING_REMINDERS',
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
