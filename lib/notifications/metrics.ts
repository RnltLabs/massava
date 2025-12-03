/**
 * Notification Metrics Collection
 *
 * Prometheus-compatible metrics for notification system observability.
 * Provides counters, histograms, and gauges for tracking notification lifecycle.
 *
 * **Dashboard Queries**:
 *
 * Throughput:
 *   rate(notifications_created_total[5m])
 *   rate(notifications_delivered_total[5m])
 *
 * Error Rate:
 *   (sum(rate(notifications_failed_total[5m])) /
 *    sum(rate(notifications_delivered_total[5m]) + rate(notifications_failed_total[5m]))) * 100
 *
 * Success Rate by Channel:
 *   rate(notifications_delivered_total{status="DELIVERED"}[5m]) /
 *   (rate(notifications_delivered_total[5m]) + rate(notifications_failed_total[5m]))
 *
 * P50/P95/P99 Latency:
 *   histogram_quantile(0.50, rate(notification_delivery_duration_seconds_bucket[5m]))
 *   histogram_quantile(0.95, rate(notification_delivery_duration_seconds_bucket[5m]))
 *   histogram_quantile(0.99, rate(notification_delivery_duration_seconds_bucket[5m]))
 *
 * Pending Queue Size:
 *   notifications_pending_count
 *
 * Rate Limited Users:
 *   notifications_rate_limited_count
 *
 * Channel Distribution:
 *   sum by (channel) (rate(notifications_delivered_total[5m]))
 *
 * Error Distribution:
 *   sum by (error_type) (rate(notifications_failed_total[5m]))
 */

import type {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
} from '@/app/generated/prisma';

// ============================================
// Types
// ============================================

export interface MetricLabels {
  [key: string]: string;
}

export interface CounterMetric {
  name: string;
  help: string;
  type: 'counter';
  values: Map<string, number>;
}

export interface GaugeMetric {
  name: string;
  help: string;
  type: 'gauge';
  values: Map<string, number>;
}

export interface HistogramMetric {
  name: string;
  help: string;
  type: 'histogram';
  buckets: number[];
  values: Map<string, { buckets: Map<number, number>; sum: number; count: number }>;
}

export type Metric = CounterMetric | GaugeMetric | HistogramMetric;

// ============================================
// Metrics Interface
// ============================================

export interface IMetricsCollector {
  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: MetricLabels, value?: number): void;

  /**
   * Set a gauge metric
   */
  setGauge(name: string, labels: MetricLabels, value: number): void;

  /**
   * Observe a histogram value
   */
  observeHistogram(name: string, labels: MetricLabels, value: number): void;

  /**
   * Export metrics in Prometheus format
   */
  export(): string;

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void;
}

// ============================================
// In-Memory Implementation
// ============================================

class InMemoryMetricsCollector implements IMetricsCollector {
  private metrics: Map<string, Metric> = new Map();

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Counter: Total notifications created
    this.registerCounter(
      'notifications_created_total',
      'Total number of notifications created',
    );

    // Counter: Total notifications delivered
    this.registerCounter(
      'notifications_delivered_total',
      'Total number of notifications delivered (attempts)',
    );

    // Counter: Total notifications failed
    this.registerCounter(
      'notifications_failed_total',
      'Total number of notification delivery failures',
    );

    // Histogram: Delivery duration
    this.registerHistogram(
      'notification_delivery_duration_seconds',
      'Time taken to deliver notification',
      [0.1, 0.5, 1, 2, 5, 10, 30, 60], // Buckets in seconds
    );

    // Gauge: Pending notifications
    this.registerGauge(
      'notifications_pending_count',
      'Current number of pending notifications',
    );

