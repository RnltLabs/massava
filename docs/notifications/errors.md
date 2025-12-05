# Notification Error Handling

This document describes the error handling system for the notification feature, following the Result<T, E> pattern.

## Overview

The notification system uses **discriminated union types** for type-safe error handling. All errors are explicit in function signatures, forcing callers to handle them properly.

## Error Classes

All notification errors are defined in `/lib/notifications/errors.ts` as a discriminated union:

```typescript
type NotificationError =
  | { type: 'USER_NOT_FOUND'; message: string; correlationId: string; userId: string }
  | { type: 'RATE_LIMITED'; message: string; correlationId: string; userId: string; retryAfter: number; limit: number }
  | { type: 'INVALID_INPUT'; message: string; correlationId: string; field: string; validationErrors?: Record<string, string[]> }
  // ... and more
```

### Error Types

#### User Errors (Client Fault - Don't Retry)

1. **USER_NOT_FOUND** (404)
   - User does not exist in the system
   - Fields: `userId`

2. **NOTIFICATION_NOT_FOUND** (404)
   - Notification does not exist or user doesn't have access
   - Fields: `notificationId`

3. **INVALID_INPUT** (400)
   - Input validation failed
   - Fields: `field`, `validationErrors?`

4. **UNAUTHORIZED** (401)
   - User doesn't have permission to access/modify notification
   - Fields: `userId`, `notificationId`, `reason`

5. **EXPIRED** (410)
   - Notification has expired and can no longer be delivered
   - Fields: `notificationId`, `expiresAt`

#### Server Errors (Server Fault - Retryable)

6. **DATABASE_ERROR** (500)
   - Database operation failed
   - Fields: `operation`, `originalError?`
   - **Retryable**: Yes (exponential backoff)

7. **QUEUE_ERROR** (500)
   - Failed to publish to message queue (QStash)
   - Fields: `queueName?`, `originalError?`
   - **Retryable**: Yes (exponential backoff)

8. **INTERNAL_ERROR** (500)
   - Unknown internal server error
   - Fields: `originalError?`
   - **Retryable**: Yes (exponential backoff)

9. **TEMPLATE_ERROR** (500)
   - Error generating notification content from template
   - Fields: `templateType`, `originalError?`
   - **Retryable**: No

#### Rate Limiting Errors

10. **RATE_LIMITED** (429)
    - Too many notifications sent in time window
    - Fields: `userId`, `retryAfter`, `limit`, `notificationType?`
    - **Retryable**: Yes (after `retryAfter` seconds)

#### Delivery Errors

11. **DELIVERY_ERROR** (502)
    - Failed to deliver notification via specific channel
    - Fields: `channel`, `notificationId`, `retryable`, `originalError?`
    - **Retryable**: Depends on `retryable` flag

12. **TOKEN_VALIDATION_ERROR** (422)
    - Invalid or expired device token for push notifications
    - Fields: `token?`, `reason`
    - **Retryable**: No

13. **PREFERENCE_ERROR** (400)
    - Error accessing user notification preferences
    - Fields: `userId`, `originalError?`
    - **Retryable**: No

## Usage

### Creating Errors

Use `createNotificationError()` to create errors with proper logging and correlation IDs:

```typescript
import { createNotificationError } from '@/lib/notifications/errors';

// User not found
const error = createNotificationError('USER_NOT_FOUND', 'User does not exist', {
  userId: 'user-123',
});

// Rate limited with retry info
const error = createNotificationError('RATE_LIMITED', 'Too many notifications', {
  userId: 'user-123',
  retryAfter: 60,
  limit: 100,
  notificationType: 'BOOKING_CONFIRMED',
});

// Validation error with field details
const error = createNotificationError('INVALID_INPUT', 'Invalid email format', {
  field: 'email',
  validationErrors: {
    email: ['Invalid format', 'Required field'],
  },
});
```

### Converting Exceptions

Use `exceptionToNotificationError()` in try-catch blocks:

```typescript
import { exceptionToNotificationError } from '@/lib/notifications/errors';

try {
  await someOperation();
} catch (error) {
  return err(
    exceptionToNotificationError(error, {
      userId: 'user-123',
      operation: 'create',
    })
  );
}
```

