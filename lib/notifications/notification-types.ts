/**
 * Notification System Type Definitions
 *
 * Type-safe definitions for notification metadata and preferences.
 */

import type {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  DigestFrequency,
} from '@/app/generated/prisma';

// Re-export Prisma enums for convenience
export { NotificationType, NotificationStatus, NotificationPriority, NotificationChannel, DigestFrequency };

/**
 * Granular notification preference categories
 *
 * Categories map to groups of notification types:
 * - bookings: BOOKING_CONFIRMED, BOOKING_REQUEST_RECEIVED, etc.
 * - cancellations: BOOKING_CANCELLED_BY_CUSTOMER, BOOKING_CANCELLED_BY_STUDIO
 * - reminders: BOOKING_REMINDER_CUSTOMER, BOOKING_REMINDER_STUDIO
 * - marketing: STUDIO_PROMOTION, FEATURE_ANNOUNCEMENT
 */
export type NotificationCategory = 'bookings' | 'cancellations' | 'reminders' | 'marketing';

/**
 * Granular push notification preferences
 */
export interface PushPreferences {
  enabled: boolean;
  bookings: boolean;
  cancellations: boolean;
  reminders: boolean;
  marketing: boolean;
}

/**
 * Granular email notification preferences
 */
export interface EmailPreferences {
  enabled: boolean;
  bookings: boolean;
  cancellations: boolean;
  reminders: boolean;
  marketing: boolean;
}

/**
 * In-app notification preferences
 */
export interface InAppPreferences {
  enabled: boolean;
}

/**
 * Email digest preferences
 */
export interface DigestPreferences {
  enabled: boolean;
  frequency: DigestFrequency;
  time: string | null; // HH:MM format
}

/**
 * Complete granular notification preferences
 * Returned by GET /api/notifications/preferences
 */
export interface GranularNotificationPreferences {
  push: PushPreferences;
  email: EmailPreferences;
  inApp: InAppPreferences;
  digest: DigestPreferences;
  language: string;
}

/**
 * Status history entry for tracking notification state changes
 *
 * Records each state transition of a notification with timestamp and reason for audit trail.
 * Enables tracking the lifecycle of notifications from creation through delivery/failure.
 *
 * @interface StatusHistoryEntry
 * @property {NotificationStatus} status - Current status at this point in history
 * @property {string} timestamp - ISO 8601 datetime when status changed
 * @property {string} [reason] - Human-readable reason for status change (e.g., "Expired", "Quiet hours")
 * @property {NotificationChannel} [channel] - Specific channel if status change is per-channel
 *
 * @example
 * ```typescript
 * const history: StatusHistoryEntry[] = [
 *   { status: 'PENDING', timestamp: '2025-01-15T10:00:00Z', reason: 'Created' },
 *   { status: 'QUEUED', timestamp: '2025-01-15T10:00:01Z', reason: 'Added to queue' },
 *   { status: 'SENDING', timestamp: '2025-01-15T10:00:02Z', reason: 'Processing channels' },
 *   { status: 'DELIVERED', timestamp: '2025-01-15T10:00:03Z', reason: '3/3 channels succeeded' },
 * ];
 * ```
 */
export interface StatusHistoryEntry {
  status: NotificationStatus;
  timestamp: string; // ISO 8601
  reason?: string;
  channel?: NotificationChannel;
}

/**
 * Per-type preference configuration for a specific notification type
 *
 * Defines how a user wants to receive a particular notification type across different channels.
 * Allows fine-grained control (e.g., receive booking confirmations via push and email, but not in-app).
 *
 * @interface TypePreference
 * @property {boolean} push - Whether to send push notifications
 * @property {'instant' | 'digest' | 'off'} email - Email delivery mode:
 *   - 'instant': Send email immediately
 *   - 'digest': Batch in daily digest email
 *   - 'off': Don't send email
 * @property {boolean} inApp - Whether to show in-app notification in notification center
 *
 * @example
 * ```typescript
 * // User wants booking updates via push + email, but not in-app
 * const bookingPrefs: TypePreference = {
 *   push: true,
 *   email: 'instant',
 *   inApp: false,
 * };
 *
 * // User wants promotions only in digest emails, no push/in-app
 * const promoPrefs: TypePreference = {
 *   push: false,
 *   email: 'digest',
 *   inApp: false,
 * };
 * ```
 */
