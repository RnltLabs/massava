"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Business Portal API Validation Schemas
 * MASTER_ORCHESTRATION_PLAN.md - Task 2.4: Business Portal API Routes
 *
 * Zod schemas for validating business portal API requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsQuerySchema = exports.calendarQuerySchema = exports.updateOpeningHoursSchema = exports.dayOpeningHoursSchema = exports.timeRangeSchema = exports.dayOfWeekSchema = exports.updateServiceSchema = exports.createServiceSchema = exports.updateBookingStatusSchema = exports.bookingsQuerySchema = void 0;
const zod_1 = require("zod");
const prisma_1 = require("@/app/generated/prisma");
// ============================================
// Bookings Validation
// ============================================
/**
 * Query parameters for fetching bookings list
 */
exports.bookingsQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(prisma_1.BookingStatus).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    serviceId: zod_1.z.string().cuid().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
/**
 * Update booking status request body
 */
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(prisma_1.BookingStatus),
    notes: zod_1.z.string().max(500).optional(),
});
// ============================================
// Services Validation
// ============================================
/**
 * Create new service request body
 */
exports.createServiceSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(3, 'Service name must be at least 3 characters')
        .max(100, 'Service name must not exceed 100 characters'),
    description: zod_1.z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must not exceed 1000 characters')
        .optional()
        .or(zod_1.z.literal('')),
    price: zod_1.z
        .number()
        .positive('Price must be positive')
        .max(10000, 'Price must not exceed 10000'),
    duration: zod_1.z
        .number()
        .int('Duration must be an integer')
        .min(15, 'Duration must be at least 15 minutes')
        .max(480, 'Duration must not exceed 480 minutes (8 hours)'),
});
/**
 * Update service request body (partial update allowed)
 */
exports.updateServiceSchema = exports.createServiceSchema.partial();
// ============================================
// Opening Hours Validation
// ============================================
/**
 * Day of week type
 */
exports.dayOfWeekSchema = zod_1.z.enum([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
]);
/**
 * Time range (e.g., "09:00-17:00")
 */
exports.timeRangeSchema = zod_1.z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time range must be in format HH:MM-HH:MM (e.g., 09:00-17:00)');
/**
 * Opening hours for a single day
 */
exports.dayOpeningHoursSchema = zod_1.z.object({
    open: zod_1.z.boolean(),
    ranges: zod_1.z.array(exports.timeRangeSchema).min(0).max(3).optional(),
});
/**
 * Update opening hours request body
 */
exports.updateOpeningHoursSchema = zod_1.z.object({
    monday: exports.dayOpeningHoursSchema.optional(),
    tuesday: exports.dayOpeningHoursSchema.optional(),
    wednesday: exports.dayOpeningHoursSchema.optional(),
    thursday: exports.dayOpeningHoursSchema.optional(),
    friday: exports.dayOpeningHoursSchema.optional(),
    saturday: exports.dayOpeningHoursSchema.optional(),
    sunday: exports.dayOpeningHoursSchema.optional(),
});
// ============================================
// Calendar Validation
// ============================================
/**
 * Query parameters for fetching calendar data
 */
exports.calendarQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    serviceId: zod_1.z.string().cuid().optional(),
});
// ============================================
// Stats Validation
// ============================================
/**
 * Query parameters for fetching dashboard statistics
 */
exports.statsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    period: zod_1.z.enum(['day', 'week', 'month', 'year']).default('month'),
});
