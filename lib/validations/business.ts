/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API Validation Schemas
 * MASTER_ORCHESTRATION_PLAN.md - Task 2.4: Business Portal API Routes
 *
 * Zod schemas for validating business portal API requests
 */

import { z } from 'zod'
import { BookingStatus } from '@/app/generated/prisma'

// ============================================
// Bookings Validation
// ============================================

/**
 * Query parameters for fetching bookings list
 */
export const bookingsQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  serviceId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type BookingsQuery = z.infer<typeof bookingsQuerySchema>

/**
 * Update booking status request body
 */
export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  notes: z.string().max(500).optional(),
})

export type UpdateBookingStatusData = z.infer<typeof updateBookingStatusSchema>

// ============================================
// Services Validation
// ============================================

/**
 * Create new service request body
 */
export const createServiceSchema = z.object({
  name: z
    .string()
    .min(3, 'Service name must be at least 3 characters')
    .max(100, 'Service name must not exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  price: z
    .number()
    .positive('Price must be positive')
    .max(10000, 'Price must not exceed 10000'),
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must not exceed 480 minutes (8 hours)'),
})

export type CreateServiceData = z.infer<typeof createServiceSchema>

/**
 * Update service request body (partial update allowed)
 */
export const updateServiceSchema = createServiceSchema.partial()

export type UpdateServiceData = z.infer<typeof updateServiceSchema>

// ============================================
// Opening Hours Validation
// ============================================

/**
 * Day of week type
 */
export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>

/**
 * Time range (e.g., "09:00-17:00")
 */
export const timeRangeSchema = z
  .string()
  .regex(
    /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    'Time range must be in format HH:MM-HH:MM (e.g., 09:00-17:00)'
  )

/**
 * Opening hours for a single day
 */
export const dayOpeningHoursSchema = z.object({
  open: z.boolean(),
  ranges: z.array(timeRangeSchema).min(0).max(3).optional(),
})

export type DayOpeningHours = z.infer<typeof dayOpeningHoursSchema>

/**
 * Update opening hours request body
 */
export const updateOpeningHoursSchema = z.object({
  monday: dayOpeningHoursSchema.optional(),
  tuesday: dayOpeningHoursSchema.optional(),
  wednesday: dayOpeningHoursSchema.optional(),
  thursday: dayOpeningHoursSchema.optional(),
  friday: dayOpeningHoursSchema.optional(),
  saturday: dayOpeningHoursSchema.optional(),
  sunday: dayOpeningHoursSchema.optional(),
})

export type UpdateOpeningHoursData = z.infer<typeof updateOpeningHoursSchema>

// ============================================
// Calendar Validation
// ============================================

/**
 * Query parameters for fetching calendar data
 */
export const calendarQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  serviceId: z.string().cuid().optional(),
})

export type CalendarQuery = z.infer<typeof calendarQuerySchema>

// ============================================
// Stats Validation
// ============================================

/**
 * Query parameters for fetching dashboard statistics
 */
export const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
})

export type StatsQuery = z.infer<typeof statsQuerySchema>
