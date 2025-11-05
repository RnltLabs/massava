# Business Portal API Documentation

## Overview

This document describes the API endpoints available for the Massava Business Portal. These endpoints are used internally by the business portal frontend and can also be used by third-party integrations with proper authentication.

**Base URL**: `https://massava.com/api/business`

**Authentication**: All endpoints require a valid session (cookie-based authentication via NextAuth).

**Authorization**: All endpoints require `STUDIO_OWNER` or `SUPER_ADMIN` role, and verify studio ownership for resource access.

## Table of Contents

1. [Authentication](#authentication)
2. [Bookings API](#bookings-api)
3. [Services API](#services-api)
4. [Statistics API](#statistics-api)
5. [Opening Hours API](#opening-hours-api)
6. [Calendar API](#calendar-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### Session-Based Authentication

All API requests must include a valid session cookie.

**Headers**:
```http
Cookie: next-auth.session-token=<session-token>
```

### Getting a Session

Sign in via the web interface at `/auth/signin` or use the authentication API:

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "your-password"
}
```

**Response**:
```json
{
  "user": {
    "id": "usr_123",
    "email": "owner@example.com",
    "name": "John Doe",
    "role": "STUDIO_OWNER"
  },
  "expires": "2025-12-04T10:00:00.000Z"
}
```

The session cookie is automatically set in the response.

### Checking Session

```http
GET /api/auth/session
```

**Response**:
```json
{
  "user": {
    "id": "usr_123",
    "email": "owner@example.com",
    "name": "John Doe",
    "role": "STUDIO_OWNER"
  },
  "expires": "2025-12-04T10:00:00.000Z"
}
```

---

## Bookings API

### List Bookings

Retrieve all bookings for the authenticated user's studio.

```http
GET /api/business/bookings
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `PENDING`, `CONFIRMED`, `DECLINED`, `CANCELLED`, `COMPLETED` |
| `startDate` | ISO 8601 | No | Filter bookings from this date (inclusive) |
| `endDate` | ISO 8601 | No | Filter bookings until this date (inclusive) |
| `serviceId` | string | No | Filter by specific service |
| `search` | string | No | Search by customer name, email, or service name |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 10, max: 100) |
| `sortBy` | string | No | Sort field: `createdAt`, `startTime`, `status` (default: `createdAt`) |
| `sortOrder` | string | No | Sort order: `asc`, `desc` (default: `desc`) |

#### Example Request

```http
GET /api/business/bookings?status=PENDING&startDate=2025-11-01&limit=20
```

#### Response (200 OK)

```json
{
  "bookings": [
    {
      "id": "bkg_123",
      "studioId": "stu_456",
      "serviceId": "srv_789",
      "customerId": "usr_321",
      "timeSlotId": "tsl_654",
      "status": "PENDING",
      "createdAt": "2025-11-03T14:30:00.000Z",
      "updatedAt": "2025-11-03T14:30:00.000Z",
      "service": {
        "id": "srv_789",
        "name": "Custom Tattoo Session",
        "duration": 60,
        "price": 150.00
      },
      "customer": {
        "id": "usr_321",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1234567890"
      },
      "timeSlot": {
        "id": "tsl_654",
        "startTime": "2025-11-05T14:00:00.000Z",
        "endTime": "2025-11-05T15:00:00.000Z",
        "isAvailable": false
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Example with cURL

```bash
curl -X GET \
  'https://massava.com/api/business/bookings?status=PENDING' \
  -H 'Cookie: next-auth.session-token=your-session-token'
```

#### Example with TypeScript

```typescript
async function getBookings(status?: string) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)

  const response = await fetch(`/api/business/bookings?${params}`, {
    credentials: 'include' // Include cookies
  })

  if (!response.ok) {
    throw new Error('Failed to fetch bookings')
  }

  return await response.json()
}

// Usage
const pendingBookings = await getBookings('PENDING')
```

### Get Booking by ID

Retrieve a specific booking's details.

```http
GET /api/business/bookings/{bookingId}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingId` | string | Yes | Booking ID |

#### Response (200 OK)

```json
{
  "id": "bkg_123",
  "studioId": "stu_456",
  "serviceId": "srv_789",
  "customerId": "usr_321",
  "timeSlotId": "tsl_654",
  "status": "PENDING",
  "notes": "Customer requested specific design elements",
  "createdAt": "2025-11-03T14:30:00.000Z",
  "updatedAt": "2025-11-03T14:30:00.000Z",
  "service": {
    "id": "srv_789",
    "name": "Custom Tattoo Session",
    "description": "Up to 2x2 inches, includes consultation",
    "duration": 60,
    "price": 150.00
  },
  "customer": {
    "id": "usr_321",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890"
  },
  "timeSlot": {
    "id": "tsl_654",
    "startTime": "2025-11-05T14:00:00.000Z",
    "endTime": "2025-11-05T15:00:00.000Z",
    "isAvailable": false
  }
}
```

### Update Booking Status

Update the status of a booking (confirm, decline, cancel, complete).

```http
PATCH /api/business/bookings/{bookingId}/status
Content-Type: application/json
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingId` | string | Yes | Booking ID |

#### Request Body

```json
{
  "status": "CONFIRMED",
  "reason": "Optional reason for decline/cancellation"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New status: `CONFIRMED`, `DECLINED`, `CANCELLED`, `COMPLETED` |
| `reason` | string | No | Reason for status change (shown to customer) |

#### Validation Rules

- `PENDING` → `CONFIRMED`: Allowed
- `PENDING` → `DECLINED`: Allowed (reason recommended)
- `CONFIRMED` → `CANCELLED`: Allowed (reason required)
- `CONFIRMED` → `COMPLETED`: Allowed
- `COMPLETED` → Any: Not allowed
- `DECLINED` → Any: Not allowed

#### Response (200 OK)

```json
{
  "id": "bkg_123",
  "status": "CONFIRMED",
  "updatedAt": "2025-11-04T10:15:00.000Z"
}
```

#### Example with cURL

```bash
curl -X PATCH \
  'https://massava.com/api/business/bookings/bkg_123/status' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=your-session-token' \
  -d '{
    "status": "CONFIRMED"
  }'
```

#### Example with TypeScript

```typescript
async function updateBookingStatus(
  bookingId: string,
  status: 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED',
  reason?: string
) {
  const response = await fetch(`/api/business/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ status, reason })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }

  return await response.json()
}

