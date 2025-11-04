"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking"
import { logger, generateCorrelationId } from "@/lib/logger"

interface BookingResult {
  success: boolean
  bookingId?: string
  error?: string
}

/**
 * Create Booking Server Action
 *
 * Creates a new booking and marks the associated time slot as booked.
 * This operation is atomic using Prisma transactions.
 *
 * GDPR Compliance:
 * - Stores explicit health consent timestamp
 * - Stores consent text for audit trail
 * - Only processes health data if consent given
 *
 * @param data - Validated booking form data
 * @returns Result object with success status and booking ID or error message
 */
export async function createBooking(
  data: BookingFormData
): Promise<BookingResult> {
  const correlationId = generateCorrelationId()

  try {
    // Validate Input (server-side validation)
    const validated = bookingFormSchema.parse(data)

    logger.info("Booking creation started", {
      correlationId,
      action: "CREATE_BOOKING",
      slotId: validated.slotId,
      studioId: validated.studioId,
      serviceId: validated.serviceId,
      customerId: validated.customerId,
    })

    // Validate that customerId is provided (required for NewBooking model)
    if (!validated.customerId) {
      return {
        success: false,
        error: "Benutzer-ID fehlt. Bitte melden Sie sich an, um eine Buchung zu erstellen.",
      }
    }

    // Create Booking + Mark TimeSlot as booked (Atomic Transaction)
    // IMPORTANT: All checks must be inside transaction to prevent race conditions
    const booking = await prisma.$transaction(async (tx) => {
      // Check TimeSlot availability INSIDE transaction (prevents TOCTOU race condition)
      const timeSlot = await tx.timeSlot.findUnique({
        where: { id: validated.slotId },
      })

      logger.debug("TimeSlot fetched from database", {
        correlationId,
        id: timeSlot?.id,
        isAvailable: timeSlot?.isAvailable,
        isBooked: timeSlot?.isBooked,
        exists: !!timeSlot,
      })

      if (!timeSlot) {
        logger.error("TimeSlot not found", {
          correlationId,
          slotId: validated.slotId,
        })
        throw new Error("Der ausgewählte Zeitslot existiert nicht mehr")
      }

      if (!timeSlot.isAvailable || timeSlot.isBooked) {
        logger.warn("TimeSlot not available", {
          correlationId,
          slotId: validated.slotId,
          isAvailable: timeSlot.isAvailable,
          isBooked: timeSlot.isBooked,
        })
        throw new Error(
          "Dieser Zeitslot ist nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin."
        )
      }

      logger.debug("TimeSlot is available, proceeding with booking", {
        correlationId,
        slotId: validated.slotId,
      })

      // Check if studio exists
      const studio = await tx.studio.findUnique({
        where: { id: validated.studioId },
      })

      if (!studio) {
        throw new Error("Das ausgewählte Studio existiert nicht mehr")
      }

      // Check if service exists
      const service = await tx.service.findUnique({
        where: { id: validated.serviceId },
      })

      if (!service) {
        throw new Error("Die ausgewählte Leistung existiert nicht mehr")
      }

      // Extract date and time from timeSlot.startTime
      // IMPORTANT: Use local timezone, not UTC (toISOString converts to UTC which shifts the time)
      const startTime = new Date(timeSlot.startTime)

      // Format in local timezone (Europe/Berlin)
      const preferredDate = startTime.toLocaleDateString("en-CA") // YYYY-MM-DD format
      const preferredTime = startTime.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) // HH:mm format

      // Create Booking using NewBooking model
      const newBooking = await tx.newBooking.create({
        data: {
          studioId: validated.studioId,
          serviceId: validated.serviceId,
          customerId: validated.customerId,
          customerName: validated.customerName || "",
          customerEmail: validated.customerEmail || "",
          customerPhone: validated.customerPhone || "",
          preferredDate,
          preferredTime,
          message: validated.message || null,
          explicitHealthConsent: validated.explicitHealthConsent || false,
          healthConsentGivenAt: validated.explicitHealthConsent ? new Date() : null,
          healthConsentText: validated.explicitHealthConsent
            ? "User consented to health data processing via booking form checkbox (GDPR Art. 9)"
            : null,
          status: "PENDING", // Always PENDING - studio must confirm
        },
        include: {
          studio: true,
          service: true,
        },
      })

      // Mark TimeSlot as booked
      await tx.timeSlot.update({
        where: { id: validated.slotId },
        data: {
          isBooked: true,
          isAvailable: false,
        },
      })

      return newBooking
    })

    logger.info("Booking created successfully", {
      correlationId,
      bookingId: booking.id,
      status: booking.status,
      customerId: validated.customerId,
      studioId: validated.studioId,
    })

    // TODO: Send email notification to customer and studio
    // await sendBookingConfirmationEmail(booking)

    // DON'T revalidate here - let the client handle navigation and revalidation
    // This prevents the page from reloading before showing the success screen
    // The client will call router.refresh() when user navigates away

    return {
      success: true,
      bookingId: booking.id,
      status: booking.status,
    }
  } catch (error) {
    logger.error("Booking creation failed", {
      correlationId,
      error: error instanceof Error ? error.message : "Unknown error",
      customerId: data.customerId,
      slotId: data.slotId,
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
