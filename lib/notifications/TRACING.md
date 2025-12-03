# Distributed Tracing for Notification System

## Overview

The notification system implements distributed tracing following the W3C Trace Context specification. This enables end-to-end observability across the entire notification processing pipeline, from creation through delivery.

## Key Features

- **W3C Trace Context Compliance**: Full support for `traceparent` header format
- **Automatic Trace Propagation**: Trace IDs propagate through all processing steps
- **Structured Logging Integration**: All spans automatically logged with trace context
- **Lightweight Design**: Minimal overhead, focused on trace ID propagation
- **OpenTelemetry Ready**: Interface for future OpenTelemetry integration

## Architecture

### Trace Hierarchy

```
notification.create (root span)
├── notification.validate
├── notification.queue
└── notification.process
    ├── notification.channel.push
    ├── notification.channel.email
    └── notification.channel.in_app
        └── notification.retry (if needed)
```

### Trace Context Storage

Trace IDs are stored in notification metadata:
- `_traceId`: W3C trace ID (32 hex characters)
- `_spanId`: Current span ID (16 hex characters)

This allows traces to continue across asynchronous boundaries (queues, retries, etc.).

## Usage

### Creating a Notification with Trace Context

```typescript
import { notificationService } from '@/lib/notifications/notification-service';
import { formatTraceparent } from '@/lib/notifications/tracing';

// From an incoming HTTP request with existing trace
const result = await notificationService.create({
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed',
  body: 'Your booking has been confirmed',
  traceparent: request.headers.get('traceparent'), // Propagate trace
});
```

### Starting a New Trace

```typescript
// Automatically creates root span if no traceparent provided
const result = await notificationService.create({
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed',
  body: 'Your booking has been confirmed',
  // No traceparent = new root trace
});
```

## Span Types

| Span Type | Description | Created By |
|-----------|-------------|------------|
| `notification.create` | Notification creation and validation | `create()` method |
| `notification.validate` | Input validation and user lookup | Internal |
| `notification.queue` | Adding to processing queue | Internal |
| `notification.process` | Processing queued notification | `process()` method |
| `notification.deliver` | Delivery orchestration | Internal |
| `notification.channel.push` | Push notification delivery | `deliverPush()` |
| `notification.channel.email` | Email notification delivery | `deliverEmail()` |
| `notification.channel.in_app` | In-app notification delivery | `deliverInApp()` |
| `notification.retry` | Retry scheduling | `scheduleRetry()` |

## Span Attributes

All spans include these standard attributes:

```typescript
{
  'user.id': string,              // User being notified
  'notification.id': string,      // Notification ID
  'notification.type': string,    // Type (e.g., BOOKING_CONFIRMED)
  'notification.priority': string, // Priority level
  'notification.channel': string, // Delivery channel (for delivery spans)
  'notification.retry_attempt': number, // Retry attempt number
  'status': string,               // Final status
  'error': boolean,               // Error flag
  'error.message': string,        // Error message if failed
  'error.type': string,           // Error type
}
```

## Logging Integration

All spans are automatically logged to the structured logging system with trace context:

```json
{
  "timestamp": "2025-12-02T19:30:00.000Z",
  "level": "info",
  "message": "Span started: Create Notification",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "parentSpanId": null,
  "spanType": "notification.create",
  "spanName": "Create Notification",
  "user.id": "user-123",
  "notification.type": "BOOKING_CONFIRMED",
  "notification.priority": "NORMAL"
}
```

### Span Lifecycle Logs

Each span generates two log entries:
1. **Span Started**: When span begins
2. **Span Completed**: When span ends (with duration and status)

## W3C Trace Context Format

### traceparent Header

Format: `{version}-{trace-id}-{parent-id}-{trace-flags}`

Example:
```
00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

- **version**: Always `00` (current version)
- **trace-id**: 32 hex characters (16 bytes)
- **parent-id**: 16 hex characters (8 bytes) - parent span ID
- **trace-flags**: 2 hex characters - `01` = sampled, `00` = not sampled

### Propagating Traces Across Services

```typescript
import { formatTraceparent } from '@/lib/notifications/tracing';

