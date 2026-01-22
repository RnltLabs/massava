# Notification System Alerting Setup Guide

**Version**: 1.0
**Last Updated**: December 2, 2025
**Created**: December 2, 2025

Quick reference for setting up alerting for the notification system.

## Quick Start (5 minutes)

### 1. Copy Configuration Files

```bash
# Copy Prometheus alert rules
cp monitoring/prometheus/notification-alerts.yaml \
   /etc/prometheus/rules/

# Copy Alertmanager routing config
cp monitoring/alertmanager/notification-routing.yaml \
   /etc/alertmanager/rules/

# Copy Grafana dashboard
cp monitoring/grafana/notification-dashboard.json \
   /etc/grafana/provisioning/dashboards/
```

### 2. Configure Environment Variables

Create `.env` file with your configuration:

```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ONCALL_SLACK_USER_ID=U123ABC456

# PagerDuty
PAGERDUTY_ROUTING_KEY=Your-Routing-Key-Here

# Email
ONCALL_EMAIL=oncall@massava.com
TEAM_LEAD_EMAIL=teamlead@massava.com
SENDGRID_API_KEY=SG.xxx
```

### 3. Update Prometheus Configuration

Add to `prometheus.yml`:

```yaml
rule_files:
  - '/etc/prometheus/rules/notification-alerts.yaml'
```

### 4. Update Alertmanager Configuration

Create `alertmanager.yml` or merge with existing:

```yaml
global:
  slack_api_url: '${SLACK_WEBHOOK_URL}'
  resolve_timeout: 5m

route:
  receiver: 'default'
  routes:
    - match:
        service: notification
      include_file: '/etc/alertmanager/rules/notification-routing.yaml'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
```

### 5. Reload Prometheus and Alertmanager

```bash
# Reload Prometheus (no downtime)
curl -X POST http://localhost:9090/-/reload

# Reload Alertmanager (no downtime)
curl -X POST http://localhost:9093/-/reload
```

### 6. Import Grafana Dashboard

1. Open Grafana: `https://grafana.massava.com`
2. Go to Dashboards → Import
3. Upload `/monitoring/grafana/notification-dashboard.json`
4. Select data source: Prometheus
5. Click Import

Done! Alerts are now active.

---

## File Reference

| File | Location | Purpose |
|------|----------|---------|
| `alerting.md` | `/docs/notifications/alerting.md` | Full alerting documentation |
| `notification-alerts.yaml` | `/monitoring/prometheus/notification-alerts.yaml` | Prometheus alert rules (10 alerts) |
| `notification-routing.yaml` | `/monitoring/alertmanager/notification-routing.yaml` | Alert routing and channels |
| `notification-dashboard.json` | `/monitoring/grafana/notification-dashboard.json` | Grafana dashboard (14 panels) |

---

## Alert Configuration Summary

### Delivery Alerts (4)
- **NotificationDeliveryFailureRateHigh** - Failure rate > 5% → Critical
- **NotificationQueueBacklogCritical** - Queue backlog > 1000 → Warning
- **PushDeliveryLatencyP99High** - P99 latency > 30s → Warning
- **EmailBounceRateHigh** - Bounce rate > 10% → Critical

### Performance Alerts (2)
- **APIResponseTimeP95Slow** - P95 response > 1s → Warning
- **APIErrorRateHigh** - Error rate > 5% → Warning

### Security Alerts (2)
- **RateLimitTriggeredFrequently** - > 100/minute → Info
- **DeviceTokenInvalidRateHigh** - Invalid rate > 20% → Warning

### Infrastructure Alerts (2)
- **DatabaseConnectionPoolExhausted** - Usage > 90% → Critical
- **ApplicationMemoryUsageHigh** - Usage > 85% → Warning
- **ServicePodRestartRateHigh** - > 1/hour → Warning

### Recording Rules (6)
Efficient dashboard queries:
- `notification:delivery:success_rate` - Delivery success %
- `notification:delivery:latency_avg:by_channel` - Avg latency
- `notification:api:error_rate` - API error rate
- `notification:queue:processing_time_avg` - Queue processing time
- `notification:delivery:latency_p99:by_channel` - P99 latency
- `notification:queue:lag` - Queue consumer lag

