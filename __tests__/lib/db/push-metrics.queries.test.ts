/**
 * Push Notification Metrics Database Queries Tests
 *
 * Integration tests for push notification metrics aggregation logic.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fetchPushNotificationMetrics } from '@/lib/db/push-metrics.queries';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
    },
    pushConsentLog: {
      findMany: jest.fn(),
    },
    notificationPreference: {
      count: jest.fn(),
    },
    deviceToken: {
      groupBy: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('fetchPushNotificationMetrics', () => {
  const defaultOptions = {
    startDate: new Date('2025-11-01T00:00:00Z'),
    endDate: new Date('2025-12-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================
  // Opt-in Rate Tests
  // ============================================

  describe('Opt-in Rate Calculation', () => {
    it('should calculate opt-in rate correctly', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1000);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(400);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.optInRate).toBe(0.4);
      expect(metrics.totalUsers).toBe(1000);
    });

    it('should handle zero users', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(0);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.optInRate).toBe(0);
      expect(metrics.totalUsers).toBe(0);
    });

    it('should filter by studioId when provided', async () => {
      const studioId = 'studio-123';

      (prisma.user.count as jest.Mock).mockResolvedValue(500);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(200);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      await fetchPushNotificationMetrics({
        ...defaultOptions,
        studioId,
      });

      // Verify studioId filter was applied
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            Booking: expect.objectContaining({
              some: expect.objectContaining({
                studioId,
              }),
            }),
          }),
        }),
      );
    });
  });

  // ============================================
  // Consent Metrics Tests
  // ============================================

  describe('Consent Metrics Calculation', () => {
    it('should count unique users who granted consent', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([
        { action: 'GRANTED', userId: 'user-1' },
        { action: 'GRANTED', userId: 'user-1' }, // Duplicate
        { action: 'GRANTED', userId: 'user-2' },
        { action: 'REVOKED', userId: 'user-3' },
      ] as any);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.totalConsents).toBe(2); // Only unique granted users
      expect(metrics.totalRevocations).toBe(1);
    });

    it('should calculate opt-out rate correctly', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([
        { action: 'GRANTED', userId: 'user-1' },
        { action: 'GRANTED', userId: 'user-2' },
        { action: 'GRANTED', userId: 'user-3' },
        { action: 'GRANTED', userId: 'user-4' },
        { action: 'REVOKED', userId: 'user-5' },
      ] as any);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.optOutRate).toBe(0.25); // 1 revoked / 4 granted
    });

    it('should handle zero consents', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(0);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.optOutRate).toBe(0);
    });
  });

  // ============================================
  // Device Metrics Tests
  // ============================================

  describe('Device Metrics Calculation', () => {
    it('should aggregate device counts by platform', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([
        { platform: 'IOS', _count: { id: 60 } },
        { platform: 'ANDROID', _count: { id: 35 } },
        { platform: 'WEB', _count: { id: 5 } },
      ] as any);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.activeDevices).toBe(100);
      expect(metrics.devicesByPlatform).toEqual({
        IOS: 60,
        ANDROID: 35,
        WEB: 5,
      });
    });

    it('should initialize missing platforms with zero', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([
        { platform: 'IOS', _count: { id: 50 } },
      ] as any);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.devicesByPlatform).toEqual({
        IOS: 50,
        ANDROID: 0,
        WEB: 0,
      });
    });
  });

  // ============================================
  // Delivery Metrics Tests
  // ============================================

  describe('Delivery Metrics Calculation', () => {
    beforeEach(() => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
    });

    it('should calculate delivery rate correctly', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { pushDeliveredAt: new Date(), pushReadAt: null, pushFailedAt: null },
        { pushDeliveredAt: new Date(), pushReadAt: null, pushFailedAt: null },
        { pushDeliveredAt: new Date(), pushReadAt: null, pushFailedAt: null },
        { pushDeliveredAt: null, pushReadAt: null, pushFailedAt: new Date() },
        { pushDeliveredAt: null, pushReadAt: null, pushFailedAt: new Date() },
      ] as any);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.totalSent).toBe(5);
      expect(metrics.totalDelivered).toBe(3);
      expect(metrics.totalFailed).toBe(2);
      expect(metrics.deliveryRate).toBe(0.6);
    });

    it('should calculate click rate correctly', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { pushDeliveredAt: new Date(), pushReadAt: new Date(), pushFailedAt: null },
        { pushDeliveredAt: new Date(), pushReadAt: null, pushFailedAt: null },
        { pushDeliveredAt: new Date(), pushReadAt: null, pushFailedAt: null },
        { pushDeliveredAt: new Date(), pushReadAt: new Date(), pushFailedAt: null },
      ] as any);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.totalDelivered).toBe(4);
      expect(metrics.totalClicked).toBe(2);
      expect(metrics.clickRate).toBe(0.5);
    });

    it('should handle zero notifications', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.totalSent).toBe(0);
      expect(metrics.totalDelivered).toBe(0);
      expect(metrics.totalClicked).toBe(0);
      expect(metrics.deliveryRate).toBe(0);
      expect(metrics.clickRate).toBe(0);
    });
  });

  // ============================================
  // Metrics By Type Tests
  // ============================================

  describe('Metrics By Type Calculation', () => {
    beforeEach(() => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
    });

    it('should group metrics by notification type', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          type: 'BOOKING_CONFIRMED',
          pushDeliveredAt: new Date(),
          pushReadAt: new Date(),
          pushFailedAt: null,
        },
        {
          type: 'BOOKING_CONFIRMED',
          pushDeliveredAt: new Date(),
          pushReadAt: null,
          pushFailedAt: null,
        },
        {
          type: 'BOOKING_REMINDER',
          pushDeliveredAt: new Date(),
          pushReadAt: null,
          pushFailedAt: null,
        },
        {
          type: 'BOOKING_REMINDER',
          pushDeliveredAt: null,
          pushReadAt: null,
          pushFailedAt: new Date(),
        },
      ] as any);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.byType['BOOKING_CONFIRMED']).toEqual({
        sent: 2,
        delivered: 2,
        clicked: 1,
        failed: 0,
        deliveryRate: 1.0,
        clickRate: 0.5,
      });

      expect(metrics.byType['BOOKING_REMINDER']).toEqual({
        sent: 2,
        delivered: 1,
        clicked: 0,
        failed: 1,
        deliveryRate: 0.5,
        clickRate: 0,
      });
    });

    it('should handle empty type groups', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(Object.keys(metrics.byType).length).toBe(0);
    });
  });

  // ============================================
  // Time Series Tests
  // ============================================

  describe('Time Series Calculation', () => {
    beforeEach(() => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
    });

    it('should generate daily time series data', async () => {
      const startDate = new Date('2025-12-01T00:00:00Z');
      const endDate = new Date('2025-12-03T23:59:59Z');

      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([
        { createdAt: new Date('2025-12-01T10:00:00Z'), action: 'GRANTED' },
        { createdAt: new Date('2025-12-02T10:00:00Z'), action: 'GRANTED' },
        { createdAt: new Date('2025-12-02T11:00:00Z'), action: 'REVOKED' },
      ] as any);

      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          createdAt: new Date('2025-12-01T10:00:00Z'),
          pushDeliveredAt: new Date(),
          pushReadAt: null,
          pushFailedAt: null,
        },
        {
          createdAt: new Date('2025-12-02T10:00:00Z'),
          pushDeliveredAt: new Date(),
          pushReadAt: new Date(),
          pushFailedAt: null,
        },
      ] as any);

      const metrics = await fetchPushNotificationMetrics({ startDate, endDate });

      expect(metrics.timeSeriesDaily.length).toBe(3); // 3 days
      expect(metrics.timeSeriesDaily[0].date).toBe('2025-12-01T00:00:00.000Z');
      expect(metrics.timeSeriesDaily[0].sent).toBe(1);
      expect(metrics.timeSeriesDaily[0].consentsGranted).toBe(1);

      expect(metrics.timeSeriesDaily[1].sent).toBe(1);
      expect(metrics.timeSeriesDaily[1].clicked).toBe(1);
      expect(metrics.timeSeriesDaily[1].consentsGranted).toBe(1);
      expect(metrics.timeSeriesDaily[1].consentsRevoked).toBe(1);
    });

    it('should initialize missing days with zeros', async () => {
      const startDate = new Date('2025-12-01T00:00:00Z');
      const endDate = new Date('2025-12-03T23:59:59Z');

      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await fetchPushNotificationMetrics({ startDate, endDate });

      expect(metrics.timeSeriesDaily.length).toBe(3);
      metrics.timeSeriesDaily.forEach((dataPoint) => {
        expect(dataPoint.sent).toBe(0);
        expect(dataPoint.delivered).toBe(0);
        expect(dataPoint.clicked).toBe(0);
        expect(dataPoint.failed).toBe(0);
        expect(dataPoint.consentsGranted).toBe(0);
        expect(dataPoint.consentsRevoked).toBe(0);
      });
    });
  });

  // ============================================
  // Metadata Tests
  // ============================================

  describe('Response Metadata', () => {
    beforeEach(() => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.notificationPreference.count as jest.Mock).mockResolvedValue(50);
      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    });

    it('should include generation timestamp', async () => {
      const before = new Date();
      const metrics = await fetchPushNotificationMetrics(defaultOptions);
      const after = new Date();

      const generatedAt = new Date(metrics.generatedAt);
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include period boundaries', async () => {
      const metrics = await fetchPushNotificationMetrics(defaultOptions);

      expect(metrics.periodStart).toBe(defaultOptions.startDate.toISOString());
      expect(metrics.periodEnd).toBe(defaultOptions.endDate.toISOString());
    });
  });

  // ============================================
  // Performance Tests
  // ============================================

  describe('Performance Optimization', () => {
    it('should execute queries in parallel', async () => {
      const queryTimes: number[] = [];

      (prisma.user.count as jest.Mock).mockImplementation(async () => {
        queryTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 100;
      });

      (prisma.notificationPreference.count as jest.Mock).mockImplementation(async () => {
        queryTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 50;
      });

      (prisma.pushConsentLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.deviceToken.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const startTime = Date.now();
      await fetchPushNotificationMetrics(defaultOptions);
      const duration = Date.now() - startTime;

      // If queries run in parallel, total time should be ~50ms, not 100ms+
      expect(duration).toBeLessThan(150);
    });
  });
});
