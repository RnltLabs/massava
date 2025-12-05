/**
 * Push Notification Metrics API Smoke Tests
 *
 * Basic integration tests for /api/metrics/push-notifications endpoint.
 */

import { describe, it, expect } from '@jest/globals';
import { pushNotificationMetricsSchema } from '@/lib/schemas/push-metrics.schema';

describe('Push Notification Metrics Schema', () => {
  it('should validate correct metrics response', () => {
    const validMetrics = {
      optInRate: 0.35,
      deliveryRate: 0.95,
      clickRate: 0.18,
      optOutRate: 0.02,
      totalUsers: 1000,
      totalConsents: 350,
      totalRevocations: 7,
      totalSent: 5000,
      totalDelivered: 4750,
      totalClicked: 855,
      totalFailed: 250,
      activeDevices: 320,
      devicesByPlatform: {
        IOS: 180,
        ANDROID: 130,
        WEB: 10,
      },
      byType: {
        BOOKING_CONFIRMED: {
          sent: 2000,
          delivered: 1900,
          clicked: 400,
          failed: 100,
          deliveryRate: 0.95,
          clickRate: 0.21,
        },
      },
      timeSeriesDaily: [
        {
          date: '2025-12-01T00:00:00.000Z',
          sent: 100,
          delivered: 95,
          clicked: 20,
          failed: 5,
          consentsGranted: 10,
          consentsRevoked: 1,
        },
      ],
      generatedAt: '2025-12-05T10:00:00.000Z',
      periodStart: '2025-11-05T00:00:00.000Z',
      periodEnd: '2025-12-05T00:00:00.000Z',
    };

    const result = pushNotificationMetricsSchema.safeParse(validMetrics);
    expect(result.success).toBe(true);
  });

  it('should reject invalid metrics response', () => {
    const invalidMetrics = {
      optInRate: 1.5, // Invalid: > 1.0
      deliveryRate: -0.1, // Invalid: < 0
      // Missing required fields
    };

    const result = pushNotificationMetricsSchema.safeParse(invalidMetrics);
    expect(result.success).toBe(false);
  });

  it('should validate device platform counts', () => {
    const validMetrics = {
      optInRate: 0.3,
      deliveryRate: 0.95,
      clickRate: 0.2,
      optOutRate: 0.01,
      totalUsers: 100,
      totalConsents: 30,
      totalRevocations: 1,
      totalSent: 200,
      totalDelivered: 190,
      totalClicked: 38,
      totalFailed: 10,
      activeDevices: 30,
      devicesByPlatform: {
        IOS: 15,
        ANDROID: 10,
        WEB: 5,
      },
      byType: {},
      timeSeriesDaily: [],
      generatedAt: new Date().toISOString(),
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
    };

    const result = pushNotificationMetricsSchema.safeParse(validMetrics);
    expect(result.success).toBe(true);
  });
});

describe('Push Metrics Query Schema', () => {
  it('should validate query parameters', async () => {
    const { pushMetricsQuerySchema } = await import('@/lib/schemas/push-metrics.schema');

    const validQuery = {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-12-01T00:00:00Z',
      granularity: 'daily',
    };

    const result = pushMetricsQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
  });

  it('should use default granularity', async () => {
    const { pushMetricsQuerySchema } = await import('@/lib/schemas/push-metrics.schema');

    const query = {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-12-01T00:00:00Z',
    };

    const result = pushMetricsQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.granularity).toBe('daily');
    }
  });
});
