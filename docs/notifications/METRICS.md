# Notification System Metrics

## Overview

The notification system exposes Prometheus-compatible metrics for observability and monitoring. Metrics track notification creation, delivery success/failure, latency, and queue sizes.

## Architecture

```
┌─────────────────────────────────────────┐
│   Notification Service                  │
│                                         │
│   ┌──────────────┐                     │
│   │   create()   │──► recordCreated()  │
│   └──────────────┘                     │
│                                         │
│   ┌──────────────┐                     │
│   │  process()   │──► withMetrics()    │
│   └──────────────┘        │            │
│                           ▼            │
│   ┌──────────────┐   recordDelivered() │
│   │ deliverPush()│   recordFailed()    │
│   │deliverEmail()│   recordDuration()  │
│   │deliverInApp()│                     │
│   └──────────────┘                     │
└─────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Metrics Collector    │
        │  (In-Memory)          │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  GET /api/metrics/    │
        │      notifications    │
        │  (Prometheus format)  │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Prometheus Server   │
        │   (Scraper)           │
        └───────────────────────┘
```

## Available Metrics

### Counters

#### `notifications_created_total`
Total number of notifications created.

**Labels:**
- `type`: Notification type (e.g., `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`)
- `priority`: Priority level (`URGENT`, `HIGH`, `NORMAL`, `LOW`)

**Example:**
```prometheus
notifications_created_total{type="BOOKING_CONFIRMED",priority="HIGH"} 1523
notifications_created_total{type="BOOKING_CANCELLED",priority="NORMAL"} 432
```

#### `notifications_delivered_total`
Total number of notification delivery attempts.

**Labels:**
- `channel`: Delivery channel (`PUSH`, `EMAIL`, `IN_APP`)
- `status`: Delivery status (`DELIVERED`, `PARTIALLY_DELIVERED`)

**Example:**
```prometheus
notifications_delivered_total{channel="PUSH",status="DELIVERED"} 1890
notifications_delivered_total{channel="EMAIL",status="DELIVERED"} 1756
```

#### `notifications_failed_total`
Total number of failed notification deliveries.

**Labels:**
- `channel`: Delivery channel (`PUSH`, `EMAIL`, `IN_APP`)
- `error_type`: Error class name (e.g., `NetworkError`, `SMTPError`)

**Example:**
```prometheus
notifications_failed_total{channel="PUSH",error_type="NetworkError"} 23
notifications_failed_total{channel="EMAIL",error_type="SMTPError"} 12
```

### Gauges

#### `notifications_pending_count`
Current number of pending notifications in the queue.

**Example:**
```prometheus
notifications_pending_count 142
```

#### `notifications_rate_limited_count`
Current number of notifications blocked by rate limiting.

**Example:**
```prometheus
notifications_rate_limited_count 8
```

### Histograms

#### `notification_delivery_duration_seconds`
Time taken to deliver a notification (in seconds).

**Labels:**
- `channel`: Delivery channel (`PUSH`, `EMAIL`, `IN_APP`)

**Buckets:** `0.1, 0.5, 1, 2, 5, 10, 30, 60` seconds

**Example:**
```prometheus
notification_delivery_duration_seconds_bucket{channel="PUSH",le="0.5"} 1234
notification_delivery_duration_seconds_bucket{channel="PUSH",le="1"} 1567
notification_delivery_duration_seconds_bucket{channel="PUSH",le="2"} 1789
notification_delivery_duration_seconds_bucket{channel="PUSH",le="+Inf"} 1890
notification_delivery_duration_seconds_sum{channel="PUSH"} 987.5
notification_delivery_duration_seconds_count{channel="PUSH"} 1890
```

## Accessing Metrics

### API Endpoint

Metrics are exposed at:
```
GET /api/metrics/notifications
```

Response format: `text/plain` (Prometheus format)

**Example Request:**
```bash
curl http://localhost:3000/api/metrics/notifications
```

**Example Response:**
```prometheus
# HELP notifications_created_total Total number of notifications created
# TYPE notifications_created_total counter
notifications_created_total{type="BOOKING_CONFIRMED",priority="HIGH"} 1523

# HELP notification_delivery_duration_seconds Time taken to deliver notification
# TYPE notification_delivery_duration_seconds histogram
notification_delivery_duration_seconds_bucket{channel="PUSH",le="0.5"} 1234
notification_delivery_duration_seconds_sum{channel="PUSH"} 987.5
notification_delivery_duration_seconds_count{channel="PUSH"} 1890
```

