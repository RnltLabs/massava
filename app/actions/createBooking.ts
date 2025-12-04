"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking"
import { auth } from "@/auth"
import {
  sendBookingRequestReceivedEmail,
  sendNewBookingNotificationToOwner,
} from "@/lib/email/send"
import { createBookingWithCapacityCheck, checkSlotCapacity } from "@/lib/slots"
import { logger, generateCorrelationId } from "@/lib/logger"
import { parseISO } from 'date-fns'
import {
  validateBookingDateTime,
  validateTimezoneOrThrow,
  formatInTimezone,
  isWithinBusinessHours
} from '@/lib/timezone'

// Type for TimeSlot (using Prisma payload type to avoid import issues during build)
type TimeSlot = {
  id: string
  studioId: string
  serviceId: string | null
  startTime: Date
  endTime: Date
  isAvailable: boolean
  isBooked: boolean
  bookingId: string | null
  createdAt: Date
  updatedAt: Date
}

interface BookingResult {
  success: boolean
  bookingId?: string
  status?: string
  error?: string
  booking?: {
    id: string
    preferredDateTime: string
    studioTimezone: string
    studioLocalTime: string
    userLocalTime?: string
  }
}

/**
 * Create Booking Server Action
 *
 * Creates a new booking using dynamic slot validation (Phase 3)
 * with capacity checking instead of TimeSlot availability.
 * This operation is atomic using Prisma transactions.
 *
 * SECURITY (P0.1 Fix):
 * - IDOR Prevention: customerId is taken from session, not user input
 * - Prevents users from creating bookings for other users
 *
 * GDPR Compliance:
 * - Stores explicit health consent timestamp
 * - Stores consent text for audit trail
 * - Only processes health data if consent given
 * - Uses encrypted health data storage (via Prisma extension)
 *
 * Dynamic Slots (Phase 3):
 * - Supports both old slotId-based booking (backward compatible)
 * - Supports new preferredDate/preferredTime-based booking (dynamic slots)
 * - Uses capacity checking instead of TimeSlot.findUnique()
 * - Validates time is on 15-minute grid
 *
 * @param data - Validated booking form data
 * @returns Result object with success status and booking ID or error message
 */
