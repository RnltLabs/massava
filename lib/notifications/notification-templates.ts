/**
 * Notification Templates
 *
 * German language templates for all notification types.
 *
 * SECURITY NOTE: Template outputs are automatically sanitized by the NotificationService
 * before storage to prevent XSS attacks. All user-provided metadata fields (e.g., studioName,
 * customerName) are stripped of HTML tags and special characters are escaped.
 */

import type { NotificationType } from '@/app/generated/prisma';
import type {
  BookingNotificationMetadata,
  ReviewNotificationMetadata,
  PaymentNotificationMetadata,
} from './notification-metadata';
import {
  assertBookingMetadata,
  assertPaymentMetadata,
  assertReviewMetadata,
} from './utils/metadata-guards';
import { formatInTimezone } from '@/lib/timezone/utils';
import { de } from 'date-fns/locale';

/**
 * Rendered notification content in the user's language
 *
 * Contains the final text and action URL for a notification. Templates are rendered
 * with user-specific metadata (e.g., studio name, booking time) before sending.
 *
 * @interface NotificationTemplate
 * @property {string} title - Notification title (max 2-3 lines recommended)
 * @property {string} body - Notification body/description (max 4 lines recommended)
 * @property {string} [actionUrl] - URL to navigate to when notification is tapped
 *
 * @example
 * ```typescript
 * const template: NotificationTemplate = {
 *   title: 'Buchung bestätigt',
 *   body: 'Dein Termin bei Studio ABC für Haarschnitt am Montag, 15. Januar um 14:00 Uhr wurde bestätigt.',
 *   actionUrl: '/bookings/booking-123',
 * };
 * ```
 */
export interface NotificationTemplate {
  title: string;
  body: string;
  actionUrl?: string;
}

/**
 * Template function signature
 *
 * Functions that render notification content by substituting user-specific metadata
 * into template strings. Always returns German (de) language content.
 *
 * @typedef {(metadata: Record<string, unknown>) => NotificationTemplate} TemplateFunction
 *
 * @example
 * ```typescript
 * const myTemplate: TemplateFunction = (meta) => {
 *   const m = meta as BookingNotificationMetadata;
 *   return {
 *     title: 'Termin-Erinnerung',
 *     body: `Dein Termin bei ${m.studioName} findet in 1 Stunde statt.`,
 *   };
 * };
 * ```
 */
type TemplateFunction = (metadata: Record<string, unknown>) => NotificationTemplate;

/**
 * Format a date string for display in German locale with timezone support
 *
 * Converts ISO 8601 dates to human-readable German format with day of week, date, and time.
 * Uses the studio's timezone for accurate local time display.
 * Example: "Montag, 15. Januar um 14:00 Uhr"
 *
 * @param {string} dateString - ISO 8601 formatted date string
 * @param {string} [timezone='Europe/Berlin'] - IANA timezone for formatting
 *
 * @returns {string} Formatted date string in German locale, or original string if parsing fails
 *
 * @example
 * ```typescript
 * const formatted = formatDate('2025-01-15T14:00:00Z', 'Europe/Berlin');
 * // Returns: "Mittwoch, 15. Januar um 15:00 Uhr" (UTC+1)
 * ```
 */
function formatDate(dateString: string, timezone: string = 'Europe/Berlin'): string {
  try {
    const date = new Date(dateString);
    return formatInTimezone(date, timezone, "EEEE, d. MMMM 'um' HH:mm 'Uhr'", { locale: de });
  } catch {
    return dateString;
  }
}

/**
 * Notification templates by type
 *
 * Maps each notification type to a template function that renders German language content.
 * Functions receive metadata about the notification context (e.g., booking details, studio names)
 * and return title, body, and optional action URL.
 *
 * All templates use German language to match the primary user base.
 *
 * @constant {Record<NotificationType, TemplateFunction>} NOTIFICATION_TEMPLATES
 *
 * @example
 * ```typescript
 * const template = NOTIFICATION_TEMPLATES.BOOKING_CONFIRMED({
 *   studioName: 'Studio ABC',
 *   serviceName: 'Haarschnitt',
 *   appointmentTime: '2025-01-15T14:00:00Z',
 * });
 * // Returns template with German content about booking confirmation
 * ```
 */
