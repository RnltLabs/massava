/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Distributed Tracing for Notification System
 *
 * Implements W3C Trace Context specification for distributed tracing across
 * notification processing pipeline. Provides trace ID propagation, span creation,
 * and integration with structured logging.
 *
 * @module lib/notifications/tracing
 */

import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import type { NotificationChannel, NotificationPriority } from '@/app/generated/prisma';

// ============================================
// W3C Trace Context Types
// ============================================

/**
 * W3C Trace Context format
 * traceparent: {version}-{trace-id}-{parent-id}-{trace-flags}
 */
export interface TraceContext {
  /** Unique identifier for the entire trace (32 hex chars) */
  traceId: string;
  /** Unique identifier for the current span (16 hex chars) */
  spanId: string;
  /** Parent span ID if this is a child span (16 hex chars) */
  parentSpanId?: string;
  /** Sampling flags (00 = not sampled, 01 = sampled) */
  traceFlags: string;
  /** ISO 8601 timestamp when trace was created */
  startTime: string;
  /** ISO 8601 timestamp when span ended */
  endTime?: string;
  /** Duration in milliseconds */
  duration?: number;
}

/**
 * Span types for different notification processing stages
 */
export type SpanType =
  | 'notification.create'
  | 'notification.validate'
  | 'notification.queue'
  | 'notification.process'
  | 'notification.deliver'
  | 'notification.retry'
  | 'notification.channel.push'
  | 'notification.channel.email'
  | 'notification.channel.in_app';

/**
 * Span attributes for additional context
 */