The function automatically infers the error type based on the exception message.

### Using with Result Pattern

All notification service methods return `Result<T, NotificationError>`:

```typescript
import { notificationService } from '@/lib/notifications/notification-service';

const result = await notificationService.create({
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed',
  body: 'Your appointment is confirmed',
});

if (result.ok) {
  console.log(`Notification created: ${result.value.id}`);
} else {
  // Type-safe error handling
  switch (result.error.type) {
    case 'USER_NOT_FOUND':
      console.error(`User ${result.error.userId} not found`);
      break;
    case 'RATE_LIMITED':
      console.error(`Rate limited, retry after ${result.error.retryAfter}s`);
      break;
    case 'DATABASE_ERROR':
      console.error(`Database error: ${result.error.message}`);
      break;
    default:
      // TypeScript ensures exhaustive checking
      const _exhaustive: never = result.error;
  }
}
```

### API Response Formatting

Use `formatErrorResponse()` to format errors for HTTP responses:

```typescript
import { formatErrorResponse } from '@/lib/notifications/errors';

// In Next.js API route
if (!result.ok) {
  const errorResponse = formatErrorResponse(result.error);
  return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
}
```

Or use `toNextResponse()` helper:

```typescript
import { toNextResponse } from '@/lib/notifications/errors';

if (!result.ok) {
  const { status, body } = toNextResponse(result.error);
  return NextResponse.json(body, { status });
}
```

Example response:

```json
{
  "error": "RATE_LIMITED",
  "message": "Too many notifications sent. Please try again in 60 seconds.",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "statusCode": 429,
  "details": {
    "retryAfter": 60,
    "limit": 100
  }
}
```

## Error Checking Utilities

### Check if Retryable

```typescript
import { isRetryableError, getRetryDelay } from '@/lib/notifications/errors';

if (isRetryableError(error)) {
  const delayMs = getRetryDelay(error, attemptNumber);
  if (delayMs) {
    await scheduleRetry(notificationId, delayMs);
  }
}
```

### Check Error Category

```typescript
import { isUserError, isServerError } from '@/lib/notifications/errors';

if (isUserError(error)) {
  // User's fault - log at debug level
  logger.debug('User error occurred', { error });
} else if (isServerError(error)) {
  // Server's fault - log at error level, alert monitoring
  logger.error('Server error occurred', { error });
  alertOncall(error);
}
```

### Get HTTP Status Code

```typescript
import { getErrorStatusCode } from '@/lib/notifications/errors';

const statusCode = getErrorStatusCode(error); // 404, 429, 500, etc.
```

### Get User-Friendly Message

```typescript
import { getUserFriendlyMessage } from '@/lib/notifications/errors';

const message = getUserFriendlyMessage(error);
// "User not found. Please check your account."
// "Too many notifications sent. Please try again in 60 seconds."
```

## Retry Logic

The system automatically determines retry behavior:

### Exponential Backoff

For `DATABASE_ERROR`, `QUEUE_ERROR`, `INTERNAL_ERROR`:

- Retry 1: 1 second
- Retry 2: 2 seconds
- Retry 3: 4 seconds
- Retry 4: 8 seconds
- Retry 5: 16 seconds

### Rate Limiting

For `RATE_LIMITED`:

- Retry after `retryAfter` seconds (specified by rate limiter)

### Delivery Errors with Jitter

For `DELIVERY_ERROR` (when `retryable: true`):

- Exponential backoff with random jitter (0-1000ms)
- Prevents thundering herd problem

### Non-Retryable

The following errors are **never** retried:

- `USER_NOT_FOUND`
- `NOTIFICATION_NOT_FOUND`
- `INVALID_INPUT`
- `UNAUTHORIZED`
- `EXPIRED`
- `TOKEN_VALIDATION_ERROR`
- `TEMPLATE_ERROR`
- `PREFERENCE_ERROR`
- `DELIVERY_ERROR` (when `retryable: false`)

## Zod Validation Integration

Convert Zod validation errors to NotificationError:

