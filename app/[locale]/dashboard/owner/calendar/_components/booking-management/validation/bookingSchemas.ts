/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Booking Validation Schemas
 * Zod schemas for manual booking creation
 */

import { z } from 'zod';

/**
 * Customer Step Schema
 */
export const customerStepSchema = z.object({
  customerId: z.string().optional(),
});

/**
 * New Customer Schema
 */
export const newCustomerSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Ungültige E-Mail-Adresse')
    .optional()
    .or(z.literal('')),
});

export type NewCustomerFormData = z.infer<typeof newCustomerSchema>;

/**
 * Service Step Schema
 */
export const serviceStepSchema = z.object({
  serviceId: z.string().min(1, 'Bitte wähle einen Service'),
});

export type ServiceStepFormData = z.infer<typeof serviceStepSchema>;

/**
 * Date/Time Step Schema
 */
export const dateTimeStepSchema = z.object({
  date: z.string().min(1, 'Bitte wähle ein Datum'),
  time: z.string().min(1, 'Bitte wähle eine Uhrzeit'),
});

export type DateTimeStepFormData = z.infer<typeof dateTimeStepSchema>;

/**
 * Complete Booking Schema (for submission)
 */
export const createBookingSchema = z.object({
  studioId: z.string(),
  customerId: z.string().optional(),
  newCustomer: newCustomerSchema.optional(),
  serviceId: z.string(),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:mm
  notes: z.string().optional(),
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
