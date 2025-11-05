# Business Portal API - Quick Reference

**Quick guide for frontend developers integrating with the Business Portal API.**

## Authentication

All requests require authentication. NextAuth session cookie is automatically included.

```typescript
// No manual headers needed - session cookie handled by NextAuth
const response = await fetch('/api/business/bookings')
```

## Common Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "error": "Human-readable error message",
  "details": { ... },
  "correlationId": "uuid-for-support"
}
```

## Quick Examples

### 1. Get Pending Bookings

```typescript
const response = await fetch('/api/business/bookings?status=PENDING')
const { bookings, pagination } = await response.json()

// bookings: Array<Booking>
// pagination: { total, limit, offset, hasMore }
```

### 2. Confirm a Booking

```typescript
const response = await fetch(`/api/business/bookings/${bookingId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'CONFIRMED' })
})

const { booking, message } = await response.json()
```

### 3. Create a Service

```typescript
const response = await fetch('/api/business/services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Swedish Massage',
    description: 'Relaxing massage',
    price: 65,
    duration: 60
  })
})

if (response.status === 201) {
  const { service, message } = await response.json()
}
```

### 4. Update a Service

```typescript
const response = await fetch(`/api/business/services/${serviceId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    price: 70, // Partial update - only update price
  })
})

const { service, message } = await response.json()
```

### 5. Delete a Service

```typescript
const response = await fetch(`/api/business/services/${serviceId}`, {
  method: 'DELETE'
})

if (response.status === 200) {
  const { message } = await response.json()
} else if (response.status === 409) {
  const { error, activeBookings } = await response.json()
  // Cannot delete - has active bookings
}
```

### 6. Get Dashboard Stats

```typescript
const response = await fetch('/api/business/stats?period=month')
const { overview, topServices, recentBookings } = await response.json()

// overview: { totalBookings, pendingBookings, totalRevenue, ... }
// topServices: Array<{ name, bookingCount, ... }>
// recentBookings: Array<{ customerName, status, ... }>
```

### 7. Update Opening Hours

```typescript
const response = await fetch('/api/business/opening-hours', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    monday: {
      open: true,
      ranges: ['09:00-13:00', '14:00-18:00']
    },
    tuesday: {
      open: false
    }
  })
})

const { openingHours, message } = await response.json()
```

### 8. Get Calendar Events

```typescript
const startDate = new Date().toISOString()
const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

const response = await fetch(
  `/api/business/calendar?startDate=${startDate}&endDate=${endDate}`
)

const { events, services, summary } = await response.json()

// events: Array<{ type: 'booking' | 'slot', ... }>
// services: Array<Service>
// summary: { totalBookings, availableSlots, ... }
```

## React Hooks Examples

### useBookings Hook

```typescript
import { useState, useEffect } from 'react'

export function useBookings(status?: string) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchBookings() {
      try {
        const params = new URLSearchParams()
        if (status) params.set('status', status)

        const response = await fetch(`/api/business/bookings?${params}`)
        if (!response.ok) throw new Error('Failed to fetch')

        const data = await response.json()
        setBookings(data.bookings)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [status])

  return { bookings, loading, error }
}

// Usage:
const { bookings, loading } = useBookings('PENDING')
```

### useStats Hook

```typescript
export function useStats(period = 'month') {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const response = await fetch(`/api/business/stats?period=${period}`)
      const data = await response.json()
      setStats(data)
      setLoading(false)
    }

    fetchStats()
  }, [period])

  return { stats, loading }
}

// Usage:
const { stats } = useStats('month')
// stats.overview.totalRevenue
```

## Error Handling

```typescript
async function confirmBooking(bookingId: string) {
  try {
    const response = await fetch(`/api/business/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' })
    })

    if (!response.ok) {
      const error = await response.json()

      if (response.status === 403) {
        // User doesn't own this booking
        alert('You do not have permission to modify this booking')
      } else if (response.status === 404) {
        // Booking not found
        alert('Booking not found')
      } else {
        // Other error
        alert(error.error)
      }

      return null
    }

    return await response.json()
  } catch (err) {
    console.error('Network error:', err)
    alert('Failed to confirm booking. Please try again.')
    return null
  }
}
```

## TypeScript Types

```typescript
// Booking
type Booking = {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  preferredDate: string
  preferredTime: string
  message?: string
  service?: {
    id: string
    name: string
    price: number
    duration: number
  }
  customer?: {
    id: string
    name: string
    email: string
  }
}

// Service
type Service = {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  createdAt: string
  updatedAt: string
  _count?: {
    bookings: number
  }
}

// Stats
type Stats = {
  period: {
    startDate: string
    endDate: string
    period: 'day' | 'week' | 'month' | 'year'
  }
  overview: {
    totalBookings: number
    pendingBookings: number
    confirmedBookings: number
    cancelledBookings: number
    totalRevenue: number
    averageBookingValue: number
  }
  topServices: Array<{
    id: string
    name: string
    price: number
    duration: number
    bookingCount: number
  }>
  recentBookings: Array<{
    id: string
    customerName: string
    customerEmail: string
    serviceName?: string
    status: string
    createdAt: string
  }>
}

// Opening Hours
type DayOpeningHours = {
  open: boolean
  ranges?: string[] // e.g., ["09:00-13:00", "14:00-18:00"]
}

type OpeningHours = {
  monday?: DayOpeningHours
  tuesday?: DayOpeningHours
  wednesday?: DayOpeningHours
  thursday?: DayOpeningHours
  friday?: DayOpeningHours
  saturday?: DayOpeningHours
  sunday?: DayOpeningHours
}

// Calendar Event
type CalendarEvent = BookingEvent | SlotEvent

type BookingEvent = {
  id: string
  type: 'booking'
  title: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName?: string
  serviceId?: string
  status: string
  date: string
  preferredDate: string
  preferredTime: string
  message?: string
}

type SlotEvent = {
  id: string
  type: 'slot'
  title: string
  serviceName?: string
  serviceId?: string
  startTime: string
  endTime: string
  isBooked: boolean
}
```

## Common Pitfalls

1. **Not handling 403 errors:** Always check if user owns the resource
2. **Not validating input:** Backend validates, but client-side validation improves UX
3. **Forgetting pagination:** Use `limit` and `offset` for large lists
4. **Not handling loading states:** Always show loading indicators
5. **Missing error correlation IDs:** Log correlation IDs for support requests

## Support

For detailed API documentation, see: `/docs/business-portal-api.md`

For issues, check the correlation ID in error responses and contact support.