    // Gauge: Rate limited notifications
    this.registerGauge(
      'notifications_rate_limited_count',
      'Current number of rate-limited notifications',
    );
  }

  private registerCounter(name: string, help: string): void {
    this.metrics.set(name, {
      name,
      help,
      type: 'counter',
      values: new Map(),
    });
  }

  private registerGauge(name: string, help: string): void {
    this.metrics.set(name, {
      name,
      help,
      type: 'gauge',
      values: new Map(),
    });
  }

  private registerHistogram(name: string, help: string, buckets: number[]): void {
    this.metrics.set(name, {
      name,
      help,
      type: 'histogram',
      buckets: buckets.sort((a, b) => a - b),
      values: new Map(),
    });
  }

  private serializeLabels(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const pairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `{${pairs}}`;
  }

  incrementCounter(name: string, labels?: MetricLabels, value: number = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'counter') {
      throw new Error(`Counter metric '${name}' not found`);
    }

    const key = this.serializeLabels(labels);
    const currentValue = metric.values.get(key) || 0;
    metric.values.set(key, currentValue + value);
  }

  setGauge(name: string, labels: MetricLabels, value: number): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'gauge') {
      throw new Error(`Gauge metric '${name}' not found`);
    }

    const key = this.serializeLabels(labels);
    metric.values.set(key, value);
  }

  observeHistogram(name: string, labels: MetricLabels, value: number): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'histogram') {
      throw new Error(`Histogram metric '${name}' not found`);
    }

    const key = this.serializeLabels(labels);
    let histogramData = metric.values.get(key);

    if (!histogramData) {
      histogramData = {
        buckets: new Map(),
        sum: 0,
        count: 0,
      };
      metric.values.set(key, histogramData);
    }

    // Update buckets (cumulative)
    for (const bucket of metric.buckets) {
      if (value <= bucket) {
        const bucketCount = histogramData.buckets.get(bucket) || 0;
        histogramData.buckets.set(bucket, bucketCount + 1);
      }
    }

    // Update sum and count
    histogramData.sum += value;
    histogramData.count += 1;
  }

  export(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      // Add HELP line
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      if (metric.type === 'counter' || metric.type === 'gauge') {
        // Export counter/gauge values
        if (metric.values.size === 0) {
          lines.push(`${metric.name} 0`);
        } else {
          for (const [labels, value] of metric.values.entries()) {
            lines.push(`${metric.name}${labels} ${value}`);
          }
        }
      } else if (metric.type === 'histogram') {
        // Export histogram buckets
        if (metric.values.size === 0) {
          // No observations yet, output zero buckets
          for (const bucket of metric.buckets) {
            lines.push(`${metric.name}_bucket{le="${bucket}"} 0`);
          }
          lines.push(`${metric.name}_bucket{le="+Inf"} 0`);
          lines.push(`${metric.name}_sum 0`);
          lines.push(`${metric.name}_count 0`);
        } else {
          for (const [labels, histogramData] of metric.values.entries()) {
            const baseLabels = labels.slice(1, -1); // Remove outer braces

            // Bucket counts
            for (const bucket of metric.buckets) {
              const count = histogramData.buckets.get(bucket) || 0;
              const bucketLabels = baseLabels
                ? `{${baseLabels},le="${bucket}"}`
                : `{le="${bucket}"}`;
              lines.push(`${metric.name}_bucket${bucketLabels} ${count}`);
            }

            // +Inf bucket (total count)
            const infLabels = baseLabels
              ? `{${baseLabels},le="+Inf"}`
              : `{le="+Inf"}`;
            lines.push(`${metric.name}_bucket${infLabels} ${histogramData.count}`);

            // Sum and count
            lines.push(`${metric.name}_sum${labels} ${histogramData.sum}`);
            lines.push(`${metric.name}_count${labels} ${histogramData.count}`);
          }
        }
      }

      lines.push(''); // Empty line between metrics
    }

    return lines.join('\n');
  }

  reset(): void {
    this.metrics.clear();
    this.initializeMetrics();
  }
}

// ============================================
// Singleton Instance
// ============================================

let metricsCollector: IMetricsCollector;

export function getMetricsCollector(): IMetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new InMemoryMetricsCollector();
  }
  return metricsCollector;
}

/**
 * Set a custom metrics collector (useful for testing or production backends)
 */
export function setMetricsCollector(collector: IMetricsCollector): void {
  metricsCollector = collector;
}

// ============================================
// Notification-Specific Helpers
// ============================================

/**
 * Record notification creation
 */
export function recordNotificationCreated(
  type: NotificationType,
  priority: NotificationPriority,
): void {
  const collector = getMetricsCollector();
  collector.incrementCounter('notifications_created_total', {
    type,
    priority,
  });
}

/**
 * Record notification delivery attempt
 */
export function recordNotificationDelivered(
  channel: NotificationChannel,
  status: NotificationStatus,
): void {
  const collector = getMetricsCollector();
  collector.incrementCounter('notifications_delivered_total', {
    channel,
    status,
  });
}

/**
 * Record notification delivery failure
 */
export function recordNotificationFailed(
  channel: NotificationChannel,
  errorType: string,
): void {
  const collector = getMetricsCollector();
  collector.incrementCounter('notifications_failed_total', {
    channel,
    error_type: errorType,
  });
}

/**
 * Record notification delivery duration
 */
export function recordDeliveryDuration(
  channel: NotificationChannel,
  durationSeconds: number,
): void {
  const collector = getMetricsCollector();
  collector.observeHistogram(
    'notification_delivery_duration_seconds',
    { channel },
    durationSeconds,
  );
}

/**
 * Update pending notifications count
 */
export function updatePendingCount(count: number): void {
  const collector = getMetricsCollector();
  collector.setGauge('notifications_pending_count', {}, count);
}

/**
 * Update rate limited notifications count
 */
export function updateRateLimitedCount(count: number): void {
  const collector = getMetricsCollector();
  collector.setGauge('notifications_rate_limited_count', {}, count);
}

// ============================================
// Timing Helper
// ============================================

/**
 * Helper to time async operations
 *
 * Usage:
 * ```typescript
 * const result = await withTiming(
 *   async () => sendEmail(...),
 *   (duration) => recordDeliveryDuration('EMAIL', duration)
 * );
 * ```
 */
export async function withTiming<T>(
  operation: () => Promise<T>,
  recordFn: (durationSeconds: number) => void,
): Promise<T> {
  const startTime = Date.now();
  try {
    return await operation();
  } finally {
    const durationMs = Date.now() - startTime;
    recordFn(durationMs / 1000); // Convert to seconds
  }
}
