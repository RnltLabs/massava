/**
 * Notification Schema Definitions
 *
 * Zod schemas for validating notification JSON fields.
 * Used to safely parse data from Prisma's Json type.
 */

import { z } from 'zod';
import {
  NotificationStatus,
  NotificationChannel,
  NotificationType,
  DevicePlatform,
  ConsentAction,
} from '@/app/generated/prisma';
import { validateDeviceToken } from '@/lib/notifications/utils/token-validator';

// ============================================
// Status History Schema
// ============================================

/**
 * Schema for a single status history entry
 */
export const statusHistoryEntrySchema = z.object({
  status: z.nativeEnum(NotificationStatus),
  timestamp: z.string().datetime(),
  reason: z.string().optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
});

/**
 * Schema for status history array
 */
export const statusHistorySchema = z.array(statusHistoryEntrySchema);

export type StatusHistoryEntry = z.infer<typeof statusHistoryEntrySchema>;
export type StatusHistory = z.infer<typeof statusHistorySchema>;

// ============================================
// Type Preferences Schema
// ============================================

/**
 * Schema for a single type preference
 */
export const typePreferenceSchema = z.object({
  push: z.boolean(),
  email: z.enum(['instant', 'digest', 'off']),
  inApp: z.boolean(),
});

/**
 * Schema for type preferences map
 */
export const typePreferencesSchema = z.record(
  z.nativeEnum(NotificationType),
  typePreferenceSchema
);

export type TypePreference = z.infer<typeof typePreferenceSchema>;
export type TypePreferences = z.infer<typeof typePreferencesSchema>;

// ============================================
// Notification Metadata Schemas
// ============================================

/**
 * Booking notification metadata schema
 */
export const bookingNotificationMetadataSchema = z.object({
  bookingId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  serviceName: z.string(),
  servicePrice: z.number().optional(),
  appointmentTime: z.string().datetime(),
  studioName: z.string(),
  studioId: z.string(),
});

/**
 * Payment notification metadata schema
 */
export const paymentNotificationMetadataSchema = z.object({
  bookingId: z.string(),
  amount: z.number(),
  currency: z.string(),
  customerName: z.string(),
});

/**
 * Review notification metadata schema
 */
export const reviewNotificationMetadataSchema = z.object({
  reviewId: z.string(),
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  reviewerName: z.string(),
  studioName: z.string(),
  studioId: z.string(),
});

/**
 * Security notification metadata schema
 */
export const securityNotificationMetadataSchema = z.object({
  ipAddress: z.string().optional(),
  location: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

/**
 * System notification metadata schema
 */
export const systemNotificationMetadataSchema = z.object({
  maintenanceStart: z.string().datetime().optional(),
  maintenanceEnd: z.string().datetime().optional(),
  featureName: z.string().optional(),
  version: z.string().optional(),
  expirationDate: z.string().datetime().optional(),
});

/**
 * Generic metadata schema (fallback)
 */
export const genericMetadataSchema = z.record(z.string(), z.unknown());

/**
 * Union of all metadata schemas
 */
export const notificationMetadataSchema = z.union([
  bookingNotificationMetadataSchema,
  paymentNotificationMetadataSchema,
  reviewNotificationMetadataSchema,
  securityNotificationMetadataSchema,
  systemNotificationMetadataSchema,
  genericMetadataSchema,
]);

export type NotificationMetadata = z.infer<typeof notificationMetadataSchema>;

// ============================================
// Device Token Registration Schemas
// ============================================

/**
 * Custom Zod refinement for device token validation
 * Validates token format based on platform using token-validator utility
 */
const deviceTokenRefinement = (
  data: { token: string; platform: DevicePlatform },
  ctx: z.RefinementCtx
): void => {
  const result = validateDeviceToken(data.token, data.platform);

  if (!result.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: result.error || 'Invalid device token',
      path: ['token'],
    });
  }
};

/**
 * Schema for registering a new device token
 * Includes comprehensive validation for token format based on platform
 */
export const registerDeviceSchema = z
  .object({
    token: z
      .string({ message: 'Device token must be a string' })
      .min(1, { message: 'Device token cannot be empty' })
      .trim(),
    platform: z.nativeEnum(DevicePlatform, {
      message: 'Platform must be IOS, ANDROID, or WEB',
    }),
    deviceName: z.string().max(100).optional(),
    deviceModel: z.string().max(100).optional(),
    appVersion: z.string().max(50).optional(),
    osVersion: z.string().max(50).optional(),
  })
  .superRefine(deviceTokenRefinement);

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

/**
 * Schema for updating device information
 * Token and platform are optional for updates
 */
