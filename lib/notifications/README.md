# Notification System

## Overview

The Massava notification system provides a robust, type-safe, multi-channel notification service for both studio owners and customers. It supports real-time in-app notifications, email delivery, and push notifications with fine-grained user preference management and intelligent rate limiting.

### Key Features

- **Multi-channel delivery**: In-app (WebSocket), Email (Resend), Push notifications (Firebase Cloud Messaging)
- **Real-time notifications**: WebSocket-based in-app messaging with fallback to polling
- **Scheduled delivery**: Delayed notifications for optimal delivery timing
- **User preferences**: Granular control per notification type and per channel
- **Rate limiting**: Redis-backed spam prevention with per-user and per-type limits
- **Quiet hours**: Respect user timezone-aware quiet hours settings
- **Idempotency**: Prevent duplicate notifications on retry
- **Template rendering**: German language templates with metadata substitution
- **Error handling**: Discriminated union error types with correlation IDs
- **Type safety**: Full TypeScript support with Zod validation
- **Security**: XSS prevention through content sanitization

### Tech Stack

- **Task Queue**: [QStash](https://upstash.com/docs/qstash/overview) (serverless message queue)
- **Caching**: [Upstash Redis](https://upstash.com/docs/redis/overview) (rate limiting, token validation)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Email**: Resend (configured separately)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schemas

---

## Architecture

### Component Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    API Routes / Server Actions               │
│              (Handle incoming requests)                      │
└──────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              NotificationService (Core Service)              │
│  • Create notification with validation                       │
│  • Check user preferences & quiet hours                      │
│  • Apply rate limiting                                       │
│  • Render templates                                          │
│  • Queue for delivery via QStash                            │
└──────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    QStash Message Queue                       │
│        (Async processing, retries, dead-letter handling)     │
└──────────────────────────┬───────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
        ┌──────────────┐    ┌──────────────────┐
        │  Delivery    │    │  Channel Router  │
        │  Processor   │    │  (per-channel)   │
        └──────────────┘    └──────────────────┘
                │                   │
        ┌───────┼─────────┐────────┬┴────────┐
        │       │         │        │         │
        ▼       ▼         ▼        ▼         ▼
      Email   Push    In-App   Status    Database
     (Resend) (FCM) (WebSocket) Updates   Updates
```

### Data Flow

1. **Creation**: Service action creates notification via `NotificationService.create()`
2. **Validation**: Input validated against Zod schemas
3. **Preference Checking**: Determine target channels based on user preferences
4. **Preference Checking**: Check if user has notifications enabled for that type
5. **Quiet Hours**: Defer delivery if in user's quiet hours (with scheduled callback)
6. **Rate Limiting**: Enforce per-user and per-type limits (URGENT priority bypasses)
7. **Sanitization**: Strip HTML, escape special characters, validate URLs
8. **Template Rendering**: Interpolate user metadata (studio name, booking time, etc.)
9. **Queuing**: Push to QStash with idempotency key
10. **Delivery**: QStash routes to appropriate channels
11. **Tracking**: Status updates stored in database with history

### Channel Delivery

#### In-App Notifications
- Delivered via WebSocket for real-time display in notification center
- Fallback to polling if WebSocket unavailable
- Stored in database for history and retrieval
- Status: `DELIVERED` on user fetch

#### Email Notifications
- Sent via Resend email service
- HTML template with branded styling
- Support for markdown in email body
- Status updated on delivery webhooks

#### Push Notifications
- Firebase Cloud Messaging (FCM) for mobile apps
- Device token validation before send
- Retry on delivery failure
- Status: `DELIVERED` or `FAILED` based on FCM response

---

## Directory Structure

```
lib/notifications/
├── README.md                          # This file
├── notification-service.ts            # Core notification service (create, process, deliver)
├── notification-types.ts              # Type definitions (Prisma enums, interfaces)
├── notification-templates.ts          # German language templates for all notification types
├── notification-metadata.ts           # Metadata type definitions per notification type
├── errors.ts                          # Discriminated union error types with correlation IDs
├── deletion-notifier.tsx              # React component for deletion confirmation notifications
│
└── utils/                             # Helper utilities
    ├── idempotency.ts                 # Generates idempotency keys to prevent duplicates
    ├── json-helpers.ts                # Type-safe JSON parsing for Prisma Json fields
    ├── metadata-guards.ts             # Runtime type guards for metadata validation
    ├── preference-checker.ts           # Determines delivery channels based on user preferences
    ├── quiet-hours.ts                 # Timezone-aware quiet hours enforcement
    ├── rate-limiter.ts                # Redis-backed rate limiting (spam prevention)
    ├── sanitizer.ts                   # XSS prevention through content sanitization
    ├── token-validator.ts             # FCM device token validation
    └── README-SANITIZATION.md         # Detailed sanitization documentation
```

### Key Files

#### `notification-service.ts` - Core Service
Main service for all notification operations. Provides:
- `create()`: Create and queue a notification
- `processDelivery()`: Handle QStash async delivery
- `updateDeliveryStatus()`: Track delivery progress
- `getNotification()`: Retrieve notification with authorization
- `markAsRead()`: Update read status
- `delete()`: Remove notification
- Result<T, E> pattern for error handling

**Example**:
```typescript
const result = await notificationService.create({
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  metadata: {
    bookingId: 'booking-456',
    studioName: 'Studio XYZ',
    appointmentTime: '2025-01-15T14:30:00Z',
  },
});

if (!result.ok) {
  console.error(result.error); // Type-safe error
}
```

#### `notification-types.ts` - Type Definitions
Exports Prisma enums and interfaces:
- `NotificationType`: BOOKING_CONFIRMED, BOOKING_REJECTED, etc.
- `NotificationStatus`: PENDING, QUEUED, SENDING, DELIVERED, FAILED
- `NotificationChannel`: PUSH, EMAIL, IN_APP
- `NotificationPriority`: URGENT, HIGH, NORMAL, LOW
- `StatusHistoryEntry`: Track state transitions
- `TypePreference`: Per-type channel preferences
- `DEFAULT_TYPE_PREFERENCES`: Fallback preferences
- `DEFAULT_CHANNELS`: All channels if no preferences exist

#### `notification-templates.ts` - Template Rendering
German language templates for all notification types:
- `getNotificationTemplate()`: Render template with metadata
- Returns: `{ title: string; body: string; actionUrl: string }`
- Supports: Booking, Payment, Review, Security, System notifications
- **Security**: All outputs automatically sanitized before storage

**Metadata substitution example**:
```typescript
// Template: "Buchung bei {{studioName}} am {{appointmentTime}}"
// Metadata: { studioName: "Studio XYZ", appointmentTime: "14:30" }
// Output: "Buchung bei Studio XYZ am 14:30"
```

#### `errors.ts` - Error Types
Discriminated union of all possible errors:
- `USER_NOT_FOUND`: User doesn't exist in database
- `RATE_LIMITED`: Exceeded notification limit (includes `retryAfter`)
- `INVALID_INPUT`: Validation failed (includes `validationErrors`)
- `QUEUE_ERROR`: QStash submission failed
- `DATABASE_ERROR`: Prisma query failed
- `DELIVERY_ERROR`: Channel-specific failure (email, push, etc.)
- `TOKEN_VALIDATION_ERROR`: FCM token invalid or expired
- `NOTIFICATION_NOT_FOUND`: Notification doesn't exist
- `UNAUTHORIZED`: User not authorized to access notification
- `EXPIRED`: Notification expired before delivery
- `TEMPLATE_ERROR`: Template rendering failed
- `PREFERENCE_ERROR`: Preference checking failed
- `INTERNAL_ERROR`: Unexpected error

All errors include `correlationId` for tracing.

#### `utils/` - Helper Functions

| File | Purpose |
|------|---------|
| `idempotency.ts` | Generate deterministic keys from userId + type + time window to prevent duplicates on retry |
| `json-helpers.ts` | Parse/serialize Prisma Json fields with Zod validation |
| `metadata-guards.ts` | Runtime type guards (e.g., `assertBookingMetadata()`) |
| `preference-checker.ts` | Determine which channels to use based on user preferences |
| `quiet-hours.ts` | Check if current time is within user's quiet hours (timezone-aware) |
| `rate-limiter.ts` | Redis-backed rate limiting: 100 total/hour, 10 per-type/hour |
| `sanitizer.ts` | Strip HTML tags, escape special chars, validate URLs, enforce length limits |
| `token-validator.ts` | Validate Firebase Cloud Messaging device tokens |

---

## Usage Examples

### Creating a Notification

```typescript
import { notificationService } from '@/lib/notifications/notification-service';

// Simple notification
const result = await notificationService.create({
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking confirmed',
  body: 'Your booking has been accepted.',
  metadata: {
    bookingId: 'booking-456',
    studioName: 'Studio XYZ',
    appointmentTime: '2025-01-15T14:30:00Z',
  },
});

if (!result.ok) {
  // Handle error with full type safety
  if (result.error.type === 'RATE_LIMITED') {
    console.log(`Retry after ${result.error.retryAfter}ms`);
  } else if (result.error.type === 'INVALID_INPUT') {
    console.log('Validation errors:', result.error.validationErrors);
  }
  return;
}

console.log('Notification created:', result.data.id);
```

### Processing Deliveries (QStash Webhook)

```typescript
// app/api/webhooks/notifications/route.ts
import { notificationService } from '@/lib/notifications/notification-service';

export async function POST(req: Request) {
  const payload = await req.json();

  const result = await notificationService.processDelivery(payload);

  if (!result.ok) {
    // Log error and let QStash retry
    console.error('Delivery failed:', result.error);
    return new Response('Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
```

### Checking User Preferences

```typescript
import { checkUserPreferences } from '@/lib/notifications/utils/preference-checker';

const preferences = await checkUserPreferences(
  userId,
  'BOOKING_CONFIRMED'
);

// channels: ['PUSH', 'EMAIL', 'IN_APP'] or subset based on user prefs
console.log('Delivery channels:', preferences.channels);
```

### Handling Rate Limiting

```typescript
import { isRateLimited } from '@/lib/notifications/utils/rate-limiter';

const result = await isRateLimited(userId, 'BOOKING_CONFIRMED');

if (result.limited) {
  console.log(`Rate limited. Retry after ${result.retryAfter}ms`);
  // Defer notification delivery
  return;
}

// Proceed with notification
```

### Handling Quiet Hours

```typescript
import { isInQuietHours, getQuietHoursEndTime } from '@/lib/notifications/utils/quiet-hours';

const inQuietHours = isInQuietHours(
  userPreferences.quietHours,
  userPreferences.timezone
);

if (inQuietHours) {
  // Schedule delivery until quiet hours end
  const endTime = getQuietHoursEndTime(
    userPreferences.quietHours,
    userPreferences.timezone
  );
  console.log(`In quiet hours until ${endTime}`);
}
```

### Managing User Preferences

```typescript
import { prisma } from '@/lib/prisma';

// Update notification preferences
await prisma.notificationPreference.update({
  where: { userId },
  data: {
    pushEnabled: true,
    emailEnabled: false,
    inAppEnabled: true,
    typePreferences: {
      BOOKING_CONFIRMED: {
        push: true,
        email: false,
        inApp: true,
      },
      BOOKING_REJECTED: {
        push: true,
        email: true,
        inApp: true,
      },
    },
  },
});
```

---

## Configuration

### Environment Variables

**Required**:
```bash
# QStash Configuration
QSTASH_CURRENT_SIGNING_KEY=<key>
QSTASH_NEXT_SIGNING_KEY=<key>
QSTASH_TOKEN=<token>

# Redis Configuration (Upstash)
UPSTASH_REDIS_URL=https://<project>.upstash.io
UPSTASH_REDIS_TOKEN=<token>

# Firebase Configuration
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_PRIVATE_KEY=<private-key>
FIREBASE_CLIENT_EMAIL=<service-account-email>

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/massava
```

**Optional**:
```bash
# Email Configuration (Resend)
RESEND_API_KEY=<api-key>
RESEND_FROM_EMAIL=notifications@example.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Notification Defaults
DEFAULT_NOTIFICATION_TTL_DAYS=30  # How long to keep notifications
NOTIFICATION_RATE_LIMIT_WINDOW=3600  # Rate limit window in seconds
```

### Feature Flags

```typescript
// lib/notifications/config.ts
export const NOTIFICATION_CONFIG = {
  enablePushNotifications: process.env.ENABLE_PUSH === 'true',
  enableEmailNotifications: process.env.ENABLE_EMAIL === 'true',
  enableInAppNotifications: process.env.ENABLE_IN_APP === 'true',
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  enableQuietHours: process.env.ENABLE_QUIET_HOURS !== 'false',
};
```

---

## Testing

### Running Tests

```bash
# Run all notification tests
npm test -- lib/notifications

# Run with coverage
npm test -- lib/notifications --coverage

# Run specific test file
npm test -- lib/notifications/notification-service.test.ts

# Watch mode
npm test -- lib/notifications --watch
```

### Test Coverage

Target: **100% coverage** for:
- notification-service.ts
- utils/*.ts

**Currently implemented tests**:
- ✅ Service creation and queuing
- ✅ Preference checking
- ✅ Rate limiting
- ✅ Quiet hours logic
- ✅ Content sanitization
- ✅ Template rendering
- ✅ Error handling
- ✅ Integration tests with Prisma
- ✅ E2E tests with QStash

### Test Structure

```typescript
// __tests__/notifications/notification-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationService } from '@/lib/notifications/notification-service';

describe('NotificationService', () => {
  describe('create()', () => {
    it('should create notification with valid input', async () => {
      // Test implementation
    });

    it('should return rate limit error when limit exceeded', async () => {
      // Test implementation
    });

    it('should sanitize content before storage', async () => {
      // Test implementation
    });
  });

  describe('processDelivery()', () => {
    it('should process QStash webhook', async () => {
      // Test implementation
    });
  });
});
```

---

## Related Documentation

### API Documentation
- **OpenAPI Spec**: `/docs/notifications/openapi.yaml`
  - All notification endpoints with request/response schemas
  - Error codes and response examples
  - Rate limit headers

### Architecture Documents
- **Feature Plan**: `/docs/notifications-feature-plan.md`
  - Requirements and timeline
  - Phased implementation roadmap
  - Success metrics

- **Architecture Overview**: `/docs/notifications/01-architecture-overview.md`
  - System design deep dive
  - Service interactions
  - Deployment topology

- **API Quick Reference**: `/docs/notifications/API_QUICK_REFERENCE.md`
  - Common API patterns
  - Request/response examples
  - Error handling patterns

- **API Examples**: `/docs/notifications/API_EXAMPLES.md`
  - Real-world usage examples
  - Integration patterns
  - Best practices

### Implementation Guides
- **Backend Services**: `/docs/notifications/03-backend-services.md`
  - QStash integration
  - Firebase Cloud Messaging setup
  - Email template configuration

- **Push Notifications**: `/docs/notifications/04-push-notifications.md`
  - FCM device token management
  - Token validation flow
  - Troubleshooting

- **Type Safety**: `/docs/notifications/TYPE_SAFETY_EXAMPLES.md`
  - Discriminated union error handling
  - Metadata type guards
  - Zod schema validation

- **Rate Limiting**: `/docs/notifications/RATE_LIMITING_IMPLEMENTATION.md`
  - Two-tier rate limiting strategy
  - Redis key design
  - URGENT priority bypass

- **Token Validation**: `/docs/notifications/token-validation.md`
  - Device token validation flow
  - FCM token refresh
  - Handling expired tokens

- **Error Handling**: `/docs/notifications/errors.md`
  - Error type reference
  - Correlation ID tracking
  - Logging best practices

### Edge Cases & Testing
- **Edge Case Coverage**: `/docs/notifications/edge-case-test-coverage.md`
  - Rate limiting edge cases
  - Timezone boundary conditions
  - Quiet hours transitions
  - Unicode handling

---

## Best Practices

### Error Handling

Always use the Result pattern and exhaustively match error types:

```typescript
const result = await notificationService.create(input);

if (!result.ok) {
  switch (result.error.type) {
    case 'RATE_LIMITED':
      // Return 429 with Retry-After header
      break;
    case 'USER_NOT_FOUND':
      // Return 404
      break;
    case 'INVALID_INPUT':
      // Return 400 with validation errors
      break;
    default:
      // Log and return 500
      logger.error('Notification error', result.error);
  }
}
```

### Content Sanitization

Never trust user-provided content in notification metadata:

```typescript
// ❌ DON'T: Store unsanitized user input
const notification = await create({
  body: userInput.comment, // Unsafe!
});

// ✅ DO: Use metadata guards and sanitization
import { assertReviewMetadata } from '@/lib/notifications/utils/metadata-guards';

const metadata = assertReviewMetadata(input.metadata);
const notification = await create({
  metadata, // Sanitized automatically
});
```

### Performance

1. **Use Server Actions**: Mutations are CSRF-protected and type-safe
2. **Async Delivery**: QStash handles async processing and retries
3. **Caching**: Redis for rate limiting and token validation
4. **Batching**: Group notifications when possible (not implemented yet)

### Security

1. **Input Validation**: All inputs validated with Zod before processing
2. **Content Sanitization**: HTML stripped, special chars escaped, URLs validated
3. **Authorization**: Check user ownership before returning notifications
4. **Token Validation**: FCM tokens validated before storing
5. **Rate Limiting**: Prevent spam and abuse

---

## Troubleshooting

### Notifications Not Delivering

1. **Check user preferences**: Are notifications enabled for that type/channel?
2. **Check quiet hours**: Is user in quiet hours? (Check timezone)
3. **Check rate limiting**: Has user exceeded their limit? (Check Redis)
4. **Check Firebase tokens**: Are device tokens valid and not expired?
5. **Check logs**: Search for correlation ID in logs

### High Rate Limit Errors

- Per-user limit: 100 notifications/hour
- Per-type limit: 10 of same type/hour
- URGENT priority notifications bypass limits

Increase limits in configuration if needed, or implement exponential backoff in calling code.

### Template Rendering Failures

1. Check metadata keys match template placeholders
2. Ensure metadata type guards pass
3. Check Zod schema validation

### Firebase Token Issues

1. Validate token format with `validateFcmToken()`
2. Check token not expired (Firebase tokens expire periodically)
3. Ensure token matches current Firebase project
4. Check device permissions (iOS: Notification permission, Android: POST_NOTIFICATIONS)

---

## Contributing

### Adding New Notification Types

1. Add type to Prisma schema: `model NotificationType { ... }`
2. Create metadata schema in `/lib/schemas/notification.schema.ts`
3. Add type guard in `utils/metadata-guards.ts`
4. Add template in `notification-templates.ts` (German language)
5. Add tests in `__tests__/notifications/`
6. Update documentation

### Adding New Channels

1. Create new channel handler in service
2. Add to `NotificationChannel` enum
3. Implement delivery logic
4. Add tests
5. Update documentation

---

## License

Copyright (c) 2025 Roman Reinelt / RNLT Labs
All rights reserved.
