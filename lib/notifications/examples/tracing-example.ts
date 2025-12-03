/**
 * Distributed Tracing Example
 *
 * This example demonstrates how to use the distributed tracing system
 * for notifications.
 */

import { notificationService } from '../notification-service';
import {
  formatTraceparent,
  parseTraceparent,
  createNotificationSpan,
  createChildSpan,
  endSpan,
  logSpanStart,
  logSpanEnd,
  type Span,
} from '../tracing';

/**
 * Example 1: Create notification with new trace
 */
async function createNotificationWithNewTrace(): Promise<void> {
  console.log('\n=== Example 1: Create Notification (New Trace) ===\n');

  const result = await notificationService.create({
    userId: 'user-123',
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed',
    body: 'Your booking at Studio ABC has been confirmed for tomorrow at 10:00 AM',
    metadata: {
      bookingId: 'booking-456',
      studioName: 'Studio ABC',
      appointmentTime: '2025-12-03T10:00:00Z',
    },
    priority: 'NORMAL',
    // No traceparent = new root trace will be created
  });

  if (result.ok) {
    console.log('✓ Notification created:', result.value.id);
    console.log('  Status:', result.value.status);
    console.log('  A new trace was automatically started');
  } else {
    console.error('✗ Failed to create notification:', result.error);
  }
}

/**
 * Example 2: Propagate trace from incoming HTTP request
 */
async function createNotificationWithPropagatedTrace(
  incomingTraceparent: string
): Promise<void> {
  console.log('\n=== Example 2: Create Notification (Propagated Trace) ===\n');
  console.log('Incoming traceparent:', incomingTraceparent);

  // Parse the incoming trace context
  const parsedContext = parseTraceparent(incomingTraceparent);
  if (parsedContext) {
    console.log('✓ Valid traceparent parsed');
    console.log('  Trace ID:', parsedContext.traceId);
    console.log('  Parent Span ID:', parsedContext.parentSpanId);
  }

  const result = await notificationService.create({
    userId: 'user-789',
    type: 'BOOKING_REMINDER',
    title: 'Booking Reminder',
    body: 'Your appointment is tomorrow at 10:00 AM',
    metadata: {
      bookingId: 'booking-789',
      studioName: 'Studio XYZ',
      appointmentTime: '2025-12-03T10:00:00Z',
    },
    priority: 'HIGH',
    // Propagate the trace from the incoming request
    traceparent: incomingTraceparent,
  });

  if (result.ok) {
    console.log('✓ Notification created:', result.value.id);
    console.log('  Status:', result.value.status);
    console.log('  Trace continued from incoming request');
  } else {
    console.error('✗ Failed to create notification:', result.error);
  }
}

/**
 * Example 3: Manual span creation for custom operations
 */
async function manualSpanCreation(): Promise<void> {
  console.log('\n=== Example 3: Manual Span Creation ===\n');

  // Create root span for the operation
  const rootSpan = createNotificationSpan(
    'user-999',
    'BOOKING_CONFIRMED',
    'URGENT'
  );

  logSpanStart(rootSpan);
  console.log('✓ Root span created');
  console.log('  Trace ID:', rootSpan.context.traceId);
  console.log('  Span ID:', rootSpan.context.spanId);
  console.log('  traceparent:', formatTraceparent(rootSpan.context));

  try {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create child span for a subtask
    const childSpan = createChildSpan(
      rootSpan,
      'notification.validate',
      'Validate User',
      {
        'user.id': 'user-999',
        'validation.type': 'email',
      }
    );

    logSpanStart(childSpan);
    console.log('\n✓ Child span created');
    console.log('  Span ID:', childSpan.context.spanId);
    console.log('  Parent Span ID:', childSpan.context.parentSpanId);

    // Simulate validation work
    await new Promise(resolve => setTimeout(resolve, 50));

    // End child span successfully
    const finishedChild = endSpan(childSpan, 'ok');
    logSpanEnd(finishedChild);
    console.log('✓ Child span completed');
    console.log('  Duration:', finishedChild.context.duration, 'ms');

    // More work in root span
    await new Promise(resolve => setTimeout(resolve, 50));

    // End root span successfully
    const finishedRoot = endSpan(rootSpan, 'ok');
    logSpanEnd(finishedRoot);
    console.log('\n✓ Root span completed');
    console.log('  Total Duration:', finishedRoot.context.duration, 'ms');

  } catch (error) {
    // End span with error
    const finishedSpan = endSpan(rootSpan, 'error', {
      message: error instanceof Error ? error.message : String(error),
      type: 'VALIDATION_ERROR',
    });
    logSpanEnd(finishedSpan);
    console.error('✗ Span failed:', error);
  }
}

/**
 * Example 4: Propagate trace across service boundaries
 */
async function crossServiceTracePropagation(): Promise<void> {
  console.log('\n=== Example 4: Cross-Service Trace Propagation ===\n');

  // Simulate incoming request from another service with trace context
  const incomingTraceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
  console.log('Service A sent traceparent:', incomingTraceparent);

  // Service B (notification service) receives the request
  const result = await notificationService.create({
    userId: 'user-555',
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    body: 'Your booking has been cancelled',
    metadata: {
      bookingId: 'booking-555',
      studioName: 'Studio DEF',
      cancellationReason: 'Customer requested',
    },
    priority: 'NORMAL',
    // Continue the trace from Service A
    traceparent: incomingTraceparent,
  });

  if (result.ok) {
    console.log('✓ Notification created in Service B:', result.value.id);
    console.log('  Trace continued from Service A');
    console.log('  Same trace ID will appear in logs across both services');
  }
}

/**
 * Example 5: Invalid traceparent handling
 */
async function invalidTraceparentHandling(): Promise<void> {
  console.log('\n=== Example 5: Invalid traceparent Handling ===\n');

  const invalidTraceparents = [
    '',
    'invalid',
    '00-123-456-01', // Too short
    '00-00000000000000000000000000000000-0000000000000000-01', // All zeros
    '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01', // Wrong version
  ];

  for (const traceparent of invalidTraceparents) {
    console.log('\nTesting traceparent:', traceparent || '(empty)');

    const parsed = parseTraceparent(traceparent);
    if (!parsed) {
      console.log('✗ Invalid traceparent detected');
      console.log('  → Will start new root trace instead');
    } else {
      console.log('✓ Valid traceparent');
    }

    // Service automatically handles invalid traceparent by creating new trace
    const result = await notificationService.create({
      userId: 'user-111',
      type: 'BOOKING_CONFIRMED',
      title: 'Test Notification',
      body: 'Testing invalid traceparent handling',
      traceparent: traceparent,
    });

    if (result.ok) {
      console.log('✓ Notification created (new trace started):', result.value.id);
    }
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('=================================================');
  console.log('   Distributed Tracing Examples');
  console.log('=================================================');

  try {
    // Example 1: New trace
    await createNotificationWithNewTrace();

    // Example 2: Propagate trace
    const sampleTraceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    await createNotificationWithPropagatedTrace(sampleTraceparent);

    // Example 3: Manual spans
    await manualSpanCreation();

    // Example 4: Cross-service propagation
    await crossServiceTracePropagation();

    // Example 5: Invalid traceparent
    await invalidTraceparentHandling();

    console.log('\n=================================================');
    console.log('   All examples completed successfully!');
    console.log('=================================================\n');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  createNotificationWithNewTrace,
  createNotificationWithPropagatedTrace,
  manualSpanCreation,
  crossServiceTracePropagation,
  invalidTraceparentHandling,
};