// In service A: Extract trace context from span
const traceparent = formatTraceparent(span.context);

// In service B: Continue trace
const result = await notificationService.create({
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  traceparent: traceparent, // Continue the trace
});
```

## Manual Span Creation

For advanced use cases, you can create spans manually:

```typescript
import {
  createRootSpan,
  createChildSpan,
  endSpan,
  addSpanAttributes,
  logSpanStart,
  logSpanEnd,
} from '@/lib/notifications/tracing';

// Create root span
const rootSpan = createRootSpan(
  'notification.custom',
  'Custom Operation',
  {
    'user.id': 'user-123',
    'custom.attribute': 'value',
  }
);

logSpanStart(rootSpan);

try {
  // Your operation here

  // Create child span
  const childSpan = createChildSpan(
    rootSpan,
    'notification.custom.child',
    'Child Operation'
  );

  logSpanStart(childSpan);

  // Child operation

  const finishedChild = endSpan(childSpan, 'ok');
  logSpanEnd(finishedChild);

  // End root span
  const finishedRoot = endSpan(
    addSpanAttributes(rootSpan, { result: 'success' }),
    'ok'
  );
  logSpanEnd(finishedRoot);

} catch (error) {
  const finishedSpan = endSpan(rootSpan, 'error', {
    message: error.message,
    type: 'CUSTOM_ERROR',
  });
  logSpanEnd(finishedSpan);
}
```

## OpenTelemetry Integration

The tracing system provides an interface for OpenTelemetry integration:

```typescript
import { TraceExporter, BatchTraceExporter, type Span } from '@/lib/notifications/tracing';

// Implement OpenTelemetry exporter
class OtelExporter implements TraceExporter {
  async export(span: Span): Promise<void> {
    // Convert span to OpenTelemetry format
    const otelSpan = this.convertToOtelSpan(span);

    // Send to OpenTelemetry collector
    await this.sendToCollector(otelSpan);
  }

  private convertToOtelSpan(span: Span) {
    // Conversion logic
  }

  private async sendToCollector(otelSpan: any) {
    // Send to collector
  }
}

// Use batch exporter for efficiency
const exporter = new BatchTraceExporter(new OtelExporter(), {
  maxBatchSize: 100,
  flushInterval: 5000, // 5 seconds
});

// Export spans
exporter.add(span);

// Shutdown (flushes remaining spans)
await exporter.shutdown();
```

## Development Mode

In development mode, traces are also exported to console:

```typescript
import { exportSpanToConsole } from '@/lib/notifications/tracing';

// Automatically called in development mode
exportSpanToConsole(span);
```

Console output:
```json
[TRACE] {
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "parent_span_id": null,
  "span_type": "notification.create",
  "span_name": "Create Notification",
  "start_time": "2025-12-02T19:30:00.000Z",
  "end_time": "2025-12-02T19:30:01.234Z",
  "duration_ms": 1234,
  "status": "ok",
  "attributes": {
    "user.id": "user-123",
    "notification.id": "notif-123",
    "notification.type": "BOOKING_CONFIRMED"
  },
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
}
```

## Querying Traces

### Finding All Spans for a Trace

```typescript
// In logs, filter by traceId
const spans = logs.filter(log => log.traceId === '4bf92f3577b34da6a3ce929d0e0e4736');

