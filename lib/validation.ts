/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Validation Schemas
 * Zod schemas for secure input validation
 */

import { z } from 'zod';

/**
 * Strong Password Schema
 * GDPR Art. 32 compliant - For Studio Owners handling sensitive data
 *
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const strongPasswordSchema = z
  .string()
  .min(12, 'Passwort muss mindestens 12 Zeichen lang sein')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten')
  .regex(/[^A-Za-z0-9]/, 'Passwort muss mindestens ein Sonderzeichen enthalten');

/**
 * Basic Password Schema
 * For customer accounts - user-friendly requirements
 *
 * Requirements:
 * - Minimum 8 characters
 */
export const passwordSchema = z
  .string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein');

/**
 * Email Validation Schema
 */
export const emailSchema = z
  .string()
  .email('Ungültige E-Mail-Adresse');

/**
 * Phone Validation Schema (Optional)
 * Accepts various German and international formats
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\+\-\(\)]+$/, 'Ungültige Telefonnummer')
  .min(7, 'Telefonnummer zu kurz')
  .max(20, 'Telefonnummer zu lang')
  .optional();

/**
 * Registration Schema for Studio Owners
 * Uses strong password requirements due to access to sensitive customer data
 */
export const studioOwnerRegistrationSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').optional(),
});

/**
 * Registration Schema for Customers
 */
export const customerRegistrationSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

/**
 * Booking Schema with Health Data Consent
 */
export const bookingSchema = z.object({
  studioId: z.string().cuid('Ungültige Studio-ID'),
  serviceId: z.string().cuid('Ungültige Service-ID').optional(),
  customerName: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  customerEmail: emailSchema,
  customerPhone: z.string().min(7, 'Telefonnummer zu kurz'),
  preferredDate: z.string().min(1, 'Datum erforderlich'),
  preferredTime: z.string().min(1, 'Uhrzeit erforderlich'),
  message: z.string().optional(),
  explicitHealthConsent: z.boolean().optional(),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, {
    message: 'Sie müssen die Datenschutzerklärung akzeptieren',
  }),
}).refine(
  (data) => {
    // If message is provided, explicit health consent is required (Art. 9 GDPR)
    if (data.message && data.message.trim().length > 0) {
      return data.explicitHealthConsent === true;
    }
    return true;
  },
  {
    message: 'Ausdrückliche Einwilligung zur Verarbeitung von Gesundheitsdaten erforderlich (Art. 9 DSGVO)',
    path: ['explicitHealthConsent'],
  }
);

export type StudioOwnerRegistration = z.infer<typeof studioOwnerRegistrationSchema>;
export type CustomerRegistration = z.infer<typeof customerRegistrationSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
