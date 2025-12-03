# Notification System Alerting - Complete Index

**Version**: 1.0
**Last Updated**: December 2, 2025
**Created**: December 2, 2025

Complete index of all alerting documentation and configuration for the Massava notification system.

## Overview

The notification system includes comprehensive alerting configuration for:
- **10 Alert Rules** covering delivery, performance, security, and infrastructure
- **6 Recording Rules** for efficient dashboard queries
- **3-tier Routing** (Critical, Warning, Info)
- **Multi-channel Notifications** (Slack, PagerDuty, Email)
- **Grafana Dashboard** with 14 visualization panels
- **Runbooks** for incident response

---

## Files Overview

### Documentation Files

#### 1. Main Alerting Documentation
**File**: `/docs/notifications/alerting.md` (36 KB)

Complete alerting documentation including:
- Alert definitions (10 alerts with descriptions, thresholds, runbooks)
- Alert grouping by category
- Prometheus alert rules (YAML)
- Grafana dashboard JSON
- Alert routing configuration
- Escalation procedures
- Metrics reference

**Key Sections**:
- Overview of 4-tier alerting strategy
- Detailed alert definitions (Delivery, Performance, Security, Infrastructure)
- Alert groups and investigation procedures
- Notification channels by severity
- Metrics reference (counters, gauges, histograms)

#### 2. Setup & Implementation Guide
**File**: `/monitoring/NOTIFICATION_ALERTING_SETUP.md` (11 KB)

Quick start guide for implementing alerting:
- 5-minute quick start
- File reference table
- Alert configuration summary
- Testing checklist
- Customization guide
- Troubleshooting procedures
- Dashboard features overview
- Escalation procedures

**Use This When**: You need to set up alerting from scratch or troubleshoot issues

### Configuration Files

#### 3. Prometheus Alert Rules
**File**: `/monitoring/prometheus/notification-alerts.yaml` (18 KB)

Prometheus alert rules ready to use:
- 10 Alert rules with complete annotations
- 6 Recording rules for efficiency
- Groups: delivery, performance, security, infrastructure
- Each alert includes:
  - Expression (PromQL query)
  - Evaluation period
  - Labels (severity, group, service)
  - Full annotations (summary, description, runbook, dashboard)

**Copy To**: `/etc/prometheus/rules/notification-alerts.yaml`

**Load In**: `prometheus.yml` rule_files section

#### 4. Alertmanager Routing Configuration
**File**: `/monitoring/alertmanager/notification-routing.yaml` (12 KB)

Alert routing and notification configuration:
- Route definitions by severity
- Receiver definitions (Slack, PagerDuty, Email)
- Environment variable templates
- Inhibition rules to prevent duplicate alerts
- Implementation checklist
- Testing instructions

**Copy To**: `/etc/alertmanager/rules/notification-routing.yaml`

**Requires Environment Variables**:
- SLACK_WEBHOOK_URL
- PAGERDUTY_ROUTING_KEY
- ONCALL_EMAIL
- TEAM_LEAD_EMAIL
- SENDGRID_API_KEY

#### 5. Grafana Dashboard
**File**: `/monitoring/grafana/notification-dashboard.json` (26 KB)

Pre-built Grafana dashboard with:
- 14 visualization panels
- Key metrics (success rate, bounce rate, response time)
- Trend analysis (latency distribution, failure patterns)
- Infrastructure monitoring (connections, memory, request rate)
- Alert status visualization
- Ready-to-import JSON format

**Import To**: Grafana → Dashboards → Import

**Includes Panels**:
1. Delivery Success Rate (gauge)
2. Queue Backlog (timeseries)
3. Email Bounce Rate (gauge)
4. API Response Time P95 (gauge)
5. Delivery Latency P50/P95/P99 (timeseries)
6. Failure Rate by Type (timeseries)
7. Latency by Channel (timeseries)
8. API Error Rate (timeseries)
9. Database Connections (timeseries)
10. Memory Usage (gauge)
11. Rate Limit Events (timeseries)
12. Invalid Device Tokens (timeseries)
13. Queue Processing Time (timeseries)
14. API Request Rate (timeseries)

---

## Alert Definitions Summary

### Delivery Alerts (Critical for User Experience)

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| NotificationDeliveryFailureRateHigh | > 5% | 5 min | Critical |
| NotificationQueueBacklogCritical | > 1000 msgs | 10 min | Warning |
| PushDeliveryLatencyP99High | > 30s | 5 min | Warning |
| EmailBounceRateHigh | > 10% | 15 min | Critical |

### Performance Alerts (User Experience Impact)

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| APIResponseTimeP95Slow | > 1s | 5 min | Warning |
| APIErrorRateHigh | > 5% | 5 min | Warning |

### Security Alerts (Potential Abuse)

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| RateLimitTriggeredFrequently | > 100/min | 2 min | Info |
| DeviceTokenInvalidRateHigh | > 20% | 10 min | Warning |