// Usage
await updateBookingStatus('bkg_123', 'CONFIRMED')
await updateBookingStatus('bkg_456', 'DECLINED', 'Unavailable at that time')
```

---

## Services API

### List Services

Retrieve all services for the authenticated user's studio.

```http
GET /api/business/services
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeInactive` | boolean | No | Include inactive services (default: false) |

#### Response (200 OK)

```json
{
  "services": [
    {
      "id": "srv_789",
      "studioId": "stu_456",
      "name": "Custom Tattoo Session",
      "description": "Up to 2x2 inches, includes consultation and aftercare kit",
      "duration": 60,
      "price": 150.00,
      "category": "Tattoo",
      "isActive": true,
      "createdAt": "2025-10-01T10:00:00.000Z",
      "updatedAt": "2025-10-01T10:00:00.000Z",
      "_count": {
        "bookings": 23
      }
    },
    {
      "id": "srv_790",
      "studioId": "stu_456",
      "name": "Consultation",
      "description": "Free 15-minute consultation",
      "duration": 15,
      "price": 0.00,
      "category": "Consultation",
      "isActive": true,
      "createdAt": "2025-10-01T10:00:00.000Z",
      "updatedAt": "2025-10-01T10:00:00.000Z",
      "_count": {
        "bookings": 8
      }
    }
  ]
}
```

### Get Service by ID

```http
GET /api/business/services/{serviceId}
```

#### Response (200 OK)

```json
{
  "id": "srv_789",
  "studioId": "stu_456",
  "name": "Custom Tattoo Session",
  "description": "Up to 2x2 inches, includes consultation and aftercare kit",
  "duration": 60,
  "price": 150.00,
  "category": "Tattoo",
  "isActive": true,
  "createdAt": "2025-10-01T10:00:00.000Z",
  "updatedAt": "2025-10-01T10:00:00.000Z"
}
```

### Create Service

```http
POST /api/business/services
Content-Type: application/json
```

#### Request Body

```json
{
  "name": "Custom Tattoo Session",
  "description": "Up to 2x2 inches, includes consultation and aftercare kit",
  "duration": 60,
  "price": 150.00,
  "category": "Tattoo"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 3-100 characters |
| `description` | string | No | Max 500 characters |
| `duration` | number | Yes | 5-480 minutes |
| `price` | number | Yes | >= 0 |
| `category` | string | No | Max 50 characters |

#### Response (201 Created)

```json
{
  "id": "srv_791",
  "studioId": "stu_456",
  "name": "Custom Tattoo Session",
  "description": "Up to 2x2 inches, includes consultation and aftercare kit",
  "duration": 60,
  "price": 150.00,
  "category": "Tattoo",
  "isActive": true,
  "createdAt": "2025-11-04T10:20:00.000Z",
  "updatedAt": "2025-11-04T10:20:00.000Z"
}
```

#### Example with TypeScript

```typescript
interface CreateServiceInput {
  name: string
  description?: string
  duration: number
  price: number
  category?: string
}

async function createService(data: CreateServiceInput) {
  const response = await fetch('/api/business/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }

  return await response.json()
}

// Usage
const newService = await createService({
  name: 'Custom Tattoo Session',
  description: 'Up to 2x2 inches',
  duration: 60,
  price: 150.00,
  category: 'Tattoo'
})
```

### Update Service

```http
PATCH /api/business/services/{serviceId}
Content-Type: application/json
```

#### Request Body

Any fields to update (all optional):

```json
{
  "name": "Updated Service Name",
  "price": 175.00
}
```

#### Response (200 OK)

```json
{
  "id": "srv_789",
  "studioId": "stu_456",
  "name": "Updated Service Name",
  "description": "Up to 2x2 inches, includes consultation and aftercare kit",
  "duration": 60,
  "price": 175.00,
  "category": "Tattoo",
  "isActive": true,
  "updatedAt": "2025-11-04T10:25:00.000Z"
}
```

### Delete Service

```http
DELETE /api/business/services/{serviceId}
```

#### Response (204 No Content)

Empty body on success.

#### Error (409 Conflict)

If service has active bookings:

```json
{
  "error": "CANNOT_DELETE",
  "message": "Cannot delete service with active bookings",
  "code": "SERVICE_HAS_BOOKINGS",
  "details": {
    "activeBookings": 5
  }
}
```

---

## Statistics API

### Get Dashboard Statistics

Retrieve aggregated statistics for the dashboard.

```http
GET /api/business/stats
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Time period: `today`, `week`, `month`, `year` (default: `month`) |

#### Response (200 OK)

```json
{
  "period": "month",
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-11-30T23:59:59.999Z",
  "stats": {
    "totalBookings": 45,
    "pendingBookings": 8,
    "confirmedBookings": 32,
    "completedBookings": 3,
    "cancelledBookings": 2,
    "declinedBookings": 0,
    "totalRevenue": 4800.00,
    "confirmedRevenue": 4200.00,
    "averageBookingValue": 106.67,
    "todayBookings": 3,
    "upcomingBookings": 15
  },
  "topServices": [
    {
      "serviceId": "srv_789",
      "serviceName": "Custom Tattoo Session",
      "bookingCount": 25,
      "revenue": 3750.00
    },
    {
      "serviceId": "srv_790",
      "serviceName": "Consultation",
      "bookingCount": 15,
      "revenue": 0.00
    }
  ],
  "bookingsByDay": [
    {
      "date": "2025-11-01",
      "count": 2,
      "revenue": 300.00
    },
    {
      "date": "2025-11-02",
      "count": 3,
      "revenue": 450.00
    }
    // ... more days
  ]
}
```

#### Example with TypeScript

```typescript
async function getDashboardStats(period: 'today' | 'week' | 'month' | 'year' = 'month') {
  const response = await fetch(`/api/business/stats?period=${period}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch statistics')
  }

  return await response.json()
}

// Usage
const monthStats = await getDashboardStats('month')
console.log(`Total revenue: $${monthStats.stats.totalRevenue}`)
```

---

## Opening Hours API

### Get Opening Hours

Retrieve the studio's weekly opening hours.

```http
GET /api/business/opening-hours
```

#### Response (200 OK)

```json
{
  "openingHours": [
    {
      "id": "oh_123",
      "studioId": "stu_456",
      "dayOfWeek": 1,
      "openTime": "10:00",
      "closeTime": "18:00",
      "isClosed": false
    },
    {
      "id": "oh_124",
      "studioId": "stu_456",
      "dayOfWeek": 2,
      "openTime": "10:00",
      "closeTime": "18:00",
      "isClosed": false
    },
    {
      "id": "oh_125",
      "studioId": "stu_456",
      "dayOfWeek": 0,
      "isClosed": true
    }
    // ... more days
  ]
}
```

**Day of Week**: 0 = Sunday, 1 = Monday, ..., 6 = Saturday

### Update Opening Hours

Update the weekly opening hours schedule.

```http
POST /api/business/opening-hours
Content-Type: application/json
```

#### Request Body

```json
{
  "openingHours": [
    {
      "dayOfWeek": 1,
      "openTime": "10:00",
      "closeTime": "18:00",
      "isClosed": false
    },
    {
      "dayOfWeek": 2,
      "openTime": "10:00",
      "closeTime": "20:00",
      "isClosed": false
    },
    {
      "dayOfWeek": 0,
      "isClosed": true
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dayOfWeek` | number | Yes | 0-6 (Sunday-Saturday) |
| `openTime` | string | Conditional | HH:MM format (required if not closed) |
| `closeTime` | string | Conditional | HH:MM format (required if not closed) |
| `isClosed` | boolean | Yes | Whether studio is closed this day |

#### Validation Rules

- Must provide all 7 days
- `openTime` must be before `closeTime`
- Times in 24-hour format (HH:MM)
- If `isClosed: true`, `openTime` and `closeTime` ignored

#### Response (200 OK)

```json
{
  "message": "Opening hours updated successfully",
  "openingHours": [
    // ... updated hours
  ]
}
```

#### Example with TypeScript

```typescript
interface OpeningHour {
  dayOfWeek: number
  openTime?: string
  closeTime?: string
  isClosed: boolean
}

async function updateOpeningHours(hours: OpeningHour[]) {
  const response = await fetch('/api/business/opening-hours', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ openingHours: hours })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }

  return await response.json()
}

// Usage
await updateOpeningHours([
  { dayOfWeek: 0, isClosed: true },
  { dayOfWeek: 1, openTime: '10:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 2, openTime: '10:00', closeTime: '18:00', isClosed: false },
  // ... more days
])
```

---

## Calendar API

### Get Calendar Events

Retrieve bookings formatted as calendar events.

```http
GET /api/business/calendar
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 | Yes | Start of calendar range |
| `endDate` | ISO 8601 | Yes | End of calendar range |
| `view` | string | No | View type: `day`, `week`, `month` (default: `week`) |

#### Response (200 OK)

```json
{
  "events": [
    {
      "id": "bkg_123",
      "title": "Jane Smith - Custom Tattoo Session",
      "start": "2025-11-05T14:00:00.000Z",
      "end": "2025-11-05T15:00:00.000Z",
      "status": "CONFIRMED",
      "color": "#22c55e",
      "booking": {
        "id": "bkg_123",
        "customer": {
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "service": {
          "name": "Custom Tattoo Session",
          "price": 150.00
        }
      }
    }
    // ... more events
  ],
  "availability": [
    {
      "date": "2025-11-05",
      "slots": [
        {
          "startTime": "2025-11-05T10:00:00.000Z",
          "endTime": "2025-11-05T11:00:00.000Z",
          "isAvailable": true
        },
        {
          "startTime": "2025-11-05T11:00:00.000Z",
          "endTime": "2025-11-05T12:00:00.000Z",
          "isAvailable": true
        }
      ]
    }
  ]
}
```

**Event Colors by Status**:
- `PENDING`: #eab308 (yellow)
- `CONFIRMED`: #22c55e (green)
- `COMPLETED`: #3b82f6 (blue)
- `DECLINED`: #ef4444 (red)
- `CANCELLED`: #6b7280 (gray)

#### Example with TypeScript

```typescript
async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
  view: 'day' | 'week' | 'month' = 'week'
) {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    view
  })

  const response = await fetch(`/api/business/calendar?${params}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events')
  }

  return await response.json()
}

// Usage
const today = new Date()
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
const events = await getCalendarEvents(today, nextWeek, 'week')
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "code": "SPECIFIC_ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "correlationId": "corr_abc123"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PATCH request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Missing or invalid session |
| 403 | Forbidden | Valid session but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., can't delete) |
| 422 | Unprocessable Entity | Semantic validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Common Error Codes

#### Authentication Errors (401)

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "code": "NO_SESSION"
}
```

```json
{
  "error": "UNAUTHORIZED",
  "message": "Session expired",
  "code": "SESSION_EXPIRED"
}
```

#### Authorization Errors (403)

```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions",
  "code": "INVALID_ROLE"
}
```

```json
{
  "error": "FORBIDDEN",
  "message": "You don't own this studio",
  "code": "NOT_STUDIO_OWNER"
}
```

#### Validation Errors (400)

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "code": "INVALID_INPUT",
  "details": {
    "name": "Name must be at least 3 characters",
    "price": "Price must be a positive number"
  }
}
```

#### Not Found Errors (404)

```json
{
  "error": "NOT_FOUND",
  "message": "Booking not found",
  "code": "BOOKING_NOT_FOUND",
  "details": {
    "bookingId": "bkg_123"
  }
}
```

#### Conflict Errors (409)

```json
{
  "error": "CONFLICT",
  "message": "Cannot delete service with active bookings",
  "code": "SERVICE_HAS_BOOKINGS",
  "details": {
    "activeBookings": 5
  }
}
```

### Error Handling Best Practices

**TypeScript Example**:

```typescript
async function handleApiCall<T>(apiCall: () => Promise<Response>): Promise<T> {
  try {
    const response = await apiCall()

    if (!response.ok) {
      const error = await response.json()

      switch (response.status) {
        case 401:
          // Redirect to login
          window.location.href = '/auth/signin'
          throw new Error('Session expired')

        case 403:
          // Show permission error
          throw new Error(error.message || 'Permission denied')

        case 404:
          throw new Error('Resource not found')

        case 422:
        case 400:
          // Show validation errors
          throw new ValidationError(error.details)

        default:
          throw new Error(error.message || 'Something went wrong')
      }
    }

    return await response.json()
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.')
    }
    throw error
  }
}
```

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Read (GET) | 1000 requests | 15 minutes |
| Write (POST/PATCH/DELETE) | 100 requests | 15 minutes |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1699027200
```

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Rate Limit Exceeded (429)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "code": "RATE_LIMIT",
  "details": {
    "retryAfter": 300,
    "resetAt": "2025-11-04T11:00:00.000Z"
  }
}
```

**Retry-After Header**:
```http
Retry-After: 300
```

### Best Practices

1. **Respect Rate Limits**: Check remaining requests
2. **Implement Backoff**: Exponential backoff on errors
3. **Cache Responses**: Cache read-only data
4. **Batch Requests**: Combine multiple operations when possible

---

## Webhooks (Future)

Webhook support for real-time event notifications is planned for a future release.

**Planned Events**:
- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `service.created`
- `service.updated`

---

## SDKs and Client Libraries

### Official TypeScript SDK (Coming Soon)

```typescript
import { MassavaClient } from '@massava/sdk'

const client = new MassavaClient({
  apiKey: 'your-api-key' // When API key auth is added
})

// Type-safe API calls
const bookings = await client.bookings.list({ status: 'PENDING' })
await client.bookings.updateStatus('bkg_123', 'CONFIRMED')
```

### Community Libraries

Check [github.com/massava](https://github.com/massava) for community-maintained SDKs.

---

## Changelog

### Version 1.0.0 (2025-11-04)

**Initial Release**:
- Bookings API
- Services API
- Statistics API
- Opening Hours API
- Calendar API

---

## Support

**Documentation**: [docs.massava.com](https://docs.massava.com)
**API Status**: [status.massava.com](https://status.massava.com)
**Email**: [api@massava.com](mailto:api@massava.com)

**Last Updated**: 2025-11-04
**Version**: 1.0.0
