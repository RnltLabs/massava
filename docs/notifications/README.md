# Notification API Documentation

Complete OpenAPI 3.0.3 specification and implementation guide for the Massava notification system.

## Overview

The Massava Notification API provides a comprehensive notification management system with support for:

- **Multiple Delivery Channels**: Push notifications, Email, In-app notifications
- **Real-time Streaming**: Server-Sent Events (SSE) for real-time updates
- **Device Management**: Push notification device token registration and management
- **Customizable Preferences**: Per-notification-type channel preferences with quiet hours
- **Notification Types**: 24+ notification types for different user scenarios
- **Scheduling**: Support for scheduled and delayed notifications
- **Email Digests**: Batch notifications into daily or weekly digests
- **Rate Limiting**: API rate limits to prevent abuse
- **Authentication**: JWT bearer token authentication

## Quick Links

### Documentation Files

| Document | Purpose |
|----------|---------|
| [`openapi.yaml`](./openapi.yaml) | Complete OpenAPI 3.0.3 specification (1595 lines) |
| [`API_QUICK_REFERENCE.md`](./API_QUICK_REFERENCE.md) | Quick reference guide for all endpoints and status codes |
| [`SWAGGER_INTEGRATION.md`](./SWAGGER_INTEGRATION.md) | Setup instructions for Swagger UI and alternative tools |
| [`API_EXAMPLES.md`](./API_EXAMPLES.md) | Real-world code examples in multiple languages |
| [`README.md`](./README.md) | This file |

## API Endpoints

### Notification Management

```
GET     /api/notifications              # List user notifications
POST    /api/notifications              # Create notification (Admin)
GET     /api/notifications/{id}         # Get single notification
DELETE  /api/notifications/{id}         # Delete notification
POST    /api/notifications/read         # Mark as read
GET     /api/notifications/unread-count # Get unread count
GET     /api/notifications/stream       # Real-time SSE stream
```

### Device Management

```
GET     /api/notifications/devices      # List registered devices
POST    /api/notifications/devices      # Register device token
DELETE  /api/notifications/devices/{id} # Unregister device
```

### Preferences

```
GET     /api/notifications/preferences  # Get preferences
PATCH   /api/notifications/preferences  # Update preferences
```

## Quick Start

### 1. View API Documentation

**Option A: Online (Instant)**
1. Go to https://editor.swagger.io/
2. Import this file: `docs/notifications/openapi.yaml`
3. Explore the interactive documentation

**Option B: Local Setup**
See [SWAGGER_INTEGRATION.md](./SWAGGER_INTEGRATION.md) for self-hosted options.

### 2. List Notifications

```bash
curl -X GET https://api.massava.com/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Register Device for Push

```bash
curl -X POST https://api.massava.com/api/notifications/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-device-token",
    "platform": "IOS",
    "deviceName": "John'\''s iPhone"
  }'
```

### 4. Stream Real-time Notifications

```javascript
const eventSource = new EventSource('/api/notifications/stream', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

eventSource.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data);
  console.log('New notification:', notification);
});
```

### 5. Update Preferences

```bash
curl -X PATCH https://api.massava.com/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "emailDigestEnabled": true,
    "digestFrequency": "DAILY"
  }'