export const NOTIFICATION_TEMPLATES: Record<NotificationType, TemplateFunction> = {
  // Studio Owner
  BOOKING_REQUEST_RECEIVED: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Neue Buchungsanfrage',
      body: `${meta.customerName} möchte ${meta.serviceName} am ${formatDate(meta.appointmentTime, meta.studioTimezone)} buchen.`,
      actionUrl: `/business/bookings?highlight=${meta.bookingId}`,
    };
  },

  BOOKING_CANCELLED_BY_CUSTOMER: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Buchung storniert',
      body: `${meta.customerName} hat die Buchung für ${meta.serviceName} am ${formatDate(meta.appointmentTime, meta.studioTimezone)} storniert.`,
      actionUrl: `/business/bookings?highlight=${meta.bookingId}`,
    };
  },

  BOOKING_REMINDER_STUDIO: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Termin-Erinnerung',
      body: `In 1 Stunde: ${meta.serviceName} mit ${meta.customerName}.`,
      actionUrl: `/business/calendar`,
    };
  },

  PAYMENT_RECEIVED: (meta) => {
    assertPaymentMetadata(meta);
    return {
      title: 'Zahlung eingegangen',
      body: `${meta.amount} ${meta.currency} von ${meta.customerName} erhalten.`,
      actionUrl: `/business/payments`,
    };
  },

  REVIEW_POSTED: (meta) => {
    assertReviewMetadata(meta);
    return {
      title: 'Neue Bewertung',
      body: `${meta.reviewerName} hat eine ${meta.rating}-Sterne Bewertung hinterlassen.`,
      actionUrl: `/business/reviews`,
    };
  },

  LOW_AVAILABILITY_ALERT: () => ({
    title: 'Geringe Verfügbarkeit',
    body: 'Du hast noch freie Termine in den nächsten Tagen. Möchtest du sie bewerben?',
    actionUrl: `/business/calendar`,
  }),

  // Customer
  BOOKING_CONFIRMED: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Buchung bestätigt',
      body: `Dein Termin bei ${meta.studioName} für ${meta.serviceName} am ${formatDate(meta.appointmentTime, meta.studioTimezone)} wurde bestätigt.`,
      actionUrl: `/bookings/${meta.bookingId}`,
    };
  },

  BOOKING_REJECTED: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Buchung abgelehnt',
      body: `Leider konnte ${meta.studioName} deinen Termin für ${meta.serviceName} nicht bestätigen.`,
      actionUrl: `/studios/${meta.studioId}`,
    };
  },

  BOOKING_REMINDER_CUSTOMER: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Termin-Erinnerung',
      body: `In 24 Stunden: ${meta.serviceName} bei ${meta.studioName}.`,
      actionUrl: `/bookings/${meta.bookingId}`,
    };
  },

  BOOKING_CANCELLED_BY_STUDIO: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Termin storniert',
      body: `${meta.studioName} musste deinen Termin für ${meta.serviceName} leider absagen.`,
      actionUrl: `/studios/${meta.studioId}`,
    };
  },

  REVIEW_REQUEST: (meta) => {
    assertBookingMetadata(meta);
    return {
      title: 'Wie war dein Termin?',
      body: `Teile deine Erfahrung bei ${meta.studioName} mit anderen.`,
      actionUrl: `/bookings/${meta.bookingId}/review`,
    };
  },

  STUDIO_PROMOTION: (meta) => ({
    title: (meta as { studioName?: string }).studioName || 'Angebot',
    body: 'Es gibt ein neues Angebot für dich!',
    actionUrl: `/studios/${(meta as { studioId?: string }).studioId}`,
  }),

  // Security
  ACCOUNT_LOGIN_NEW_DEVICE: (meta) => ({
    title: 'Neue Anmeldung',
    body: `Anmeldung von ${(meta as { device?: string }).device || 'unbekanntem Gerät'} aus ${(meta as { location?: string }).location || 'unbekanntem Standort'}.`,
    actionUrl: `/settings/security`,
  }),

  ACCOUNT_PASSWORD_CHANGED: () => ({
    title: 'Passwort geändert',
    body: 'Dein Passwort wurde erfolgreich geändert.',
    actionUrl: `/settings/security`,
  }),

  ACCOUNT_EMAIL_CHANGED: () => ({
    title: 'E-Mail-Adresse geändert',
    body: 'Deine E-Mail-Adresse wurde erfolgreich aktualisiert.',
    actionUrl: `/settings/account`,
  }),

  ACCOUNT_TWO_FACTOR_ENABLED: () => ({
    title: 'Zwei-Faktor-Authentifizierung aktiviert',
    body: 'Dein Konto ist jetzt noch besser geschützt.',
    actionUrl: `/settings/security`,
  }),

  ACCOUNT_DELETION_SCHEDULED: () => ({
    title: 'Kontolöschung geplant',
    body: 'Dein Konto wird in 30 Tagen gelöscht. Du kannst dies jederzeit widerrufen.',
    actionUrl: `/settings/account`,
  }),

  ACCOUNT_DELETION_CANCELLED: () => ({
    title: 'Kontolöschung abgebrochen',
    body: 'Die geplante Löschung deines Kontos wurde aufgehoben.',
    actionUrl: `/settings/account`,
  }),

  // System
  SYSTEM_MAINTENANCE: (meta) => ({
    title: 'Wartungsarbeiten',
    body: `Geplante Wartung am ${(meta as { maintenanceStart?: string }).maintenanceStart || 'bald'}.`,
    actionUrl: undefined,
  }),

  FEATURE_ANNOUNCEMENT: (meta) => ({
    title: 'Neues Feature',
    body: `${(meta as { featureName?: string }).featureName || 'Eine neue Funktion'} ist jetzt verfügbar!`,
    actionUrl: undefined,
  }),

  TERMS_UPDATE: () => ({
    title: 'AGB aktualisiert',
    body: 'Unsere Nutzungsbedingungen wurden aktualisiert. Bitte lies sie dir durch.',
    actionUrl: `/legal/terms`,
  }),

  WELCOME: () => ({
    title: 'Willkommen bei Massava!',
    body: 'Schön, dass du dabei bist. Entdecke Studios in deiner Nähe.',
    actionUrl: `/`,
  }),

  ONBOARDING_REMINDER: () => ({
    title: 'Profil vervollständigen',
    body: 'Vervollständige dein Profil, um alle Funktionen nutzen zu können.',
    actionUrl: `/settings/profile`,
  }),

  SUBSCRIPTION_EXPIRING: (meta) => ({
    title: 'Abo läuft bald ab',
    body: `Dein Abo endet am ${(meta as { expirationDate?: string }).expirationDate || 'bald'}. Verlängere es jetzt.`,
    actionUrl: `/settings/subscription`,
  }),

  SUBSCRIPTION_EXPIRED: () => ({
    title: 'Abo abgelaufen',
    body: 'Dein Abo ist abgelaufen. Erneuere es, um alle Funktionen weiter zu nutzen.',
    actionUrl: `/settings/subscription`,
  }),
};