export const updateDeviceSchema = z.object({
  deviceName: z.string().max(100).optional(),
  deviceModel: z.string().max(100).optional(),
  appVersion: z.string().max(50).optional(),
  osVersion: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

// ============================================
// Notification Preferences Schemas
// ============================================

/**
 * Schema for updating notification preferences
 * Includes both global toggles and granular category preferences
 */
export const updateNotificationPreferencesSchema = z.object({
  // Global toggles
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),

  // Granular push preferences
  pushBookings: z.boolean().optional(),
  pushCancellations: z.boolean().optional(),
  pushReminders: z.boolean().optional(),
  pushMarketing: z.boolean().optional(),

  // Granular email preferences
  emailBookings: z.boolean().optional(),
  emailCancellations: z.boolean().optional(),
  emailReminders: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),

  // Email digest
  emailDigestEnabled: z.boolean().optional(),
  digestFrequency: z.enum(['DAILY', 'WEEKLY'], {
    message: 'Digest frequency must be DAILY or WEEKLY',
  }).optional(),
  digestTime: z.string().regex(/^\d{2}:\d{2}$/, {
    message: 'Time must be in HH:MM format',
  }).optional(),

  // Localization
  language: z.string().min(2).max(10).optional(),

  // Type preferences (advanced JSON-based preferences)
  typePreferences: z.record(z.string(), z.object({
    push: z.boolean(),
    email: z.enum(['instant', 'digest', 'off']),
    inApp: z.boolean(),
  })).optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

/**
 * Granular preferences response schema
 * Structured response format for API responses
 */
export const granularPreferencesResponseSchema = z.object({
  push: z.object({
    enabled: z.boolean(),
    bookings: z.boolean(),
    cancellations: z.boolean(),
    reminders: z.boolean(),
    marketing: z.boolean(),
  }),
  email: z.object({
    enabled: z.boolean(),
    bookings: z.boolean(),
    cancellations: z.boolean(),
    reminders: z.boolean(),
    marketing: z.boolean(),
  }),
  inApp: z.object({
    enabled: z.boolean(),
  }),
  digest: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['DAILY', 'WEEKLY']),
    time: z.string().nullable(),
  }),
  language: z.string(),
});

export type GranularPreferencesResponse = z.infer<typeof granularPreferencesResponseSchema>;

// ============================================
// Push Consent Schemas (GDPR Compliance)
// ============================================

/**
 * Schema for consent categories
 * Granular category consents as required by GDPR Art. 7
 */
export const consentCategoriesSchema = z.object({
  bookings: z.boolean(),
  cancellations: z.boolean(),
  reminders: z.boolean(),
  marketing: z.boolean(),
});

export type ConsentCategories = z.infer<typeof consentCategoriesSchema>;

/**
 * Schema for device information in consent logs
 */
export const consentDeviceInfoSchema = z.object({
  platform: z.string().optional(),
  model: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  browser: z.string().optional(),
}).optional();

export type ConsentDeviceInfo = z.infer<typeof consentDeviceInfoSchema>;

/**
 * Schema for creating a consent log entry
 * POST /api/notifications/consent
 */
export const createConsentLogSchema = z.object({
  action: z.nativeEnum(ConsentAction, {
    message: 'Action must be GRANTED, REVOKED, UPDATED, or CATEGORIES_CHANGED',
  }),
  categories: consentCategoriesSchema,
  consentVersion: z.string().min(1).max(50, {
    message: 'Consent version must be between 1 and 50 characters',
  }),
  method: z.string().min(1).max(100, {
    message: 'Method must be between 1 and 100 characters (e.g., "browser_prompt", "settings_toggle")',
  }),
  deviceInfo: consentDeviceInfoSchema,
  previousState: z.record(z.string(), z.unknown()).optional(),
  triggeredBy: z.enum(['user', 'admin', 'system_migration']).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateConsentLogInput = z.infer<typeof createConsentLogSchema>;

/**
 * Schema for consent log response
 */
export const consentLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.nativeEnum(ConsentAction),
  consentVersion: z.string(),
  categories: consentCategoriesSchema,
  method: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  deviceInfo: z.record(z.string(), z.unknown()).nullable(),
  previousState: z.record(z.string(), z.unknown()).nullable(),
  triggeredBy: z.string().nullable(),
  notes: z.string().nullable(),
  timestamp: z.date(),
});

export type ConsentLogResponse = z.infer<typeof consentLogResponseSchema>;

/**
 * Schema for consent status response
 * GET /api/notifications/consent/status
 */
export const consentStatusResponseSchema = z.object({
  hasConsented: z.boolean(),
  categories: consentCategoriesSchema.nullable(),
  consentVersion: z.string().nullable(),
  lastUpdated: z.date().nullable(),
});

export type ConsentStatusResponse = z.infer<typeof consentStatusResponseSchema>;

/**
 * Schema for consent history response
 * GET /api/notifications/consent
 */
export const consentHistoryResponseSchema = z.object({
  logs: z.array(consentLogResponseSchema),
  currentStatus: consentStatusResponseSchema,
});

export type ConsentHistoryResponse = z.infer<typeof consentHistoryResponseSchema>;

// ============================================
// Notification Click Tracking Schemas
// ============================================

/**
 * Schema for tracking notification clicks
 * POST /api/notifications/track
 */
export const trackNotificationClickSchema = z.object({
  notificationId: z.string().cuid({
    message: 'Invalid notification ID format',
  }),
  action: z.enum(['click', 'dismiss'], {
    message: 'Action must be either "click" or "dismiss"',
  }),
  clickAction: z.string().max(50).optional(), // Action button clicked (e.g., "confirm", "view", "review")
  timestamp: z.string().datetime({
    message: 'Timestamp must be in ISO 8601 format',
  }),
});

export type TrackNotificationClickInput = z.infer<typeof trackNotificationClickSchema>;

/**
 * Schema for tracking response
 */
export const trackNotificationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type TrackNotificationResponse = z.infer<typeof trackNotificationResponseSchema>;