```

## Notification Types

### Studio Owner Notifications
- `BOOKING_REQUEST_RECEIVED` - New booking request (URGENT)
- `BOOKING_CANCELLED_BY_CUSTOMER` - Booking cancelled by customer (HIGH)
- `BOOKING_REMINDER_STUDIO` - Upcoming booking reminder (NORMAL)
- `PAYMENT_RECEIVED` - Payment received (NORMAL)
- `REVIEW_POSTED` - New review posted (LOW)
- `LOW_AVAILABILITY_ALERT` - Low availability warning (NORMAL)

### Customer Notifications
- `BOOKING_CONFIRMED` - Booking confirmed (HIGH)
- `BOOKING_REJECTED` - Booking rejected (HIGH)
- `BOOKING_REMINDER_CUSTOMER` - Booking reminder (URGENT)
- `BOOKING_CANCELLED_BY_STUDIO` - Cancelled by studio (HIGH)
- `REVIEW_REQUEST` - Request to review (LOW)
- `STUDIO_PROMOTION` - Studio promotion (LOW)

### Security Notifications
- `ACCOUNT_LOGIN_NEW_DEVICE` - New device login (HIGH)
- `ACCOUNT_PASSWORD_CHANGED` - Password changed (HIGH)
- `ACCOUNT_EMAIL_CHANGED` - Email changed (HIGH)
- `ACCOUNT_TWO_FACTOR_ENABLED` - 2FA enabled (NORMAL)
- `ACCOUNT_DELETION_SCHEDULED` - Account deletion scheduled (HIGH)
- `ACCOUNT_DELETION_CANCELLED` - Deletion cancelled (NORMAL)

### System Notifications
- `SYSTEM_MAINTENANCE` - System maintenance (NORMAL)
- `FEATURE_ANNOUNCEMENT` - Feature announcement (LOW)
- `TERMS_UPDATE` - Terms updated (NORMAL)
- `WELCOME` - Welcome message (LOW)
- `ONBOARDING_REMINDER` - Onboarding reminder (LOW)
- `SUBSCRIPTION_EXPIRING` - Subscription expiring (HIGH)
- `SUBSCRIPTION_EXPIRED` - Subscription expired (URGENT)

## Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request processed successfully |
| 201 | Created | Notification created successfully |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions (admin-only) |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable Entity | Invalid token format for platform |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Rate Limits

All endpoints are rate-limited per user:

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET `/api/notifications` | 100 req | 1 minute |
| POST `/api/notifications` | 20 req | 1 minute |
| GET `/api/notifications/{id}` | 100 req | 1 minute |
| DELETE `/api/notifications/{id}` | 50 req | 1 minute |
| POST `/api/notifications/read` | 100 req | 1 minute |
| GET `/api/notifications/unread-count` | 200 req | 1 minute |
| POST `/api/notifications/devices` | 10 req | 1 minute |
| DELETE `/api/notifications/devices/{id}` | 50 req | 1 minute |
| GET `/api/notifications/stream` | 5 concurrent | N/A |

**Rate Limit Headers**:
- `X-RateLimit-Limit`: Request ceiling
- `X-RateLimit-Remaining`: Requests left in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait (429 responses)

## Authentication

All endpoints require a Bearer token (JWT):

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## Features

### 1. Real-time Notifications

Server-Sent Events (SSE) provides real-time notification delivery:

```javascript
const eventSource = new EventSource('/api/notifications/stream', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

eventSource.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data);
  // Handle notification
});

