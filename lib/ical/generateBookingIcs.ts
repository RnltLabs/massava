/**
 * @fileoverview Utilities for generating iCal (.ics) files for bookings
 * @description Enables customers to add appointments to their calendar with proper timezone handling and validation
 * @module lib/ical/generateBookingIcs
 */

import { createEvent, type EventAttributes, type DateArray } from "ics"
import { toZonedTime } from "date-fns-tz"
import { logger, generateCorrelationId } from "@/lib/logger"
import { z, ZodError } from "zod"

// Constants
const REMINDER_MINUTES_BEFORE = 15;
const DEFAULT_TIMEZONE = 'Europe/Berlin';

/**
 * Zod schema for booking details validation
 */
const bookingDetailsSchema = z.object({
  startDateTime: z.date(),
  endDateTime: z.date(),
  serviceName: z.string().min(1).max(200),
  bookingNumber: z.string().min(1).max(50),
  customerName: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
});

/**
 * Zod schema for studio details validation
 */
const studioDetailsSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  timezone: z.string().max(50).optional(), // IANA timezone (e.g., 'Europe/Berlin')
});

/**
 * Booking Details for iCal generation
 */
export type BookingDetails = z.infer<typeof bookingDetailsSchema>;

/**
 * Studio Details for iCal generation
 */
export type StudioDetails = z.infer<typeof studioDetailsSchema>;

/**
 * Custom error class for iCal operations
 */
export class ICSGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION_FAILED' | 'GENERATION_FAILED' | 'DOWNLOAD_FAILED',
    public readonly correlationId: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ICSGenerationError';
  }
}

/**
 * Sanitize text for iCal format to prevent injection attacks
 * @param text - Text to sanitize
 * @returns Sanitized text safe for iCal
 */
function sanitizeICalText(text: string): string {
  if (!text) return '';

  // Remove or escape special iCal characters
  return text
    .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
    .replace(/[;,\\]/g, '\\$&') // Escape semicolons, commas, and backslashes
    .replace(/:/g, '\\:') // Escape colons
    .trim();
}

/**
 * Convert Date to DateArray format for ics library in specified timezone
 * Converts UTC date to target timezone before extracting components
 *
 * @param date - Date object (typically in UTC from database)
 * @param timezone - Target timezone (IANA format, e.g., 'Europe/Berlin')
 * @returns DateArray: [year, month, day, hour, minute]
 */
function dateToLocalArray(date: Date, timezone: string): DateArray {
  // Convert UTC date to target timezone
  const zonedDate = toZonedTime(date, timezone);

  // Extract components from the zoned date
  return [
    zonedDate.getFullYear(),
    zonedDate.getMonth() + 1, // Month is 0-indexed in JS, 1-indexed in ics
    zonedDate.getDate(),
    zonedDate.getHours(),
    zonedDate.getMinutes(),
  ];
}

/**
 * Generate iCal (.ics) file content for a booking
 *
 * Creates a calendar event with:
 * - Service name as title
 * - Studio location
 * - Booking details in description
 * - Start/end time in UTC
 * - Alarm reminder (15 minutes before)
 *
 * @param booking - Booking details
 * @param studio - Studio details (including timezone)
 * @returns ICS file content as string, or null if generation fails
 */
