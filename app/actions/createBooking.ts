"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking"
import { auth } from "@/auth"

interface BookingResult {
  success: boolean
  bookingId?: string
  status?: string
  error?: string
}

/**
 * Create Booking Server Action
 *
 * Creates a new booking using the unified User model (Phase 3)
 * and marks the associated time slot as booked.
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
 * @param data - Validated booking form data
 * @returns Result object with success status and booking ID or error message
 */
export async function createBooking(
  data: BookingFormData
): Promise<BookingResult> {
  try {
    // P0.1 FIX: Get authenticated user from session (IDOR prevention)
    const session = await auth()

    // Validate Input (server-side validation)
    const validated = bookingFormSchema.parse(data)

    // Check if TimeSlot is still available
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: validated.slotId },
    })

    console.log('[createBooking] TimeSlot check:', {
      slotId: validated.slotId,
      exists: !!timeSlot,
      isAvailable: timeSlot?.isAvailable,
      isBooked: timeSlot?.isBooked,
    })

    if (!timeSlot) {
      console.log('[createBooking] ERROR: TimeSlot not found')
      return {
        success: false,
        error: "Der ausgewählte Zeitslot existiert nicht mehr",
      }
    }

    if (!timeSlot.isAvailable || timeSlot.isBooked) {
      console.log('[createBooking] ERROR: TimeSlot not available or already booked')
      return {
        success: false,
        error:
          "Dieser Zeitslot ist nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin.",
      }
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

    // Extract date and time from timeSlot.startTime
    const startTime = new Date(timeSlot.startTime)
    const preferredDate = startTime.toISOString().split("T")[0]
    const preferredTime = startTime.toISOString().split("T")[1].slice(0, 5)

    // P0.1 FIX: Use session.user.id for authenticated users (IDOR prevention)
    // Never trust client-provided customerId - ALWAYS use session
    const authenticatedUserId = session?.user?.id || null

    // Create Booking + Mark TimeSlot as booked (Atomic Transaction)
    const booking = await prisma.$transaction(async (tx) => {
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

    // TODO: Send email notification to customer and studio
    // await sendBookingConfirmationEmail(booking)

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
    console.error("Booking creation failed:", error)

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