eventSource.addEventListener('heartbeat', () => {
  // Connection alive check
});
```

### 2. Push Notifications

Register device tokens to receive push notifications:

**iOS** (APNs):
- 64-character hexadecimal string
- Obtained from Apple Push Notification service

**Android** (FCM):
- Base64-encoded Firebase Cloud Messaging token
- Obtained from Firebase Cloud Messaging

**Web**:
- Base64-encoded Web Push subscription key
- Obtained from Web Push API

### 3. Email Notifications

Support for both instant and digest emails:

- **Instant**: Sent immediately when notification is created
- **Digest**: Batched and sent daily or weekly

### 4. Notification Preferences

Fine-grained control over notification delivery:

```json
{
  "pushEnabled": true,
  "emailEnabled": true,
  "inAppEnabled": true,
  "quietHoursEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "emailDigestEnabled": true,
  "digestFrequency": "DAILY",
  "typePreferences": {
    "BOOKING_CONFIRMED": {
      "push": true,
      "email": "instant",
      "inApp": true
    },
    "STUDIO_PROMOTION": {
      "push": false,
      "email": "digest",
      "inApp": false
    }
  }
}
```

### 5. Quiet Hours

Prevent notifications during specific hours (respects timezone):

- Set start and end times
- Only applies to non-URGENT notifications
- Highly configurable per user

### 6. Scheduling

Schedule notifications for future delivery:

```bash
{
  "userId": "user123",
  "type": "BOOKING_REMINDER_CUSTOMER",
  "title": "Booking Reminder",
  "body": "Your booking is tomorrow",
  "scheduledFor": "2025-01-15T09:00:00Z"
}
```

### 7. Metadata

Store type-specific metadata with notifications:

```json
{
  "type": "BOOKING_CONFIRMED",
  "metadata": {
    "bookingId": "booking123",
    "customerName": "John Doe",
    "serviceName": "Haircut",
    "appointmentTime": "2025-01-15T14:00:00Z",
    "studioName": "Studio XYZ",
    "studioId": "studio789"
  }
}
```

## Database Schema

### Notification Model
- `id`: Unique identifier (CUID)
- `userId`: Recipient user ID
- `type`: Notification type (enum)
- `title`: Notification title
- `body`: Notification body
- `status`: Current status (PENDING, QUEUED, SENDING, DELIVERED, FAILED, EXPIRED, ARCHIVED)
- `channels`: Delivery channels (PUSH, EMAIL, IN_APP)
- `priority`: Priority level (URGENT, HIGH, NORMAL, LOW)
- `metadata`: Type-specific metadata (JSON)
- `statusHistory`: Status change history (JSON)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### DeviceToken Model
- `id`: Unique identifier (CUID)
- `userId`: User ID
- `token`: Device token (platform-specific)
- `platform`: Platform (IOS, ANDROID, WEB)
- `deviceName`: Human-readable device name
- `deviceModel`: Device model identifier
- `appVersion`: App version
- `osVersion`: OS version
- `isActive`: Active status
- `lastUsedAt`: Last used timestamp
- `failureCount`: Consecutive delivery failures
- `lastFailureAt`: Last failure timestamp
- `createdAt`: Creation timestamp

### NotificationPreference Model
- `id`: Unique identifier (CUID)
- `userId`: User ID
- `pushEnabled`: Global push enable/disable
- `emailEnabled`: Global email enable/disable
- `inAppEnabled`: Global in-app enable/disable
- `quietHoursEnabled`: Quiet hours enable/disable
- `quietHoursStart`: Quiet hours start time (HH:MM)
- `quietHoursEnd`: Quiet hours end time (HH:MM)
- `timezone`: User timezone
- `typePreferences`: Per-type preferences (JSON)
- `emailDigestEnabled`: Email digest enable/disable
- `digestFrequency`: Digest frequency (DAILY, WEEKLY)
- `digestTime`: Digest send time (HH:MM)
- `language`: Preferred language
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Implementation Guides

### For Frontend Developers

See [`API_EXAMPLES.md`](./API_EXAMPLES.md) for:
- React hooks for notification management
- Vue 3 composition API examples
- Real-time streaming implementation
- Device registration examples
- Error handling patterns

### For Backend Developers

See [`API_EXAMPLES.md`](./API_EXAMPLES.md) for:
- Creating notifications from business logic
- Bulk notification sending
- Creating notification services
- Error handling strategies
- Testing patterns

### For DevOps / API Integration

See [`SWAGGER_INTEGRATION.md`](./SWAGGER_INTEGRATION.md) for:
- Swagger UI setup
- ReDoc integration
- Client code generation
- API validation
- CI/CD integration

## Testing

The OpenAPI specification includes:
- Complete request/response schemas
- Example values for all fields
- Validation rules (min/max, patterns, enums)
- Error response examples

Use the specification to:
1. Generate typed clients (TypeScript, Python, Java, etc.)
2. Validate API implementation
3. Generate mock servers for testing
4. Create integration tests

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Error message",
  "message": "Additional details",
  "details": {
    "field": ["Error message for field"]
  },
  "statusCode": 400
}
```

### Common Errors

