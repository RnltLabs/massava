# Massava Business Portal - Quick Reference

A one-page reference guide for common tasks and important information.

## Quick Links

| Resource | URL |
|----------|-----|
| Business Portal | `/business` |
| Bookings | `/business/bookings` |
| Calendar | `/business/calendar` |
| Services | `/business/services` |
| Settings | `/business/settings` |
| Sign In | `/auth/signin` |

## User Roles

| Role | Access | Permissions |
|------|--------|-------------|
| CUSTOMER | Public + own bookings | Browse, book, manage own appointments |
| STUDIO_OWNER | Business portal | Manage own studio, bookings, services |
| SUPER_ADMIN | All areas | Full system access |

## Booking Statuses

| Status | Color | Meaning | Actions Available |
|--------|-------|---------|-------------------|
| PENDING | Yellow | Awaiting confirmation | Confirm, Decline |
| CONFIRMED | Green | Accepted by studio | Cancel, Complete |
| DECLINED | Red | Rejected by studio | - |
| CANCELLED | Gray | Cancelled by owner/customer | - |
| COMPLETED | Blue | Appointment finished | - |

## API Endpoints (Quick Reference)

### Bookings
```
GET    /api/business/bookings          List bookings
GET    /api/business/bookings/{id}     Get booking details
PATCH  /api/business/bookings/{id}/status   Update status
```

### Services
```
GET    /api/business/services          List services
POST   /api/business/services          Create service
PATCH  /api/business/services/{id}     Update service
DELETE /api/business/services/{id}     Delete service
```

### Stats & Calendar
```
GET    /api/business/stats             Dashboard statistics
GET    /api/business/calendar          Calendar events
GET    /api/business/opening-hours     Get opening hours
POST   /api/business/opening-hours     Update opening hours
```

## Common Query Parameters

### Bookings List
```
?status=PENDING               Filter by status
?startDate=2025-11-01         From date (ISO 8601)
?endDate=2025-11-30           To date (ISO 8601)
?search=john                  Search customer/service
?page=1&limit=20              Pagination
?sortBy=createdAt&sortOrder=desc   Sorting
```

## Status Update Examples

### Confirm Booking
```bash
curl -X PATCH /api/business/bookings/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"CONFIRMED"}'
```

### Decline Booking
```bash
curl -X PATCH /api/business/bookings/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"DECLINED","reason":"Unavailable at that time"}'
```

### TypeScript Example
```typescript
await fetch(`/api/business/bookings/${id}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ status: 'CONFIRMED' })
})
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Success (GET/PATCH) |
| 201 | Created | Success (POST) |
| 204 | No Content | Success (DELETE) |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Cannot perform action |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Internal error |

## Rate Limits

| Type | Limit | Window |
|------|-------|--------|
| Read (GET) | 1000 requests | 15 minutes |
| Write (POST/PATCH/DELETE) | 100 requests | 15 minutes |

## Opening Hours

### Days of Week
```
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

### Time Format
- 24-hour format: `HH:MM` (e.g., `09:00`, `18:30`)
- Must be in 15-minute increments

### Example Payload
```json
{
  "openingHours": [
    { "dayOfWeek": 1, "openTime": "10:00", "closeTime": "18:00", "isClosed": false },
    { "dayOfWeek": 0, "isClosed": true }
  ]
}
```

## Service Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| name | Yes | 3-100 characters |
| description | No | Max 500 characters |
| duration | Yes | 5-480 minutes |
| price | Yes | >= 0 |
| category | No | Max 50 characters |

## Common TypeScript Types

### Session
```typescript
interface Session {
  user: {
    id: string
    email: string
    name: string
    role: 'CUSTOMER' | 'STUDIO_OWNER' | 'SUPER_ADMIN'
  }
  expires: string
}
```

### Booking
```typescript
interface Booking {
  id: string
  studioId: string
  serviceId: string
  customerId: string
  timeSlotId: string
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED'
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Service
```typescript
interface Service {
  id: string
  studioId: string
  name: string
  description?: string
  duration: number
  price: number
  category?: string
  isActive: boolean
}
```

## Security Headers

All API requests should include:
```
Cookie: next-auth.session-token=<token>
Content-Type: application/json
```

Rate limit info in response:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1699027200
```

## Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + B` | Go to bookings |
| `Ctrl/Cmd + C` | Go to calendar |
| `Ctrl/Cmd + S` | Save form |
| `Esc` | Close dialog |

## Environment Variables

### Required
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://massava.com"
NEXTAUTH_SECRET="your-secret"
```

### Optional
```env
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_FROM="noreply@massava.com"
SENTRY_DSN="your-sentry-dsn"
```

## Support Contacts

| Type | Contact |
|------|---------|
| General Support | support@massava.com |
| API Support | api@massava.com |
| Documentation | docs@massava.com |
| GitHub Issues | github.com/roman/massava/issues |

## Useful Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
```

### Database
```bash
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open DB browser
npx prisma generate      # Generate client
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

## Documentation Links

- [Full Documentation](./index.md)
- [Architecture](./architecture/business-portal-architecture.md)
- [Studio Owner Guide](./guides/studio-owner-guide.md)
- [API Reference](./api/business-portal-api.md)
- [Business Portal Overview](./README-business-portal.md)

## Common Issues

### Cannot Access Business Portal
1. Verify you're signed in
2. Check role is STUDIO_OWNER or SUPER_ADMIN
3. Clear cookies and sign in again

### Bookings Not Showing
1. Check filter settings
2. Verify date range
3. Clear search box

### API 401 Error
1. Check session is valid (`GET /api/auth/session`)
2. Ensure credentials: 'include' in fetch
3. Sign in again if expired

### Time Slots Not Available
1. Verify opening hours are set
2. Check service duration fits in operating hours
3. Look for conflicting bookings

---

**Version**: 1.0.0
**Last Updated**: 2025-11-04

For detailed information, see [full documentation](./index.md).
