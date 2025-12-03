/**
 * Idempotency Key Generator
 *
 * Generates unique keys to prevent duplicate notifications on retry.
 * Keys are based on userId, type, and time window (1 minute) to ensure
 * that the same notification isn't created multiple times if a request is retried.
 *
 * @module lib/notifications/utils/idempotency
 */

import { createHash } from 'crypto';

/**
 * Input parameters for generating an idempotency key
 *
 * @interface IdempotencyInput
 * @property {string} userId - ID of the user being notified
 * @property {string} type - Notification type (e.g., BOOKING_CONFIRMED)
 * @property {string} [bookingId] - Optional booking reference for context
 * @property {number} timestamp - Current timestamp in milliseconds
 */
interface IdempotencyInput {
  userId: string;
  type: string;
  bookingId?: string;
  timestamp: number;
}

/**
 * Generate a deterministic idempotency key for a notification
 *
 * Creates a 32-character SHA256-based hash from notification details and a 1-minute time window.
 * This allows duplicate prevention: the same notification parameters within a 60-second window
 * will generate the same key, preventing duplicate creates if the request is retried.
 *
 * The 1-minute window is forgiving enough to handle network retries while preventing accidental
 * duplicates from rapid successive requests.
 *
 * @param {IdempotencyInput} input - Input parameters for key generation
 * @param {string} input.userId - ID of user to notify
 * @param {string} input.type - Notification type identifier
 * @param {string} [input.bookingId] - Booking reference (if applicable)
 * @param {number} input.timestamp - Current timestamp in milliseconds
 *
 * @returns {string} 32-character SHA256 hash of normalized input
 *
 * @example
 * ```typescript
 * const key = generateIdempotencyKey({
 *   userId: 'user-123',
 *   type: 'BOOKING_CONFIRMED',
 *   bookingId: 'booking-456',
 *   timestamp: 1705300800000,
 * });
 * // Returns: "a1b2c3d4e5f6..."
 *
 * // Same key generated within 60 seconds (same minute)
 * const key2 = generateIdempotencyKey({
 *   userId: 'user-123',
 *   type: 'BOOKING_CONFIRMED',
 *   bookingId: 'booking-456',
 *   timestamp: 1705300830000, // 30 seconds later
 * });
 * // Returns: "a1b2c3d4e5f6..." (same as key1)
 * ```
 *
 * @see {@link notificationService.create} - Uses this key to detect duplicates
 */
export function generateIdempotencyKey(input: IdempotencyInput): string {
  // Round timestamp to nearest minute for tolerance
  const roundedTimestamp = Math.floor(input.timestamp / 60000) * 60000;

  const data = JSON.stringify({
    userId: input.userId,
    type: input.type,
    bookingId: input.bookingId,
    timestamp: roundedTimestamp,
  });

  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}
