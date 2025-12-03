/**
 * Unit tests for distributed tracing system
 */
import {
  generateTraceId,
  generateSpanId,
  parseTraceparent,
  formatTraceparent,
  createRootSpan,
  createChildSpan,
  createNotificationSpan,
  createDeliverySpan,
  createRetrySpan,
  endSpan,
  addSpanAttributes,
  getTraceId,
  getSpanId,
  isSpanEnded,
  createTraceContext,
  spanToLogContext,
} from '@/lib/notifications/tracing';

describe('Distributed Tracing - Trace ID Generation', () => {
  it('should generate valid trace IDs (32 hex characters)', () => {
    const traceId = generateTraceId();

    expect(traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(traceId).not.toBe('00000000000000000000000000000000');
  });

  it('should generate unique trace IDs', () => {
    const traceId1 = generateTraceId();
    const traceId2 = generateTraceId();

    expect(traceId1).not.toBe(traceId2);
  });

  it('should generate valid span IDs (16 hex characters)', () => {
    const spanId = generateSpanId();

    expect(spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(spanId).not.toBe('0000000000000000');
  });

  it('should generate unique span IDs', () => {
    const spanId1 = generateSpanId();
    const spanId2 = generateSpanId();

    expect(spanId1).not.toBe(spanId2);
  });
});

describe('Distributed Tracing - traceparent Parsing', () => {
  it('should parse valid traceparent header', () => {
    const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const parsed = parseTraceparent(traceparent);

    expect(parsed).not.toBeNull();
    expect(parsed?.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(parsed?.parentSpanId).toBe('00f067aa0ba902b7');
    expect(parsed?.traceFlags).toBe('01');
  });

  it('should reject invalid version', () => {
    const traceparent = '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const parsed = parseTraceparent(traceparent);

    expect(parsed).toBeNull();
  });

  it('should reject trace ID with all zeros', () => {
    const traceparent = '00-00000000000000000000000000000000-00f067aa0ba902b7-01';
    const parsed = parseTraceparent(traceparent);

    expect(parsed).toBeNull();
  });

  it('should reject span ID with all zeros', () => {
    const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01';
    const parsed = parseTraceparent(traceparent);

    expect(parsed).toBeNull();
  });

  it('should reject malformed traceparent', () => {
    expect(parseTraceparent('invalid')).toBeNull();
    expect(parseTraceparent('00-123-456-01')).toBeNull();
    expect(parseTraceparent('')).toBeNull();
  });

  it('should format trace context as traceparent', () => {
    const context = {
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      traceFlags: '01',
      startTime: new Date().toISOString(),
    };

    const traceparent = formatTraceparent(context);

    expect(traceparent).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
  });
});

describe('Distributed Tracing - Span Creation', () => {
  it('should create root span', () => {
    const span = createRootSpan(
      'notification.create',
      'Create Notification',
      {
        'user.id': 'user-123',
        'notification.type': 'BOOKING_CONFIRMED',
      }
    );

    expect(span.type).toBe('notification.create');
    expect(span.name).toBe('Create Notification');
    expect(span.context.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(span.context.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(span.context.parentSpanId).toBeUndefined();
    expect(span.context.traceFlags).toBe('01'); // Sampled
    expect(span.attributes['user.id']).toBe('user-123');
    expect(span.attributes['notification.type']).toBe('BOOKING_CONFIRMED');
    expect(span.status).toBe('ok');
  });

  it('should create child span from parent span', () => {
    const rootSpan = createRootSpan('notification.create', 'Root');
    const childSpan = createChildSpan(
      rootSpan,
      'notification.validate',
      'Validate',
      { 'validation.type': 'email' }
    );

    expect(childSpan.type).toBe('notification.validate');
    expect(childSpan.name).toBe('Validate');
    expect(childSpan.context.traceId).toBe(rootSpan.context.traceId);
    expect(childSpan.context.spanId).not.toBe(rootSpan.context.spanId);
    expect(childSpan.context.parentSpanId).toBe(rootSpan.context.spanId);
    expect(childSpan.context.traceFlags).toBe(rootSpan.context.traceFlags);
    expect(childSpan.attributes['validation.type']).toBe('email');
  });

  it('should create notification span', () => {
    const span = createNotificationSpan('user-123', 'BOOKING_CONFIRMED', 'NORMAL');

    expect(span.type).toBe('notification.create');
    expect(span.name).toBe('Create Notification');
    expect(span.attributes['user.id']).toBe('user-123');
    expect(span.attributes['notification.type']).toBe('BOOKING_CONFIRMED');
    expect(span.attributes['notification.priority']).toBe('NORMAL');
  });

  it('should create delivery span', () => {
    const rootSpan = createRootSpan('notification.process', 'Process');
    const deliverySpan = createDeliverySpan(rootSpan, 'notif-123', 'PUSH');

    expect(deliverySpan.type).toBe('notification.channel.push');
    expect(deliverySpan.name).toBe('Deliver to PUSH');
    expect(deliverySpan.context.traceId).toBe(rootSpan.context.traceId);
    expect(deliverySpan.context.parentSpanId).toBe(rootSpan.context.spanId);
    expect(deliverySpan.attributes['notification.id']).toBe('notif-123');
    expect(deliverySpan.attributes['notification.channel']).toBe('PUSH');
  });

  it('should create retry span', () => {
    const rootSpan = createRootSpan('notification.process', 'Process');
    const retrySpan = createRetrySpan(rootSpan, 'notif-123', 2);

    expect(retrySpan.type).toBe('notification.retry');
    expect(retrySpan.name).toBe('Retry Attempt 2');
    expect(retrySpan.context.traceId).toBe(rootSpan.context.traceId);
    expect(retrySpan.attributes['notification.id']).toBe('notif-123');
    expect(retrySpan.attributes['notification.retry_attempt']).toBe(2);
  });
});

describe('Distributed Tracing - Span Lifecycle', () => {
  it('should end span successfully', () => {
    const span = createRootSpan('notification.create', 'Test');
    const startTime = new Date(span.context.startTime).getTime();

    // Simulate some work
    const endedSpan = endSpan(span, 'ok');

    expect(endedSpan.status).toBe('ok');
    expect(endedSpan.context.endTime).toBeDefined();
    expect(endedSpan.context.duration).toBeDefined();
    expect(endedSpan.context.duration).toBeGreaterThanOrEqual(0);
    expect(endedSpan.error).toBeUndefined();
  });

  it('should end span with error', () => {
    const span = createRootSpan('notification.create', 'Test');

    const endedSpan = endSpan(span, 'error', {
      message: 'Test error',
      type: 'TEST_ERROR',
    });

    expect(endedSpan.status).toBe('error');
    expect(endedSpan.error).toBeDefined();
    expect(endedSpan.error?.message).toBe('Test error');
    expect(endedSpan.error?.type).toBe('TEST_ERROR');
    expect(endedSpan.attributes['error']).toBe(true);
    expect(endedSpan.attributes['error.message']).toBe('Test error');
    expect(endedSpan.attributes['error.type']).toBe('TEST_ERROR');
  });

  it('should add attributes to span', () => {
    const span = createRootSpan('notification.create', 'Test');

    const updatedSpan = addSpanAttributes(span, {
      'notification.id': 'notif-123',
      'custom.attribute': 'value',
    });

    expect(updatedSpan.attributes['notification.id']).toBe('notif-123');
    expect(updatedSpan.attributes['custom.attribute']).toBe('value');
  });

  it('should check if span has ended', () => {
    const span = createRootSpan('notification.create', 'Test');

    expect(isSpanEnded(span)).toBe(false);

    const endedSpan = endSpan(span, 'ok');

    expect(isSpanEnded(endedSpan)).toBe(true);
  });
});

describe('Distributed Tracing - Utility Functions', () => {
  it('should extract trace ID from span', () => {
    const span = createRootSpan('notification.create', 'Test');
    const traceId = getTraceId(span);

    expect(traceId).toBe(span.context.traceId);
  });

  it('should extract trace ID from context', () => {
    const context = createTraceContext('4bf92f3577b34da6a3ce929d0e0e4736');
    const traceId = getTraceId(context);

    expect(traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
  });

  it('should extract span ID from span', () => {
    const span = createRootSpan('notification.create', 'Test');
    const spanId = getSpanId(span);

    expect(spanId).toBe(span.context.spanId);
  });

  it('should create trace context from IDs', () => {
    const context = createTraceContext(
      '4bf92f3577b34da6a3ce929d0e0e4736',
      '00f067aa0ba902b7',
      '01'
    );

    expect(context.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(context.parentSpanId).toBe('00f067aa0ba902b7');
    expect(context.traceFlags).toBe('01');
    expect(context.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(context.startTime).toBeDefined();
  });
});

describe('Distributed Tracing - Log Context', () => {
  it('should convert span to log context', () => {
    const span = createRootSpan(
      'notification.create',
      'Create Notification',
      {
        'user.id': 'user-123',
        'notification.type': 'BOOKING_CONFIRMED',
      }
    );

    const endedSpan = endSpan(span, 'ok');
    const logContext = spanToLogContext(endedSpan);

    expect(logContext.traceId).toBe(span.context.traceId);
    expect(logContext.spanId).toBe(span.context.spanId);
    expect(logContext.spanType).toBe('notification.create');
    expect(logContext.spanName).toBe('Create Notification');
    expect(logContext.status).toBe('ok');
    expect(logContext.duration).toBeDefined();
    expect(logContext['user.id']).toBe('user-123');
    expect(logContext['notification.type']).toBe('BOOKING_CONFIRMED');
  });

  it('should include error in log context', () => {
    const span = createRootSpan('notification.create', 'Test');

    const endedSpan = endSpan(span, 'error', {
      message: 'Test error',
      type: 'TEST_ERROR',
    });

    const logContext = spanToLogContext(endedSpan);

    expect(logContext.status).toBe('error');
    expect(logContext.error).toBe('Test error');
    expect(logContext.errorType).toBe('TEST_ERROR');
  });
});

describe('Distributed Tracing - Trace Propagation', () => {
  it('should maintain trace ID across parent-child spans', () => {
    const rootSpan = createRootSpan('notification.create', 'Root');
    const child1 = createChildSpan(rootSpan, 'notification.validate', 'Child1');
    const child2 = createChildSpan(child1, 'notification.queue', 'Child2');

    expect(child1.context.traceId).toBe(rootSpan.context.traceId);
    expect(child2.context.traceId).toBe(rootSpan.context.traceId);
    expect(child1.context.parentSpanId).toBe(rootSpan.context.spanId);
    expect(child2.context.parentSpanId).toBe(child1.context.spanId);
  });

  it('should create child span from trace context', () => {
    const context = createTraceContext('4bf92f3577b34da6a3ce929d0e0e4736');
    const childSpan = createChildSpan(context, 'notification.process', 'Process');

    expect(childSpan.context.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(childSpan.context.parentSpanId).toBe(context.spanId);
  });

  it('should round-trip traceparent through parse and format', () => {
    const original = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const parsed = parseTraceparent(original);

    expect(parsed).not.toBeNull();

    if (parsed) {
      const context = createTraceContext(
        parsed.traceId,
        parsed.parentSpanId,
        parsed.traceFlags
      );

      const formatted = formatTraceparent(context);

      // Should preserve trace ID and flags, but span ID will be new
      expect(formatted).toMatch(/^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);
    }
  });
});
