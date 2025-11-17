/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { z } from 'zod';

/**
 * Date range options for statistics filtering
 */
export const dateRangeSchema = z.enum(['last7days', 'last30days', 'last3months', 'last12months']);

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Export format options
 */
export const exportFormatSchema = z.enum(['csv', 'pdf']);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

/**
 * Statistics filter schema
 */
export const statsFilterSchema = z.object({
  dateRange: dateRangeSchema,
  serviceId: z.string().nullable(),
});

export type StatsFilter = z.infer<typeof statsFilterSchema>;

/**
 * Revenue trend data point
 */
export const revenueTrendSchema = z.object({
  date: z.string(),
  amount: z.number(),
});

export type RevenueTrend = z.infer<typeof revenueTrendSchema>;

/**
 * Bookings trend data point
 */
export const bookingsTrendSchema = z.object({
  date: z.string(),
  completed: z.number(),
  cancelled: z.number(),
  noShow: z.number(),
});

export type BookingsTrend = z.infer<typeof bookingsTrendSchema>;

/**
 * Top service data
 */
export const topServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  bookings: z.number(),
  revenue: z.number(),
});

export type TopService = z.infer<typeof topServiceSchema>;

/**
 * Service summary for filters
 */
export const serviceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type ServiceSummary = z.infer<typeof serviceSummarySchema>;

/**
 * Complete booking statistics schema
 */
export const bookingStatsSchema = z.object({
  revenue: z.object({
    total: z.number(),
    changePercentage: z.number(),
    averagePerBooking: z.number(),
    trend: z.array(revenueTrendSchema),
  }),
  bookings: z.object({
    total: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    noShow: z.number(),
    completionRate: z.number(),
    changePercentage: z.number(),
    trend: z.array(bookingsTrendSchema),
  }),
  customers: z.object({
    total: z.number(),
    new: z.number(),
    returning: z.number(),
    changePercentage: z.number(),
  }),
  topServices: z.array(topServiceSchema),
  services: z.array(serviceSummarySchema),
});

export type BookingStats = z.infer<typeof bookingStatsSchema>;
