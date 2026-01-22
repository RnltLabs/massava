/**
 * Metadata Type Guards
 *
 * Runtime type guards for validating notification metadata.
 * Used to safely narrow generic metadata to specific types.
 */

import {
  bookingNotificationMetadataSchema,
  paymentNotificationMetadataSchema,
  reviewNotificationMetadataSchema,
  securityNotificationMetadataSchema,
  systemNotificationMetadataSchema,
} from '@/lib/schemas/notification.schema';
import type {
  BookingNotificationMetadata,
  PaymentNotificationMetadata,
  ReviewNotificationMetadata,
  SecurityNotificationMetadata,
  SystemNotificationMetadata,
} from '../notification-metadata';

// ============================================
// Type Guards
// ============================================

/**
 * Type guard for booking notification metadata
 */
export function isBookingMetadata(
  meta: unknown
): meta is BookingNotificationMetadata {
  const result = bookingNotificationMetadataSchema.safeParse(meta);
  return result.success;
}

/**
 * Type guard for payment notification metadata
 */
export function isPaymentMetadata(
  meta: unknown
): meta is PaymentNotificationMetadata {
  const result = paymentNotificationMetadataSchema.safeParse(meta);
  return result.success;
}

/**
 * Type guard for review notification metadata
 */
export function isReviewMetadata(
  meta: unknown
): meta is ReviewNotificationMetadata {
  const result = reviewNotificationMetadataSchema.safeParse(meta);
  return result.success;
}

/**
 * Type guard for security notification metadata
 */
export function isSecurityMetadata(
  meta: unknown
): meta is SecurityNotificationMetadata {
  const result = securityNotificationMetadataSchema.safeParse(meta);
  return result.success;
}

/**
 * Type guard for system notification metadata
 */
export function isSystemMetadata(
  meta: unknown
): meta is SystemNotificationMetadata {
  const result = systemNotificationMetadataSchema.safeParse(meta);
  return result.success;
}

// ============================================
// Assertion Functions
// ============================================

/**
 * Assert metadata is booking metadata, throw if invalid
 */
export function assertBookingMetadata(
  meta: unknown
): asserts meta is BookingNotificationMetadata {
  if (!isBookingMetadata(meta)) {
    throw new Error('Invalid booking metadata');
  }
}

/**
 * Assert metadata is payment metadata, throw if invalid
 */
export function assertPaymentMetadata(
  meta: unknown
): asserts meta is PaymentNotificationMetadata {
  if (!isPaymentMetadata(meta)) {
    throw new Error('Invalid payment metadata');
  }
}

/**
 * Assert metadata is review metadata, throw if invalid
 */
export function assertReviewMetadata(
  meta: unknown
): asserts meta is ReviewNotificationMetadata {
  if (!isReviewMetadata(meta)) {
    throw new Error('Invalid review metadata');
  }
}

/**
 * Assert metadata is security metadata, throw if invalid
 */
export function assertSecurityMetadata(
  meta: unknown
): asserts meta is SecurityNotificationMetadata {
  if (!isSecurityMetadata(meta)) {
    throw new Error('Invalid security metadata');
  }
}

/**
 * Assert metadata is system metadata, throw if invalid
 */
export function assertSystemMetadata(
  meta: unknown
): asserts meta is SystemNotificationMetadata {
  if (!isSystemMetadata(meta)) {
    throw new Error('Invalid system metadata');
  }
}
