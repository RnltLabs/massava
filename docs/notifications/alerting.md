# Notification System Alerting Configuration

**Last Updated**: December 2, 2025
**Version**: 1.0
**Maintainers**: Development Team

Comprehensive alerting configuration for the Massava notification system. This document defines all alerts, their conditions, runbooks, and provides ready-to-use Prometheus and Grafana configurations.

## Table of Contents

1. [Overview](#overview)
2. [Alert Definitions](#alert-definitions)
3. [Alert Groups](#alert-groups)
4. [Prometheus Alert Rules](#prometheus-alert-rules)
5. [Grafana Dashboard](#grafana-dashboard)
6. [Alert Routing](#alert-routing)
7. [Escalation Procedures](#escalation-procedures)
8. [Metrics Reference](#metrics-reference)

---

## Overview

### Alerting Strategy

The notification system uses **4-tier alerting approach**:

1. **Critical** (P1): System down, data loss risk, immediate action required
2. **Warning** (P2): Degraded service, investigation needed within 30 minutes
3. **Info** (P3): Informational alerts, no immediate action required
4. **Debug** (P4): Debugging signals, useful for understanding system behavior

### Notification Channels by Severity

| Severity | Channels | Escalation | SLA |
|----------|----------|------------|-----|
| **Critical** | Slack #alerts, PagerDuty, Email | Team lead after 5 min | 15 min |
| **Warning** | Slack #warnings, Email | Team lead after 30 min | 1 hour |
| **Info** | Slack #notifications | None | 4 hours |
| **Debug** | Slack #debug | None | None |

### Key Metrics

All alerts are based on these Prometheus metrics:

- `notification_delivery_total` - Total notifications delivered (counter)
- `notification_delivery_failures_total` - Delivery failures (counter)
- `notification_queue_backlog` - Messages waiting in queue (gauge)
- `notification_delivery_latency_seconds` - Delivery latency (histogram)
- `notification_email_bounces_total` - Email bounces (counter)
- `notification_rate_limit_triggered_total` - Rate limit violations (counter)
- `notification_device_token_invalid_total` - Invalid device tokens (counter)
- `notification_queue_processing_time_seconds` - Queue processing time (histogram)
- `notification_api_requests_total` - API requests (counter)
- `notification_api_errors_total` - API errors (counter)

---

## Alert Definitions

### Delivery Alerts

#### 1. Notification Delivery Failure Rate High

| Field | Value |
|-------|-------|
| **ID** | `NotificationDeliveryFailureRateHigh` |
| **Name** | Notification Delivery Failure Rate > 5% |
| **Severity** | Critical (P1) |
| **Condition** | Failure rate exceeds 5% for 5 minutes |
| **Duration** | 5 minutes |
| **SLA** | Acknowledge within 15 minutes |

**PromQL Query**:
```promql
(
  rate(notification_delivery_failures_total[5m])
  /
  rate(notification_delivery_total[5m])
) > 0.05
```

**Description**:
Indicates a systemic issue with notification delivery. This could be caused by:
- External service outages (Firebase Cloud Messaging, SendGrid, etc.)
- Database connectivity issues
- Application crashes or memory issues
- Network issues preventing communication with delivery providers

**Investigation**:
1. Check delivery provider status pages
2. Review application logs for errors
3. Check database connection pool status
4. Verify network connectivity to external services
5. Check memory and CPU usage on the notification service

**Runbook**: [NotificationDeliveryFailureRate](../runbook.md#issue-1-notifications-not-being-delivered)

**Notification Channels**:
- Slack: #alerts (with @on-call mention)
- PagerDuty: High urgency
- Email: Team lead + Engineer on call

---

#### 2. Notification Queue Backlog Critical

| Field | Value |
|-------|-------|
| **ID** | `NotificationQueueBacklogCritical` |
| **Name** | Notification Queue Backlog > 1000 |
| **Severity** | Warning (P2) |
| **Condition** | Queue backlog exceeds 1000 messages for 10 minutes |
| **Duration** | 10 minutes |
| **SLA** | Investigate within 30 minutes |

**PromQL Query**:
```promql
notification_queue_backlog > 1000
```

**Description**:
Queue processing is falling behind. Messages are accumulating faster than they can be processed. This indicates:
- Queue processor is slow or stuck
- High volume spike in notifications
- Consumer application is down or unresponsive
- Database queries are slow

**Investigation**:
1. Check queue consumer logs
2. Measure queue processing rate vs. incoming rate
3. Check database slow query logs
4. Verify consumer application health
5. Monitor CPU and memory of queue processor

**Runbook**: [QueueBacklogIssue](../runbook.md#issue-2-queue-backlog-accumulating)

**Notification Channels**:
- Slack: #warnings
- Email: Team lead (non-urgent)

---

#### 3. Push Notification Delivery Latency P99 High

| Field | Value |
|-------|-------|
| **ID** | `PushDeliveryLatencyP99High` |
| **Name** | Push Delivery Latency P99 > 30 seconds |
| **Severity** | Warning (P2) |
| **Condition** | P99 latency exceeds 30 seconds for 5 minutes |
| **Duration** | 5 minutes |
| **SLA** | Investigate within 1 hour |

**PromQL Query**:
```promql
histogram_quantile(0.99, rate(notification_delivery_latency_seconds_bucket{channel="push"}[5m])) > 30
```

**Description**:
99th percentile of push notification delivery is slow. This affects user experience:
- Slow notifications create poor UX
- Users may think notifications aren't working
- May indicate network issues or provider slowness

**Investigation**:
1. Check Firebase Cloud Messaging (FCM) status
2. Review network latency metrics
3. Check application request latency
4. Verify database query performance
5. Check for high concurrent requests

**Runbook**: [DeliveryLatencyIssue](../runbook.md#issue-3-slow-delivery-latency)

**Notification Channels**:
- Slack: #warnings
- Email: Team lead (non-urgent)

---

#### 4. Email Bounce Rate High

| Field | Value |
|-------|-------|
| **ID** | `EmailBounceRateHigh` |
| **Name** | Email Bounce Rate > 10% |
| **Severity** | Critical (P1) |
| **Condition** | Email bounce rate exceeds 10% for 15 minutes |
| **Duration** | 15 minutes |
| **SLA** | Acknowledge within 15 minutes |

**PromQL Query**:
```promql
(
  rate(notification_email_bounces_total[15m])
  /
  rate(notification_delivery_total{channel="email"}[15m])
) > 0.10
```

**Description**:
Significant portion of email notifications are bouncing. Causes:
- Invalid email addresses in database
- Email provider outage (SendGrid, AWS SES)
- Email filtering/spam issues
- Sender reputation issues
- Email domain configuration problems (SPF, DKIM, DMARC)

**Investigation**:
1. Check email provider status
2. Review bounce analytics in SendGrid/SES console
3. Check sender reputation scores
4. Verify email domain DNS records (SPF, DKIM, DMARC)
5. Review bounce logs to identify patterns
6. Check email list quality

**Runbook**: [EmailBounceIssue](../runbook.md#issue-4-high-email-bounce-rate)

**Notification Channels**:
- Slack: #alerts (with @on-call mention)
- PagerDuty: High urgency
- Email: Team lead + Engineer on call

---

### Performance Alerts

#### 5. API Response Time P95 Slow

| Field | Value |
|-------|-------|
| **ID** | `APIResponseTimeP95Slow` |
| **Name** | API Response Time P95 > 1 second |
| **Severity** | Warning (P2) |
| **Condition** | P95 response time exceeds 1 second for 5 minutes |
| **Duration** | 5 minutes |
| **SLA** | Investigate within 30 minutes |

**PromQL Query**:
```promql
histogram_quantile(0.95, rate(notification_api_request_duration_seconds_bucket[5m])) > 1
```

**Description**:
API is responding slowly, impacting user experience. Typical causes:
- Database query performance degradation
- High API request volume
- Memory leaks causing GC pauses
- External service dependencies are slow
- CPU contention

**Investigation**:
1. Check request rate (may be normal at high load)
2. Review slow query logs
3. Check database connection pool status
4. Monitor CPU and memory usage
5. Check for memory leaks (garbage collection pauses)
6. Review application profiling data

**Runbook**: [APIPerformanceDegradation](../runbook.md#issue-5-api-slow)

**Notification Channels**:
- Slack: #warnings

---

### Security & Rate Limiting Alerts

#### 6. Rate Limit Triggered Frequently

| Field | Value |
|-------|-------|
| **ID** | `RateLimitTriggeredFrequently` |
| **Name** | Rate Limit Triggered > 100 times/minute |
| **Severity** | Info (P3) |
| **Condition** | Rate limit triggered more than 100 times per minute |
| **Duration** | 2 minutes |
| **SLA** | Monitor for patterns |

**PromQL Query**:
```promql
rate(notification_rate_limit_triggered_total[1m]) > 100
```

**Description**:
Rate limiting is being triggered frequently. This may indicate:
- Legitimate spike in API usage
- Bot or automated attack
- Client bug causing request loops
- Load test or stress test

**Investigation**:
1. Check if there's a legitimate reason (marketing campaign, bulk operation)
2. Identify the source IPs/users triggering limits
3. Check for patterns in user IDs
4. Review request patterns and timestamps
5. Check if it's a specific endpoint

**Runbook**: [RateLimitingAnalysis](../runbook.md#issue-6-rate-limiting)

**Notification Channels**:
- Slack: #notifications (info only)

---

#### 7. Device Token Invalid Rate High

| Field | Value |
|-------|-------|
| **ID** | `DeviceTokenInvalidRateHigh` |
| **Name** | Device Token Invalid Rate > 20% |
| **Severity** | Warning (P2) |
| **Condition** | More than 20% of device tokens are invalid for 10 minutes |
| **Duration** | 10 minutes |
| **SLA** | Investigate within 1 hour |

**PromQL Query**:
```promql
(
  rate(notification_device_token_invalid_total[10m])
  /
  rate(notification_device_token_attempts_total[10m])
) > 0.20
```

**Description**:
Large percentage of device tokens are invalid. Causes:
- Old tokens haven't been cleaned up from database
- Users uninstalled app without deregistering
- Mobile app certificate expired (iOS)
- Firebase project configuration changed
- Device token revocation patterns

**Investigation**:
1. Check for expired tokens in database (created > 6 months ago)
2. Verify mobile app certificates (iOS)
3. Check Firebase project configuration
4. Review token lifecycle (when created vs. when used)
5. Check if specific user cohort has issues

**Runbook**: [InvalidDeviceTokens](../runbook.md#issue-7-invalid-tokens)

**Notification Channels**:
- Slack: #warnings
- Email: Team lead

---

### Infrastructure Alerts

#### 8. Database Connection Pool Exhausted

| Field | Value |
|-------|-------|
| **ID** | `DatabaseConnectionPoolExhausted` |
| **Name** | Database Connections Used > 90% |
| **Severity** | Critical (P1) |
| **Condition** | Connection pool usage exceeds 90% for 2 minutes |
| **Duration** | 2 minutes |
| **SLA** | Acknowledge immediately |

**PromQL Query**:
```promql
(
  database_connections_used
  /
  database_connections_max
) > 0.90
```

**Description**:
Database connection pool is nearly exhausted. If pool runs out, all database operations will fail:
- Open transaction not being closed
- Slow queries holding connections
- Connection leak in application code
- High request concurrency
- Database performance issues

**Investigation**:
1. Check for open transactions
2. Review slow query logs
3. Check application logs for errors
4. Monitor query execution times
5. Check for connection leaks using pg_stat_activity

**Runbook**: [DatabaseConnectionPoolIssue](../runbook.md#issue-8-connection-pool)

**Notification Channels**:
- Slack: #alerts (with @on-call mention)
- PagerDuty: Urgent
- Email: Team lead + DBA

---

#### 9. Application Memory Usage High

| Field | Value |
|-------|-------|
| **ID** | `ApplicationMemoryUsageHigh` |
| **Name** | Memory Usage > 85% of limit |
| **Severity** | Warning (P2) |
| **Condition** | Application memory exceeds 85% of allocated limit for 5 minutes |
| **Duration** | 5 minutes |
| **SLA** | Investigate within 30 minutes |

**PromQL Query**:
```promql
(
  nodejs_heap_size_used_bytes
  /
  nodejs_heap_size_limit_bytes
) > 0.85
```

**Description**:
Application is using most of its allocated memory. If usage reaches 100%, the application will crash:
- Memory leak in application code
- Large dataset being loaded into memory
- Cache growing unbounded
- Garbage collection inefficiency
- Normal high load

**Investigation**:
1. Check memory trend (is it growing continuously?)
2. Review heap snapshots to find leaks
3. Monitor garbage collection metrics
4. Check for unbounded caches
5. Profile the application

**Runbook**: [MemoryLeakInvestigation](../runbook.md#issue-9-memory-leak)

**Notification Channels**:
- Slack: #warnings
- Email: Team lead

---

#### 10. Service Pod Restart Rate High

| Field | Value |
|-------|-------|
| **ID** | `ServicePodRestartRateHigh` |
| **Name** | Pod Restart Rate > 1 per hour |
| **Severity** | Warning (P2) |
| **Condition** | More than 1 pod restart per hour |
| **Duration** | 1 hour |
| **SLA** | Investigate within 1 hour |

**PromQL Query**:
```promql
rate(kube_pod_container_status_restarts_total{pod=~"notification-.*"}[1h]) > 0.016
```

**Description**:
Pods are restarting frequently. Each restart loses in-flight requests:
- Application crashing (likely OOMKilled)
- Liveness probe failure
- Deployment issues
- Infrastructure problems

**Investigation**:
1. Check pod restart reason (OOMKilled, CrashLoopBackOff, etc.)
2. Check application logs for crash messages
3. Review recent deployments
4. Check cluster events
5. Monitor CPU and memory of pods

**Runbook**: [PodRestartLoop](../runbook.md#issue-10-pod-restarts)

**Notification Channels**:
- Slack: #warnings
- Email: DevOps team + Team lead

---

---

## Alert Groups

### Group 1: Delivery Alerts

These alerts indicate problems with actual notification delivery to users.

```yaml
group: delivery
alerts:
  - NotificationDeliveryFailureRateHigh
  - NotificationQueueBacklogCritical
  - PushDeliveryLatencyP99High
  - EmailBounceRateHigh
severity: Critical to Warning
business_impact: Direct impact on user notifications
response_time: 15-30 minutes
```

**Investigation Checklist**:
- [ ] Check external service status pages
- [ ] Review application error logs
- [ ] Check database connectivity
- [ ] Verify user notification preferences
- [ ] Test manual notification delivery

---

### Group 2: Performance Alerts

These alerts indicate the system is running slowly.

```yaml
group: performance
alerts:
  - APIResponseTimeP95Slow
  - PushDeliveryLatencyP99High
  - NotificationQueueBacklogCritical
severity: Warning
business_impact: Degraded user experience
response_time: 30 minutes to 1 hour
```

**Investigation Checklist**:
- [ ] Check request volume (is this normal load?)
- [ ] Review slow query logs
- [ ] Check resource utilization (CPU, memory)
- [ ] Monitor external service performance
- [ ] Check garbage collection metrics

---

### Group 3: Security & Rate Limiting Alerts

These alerts indicate potential security issues or rate limiting events.

```yaml
group: security
alerts:
  - RateLimitTriggeredFrequently
  - DeviceTokenInvalidRateHigh
  - UnusualAPIAccessPattern (future)
severity: Info to Warning
business_impact: Potential abuse or misuse
response_time: As time permits
```

**Investigation Checklist**:
- [ ] Identify source of requests (IPs, user IDs)
- [ ] Check for patterns (time, endpoint, geography)
- [ ] Review user activity for legitimacy
- [ ] Check for bot/crawler activity
- [ ] Review security logs

---

### Group 4: Infrastructure Alerts

These alerts indicate problems with the underlying infrastructure.

```yaml
group: infrastructure
alerts:
  - DatabaseConnectionPoolExhausted
  - ApplicationMemoryUsageHigh
  - ServicePodRestartRateHigh
severity: Critical to Warning
business_impact: Potential service outage
response_time: 15 minutes to 1 hour
```

**Investigation Checklist**:
- [ ] Check resource utilization (CPU, memory, disk)
- [ ] Review application logs
- [ ] Check database health
- [ ] Monitor pod events
- [ ] Review recent deployments

---

---

## Prometheus Alert Rules

Save as `/monitoring/prometheus/notification-alerts.yaml` and include in your Prometheus configuration.

```yaml
# Notification System Alert Rules
# Version: 1.0
# Last Updated: December 2, 2025

groups:
  - name: notification_delivery
    interval: 30s
    rules:
      # Alert 1: High delivery failure rate
      - alert: NotificationDeliveryFailureRateHigh
        expr: |
          (
            rate(notification_delivery_failures_total[5m])
            /
            rate(notification_delivery_total[5m])
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          group: delivery
          service: notification
        annotations:
          summary: "High notification delivery failure rate"
          description: "Notification delivery failure rate is {{ $value | humanizePercentage }} (threshold: 5%)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-1"
          dashboard_url: "https://grafana.massava.com/d/notification-delivery"
          owner: "notification-team"

      # Alert 2: Queue backlog accumulating
      - alert: NotificationQueueBacklogCritical
        expr: notification_queue_backlog > 1000
        for: 10m
        labels:
          severity: warning
          group: delivery
          service: notification
        annotations:
          summary: "Notification queue backlog critical"
          description: "Queue backlog is {{ $value }} messages (threshold: 1000)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-2"
          dashboard_url: "https://grafana.massava.com/d/notification-queue"
          owner: "notification-team"

      # Alert 3: Push delivery latency high
      - alert: PushDeliveryLatencyP99High
        expr: |
          histogram_quantile(
            0.99,
            rate(notification_delivery_latency_seconds_bucket{channel="push"}[5m])
          ) > 30
        for: 5m
        labels:
          severity: warning
          group: performance
          service: notification
        annotations:
          summary: "Push notification delivery latency high"
          description: "P99 delivery latency is {{ $value | humanizeDuration }} (threshold: 30s)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-3"
          dashboard_url: "https://grafana.massava.com/d/notification-latency"
          owner: "notification-team"

      # Alert 4: Email bounce rate high
      - alert: EmailBounceRateHigh
        expr: |
          (
            rate(notification_email_bounces_total[15m])
            /
            rate(notification_delivery_total{channel="email"}[15m])
          ) > 0.10
        for: 15m
        labels:
          severity: critical
          group: delivery
          service: notification
        annotations:
          summary: "High email bounce rate"
          description: "Email bounce rate is {{ $value | humanizePercentage }} (threshold: 10%)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-4"
          dashboard_url: "https://grafana.massava.com/d/notification-email"
          owner: "notification-team"

  - name: notification_performance
    interval: 30s
    rules:
      # Alert 5: API response time slow
      - alert: APIResponseTimeP95Slow
        expr: |
          histogram_quantile(
            0.95,
            rate(notification_api_request_duration_seconds_bucket[5m])
          ) > 1
        for: 5m
        labels:
          severity: warning
          group: performance
          service: notification
        annotations:
          summary: "API response time slow"
          description: "P95 response time is {{ $value | humanizeDuration }} (threshold: 1s)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-5"
          dashboard_url: "https://grafana.massava.com/d/notification-api"
          owner: "notification-team"

  - name: notification_security
    interval: 30s
    rules:
      # Alert 6: Rate limit triggered frequently
      - alert: RateLimitTriggeredFrequently
        expr: rate(notification_rate_limit_triggered_total[1m]) > 100
        for: 2m
        labels:
          severity: info
          group: security
          service: notification
        annotations:
          summary: "Rate limit triggered frequently"
          description: "Rate limit triggered {{ $value | humanize }} times/minute (threshold: 100)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-6"
          dashboard_url: "https://grafana.massava.com/d/notification-ratelimit"
          owner: "notification-team"

      # Alert 7: Invalid device tokens
      - alert: DeviceTokenInvalidRateHigh
        expr: |
          (
            rate(notification_device_token_invalid_total[10m])
            /
            rate(notification_device_token_attempts_total[10m])
          ) > 0.20
        for: 10m
        labels:
          severity: warning
          group: security
          service: notification
        annotations:
          summary: "High device token invalid rate"
          description: "Invalid token rate is {{ $value | humanizePercentage }} (threshold: 20%)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-7"
          dashboard_url: "https://grafana.massava.com/d/notification-devices"
          owner: "notification-team"

  - name: notification_infrastructure
    interval: 30s
    rules:
      # Alert 8: Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          (
            database_connections_used{service="notification"}
            /
            database_connections_max{service="notification"}
          ) > 0.90
        for: 2m
        labels:
          severity: critical
          group: infrastructure
          service: notification
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Connection pool usage is {{ $value | humanizePercentage }} (threshold: 90%)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-8"
          dashboard_url: "https://grafana.massava.com/d/database-connections"
          owner: "platform-team"

      # Alert 9: High memory usage
      - alert: ApplicationMemoryUsageHigh
        expr: |
          (
            nodejs_heap_size_used_bytes{job="notification-service"}
            /
            nodejs_heap_size_limit_bytes{job="notification-service"}
          ) > 0.85
        for: 5m
        labels:
          severity: warning
          group: infrastructure
          service: notification
        annotations:
          summary: "Application memory usage high"
          description: "Memory usage is {{ $value | humanizePercentage }} (threshold: 85%)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-9"
          dashboard_url: "https://grafana.massava.com/d/notification-memory"
          owner: "notification-team"

      # Alert 10: Pod restart rate high
      - alert: ServicePodRestartRateHigh
        expr: |
          rate(kube_pod_container_status_restarts_total{pod=~"notification-.*"}[1h]) > 0.016
        for: 1h
        labels:
          severity: warning
          group: infrastructure
          service: notification
        annotations:
          summary: "Service pod restart rate high"
          description: "Pod restart rate is {{ $value | humanize }} restarts/hour (threshold: 1/hour)"
          runbook_url: "https://docs.massava.com/notifications/runbook#issue-10"
          dashboard_url: "https://grafana.massava.com/d/pods"
          owner: "platform-team"

  - name: notification_recording_rules
    interval: 1m
    rules:
      # Recording rule: Delivery success rate
      - record: notification:delivery:success_rate
        expr: |
          (
            rate(notification_delivery_total[5m])
            -
            rate(notification_delivery_failures_total[5m])
          ) / rate(notification_delivery_total[5m])

      # Recording rule: Average delivery latency by channel
      - record: notification:delivery:latency_avg:by_channel
        expr: |
          avg by (channel) (
            rate(notification_delivery_latency_seconds_sum[5m])
            /
            rate(notification_delivery_latency_seconds_count[5m])
          )

      # Recording rule: API error rate
      - record: notification:api:error_rate
        expr: |
          rate(notification_api_errors_total[5m])
          /
          rate(notification_api_requests_total[5m])

      # Recording rule: Queue processing time
      - record: notification:queue:processing_time_avg
        expr: |
          rate(notification_queue_processing_time_seconds_sum[5m])
          /
          rate(notification_queue_processing_time_seconds_count[5m])
```

---

## Grafana Dashboard

Save as `/monitoring/grafana/notification-dashboard.json` and import into Grafana.

```json
{
  "dashboard": {
    "title": "Notification System - Monitoring Dashboard",
    "description": "Real-time monitoring of the notification delivery system",
    "tags": ["notifications", "monitoring", "production"],
    "timezone": "UTC",
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Delivery Success Rate (5m)",
        "type": "stat",
        "targets": [
          {
            "expr": "notification:delivery:success_rate * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 95},
                {"color": "green", "value": 99}
              ]
            },
            "decimals": 2
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Queue Backlog",
        "type": "graph",
        "targets": [
          {
            "expr": "notification_queue_backlog",
            "legendFormat": "Backlog"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Delivery Latency (P50, P95, P99)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(notification_delivery_latency_seconds_bucket[5m]))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(notification_delivery_latency_seconds_bucket[5m]))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(notification_delivery_latency_seconds_bucket[5m]))",
            "legendFormat": "P99"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Failure Rate by Type",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(notification_delivery_failures_total[5m]) by (type)",
            "legendFormat": "{{ type }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
      },
      {
        "id": 5,
        "title": "Email Bounce Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "(rate(notification_email_bounces_total[15m]) / rate(notification_delivery_total{channel='email'}[15m])) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 5},
                {"color": "red", "value": 10}
              ]
            },
            "decimals": 2
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 24}
      },
      {
        "id": 6,
        "title": "API Response Time (P95)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(notification_api_request_duration_seconds_bucket[5m]))"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 0.5},
                {"color": "red", "value": 1}
              ]
            },
            "decimals": 3
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 24}
      },
      {
        "id": 7,
        "title": "Active Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "database_connections_used{service='notification'}"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 24}
      },
      {
        "id": 8,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(nodejs_heap_size_used_bytes{job='notification-service'} / nodejs_heap_size_limit_bytes{job='notification-service'}) * 100"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 24}
      },
      {
        "id": 9,
        "title": "Rate Limit Events",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(notification_rate_limit_triggered_total[1m])",
            "legendFormat": "Events/minute"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 32}
      },
      {
        "id": 10,
        "title": "Invalid Device Token Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "(rate(notification_device_token_invalid_total[10m]) / rate(notification_device_token_attempts_total[10m])) * 100"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 32}
      }
    ]
  }
}
```

---

## Alert Routing

Configure in your Alertmanager or PagerDuty integration.

### Slack Routing

```yaml
# alertmanager-config.yaml
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK_URL}'

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  routes:
    # Critical alerts to on-call
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 0s
      repeat_interval: 5m

    # Warnings to team
    - match:
        severity: warning
      receiver: 'warning-alerts'
      group_wait: 30s
      repeat_interval: 30m

    # Info alerts to notifications channel
    - match:
        severity: info
      receiver: 'info-alerts'
      group_wait: 1m
      repeat_interval: 4h

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#notifications'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'critical-alerts'
    slack_configs:
      - channel: '#alerts'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}\nRunbook: {{ .Annotations.runbook_url }}{{ end }}'
    pagerduty_configs:
      - routing_key: '${PAGERDUTY_ROUTING_KEY}'
        description: '{{ .GroupLabels.alertname }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
    email_configs:
      - to: 'oncall@massava.com'
        headers:
          Subject: 'CRITICAL: {{ .GroupLabels.alertname }}'

  - name: 'warning-alerts'
    slack_configs:
      - channel: '#warnings'
        title: 'WARNING: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    email_configs:
      - to: 'team-lead@massava.com'

  - name: 'info-alerts'
    slack_configs:
      - channel: '#notifications'
        title: 'INFO: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## Escalation Procedures

### Critical Alerts (P1) - 15 minute SLA

1. **Minute 0**: Alert fires, sent to Slack #alerts with @on-call mention
2. **Minute 1**: PagerDuty incident created with high urgency
3. **Minute 3**: Email sent to on-call engineer
4. **Minute 5**: Slack reminder in #alerts if not acknowledged
5. **Minute 10**: Escalate to team lead if not acknowledged
6. **Minute 15**: Page on-call director if still not acknowledged

### Warning Alerts (P2) - 30 minute SLA

1. **Minute 0**: Alert fires, sent to Slack #warnings
2. **Minute 5**: Email sent to team lead if not manually resolved
3. **Minute 15**: Slack reminder in #warnings
4. **Minute 30**: Escalate to engineering manager if not resolved

### Info Alerts (P3) - 4 hour SLA

1. **Minute 0**: Alert fires, sent to Slack #notifications
2. **Hour 1**: Team lead reviews trends
3. **Hour 4**: If pattern continues, escalate to warning level investigation

---

## Metrics Reference

### Metric Names & Descriptions

#### Counters (monotonically increasing)

- `notification_delivery_total` - Total delivery attempts
  - Labels: `type`, `channel`, `status`, `service`
  - Example: `notification_delivery_total{type="booking_confirmed", channel="push"}`

- `notification_delivery_failures_total` - Failed delivery attempts
  - Labels: `type`, `channel`, `reason`, `service`
  - Example: `notification_delivery_failures_total{type="booking_confirmed", reason="invalid_token"}`

- `notification_email_bounces_total` - Email bounces
  - Labels: `bounce_type`, `service`
  - Example: `notification_email_bounces_total{bounce_type="permanent"}`

- `notification_rate_limit_triggered_total` - Rate limit violations
  - Labels: `user_id`, `endpoint`, `service`

- `notification_device_token_invalid_total` - Invalid device tokens
  - Labels: `platform`, `reason`, `service`

- `notification_api_requests_total` - API requests
  - Labels: `endpoint`, `method`, `status`, `service`

- `notification_api_errors_total` - API errors
  - Labels: `endpoint`, `error_type`, `service`

#### Gauges (point-in-time values)

- `notification_queue_backlog` - Messages waiting in queue
  - Labels: `queue_name`, `service`
  - Example: `notification_queue_backlog{queue_name="delivery"}`

- `database_connections_used` - Active database connections
  - Labels: `service`, `pool_name`

- `database_connections_max` - Maximum allowed connections
  - Labels: `service`, `pool_name`

- `nodejs_heap_size_used_bytes` - Heap memory in use
  - Labels: `job`, `instance`

- `nodejs_heap_size_limit_bytes` - Maximum heap memory
  - Labels: `job`, `instance`

#### Histograms (distributed measurements)

- `notification_delivery_latency_seconds` - Delivery latency distribution
  - Labels: `channel`, `type`
  - Buckets: 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60
  - Example: `histogram_quantile(0.99, rate(notification_delivery_latency_seconds_bucket[5m]))`

- `notification_queue_processing_time_seconds` - Queue processing time
  - Labels: `queue_name`
  - Buckets: 0.1, 0.5, 1, 5, 10

- `notification_api_request_duration_seconds` - API request duration
  - Labels: `endpoint`, `method`
  - Buckets: 0.01, 0.05, 0.1, 0.5, 1, 5

---

## Implementation Checklist

- [ ] Copy Prometheus alert rules to `/monitoring/prometheus/notification-alerts.yaml`
- [ ] Configure Alertmanager routing in `/monitoring/alertmanager/config.yaml`
- [ ] Import Grafana dashboard JSON
- [ ] Configure Slack webhook URLs
- [ ] Configure PagerDuty integration
- [ ] Configure email recipients
- [ ] Test critical alert path end-to-end
- [ ] Document runbooks for each alert
- [ ] Train team on alert response procedures
- [ ] Set up oncall schedule in PagerDuty
- [ ] Create alert response runbooks
- [ ] Schedule monthly alert drills

---

## Monitoring Best Practices

### Alert Design Principles

1. **Actionable**: Every alert should lead to a clear action
2. **Accurate**: Minimize false positives through proper tuning
3. **Informative**: Include context and links to runbooks
4. **Timely**: Alert before users notice the issue
5. **Scoped**: Alert at the right granularity (not too noisy)

### Tuning Guidelines

- **False Positive Rate Target**: < 1% (99% of alerts require action)
- **Detection Time Target**: < 5 minutes from issue start
- **Mean Time to Resolution Target**: < 30 minutes for critical

### Threshold Tuning

All thresholds should be adjusted based on your environment:

1. Establish baseline metrics over 1-2 weeks
2. Calculate 99th percentile as starting threshold
3. Run fire drills to test alert response
4. Adjust thresholds based on real incidents
5. Document why each threshold was chosen

---

## Related Documentation

- [Runbook](./runbook.md) - Incident response procedures
- [Error Handling](./errors.md) - Error types and handling
- [API Quick Reference](./API_QUICK_REFERENCE.md) - API overview
- [Architecture Overview](./01-architecture-overview.md) - System design

---

**Last Updated**: December 2, 2025
**Version**: 1.0
**Maintained By**: Development Team
**Next Review**: June 2, 2026
