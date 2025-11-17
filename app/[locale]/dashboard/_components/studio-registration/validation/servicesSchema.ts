/**
 * Services Validation Schema
 * Zod schemas for service data validation in studio registration
 */

import { z } from 'zod';

/**
 * Single Service Schema
 * Validates individual service data
 */
export const serviceSchema = z.object({
  name: z
    .string()
    .min(3, 'Service-Name muss mindestens 3 Zeichen lang sein')
    .max(100, 'Service-Name darf maximal 100 Zeichen lang sein'),
  duration: z
    .number()
    .min(15, 'Dauer muss mindestens 15 Minuten betragen')
    .max(240, 'Dauer darf maximal 240 Minuten betragen'),
  price: z
    .number()
    .min(5, 'Preis muss mindestens 5€ betragen')
    .max(500, 'Preis darf maximal 500€ betragen'),
});

/**
 * Services Array Schema
 * Validates array of services (max 3)
 */
export const servicesArraySchema = z
  .array(serviceSchema)
  .max(3, 'Maximal 3 Services können hinzugefügt werden');

/**
 * TypeScript Types
 */
export type ServiceFormData = z.infer<typeof serviceSchema>;
export type ServicesArrayFormData = z.infer<typeof servicesArraySchema>;