/**
 * Render a notification template with context-specific metadata
 *
 * Looks up the template function for a notification type and renders it with the provided
 * metadata. Handles type casting and missing metadata gracefully.
 *
 * @param {NotificationType} type - Type of notification (e.g., BOOKING_CONFIRMED)
 * @param {Record<string, unknown>} [metadata={}] - Context data for template rendering
 *   (studio name, booking details, user info, etc.)
 *
 * @returns {NotificationTemplate} Rendered notification with German content and action URL
 *
 * @throws {Error} If notification type is unknown (check at compile time with TypeScript)
 *
 * @example
 * ```typescript
 * const template = getNotificationTemplate('BOOKING_CONFIRMED', {
 *   studioName: 'Studio ABC',
 *   serviceName: 'Haarschnitt',
 *   appointmentTime: '2025-01-15T14:00:00Z',
 *   bookingId: 'booking-123',
 * });
 *
 * console.log(template.title);    // "Buchung bestätigt"
 * console.log(template.body);     // "Dein Termin bei Studio ABC..."
 * console.log(template.actionUrl); // "/bookings/booking-123"
 * ```
 *
 * @see {@link NOTIFICATION_TEMPLATES} - All available templates
 */
export function getNotificationTemplate(
  type: NotificationType,
  metadata: Record<string, unknown> = {}
): NotificationTemplate {
  const templateFn = NOTIFICATION_TEMPLATES[type];
  return templateFn(metadata);
}