export interface TypePreference {
  push: boolean;
  email: 'instant' | 'digest' | 'off';
  inApp: boolean;
}

/**
 * Map of notification type to preference configuration
 *
 * Allows customization of preferences for any subset of notification types.
 * Missing types use DEFAULT_TYPE_PREFERENCES defaults.
 *
 * @typedef {Partial<Record<NotificationType, TypePreference>>} TypePreferences
 *
 * @example
 * ```typescript
 * const userPrefs: TypePreferences = {
 *   BOOKING_CONFIRMED: { push: true, email: 'instant', inApp: true },
 *   BOOKING_REMINDER_CUSTOMER: { push: true, email: 'off', inApp: true },
 *   STUDIO_PROMOTION: { push: false, email: 'digest', inApp: false },
 * };
 * ```
 */
export type TypePreferences = Partial<Record<NotificationType, TypePreference>>;

/**
 * Default preferences per notification type
 *
 * Provides sensible defaults for all notification types. Used when a user hasn't customized
 * preferences for a specific type. For example, urgent booking reminders are delivered via
 * push by default, while promotions are digest-only.
 *
 * @constant {Record<NotificationType, TypePreference>} DEFAULT_TYPE_PREFERENCES
 */
export const DEFAULT_TYPE_PREFERENCES: Record<NotificationType, TypePreference> = {
  // Studio Owner
  BOOKING_REQUEST_RECEIVED: { push: true, email: 'instant', inApp: true },
  BOOKING_CANCELLED_BY_CUSTOMER: { push: true, email: 'instant', inApp: true },
  BOOKING_REMINDER_STUDIO: { push: true, email: 'off', inApp: true },
  PAYMENT_RECEIVED: { push: true, email: 'instant', inApp: true },
  REVIEW_POSTED: { push: true, email: 'off', inApp: true },
  LOW_AVAILABILITY_ALERT: { push: false, email: 'instant', inApp: true },

  // Customer
  BOOKING_CONFIRMED: { push: true, email: 'instant', inApp: true },
  BOOKING_REJECTED: { push: true, email: 'instant', inApp: true },
  BOOKING_REMINDER_CUSTOMER: { push: true, email: 'off', inApp: true },
  BOOKING_CANCELLED_BY_STUDIO: { push: true, email: 'instant', inApp: true },
  REVIEW_REQUEST: { push: true, email: 'instant', inApp: false },
  STUDIO_PROMOTION: { push: false, email: 'digest', inApp: false },

  // Security
  ACCOUNT_LOGIN_NEW_DEVICE: { push: true, email: 'instant', inApp: false },
  ACCOUNT_PASSWORD_CHANGED: { push: false, email: 'instant', inApp: false },
  ACCOUNT_EMAIL_CHANGED: { push: false, email: 'instant', inApp: false },
  ACCOUNT_TWO_FACTOR_ENABLED: { push: false, email: 'instant', inApp: false },
  ACCOUNT_DELETION_SCHEDULED: { push: false, email: 'instant', inApp: true },
  ACCOUNT_DELETION_CANCELLED: { push: false, email: 'instant', inApp: true },

  // System
  SYSTEM_MAINTENANCE: { push: true, email: 'instant', inApp: true },
  FEATURE_ANNOUNCEMENT: { push: false, email: 'off', inApp: true },
  TERMS_UPDATE: { push: false, email: 'instant', inApp: true },
  WELCOME: { push: false, email: 'instant', inApp: false },
  ONBOARDING_REMINDER: { push: true, email: 'instant', inApp: false },
  SUBSCRIPTION_EXPIRING: { push: true, email: 'instant', inApp: true },
  SUBSCRIPTION_EXPIRED: { push: true, email: 'instant', inApp: true },
};

/**
 * Default delivery channels for each notification type
 *
 * Determines which channels (push, email, in-app) are used by default for each notification type
 * if the user hasn't customized preferences. For example, booking confirmations go to all channels,
 * while promotions only go via email.
 *
 * @constant {Record<NotificationType, NotificationChannel[]>} DEFAULT_CHANNELS
 */
