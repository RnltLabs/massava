"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Validation Schemas
 * Zod schemas for secure input validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingSchema = exports.customerRegistrationSchema = exports.studioOwnerRegistrationSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.unifiedLoginSchema = exports.unifiedRegistrationSchema = exports.phoneSchema = exports.emailSchema = exports.passwordSchema = exports.strongPasswordSchema = exports.unifiedPasswordSchema = void 0;
const zod_1 = require("zod");
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
exports.unifiedPasswordSchema = zod_1.z
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
exports.strongPasswordSchema = zod_1.z
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
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein');
/**
 * Email Validation Schema
 */
exports.emailSchema = zod_1.z
    .string()
    .email('Ungültige E-Mail-Adresse');
/**
 * Phone Validation Schema (Optional)
 * Accepts various German and international formats
 * Empty strings are transformed to undefined (optional field)
 */
exports.phoneSchema = zod_1.z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(zod_1.z
    .string()
    .regex(/^[\d\s\+\-\(\)]+$/, 'Ungültige Telefonnummer')
    .min(7, 'Telefonnummer zu kurz')
    .max(20, 'Telefonnummer zu lang')
    .optional());
/**
 * Unified Registration Schema
 * Single registration form for ALL users (customers and studio owners)
 * Role determined by accountType selection
 */
exports.unifiedRegistrationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: exports.emailSchema,
    password: exports.unifiedPasswordSchema,
    phone: zod_1.z
        .string()
        .optional()
        .transform((val) => (val === '' ? undefined : val))
        .refine((val) => {
        if (!val)
            return true; // Optional field
        return /^[\d\s\+\-\(\)]+$/.test(val) && val.length >= 7 && val.length <= 20;
    }, {
        message: 'Ungültige Telefonnummer (7-20 Zeichen, nur Zahlen und +/-/()/Leerzeichen)',
    }),
    terms: zod_1.z.boolean().refine(val => val === true, {
        message: 'You must agree to the terms and privacy policy',
    }),
    accountType: zod_1.z.enum(['customer', 'studio']).default('customer'),
});
/**
 * Unified Login Schema
 * Single login form with automatic role detection
 * AccountType determines initial routing preference
 */
exports.unifiedLoginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
    rememberMe: zod_1.z.boolean().optional(),
    accountType: zod_1.z.enum(['customer', 'studio']).default('customer'),
});
/**
 * Forgot Password Schema
 */
exports.forgotPasswordSchema = zod_1.z.object({
    email: exports.emailSchema,
});
/**
 * Reset Password Schema
 */
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: exports.unifiedPasswordSchema,
});
/**
 * Legacy Registration Schema for Studio Owners
 * DEPRECATED: Use unifiedRegistrationSchema instead
 * Kept for backward compatibility
 */
exports.studioOwnerRegistrationSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.strongPasswordSchema,
    name: zod_1.z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').optional(),
});
/**
 * Legacy Registration Schema for Customers
 * DEPRECATED: Use unifiedRegistrationSchema instead
 * Kept for backward compatibility
 */
exports.customerRegistrationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    phone: exports.phoneSchema,
});
/**
 * Booking Schema with Health Data Consent
 */
exports.bookingSchema = zod_1.z.object({
    studioId: zod_1.z.string().cuid('Ungültige Studio-ID'),
    serviceId: zod_1.z.string().cuid('Ungültige Service-ID').optional(),
    customerName: zod_1.z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
    customerEmail: exports.emailSchema,
    customerPhone: zod_1.z.string().min(7, 'Telefonnummer zu kurz'),
    preferredDate: zod_1.z.string().min(1, 'Datum erforderlich'),
    preferredTime: zod_1.z.string().min(1, 'Uhrzeit erforderlich'),
    message: zod_1.z.string().optional(),
    explicitHealthConsent: zod_1.z.boolean().optional(),
    privacyPolicyAccepted: zod_1.z.boolean().refine(val => val === true, {
        message: 'Sie müssen die Datenschutzerklärung akzeptieren',
    }),
}).refine((data) => {
    // If message is provided, explicit health consent is required (Art. 9 GDPR)
    if (data.message && data.message.trim().length > 0) {
        return data.explicitHealthConsent === true;
    }
    return true;
}, {
    message: 'Ausdrückliche Einwilligung zur Verarbeitung von Gesundheitsdaten erforderlich (Art. 9 DSGVO)',
    path: ['explicitHealthConsent'],
});