export function generateBookingIcs(
  booking: BookingDetails,
  studio: StudioDetails
): string | null {
  // Use studio's timezone or default to Europe/Berlin
  const timezone = studio.timezone || DEFAULT_TIMEZONE;
  const correlationId = generateCorrelationId();

  try {
    // Validate input data
    const validatedBooking = bookingDetailsSchema.parse(booking);
    const validatedStudio = studioDetailsSchema.parse(studio);

    // Sanitize all text fields
    const sanitizedBooking = {
      ...validatedBooking,
      serviceName: sanitizeICalText(validatedBooking.serviceName),
      customerName: sanitizeICalText(validatedBooking.customerName),
      message: validatedBooking.message ? sanitizeICalText(validatedBooking.message) : undefined,
    };

    const sanitizedStudio = {
      ...validatedStudio,
      name: sanitizeICalText(validatedStudio.name),
      address: sanitizeICalText(validatedStudio.address),
      city: sanitizeICalText(validatedStudio.city),
      phone: validatedStudio.phone ? sanitizeICalText(validatedStudio.phone) : undefined,
    };

    // Build location string
    const locationParts = [
      sanitizedStudio.name,
      sanitizedStudio.address,
      sanitizedStudio.city,
      sanitizedStudio.postalCode,
      sanitizedStudio.country,
    ].filter(Boolean);
    const location = locationParts.join(", ");

    // Build description
    const descriptionLines = [
      `Buchungsnummer: ${sanitizedBooking.bookingNumber}`,
      `Kunde: ${sanitizedBooking.customerName}`,
      `Behandlung: ${sanitizedBooking.serviceName}`,
      "",
      `Studio: ${sanitizedStudio.name}`,
      `Adresse: ${sanitizedStudio.address}, ${sanitizedStudio.city}`,
    ];

    if (sanitizedStudio.phone) {
      descriptionLines.push(`Telefon: ${sanitizedStudio.phone}`);
    }

    if (sanitizedBooking.message) {
      descriptionLines.push("");
      descriptionLines.push(`Notiz: ${sanitizedBooking.message}`);
    }

    const description = descriptionLines.join("\\n"); // Use escaped newline for iCal

    // Create event attributes with times in studio's timezone
    const event: EventAttributes = {
      start: dateToLocalArray(validatedBooking.startDateTime, timezone),
      startInputType: 'local',
      end: dateToLocalArray(validatedBooking.endDateTime, timezone),
      endInputType: 'local',
      title: sanitizedBooking.serviceName,
      description,
      location,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      // Add reminder 15 minutes before
      alarms: [
        {
          action: "display",
          description: `Erinnerung: ${sanitizedBooking.serviceName} in ${REMINDER_MINUTES_BEFORE} Minuten`,
          trigger: { minutes: REMINDER_MINUTES_BEFORE, before: true },
        },
      ],
    };

    // Generate ICS content
    const result = createEvent(event);

    if (result.error) {
      logger.error("ICS generation failed", {
        correlationId,
        error: result.error instanceof Error ? result.error.message : String(result.error),
        booking: validatedBooking.bookingNumber
      });
      return null;
    }

    logger.info("ICS file generated successfully", {
      correlationId,
      bookingNumber: validatedBooking.bookingNumber
    });

    return result.value || null;
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error("ICS generation validation failed", {
        correlationId,
        error: error.message,
        bookingNumber: booking.bookingNumber
      });
    } else {
      logger.error("Failed to generate ICS file", {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        bookingNumber: booking.bookingNumber
      });
    }
    return null;
  }
}

/**
 * Download iCal file to user's device
 *
 * Creates a Blob from ICS content and triggers browser download.
 * Filename format: booking-{bookingNumber}.ics
 *
 * @param icsContent - ICS file content string
 * @param bookingNumber - Booking number for filename
 * @throws {ICSGenerationError} If download fails
 */
export function downloadIcs(icsContent: string, bookingNumber: string): void {
  const correlationId = generateCorrelationId();
  let blobUrl: string | null = null;

  try {
    // Check browser support
    if (!window.Blob || !window.URL || !window.URL.createObjectURL) {
      throw new ICSGenerationError(
        "Browser unterstützt keine Downloads",
        'DOWNLOAD_FAILED',
        correlationId,
        { reason: 'UNSUPPORTED_BROWSER' }
      );
    }

    // Create blob with correct MIME type
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });

    // Create download link
    const link = document.createElement("a");
    blobUrl = URL.createObjectURL(blob);
    link.href = blobUrl;
    link.download = `booking-${bookingNumber}.ics`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup DOM
    document.body.removeChild(link);

    logger.info("ICS file downloaded successfully", {
      correlationId,
      bookingNumber
    });
  } catch (error) {
    // Determine specific error type
    let errorCode: 'DOWNLOAD_FAILED' = 'DOWNLOAD_FAILED';
    let errorMessage = "Download fehlgeschlagen";

    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        errorMessage = "Speicherplatz nicht ausreichend";
      } else if (error.message.includes('not supported')) {
        errorMessage = "Browser unterstützt keine Downloads";
      }
    }

    logger.error("Failed to download ICS file", {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      bookingNumber
    });

    throw new ICSGenerationError(
      errorMessage,
      errorCode,
      correlationId,
      error
    );
  } finally {
    // Always revoke the blob URL to prevent memory leaks
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}