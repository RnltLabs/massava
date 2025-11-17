/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Account Settings Validation Schemas
 */

import { z } from 'zod';

/**
 * Email Change Schema
 */
export const emailChangeSchema = z.object({
  newEmail: z
    .string()
    .min(1, 'E-Mail-Adresse erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail-Adresse zu lang'),
});

export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

/**
 * Email Verification Schema
 */
export const emailVerificationSchema = z.object({
  code: z
    .string()
    .length(6, 'Code muss 6 Zeichen haben')
    .regex(/^\d+$/, 'Code darf nur Ziffern enthalten'),
});

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;

/**
 * Password Change Schema
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
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

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/**
 * Two-Factor Verification Schema
 */
export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Code muss 6 Ziffern haben')
    .regex(/^\d+$/, 'Nur Ziffern erlaubt'),
});

export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;

/**
 * Preferences Schema
 */
export const preferencesSchema = z.object({
  language: z.enum(['de', 'en'], { message: 'Ungültige Sprache' }),
  timezone: z.string().min(1, 'Zeitzone erforderlich'),
  dateFormat: z.enum(['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], {
    message: 'Ungültiges Datumsformat',
  }),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;

/**
 * Notification Settings Schema
 */
export const notificationSettingsSchema = z.object({
  bookings: z.boolean(),
  cancellations: z.boolean(),
  reminders: z.boolean(),
  marketing: z.boolean(),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;

/**
 * Studio Deletion Schema
 */
export const studioDeletionSchema = z.object({
  studioId: z.string().cuid('Ungültige Studio-ID'),
  confirmationText: z.string().min(1, 'Bestätigungstext erforderlich'),
  acknowledgeConsequences: z.boolean().refine((val) => val === true, {
    message: 'Sie müssen die Konsequenzen bestätigen',
  }),
});

export type StudioDeletionInput = z.infer<typeof studioDeletionSchema>;