### Infrastructure Alerts (System Stability)

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| DatabaseConnectionPoolExhausted | > 90% | 2 min | Critical |
| ApplicationMemoryUsageHigh | > 85% | 5 min | Warning |
| ServicePodRestartRateHigh | > 1/hour | 1 hour | Warning |

---

## Notification Channels

### Alert Routing by Severity

```
CRITICAL (P1) → Slack #alerts + PagerDuty + Email + @on-call
              → SLA: 15 minutes

WARNING (P2)  → Slack #warnings + Email
              → SLA: 30 minutes

INFO (P3)     → Slack #notifications
              → SLA: 4 hours
```

### Slack Channels
- **#alerts** - Critical severity alerts
- **#warnings** - Warning severity alerts
- **#notifications** - Info severity alerts
- **#debug** - Debug metrics (optional)

### Escalation Procedure

**Critical Alerts**:
1. T+0m: Fire → Slack
2. T+1m: PagerDuty incident
3. T+3m: Email
4. T+5m: Slack reminder
5. T+10m: Escalate to team lead
6. T+15m: Escalate to director

**Warning Alerts**:
1. T+0m: Fire → Slack
2. T+5m: Email to team lead
3. T+15m: Slack reminder
4. T+30m: Escalate to manager

**Info Alerts**:
1. T+0m: Fire → Slack
2. Monitor for patterns

---

## Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Copy configuration files to appropriate directories
- [ ] Set environment variables (Slack, PagerDuty, Email)
- [ ] Update Prometheus configuration
- [ ] Update Alertmanager configuration
- [ ] Reload services (no downtime)
- [ ] Import Grafana dashboard

### Phase 2: Testing (Day 2-3)
- [ ] Test Slack webhook connectivity
- [ ] Test PagerDuty integration
- [ ] Test email notifications
- [ ] Create temporary test alert
- [ ] Verify all notification channels
- [ ] Test runbook links

### Phase 3: Training (Day 4-5)
- [ ] Review alert definitions with team
- [ ] Document runbook procedures
- [ ] Schedule alert response training
- [ ] Set up PagerDuty on-call rotation
- [ ] Create notification channel access list

### Phase 4: Tuning (Ongoing)
- [ ] Monitor false positive rate
- [ ] Adjust thresholds based on baseline
- [ ] Track mean time to detection (MTTD)
- [ ] Track mean time to resolution (MTTR)
- [ ] Monthly review and adjustment

---

## Quick Reference Tables

### Metrics Being Monitored

**Delivery Metrics**:
- `notification_delivery_total` - Total deliveries
- `notification_delivery_failures_total` - Failures
- `notification_delivery_latency_seconds` - Latency distribution
- `notification_email_bounces_total` - Email bounces
- `notification_queue_backlog` - Queue depth

**API Metrics**:
- `notification_api_requests_total` - Request count
- `notification_api_errors_total` - Error count
- `notification_api_request_duration_seconds` - Response time

**Device Metrics**:
- `notification_device_token_invalid_total` - Invalid tokens
- `notification_device_token_attempts_total` - Token attempts

**System Metrics**:
- `database_connections_used` - Active connections
- `database_connections_max` - Pool size
- `nodejs_heap_size_used_bytes` - Heap memory
- `nodejs_heap_size_limit_bytes` - Max memory

### Recording Rules (Efficient Queries)

| Rule | Expression | Use Case |
|------|-----------|----------|
| `notification:delivery:success_rate` | Success % | Dashboard gauge |
| `notification:delivery:latency_avg:by_channel` | Avg latency | Performance dashboard |
| `notification:api:error_rate` | Error % | Health monitoring |
| `notification:queue:processing_time_avg` | Queue time | Efficiency tracking |
| `notification:delivery:latency_p99:by_channel` | P99 latency | SLA monitoring |
| `notification:queue:lag` | Consumer lag | Backlog estimation |

---

## Customization Guide

### Change Alert Threshold

Edit `/monitoring/prometheus/notification-alerts.yaml`:

```yaml
# Example: Change delivery failure threshold
expr: |
  (
    rate(notification_delivery_failures_total[5m])
    /
    rate(notification_delivery_total[5m])
  ) > 0.10  # Changed from 0.05
```

### Change Notification Channel

Edit `/monitoring/alertmanager/notification-routing.yaml`:

```yaml
slack_configs:
  - channel: '#your-channel'  # Changed from #warnings
```

### Add Custom Alert

1. Add new alert rule to `notification-alerts.yaml`
2. Include proper labels and annotations
3. Reload Prometheus
4. Verify in Prometheus UI

### Adjust Alert Duration

```yaml
for: 10m  # Changed from 5m - requires longer trigger time
```

---

