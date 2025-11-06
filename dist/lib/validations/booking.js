"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingFormSchema = void 0;
const zod_1 = require("zod");
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
exports.bookingFormSchema = zod_1.z.object({
    studioId: zod_1.z.string().cuid("Ungültige Studio-ID"),
    slotId: zod_1.z.string().cuid("Ungültige Zeitslot-ID"),
    serviceId: zod_1.z.string().cuid("Bitte wählen Sie eine Leistung aus"),
    // Optional now - filled via guest form or session
    customerName: zod_1.z
        .string()
        .min(2, "Name muss mindestens 2 Zeichen haben")
        .max(100, "Name darf maximal 100 Zeichen haben")
        .optional()
        .or(zod_1.z.literal("")),
    customerEmail: zod_1.z
        .string()
        .email("Ungültige E-Mail-Adresse")
        .max(255, "E-Mail-Adresse darf maximal 255 Zeichen haben")
        .optional()
        .or(zod_1.z.literal("")),
    customerPhone: zod_1.z
        .string()
        .min(10, "Telefonnummer muss mindestens 10 Zeichen haben")
        .max(20, "Telefonnummer darf maximal 20 Zeichen haben")
        .regex(/^[\d\s+()-]+$/, "Telefonnummer darf nur Zahlen, Leerzeichen, +, -, ( und ) enthalten")
        .optional()
        .or(zod_1.z.literal("")),
    message: zod_1.z
        .string()
        .max(1000, "Nachricht darf maximal 1000 Zeichen haben")
        .optional()
        .or(zod_1.z.literal("")),
    // Optional now - filled via guest form
    explicitHealthConsent: zod_1.z.boolean().optional(),
    // P0.1 FIX: customerId REMOVED - NEVER accept from client (IDOR prevention)
    // customerId is ALWAYS retrieved from server-side session in createBooking()
});