export const DEFAULT_CHANNELS: Record<NotificationType, NotificationChannel[]> = {
  // Studio Owner
  BOOKING_REQUEST_RECEIVED: ['PUSH', 'EMAIL', 'IN_APP'],
  BOOKING_CANCELLED_BY_CUSTOMER: ['PUSH', 'EMAIL', 'IN_APP'],
  BOOKING_REMINDER_STUDIO: ['PUSH', 'IN_APP'],
  PAYMENT_RECEIVED: ['PUSH', 'EMAIL', 'IN_APP'],
  REVIEW_POSTED: ['PUSH', 'IN_APP'],
  LOW_AVAILABILITY_ALERT: ['EMAIL', 'IN_APP'],

  // Customer
  BOOKING_CONFIRMED: ['PUSH', 'EMAIL', 'IN_APP'],
  BOOKING_REJECTED: ['PUSH', 'EMAIL', 'IN_APP'],
  BOOKING_REMINDER_CUSTOMER: ['PUSH', 'IN_APP'],
  BOOKING_CANCELLED_BY_STUDIO: ['PUSH', 'EMAIL', 'IN_APP'],
  REVIEW_REQUEST: ['PUSH', 'EMAIL'],
  STUDIO_PROMOTION: ['EMAIL'],

  // Security
  ACCOUNT_LOGIN_NEW_DEVICE: ['PUSH', 'EMAIL'],
  ACCOUNT_PASSWORD_CHANGED: ['EMAIL'],
  ACCOUNT_EMAIL_CHANGED: ['EMAIL'],
  ACCOUNT_TWO_FACTOR_ENABLED: ['EMAIL'],
  ACCOUNT_DELETION_SCHEDULED: ['EMAIL', 'IN_APP'],
  ACCOUNT_DELETION_CANCELLED: ['EMAIL', 'IN_APP'],

  // System
  SYSTEM_MAINTENANCE: ['PUSH', 'EMAIL', 'IN_APP'],
  FEATURE_ANNOUNCEMENT: ['IN_APP'],
  TERMS_UPDATE: ['EMAIL', 'IN_APP'],
  WELCOME: ['EMAIL'],
  ONBOARDING_REMINDER: ['EMAIL', 'PUSH'],
  SUBSCRIPTION_EXPIRING: ['EMAIL', 'PUSH', 'IN_APP'],
  SUBSCRIPTION_EXPIRED: ['EMAIL', 'PUSH', 'IN_APP'],
};

/**
 * Default priority level for each notification type
 *
 * Determines delivery urgency and handling behavior.
 *
 * Priority levels:
 * - URGENT: High-priority queue, double haptic feedback
 * - HIGH: Medium-priority queue, strong haptic feedback
 * - NORMAL: Standard queue, light haptic feedback
 * - LOW: May be batched or delayed, standard queue, minimal haptic feedback
 *
 * @constant {Record<NotificationType, NotificationPriority>} DEFAULT_PRIORITIES
 */
export const DEFAULT_PRIORITIES: Record<NotificationType, NotificationPriority> = {
  // Studio Owner
  BOOKING_REQUEST_RECEIVED: 'URGENT',
  BOOKING_CANCELLED_BY_CUSTOMER: 'HIGH',
  BOOKING_REMINDER_STUDIO: 'NORMAL',
  PAYMENT_RECEIVED: 'NORMAL',
  REVIEW_POSTED: 'LOW',
  LOW_AVAILABILITY_ALERT: 'NORMAL',

  // Customer
  BOOKING_CONFIRMED: 'HIGH',
  BOOKING_REJECTED: 'HIGH',
  BOOKING_REMINDER_CUSTOMER: 'URGENT',
  BOOKING_CANCELLED_BY_STUDIO: 'HIGH',
  REVIEW_REQUEST: 'LOW',
  STUDIO_PROMOTION: 'LOW',

  // Security
  ACCOUNT_LOGIN_NEW_DEVICE: 'HIGH',
  ACCOUNT_PASSWORD_CHANGED: 'HIGH',
  ACCOUNT_EMAIL_CHANGED: 'HIGH',
  ACCOUNT_TWO_FACTOR_ENABLED: 'NORMAL',
  ACCOUNT_DELETION_SCHEDULED: 'HIGH',
  ACCOUNT_DELETION_CANCELLED: 'NORMAL',

  // System
  SYSTEM_MAINTENANCE: 'NORMAL',
  FEATURE_ANNOUNCEMENT: 'LOW',
  TERMS_UPDATE: 'NORMAL',
  WELCOME: 'LOW',
  ONBOARDING_REMINDER: 'LOW',
  SUBSCRIPTION_EXPIRING: 'HIGH',
  SUBSCRIPTION_EXPIRED: 'URGENT',
};