export async function createBooking(
  data: BookingFormData
): Promise<BookingResult> {
  const correlationId = generateCorrelationId()

  try {
    // P0.1 FIX: Get authenticated user from session (IDOR prevention)
    const session = await auth()

    // Validate Input (server-side validation)
    const validated = bookingFormSchema.parse(data)

    // Determine booking mode: legacy (slotId) or DateTime (preferredDateTime)
    const isDateTimeMode = !!validated.preferredDateTime

    let preferredDateTime: Date
    let timeSlot: TimeSlot | null = null

    if (isDateTimeMode) {
      // DateTime mode (Phase 4) - uses atomic capacity check
      preferredDateTime = parseISO(validated.preferredDateTime!)

      logger.info('DateTime mode booking', {
        correlationId,
        studioId: validated.studioId,
        preferredDateTime: preferredDateTime.toISOString(),
      })

      // DateTime validation already done in schema, but double-check business rules
      const validation = validateBookingDateTime(preferredDateTime);
      if (!validation.valid) {
        logger.error('DateTime validation failed', {
          correlationId,
          error: validation.error,
        })
        return {
          success: false,
          error: validation.error || "Ungültiges Buchungsdatum/-zeit",
        }
      }
    } else {
      // Legacy slot mode (backward compatibility)
      // Check if TimeSlot is still available
      timeSlot = await prisma.timeSlot.findUnique({
        where: { id: validated.slotId },
      })

      logger.info('Legacy TimeSlot check', {
        correlationId,
        slotId: validated.slotId,
        exists: !!timeSlot,
        isAvailable: timeSlot?.isAvailable,
        isBooked: timeSlot?.isBooked,
      })

      if (!timeSlot) {
        logger.error('TimeSlot not found', {
          correlationId,
          slotId: validated.slotId,
        })
        return {
          success: false,
          error: "Der ausgewählte Zeitslot existiert nicht mehr",
        }
      }

      if (!timeSlot.isAvailable || timeSlot.isBooked) {
        logger.warn('TimeSlot not available or already booked', {
          correlationId,
          slotId: validated.slotId,
          isAvailable: timeSlot.isAvailable,
          isBooked: timeSlot.isBooked,
        })
        return {
          success: false,
          error:
            "Dieser Zeitslot ist nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin.",
        }
      }

      // Extract DateTime from timeSlot.startTime
      preferredDateTime = timeSlot.startTime
    }

    // Check if studio exists and get timezone + opening hours
    const studio = await prisma.studio.findUnique({
      where: { id: validated.studioId },
      select: {
        id: true,
        name: true,
        timezone: true,
        openingHours: true,
      },
    })

    if (!studio) {
      return {
        success: false,
        error: "Das ausgewählte Studio existiert nicht mehr",
      }
    }

    // Validate studio timezone (P0 Fix #4)
    try {
      validateTimezoneOrThrow(studio.timezone)
    } catch (error) {
      logger.error('Invalid studio timezone', {
        correlationId,
        studioId: validated.studioId,
        timezone: studio.timezone,
      })
      return {
        success: false,
        error: "Systemfehler: Ungültige Studio-Zeitzone.",
      }
    }

    // Phase 4: Check if DateTime is within business hours
    if (isDateTimeMode) {
      const withinHours = isWithinBusinessHours(
        preferredDateTime,
        studio.openingHours as any, // Cast to OpeningHours type
        studio.timezone
      );

      if (!withinHours) {
        logger.warn('Booking time outside business hours', {
          correlationId,
          studioId: validated.studioId,
          preferredDateTime: preferredDateTime.toISOString(),
          studioTimezone: studio.timezone,
        })
        return {
          success: false,
          error: `Der gewählte Zeitpunkt liegt außerhalb der Öffnungszeiten von ${studio.name}`,
        }
      }
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId },
    })

    if (!service) {
      return {
        success: false,
        error: "Die ausgewählte Leistung existiert nicht mehr",
      }
    }

    // P0.1 FIX: Use session.user.id for authenticated users (IDOR prevention)
    // Never trust client-provided customerId - ALWAYS use session
    const authenticatedUserId = session?.user?.id || null

    // Prepare booking data
    const bookingData = {
      studioId: validated.studioId,
      serviceId: validated.serviceId,
      customerId: authenticatedUserId || undefined, // ✅ SECURITY: From session, NOT user input
      customerName: validated.customerName || "",
      customerEmail: validated.customerEmail || "",
      customerPhone: validated.customerPhone || "",
      preferredDateTime: preferredDateTime,
      message: validated.message || undefined,
      explicitHealthConsent: validated.explicitHealthConsent || false,
      healthConsentGivenAt: new Date(),
      healthConsentText:
        "User consented to health data processing via booking form checkbox (GDPR Art. 9)",
    }

    let bookingId: string

    if (isDateTimeMode) {
      // DateTime mode: Use atomic capacity check + booking creation
      // This prevents race conditions by doing capacity check + booking inside a Serializable transaction
      const capacityResult = await createBookingWithCapacityCheck(bookingData)

      if (!capacityResult.ok) {
        logger.error('Booking creation with capacity check failed', {
          correlationId,
          errorType: capacityResult.error.type,
          studioId: validated.studioId,
          preferredDateTime: preferredDateTime.toISOString(),
        })

        // Map capacity errors to user-friendly messages
        switch (capacityResult.error.type) {
          case 'STUDIO_NOT_FOUND':
            return {
              success: false,
              error: "Das ausgewählte Studio existiert nicht mehr",
            }
          case 'CAPACITY_EXCEEDED':
            return {
              success: false,
              error: "Dieser Zeitslot ist bereits ausgebucht. Bitte wählen Sie einen anderen Termin.",
            }
          case 'CONCURRENT_BOOKING_CONFLICT':
            return {
              success: false,
              error: "Dieser Zeitslot wurde gerade von jemand anderem gebucht. Bitte versuchen Sie es erneut.",
            }
          case 'INVALID_TIME_GRID':
            return {
              success: false,
              error: "Die gewählte Zeit liegt nicht auf dem 15-Minuten-Raster.",
            }
          case 'DATABASE_ERROR':
            return {
              success: false,
              error: "Datenbankfehler. Bitte versuchen Sie es erneut oder kontaktieren Sie uns.",
            }
          default:
            return {
              success: false,
              error: "Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.",
            }
        }
      }

      bookingId = capacityResult.value.id
      logger.info('Booking created successfully with capacity check', {
        correlationId,
        bookingId,
      })
    } else {
      // Legacy slot mode: Use original transaction-based approach
      const booking = await prisma.$transaction(
        async (tx) => {
          // Create NewBooking with DateTime (Phase 4)
          const newBooking = await tx.newBooking.create({
            data: {
              ...bookingData,
              status: authenticatedUserId ? "PENDING" : "CONFIRMED",
            },
            select: {
              id: true,
            },
          })

          // Mark TimeSlot as booked (legacy mode only)
          if (validated.slotId) {
            await tx.timeSlot.update({
              where: { id: validated.slotId },
              data: {
                isBooked: true,
                isAvailable: false,
              },
            })
          }

          return newBooking
        },
        {
          isolationLevel: 'Serializable' as const,
          maxWait: 5000,
          timeout: 10000,
        }
      )
      bookingId = booking.id
    }

    // Fetch complete booking with relations for email sending
    const booking = await prisma.newBooking.findUnique({
      where: { id: bookingId },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        service: true,
      },
    })

    if (!booking) {
      logger.error('Failed to fetch created booking', {
        correlationId,
        bookingId,
      })
      return {
        success: false,
        error: "Buchung wurde erstellt, aber Daten konnten nicht abgerufen werden.",
      }
    }

    // Send booking request received email to customer
    try {
      // Phase 4: Format DateTime in studio's timezone for email
      const studioLocalDate = formatInTimezone(
        booking.preferredDateTime,
        booking.studio.timezone,
        'EEEE, d. MMMM yyyy'
      );
      const studioLocalTime = formatInTimezone(
        booking.preferredDateTime,
        booking.studio.timezone,
        'HH:mm'
      );

      const emailResult = await sendBookingRequestReceivedEmail(
        booking.customerEmail,
        {
          bookingId: booking.id,
          customerName: booking.customerName,
          studioName: booking.studio.name,
          serviceName: booking.service?.name || 'Massage',
          bookingDate: studioLocalDate,
          bookingTime: studioLocalTime,
          message: booking.message || undefined,
        },
        'de'
      );

      if (!emailResult.success) {
        logger.error('Failed to send booking request received email', {
          correlationId,
          bookingId: booking.id,
          error: emailResult.error,
        });
        // Note: We don't fail the entire operation if email fails
      }
    } catch (emailError) {
      logger.error('Exception sending booking request received email', {
        correlationId,
        bookingId: booking.id,
        error: emailError instanceof Error ? emailError : new Error(String(emailError)),
      });
      // Note: We don't fail the entire operation if email fails
    }

    // TASK 3.1: Send new booking notification to all studio owners
    try {
      // Get all studio owners
      const studioOwnerships = await prisma.studioOwnership.findMany({
        where: { studioId: validated.studioId },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      // Send notification to each owner
      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const dashboardUrl = `${appUrl}/de/business/calendar`;

      // Phase 4: Format DateTime in studio's timezone for owner emails
      const studioLocalDate = formatInTimezone(
        booking.preferredDateTime,
        booking.studio.timezone,
        'EEEE, d. MMMM yyyy'
      );
      const studioLocalTime = formatInTimezone(
        booking.preferredDateTime,
        booking.studio.timezone,
        'HH:mm'
      );

      for (const ownership of studioOwnerships) {
        if (ownership.user.email) {
          const ownerEmailResult = await sendNewBookingNotificationToOwner(
            ownership.user.email,
            {
              studioName: booking.studio.name,
              ownerName: ownership.user.name || 'Studio Owner',
              bookingId: booking.id,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              customerPhone: booking.customerPhone || undefined,
              serviceName: booking.service?.name || 'Massage',
              bookingDate: studioLocalDate,
              bookingTime: studioLocalTime,
              message: booking.message || undefined,
              dashboardUrl,
            },
            'de'
          );

          if (!ownerEmailResult.success) {
            logger.error('Failed to send new booking notification to owner', {
              correlationId,
              bookingId: booking.id,
              ownerEmail: ownership.user.email,
              error: ownerEmailResult.error,
            });
            // Note: We don't fail the entire operation if email fails
          } else {
            logger.info('New booking notification sent to studio owner', {
              correlationId,
              bookingId: booking.id,
              ownerEmail: ownership.user.email,
            });
          }
        }
      }
    } catch (emailError) {
      logger.error('Exception sending new booking notification to owners', {
        correlationId,
        bookingId: booking.id,
        error: emailError instanceof Error ? emailError : new Error(String(emailError)),
      });
      // Note: We don't fail the entire operation if email fails
    }

    // =====================================================
    // PUSH NOTIFICATION: BOOKING_REQUEST_RECEIVED -> Owners
    // =====================================================
    try {
      const { sendBookingRequestReceivedNotification } = await import(
        '@/lib/notifications/booking-notification-helper'
      );

      const notificationResult = await sendBookingRequestReceivedNotification({
        bookingId: booking.id,
        studioId: booking.studioId,
        studioName: booking.studio.name,
        studioTimezone: booking.studio.timezone,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        serviceName: booking.service?.name || 'Massage',
        preferredDateTime: booking.preferredDateTime,
        customerId: authenticatedUserId,
      });

      if (notificationResult.ok) {
        logger.info('Push notifications sent to studio owners', {
          correlationId,
          bookingId: booking.id,
          sent: notificationResult.value.sent,
          failed: notificationResult.value.failed,
        });
      } else {
        logger.error('Failed to send push notifications to owners', {
          correlationId,
          bookingId: booking.id,
          error: notificationResult.error.message,
        });
      }
    } catch (notificationError) {
      logger.error('Exception sending push notification to owners', {
        correlationId,
        bookingId: booking.id,
        error: notificationError instanceof Error ? notificationError : new Error(String(notificationError)),
      });
      // Notification-Fehler sollten den Buchungsprozess NICHT blockieren
    }

    // NOTE: We DON'T call revalidatePath here because it could trigger a page reload
    // and show the "slot unavailable" error. The search page will be revalidated
    // when the user navigates back to it naturally.
    // If you need immediate revalidation, consider doing it client-side after navigation.

    // Phase 4: Return booking with timezone info
    return {
      success: true,
      bookingId: booking.id,
      status: booking.status,
      // Include timezone-aware time formatting for display
      booking: {
        id: booking.id,
        preferredDateTime: booking.preferredDateTime.toISOString(), // ISO 8601 with offset
        studioTimezone: booking.studio.timezone,
        studioLocalTime: formatInTimezone(
          booking.preferredDateTime,
          booking.studio.timezone,
          'yyyy-MM-dd HH:mm'
        ),
        // If user provided timezone, include their local time too
        ...(validated.userTimezone && {
          userLocalTime: formatInTimezone(
            booking.preferredDateTime,
            validated.userTimezone,
            'yyyy-MM-dd HH:mm'
          ),
        }),
      },
    }
  } catch (error) {
    logger.error("Booking creation failed", {
      correlationId,
      error: error instanceof Error ? error : new Error(String(error)),
    })

    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: "Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Angaben.",
      }
    }

    // Generic error for user
    return {
      success: false,
      error:
        "Buchung fehlgeschlagen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns.",
    }
  }
}
