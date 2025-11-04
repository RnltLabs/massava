import { z } from "zod"

/**
 * Booking Form Validation Schema
 *
 * GDPR Compliance (Art. 9 - Gesundheitsdaten):
 * - explicitHealthConsent MUST be true
 * - healthConsentGivenAt and healthConsentText stored for audit trail
 * - message field is optional (may contain health-related data)
 */
export const bookingFormSchema = z.object({
  studioId: z.string().cuid("Ungültige Studio-ID"),
  slotId: z.string().cuid("Ungültige Zeitslot-ID"),
  serviceId: z.string().cuid("Bitte wählen Sie eine Leistung aus"),
  customerName: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen haben")
    .max(100, "Name darf maximal 100 Zeichen haben"),
  customerEmail: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .max(255, "E-Mail-Adresse darf maximal 255 Zeichen haben"),
  customerPhone: z
    .string()
    .min(10, "Telefonnummer muss mindestens 10 Zeichen haben")
    .max(20, "Telefonnummer darf maximal 20 Zeichen haben")
    .regex(
      /^[\d\s+()-]+$/,
      "Telefonnummer darf nur Zahlen, Leerzeichen, +, -, ( und ) enthalten"
    ),
  message: z
    .string()
    .max(1000, "Nachricht darf maximal 1000 Zeichen haben")
    .optional()
    .or(z.literal("")),

  // Optional now - filled via guest form
  explicitHealthConsent: z.boolean().optional(),

  customerId: z.string().cuid().nullable().optional(),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>
