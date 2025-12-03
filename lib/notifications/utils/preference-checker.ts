/**
 * User Preference Checker
 *
 * Determines which channels (push, email, in-app) should receive a notification
 * based on user's global and type-specific preferences.
 *
 * @module lib/notifications/utils/preference-checker
 */

import type { NotificationType, NotificationChannel, NotificationPreference } from '@/app/generated/prisma';
import { DEFAULT_TYPE_PREFERENCES, DEFAULT_CHANNELS } from '../notification-types';
import { parseTypePreferences } from './json-helpers';
import type { TypePreference } from '@/lib/schemas/notification.schema';

/**
 * Determine which delivery channels a notification should use
 *
 * Applies user's notification preferences to determine the appropriate delivery channels.
 * Checks both global toggles (all push disabled, etc.) and type-specific preferences.
 * Falls back to IN_APP if no channels are selected to ensure user sees important notifications.
 *
 * @param {NotificationPreference | null} preferences - User's notification preferences (or null for defaults)
 * @param {NotificationType} type - Type of notification to check preferences for
 *
 * @returns {NotificationChannel[]} Array of channels to use (PUSH, EMAIL, IN_APP)
 *   Will include at least IN_APP to ensure notification is visible
 *
 * @example
 * ```typescript
 * // User has preferences set
 * const channels = checkUserPreferences(userPrefs, 'BOOKING_CONFIRMED');
 * // Returns: ['PUSH', 'EMAIL', 'IN_APP'] if all enabled
 *
 * // User has no preferences, uses defaults
 * const channels = checkUserPreferences(null, 'BOOKING_CONFIRMED');
 * // Returns: ['PUSH', 'EMAIL', 'IN_APP'] based on DEFAULT_TYPE_PREFERENCES
 * ```
 *
 * @see {@link shouldSendEmailImmediately} - Check email delivery mode
 * @see {@link DEFAULT_TYPE_PREFERENCES} - Default preferences per type
 */
export function checkUserPreferences(
  preferences: NotificationPreference | null,
  type: NotificationType
): NotificationChannel[] {
  const channels: NotificationChannel[] = [];

  // Parse type preferences from JSON
  const parsedPreferences = preferences
    ? parseTypePreferences(preferences.typePreferences)
    : {};

  // Use user's type preference or fall back to defaults
  const typePrefs: TypePreference =
    parsedPreferences[type] ?? DEFAULT_TYPE_PREFERENCES[type];

  if (!typePrefs) {
    // Fallback to default channels for this type
    return DEFAULT_CHANNELS[type] || ['IN_APP'];
  }

  // Check global toggles first, then type-specific settings
  if (preferences?.pushEnabled !== false && typePrefs.push) {
    channels.push('PUSH');
  }

  if (preferences?.emailEnabled !== false && typePrefs.email !== 'off') {
    channels.push('EMAIL');
  }

  if (preferences?.inAppEnabled !== false && typePrefs.inApp) {
    channels.push('IN_APP');
  }

  // Return at least IN_APP if no channels selected
  return channels.length > 0 ? channels : ['IN_APP'];
}

/**
 * Determine if email for a notification should be sent immediately or batched
 *
 * Checks user's email delivery preference for the notification type. Supports three modes:
 * - 'instant': Send email immediately
 * - 'digest': Batch with other notifications in daily digest email
 * - 'off': Don't send email
 *
 * This is used to decide whether to trigger immediate email delivery or queue for digest batching.
 *
 * @param {NotificationPreference | null} preferences - User's notification preferences
 * @param {NotificationType} type - Type of notification to check
 *
 * @returns {boolean} True if email should be sent immediately, false if digest/off
 *
 * @example
 * ```typescript
 * // Booking confirmation - typically instant
 * const shouldSend = shouldSendEmailImmediately(prefs, 'BOOKING_CONFIRMED');
 * // Returns: true
 *
 * // Promotion - typically digest
 * const shouldSend = shouldSendEmailImmediately(prefs, 'STUDIO_PROMOTION');
 * // Returns: false (batched for digest)
 * ```
 *
 * @see {@link checkUserPreferences} - Check all channels for a notification
 */
export function shouldSendEmailImmediately(
  preferences: NotificationPreference | null,
  type: NotificationType
): boolean {
  if (!preferences?.emailEnabled) {
    return false;
  }

  // Parse type preferences from JSON
  const parsedPreferences = parseTypePreferences(preferences.typePreferences);

  // Use user's type preference or fall back to defaults
  const typePrefs: TypePreference =
    parsedPreferences[type] ?? DEFAULT_TYPE_PREFERENCES[type];

  return typePrefs?.email === 'instant';
}
