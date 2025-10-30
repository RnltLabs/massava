/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Management Validation Schemas
 * Zod schemas for service form validation
 */

import { z } from 'zod';

/**
 * Service Name Schema (Step 1)
 */
export const serviceNameSchema = z.object({
  name: z
    .string()
    .min(3, 'Name muss mindestens 3 Zeichen lang sein')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
    .trim(),
});

export type ServiceNameFormData = z.infer<typeof serviceNameSchema>;

/**
 * Service Duration Schema (Step 2)
 */
export const serviceDurationSchema = z.object({
  duration: z
    .number()
    .min(15, 'Dauer muss mindestens 15 Minuten sein')
    .max(240, 'Dauer darf maximal 240 Minuten sein'),
});

export type ServiceDurationFormData = z.infer<typeof serviceDurationSchema>;

/**
 * Service Price Schema (Step 3)
 */
export const servicePriceSchema = z.object({
  price: z
    .number()
    .min(5, 'Preis muss mindestens 5€ sein')
    .max(500, 'Preis darf maximal 500€ sein'),
});

export type ServicePriceFormData = z.infer<typeof servicePriceSchema>;

/**
 * Complete Service Schema (for final validation)
 */
export const completeServiceSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  duration: z.number().min(15).max(240),
  price: z.number().min(5).max(500),
});

export type CompleteServiceFormData = z.infer<typeof completeServiceSchema>;