export interface SpanAttributes {
  /** User ID being notified */
  'user.id'?: string;
  /** Notification ID */
  'notification.id'?: string;
  /** Notification type (e.g., BOOKING_CONFIRMED) */
  'notification.type'?: string;
  /** Priority level */
  'notification.priority'?: NotificationPriority;
  /** Delivery channel */
  'notification.channel'?: NotificationChannel;
  /** Retry attempt number */
  'notification.retry_attempt'?: number;
  /** Error flag */
  'error'?: boolean;
  /** Error message */
  'error.message'?: string;
  /** Error type */
  'error.type'?: string;
  /** Status */
  'status'?: string;
  /** Additional custom attributes */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Complete span with trace context and attributes
 */
export interface Span {
  /** Trace context information */
  context: TraceContext;
  /** Type of span */
  type: SpanType;
  /** Human-readable span name */
  name: string;
  /** Span attributes */
  attributes: SpanAttributes;
  /** Status (ok, error) */
  status: 'ok' | 'error';
  /** Optional error details */
  error?: {
    message: string;
    type: string;
  };
}

// ============================================
// Trace ID Generation (W3C Format)
// ============================================

/**
 * Generate a trace ID (32 hex characters)
 * Format: 32 lowercase hex chars representing 16 bytes
 * Must not be all zeros
 *
 * @returns W3C compliant trace ID
 */
export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a span ID (16 hex characters)
 * Format: 16 lowercase hex chars representing 8 bytes
 * Must not be all zeros
 *
 * @returns W3C compliant span ID
 */
export function generateSpanId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Parse W3C traceparent header
 * Format: {version}-{trace-id}-{parent-id}-{trace-flags}
 * Example: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 *
 * @param traceparent - W3C traceparent header value
 * @returns Parsed trace context or null if invalid
 */
export function parseTraceparent(traceparent: string): Pick<TraceContext, 'traceId' | 'parentSpanId' | 'traceFlags'> | null {
  const parts = traceparent.split('-');

  if (parts.length !== 4) {
    return null;
  }

  const [version, traceId, parentId, flags] = parts;

  // Validate version (currently only 00 is supported)
  if (version !== '00') {
    return null;
  }

  // Validate trace ID (32 hex chars, not all zeros)
  if (!/^[0-9a-f]{32}$/.test(traceId) || traceId === '00000000000000000000000000000000') {
    return null;
  }

  // Validate parent ID (16 hex chars, not all zeros)
  if (!/^[0-9a-f]{16}$/.test(parentId) || parentId === '0000000000000000') {
    return null;
  }

  // Validate flags (2 hex chars)
  if (!/^[0-9a-f]{2}$/.test(flags)) {
    return null;
  }

  return {
    traceId,
    parentSpanId: parentId,
    traceFlags: flags,
  };
}

/**
 * Format trace context as W3C traceparent header
 * Format: 00-{trace-id}-{span-id}-{flags}
 *
 * @param context - Trace context to format
 * @returns W3C traceparent header value
 */
export function formatTraceparent(context: TraceContext): string {
  return `00-${context.traceId}-${context.spanId}-${context.traceFlags}`;
}

// ============================================
// Span Creation & Management
// ============================================

/**
 * Create a new root span (starts a new trace)
 *
 * @param type - Type of span being created
 * @param name - Human-readable span name
 * @param attributes - Initial span attributes
 * @returns New root span
 */
export function createRootSpan(
  type: SpanType,
  name: string,
  attributes?: SpanAttributes
): Span {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const startTime = new Date().toISOString();

  const context: TraceContext = {
    traceId,
    spanId,
    traceFlags: '01', // Sampled by default
    startTime,
  };

  return {
    context,
    type,
    name,
    attributes: attributes || {},
    status: 'ok',
  };
}

/**
 * Create a child span from a parent span or trace context
 *
 * @param parent - Parent span or trace context
 * @param type - Type of span being created
 * @param name - Human-readable span name
 * @param attributes - Initial span attributes
 * @returns New child span
 */
export function createChildSpan(
  parent: Span | TraceContext,
  type: SpanType,
  name: string,
  attributes?: SpanAttributes
): Span {
  const parentContext = 'context' in parent ? parent.context : parent;
  const spanId = generateSpanId();
  const startTime = new Date().toISOString();

  const context: TraceContext = {
    traceId: parentContext.traceId,
    spanId,
    parentSpanId: parentContext.spanId,
    traceFlags: parentContext.traceFlags,
    startTime,
  };

  return {
    context,
    type,
    name,
    attributes: attributes || {},
    status: 'ok',
  };
}

/**
 * Create a root span for notification creation
 *
 * @param userId - User ID being notified
 * @param notificationType - Type of notification
 * @param priority - Notification priority
 * @returns Notification creation span
 */
export function createNotificationSpan(
  userId: string,
  notificationType: string,
  priority: NotificationPriority
): Span {
  return createRootSpan('notification.create', 'Create Notification', {
    'user.id': userId,
    'notification.type': notificationType,
    'notification.priority': priority,
  });
}

/**
 * Create a span for notification delivery to a specific channel
 *
 * @param parent - Parent span (notification processing span)
 * @param notificationId - Notification ID
 * @param channel - Delivery channel
 * @returns Delivery span
 */
export function createDeliverySpan(
  parent: Span | TraceContext,
  notificationId: string,
  channel: NotificationChannel
): Span {
  const spanType: SpanType =
    channel === 'PUSH' ? 'notification.channel.push' :
    channel === 'EMAIL' ? 'notification.channel.email' :
    'notification.channel.in_app';

  return createChildSpan(parent, spanType, `Deliver to ${channel}`, {
    'notification.id': notificationId,
    'notification.channel': channel,
  });
}

/**
 * Create a span for retry attempt
 *
 * @param parent - Parent span (notification processing span)
 * @param notificationId - Notification ID
 * @param retryAttempt - Retry attempt number
 * @returns Retry span
 */
export function createRetrySpan(
  parent: Span | TraceContext,
  notificationId: string,
  retryAttempt: number
): Span {
  return createChildSpan(parent, 'notification.retry', `Retry Attempt ${retryAttempt}`, {
    'notification.id': notificationId,
    'notification.retry_attempt': retryAttempt,
  });
}

/**
 * End a span and calculate duration
 *
 * @param span - Span to end
 * @param status - Final status (ok or error)
 * @param error - Optional error details
 * @returns Updated span with end time and duration
 */
export function endSpan(
  span: Span,
  status: 'ok' | 'error' = 'ok',
  error?: { message: string; type: string }
): Span {
  const endTime = new Date().toISOString();
  const startMs = new Date(span.context.startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const duration = endMs - startMs;

  return {
    ...span,
    context: {
      ...span.context,
      endTime,
      duration,
    },
    status,
    error,
    attributes: {
      ...span.attributes,
      error: status === 'error',
      ...(error && {
        'error.message': error.message,
        'error.type': error.type,
      }),
    },
  };
}

/**
 * Add attributes to an existing span
 *
 * @param span - Span to update
 * @param attributes - Attributes to add
 * @returns Updated span
 */
export function addSpanAttributes(
  span: Span,
  attributes: SpanAttributes
): Span {
  return {
    ...span,
    attributes: {
      ...span.attributes,
      ...attributes,
    },
  };
}

// ============================================
// Logging Integration
// ============================================

/**
 * Convert span to structured log context
 *
 * @param span - Span to convert
 * @returns Log context with trace information
 */
export function spanToLogContext(span: Span): Record<string, unknown> {
  return {
    traceId: span.context.traceId,
    spanId: span.context.spanId,
    parentSpanId: span.context.parentSpanId,
    spanType: span.type,
    spanName: span.name,
    duration: span.context.duration,
    status: span.status,
    ...span.attributes,
    ...(span.error && {
      error: span.error.message,
      errorType: span.error.type,
    }),
  };
}

/**
 * Log span start
 *
 * @param span - Span that started
 */
export function logSpanStart(span: Span): void {
  logger.info(`Span started: ${span.name}`, spanToLogContext(span));
}

/**
 * Log span end
 *
 * @param span - Span that ended (should have endTime and duration)
 */
export function logSpanEnd(span: Span): void {
  const logLevel = span.status === 'error' ? 'error' : 'info';
  const message = `Span completed: ${span.name}`;

  if (logLevel === 'error') {
    logger.error(message, spanToLogContext(span));
  } else {
    logger.info(message, spanToLogContext(span));
  }
}

// ============================================
// Console Exporter (Development)
// ============================================

/**
 * Export span to console (development mode)
 * Formats span as structured JSON for easy debugging
 *
 * @param span - Span to export
 */
export function exportSpanToConsole(span: Span): void {
  if (process.env.NODE_ENV === 'development') {
    const traceInfo = {
      trace_id: span.context.traceId,
      span_id: span.context.spanId,
      parent_span_id: span.context.parentSpanId,
      span_type: span.type,
      span_name: span.name,
      start_time: span.context.startTime,
      end_time: span.context.endTime,
      duration_ms: span.context.duration,
      status: span.status,
      attributes: span.attributes,
      error: span.error,
      traceparent: formatTraceparent(span.context),
    };

    console.log('[TRACE]', JSON.stringify(traceInfo, null, 2));
  }
}

// ============================================
// OpenTelemetry Integration Interface
// ============================================

/**
 * Interface for OpenTelemetry exporter
 * Implement this to integrate with OpenTelemetry collector
 */
export interface TraceExporter {
  /**
   * Export span to external tracing system
   *
   * @param span - Span to export
   * @returns Promise that resolves when export is complete
   */
  export(span: Span): Promise<void>;
}

/**
 * Batch exporter for efficient span export
 * Collects spans and exports them in batches
 */
export class BatchTraceExporter {
  private spans: Span[] = [];
  private readonly maxBatchSize: number;
  private readonly flushInterval: number;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly exporter: TraceExporter,
    options?: {
      maxBatchSize?: number;
      flushInterval?: number;
    }
  ) {
    this.maxBatchSize = options?.maxBatchSize || 100;
    this.flushInterval = options?.flushInterval || 5000; // 5 seconds
    this.startTimer();
  }

  /**
   * Add span to batch
   *
   * @param span - Span to add
   */
  add(span: Span): void {
    this.spans.push(span);

    if (this.spans.length >= this.maxBatchSize) {
      void this.flush();
    }
  }

  /**
   * Flush all pending spans
   */
  async flush(): Promise<void> {
    if (this.spans.length === 0) {
      return;
    }

    const spansToExport = [...this.spans];
    this.spans = [];

    await Promise.all(
      spansToExport.map(span => this.exporter.export(span))
    );
  }

  /**
   * Start periodic flush timer
   */
  private startTimer(): void {
    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop exporter and flush remaining spans
   */
  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Extract trace ID from span or context
 *
 * @param spanOrContext - Span or trace context
 * @returns Trace ID
 */
export function getTraceId(spanOrContext: Span | TraceContext): string {
  return 'context' in spanOrContext
    ? spanOrContext.context.traceId
    : spanOrContext.traceId;
}

/**
 * Extract span ID from span or context
 *
 * @param spanOrContext - Span or trace context
 * @returns Span ID
 */
export function getSpanId(spanOrContext: Span | TraceContext): string {
  return 'context' in spanOrContext
    ? spanOrContext.context.spanId
    : spanOrContext.spanId;
}

/**
 * Check if span has ended
 *
 * @param span - Span to check
 * @returns True if span has end time
 */
export function isSpanEnded(span: Span): boolean {
  return span.context.endTime !== undefined;
}

/**
 * Create trace context from existing trace and span IDs
 * Useful for propagating context across service boundaries
 *
 * @param traceId - Existing trace ID
 * @param parentSpanId - Parent span ID
 * @param traceFlags - Trace flags (default: '01' sampled)
 * @returns Trace context
 */
export function createTraceContext(
  traceId: string,
  parentSpanId?: string,
  traceFlags: string = '01'
): TraceContext {
  return {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    traceFlags,
    startTime: new Date().toISOString(),
  };
}
