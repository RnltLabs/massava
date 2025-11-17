/**
 * Customer Booking Cancellation Action
 * Task 4.3: Customer Cancellation Confirmation Integration
 */

"use server"

import { prisma } from '@/lib/prisma';
import { sendBookingCancelledByCustomerToOwner, sendCustomerCancellationConfirmation } from '@/lib/email/send';
import { logger } from '@/lib/logger';

interface CancellationResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Cancel a booking from the customer side
 * Sends notifications to both customer and studio owners
 */
export async function cancelBooking(
  bookingId: string,
  customerEmail: string,
  cancellationReason?: string,
  locale: string = 'de'
): Promise<CancellationResult> {
  try {
    // Fetch booking with related data
    const booking = await prisma.newBooking.findUnique({
      where: { id: bookingId },
      include: {
        studio: true,
        service: true,
      },
    });

    if (!booking) {
      logger.error('Booking not found for cancellation', {
        action: 'CANCEL_BOOKING',
        bookingId,
      });
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    // Check if booking is already cancelled
    if (booking.status === 'CANCELLED') {
      logger.warn('Attempted to cancel already cancelled booking', {
        action: 'CANCEL_BOOKING',
        bookingId,
      });
      return {
        success: false,
        error: 'Booking is already cancelled',
      };
    }

    // Update booking status to CANCELLED
    await prisma.newBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: booking.customerId || 'customer',
        cancellationReason: cancellationReason,
        updatedAt: new Date(),
      },
    });

    logger.info('Booking cancelled successfully', {
      action: 'CANCEL_BOOKING',
      bookingId,
      studioId: booking.studioId,
      customerId: booking.customerId,
    });

    // Format date and time for emails
    const bookingDate = new Date(booking.preferredDate).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const bookingTime = booking.preferredTime;

    // Get app URL for links
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // TASK 4.3: Send cancellation confirmation to customer
    const rebookUrl = `${appUrl}/${locale}/studios/${booking.studioId}`;
    
    const customerEmailResult = await sendCustomerCancellationConfirmation(
      customerEmail,
      {
        customerName: booking.customerName,
        bookingId: booking.id,
        studioName: booking.studio.name,
        serviceName: booking.service?.name || 'Service',
        bookingDate,
        bookingTime,
        rebookUrl,
      },
      locale
    );

    if (!customerEmailResult.success) {
      logger.error('Failed to send customer cancellation confirmation', {
        action: 'CANCEL_BOOKING',
        bookingId,
        error: customerEmailResult.error,
      });
    }

    // TASK 3.2: Notify all studio owners about the cancellation
    const studioOwnerships = await prisma.studioOwnership.findMany({
      where: { studioId: booking.studioId },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    const dashboardUrl = `${appUrl}/${locale}/business/calendar`;

    // Send owner notifications in parallel to avoid N+1 performance issue
    const ownerEmailPromises = studioOwnerships
      .filter((ownership) => ownership.user.email)
      .map((ownership) =>
        sendBookingCancelledByCustomerToOwner(
          ownership.user.email!,
          {
            studioName: booking.studio.name,
            ownerName: ownership.user.name || 'Studio Owner',
            bookingId: booking.id,
            customerName: booking.customerName,
            serviceName: booking.service?.name || 'Service',
            bookingDate,
            bookingTime,
            cancellationReason,
            dashboardUrl,
          },
          locale
        )
      );

    const ownerEmailResults = await Promise.allSettled(ownerEmailPromises);

    // Log any failed owner notifications
    ownerEmailResults.forEach((result, index) => {
      if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
        logger.error('Failed to send owner cancellation notification', {
          action: 'CANCEL_BOOKING',
          bookingId,
          error: result.status === 'rejected' ? result.reason : result.value.error,
        });
      }
    });

    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  } catch (error) {
    logger.error('Booking cancellation exception', {
      action: 'CANCEL_BOOKING',
      bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel booking',
    };
  }
}
