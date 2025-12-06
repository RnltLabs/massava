import { z } from "zod"
import { parseISO } from 'date-fns'
import { validateBookingDateTime, isValidTimezone } from '@/lib/timezone/validation'

/**
 * Booking Form Validation Schema - Phase 4: DateTime Migration
 *
 * BREAKING CHANGE: Now uses single DateTime field instead of separate date/time
 *
 * Security Improvements:
 * - CRITICAL FIX #2: Timezone whitelist validation (injection prevention)
 * - CRITICAL FIX #3: User timezone NOT stored in database (GDPR compliance)
 * - CRITICAL FIX #4: DateTime business rules enforced (1h-1y, 15-min grid)
 *
 * GDPR Compliance (Art. 9 - Gesundheitsdaten):
 * - explicitHealthConsent required only when provided via guest form
 * - healthConsentGivenAt and healthConsentText stored for audit trail
 * - message field is optional (may contain health-related data)
 * - userTimezone is OPTIONAL and NOT stored (only used for response formatting)
 *
 * DateTime Migration (Phase 4):
 * - preferredDateTime replaces preferredDate + preferredTime
 * - Accepts ISO 8601 datetime strings (e.g., "2025-11-17T14:30:00+01:00")
 * - Validates against business rules (1 hour to 1 year in future, 15-min grid)
 * - slotId still optional for backward compatibility during migration
 */

/**
 * Zod schema for booking DateTime with business rules
 *
 * CRITICAL FIX #4: DateTime Business Rules
 * - Must be 1 hour to 1 year in future
 * - Must be on 15-minute grid (00, 15, 30, 45)
 */
export const bookingDateTimeSchema = z
  .string()
  .datetime({ message: 'Ungültiges ISO 8601 Datum/Uhrzeit Format' })
  .superRefine((dateStr, ctx) => {
    try {
      const date = parseISO(dateStr);
      const validation = validateBookingDateTime(date);

      if (!validation.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.error || 'Ungültiges Buchungsdatum/-zeit',
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ungültiges Datum',
      });
    }
  });

/**
 * CRITICAL FIX #2: Timezone Validation (Injection Prevention)
 *
 * Optional field for user timezone (for display purposes only)
 * GDPR: This is NOT stored in database, only used for response formatting
 */
export const userTimezoneSchema = z
  .string()
  .max(50)
  .regex(/^[A-Za-z/_+-]+$/, "Ungültiges Zeitzonenformat")
  .refine(isValidTimezone, { message: 'Ungültige IANA Zeitzone' })
  .optional();

/**
 * Updated booking form schema with DateTime
 */
export const bookingFormSchema = z.object({
  studioId: z.string().cuid("Ungültige Studio-ID"),
  slotId: z.string().cuid("Ungültige Zeitslot-ID").optional(), // Optional for backward compatibility
  serviceId: z.string().cuid("Bitte wählen Sie eine Leistung aus"),

  // Phase 4: DateTime field (replaces preferredDate + preferredTime)
  preferredDateTime: bookingDateTimeSchema.optional(), // Optional during migration

  // Phase 4: User timezone (optional, for response formatting only, NOT stored)
  userTimezone: userTimezoneSchema,

  // Optional contact fields - filled via guest form or session
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

  // Optional - filled via guest form
  explicitHealthConsent: z.boolean().optional(),

  // Optional - set when user registers during booking flow
  registeredUserId: z.string().cuid("Ungültige User-ID").optional(),

  // P0.1 FIX: customerId REMOVED - NEVER accept from client (IDOR prevention)
  // customerId is ALWAYS retrieved from server-side session in createBooking()
}).refine(
  (data) => {
    // Either slotId OR preferredDateTime must be provided
    const hasSlotId = !!data.slotId;
    const hasDateTime = !!data.preferredDateTime;
    return hasSlotId || hasDateTime;
  },
  {
    message: "Entweder slotId oder preferredDateTime muss angegeben werden",
    path: ["slotId"],
  }
)

export type BookingFormData = z.infer<typeof bookingFormSchema>
