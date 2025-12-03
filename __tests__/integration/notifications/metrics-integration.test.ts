/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Metrics Integration Tests
 * Tests metrics collection integration with notification service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { withMetrics } from '@/lib/notifications/metrics-integration';
import {
  getMetricsCollector,
  type IMetricsCollector,
} from '@/lib/notifications/metrics';

describe('Metrics Integration', () => {
  let collector: IMetricsCollector;

  beforeEach(() => {
    collector = getMetricsCollector();
    collector.reset();
  });

  describe('withMetrics Wrapper', () => {
    it('should record successful PUSH delivery', async () => {
      const deliveryFn = jest.fn().mockResolvedValue(undefined);

      await withMetrics('PUSH', deliveryFn);

      expect(deliveryFn).toHaveBeenCalledTimes(1);

      const output = collector.export();
      expect(output).toContain('notifications_delivered_total');
      expect(output).toContain('channel="PUSH"');
      expect(output).toContain('status="DELIVERED"');
      expect(output).toContain('notification_delivery_duration_seconds');
    });

    it('should record successful EMAIL delivery', async () => {
      const deliveryFn = jest.fn().mockResolvedValue(undefined);

      await withMetrics('EMAIL', deliveryFn);

      const output = collector.export();
      expect(output).toContain('channel="EMAIL"');
    });

    it('should record successful IN_APP delivery', async () => {
      const deliveryFn = jest.fn().mockResolvedValue(undefined);

      await withMetrics('IN_APP', deliveryFn);

      const output = collector.export();
      expect(output).toContain('channel="IN_APP"');
    });

    it('should record delivery duration', async () => {
      const deliveryFn = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await withMetrics('PUSH', deliveryFn);

      const output = collector.export();
      expect(output).toContain('notification_delivery_duration_seconds');
      expect(output).toContain('channel="PUSH"');
      expect(output).toMatch(/_sum{channel="PUSH"} \d+\.\d+/);
      expect(output).toMatch(/_count{channel="PUSH"} 1/);
    });

    it('should record failed delivery with error type', async () => {
      const deliveryFn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(withMetrics('PUSH', deliveryFn)).rejects.toThrow('Network error');

      const output = collector.export();
      expect(output).toContain('notifications_failed_total');
      expect(output).toContain('channel="PUSH"');
      expect(output).toContain('error_type="Error"');
    });

    it('should record custom error types', async () => {
      class CustomNetworkError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomNetworkError';
        }
      }

      const deliveryFn = jest
        .fn()
        .mockRejectedValue(new CustomNetworkError('Connection timeout'));

      await expect(withMetrics('EMAIL', deliveryFn)).rejects.toThrow(
        'Connection timeout'
      );

      const output = collector.export();
      expect(output).toContain('error_type="CustomNetworkError"');
    });

    it('should track duration even for failed deliveries', async () => {
      const deliveryFn = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        throw new Error('Delivery failed');
      });

      await expect(withMetrics('PUSH', deliveryFn)).rejects.toThrow('Delivery failed');

      const output = collector.export();
      expect(output).toContain('notification_delivery_duration_seconds');
      expect(output).toMatch(/_sum{channel="PUSH"} \d+\.\d+/);
    });

    it('should handle unknown error types', async () => {
      const deliveryFn = jest.fn().mockRejectedValue('String error');

      await expect(withMetrics('IN_APP', deliveryFn)).rejects.toBe('String error');

      const output = collector.export();
      expect(output).toContain('error_type="Unknown"');
    });

    it('should return delivery result on success', async () => {
      const deliveryFn = jest.fn().mockResolvedValue({ messageId: 'msg-123' });

      const result = await withMetrics('EMAIL', deliveryFn);

      expect(result).toEqual({ messageId: 'msg-123' });
    });

    it('should re-throw original error', async () => {
      const originalError = new Error('Original message');
      const deliveryFn = jest.fn().mockRejectedValue(originalError);

      try {
        await withMetrics('PUSH', deliveryFn);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBe(originalError);
      }
    });
  });

  describe('Multiple Deliveries', () => {
    it('should track multiple successful deliveries', async () => {
      const pushFn = jest.fn().mockResolvedValue(undefined);
      const emailFn = jest.fn().mockResolvedValue(undefined);
      const inAppFn = jest.fn().mockResolvedValue(undefined);

      await Promise.all([
        withMetrics('PUSH', pushFn),
        withMetrics('EMAIL', emailFn),
        withMetrics('IN_APP', inAppFn),
      ]);

      const output = collector.export();

      // Should have counts for all channels
      expect(output).toContain('channel="PUSH"');
      expect(output).toContain('channel="EMAIL"');
      expect(output).toContain('channel="IN_APP"');
    });

    it('should track mixed success/failure deliveries', async () => {
      const successFn = jest.fn().mockResolvedValue(undefined);
      const failureFn = jest.fn().mockRejectedValue(new Error('Failed'));

      await withMetrics('PUSH', successFn);
      await expect(withMetrics('EMAIL', failureFn)).rejects.toThrow();

      const output = collector.export();

      // Should have both delivered and failed metrics
      expect(output).toContain('notifications_delivered_total');
      expect(output).toContain('notifications_failed_total');
    });

    it('should accumulate counts correctly', async () => {
      const deliveryFn = jest.fn().mockResolvedValue(undefined);

      // Deliver 5 notifications via PUSH
      await Promise.all([
        withMetrics('PUSH', deliveryFn),
        withMetrics('PUSH', deliveryFn),
        withMetrics('PUSH', deliveryFn),
        withMetrics('PUSH', deliveryFn),
        withMetrics('PUSH', deliveryFn),
      ]);

      const output = collector.export();

      // Count should be 5
      expect(output).toMatch(/notifications_delivered_total{channel="PUSH",status="DELIVERED"} 5/);
    });
  });

  describe('Performance', () => {
    it('should handle high volume of metrics', async () => {
      const deliveryFn = jest.fn().mockResolvedValue(undefined);

      // Record 1000 deliveries
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(withMetrics('PUSH', deliveryFn));
      }

      await Promise.all(promises);

      const output = collector.export();
      expect(output).toContain('notifications_delivered_total');
      expect(output).toMatch(/channel="PUSH",status="DELIVERED"} 1000/);
    });

    it('should export metrics quickly', () => {
      // Record some metrics
      for (let i = 0; i < 100; i++) {
        collector.incrementCounter('notifications_created_total', {
          type: 'TEST',
          priority: 'NORMAL',
        });
      }

      const startTime = Date.now();
      const output = collector.export();
      const duration = Date.now() - startTime;

      expect(output).toBeTruthy();
      expect(duration).toBeLessThan(100); // Should export in under 100ms
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent metric updates', async () => {
      const deliveryFns = Array(10)
        .fill(null)
        .map(() => jest.fn().mockResolvedValue(undefined));

      // Run deliveries concurrently
      await Promise.all(
        deliveryFns.map((fn, index) =>
          withMetrics(index % 2 === 0 ? 'PUSH' : 'EMAIL', fn)
        )
      );

      const output = collector.export();

      // Should have 5 PUSH and 5 EMAIL deliveries
      expect(output).toMatch(/channel="PUSH",status="DELIVERED"} 5/);
      expect(output).toMatch(/channel="EMAIL",status="DELIVERED"} 5/);
    });
  });
});
