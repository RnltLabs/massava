/**
 * Push Notification Metrics Schema
 *
 * Type-safe schema definitions for push notification analytics API responses.
 */

import { z } from 'zod';

/**
 * Schema for push notification metrics by type
 */
export const pushMetricsByTypeSchema = z.object({
  sent: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  clicked: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  deliveryRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
});

export type PushMetricsByType = z.infer<typeof pushMetricsByTypeSchema>;

/**
 * Schema for time series data point
 */
export const timeSeriesDataPointSchema = z.object({
  date: z.string().datetime(),
  sent: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  clicked: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  consentsGranted: z.number().int().nonnegative(),
  consentsRevoked: z.number().int().nonnegative(),
});

export type TimeSeriesDataPoint = z.infer<typeof timeSeriesDataPointSchema>;

/**
 * Schema for push notification metrics response
 */
export const pushNotificationMetricsSchema = z.object({
  // Overall metrics
  optInRate: z.number().min(0).max(1),
  deliveryRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  optOutRate: z.number().min(0).max(1),

  // Absolute counts for context
  totalUsers: z.number().int().nonnegative(),
  totalConsents: z.number().int().nonnegative(),
  totalRevocations: z.number().int().nonnegative(),
  totalSent: z.number().int().nonnegative(),
  totalDelivered: z.number().int().nonnegative(),
  totalClicked: z.number().int().nonnegative(),
  totalFailed: z.number().int().nonnegative(),

  // Active devices
  activeDevices: z.number().int().nonnegative(),
  devicesByPlatform: z.object({
    IOS: z.number().int().nonnegative(),
    ANDROID: z.number().int().nonnegative(),
    WEB: z.number().int().nonnegative(),
  }),

  // Metrics by notification type
  byType: z.record(z.string(), pushMetricsByTypeSchema),

  // Time series data (last 30 days, daily granularity)
  timeSeriesDaily: z.array(timeSeriesDataPointSchema),

  // Metadata
  generatedAt: z.string().datetime(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export type PushNotificationMetrics = z.infer<typeof pushNotificationMetricsSchema>;

/**
 * Query parameters schema for filtering metrics
 */
export const pushMetricsQuerySchema = z.object({
  // Date range (defaults to last 30 days)
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // Filter by studio (STUDIO_OWNER can only see their own studio)
  studioId: z.string().cuid().optional(),

  // Granularity for time series (defaults to daily)
  granularity: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
});

export type PushMetricsQuery = z.infer<typeof pushMetricsQuerySchema>;
