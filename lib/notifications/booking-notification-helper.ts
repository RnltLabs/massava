/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Push Notification Helper Module
 *
 * Central helper module for sending booking-related push notifications.
 * Handles notifications for both studio owners and customers.
 *
 * @module lib/notifications/booking-notification-helper
 */

import { notificationService } from '@/lib/notifications/notification-service';
import { prisma } from '@/lib/prisma';
import { logger, generateCorrelationId } from '@/lib/logger';
import { Result, ok } from '@/lib/result';
import type { NotificationError } from '@/lib/notifications/errors';
import type { BookingNotificationMetadata } from '@/lib/notifications/notification-metadata';

// ============================================
// Types
// ============================================

/**
 * Input interface for booking notification functions.
 * Contains all necessary information to send booking-related notifications.
 */
export interface BookingNotificationInput {
  /** Unique identifier of the booking */
  bookingId: string;
  /** Unique identifier of the studio */
  studioId: string;
  /** Display name of the studio */
  studioName: string;
  /** IANA timezone of the studio (e.g., 'Europe/Berlin') */
  studioTimezone: string;
  /** Full name of the customer */
  customerName: string;
  /** Email address of the customer (optional) */
  customerEmail?: string;
  /** Name of the booked service */
  serviceName: string;
  /** Preferred date and time for the appointment */
  preferredDateTime: Date;
  /** User ID of the customer (null for guest bookings) */
  customerId?: string | null;
  /** Reason for cancellation (only for cancellation notifications) */
  cancellationReason?: string;
}

/**
 * Result type for notification operations
 */
type NotificationResult = Result<{ sent: number; failed: number }, NotificationError>;

// ============================================
// Helper Functions
// ============================================

/**
 * Retrieves all owner user IDs for a given studio.
 *
 * @param studioId - The studio ID to fetch owners for
 * @param correlationId - Correlation ID for tracing
 * @returns Array of owner user IDs
 */
async function getStudioOwnerIds(
  studioId: string,
  correlationId: string
): Promise<string[]> {
  try {
    const ownerships = await prisma.studioOwnership.findMany({
      where: { studioId },
      select: { userId: true },
    });

    return ownerships.map((ownership) => ownership.userId);
  } catch (error) {
    logger.error('Failed to fetch studio owners', {
      error: error instanceof Error ? error : new Error(String(error)),
      studioId,
      correlationId,
    });
    return [];
  }
}

/**
 * Formats the appointment time as ISO 8601 string.
 * The schema requires datetime format for validation.
 *
 * @param dateTime - The UTC date/time to format
 * @returns ISO 8601 formatted date string
 */
function formatAppointmentTime(dateTime: Date): string {
  return dateTime.toISOString();
}

/**
 * Creates the booking notification metadata object.
 *
 * @param input - Booking notification input
 * @returns Metadata object compatible with notification service
 */
function createBookingMetadata(
  input: BookingNotificationInput
): Record<string, unknown> {
  const metadata: BookingNotificationMetadata = {
    bookingId: input.bookingId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    serviceName: input.serviceName,
    appointmentTime: formatAppointmentTime(input.preferredDateTime),
    studioName: input.studioName,
    studioId: input.studioId,
    studioTimezone: input.studioTimezone, // Include timezone for proper date formatting
  };
  // Return as Record<string, unknown> to satisfy notificationService.create() signature
  return metadata as unknown as Record<string, unknown>;
}

// ============================================
// Public Functions
// ============================================

/**
 * Sends a notification to all studio owners when a new booking request is received.
 *
 * This notification is sent with URGENT priority as booking requests
 * require timely confirmation from studio owners.
 *
 * @param input - Booking notification input containing all necessary booking details
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendBookingRequestReceivedNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   customerEmail: 'max@example.com',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 * });
 *
 * if (result.ok) {
 *   console.log(`Sent ${result.value.sent} notifications`);
 * }
 * ```
 */
export async function sendBookingRequestReceivedNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  logger.info('Sending booking request received notifications to studio owners', {
    bookingId: input.bookingId,
    studioId: input.studioId,
    correlationId,
  });

  const ownerIds = await getStudioOwnerIds(input.studioId, correlationId);

  if (ownerIds.length === 0) {
    logger.warn('No studio owners found for notification', {
      studioId: input.studioId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  const metadata = createBookingMetadata(input);
  let sent = 0;
  let failed = 0;

  // Send notification to each owner
  for (const ownerId of ownerIds) {
    const result = await notificationService.create({
      userId: ownerId,
      type: 'BOOKING_REQUEST_RECEIVED',
      metadata,
      priority: 'URGENT',
      bookingId: input.bookingId,
      studioId: input.studioId,
      actionUrl: `/studio/${input.studioId}/bookings/${input.bookingId}`,
    });

    if (result.ok) {
      sent++;
      logger.debug('Booking request notification sent to owner', {
        ownerId,
        notificationId: result.value.id,
        correlationId,
      });
    } else {
      failed++;
      logger.error('Failed to send booking request notification to owner', {
        ownerId,
        errorType: result.error.type,
        errorMessage: result.error.message,
        correlationId,
      });
    }
  }

  logger.info('Booking request notifications completed', {
    bookingId: input.bookingId,
    studioId: input.studioId,
    sent,
    failed,
    totalOwners: ownerIds.length,
    correlationId,
  });

  return ok({ sent, failed });
}

/**
 * Sends a notification to the customer when their booking is confirmed.
 *
 * This notification is sent with HIGH priority as booking confirmations
 * are important for customers to know their appointment is scheduled.
 *
 * Note: Guest bookings (customerId = null) are skipped as push notifications
 * require a registered user account.
 *
 * @param input - Booking notification input containing all necessary booking details
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendBookingConfirmedNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 * });
 *
 * if (result.ok && result.value.sent > 0) {
 *   console.log('Customer notified of booking confirmation');
 * }
 * ```
 */
export async function sendBookingConfirmedNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  // Skip guest bookings - push notifications require registered users
  if (!input.customerId) {
    logger.debug('Skipping booking confirmation notification for guest booking', {
      bookingId: input.bookingId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  logger.info('Sending booking confirmed notification to customer', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    correlationId,
  });

  const metadata = createBookingMetadata(input);

  const result = await notificationService.create({
    userId: input.customerId,
    type: 'BOOKING_CONFIRMED',
    metadata,
    priority: 'HIGH',
    bookingId: input.bookingId,
    studioId: input.studioId,
    actionUrl: `/bookings/${input.bookingId}`,
  });

  if (result.ok) {
    logger.info('Booking confirmed notification sent', {
      bookingId: input.bookingId,
      customerId: input.customerId,
      notificationId: result.value.id,
      correlationId,
    });
    return ok({ sent: 1, failed: 0 });
  }

  logger.error('Failed to send booking confirmed notification', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    errorType: result.error.type,
    errorMessage: result.error.message,
    correlationId,
  });

  return ok({ sent: 0, failed: 1 });
}

/**
 * Sends a notification to all studio owners when a customer cancels their booking.
 *
 * This notification is sent with HIGH priority so studio owners are promptly
 * informed about cancellations and can adjust their schedule accordingly.
 *
 * @param input - Booking notification input containing all necessary booking details
 *               (cancellationReason is included in metadata if provided)
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendBookingCancelledByCustomerNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 *   cancellationReason: 'Personal emergency',
 * });
 *
 * if (result.ok) {
 *   console.log(`Notified ${result.value.sent} studio owners of cancellation`);
 * }
 * ```
 */
export async function sendBookingCancelledByCustomerNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  logger.info('Sending booking cancelled notifications to studio owners', {
    bookingId: input.bookingId,
    studioId: input.studioId,
    correlationId,
  });

  const ownerIds = await getStudioOwnerIds(input.studioId, correlationId);

  if (ownerIds.length === 0) {
    logger.warn('No studio owners found for cancellation notification', {
      studioId: input.studioId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  const baseMetadata = createBookingMetadata(input);
  const metadata: Record<string, unknown> = {
    ...baseMetadata,
    ...(input.cancellationReason && {
      cancellationReason: input.cancellationReason,
    }),
  };

  let sent = 0;
  let failed = 0;

  // Send notification to each owner
  for (const ownerId of ownerIds) {
    const result = await notificationService.create({
      userId: ownerId,
      type: 'BOOKING_CANCELLED_BY_CUSTOMER',
      metadata,
      priority: 'HIGH',
      bookingId: input.bookingId,
      studioId: input.studioId,
      actionUrl: `/studio/${input.studioId}/bookings/${input.bookingId}`,
    });

    if (result.ok) {
      sent++;
      logger.debug('Booking cancellation notification sent to owner', {
        ownerId,
        notificationId: result.value.id,
        correlationId,
      });
    } else {
      failed++;
      logger.error('Failed to send booking cancellation notification to owner', {
        ownerId,
        errorType: result.error.type,
        errorMessage: result.error.message,
        correlationId,
      });
    }
  }

  logger.info('Booking cancellation notifications completed', {
    bookingId: input.bookingId,
    studioId: input.studioId,
    sent,
    failed,
    totalOwners: ownerIds.length,
    correlationId,
  });

  return ok({ sent, failed });
}

/**
 * Sends a notification to the customer when their booking is rejected by the studio.
 *
 * This notification is sent with HIGH priority as customers need to know
 * their booking was not accepted and may need to rebook.
 *
 * Note: Guest bookings (customerId = null) are skipped as push notifications
 * require a registered user account.
 *
 * @param input - Booking notification input containing all necessary booking details
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendBookingRejectedNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 * });
 *
 * if (result.ok && result.value.sent > 0) {
 *   console.log('Customer notified of booking rejection');
 * }
 * ```
 */
export async function sendBookingRejectedNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  // Skip guest bookings - push notifications require registered users
  if (!input.customerId) {
    logger.debug('Skipping booking rejection notification for guest booking', {
      bookingId: input.bookingId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  logger.info('Sending booking rejected notification to customer', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    correlationId,
  });

  const metadata = createBookingMetadata(input);

  const result = await notificationService.create({
    userId: input.customerId,
    type: 'BOOKING_REJECTED',
    metadata,
    priority: 'HIGH',
    bookingId: input.bookingId,
    studioId: input.studioId,
    actionUrl: `/studios/${input.studioId}`,
  });

  if (result.ok) {
    logger.info('Booking rejected notification sent', {
      bookingId: input.bookingId,
      customerId: input.customerId,
      notificationId: result.value.id,
      correlationId,
    });
    return ok({ sent: 1, failed: 0 });
  }

  logger.error('Failed to send booking rejected notification', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    errorType: result.error.type,
    errorMessage: result.error.message,
    correlationId,
  });

  return ok({ sent: 0, failed: 1 });
}

/**
 * Sends a notification to the customer when their confirmed booking is cancelled by the studio.
 *
 * This notification is sent with HIGH priority as customers need to be promptly
 * informed when their confirmed appointment is cancelled by the studio.
 *
 * Note: Guest bookings (customerId = null) are skipped as push notifications
 * require a registered user account.
 *
 * @param input - Booking notification input containing all necessary booking details
 *               (cancellationReason is included in metadata if provided)
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendBookingCancelledByStudioNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   customerEmail: 'max@example.com',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 *   cancellationReason: 'Studio emergency closure',
 * });
 *
 * if (result.ok && result.value.sent > 0) {
 *   console.log('Customer notified of studio cancellation');
 * }
 * ```
 */
export async function sendBookingCancelledByStudioNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  // Skip guest bookings - push notifications require registered users
  if (!input.customerId) {
    logger.debug('Skipping studio cancellation notification for guest booking', {
      bookingId: input.bookingId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  logger.info('Sending booking cancelled by studio notification to customer', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    studioId: input.studioId,
    correlationId,
  });

  const baseMetadata = createBookingMetadata(input);
  const metadata: Record<string, unknown> = {
    ...baseMetadata,
    ...(input.cancellationReason && {
      cancellationReason: input.cancellationReason,
    }),
  };

  const result = await notificationService.create({
    userId: input.customerId,
    type: 'BOOKING_CANCELLED_BY_STUDIO',
    metadata,
    priority: 'HIGH',
    bookingId: input.bookingId,
    studioId: input.studioId,
    actionUrl: `/bookings/${input.bookingId}`,
  });

  if (result.ok) {
    logger.info('Booking cancelled by studio notification sent', {
      bookingId: input.bookingId,
      customerId: input.customerId,
      notificationId: result.value.id,
      correlationId,
    });
    return ok({ sent: 1, failed: 0 });
  }

  logger.error('Failed to send booking cancelled by studio notification', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    errorType: result.error.type,
    errorMessage: result.error.message,
    correlationId,
  });

  return ok({ sent: 0, failed: 1 });
}

/**
 * Sends a reminder notification to the customer 24 hours before their appointment.
 *
 * This notification is sent with URGENT priority as reminders are time-sensitive
 * and customers need to prepare for their upcoming appointment.
 *
 * Note: Guest bookings (customerId = null) are skipped as push notifications
 * require a registered user account. The notification service automatically
 * checks the user's pushReminders preference before sending.
 *
 * @param input - Booking notification input containing all necessary booking details
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendBookingReminderCustomerNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 * });
 *
 * if (result.ok && result.value.sent > 0) {
 *   console.log('Customer reminded of upcoming appointment');
 * }
 * ```
 */
export async function sendBookingReminderCustomerNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  // Skip guest bookings - push notifications require registered users
  if (!input.customerId) {
    logger.debug('Skipping booking reminder notification for guest booking', {
      bookingId: input.bookingId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  logger.info('Sending booking reminder notification to customer', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    appointmentTime: input.preferredDateTime.toISOString(),
    correlationId,
  });

  const metadata = createBookingMetadata(input);

  const result = await notificationService.create({
    userId: input.customerId,
    type: 'BOOKING_REMINDER_CUSTOMER',
    metadata,
    priority: 'URGENT',
    bookingId: input.bookingId,
    studioId: input.studioId,
    actionUrl: `/bookings/${input.bookingId}`,
  });

  if (result.ok) {
    logger.info('Booking reminder notification sent to customer', {
      bookingId: input.bookingId,
      customerId: input.customerId,
      notificationId: result.value.id,
      correlationId,
    });
    return ok({ sent: 1, failed: 0 });
  }

  logger.error('Failed to send booking reminder notification to customer', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    errorType: result.error.type,
    errorMessage: result.error.message,
    correlationId,
  });

  return ok({ sent: 0, failed: 1 });
}

/**
 * Sends a reminder notification to all studio owners 1 hour before an appointment.
 *
 * This notification is sent with NORMAL priority as studio owners typically
 * manage their schedule throughout the day and need awareness of upcoming appointments.
 *
 * The notification service automatically checks each owner's pushReminders preference
 * before sending.
 *
 * @param input - Booking notification input containing all necessary booking details
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendBookingReminderStudioNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 * });
 *
 * if (result.ok) {
 *   console.log(`Notified ${result.value.sent} studio owners of upcoming appointment`);
 * }
 * ```
 */
export async function sendBookingReminderStudioNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  logger.info('Sending booking reminder notifications to studio owners', {
    bookingId: input.bookingId,
    studioId: input.studioId,
    appointmentTime: input.preferredDateTime.toISOString(),
    correlationId,
  });

  const ownerIds = await getStudioOwnerIds(input.studioId, correlationId);

  if (ownerIds.length === 0) {
    logger.warn('No studio owners found for reminder notification', {
      studioId: input.studioId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  const metadata = createBookingMetadata(input);
  let sent = 0;
  let failed = 0;

  // Send notification to each owner
  for (const ownerId of ownerIds) {
    const result = await notificationService.create({
      userId: ownerId,
      type: 'BOOKING_REMINDER_STUDIO',
      metadata,
      priority: 'NORMAL',
      bookingId: input.bookingId,
      studioId: input.studioId,
      actionUrl: `/studio/${input.studioId}/bookings/${input.bookingId}`,
    });

    if (result.ok) {
      sent++;
      logger.debug('Booking reminder notification sent to studio owner', {
        ownerId,
        notificationId: result.value.id,
        correlationId,
      });
    } else {
      failed++;
      logger.error('Failed to send booking reminder notification to studio owner', {
        ownerId,
        errorType: result.error.type,
        errorMessage: result.error.message,
        correlationId,
      });
    }
  }

  logger.info('Booking reminder notifications to studio completed', {
    bookingId: input.bookingId,
    studioId: input.studioId,
    sent,
    failed,
    totalOwners: ownerIds.length,
    correlationId,
  });

  return ok({ sent, failed });
}

/**
 * Sends a review request notification to the customer 2 hours after their appointment ends.
 *
 * This notification is sent with LOW priority as review requests are not urgent
 * and customers can complete them at their convenience.
 *
 * The notification encourages customers to leave a review for their completed appointment,
 * which helps studios build their reputation and receive valuable feedback.
 *
 * Note: Guest bookings (customerId = null) are skipped as push notifications
 * require a registered user account.
 *
 * @param input - Booking notification input containing all necessary booking details
 * @returns Result with count of sent and failed notifications
 *
 * @example
 * ```typescript
 * const result = await sendReviewRequestNotification({
 *   bookingId: 'booking-123',
 *   studioId: 'studio-456',
 *   studioName: 'Tattoo Studio Berlin',
 *   studioTimezone: 'Europe/Berlin',
 *   customerName: 'Max Mustermann',
 *   serviceName: 'Full Sleeve Tattoo',
 *   preferredDateTime: new Date('2025-12-15T14:00:00Z'),
 *   customerId: 'user-789',
 * });
 *
 * if (result.ok && result.value.sent > 0) {
 *   console.log('Review request sent to customer');
 * }
 * ```
 */
export async function sendReviewRequestNotification(
  input: BookingNotificationInput
): Promise<NotificationResult> {
  const correlationId = generateCorrelationId();

  // Skip guest bookings - push notifications require registered users
  if (!input.customerId) {
    logger.debug('Skipping review request notification for guest booking', {
      bookingId: input.bookingId,
      correlationId,
    });
    return ok({ sent: 0, failed: 0 });
  }

  logger.info('Sending review request notification to customer', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    studioId: input.studioId,
    correlationId,
  });

  const metadata = createBookingMetadata(input);

  const result = await notificationService.create({
    userId: input.customerId,
    type: 'REVIEW_REQUEST',
    metadata,
    priority: 'LOW',
    bookingId: input.bookingId,
    studioId: input.studioId,
    actionUrl: `/studio/${input.studioId}/review?bookingId=${input.bookingId}`,
  });

  if (result.ok) {
    logger.info('Review request notification sent to customer', {
      bookingId: input.bookingId,
      customerId: input.customerId,
      notificationId: result.value.id,
      correlationId,
    });
    return ok({ sent: 1, failed: 0 });
  }

  logger.error('Failed to send review request notification to customer', {
    bookingId: input.bookingId,
    customerId: input.customerId,
    errorType: result.error.type,
    errorMessage: result.error.message,
    correlationId,
  });

  return ok({ sent: 0, failed: 1 });
}