## Prometheus Configuration

Add this scrape config to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'massava-notifications'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics/notifications'
```

## Dashboard Queries

### Notification Throughput

**Created per minute:**
```promql
rate(notifications_created_total[5m]) * 60
```

**Delivered per minute:**
```promql
rate(notifications_delivered_total[5m]) * 60
```

### Error Rate

**Overall error rate (percentage):**
```promql
(
  sum(rate(notifications_failed_total[5m])) /
  (
    sum(rate(notifications_delivered_total[5m])) +
    sum(rate(notifications_failed_total[5m]))
  )
) * 100
```

**Error rate by channel:**
```promql
rate(notifications_failed_total[5m]) /
(rate(notifications_delivered_total[5m]) + rate(notifications_failed_total[5m]))
```

### Success Rate

**Success rate by channel (percentage):**
```promql
(
  rate(notifications_delivered_total{status="DELIVERED"}[5m]) /
  (
    rate(notifications_delivered_total[5m]) +
    rate(notifications_failed_total[5m])
  )
) * 100
```

### Latency Percentiles

**P50 latency by channel:**
```promql
histogram_quantile(0.50, rate(notification_delivery_duration_seconds_bucket[5m]))
```

**P95 latency by channel:**
```promql
histogram_quantile(0.95, rate(notification_delivery_duration_seconds_bucket[5m]))
```

**P99 latency by channel:**
```promql
histogram_quantile(0.99, rate(notification_delivery_duration_seconds_bucket[5m]))
```

**Average delivery time:**
```promql
rate(notification_delivery_duration_seconds_sum[5m]) /
rate(notification_delivery_duration_seconds_count[5m])
```

### Queue Metrics

**Pending notifications:**
```promql
notifications_pending_count
```

**Rate limited notifications:**
```promql
notifications_rate_limited_count
```

**Queue growth rate:**
```promql
delta(notifications_pending_count[5m])
```

### Channel Distribution

**Notifications by channel (last 5 minutes):**
```promql
sum by (channel) (rate(notifications_delivered_total[5m]))
```

**Notifications by type (last 5 minutes):**
```promql
sum by (type) (rate(notifications_created_total[5m]))
```

### Error Analysis

**Top error types:**
```promql
topk(5, sum by (error_type) (rate(notifications_failed_total[5m])))
```

**Errors by channel:**
```promql
sum by (channel, error_type) (rate(notifications_failed_total[5m]))
```

## Grafana Dashboard

### Example Dashboard JSON

```json
{
  "dashboard": {
    "title": "Notification System",
    "panels": [
      {
        "title": "Notification Throughput",
        "targets": [
          {
            "expr": "rate(notifications_created_total[5m]) * 60",
            "legendFormat": "Created/min"
          },
          {
            "expr": "rate(notifications_delivered_total[5m]) * 60",
            "legendFormat": "Delivered/min"
          }
        ]
      },
      {
        "title": "Error Rate by Channel",
        "targets": [
          {
            "expr": "rate(notifications_failed_total[5m]) / (rate(notifications_delivered_total[5m]) + rate(notifications_failed_total[5m]))",
            "legendFormat": "{{ channel }}"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(notification_delivery_duration_seconds_bucket[5m]))",
            "legendFormat": "{{ channel }}"
          }
        ]
      },
      {
        "title": "Pending Queue Size",
        "targets": [
          {
            "expr": "notifications_pending_count"
          }
        ]
      }
    ]
  }
}
```

## Alerting Rules

### Example Prometheus Alert Rules

```yaml
groups:
  - name: notifications
    interval: 30s
    rules:
      # High error rate
      - alert: NotificationHighErrorRate
        expr: |
          (
            sum(rate(notifications_failed_total[5m])) /
            (
              sum(rate(notifications_delivered_total[5m])) +
              sum(rate(notifications_failed_total[5m]))
            )
          ) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Notification error rate above 5%"
          description: "Error rate: {{ $value | humanizePercentage }}"

      # Critical error rate
      - alert: NotificationCriticalErrorRate
        expr: |
          (
            sum(rate(notifications_failed_total[5m])) /
            (
              sum(rate(notifications_delivered_total[5m])) +
              sum(rate(notifications_failed_total[5m]))
            )
          ) > 0.15
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Notification error rate above 15%"
          description: "Error rate: {{ $value | humanizePercentage }}"

      # High latency
      - alert: NotificationHighLatency
        expr: |
          histogram_quantile(0.95,
            rate(notification_delivery_duration_seconds_bucket[5m])
          ) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 notification delivery latency above 5s"
          description: "P95 latency: {{ $value }}s for {{ $labels.channel }}"

      # Queue backup
      - alert: NotificationQueueBackup
        expr: notifications_pending_count > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Notification queue backing up"
          description: "{{ $value }} notifications pending"

      # Rate limiting
      - alert: NotificationRateLimiting
        expr: notifications_rate_limited_count > 100
        for: 5m
        labels:
          severity: info
        annotations:
          summary: "High rate limiting activity"
          description: "{{ $value }} notifications rate limited"

      # Channel-specific failures
      - alert: NotificationChannelDown
        expr: |
          rate(notifications_failed_total{channel="PUSH"}[5m]) /
          (
            rate(notifications_delivered_total{channel="PUSH"}[5m]) +
            rate(notifications_failed_total{channel="PUSH"}[5m])
          ) > 0.8
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.channel }} channel error rate above 80%"
          description: "Check {{ $labels.channel }} service health"
