/**
 * @fileoverview Zod validation schemas for iCal generation
 * @module lib/schemas/ical
 */

import { z } from 'zod';

/**
 * Schema for booking details used in iCal generation
 */
export const bookingDetailsSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  customerEmail: z.string().email('Valid email required'),
  serviceName: z.string().min(1, 'Service name is required').max(200),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  bookingMessage: z.string().max(500).optional(),
});

/**
 * Schema for studio details used in iCal generation
 */
export const studioDetailsSchema = z.object({
  name: z.string().min(1, 'Studio name is required').max(100),
  address: z.string().min(1, 'Studio address is required').max(200),
  phone: z.string().max(20).optional(),
});

export type BookingDetails = z.infer<typeof bookingDetailsSchema>;
export type StudioDetails = z.infer<typeof studioDetailsSchema>;