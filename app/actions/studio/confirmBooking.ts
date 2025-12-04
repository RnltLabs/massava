/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Booking Management Actions
 * Server actions for confirming and declining bookings
 */

'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@/app/generated/prisma';
import { revalidatePath } from 'next/cache';
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '@/lib/email/send';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Confirm a pending booking
 */
export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nicht authentifiziert',
      };
    }

    // Get booking with studio and service details
    const booking = await prisma.newBooking.findUnique({
      where: { id: bookingId },
      include: {
        studio: {
          include: {
            ownerships: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden',
      };
    }

    // Verify user owns the studio
    if (booking.studio.ownerships.length === 0) {
      return {
        success: false,
        error: 'Keine Berechtigung für diese Buchung',
      };
    }

    // Check if booking is already confirmed or cancelled
    if (booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: 'Diese Buchung wurde bereits bearbeitet',
      };
    }

    // Update booking status
    await prisma.newBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedBy: session.user.id,
        confirmedAt: new Date(),
      },
    });

    // Send confirmation email to customer
    try {
      const emailResult = await sendBookingConfirmationEmail(
        booking.customerEmail,
        {
          bookingId: booking.id,
          customerName: booking.customerName || 'Kunde',
          studioName: booking.studio.name,
          serviceName: booking.service?.name || 'Massage',
          bookingDate: format(booking.preferredDateTime, 'EEEE, d. MMMM yyyy', { locale: de }),
          bookingTime: format(booking.preferredDateTime, 'HH:mm'),
          studioAddress: booking.studio.address || undefined,
          studioPhone: booking.studio.phone || undefined,
          message: booking.message || undefined,
        },
        'de'
      );

      if (!emailResult.success) {
        console.error('Failed to send confirmation email:', emailResult.error);
        // Note: We don't fail the entire operation if email fails
      }
    } catch (emailError) {
      console.error('Exception sending confirmation email:', emailError);
      // Note: We don't fail the entire operation if email fails
    }

    // =====================================================
    // PUSH NOTIFICATION: BOOKING_CONFIRMED -> Customer
    // =====================================================
    try {
      const { sendBookingConfirmedNotification } = await import(
        '@/lib/notifications/booking-notification-helper'
      );

      const notificationResult = await sendBookingConfirmedNotification({
        bookingId: booking.id,
        studioId: booking.studioId,
        studioName: booking.studio.name,
        studioTimezone: booking.studio.timezone || 'Europe/Berlin',
        customerName: booking.customerName || 'Kunde',
        customerEmail: booking.customerEmail,
        serviceName: booking.service?.name || 'Massage',
        preferredDateTime: booking.preferredDateTime,
        customerId: booking.customerId,
      });

      if (notificationResult.ok && notificationResult.value.sent > 0) {
        console.log('Push notification sent to customer for booking confirmation');
      }
    } catch (notificationError) {
      console.error('Exception sending confirmation push notification:', notificationError);
      // Notification-Fehler sollten den Bestätigungsprozess NICHT blockieren
    }

    // Revalidate business dashboard pages
    revalidatePath('/[locale]/business');
    revalidatePath('/[locale]/business/calendar');
    revalidatePath('/[locale]/business/bookings');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error confirming booking:', error);
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    };
  }
}

/**
 * Decline a pending booking
 */
export async function declineBooking(
  bookingId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Nicht authentifiziert',
      };
    }

    // Get booking with studio and service details
    const booking = await prisma.newBooking.findUnique({
      where: { id: bookingId },
      include: {
        studio: {
          include: {
            ownerships: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden',
      };
    }

    // Verify user owns the studio
    if (booking.studio.ownerships.length === 0) {
      return {
        success: false,
        error: 'Keine Berechtigung für diese Buchung',
      };
    }

    // Check if booking is already confirmed or cancelled
    if (booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: 'Diese Buchung wurde bereits bearbeitet',
      };
    }

    // Update booking status
    await prisma.newBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledBy: session.user.id,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Send cancellation email to customer
    try {
      const emailResult = await sendBookingCancellationEmail(
        booking.customerEmail,
        {
          bookingId: booking.id,
          customerName: booking.customerName || 'Kunde',
          studioName: booking.studio.name,
          serviceName: booking.service?.name || 'Massage',
          bookingDate: format(booking.preferredDateTime, 'EEEE, d. MMMM yyyy', { locale: de }),
          bookingTime: format(booking.preferredDateTime, 'HH:mm'),
          cancellationReason: reason,
        },
        'de'
      );

      if (!emailResult.success) {
        console.error('Failed to send cancellation email:', emailResult.error);
        // Note: We don't fail the entire operation if email fails
      }
    } catch (emailError) {
      console.error('Exception sending cancellation email:', emailError);
      // Note: We don't fail the entire operation if email fails
    }

    // =====================================================
    // PUSH NOTIFICATION: BOOKING_REJECTED -> Customer
    // =====================================================
    try {
      const { sendBookingRejectedNotification } = await import(
        '@/lib/notifications/booking-notification-helper'
      );

      const notificationResult = await sendBookingRejectedNotification({
        bookingId: booking.id,
        studioId: booking.studioId,
        studioName: booking.studio.name,
        studioTimezone: booking.studio.timezone || 'Europe/Berlin',
        customerName: booking.customerName || 'Kunde',
        customerEmail: booking.customerEmail,
        serviceName: booking.service?.name || 'Massage',
        preferredDateTime: booking.preferredDateTime,
        customerId: booking.customerId,
        cancellationReason: reason,
      });

      if (notificationResult.ok && notificationResult.value.sent > 0) {
        console.log('Push notification sent to customer for booking rejection');
      }
    } catch (notificationError) {
      console.error('Exception sending rejection push notification:', notificationError);
      // Notification-Fehler sollten den Ablehnungsprozess NICHT blockieren
    }

    // Revalidate business dashboard pages
    revalidatePath('/[locale]/business');
    revalidatePath('/[locale]/business/calendar');
    revalidatePath('/[locale]/business/bookings');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error declining booking:', error);
    return {
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    };
  }
}
