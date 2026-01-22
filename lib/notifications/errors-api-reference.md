# Notification Errors - API Quick Reference

## Import

```typescript
import {
  // Types
  type NotificationError,

  // Error creation
  createNotificationError,
  exceptionToNotificationError,
  fromZodError,

  // Error checking
  isRetryableError,
  isUserError,
  isServerError,

  // HTTP helpers
  getErrorStatusCode,
  getUserFriendlyMessage,
  formatErrorResponse,
  toNextResponse,

  // Retry logic
  getRetryDelay,

  // Logging
  logNotificationError,

  // Constants
  NOTIFICATION_ERROR_CODES,
} from '@/lib/notifications/errors';
```

## Error Types

### NotificationError (Discriminated Union)

```typescript
type NotificationError =
  | UserNotFoundError
  | RateLimitedError
  | InvalidInputError
  | QueueError
  | DatabaseError
  | DeliveryError
  | TokenValidationError
  | NotificationNotFoundError
  | UnauthorizedError
  | ExpiredError
  | TemplateError
  | PreferenceError
  | InternalError;
```

### Individual Error Types

```typescript
type UserNotFoundError = {
  type: 'USER_NOT_FOUND';
  message: string;
  correlationId: string;
  userId: string;
}

type RateLimitedError = {
  type: 'RATE_LIMITED';
  message: string;
  correlationId: string;
  userId: string;
  retryAfter: number;
  limit: number;
  notificationType?: string;
}

type InvalidInputError = {
  type: 'INVALID_INPUT';
  message: string;
  correlationId: string;
  field: string;
  validationErrors?: Record<string, string[]>;
}

type DatabaseError = {
  type: 'DATABASE_ERROR';
  message: string;
  correlationId: string;
  operation: string;
  originalError?: string;
}

type DeliveryError = {
  type: 'DELIVERY_ERROR';
  message: string;
  correlationId: string;
  channel: string;
  notificationId: string;
  originalError?: string;
  retryable: boolean;
}

// ... and 8 more types
```

## Functions

### createNotificationError()

Create a new notification error with automatic logging and correlation ID.

```typescript
function createNotificationError(
  type: NotificationError['type'],
  message: string,
  context?: Record<string, any>
): NotificationError
```

**Examples:**

```typescript
// User not found
createNotificationError('USER_NOT_FOUND', 'User not found', {
  userId: 'user-123',
});

// Rate limited
createNotificationError('RATE_LIMITED', 'Too many notifications', {
  userId: 'user-123',
  retryAfter: 60,
  limit: 100,
  notificationType: 'BOOKING_CONFIRMED',
});

// Validation error
createNotificationError('INVALID_INPUT', 'Invalid email', {
  field: 'email',
  validationErrors: { email: ['Invalid format'] },
});

// Database error
createNotificationError('DATABASE_ERROR', 'Query failed', {
  operation: 'create',
  originalError: error,
});

// Delivery error
createNotificationError('DELIVERY_ERROR', 'Push failed', {
  channel: 'PUSH',
  notificationId: 'notif-123',
  retryable: true,
  originalError: error,
});
```

### exceptionToNotificationError()

Convert a caught exception to a NotificationError with automatic type inference.

```typescript
function exceptionToNotificationError(
  error: unknown,
  context?: Record<string, any>
): NotificationError
```

**Example:**

```typescript
try {
  await prisma.notification.create({ data });
} catch (error) {
  return err(
    exceptionToNotificationError(error, {
      userId: 'user-123',
      operation: 'create',
    })
  );
}
```

**Type Inference:**

The function infers the error type based on the exception message:

- "user not found" → `USER_NOT_FOUND`
- "notification not found" → `NOTIFICATION_NOT_FOUND`
- "rate limit" → `RATE_LIMITED`
- "invalid" / "validation" → `INVALID_INPUT`
- "database" / "prisma" → `DATABASE_ERROR`
- "queue" / "qstash" → `QUEUE_ERROR`
- "delivery" / "send" → `DELIVERY_ERROR`
- "token" / "fcm" → `TOKEN_VALIDATION_ERROR`
- default → `INTERNAL_ERROR`

