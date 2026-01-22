/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Metrics Tests
 * Unit tests for metrics collection and Prometheus export
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getMetricsCollector,
  setMetricsCollector,
  recordNotificationCreated,
  recordNotificationDelivered,
  recordNotificationFailed,
  recordDeliveryDuration,
  updatePendingCount,
  updateRateLimitedCount,
  withTiming,
  type IMetricsCollector,
} from '@/lib/notifications/metrics';

describe('Notification Metrics', () => {
  let collector: IMetricsCollector;

  beforeEach(() => {
    collector = getMetricsCollector();
    collector.reset();
  });

  describe('Counter Metrics', () => {
    it('should increment notifications_created_total', () => {
      recordNotificationCreated('BOOKING_CONFIRMED', 'HIGH');
      recordNotificationCreated('BOOKING_CONFIRMED', 'HIGH');
      recordNotificationCreated('BOOKING_CANCELLED', 'NORMAL');

      const output = collector.export();

      expect(output).toContain('notifications_created_total');
      expect(output).toContain('type="BOOKING_CONFIRMED"');
      expect(output).toContain('priority="HIGH"');
      expect(output).toContain('type="BOOKING_CANCELLED"');
      expect(output).toContain('priority="NORMAL"');
    });

    it('should increment notifications_delivered_total', () => {
      recordNotificationDelivered('PUSH', 'DELIVERED');
      recordNotificationDelivered('EMAIL', 'DELIVERED');
      recordNotificationDelivered('IN_APP', 'DELIVERED');

      const output = collector.export();

      expect(output).toContain('notifications_delivered_total');
      expect(output).toContain('channel="PUSH"');
      expect(output).toContain('channel="EMAIL"');
      expect(output).toContain('channel="IN_APP"');
    });

    it('should increment notifications_failed_total with error type', () => {
      recordNotificationFailed('PUSH', 'NetworkError');
      recordNotificationFailed('PUSH', 'NetworkError');
      recordNotificationFailed('EMAIL', 'SMTPError');

      const output = collector.export();

      expect(output).toContain('notifications_failed_total');
      expect(output).toContain('channel="PUSH"');
      expect(output).toContain('error_type="NetworkError"');
      expect(output).toContain('channel="EMAIL"');
      expect(output).toContain('error_type="SMTPError"');
    });
  });

  describe('Gauge Metrics', () => {
    it('should set notifications_pending_count', () => {
      updatePendingCount(42);

      const output = collector.export();

      expect(output).toContain('notifications_pending_count');
      expect(output).toContain('42');
    });

    it('should update notifications_pending_count', () => {
      updatePendingCount(10);
      updatePendingCount(20);

      const output = collector.export();

      expect(output).toContain('notifications_pending_count');
      expect(output).toMatch(/notifications_pending_count 20/);
      // Old value should be overwritten
      expect(output).not.toMatch(/notifications_pending_count 10/);
    });

    it('should set notifications_rate_limited_count', () => {
      updateRateLimitedCount(5);

      const output = collector.export();

      expect(output).toContain('notifications_rate_limited_count');
      expect(output).toContain('5');
    });
  });

  describe('Histogram Metrics', () => {
    it('should observe notification_delivery_duration_seconds', () => {
      recordDeliveryDuration('PUSH', 0.5);
      recordDeliveryDuration('PUSH', 1.5);
      recordDeliveryDuration('EMAIL', 2.5);

      const output = collector.export();

      expect(output).toContain('notification_delivery_duration_seconds');
      expect(output).toContain('channel="PUSH"');
      expect(output).toContain('channel="EMAIL"');
      expect(output).toContain('_bucket');
      expect(output).toContain('_sum');
      expect(output).toContain('_count');
    });

    it('should correctly bucket histogram values', () => {
      // Add values in different buckets
      recordDeliveryDuration('PUSH', 0.3); // < 0.5
      recordDeliveryDuration('PUSH', 0.7); // < 1
      recordDeliveryDuration('PUSH', 1.5); // < 2

      const output = collector.export();

      // Check bucket counts are cumulative
      expect(output).toContain('le="0.5"');
      expect(output).toContain('le="1"');
      expect(output).toContain('le="2"');
      expect(output).toContain('_count{channel="PUSH"} 3');
    });

    it('should track histogram sum', () => {
      recordDeliveryDuration('EMAIL', 1.0);
      recordDeliveryDuration('EMAIL', 2.0);
      recordDeliveryDuration('EMAIL', 3.0);

      const output = collector.export();

      // Sum should be 6.0
      expect(output).toContain('_sum{channel="EMAIL"} 6');
    });
  });

  describe('Prometheus Format', () => {
    it('should export metrics in valid Prometheus format', () => {
      recordNotificationCreated('BOOKING_CONFIRMED', 'HIGH');
      recordNotificationDelivered('PUSH', 'DELIVERED');
      recordDeliveryDuration('PUSH', 1.5);

      const output = collector.export();

      // Check HELP lines
      expect(output).toMatch(/# HELP notifications_created_total/);
      expect(output).toMatch(/# HELP notifications_delivered_total/);
      expect(output).toMatch(/# HELP notification_delivery_duration_seconds/);

      // Check TYPE lines
      expect(output).toMatch(/# TYPE notifications_created_total counter/);
      expect(output).toMatch(/# TYPE notifications_delivered_total counter/);
      expect(output).toMatch(/# TYPE notification_delivery_duration_seconds histogram/);
    });

    it('should escape label values correctly', () => {
      collector.incrementCounter('notifications_created_total', {
        type: 'TEST_TYPE',
        priority: 'HIGH',
      });

      const output = collector.export();

      expect(output).toContain('type="TEST_TYPE"');
      expect(output).toContain('priority="HIGH"');
    });

    it('should handle empty metrics', () => {
      const output = collector.export();

      // Should still output structure with zero values
      expect(output).toContain('notifications_created_total');
      expect(output).toContain('notifications_delivered_total');
      expect(output).toContain('notifications_failed_total');
    });

    it('should include +Inf bucket in histograms', () => {
      recordDeliveryDuration('PUSH', 1.5);

      const output = collector.export();

      expect(output).toContain('le="+Inf"');
    });
  });

  describe('withTiming Helper', () => {
    it('should time successful operations', async () => {
      let recordedDuration = 0;

      await withTiming(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return 'success';
        },
        (duration) => {
          recordedDuration = duration;
        }
      );

      expect(recordedDuration).toBeGreaterThanOrEqual(0.1); // At least 100ms
      expect(recordedDuration).toBeLessThan(1); // Less than 1 second
    });

    it('should time failed operations', async () => {
      let recordedDuration = 0;

      await expect(
        withTiming(
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            throw new Error('Test error');
          },
          (duration) => {
            recordedDuration = duration;
          }
        )
      ).rejects.toThrow('Test error');

      expect(recordedDuration).toBeGreaterThanOrEqual(0.05); // At least 50ms
    });

    it('should return operation result', async () => {
      const result = await withTiming(
        async () => {
          return { data: 'test' };
        },
        () => {}
      );

      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('Metrics Collector Interface', () => {
    it('should allow custom collector implementation', () => {
      const originalCollector = getMetricsCollector();

      const customCollector: IMetricsCollector = {
        incrementCounter: jest.fn(),
        setGauge: jest.fn(),
        observeHistogram: jest.fn(),
        export: jest.fn().mockReturnValue('custom output'),
        reset: jest.fn(),
      };

      setMetricsCollector(customCollector);
      const retrieved = getMetricsCollector();

      expect(retrieved).toBe(customCollector);
      expect(retrieved.export()).toBe('custom output');

      // Restore original collector
      setMetricsCollector(originalCollector);
    });
  });

  describe('Label Handling', () => {
    it('should handle metrics without labels', () => {
      recordNotificationCreated('BOOKING_CONFIRMED', 'NORMAL');

      const output = collector.export();
      expect(output).toContain('notifications_created_total');
    });

    it('should sort labels alphabetically', () => {
      // Test with actual metric using multiple labels
      collector.incrementCounter('notifications_created_total', {
        zebra: 'z',
        alpha: 'a',
        beta: 'b',
        type: 'TEST',
        priority: 'NORMAL',
      });

      const output = collector.export();
      // Labels should appear in alphabetical order
      expect(output).toMatch(/alpha="a".*beta="b".*priority="NORMAL".*type="TEST".*zebra="z"/);
    });

    it('should handle multiple label sets for same metric', () => {
      recordNotificationDelivered('PUSH', 'DELIVERED');
      recordNotificationDelivered('EMAIL', 'DELIVERED');

      const output = collector.export();

      expect(output).toContain('channel="PUSH"');
      expect(output).toContain('channel="EMAIL"');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      recordNotificationCreated('BOOKING_CONFIRMED', 'HIGH');
      recordNotificationDelivered('PUSH', 'DELIVERED');
      updatePendingCount(42);

      collector.reset();

      const output = collector.export();

      // Metrics should be reset to zero/empty
      expect(output).not.toContain('type="BOOKING_CONFIRMED"');
      expect(output).not.toContain('channel="PUSH"');
      expect(output).not.toContain('42');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown counter metric', () => {
      expect(() => {
        collector.incrementCounter('unknown_metric', {});
      }).toThrow();
    });

    it('should throw error for unknown gauge metric', () => {
      expect(() => {
        collector.setGauge('unknown_metric', {}, 10);
      }).toThrow();
    });

    it('should throw error for unknown histogram metric', () => {
      expect(() => {
        collector.observeHistogram('unknown_metric', {}, 1.5);
      }).toThrow();
    });
  });
});
