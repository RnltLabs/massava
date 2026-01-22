/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Validation Schemas
 */

import { z } from 'zod';

/**
 * Cancel Booking Schema
 */
export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1, 'Buchungs-ID ist erforderlich'),
  reason: z
    .string()
    .min(10, 'Bitte geben Sie einen Grund für die Stornierung an (mindestens 10 Zeichen)')
    .max(500, 'Der Stornierungsgrund darf maximal 500 Zeichen enthalten')
    .optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

/**
 * Reschedule Booking Schema
 */
export const rescheduleBookingSchema = z.object({
  bookingId: z.string().min(1, 'Buchungs-ID ist erforderlich'),
  newDate: z.string().min(1, 'Neues Datum ist erforderlich'),
  newTime: z.string().min(1, 'Neue Uhrzeit ist erforderlich'),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