```typescript
import { fromZodError } from '@/lib/notifications/errors';
import { createNotificationSchema } from '@/lib/schemas/notification.schema';

const validation = createNotificationSchema.safeParse(input);

if (!validation.success) {
  return err(fromZodError(validation.error));
}
```

## Correlation IDs

Every error includes a unique `correlationId` (UUID v4) for:

- Tracking errors across service boundaries
- Correlating logs in monitoring tools
- Debugging user-reported issues

Example:

```typescript
const error = createNotificationError('DATABASE_ERROR', 'Query failed', {
  operation: 'create',
});

console.log(error.correlationId); // "550e8400-e29b-41d4-a716-446655440000"
```

Search logs by correlation ID:

```bash
kubectl logs -l app=notification-service | grep "550e8400-e29b-41d4-a716-446655440000"
```

## Best Practices

### 1. Always Use Result Pattern

```typescript
// ✅ Good: Explicit error handling
async function createNotification(): Promise<Result<Notification, NotificationError>> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return err(createNotificationError('USER_NOT_FOUND', 'User not found', { userId }));
  }

  return ok(notification);
}

// ❌ Bad: Throwing exceptions
async function createNotification(): Promise<Notification> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found'); // Don't do this!
  }

  return notification;
}
```

### 2. Provide Context

```typescript
// ✅ Good: Include relevant context
return err(
  createNotificationError('DATABASE_ERROR', 'Failed to save notification', {
    operation: 'create',
    userId: input.userId,
    notificationType: input.type,
    originalError: error,
  })
);

// ❌ Bad: Missing context
return err(
  createNotificationError('DATABASE_ERROR', 'Failed to save notification', {})
);
```

### 3. Use Exhaustive Matching

```typescript
// ✅ Good: TypeScript ensures all cases are handled
function handleError(error: NotificationError): void {
  switch (error.type) {
    case 'USER_NOT_FOUND':
      // Handle...
      break;
    case 'RATE_LIMITED':
      // Handle...
      break;
    // ... all cases
    default:
      const _exhaustive: never = error; // Compile error if case is missing
  }
}
```

### 4. Don't Expose Internal Details

```typescript
// ✅ Good: Sanitized message for users
const message = getUserFriendlyMessage(error);
// "An error occurred. Please try again later."

// ❌ Bad: Exposing internal details
const message = error.originalError;
// "PostgreSQL connection failed: password authentication failed for user 'admin'"
```

### 5. Log Appropriately

```typescript
import { logNotificationError } from '@/lib/notifications/errors';

// Automatically logs at correct level based on error type
logNotificationError(error, { userId, operation: 'create' });

// Server errors → logger.error()
// User errors → logger.warn()
// Others → logger.info()
```

## Testing

All error classes have 100% test coverage. See `__tests__/lib/notifications/errors.test.ts`.

Run tests:

```bash
npm test -- __tests__/lib/notifications/errors.test.ts
```

Example test:

```typescript
it('should create RATE_LIMITED error with retryAfter', () => {
  const error = createNotificationError('RATE_LIMITED', 'Too many requests', {
    userId: 'user-123',
    retryAfter: 120,
    limit: 50,
  });

  expect(error).toMatchObject({
    type: 'RATE_LIMITED',
    message: 'Too many requests',
    userId: 'user-123',
    retryAfter: 120,
    limit: 50,
  });
  expect(error.correlationId).toMatch(/^[0-9a-f-]{36}$/);
});
```

## Migration from Old Error Format

Old format (deprecated):

```typescript
export interface NotificationServiceError {
  code: 'USER_NOT_FOUND' | 'RATE_LIMITED' | ...;
  message: string;
  details?: unknown;
}
```

New format:

```typescript
type NotificationError = { type: 'USER_NOT_FOUND'; ... } | { type: 'RATE_LIMITED'; ... } | ...
```

The notification-service.ts has been fully migrated to use the new error classes.

## Further Reading

- [Result Pattern Implementation](/lib/result.ts)
- [Auth Error Handling](/lib/auth/errors.ts) - Similar pattern used for auth
- [Notification Service](/lib/notifications/notification-service.ts) - Usage examples
