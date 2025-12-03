/**
 * Example: Using NotificationError in Next.js API Routes
 *
 * This file demonstrates best practices for error handling in API routes
 * using the notification error system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/notification-service';
import { formatErrorResponse, logNotificationError } from '@/lib/notifications/errors';
import { createNotificationSchema } from '@/lib/schemas/notification.schema';
import { fromZodError } from '@/lib/notifications/errors';

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse and validate input
    const body = await req.json();
    const validation = createNotificationSchema.safeParse(body);

    if (!validation.success) {
      // Convert Zod errors to NotificationError
      const error = fromZodError(validation.error);
      const response = formatErrorResponse(error);
      return NextResponse.json(response, { status: response.statusCode });
    }

    // 2. Call service (returns Result<T, NotificationError>)
    const result = await notificationService.create(validation.data);

    // 3. Handle result
    if (result.ok) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: result.value.id,
            status: result.value.status,
          },
        },
        { status: 201 }
      );
    }

    // 4. Handle error cases
    const error = result.error;

    // Log error with additional context
    logNotificationError(error, {
      endpoint: '/api/notifications',
      method: 'POST',
      userId: validation.data.userId,
    });

    // Format error response for client
    const response = formatErrorResponse(error);

    return NextResponse.json(response, { status: response.statusCode });
  } catch (error) {
    // Catch unexpected errors (should be rare)
    console.error('Unexpected error in POST /api/notifications:', error);

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        correlationId: 'unknown',
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Get userId from session/auth (example)
  const userId = req.headers.get('x-user-id') || 'unknown';

  const result = await notificationService.markAsRead(params.id, userId);

  if (result.ok) {
    return NextResponse.json({ success: true });
  }

  // Handle specific error types differently
  const error = result.error;

  switch (error.type) {
    case 'NOTIFICATION_NOT_FOUND':
      // 404 - Resource not found
      return NextResponse.json(
        {
          error: error.type,
          message: 'Notification not found',
          correlationId: error.correlationId,
          statusCode: 404,
        },
        { status: 404 }
      );

    case 'UNAUTHORIZED':
      // 401 - Unauthorized access
      return NextResponse.json(
        {
          error: error.type,
          message: `Access denied: ${error.reason}`,
          correlationId: error.correlationId,
          statusCode: 401,
        },
        { status: 401 }
      );

    default:
      // Use helper for all other errors
      const response = formatErrorResponse(error);
      return NextResponse.json(response, { status: response.statusCode });
  }
}

/**
 * GET /api/notifications
 * Fetch user notifications with pagination
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id') || 'unknown';
  const searchParams = req.nextUrl.searchParams;

  const options = {
    limit: parseInt(searchParams.get('limit') || '20'),
    cursor: searchParams.get('cursor') || undefined,
    status: searchParams.get('status')?.split(',') as any,
    type: searchParams.get('type')?.split(',') as any,
  };

  // This method doesn't return Result, it returns direct data
  const { items, hasMore, nextCursor } =
    await notificationService.getUserNotifications(userId, options);

  return NextResponse.json({
    success: true,
    data: {
      items,
      pagination: {
        hasMore,
        nextCursor,
      },
    },
  });
}

/**
 * Example: Error handling with retry logic
 */
export async function processNotification(notificationId: string): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    const result = await notificationService.process(notificationId);

    if (result.ok) {
      console.log('Notification processed successfully');
      return;
    }

    const error = result.error;

    // Check if error is retryable
    const { isRetryableError, getRetryDelay } = await import('@/lib/notifications/errors');

    if (!isRetryableError(error)) {
      // Non-retryable error, log and exit
      logNotificationError(error, { notificationId, attempt });
      throw new Error(`Non-retryable error: ${error.type}`);
    }

    // Calculate retry delay
    const delayMs = getRetryDelay(error, attempt);

    if (delayMs === null) {
      throw new Error(`Cannot determine retry delay for error: ${error.type}`);
    }

    console.log(`Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    attempt++;
  }

  throw new Error(`Max retries (${maxRetries}) exceeded for notification ${notificationId}`);
}

/**
 * Example: Custom error response format for specific use case
 */
export async function customErrorHandling(req: NextRequest): Promise<NextResponse> {
  const result = await notificationService.create({
    userId: 'user-123',
    type: 'BOOKING_CONFIRMED',
    title: 'Test',
    body: 'Test',
  });

  if (!result.ok) {
    const error = result.error;

    // Create custom response format
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.type,
          message: error.message,
          userMessage: await getUserFriendlyMessage(error),
          correlationId: error.correlationId,
          timestamp: new Date().toISOString(),
          // Add custom fields based on error type
          ...(error.type === 'RATE_LIMITED' && {
            retryAfter: error.retryAfter,
            rateLimitInfo: {
              limit: error.limit,
              window: '1 minute',
            },
          }),
          ...(error.type === 'INVALID_INPUT' && {
            validationErrors: error.validationErrors,
            field: error.field,
          }),
        },
      },
      { status: getErrorStatusCode(error) }
    );
  }

  return NextResponse.json({ success: true, data: result.value });
}

// Import helpers
async function getUserFriendlyMessage(error: any): Promise<string> {
  const { getUserFriendlyMessage } = await import('@/lib/notifications/errors');
  return getUserFriendlyMessage(error);
}

async function getErrorStatusCode(error: any): Promise<number> {
  const { getErrorStatusCode } = await import('@/lib/notifications/errors');
  return getErrorStatusCode(error);
}
