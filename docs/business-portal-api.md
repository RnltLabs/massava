# Business Portal API Documentation

**MASTER_ORCHESTRATION_PLAN.md - Task 2.4: Business Portal API Routes**

## Overview

The Business Portal API provides protected endpoints for studio owners to manage their business operations, including bookings, services, opening hours, and dashboard statistics.

## Authentication

All endpoints require authentication with a valid session and business portal access (STUDIO_OWNER or SUPER_ADMIN role).

**Headers:**
```
Cookie: next-auth.session-token=<session-token>
```

**Authorization:**
- User must be authenticated
- User must have `STUDIO_OWNER` or `SUPER_ADMIN` role
- User must own the studio being accessed

## Error Handling

All endpoints use consistent error response format:

**Success Response:**
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": { ... },
  "correlationId": "uuid-for-tracking"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., cannot delete service with active bookings)
- `500` - Internal Server Error

---

## Endpoints

### 1. Bookings Management

#### GET /api/business/bookings

Fetch bookings for the authenticated studio owner's studio.

**Query Parameters:**
- `status` (optional) - Filter by booking status: `PENDING`, `CONFIRMED`, `CANCELLED`
- `startDate` (optional) - ISO 8601 datetime string
- `endDate` (optional) - ISO 8601 datetime string
- `serviceId` (optional) - Filter by service ID
- `limit` (optional) - Number of results (default: 50, max: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Example Request:**
```bash
GET /api/business/bookings?status=PENDING&limit=20&offset=0
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "booking-123",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+1234567890",
      "status": "PENDING",
      "preferredDate": "Next Monday",
      "preferredTime": "14:00",
      "message": "I need a relaxing massage",
      "service": {
        "id": "service-1",
        "name": "Thai Massage",
        "price": 60,
        "duration": 60
      },
      "customer": {
        "id": "customer-1",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### PATCH /api/business/bookings/[id]/status

Update the status of a booking.

**URL Parameters:**
- `id` - Booking ID

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "notes": "Optional notes about status change"
}
```

**Response:**
```json
{
  "booking": {
    "id": "booking-123",
    "status": "CONFIRMED",
    "customerName": "John Doe",
    "service": {
      "name": "Thai Massage"
    }
  },
  "message": "Booking confirmed"
}
```

---

### 2. Services Management

#### GET /api/business/services

Fetch all services for the studio.

**Response:**
```json
{
  "services": [
    {
      "id": "service-1",
      "name": "Thai Massage",
      "description": "Traditional Thai massage",
      "price": 60,
      "duration": 60,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "_count": {
        "bookings": 25
      }
    }
  ]
}
```

---

#### POST /api/business/services

Create a new service.

**Request Body:**
```json
{
  "name": "Deep Tissue Massage",
  "description": "Intensive massage for muscle tension",
  "price": 75,
  "duration": 90
}
```

**Validation Rules:**
- `name` - 3-100 characters (required)
- `description` - 10-1000 characters (optional)
- `price` - Positive number, max 10000 (required)
- `duration` - Integer, 15-480 minutes (required)

**Response (201):**
```json
{
  "service": {
    "id": "service-new",
    "name": "Deep Tissue Massage",
    "price": 75,
    "duration": 90
  },
  "message": "Service created successfully"
}
```

---

#### PATCH /api/business/services/[id]

Update an existing service (partial update allowed).

**URL Parameters:**
- `id` - Service ID

**Request Body:**
```json
{
  "price": 80,
  "duration": 90
}
```

**Response:**
```json
{
  "service": {
    "id": "service-1",
    "name": "Thai Massage",
    "price": 80,
    "duration": 90
  },
  "message": "Service updated successfully"
}
```

---

#### DELETE /api/business/services/[id]

Delete a service (only if no active bookings).

**URL Parameters:**
- `id` - Service ID

**Response (200):**
```json
{
  "message": "Service deleted successfully"
}
```

**Error Response (409):**
```json
{
  "error": "Cannot delete service with active bookings. Please cancel or complete all bookings first.",
  "activeBookings": 3
}
```

---

### 3. Dashboard Statistics

#### GET /api/business/stats

Fetch dashboard statistics for the studio.

**Query Parameters:**
- `startDate` (optional) - ISO 8601 datetime string
- `endDate` (optional) - ISO 8601 datetime string
- `period` (optional) - `day`, `week`, `month`, `year` (default: `month`)

**Example Request:**
```bash
GET /api/business/stats?period=month
```

**Response:**
```json
{
  "period": {
    "startDate": "2024-10-04T00:00:00Z",
    "endDate": "2024-11-04T00:00:00Z",
    "period": "month"
  },
  "overview": {
    "totalBookings": 45,
    "pendingBookings": 12,
    "confirmedBookings": 28,
    "cancelledBookings": 5,
    "totalRevenue": 1680,
    "averageBookingValue": 60
  },
  "topServices": [
    {
      "id": "service-1",
      "name": "Thai Massage",
      "price": 60,
      "duration": 60,
      "bookingCount": 18
    },
    {
      "id": "service-2",
      "name": "Deep Tissue",
      "price": 75,
      "duration": 90,
      "bookingCount": 10
    }
  ],
  "recentBookings": [
    {
      "id": "booking-1",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "serviceName": "Thai Massage",
      "status": "CONFIRMED",
      "createdAt": "2024-11-01T14:30:00Z"
    }
  ]
}
```

---

### 4. Opening Hours Management

#### GET /api/business/opening-hours

Fetch current opening hours for the studio.

**Response:**
```json
{
  "studioId": "studio-123",
  "studioName": "My Studio",
  "openingHours": {
    "monday": {
      "open": true,
      "ranges": ["09:00-17:00"]
    },
    "tuesday": {
      "open": true,
      "ranges": ["09:00-17:00"]
    },
    "wednesday": {
      "open": false
    }
  }
}
```

---

#### POST /api/business/opening-hours

Update opening hours for the studio (partial update allowed).

**Request Body:**
```json
{
  "monday": {
    "open": true,
    "ranges": ["10:00-18:00"]
  },
  "tuesday": {
    "open": true,
    "ranges": ["09:00-13:00", "14:00-18:00"]
  }
}
```

**Validation Rules:**
- Time ranges must be in format `HH:MM-HH:MM` (24-hour)
- Max 3 time ranges per day
- Each day is optional (partial updates allowed)

**Response:**
```json
{
  "studioId": "studio-123",
  "studioName": "My Studio",
  "openingHours": {
    "monday": {
      "open": true,
      "ranges": ["10:00-18:00"]
    }
  },
  "message": "Opening hours updated successfully"
}
```

---

### 5. Calendar Data

#### GET /api/business/calendar

Fetch calendar data (bookings + time slots) for the studio.

**Query Parameters:**
- `startDate` (required) - ISO 8601 datetime string
- `endDate` (required) - ISO 8601 datetime string
- `serviceId` (optional) - Filter by service ID

**Example Request:**
```bash
GET /api/business/calendar?startDate=2024-11-01T00:00:00Z&endDate=2024-11-07T23:59:59Z
```

**Response:**
```json
{
  "period": {
    "startDate": "2024-11-01T00:00:00Z",
    "endDate": "2024-11-07T23:59:59Z"
  },
  "events": [
    {
      "id": "booking-1",
      "type": "booking",
      "title": "John Doe - Thai Massage",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+1234567890",
      "serviceName": "Thai Massage",
      "serviceId": "service-1",
      "status": "CONFIRMED",
      "date": "2024-11-02T14:00:00Z",
      "preferredDate": "November 2nd",
      "preferredTime": "14:00"
    },
    {
      "id": "slot-1",
      "type": "slot",
      "title": "Available: Thai Massage",
      "serviceName": "Thai Massage",
      "serviceId": "service-1",
      "startTime": "2024-11-03T10:00:00Z",
      "endTime": "2024-11-03T11:00:00Z",
      "isBooked": false
    }
  ],
  "services": [
    {
      "id": "service-1",
      "name": "Thai Massage",
      "duration": 60,
      "price": 60
    }
  ],
  "summary": {
    "totalBookings": 12,
    "pendingBookings": 3,
    "confirmedBookings": 8,
    "availableSlots": 45,
    "bookedSlots": 8
  }
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Authenticated requests**: 100 requests per minute
- **Exceeded limit**: HTTP 429 Too Many Requests

---

## CORS

Business Portal API endpoints are accessible only from same-origin requests. CORS is not enabled for these endpoints.

---

## Examples

### cURL Examples

**Get Pending Bookings:**
```bash
curl -X GET 'https://massava.com/api/business/bookings?status=PENDING' \
  -H 'Cookie: next-auth.session-token=<token>'
```

**Confirm Booking:**
```bash
curl -X PATCH 'https://massava.com/api/business/bookings/booking-123/status' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=<token>' \
  -d '{"status": "CONFIRMED"}'
```

**Create Service:**
```bash
curl -X POST 'https://massava.com/api/business/services' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=<token>' \
  -d '{
    "name": "Swedish Massage",
    "description": "Relaxing Swedish massage",
    "price": 65,
    "duration": 60
  }'
```

### JavaScript/TypeScript Example

```typescript
// Fetch bookings
async function getBookings(status?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)

  const response = await fetch(`/api/business/bookings?${params}`)
  if (!response.ok) throw new Error('Failed to fetch bookings')

  return response.json()
}

// Update booking status
async function confirmBooking(bookingId: string) {
  const response = await fetch(`/api/business/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CONFIRMED' })
  })

  if (!response.ok) throw new Error('Failed to confirm booking')

  return response.json()
}

// Create service
async function createService(data: {
  name: string
  description?: string
  price: number
  duration: number
}) {
  const response = await fetch('/api/business/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) throw new Error('Failed to create service')

  return response.json()
}
```

---

## Changelog

**Version 1.0.0** (2024-11-04)
- Initial release
- All 7 endpoints implemented
- Authentication and authorization enforced
- Zod validation for all inputs
- Comprehensive error handling
- Correlation IDs for error tracking

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.