---

## Notification Channels

### By Severity

| Severity | Channels | Escalation | SLA |
|----------|----------|------------|-----|
| Critical | Slack #alerts, PagerDuty, Email, @on-call | On-call after 5 min | 15 min |
| Warning | Slack #warnings, Email | Team lead after 30 min | 1 hour |
| Info | Slack #notifications | None | 4 hours |

### Slack Channels

- **#alerts** - Critical alerts + on-call mentions
- **#warnings** - Warning level alerts
- **#notifications** - Info level alerts
- **#debug** - Debug metrics (if enabled)

---

## Testing Checklist

### Test Connectivity

```bash
# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{"text":"Test message from Prometheus"}'

# Test PagerDuty routing key (requires PagerDuty integration)
# Use their event API to test

# Test email
echo "Test email" | mail -s "Test" oncall@massava.com
```

### Test Alert Firing

1. **Temporarily lower threshold**:
   ```yaml
   - alert: TestAlert
     expr: up{job="notification-service"} == 1  # Always true
     for: 1m
   ```

2. **Reload Prometheus**:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

3. **Wait 1 minute for alert to fire**

4. **Verify notifications**:
   - Check Slack channels
   - Check PagerDuty incidents
   - Check email inbox

5. **Remove test alert and reload**

### Test Runbooks

1. Click "View Runbook" in alert notification
2. Verify documentation loads
3. Follow investigation steps
4. Verify links work

---

## Customization Guide

### Adjust Alert Thresholds

Edit `/monitoring/prometheus/notification-alerts.yaml`:

```yaml
# Example: Change delivery failure threshold from 5% to 10%
expr: |
  (
    rate(notification_delivery_failures_total[5m])
    /
    rate(notification_delivery_total[5m])
  ) > 0.10  # Changed from 0.05
```

### Add Custom Alert

```yaml
- alert: MyCustomAlert
  expr: some_metric > 100
  for: 5m
  labels:
    severity: warning
    group: delivery
    service: notification
  annotations:
    summary: "Custom alert triggered"
    description: "{{ $value }} threshold exceeded"
    runbook_url: "https://docs.massava.com/..."
```

### Change Notification Channel

Edit `/monitoring/alertmanager/notification-routing.yaml`:

```yaml
slack_configs:
  - channel: '#your-custom-channel'  # Change channel
    api_url: '{{ env "SLACK_WEBHOOK_URL" }}'
```

### Add New Receiver

```yaml
receivers:
  - name: 'my-custom-receiver'
    slack_configs:
      - channel: '#my-channel'
    email_configs:
      - to: 'team@example.com'
    webhook_configs:
      - url: 'https://example.com/alerts'
```

---

## Troubleshooting

### Alerts Not Firing

**Symptom**: Alert rule created but not firing

**Solutions**:
1. Verify metric is being scraped:
   ```
   curl http://localhost:9090/api/v1/query?query=notification_delivery_total
   ```

2. Check Prometheus logs:
   ```
   docker logs prometheus
   ```

3. Verify alert expression syntax:
   - Use Prometheus UI to test query
   - Check for typos in metric names

4. Check alert evaluation:
   - Go to `Alerts` tab in Prometheus UI
   - Look for alert status and errors

### Notifications Not Sending

**Symptom**: Alert fires but no Slack/Email

**Solutions**:
1. Check Alertmanager logs:
   ```
   docker logs alertmanager
   ```

2. Verify environment variables:
   ```
   echo $SLACK_WEBHOOK_URL
   echo $ONCALL_EMAIL
   ```

3. Test webhook connectivity:
   ```
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-type: application/json' \
     -d '{"text":"Test"}'
   ```

4. Check Alertmanager config:
   - Reload Alertmanager
   - Check configuration in UI: `http://localhost:9093`

### Too Many False Positives

**Solutions**:
1. Increase alert duration:
   ```yaml
   for: 10m  # Increased from 5m
   ```

2. Increase threshold:
   ```yaml
   > 0.10  # Increased from 0.05
   ```

3. Add additional conditions:
   ```yaml
   expr: |
     metric > threshold
     and
     other_metric > other_threshold
   ```

