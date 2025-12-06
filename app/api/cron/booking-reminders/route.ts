/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Vercel Cron Endpoint for Booking Reminders
 * Scheduled to run hourly to send booking reminders:
 * - Customer reminders: 24 hours before appointment (email + push)
 * - Studio reminders: 1 hour before appointment (push only)
 * EMAIL_IMPLEMENTATION_PLAN.md Task 4.1: Booking Reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBookingReminderEmail } from '@/lib/email/send';
import {
  sendBookingReminderCustomerNotification,
  sendBookingReminderStudioNotification,
} from '@/lib/notifications/booking-notification-helper';
import { logger } from '@/lib/logger';
import { format, startOfDay, endOfDay, addDays, addHours, subMinutes } from 'date-fns';
import { formatInTimezone } from '@/lib/timezone/utils';

/**
 * Vercel Cron Job Endpoint
 * GET /api/cron/booking-reminders
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/booking-reminders",
 *     "schedule": "0 * * * *"  // Run every hour
 *   }]
 * }
 *
 * Sends reminder emails and push notifications:
 * - Customer: 24 hours before appointment (email + push)
 * - Studio: 1 hour before appointment (push only)
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

    const now = new Date();

    // ============================================
    // CUSTOMER REMINDERS (24 hours before)
    // ============================================

    // Calculate tomorrow's date range (24 hours from now)
    const tomorrow = addDays(now, 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);
    const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

    logger.info('Searching for customer bookings to remind (24h before)', {
      action: 'CRON_BOOKING_REMINDERS',
      targetDateRange: {
        start: tomorrowStart.toISOString(),
        end: tomorrowEnd.toISOString(),
      },
    });

    // Find all confirmed bookings for tomorrow that haven't received a customer reminder
    const customerBookings = await prisma.newBooking.findMany({
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
            id: true,
            name: true,
            address: true,
            phone: true,
            timezone: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    logger.info('Found customer bookings to remind', {
      action: 'CRON_BOOKING_REMINDERS',
      count: customerBookings.length,
      targetDate: tomorrowDate,
    });

    let customerEmailsSent = 0;
    let customerPushSent = 0;
    let customerPushFailed = 0;
    let customerFailures = 0;
    const customerErrors: Array<{ bookingId: string; error: string }> = [];

    for (const booking of customerBookings) {
      try {
        const locale = 'de'; // TODO: Add locale field to Studio model in future

        // Send reminder email to customer
        const studioTimezone = booking.studio.timezone || 'Europe/Berlin';
        const emailResult = await sendBookingReminderEmail(
          booking.customerEmail,
          {
            bookingId: booking.id,
            customerName: booking.customerName,
            studioName: booking.studio.name,
            serviceName: booking.service?.name || 'Service',
            bookingDate: formatInTimezone(booking.preferredDateTime, studioTimezone, 'yyyy-MM-dd'),
            bookingTime: formatInTimezone(booking.preferredDateTime, studioTimezone, 'HH:mm'),
            studioAddress: booking.studio.address || undefined,
            studioPhone: booking.studio.phone || undefined,
          },
          locale
        );

        if (emailResult.success) {
          customerEmailsSent++;
          logger.info('Customer booking reminder email sent', {
            action: 'CRON_BOOKING_REMINDERS',
            bookingId: booking.id,
            type: 'customer_24h',
          });
        } else {
          logger.error('Failed to send customer reminder email', {
            action: 'CRON_BOOKING_REMINDERS',
            bookingId: booking.id,
            error: emailResult.error,
          });
        }

        // Send push notification to customer (if registered user)
        if (booking.customerId) {
          const pushResult = await sendBookingReminderCustomerNotification({
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
            customerPushSent += pushResult.value.sent;
            customerPushFailed += pushResult.value.failed;
            logger.info('Customer booking reminder push notification sent', {
              action: 'CRON_BOOKING_REMINDERS',
              bookingId: booking.id,
              type: 'customer_24h',
              sent: pushResult.value.sent,
              failed: pushResult.value.failed,
            });
          }
        }

        // Mark customer reminder as sent
        await prisma.newBooking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });
      } catch (error) {
        customerFailures++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        customerErrors.push({
          bookingId: booking.id,
          error: errorMessage,
        });
        logger.error('Exception while sending customer reminder', {
          action: 'CRON_BOOKING_REMINDERS',
          bookingId: booking.id,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    // ============================================
    // STUDIO REMINDERS (1 hour before)
    // ============================================

    // Calculate 1 hour from now (with 5 minute buffer for cron timing)
    const oneHourLater = addHours(now, 1);
    const oneHourStart = oneHourLater;
    const oneHourEnd = addHours(oneHourLater, 5); // 5-minute window to catch bookings

    logger.info('Searching for studio bookings to remind (1h before)', {
      action: 'CRON_BOOKING_REMINDERS',
      targetTimeRange: {
        start: oneHourStart.toISOString(),
        end: oneHourEnd.toISOString(),
      },
    });

    // Find all confirmed bookings happening in approximately 1 hour
    const studioBookings = await prisma.newBooking.findMany({
      where: {
        status: 'CONFIRMED',
        studioReminderSent: false,
        preferredDateTime: {
          gte: oneHourStart,
          lte: oneHourEnd,
        },
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
          },
        },
      },
    });

    logger.info('Found studio bookings to remind', {
      action: 'CRON_BOOKING_REMINDERS',
      count: studioBookings.length,
    });

    let studioPushSent = 0;
    let studioPushFailed = 0;
    let studioFailures = 0;
    const studioErrors: Array<{ bookingId: string; error: string }> = [];

    for (const booking of studioBookings) {
      try {
        // Send push notification to studio owners
        const pushResult = await sendBookingReminderStudioNotification({
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
          studioPushSent += pushResult.value.sent;
          studioPushFailed += pushResult.value.failed;
          logger.info('Studio booking reminder push notification sent', {
            action: 'CRON_BOOKING_REMINDERS',
            bookingId: booking.id,
            type: 'studio_1h',
            sent: pushResult.value.sent,
            failed: pushResult.value.failed,
          });
        }

        // Mark studio reminder as sent
        await prisma.newBooking.update({
          where: { id: booking.id },
          data: { studioReminderSent: true },
        });
      } catch (error) {
        studioFailures++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        studioErrors.push({
          bookingId: booking.id,
          error: errorMessage,
        });
        logger.error('Exception while sending studio reminder', {
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
      customer: {
        targetDate: tomorrowDate,
        totalBookings: customerBookings.length,
        emailsSent: customerEmailsSent,
        pushSent: customerPushSent,
        pushFailed: customerPushFailed,
        failures: customerFailures,
        errors: customerErrors.length > 0 ? customerErrors : undefined,
      },
      studio: {
        totalBookings: studioBookings.length,
        pushSent: studioPushSent,
        pushFailed: studioPushFailed,
        failures: studioFailures,
        errors: studioErrors.length > 0 ? studioErrors : undefined,
      },
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