// Sort by timestamp to see span sequence
spans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
```

### Finding Failed Spans

```typescript
// Filter by error status
const failedSpans = logs.filter(log =>
  log.traceId === '4bf92f3577b34da6a3ce929d0e0e4736' &&
  log.status === 'error'
);
```

### Calculating Total Trace Duration

```typescript
const rootSpan = spans.find(s => !s.parentSpanId);
if (rootSpan && rootSpan.duration) {
  console.log(`Total duration: ${rootSpan.duration}ms`);
}
```

## Performance Impact

The tracing system is designed to be lightweight:

- **Trace ID generation**: ~0.1ms (uses crypto.randomBytes)
- **Span creation**: ~0.01ms (in-memory objects)
- **Logging**: ~1-5ms (depends on logger configuration)
- **Metadata storage**: ~50 bytes per notification (trace + span IDs)

Total overhead: **~5-10ms per notification** (mostly logging)

## Best Practices

### 1. Always Propagate Trace Context

```typescript
// ✅ Good: Propagate trace from HTTP request
const traceparent = request.headers.get('traceparent');
await notificationService.create({ ...input, traceparent });

// ❌ Bad: Start new trace for every notification
await notificationService.create(input); // Breaks trace continuity
```

### 2. Add Meaningful Attributes

```typescript
// ✅ Good: Add context-specific attributes
const span = addSpanAttributes(span, {
  'booking.id': booking.id,
  'booking.price': booking.price,
  'studio.id': studio.id,
});

// ❌ Bad: No additional context
const span = endSpan(span, 'ok');
```

### 3. Always End Spans

```typescript
// ✅ Good: End span in finally block
try {
  // Operation
} finally {
  const finishedSpan = endSpan(span, 'ok');
  logSpanEnd(finishedSpan);
}

// ❌ Bad: Span never ends
// (Memory leak + incomplete traces)
```

### 4. Use Structured Logging

```typescript
// ✅ Good: Include trace context in logs
logger.info('Processing notification', {
  traceId: getTraceId(span),
  spanId: span.context.spanId,
  notificationId: notification.id,
});

// ❌ Bad: No trace context
logger.info('Processing notification'); // Can't correlate with trace
```

## Troubleshooting

### Trace IDs Not Propagating

**Problem**: Trace IDs change between create and process steps.

**Solution**: Check that metadata includes `_traceId` and `_spanId`:
```typescript
const metadata = parseMetadata(notification.metadata);
console.log('Trace ID:', metadata._traceId);
console.log('Span ID:', metadata._spanId);
```

### Missing Spans in Logs

**Problem**: Some spans not appearing in logs.

**Solution**: Ensure `logSpanStart()` and `logSpanEnd()` are called:
```typescript
logSpanStart(span);
try {
  // Operation
  const finishedSpan = endSpan(span, 'ok');
  logSpanEnd(finishedSpan); // ← Must call this
} catch (error) {
  const finishedSpan = endSpan(span, 'error', { ... });
  logSpanEnd(finishedSpan); // ← And this
}
```

### Invalid traceparent Headers

**Problem**: `parseTraceparent()` returns null.

**Solution**: Validate traceparent format:
```typescript
const parsed = parseTraceparent(traceparent);
if (!parsed) {
  logger.warn('Invalid traceparent header', { traceparent });
  // Start new trace instead
}
```

## Future Enhancements

### Planned Features

1. **Sampling**: Configurable trace sampling (e.g., sample 10% of traces)
2. **Trace Storage**: Store traces in database for historical analysis
3. **Trace Visualization**: UI for visualizing trace spans
4. **Correlation with Metrics**: Link traces to Prometheus metrics
5. **SLA Tracking**: Track SLA compliance per trace

### OpenTelemetry Integration

Future integration with OpenTelemetry will provide:
- Automatic span export to Jaeger/Zipkin
- Distributed context propagation (baggage)
- Trace sampling strategies
- Trace correlation with metrics and logs

## References

- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Distributed Tracing Best Practices](https://opentelemetry.io/docs/concepts/signals/traces/)

## Support

For questions or issues with tracing:
1. Check logs for trace IDs: `grep traceId logs/app.log`
2. Validate traceparent headers: Use `parseTraceparent()` utility
3. Review span hierarchy in logs: Sort by timestamp and trace ID
4. Contact DevOps team for OpenTelemetry integration

---

**Last Updated**: 2025-12-02
**Maintained By**: Backend Team