## Troubleshooting Quick Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Alert not firing | Metric not scraped | Check Prometheus targets |
| Alert fires but no notification | Alertmanager config error | Check logs, reload config |
| Too many false alerts | Threshold too sensitive | Increase threshold or duration |
| Missing important alerts | Insufficient coverage | Add new alert rule |
| Slack not working | Invalid webhook URL | Verify SLACK_WEBHOOK_URL |
| PagerDuty not working | Invalid routing key | Verify PAGERDUTY_ROUTING_KEY |
| Email not working | Incorrect SMTP settings | Verify email configuration |

See `/monitoring/NOTIFICATION_ALERTING_SETUP.md` for detailed troubleshooting.

---

## Related Documentation

### Core Notification Documentation
- [Architecture Overview](./01-architecture-overview.md) - System design
- [Backend Services](./03-backend-services.md) - Service implementations
- [Push Notifications](./04-push-notifications.md) - Push configuration
- [Testing Strategy](./07-testing-strategy.md) - Test approach

### Operational Documentation
- [Runbook](./runbook.md) - Incident response procedures
- [Error Handling](./errors.md) - Error types and handling
- [Rate Limiting](./RATE_LIMITING_IMPLEMENTATION.md) - Rate limit details
- [Type Safety](./TYPE_SAFETY_IMPROVEMENTS.md) - Type safety patterns

### API Documentation
- [API Quick Reference](./API_QUICK_REFERENCE.md) - API overview
- [API Examples](./API_EXAMPLES.md) - Code examples
- [OpenAPI Spec](./openapi.yaml) - Complete specification
- [Swagger Integration](./SWAGGER_INTEGRATION.md) - Swagger setup

---

## Performance Characteristics

### Alert Latency (Fire to Notification)
- **Critical**: 30-60 seconds (alert evaluation + 0s group wait)
- **Warning**: 30-90 seconds (alert evaluation + 30s group wait)
- **Info**: 1-2 minutes (alert evaluation + 1m group wait)

### Notification Volume
- **Critical**: Repeat every 5 minutes
- **Warning**: Repeat every 30 minutes
- **Info**: Repeat every 4 hours

### False Positive Target
- **Goal**: < 1% false positives (99% actionable)
- **Method**: Regular tuning and threshold adjustment

---

## Metrics & KPIs

Track these metrics for alerting system health:

| Metric | Target | Frequency |
|--------|--------|-----------|
| Alert Detection Time (MTTD) | < 5 min | Real-time |
| Mean Time to Resolution (MTTR) | < 30 min (critical) | Monthly |
| False Positive Rate | < 1% | Weekly |
| Alert SLA Compliance | > 95% | Weekly |
| On-call Response Time | < 5 min (critical) | Monthly |
| Dashboard Load Time | < 2 sec | Weekly |

---

## Maintenance Schedule

### Daily
- Monitor alert queue in Alertmanager
- Check Slack #alerts and #warnings channels
- Verify Grafana dashboard loads quickly

### Weekly
- Review false positive rate
- Check metrics scrape success
- Monitor MTTD and MTTR

### Monthly
- Run alert drill exercises
- Review and adjust thresholds
- Update runbooks based on incidents
- Check alert rule coverage

### Quarterly
- Full alerting system audit
- Update documentation
- Review escalation procedures
- Plan improvements

---

## Contacts & Escalation

**Notification System Owner**: notification-team

**On-Call Engineer**: See PagerDuty schedule

**Team Lead**: teamlead@massava.com

**Escalation Path**:
1. On-call engineer (first 15 min)
2. Team lead (after 15 min)
3. Engineering manager (after 30 min)
4. Director (after 1 hour)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2, 2025 | Initial release with 10 alerts and 6 recording rules |

---

## Getting Started

### For New Team Members

1. **Read**: [Setup Guide](./NOTIFICATION_ALERTING_SETUP.md) (5 min)
2. **Read**: [Alert Definitions](./alerting.md#alert-definitions) (10 min)
3. **Access**: Grafana dashboard (https://grafana.massava.com)
4. **Review**: Relevant runbook for your area
5. **Ask**: Questions in #notifications Slack channel

### For Operations

1. **Review**: [Troubleshooting Guide](./NOTIFICATION_ALERTING_SETUP.md#troubleshooting)
2. **Check**: [Implementation Checklist](./NOTIFICATION_ALERTING_SETUP.md#testing-checklist)
3. **Monitor**: [Key Metrics](./alerting.md#metrics-reference)
4. **Escalate**: Per procedures in routing configuration

### For Developers

1. **Add Metrics**: Follow metric naming conventions
2. **Create Alerts**: Use existing alerts as templates
3. **Test**: Use Prometheus UI to verify queries
4. **Document**: Include runbook for new alerts

---

**Last Updated**: December 2, 2025
**Maintained By**: Development Team
**Next Review**: June 2, 2026

For questions or updates, contact the notification team in #notifications Slack channel.
