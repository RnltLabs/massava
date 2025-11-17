/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Profile & Bookings Validation Schemas
 */

import { z } from 'zod';

/**
 * Customer Address Schema
 */
export const customerAddressSchema = z.object({
  street: z.string().min(5, 'Straße muss mindestens 5 Zeichen lang sein').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen lang sein').max(100),
  postalCode: z.string().min(3, 'Postleitzahl muss mindestens 3 Zeichen lang sein').max(10),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;

/**
 * Customer Phone Schema
 */
export const customerPhoneSchema = z.object({
  phone: z.string().min(10, 'Telefonnummer muss mindestens 10 Zeichen lang sein').max(20),
});

export type CustomerPhoneInput = z.infer<typeof customerPhoneSchema>;

/**
 * Customer Preferences Schema
 */
export const customerPreferencesSchema = z.object({
  language: z.enum(['de', 'en'], { message: 'Ungültige Sprache' }),
  emailNotifications: z.object({
    bookingConfirmed: z.boolean(),
    bookingReminder: z.boolean(),
    bookingCancelled: z.boolean(),
    marketing: z.boolean(),
  }),
});

export type CustomerPreferencesInput = z.infer<typeof customerPreferencesSchema>;

/**
 * Customer Password Change Schema
 */
export const customerPasswordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Aktuelles Passwort muss mindestens 8 Zeichen haben'),
    newPassword: z
      .string()
      .min(8, 'Mindestens 8 Zeichen')
      .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe')
      .regex(/[a-z]/, 'Mindestens ein Kleinbuchstabe')
      .regex(/[0-9]/, 'Mindestens eine Zahl')
      .regex(/[^A-Za-z0-9]/, 'Mindestens ein Sonderzeichen'),
    confirmPassword: z.string().min(1, 'Passwort-Bestätigung erforderlich'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type CustomerPasswordInput = z.infer<typeof customerPasswordSchema>;

/**
 * Cancel Booking Schema
 */
export const cancelBookingSchema = z.object({
  bookingId: z.string().cuid('Ungültige Buchungs-ID'),
  reason: z.string().max(500, 'Grund darf maximal 500 Zeichen haben').optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

/**
 * Reschedule Booking Schema
 */
export const rescheduleBookingSchema = z.object({
  bookingId: z.string().cuid('Ungültige Buchungs-ID'),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss im Format YYYY-MM-DD sein'),
  newTime: z.string().regex(/^\d{2}:\d{2}$/, 'Zeit muss im Format HH:MM sein'),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
