import { z } from 'zod';

/**
 * Time format validation (HH:MM)
 */
const timeSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Ungültiges Zeitformat (HH:MM)',
});

/**
 * Hours range validation (open/close times)
 */
const hoursSchema = z
  .object({
    open: timeSchema,
    close: timeSchema,
  })
  .refine((data) => data.close > data.open, {
    message: 'Schließzeit muss nach Öffnungszeit liegen',
  });

/**
 * Opening hours validation schema
 */
export const openingHoursSchema = z.object({
  mode: z.enum(['same', 'different']),
  sameHours: hoursSchema.optional(),
  differentHours: z.record(z.string(), hoursSchema.nullable()).optional(),
});

/**
 * Type exports
 */
export type OpeningHoursFormData = z.infer<typeof openingHoursSchema>;
export type HoursRange = z.infer<typeof hoursSchema>;
