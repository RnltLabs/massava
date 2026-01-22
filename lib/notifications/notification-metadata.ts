/**
 * Notification Metadata Type Definitions
 *
 * Type-safe metadata structures for different notification types.
 */

/**
 * Booking-related notification metadata
 */
export interface BookingNotificationMetadata {
  bookingId: string;
  customerName: string;
  customerEmail?: string;
  serviceName: string;
  servicePrice?: number;
  appointmentTime: string; // ISO 8601
  studioName: string;
  studioId: string;
  studioTimezone?: string; // IANA timezone (e.g., 'Europe/Berlin')
}

/**
 * Payment notification metadata
 */
export interface PaymentNotificationMetadata {
  bookingId: string;
  amount: number;
  currency: string;
  customerName: string;
}

/**
 * Review notification metadata
 */
export interface ReviewNotificationMetadata {
  reviewId: string;
  bookingId: string;
  rating: number;
  reviewerName: string;
  studioName: string;
  studioId: string;
}

/**
 * Security notification metadata
 */
export interface SecurityNotificationMetadata {
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
  timestamp?: string;
}

/**
 * System notification metadata
 */
export interface SystemNotificationMetadata {
  maintenanceStart?: string;
  maintenanceEnd?: string;
  featureName?: string;
  version?: string;
  expirationDate?: string;
}

/**
 * Union type for all notification metadata
 */
export type NotificationMetadata =
  | BookingNotificationMetadata
  | PaymentNotificationMetadata
  | ReviewNotificationMetadata
  | SecurityNotificationMetadata
  | SystemNotificationMetadata
  | Record<string, unknown>;
