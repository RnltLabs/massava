/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Location & Contact Validation Schemas
 */

import { z } from 'zod';

/**
 * German phone number regex
 * Supports formats:
 * - +49 30 12345678
 * - 030 12345678
 * - +4930 12345678
 */
const germanPhoneRegex = /^(\+49|0)[1-9]\d{1,14}$/;

/**
 * German postal code (5 digits)
 */
const germanPostalCodeRegex = /^\d{5}$/;

/**
 * Location Contact Form Schema
 */
export const locationContactSchema = z.object({
  address: z.string().min(5, 'Adresse muss mindestens 5 Zeichen lang sein').max(200),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen lang sein').max(100),
  postalCode: z
    .string()
    .regex(germanPostalCodeRegex, 'Bitte geben Sie eine gültige 5-stellige Postleitzahl ein'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(10, 'Telefonnummer ist zu kurz'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein').max(255),
  website: z
    .string()
    .url('Bitte geben Sie eine gültige URL ein')
    .max(255)
    .optional()
    .or(z.literal('')),
});

export type LocationContactInput = z.infer<typeof locationContactSchema>;