### fromZodError()

Convert Zod validation errors to NotificationError.

```typescript
function fromZodError(
  zodError: { errors: Array<{ path: string[]; message: string }> },
  correlationId?: string
): NotificationError
```

**Example:**

```typescript
const validation = schema.safeParse(input);

if (!validation.success) {
  return err(fromZodError(validation.error));
}

// Returns INVALID_INPUT error with structured validation errors
// {
//   type: 'INVALID_INPUT',
//   field: 'email',
//   validationErrors: {
//     email: ['Invalid format', 'Required field'],
//     name: ['Too short']
//   },
//   ...
// }
```

### isRetryableError()

Check if an error should be retried.

```typescript
function isRetryableError(error: NotificationError): boolean
```

**Retryable errors:**
- `RATE_LIMITED`
- `QUEUE_ERROR`
- `DATABASE_ERROR`
- `INTERNAL_ERROR`
- `DELIVERY_ERROR` (if `retryable: true`)

**Example:**

```typescript
if (isRetryableError(error)) {
  const delayMs = getRetryDelay(error, attemptNumber);
  await scheduleRetry(notificationId, delayMs);
}
```

### isUserError()

Check if error is user's fault (don't log as error).

```typescript
function isUserError(error: NotificationError): boolean
```

**User errors:**
- `USER_NOT_FOUND`
- `INVALID_INPUT`
- `NOTIFICATION_NOT_FOUND`
- `UNAUTHORIZED`
- `EXPIRED`

### isServerError()

Check if error is server's fault (log as error, alert on-call).

```typescript
function isServerError(error: NotificationError): boolean
```

**Server errors:**
- `QUEUE_ERROR`
- `DATABASE_ERROR`
- `INTERNAL_ERROR`
- `TEMPLATE_ERROR`

### getErrorStatusCode()

Get HTTP status code for an error.

```typescript
function getErrorStatusCode(error: NotificationError): number
```

**Status code mapping:**
- `USER_NOT_FOUND` → 404
- `NOTIFICATION_NOT_FOUND` → 404
- `UNAUTHORIZED` → 401
- `RATE_LIMITED` → 429
- `INVALID_INPUT` → 400
- `EXPIRED` → 410
- `TOKEN_VALIDATION_ERROR` → 422
- `DELIVERY_ERROR` → 502
- `DATABASE_ERROR` → 500
- `QUEUE_ERROR` → 500
- `INTERNAL_ERROR` → 500

**Example:**

```typescript
const statusCode = getErrorStatusCode(error); // 404, 429, 500, etc.
return NextResponse.json(errorBody, { status: statusCode });
```

### getUserFriendlyMessage()

Get sanitized, user-friendly error message.

```typescript
function getUserFriendlyMessage(error: NotificationError): string
```

**Example:**

```typescript
const message = getUserFriendlyMessage(error);
// "User not found. Please check your account."
// "Too many notifications sent. Please try again in 60 seconds."
// "Failed to deliver notification via PUSH. Will retry automatically."
```

**Security:** Never exposes internal details like database connection strings, stack traces, etc.

### formatErrorResponse()

Format error for HTTP API response.

```typescript
function formatErrorResponse(error: NotificationError): {
  error: string;
  message: string;
  correlationId: string;
  statusCode: number;
  details?: Record<string, any>;
}
```

**Example:**

```typescript
if (!result.ok) {
  const errorResponse = formatErrorResponse(result.error);
  return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
}

// Response:
// {
//   "error": "RATE_LIMITED",
//   "message": "Too many notifications sent. Please try again in 60 seconds.",
//   "correlationId": "550e8400-e29b-41d4-a716-446655440000",
//   "statusCode": 429,
//   "details": {
//     "retryAfter": 60,
//     "limit": 100
//   }
// }
```

### toNextResponse()

Format error for Next.js API route (convenience wrapper).

```typescript
function toNextResponse(error: NotificationError): {
  status: number;
  body: ReturnType<typeof formatErrorResponse>;
}
```

**Example:**

```typescript
if (!result.ok) {
  const { status, body } = toNextResponse(result.error);
  return NextResponse.json(body, { status });
}
```