### Missing Important Alerts

**Solutions**:
1. Lower threshold:
   ```yaml
   > 0.02  # Lowered from 0.05
   ```

2. Decrease evaluation period:
   ```yaml
   for: 2m  # Decreased from 5m
   ```

3. Add alerting for missing scenarios:
   - Review operational incidents
   - Create alerts for root causes

---

## Monitoring the Monitors

Monitor Prometheus and Alertmanager themselves:

```yaml
# Add to notification-alerts.yaml
- alert: PrometheusDown
  expr: up{job="prometheus"} == 0
  for: 5m

- alert: AlertmanagerDown
  expr: up{job="alertmanager"} == 0
  for: 5m

- alert: PrometheusHighMemory
  expr: process_resident_memory_bytes{job="prometheus"} > 2e9
  for: 5m
```

---

## Dashboard Features

The Grafana dashboard includes:

### Key Metrics
- **Delivery Success Rate** - Overall health gauge
- **Queue Backlog** - Processing capacity
- **Email Bounce Rate** - Email delivery health
- **API Response Time** - Performance gauge

### Trends & Patterns
- **Delivery Latency (P50/P95/P99)** - Distribution over time
- **Failure Rate by Type** - Which notifications are failing
- **Latency by Channel** - Push vs Email performance
- **API Error Rate** - API health trend

### Infrastructure
- **Database Connections** - Connection pool usage
- **Memory Usage** - Heap consumption
- **Rate Limit Events** - Security monitoring
- **Invalid Device Tokens** - Device health
- **Queue Processing Time** - Queue efficiency
- **API Request Rate** - Load trends

---

## Escalation Procedures

### Critical Alert (P1) - 15 minute SLA

| Time | Action |
|------|--------|
| T+0m | Alert fires → Slack #alerts with @on-call |
| T+1m | PagerDuty incident created |
| T+3m | Email to on-call engineer |
| T+5m | Slack reminder if unacknowledged |
| T+10m | Escalate to team lead |
| T+15m | Escalate to director |

### Warning Alert (P2) - 30 minute SLA

| Time | Action |
|------|--------|
| T+0m | Alert fires → Slack #warnings |
| T+5m | Email to team lead if not resolved |
| T+15m | Slack reminder |
| T+30m | Escalate to engineering manager |

### Info Alert (P3) - 4 hour SLA

| Time | Action |
|------|--------|
| T+0m | Alert fires → Slack #notifications |
| T+1h | Team lead reviews |
| T+4h | Escalate if pattern continues |

---

## Runbook Format

Each alert has a runbook with:
1. **Symptoms** - What users experience
2. **Root Causes** - Common reasons this alert fires
3. **Investigation Steps** - How to diagnose
4. **Solutions** - How to fix it
5. **Prevention** - How to prevent recurrence

See `/docs/notifications/runbook.md` for detailed runbooks.

---

## Performance Tuning

### Alert Evaluation Latency

**Current settings**:
- Alert evaluation interval: 30s
- Group wait: 0s (critical), 30s (warning), 1m (info)
- **Result**: Alerts fire within 30-60 seconds

**To improve**:
- Reduce evaluation interval to 15s (increases CPU)
- Reduce group wait (more notifications)

### Notification Volume

**Current settings**:
- Critical: repeat every 5m
- Warning: repeat every 30m
- Info: repeat every 4h

**To reduce noise**:
- Increase repeat intervals
- Reduce alert sensitivity
- Add inhibition rules

**To catch more issues**:
- Decrease repeat intervals
- Increase alert sensitivity
- Add more alert rules

---

## Related Documentation

- [Full Alerting Guide](../docs/notifications/alerting.md)
- [Runbook](../docs/notifications/runbook.md)
- [Error Handling](../docs/notifications/errors.md)
- [Architecture](../docs/notifications/01-architecture-overview.md)

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Prometheus/Alertmanager logs
3. Check metric values in Prometheus UI
4. Review runbook for alert
5. Contact on-call engineer

---

**Last Updated**: December 2, 2025
**Maintained By**: Development Team
**Next Review**: June 2, 2026
