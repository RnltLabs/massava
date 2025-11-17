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
 *
 * Dynamic Slots (Phase 3):
 * - slotId is now OPTIONAL (backward compatibility during migration)
 * - preferredDate and preferredTime now REQUIRED for dynamic slots
 * - preferredTime must be on 15-minute grid
 */
export const bookingFormSchema = z.object({
  studioId: z.string().cuid("Ungültige Studio-ID"),
  slotId: z.string().cuid("Ungültige Zeitslot-ID").optional(), // Optional for dynamic slots
  serviceId: z.string().cuid("Bitte wählen Sie eine Leistung aus"),

  // Dynamic slots fields (Phase 3)
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat (YYYY-MM-DD)")
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, "Datum darf nicht in der Vergangenheit liegen")
    .optional(), // Optional for backward compatibility
  preferredTime: z
    .string()
    .regex(/^\d{2}:(00|15|30|45)$/, "Zeit muss auf 15-Minuten-Raster liegen (z.B. 10:00, 10:15, 10:30, 10:45)")
    .optional(), // Optional for backward compatibility

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

  // P0.1 FIX: customerId REMOVED - NEVER accept from client (IDOR prevention)
  // customerId is ALWAYS retrieved from server-side session in createBooking()
}).refine(
  (data) => {
    // Either slotId OR (preferredDate AND preferredTime) must be provided
    const hasSlotId = !!data.slotId;
    const hasDynamicSlot = !!data.preferredDate && !!data.preferredTime;
    return hasSlotId || hasDynamicSlot;
  },
  {
    message: "Entweder slotId oder (preferredDate und preferredTime) muss angegeben werden",
    path: ["slotId"],
  }
)

export type BookingFormData = z.infer<typeof bookingFormSchema>
