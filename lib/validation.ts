/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Validation Schemas
 * Zod schemas for secure input validation
 */

import { z } from 'zod';

/**
 * Unified Password Schema
 * Modern, industry-standard requirements for ALL users
 * Aligned with NIST guidelines and modern best practices
 *
 * Requirements (as per UX design spec):
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one number
 */
export const unifiedPasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Legacy Strong Password Schema
 * DEPRECATED: Use unifiedPasswordSchema instead
 * Kept for backward compatibility with existing studio owner accounts
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
 * Legacy Basic Password Schema
 * DEPRECATED: Use unifiedPasswordSchema instead
 * Kept for backward compatibility with existing customer accounts
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
 * Empty strings are transformed to undefined (optional field)
 */
export const phoneSchema = z
  .string()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(
    z
      .string()
      .regex(/^[\d\s\+\-\(\)]+$/, 'Ungültige Telefonnummer')
      .min(7, 'Telefonnummer zu kurz')
      .max(20, 'Telefonnummer zu lang')
      .optional()
  );

/**
 * Unified Registration Schema
 * Single registration form for ALL users (customers and studio owners)
 * Role determined by accountType selection
 */
export const unifiedRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: unifiedPasswordSchema,
  phone: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .refine(
      (val) => {
        if (!val) return true; // Optional field
        return /^[\d\s\+\-\(\)]+$/.test(val) && val.length >= 7 && val.length <= 20;
      },
      {
        message: 'Ungültige Telefonnummer (7-20 Zeichen, nur Zahlen und +/-/()/Leerzeichen)',
      }
    ),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and privacy policy',
  }),
  accountType: z.enum(['customer', 'studio']).default('customer'),
});

/**
 * Unified Login Schema
 * Single login form with automatic role detection
 * AccountType determines initial routing preference
 */
export const unifiedLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  accountType: z.enum(['customer', 'studio']).default('customer'),
});

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: unifiedPasswordSchema,
});

/**
 * Legacy Registration Schema for Studio Owners
 * DEPRECATED: Use unifiedRegistrationSchema instead
 * Kept for backward compatibility
 */
export const studioOwnerRegistrationSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').optional(),
});

/**
 * Legacy Registration Schema for Customers
 * DEPRECATED: Use unifiedRegistrationSchema instead
 * Kept for backward compatibility
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

// Unified Auth Types
export type UnifiedRegistration = z.infer<typeof unifiedRegistrationSchema>;
export type UnifiedLogin = z.infer<typeof unifiedLoginSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

// Legacy Types (backward compatibility)
export type StudioOwnerRegistration = z.infer<typeof studioOwnerRegistrationSchema>;
export type CustomerRegistration = z.infer<typeof customerRegistrationSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