**Invalid Token Format (422)**:
```json
{
  "error": "Invalid device token",
  "message": "Invalid APNs token format",
  "details": {
    "token": ["Invalid token format for platform IOS"]
  }
}
```

**Rate Limited (429)**:
```json
{
  "error": "Too many requests",
  "statusCode": 429
}
```

**Validation Error (400)**:
```json
{
  "error": "Invalid request",
  "details": {
    "notificationId": ["notificationId must be a string"]
  }
}
```

## Best Practices

### Client-Side

1. **Always include Authorization header** with valid JWT token
2. **Handle all error codes** - especially 429 (rate limited)
3. **Use cursor pagination** for notification lists
4. **Stream notifications** for better real-time UX
5. **Validate device tokens** before registration
6. **Set quiet hours** to respect user preferences
7. **Mark notifications as read** to track engagement
8. **Close SSE connections** when no longer needed
9. **Implement retry logic** with exponential backoff
10. **Monitor unread count** for badge display

### Server-Side

1. **Use idempotency keys** to prevent duplicate notifications
2. **Validate all input** with Zod schemas
3. **Log all operations** with correlation IDs
4. **Implement proper error handling** with meaningful messages
5. **Use scheduled delivery** for non-urgent notifications
6. **Respect quiet hours** in delivery logic
7. **Monitor delivery failures** and retry appropriately
8. **Clean up expired notifications** periodically
9. **Track status history** for audit trail
10. **Test with rate limiting** enabled

## Monitoring & Logging

Key metrics to monitor:

- **Delivery Rate**: % of notifications successfully delivered
- **Failure Rate**: % of notifications that failed
- **API Response Time**: Average response time per endpoint
- **Rate Limit Hits**: Number of rate limit violations
- **Device Token Errors**: Invalid or expired tokens
- **Email Bounce Rate**: % of emails bounced
- **Push Token Failures**: % of push tokens failing

## Architecture

```
┌─────────────────────────────────────────┐
│        Client Applications               │
│   (Web, iOS, Android)                   │
└────────────┬────────────────────────────┘
             │
    ┌────────▼────────────┐
    │  API Routes         │
    │  /api/notifications │
    └────────┬────────────┘
             │
    ┌────────▼────────────────┐
    │ Notification Service    │
    │ (Creation, Delivery)    │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │ Storage Layers          │
    │ - Database (Prisma)     │
    │ - Cache (Redis)         │
    │ - Queue (RabbitMQ)      │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │ Delivery Channels       │
    │ - Firebase (Push)       │
    │ - SendGrid (Email)      │
    │ - In-App Store          │
    └────────────────────────┘
```

## Support & Resources

### Documentation
- **OpenAPI Spec**: `openapi.yaml`
- **Quick Reference**: `API_QUICK_REFERENCE.md`
- **Examples**: `API_EXAMPLES.md`
- **Integration**: `SWAGGER_INTEGRATION.md`
- **Architecture**: `01-architecture-overview.md`
- **Database**: `02-database-schema.md`
- **Services**: `03-backend-services.md`

### External Resources
- **OpenAPI Spec**: https://spec.openapis.org/oas/v3.0.3
- **Swagger Editor**: https://editor.swagger.io/
- **Swagger UI**: https://github.com/swagger-api/swagger-ui
- **ReDoc**: https://github.com/Redocly/redoc
- **OpenAPI Generator**: https://openapi-generator.tech/

### Get Help
- **Repository**: https://github.com/roman/massava
- **Issues**: https://github.com/roman/massava/issues
- **Email**: dev@massava.com

## Changelog

### Version 1.0.0 (2025-01-15)

Initial release including:
- 11 API endpoints
- 24+ notification types
- Real-time SSE streaming
- Device token management
- Customizable preferences
- Complete OpenAPI 3.0.3 specification
- Comprehensive documentation
- Code examples for multiple languages
- Integration guides

## License

MIT License - See repository for details

---

**Last Updated**: 2025-01-15
**OpenAPI Version**: 3.0.3
**API Version**: 1.0.0
**Maintainer**: Massava Development Team
