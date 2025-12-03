# Notification API Quick Reference

This document provides quick access to common API operations. For complete details, see `openapi.yaml`.

## Base URL

- **Production**: `https://api.massava.com`
- **Staging**: `https://staging-api.massava.com`
- **Local**: `http://localhost:3000`

## Authentication

All endpoints require a Bearer token (JWT):

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## Rate Limits

Rate limits are applied per-user per-endpoint:

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

---

## Core Endpoints

### Notifications

#### List Notifications
```bash
GET /api/notifications
  ?limit=20
  &cursor=<pagination_cursor>
  &status=DELIVERED,PENDING
  &type=BOOKING_CONFIRMED,BOOKING_REMINDER_CUSTOMER
```

**Response**:
```json
{
  "data": [{
    "id": "clh0z1j9d0000qz2lqz1z1z1z",
    "userId": "user123",
    "type": "BOOKING_CONFIRMED",
    "title": "Booking Confirmed",
    "body": "Your booking has been confirmed",
    "status": "DELIVERED",
    "channels": ["PUSH", "EMAIL", "IN_APP"],
    "priority": "HIGH",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:05:00Z"
  }],
  "pagination": {
    "cursor": "clh0z1j9d0000qz2lqz1z1z1z",
    "hasMore": false
  }
}
```

#### Get Single Notification
```bash
GET /api/notifications/{id}
```

#### Delete Notification
```bash
DELETE /api/notifications/{id}
```

#### Mark as Read
```bash
POST /api/notifications/read
Content-Type: application/json

{
  "notificationId": "clh0z1j9d0000qz2lqz1z1z1z"
}
```

#### Get Unread Count
```bash
GET /api/notifications/unread-count
```

**Response**:
```json
{
  "count": 5
}
```

#### Create Notification (Admin Only)
```bash
POST /api/notifications
Content-Type: application/json

{
  "userId": "user123",
  "type": "BOOKING_CONFIRMED",
  "title": "Booking Confirmed",
  "body": "Your booking for January 15 at 2:00 PM is confirmed",
  "channels": ["PUSH", "EMAIL", "IN_APP"],
  "priority": "HIGH",
  "metadata": {
    "bookingId": "booking456",
    "customerName": "John Doe",
    "serviceName": "Haircut",
    "appointmentTime": "2025-01-15T14:00:00Z",
    "studioName": "Studio XYZ",
    "studioId": "studio789"
  },
  "scheduledFor": "2025-01-15T10:00:00Z",
  "expiresAt": "2025-01-16T10:00:00Z",
  "idempotencyKey": "unique-key-123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "clh0z1j9d0000qz2lqz1z1z1z",
    "status": "PENDING"
  }
}
```

---

### Device Management

#### List Devices
```bash
GET /api/notifications/devices
```

**Response**:
```json
{
  "devices": [{
    "id": "device123",
    "userId": "user123",
    "token": "examplePushToken123456789",
    "platform": "IOS",
    "deviceName": "John's iPhone 15",
    "deviceModel": "iPhone15,2",
    "appVersion": "1.0.0",
    "osVersion": "17.2",
    "isActive": true,
    "lastUsedAt": "2025-01-15T10:00:00Z",
    "failureCount": 0,
    "createdAt": "2025-01-10T15:30:00Z"
  }]
}
```

#### Register Device
```bash
POST /api/notifications/devices
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "platform": "IOS",
  "deviceName": "John's iPhone 15",
  "deviceModel": "iPhone15,2",
  "appVersion": "1.0.0",
  "osVersion": "17.2"
}
```

**Token Format Requirements**:
- **iOS (APNs)**: 64-character hex string
- **Android (FCM)**: Base64-encoded token (1000+ chars)
- **Web**: Base64-encoded subscription key

**Response** (200 OK):
```json
{
  "device": {
    "id": "device123",
    "userId": "user123",
    "token": "examplePushToken123456789",
    "platform": "IOS",
    "isActive": true,
    "createdAt": "2025-01-10T15:30:00Z"
  }
}
```

