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

    // Determine booking mode: legacy (slotId) or dynamic (preferredDate/preferredTime)
    const isDynamicSlot = !!validated.preferredDate && !!validated.preferredTime

    let preferredDate: string
    let preferredTime: string
    let timeSlot: TimeSlot | null = null

    if (isDynamicSlot) {
      // Dynamic slot mode (Phase 3)
      preferredDate = validated.preferredDate!
      preferredTime = validated.preferredTime!

      logger.info('Dynamic slot mode booking', {
        correlationId,
        studioId: validated.studioId,
        preferredDate,
        preferredTime,
      })

      // Check capacity dynamically
      const capacityResult = await checkSlotCapacity(
        validated.studioId,
        preferredDate,
        preferredTime
      )

      if (!capacityResult.ok) {
        logger.error('Capacity check failed', {
          correlationId,
          error: capacityResult.error,
          studioId: validated.studioId,
          preferredDate,
          preferredTime,
        })

        if (capacityResult.error.type === 'STUDIO_NOT_FOUND') {
          return {
            success: false,
            error: "Das ausgewählte Studio existiert nicht mehr",
          }
        }

        return {
          success: false,
          error: "Fehler bei der Kapazitätsprüfung. Bitte versuchen Sie es erneut.",
        }
      }

      if (!capacityResult.value.available) {
        logger.warn('No capacity available', {
          correlationId,
          studioId: validated.studioId,
          preferredDate,
          preferredTime,
          remainingCapacity: capacityResult.value.remainingCapacity,
        })
        return {
          success: false,
          error: "Dieser Zeitslot ist nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin.",
        }
      }

      logger.info('Capacity check passed', {
        correlationId,
        remainingCapacity: capacityResult.value.remainingCapacity,
      })
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

      // Extract date and time from timeSlot.startTime
      const startTime = new Date(timeSlot.startTime)
      preferredDate = startTime.toISOString().split("T")[0]
      preferredTime = startTime.toISOString().split("T")[1].slice(0, 5)
    }

    // Check if studio exists
    const studio = await prisma.studio.findUnique({
      where: { id: validated.studioId },
    })

    if (!studio) {
      return {
        success: false,
        error: "Das ausgewählte Studio existiert nicht mehr",
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

    // Create Booking + Mark TimeSlot as booked (Atomic Transaction)
    const booking = await prisma.$transaction(
      async (tx) => {
        // Create NewBooking with unified User model
        const newBooking = await tx.newBooking.create({
        data: {
          studioId: validated.studioId,
          serviceId: validated.serviceId,
          customerId: authenticatedUserId, // ✅ SECURITY: From session, NOT user input
          customerName: validated.customerName || "",
          customerEmail: validated.customerEmail || "",
          customerPhone: validated.customerPhone || "",
          preferredDate,
          preferredTime,
          message: validated.message || null,
          explicitHealthConsent: validated.explicitHealthConsent || false,
          healthConsentGivenAt: new Date(),
          healthConsentText:
            "User consented to health data processing via booking form checkbox (GDPR Art. 9)",
          status: authenticatedUserId ? "PENDING" : "CONFIRMED",
        },
        include: {
          studio: true,
          service: true,
        },
      })

      // Mark TimeSlot as booked (ONLY if using legacy slot mode for backward compatibility)
      if (!isDynamicSlot && validated.slotId) {
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
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }
  )

    // Send booking request received email to customer
    try {
      const emailResult = await sendBookingRequestReceivedEmail(
        booking.customerEmail,
        {
          bookingId: booking.id,
          customerName: booking.customerName,
          studioName: booking.studio.name,
          serviceName: booking.service?.name || 'Massage',
          bookingDate: new Date(booking.preferredDate).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          bookingTime: booking.preferredTime,
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
        error: emailError,
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
              bookingDate: new Date(booking.preferredDate).toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              bookingTime: booking.preferredTime,
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
        error: emailError,
      });
      // Note: We don't fail the entire operation if email fails
    }

    // NOTE: We DON'T call revalidatePath here because it could trigger a page reload
    // and show the "slot unavailable" error. The search page will be revalidated
    // when the user navigates back to it naturally.
    // If you need immediate revalidation, consider doing it client-side after navigation.

    return {
      success: true,
      bookingId: booking.id,
      status: booking.status,
    }
  } catch (error) {
    logger.error("Booking creation failed", {
      correlationId,
      error,
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
