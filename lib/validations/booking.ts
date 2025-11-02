import { z } from "zod"

/**
 * Booking Form Validation Schema
 *
 * Updated for frictionless booking flow:
 * - Contact fields (name, email, phone) are now OPTIONAL in initial form
 * - Filled via guest checkout form OR session data
 * - Health consent is OPTIONAL (only required for guest checkout)
 *
 * GDPR Compliance (Art. 9 - Gesundheitsdaten):
 * - explicitHealthConsent required only when provided via guest form
 * - healthConsentGivenAt and healthConsentText stored for audit trail
 * - message field is optional (may contain health-related data)
 */
export const bookingFormSchema = z.object({
  studioId: z.string().cuid("Ungültige Studio-ID"),
  slotId: z.string().cuid("Ungültige Zeitslot-ID"),
  serviceId: z.string().cuid("Bitte wählen Sie eine Leistung aus"),

  // Optional now - filled via guest form or session
  customerName: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen haben")
    .max(100, "Name darf maximal 100 Zeichen haben")
    .optional()
    .or(z.literal("")),
  customerEmail: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .max(255, "E-Mail-Adresse darf maximal 255 Zeichen haben")
    .optional()
    .or(z.literal("")),
  customerPhone: z
    .string()
    .min(10, "Telefonnummer muss mindestens 10 Zeichen haben")
    .max(20, "Telefonnummer darf maximal 20 Zeichen haben")
    .regex(
      /^[\d\s+()-]+$/,
      "Telefonnummer darf nur Zahlen, Leerzeichen, +, -, ( und ) enthalten"
    )
    .optional()
    .or(z.literal("")),

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