**Validation Error** (422 Unprocessable Entity):
```json
{
  "error": "Invalid device token",
  "message": "Invalid APNs token format",
  "details": {
    "token": ["Invalid token format for platform IOS"]
  }
}
```

#### Delete Device
```bash
DELETE /api/notifications/devices/{id}
```

---

### Preferences

#### Get Preferences
```bash
GET /api/notifications/preferences
```

**Response**:
```json
{
  "id": "pref123",
  "userId": "user123",
  "pushEnabled": true,
  "emailEnabled": true,
  "inAppEnabled": true,
  "quietHoursEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "timezone": "Europe/Berlin",
  "emailDigestEnabled": true,
  "digestFrequency": "DAILY",
  "digestTime": "09:00",
  "language": "de",
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
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

#### Update Preferences
```bash
PATCH /api/notifications/preferences
Content-Type: application/json

{
  "pushEnabled": true,
  "emailEnabled": false,
  "quietHoursEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "timezone": "Europe/Berlin",
  "emailDigestEnabled": true,
  "digestFrequency": "DAILY",
  "digestTime": "09:00",
  "language": "de",
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

---

### Real-time Streaming (SSE)

#### Stream Notifications
```bash
GET /api/notifications/stream
```

**Client Setup** (JavaScript):
```javascript
const eventSource = new EventSource('/api/notifications/stream', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

// Listen for notifications
eventSource.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data);
  console.log('New notification:', notification);
});

// Listen for heartbeat (connection check)
eventSource.addEventListener('heartbeat', (event) => {
  console.log('Connection alive');
});

// Handle errors
eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event.data);
  eventSource.close();
});

// Close connection
eventSource.close();
```

**Event Types**:
- `notification`: New notification object
- `heartbeat`: Connection health check (every 30 seconds)
- `error`: Connection or processing error

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 422 | Unprocessable Entity (e.g., invalid token format) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Notification Types

**Studio Owner Notifications**:
- `BOOKING_REQUEST_RECEIVED`
- `BOOKING_CANCELLED_BY_CUSTOMER`
- `BOOKING_REMINDER_STUDIO`
- `PAYMENT_RECEIVED`
- `REVIEW_POSTED`
- `LOW_AVAILABILITY_ALERT`

**Customer Notifications**:
- `BOOKING_CONFIRMED`
- `BOOKING_REJECTED`
- `BOOKING_REMINDER_CUSTOMER`
- `BOOKING_CANCELLED_BY_STUDIO`
- `REVIEW_REQUEST`
- `STUDIO_PROMOTION`

**Security Notifications**:
- `ACCOUNT_LOGIN_NEW_DEVICE`
- `ACCOUNT_PASSWORD_CHANGED`
- `ACCOUNT_EMAIL_CHANGED`
- `ACCOUNT_TWO_FACTOR_ENABLED`
- `ACCOUNT_DELETION_SCHEDULED`
- `ACCOUNT_DELETION_CANCELLED`

**System Notifications**:
- `SYSTEM_MAINTENANCE`
- `FEATURE_ANNOUNCEMENT`
- `TERMS_UPDATE`
- `WELCOME`
- `ONBOARDING_REMINDER`
- `SUBSCRIPTION_EXPIRING`
- `SUBSCRIPTION_EXPIRED`

---

## Notification Status

| Status | Description |
|--------|-------------|
| PENDING | Created, waiting to be processed |
| QUEUED | Added to processing queue |
| SENDING | Currently being sent via channels |
| DELIVERED | Successfully delivered |
| FAILED | Delivery failed permanently |
| EXPIRED | Notification expired before delivery |
| ARCHIVED | Marked for archival (read and old) |

---

## Priority Levels

| Priority | Behavior |
|----------|----------|
| URGENT | Bypass quiet hours, highest priority |
| HIGH | Respect quiet hours, high priority |
| NORMAL | Standard delivery behavior |
| LOW | May be batched or delayed |

---

## Delivery Channels

| Channel | Description |
|---------|-------------|
| PUSH | Push notification (iOS/Android/Web) |
| EMAIL | Email delivery (instant or digest) |
| IN_APP | In-app notification center |

---

## Common Examples

### JavaScript - Register Device

```javascript
async function registerDevice() {
  const token = await getFirebaseToken(); // or APNs/Web Push token

  const response = await fetch('/api/notifications/devices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token,
      platform: 'ANDROID', // or 'IOS' or 'WEB'
      deviceName: 'My Device',
      appVersion: '1.0.0'
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Device registered:', data.device.id);
  } else if (response.status === 422) {
    console.error('Invalid token format');
  }
}
```

### JavaScript - Listen for Real-time Notifications

```javascript
function listenForNotifications(authToken) {
  const eventSource = new EventSource('/api/notifications/stream', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  eventSource.addEventListener('notification', (event) => {
    const notification = JSON.parse(event.data);

    // Update UI
    updateNotificationBadge(notification);
    showNotificationToast(notification);

    // Mark as read after 5 seconds
    setTimeout(() => {
      markAsRead(notification.id, authToken);
    }, 5000);
  });

  return eventSource;
}

async function markAsRead(notificationId, authToken) {
  await fetch('/api/notifications/read', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notificationId })
  });
}
```

### cURL - Create Notification (Admin)

```bash
curl -X POST https://api.massava.com/api/notifications \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "type": "BOOKING_CONFIRMED",
    "title": "Booking Confirmed",
    "body": "Your booking has been confirmed",
    "channels": ["PUSH", "EMAIL", "IN_APP"],
    "priority": "HIGH",
    "metadata": {
      "bookingId": "booking456",
      "customerName": "John Doe",
      "serviceName": "Haircut",
      "appointmentTime": "2025-01-15T14:00:00Z",
      "studioName": "Studio XYZ",
      "studioId": "studio789"
    }
  }'
```

### cURL - Update Preferences

```bash
curl -X PATCH https://api.massava.com/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "emailDigestEnabled": true,
    "digestFrequency": "DAILY",
    "digestTime": "09:00"
  }'
```

---

## Error Handling

**Standard Error Response**:
```json
{
  "error": "Error message",
  "message": "Additional details",
  "details": {
    "field": ["Error for field"]
  },
  "statusCode": 400
}
```

**Rate Limit Error**:
```json
{
  "error": "Too many requests",
  "statusCode": 429
}
```

**Authorization Error**:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Validation Error**:
```json
{
  "error": "Invalid request",
  "details": {
    "notificationId": ["notificationId must be a string"]
  }
}
```

---

## Pagination

Use cursor-based pagination for notification lists:

```javascript
// First request
const response1 = await fetch('/api/notifications?limit=20');
const data1 = await response1.json();

// If hasMore is true, use cursor for next page
if (data1.pagination.hasMore) {
  const response2 = await fetch(
    `/api/notifications?limit=20&cursor=${data1.pagination.cursor}`
  );
  const data2 = await response2.json();
}
```

---

## Best Practices

1. **Always include Authorization header** with valid JWT token
2. **Handle 429 responses** - respect Retry-After header
3. **Use cursor pagination** for large result sets
4. **Stream notifications** for real-time UX
5. **Validate device tokens** before registration
6. **Set quiet hours** to avoid midnight notifications
7. **Use scheduled delivery** for non-urgent notifications
8. **Implement error handling** for all API calls
9. **Monitor unread count** for badge display
10. **Close SSE connections** when no longer needed

---

## Support

- **API Docs**: See `openapi.yaml` for full specification
- **Architecture**: See `01-architecture-overview.md`
- **Examples**: See `03-backend-services.md`
- **Repository**: https://github.com/roman/massava