```

## Integration with Notification Service

### Recording Metrics in Code

```typescript
import {
  recordNotificationCreated,
  recordNotificationDelivered,
  recordNotificationFailed,
  recordDeliveryDuration,
} from '@/lib/notifications/metrics';

// When creating notification
recordNotificationCreated('BOOKING_CONFIRMED', 'HIGH');

// When delivery succeeds
recordNotificationDelivered('PUSH', 'DELIVERED');
recordDeliveryDuration('PUSH', 1.5); // 1.5 seconds

// When delivery fails
recordNotificationFailed('PUSH', 'NetworkError');
```

### Using Metrics Wrapper

```typescript
import { withMetrics } from '@/lib/notifications/metrics-integration';

// Wrap delivery functions
private async deliverPush(...) {
  return withMetrics('PUSH', async () => {
    // delivery logic
  });
}
```

## Testing Metrics

### Unit Tests

```bash
npm test -- __tests__/unit/notifications/metrics.test.ts
```

### Integration Tests

```bash
npm test -- __tests__/integration/notifications/metrics-integration.test.ts
```

### Manual Testing

```bash
# Generate some test metrics
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","type":"BOOKING_CONFIRMED","priority":"HIGH"}'

# Check metrics
curl http://localhost:3000/api/metrics/notifications
```

## Production Considerations

### Performance

- In-memory collector is lightweight (< 1ms overhead)
- Metrics export is fast (< 100ms for 10k+ metrics)
- No external dependencies required

### Scalability

For high-scale deployments (> 10k notifications/min), consider:

1. **Prometheus Push Gateway**: Push metrics instead of scraping
2. **Redis Backend**: Shared metrics across multiple instances
3. **StatsD/DataDog**: Alternative metrics backends

### Custom Collector Example

```typescript
import { setMetricsCollector, type IMetricsCollector } from '@/lib/notifications/metrics';

class RedisMetricsCollector implements IMetricsCollector {
  // Implement using Redis counters/hashes
}

setMetricsCollector(new RedisMetricsCollector());
```

## Troubleshooting

### Metrics Not Appearing

1. Check metrics endpoint is accessible:
   ```bash
   curl http://localhost:3000/api/metrics/notifications
   ```

2. Verify metrics are being recorded:
   ```typescript
   import { getMetricsCollector } from '@/lib/notifications/metrics';
   console.log(getMetricsCollector().export());
   ```

3. Check Prometheus scrape config and targets

### Incorrect Metric Values

1. Reset metrics and test:
   ```typescript
   getMetricsCollector().reset();
   ```

2. Check for multiple collector instances

3. Verify label consistency

### High Memory Usage

1. Check number of unique label combinations
2. Consider aggregating less-used labels
3. Implement metric expiration for unused series

## References

- [Prometheus Exposition Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Histogram vs Summary](https://prometheus.io/docs/practices/histograms/)

---

**Last Updated:** 2025-12-02
**Author:** Development Team
**Version:** 1.0