### getRetryDelay()

Get retry delay in milliseconds for retryable errors.

```typescript
function getRetryDelay(
  error: NotificationError,
  attemptNumber: number
): number | null
```

**Returns:**
- `null` for non-retryable errors
- Delay in milliseconds for retryable errors

**Retry strategies:**

```typescript
// RATE_LIMITED: Use error.retryAfter
getRetryDelay(rateLimitError, 1); // error.retryAfter * 1000

// DATABASE_ERROR, QUEUE_ERROR, INTERNAL_ERROR: Exponential backoff
getRetryDelay(dbError, 0); // 1000ms (2^0 * 1000)
getRetryDelay(dbError, 1); // 2000ms (2^1 * 1000)
getRetryDelay(dbError, 2); // 4000ms (2^2 * 1000)
getRetryDelay(dbError, 3); // 8000ms (2^3 * 1000)

// DELIVERY_ERROR (if retryable): Exponential backoff + jitter
getRetryDelay(deliveryError, 2); // 4000-5000ms (2^2 * 1000 + random 0-1000)
```

**Example:**

```typescript
async function retryOperation(notificationId: string): Promise<void> {
  let attempt = 0;
  const maxRetries = 5;

  while (attempt < maxRetries) {
    const result = await notificationService.process(notificationId);

    if (result.ok) return;

    if (!isRetryableError(result.error)) {
      throw new Error(`Non-retryable error: ${result.error.type}`);
    }

    const delayMs = getRetryDelay(result.error, attempt);
    if (delayMs === null) break;

    console.log(`Retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    attempt++;
  }
}
```

### logNotificationError()

Log error at appropriate level based on error type.

```typescript
function logNotificationError(
  error: NotificationError,
  additionalContext?: Record<string, any>
): void
```

**Logging levels:**
- Server errors → `logger.error()`
- User errors → `logger.warn()`
- Others → `logger.info()`

**Example:**

```typescript
logNotificationError(error, {
  userId: 'user-123',
  operation: 'create',
  endpoint: '/api/notifications',
});

// Logs:
// {
//   level: 'error',
//   message: 'Notification server error',
//   errorType: 'DATABASE_ERROR',
//   message: 'Query failed',
//   correlationId: '550e8400-...',
//   userId: 'user-123',
//   operation: 'create',
//   endpoint: '/api/notifications'
// }
```

## Constants

### NOTIFICATION_ERROR_CODES

```typescript
const NOTIFICATION_ERROR_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_INPUT: 'INVALID_INPUT',
  QUEUE_ERROR: 'QUEUE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DELIVERY_ERROR: 'DELIVERY_ERROR',
  TOKEN_VALIDATION_ERROR: 'TOKEN_VALIDATION_ERROR',
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  EXPIRED: 'EXPIRED',
  TEMPLATE_ERROR: 'TEMPLATE_ERROR',
  PREFERENCE_ERROR: 'PREFERENCE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

## Complete Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/notification-service';
import {
  formatErrorResponse,
  logNotificationError,
  isRetryableError,
  getRetryDelay,
} from '@/lib/notifications/errors';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Call service (returns Result<T, NotificationError>)
    const result = await notificationService.create(body);

    if (result.ok) {
      return NextResponse.json(
        { success: true, data: result.value },
        { status: 201 }
      );
    }

    // Handle error
    const error = result.error;

    // Log with context
    logNotificationError(error, {
      endpoint: '/api/notifications',
      method: 'POST',
      userId: body.userId,
    });

    // Check if retryable
    if (isRetryableError(error)) {
      const delayMs = getRetryDelay(error, 0);
      console.log(`Error is retryable, delay: ${delayMs}ms`);
    }

    // Format response
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });

  } catch (error) {
    // Unexpected error
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Unexpected error' },
      { status: 500 }
    );
  }
}
```

## See Also

- [Full Documentation](/docs/notifications/errors.md)
- [API Examples](/docs/notifications/api-error-example.ts)
- [Implementation](/lib/notifications/errors.ts)
- [Tests](/__tests__/lib/notifications/errors.test.ts)
