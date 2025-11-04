# Business Portal Architecture

## Overview

The Massava Business Portal is a comprehensive management interface for studio owners to manage their studios, bookings, services, and availability. Built as an integrated part of the main application, it uses path-based routing (`/business/*`) to provide a secure, role-based access system for business users.

### Why Path-Based Routing?

We chose path-based routing over subdomain-based separation for several key reasons:

1. **Simplified Authentication**: Single session management across customer and business portals
2. **Reduced Infrastructure Complexity**: No need for subdomain DNS configuration or SSL certificate management
3. **Code Sharing**: Shared components, utilities, and database connections
4. **Easier Development**: Single development environment and deployment pipeline
5. **SEO Benefits**: Single domain authority for both customer and business content

## Architecture Decisions

### ADR-001: Path-Based Routing

**Decision**: Use `/business/*` path prefix for business portal instead of `business.massava.com` subdomain.

**Rationale**:
- Single authentication session works across both portals
- Simplified deployment (one application, one domain)
- Shared component library and utilities
- Easier local development
- Better code reusability

**Consequences**:
- Need middleware to protect `/business/*` routes
- Slightly longer URLs
- All routes must be carefully namespaced

### ADR-002: Middleware Protection Strategy

**Decision**: Use Next.js middleware with NextAuth for route protection.

**Implementation**:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request })

  if (request.nextUrl.pathname.startsWith('/business')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    if (!['STUDIO_OWNER', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
}
```

**Rationale**:
- Middleware runs before route handlers (early protection)
- Centralized authorization logic
- Consistent security across all business routes
- TypeScript type safety

**Consequences**:
- All business routes automatically protected
- Cannot accidentally expose unprotected routes
- Single point of failure (middleware must be reliable)

### ADR-003: Server Components First

**Decision**: Use React Server Components (RSC) by default for business portal pages.

**Rationale**:
- Zero JavaScript sent to client for data fetching
- Direct database access without API layer
- Better performance (no waterfall requests)
- Built-in loading states with Suspense
- Automatic request deduplication

**When to Use Client Components**:
- Interactive forms
- Real-time updates
- Browser APIs (localStorage, window)
- Event handlers (onClick, onChange)

**Example Pattern**:
```typescript
// app/business/bookings/page.tsx (Server Component)
export default async function BookingsPage() {
  const bookings = await getBookings() // Direct DB query
  return <BookingsClient bookings={bookings} />
}

// _components/BookingsClient.tsx (Client Component)
'use client'
export function BookingsClient({ bookings }) {
  const [filter, setFilter] = useState('all')
  // Interactive UI logic
}
```

### ADR-004: Server Actions for Mutations

**Decision**: Use Next.js Server Actions for data mutations instead of API routes.

**Rationale**:
- Built-in CSRF protection
- Type-safe function calls (no API contract)
- Progressive enhancement (works without JavaScript)
- Simpler error handling
- Automatic revalidation

**Example**:
```typescript
// actions/bookings.ts
'use server'

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<Result<Booking, Error>> {
  const session = await auth()
  if (!session) return err(new UnauthorizedError())

  // Verify ownership
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { studio: { include: { ownership: true } } }
  })

  if (booking.studio.ownership.userId !== session.user.id) {
    return err(new ForbiddenError())
  }

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: { status }
  })

  revalidatePath('/business/bookings')
  return ok(updated)
}
```

**When to Use API Routes**:
- External integrations (webhooks)
- Public APIs
- Third-party service callbacks
- Non-form-based mutations

## Technical Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: React useState/useReducer (minimal client state)
- **Forms**: react-hook-form + Zod validation

### Backend

- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5+
- **Authentication**: NextAuth.js v4
- **Session Storage**: Database (Prisma adapter)

### Infrastructure

- **Hosting**: Vercel (or Node.js server)
- **Database**: Managed PostgreSQL
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics

## Route Structure

### Public Routes

```
/auth/signin               - Sign in page
/auth/signup               - Sign up page (with role selection)
/auth/error                - Authentication error page
/unauthorized              - Unauthorized access page
```

### Protected Business Routes

```
/business                  - Dashboard (overview)
  ├── /bookings            - Booking management
  │   └── /[id]            - Booking details
  ├── /calendar            - Calendar view
  ├── /services            - Service management
  │   ├── /new             - Create service
  │   └── /[id]/edit       - Edit service
  ├── /settings            - Studio settings
  │   ├── /profile         - Studio profile
  │   ├── /location        - Location & contact
  │   ├── /opening-hours   - Opening hours
  │   └── /staff           - Staff management (future)
  └── /onboarding          - Studio registration wizard
```

### API Routes

```
/api/business/bookings                  - GET: List bookings (with filters)
/api/business/bookings/[id]/status      - PATCH: Update booking status
/api/business/services                  - GET/POST: List/create services
/api/business/services/[id]             - GET/PATCH/DELETE: Service CRUD
/api/business/stats                     - GET: Dashboard statistics
/api/business/opening-hours             - GET/POST: Opening hours
/api/business/calendar                  - GET: Calendar events
```

### Route Access Control

| Route                     | Required Role            | Additional Check        |
|---------------------------|--------------------------|-------------------------|
| `/business/*`             | STUDIO_OWNER, SUPER_ADMIN | -                       |
| `/business/onboarding`    | STUDIO_OWNER             | No existing studio      |
| `/business/bookings/*`    | STUDIO_OWNER, SUPER_ADMIN | Studio ownership        |
| `/business/services/*`    | STUDIO_OWNER, SUPER_ADMIN | Studio ownership        |
| `/business/settings/*`    | STUDIO_OWNER, SUPER_ADMIN | Studio ownership        |

**Ownership Verification**: All data mutations verify that `session.user.id` matches the `studio.ownership.userId`.

## Data Flow

### Authentication Flow

```
1. User visits /business
   ↓
2. Middleware checks session
   ↓
3a. No session → Redirect to /auth/signin
3b. Wrong role → Redirect to /unauthorized
3c. Valid session → Continue to route
   ↓
4. Route handler verifies studio ownership
   ↓
5. Render page with data
```

### Data Fetching Flow (Server Components)

```
1. Page component is Server Component
   ↓
2. Direct database query via Prisma
   ↓
3. Apply ownership filters (studio belongs to user)
   ↓
4. Return data to component
   ↓
5. Render HTML on server
   ↓
6. Stream HTML to client (zero JS for data)
```

**Example**:
```typescript
// app/business/bookings/page.tsx
export default async function BookingsPage() {
  const session = await auth()
  const studio = await getStudioByUserId(session.user.id)

  const bookings = await db.booking.findMany({
    where: { studioId: studio.id },
    include: {
      service: true,
      customer: true,
      timeSlot: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return <BookingsList bookings={bookings} />
}
```

### Mutation Flow (Server Actions)

```
1. User submits form
   ↓
2. Client calls Server Action
   ↓
3. Server Action verifies session
   ↓
4. Verify studio ownership
   ↓
5. Validate input (Zod schema)
   ↓
6. Execute database mutation
   ↓
7. Revalidate affected paths
   ↓
8. Return result to client
   ↓
9. Client updates UI + shows toast
```

**Example**:
```typescript
// Client Component
'use client'
import { updateBookingStatus } from '@/actions/bookings'

export function BookingActions({ bookingId }) {
  async function handleConfirm() {
    const result = await updateBookingStatus(bookingId, 'CONFIRMED')

    if (result.isOk()) {
      toast.success('Booking confirmed')
    } else {
      toast.error(result.error.message)
    }
  }

  return <Button onClick={handleConfirm}>Confirm</Button>
}
```

### API Endpoint Flow (Legacy/External)

```
1. Client makes HTTP request
   ↓
2. API route handler verifies session
   ↓
3. Verify studio ownership
   ↓
4. Validate request body (Zod)
   ↓
5. Execute database query
   ↓
6. Return JSON response
```

**When Used**: External integrations, webhooks, public APIs.

## Security Model

### Multi-Layer Security

1. **Middleware Protection** (Layer 1)
   - Validates session exists
   - Checks user role
   - Redirects unauthorized users

2. **Route Handler Protection** (Layer 2)
   - Verifies studio ownership
   - Validates resource access
   - Applies row-level security

3. **Database Constraints** (Layer 3)
   - Foreign key constraints
   - Unique constraints
   - Check constraints

4. **Input Validation** (Layer 4)
   - Zod schemas on client and server
   - Type coercion and sanitization
   - SQL injection prevention (Prisma)

### Session Management

**Storage**: Database (via Prisma adapter)

**Session Structure**:
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

**Validation**:
- JWT token signed with secret
- Session expires after 30 days
- Refresh on activity

### Studio Ownership Verification

**Pattern**: Always verify ownership before mutations.

```typescript
async function verifyOwnership(
  userId: string,
  studioId: string
): Promise<boolean> {
  const ownership = await db.studioOwnership.findUnique({
    where: {
      userId_studioId: { userId, studioId }
    }
  })

  return ownership !== null
}
```

**Applied To**:
- All booking mutations
- Service CRUD operations
- Studio settings updates
- Staff management (future)

### CSRF Protection

**Server Actions**: Built-in CSRF protection via Next.js.

**API Routes**: Manual CSRF token validation required.

```typescript
// For API routes (if used)
import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  await csrf.verify(request)
  // Handle request
}
```

### Input Sanitization

**All inputs validated with Zod**:

```typescript
const BookingStatusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(['CONFIRMED', 'DECLINED', 'CANCELLED'])
})

export async function updateBookingStatus(input: unknown) {
  const validated = BookingStatusSchema.parse(input)
  // Safe to use validated data
}
```

**Prevents**:
- SQL injection (Prisma parameterized queries)
- XSS (React auto-escaping)
- Path traversal
- Type coercion attacks

## Database Schema Integration

### Core Entities

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          UserRole @default(CUSTOMER)

  // Relations
  studioOwnership StudioOwnership[]
  bookings       Booking[]
}

model Studio {
  id          String   @id @default(cuid())
  name        String
  description String?
  location    String

  // Relations
  ownership    StudioOwnership?
  services     Service[]
  bookings     Booking[]
  openingHours OpeningHours[]
  timeSlots    TimeSlot[]
}

model StudioOwnership {
  id        String @id @default(cuid())
  userId    String
  studioId  String @unique

  user      User   @relation(fields: [userId], references: [id])
  studio    Studio @relation(fields: [studioId], references: [id])

  @@unique([userId, studioId])
}

model Service {
  id          String @id @default(cuid())
  studioId    String
  name        String
  description String?
  duration    Int    // minutes
  price       Float

  studio      Studio @relation(fields: [studioId], references: [id])
  bookings    Booking[]
}

model Booking {
  id         String        @id @default(cuid())
  studioId   String
  serviceId  String
  customerId String
  timeSlotId String
  status     BookingStatus @default(PENDING)

  studio     Studio   @relation(fields: [studioId], references: [id])
  service    Service  @relation(fields: [serviceId], references: [id])
  customer   User     @relation(fields: [customerId], references: [id])
  timeSlot   TimeSlot @relation(fields: [timeSlotId], references: [id])
}

model OpeningHours {
  id        String @id @default(cuid())
  studioId  String
  dayOfWeek Int    // 0-6 (Sunday-Saturday)
  openTime  String // HH:MM
  closeTime String // HH:MM

  studio    Studio @relation(fields: [studioId], references: [id])

  @@unique([studioId, dayOfWeek])
}

enum UserRole {
  CUSTOMER
  STUDIO_OWNER
  SUPER_ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  DECLINED
  CANCELLED
  COMPLETED
}
```

### Query Patterns

**Get Studio for Current User**:
```typescript
const studio = await db.studio.findFirst({
  where: {
    ownership: {
      userId: session.user.id
    }
  }
})
```

**Get Bookings with Ownership Filter**:
```typescript
const bookings = await db.booking.findMany({
  where: {
    studio: {
      ownership: {
        userId: session.user.id
      }
    }
  },
  include: {
    service: true,
    customer: true,
    timeSlot: true
  }
})
```

**Verify Ownership Before Mutation**:
```typescript
const booking = await db.booking.findUnique({
  where: { id: bookingId },
  include: {
    studio: {
      include: {
        ownership: true
      }
    }
  }
})

if (booking.studio.ownership?.userId !== session.user.id) {
  throw new ForbiddenError()
}
```

### Permission Model

**Role-Based Access Control (RBAC)**:

| Role          | Can Access Business Portal | Can Manage Studios | Can View All Data |
|---------------|----------------------------|-------------------|-------------------|
| CUSTOMER      | No                         | No                | No                |
| STUDIO_OWNER  | Yes                        | Own studio only   | Own studio only   |
| SUPER_ADMIN   | Yes                        | All studios       | All data          |

**Resource-Level Permissions**:
- Users can only modify resources they own
- Studio ownership verified via `StudioOwnership` junction table
- SUPER_ADMIN bypasses ownership checks

## Performance Considerations

### Optimization Strategies

1. **Server Components**: Zero client JavaScript for data fetching
2. **Database Indexes**: On foreign keys and frequently queried fields
3. **Query Optimization**: Include related data in single query
4. **Caching**: Static pages cached at CDN edge
5. **Streaming**: Suspense boundaries for progressive rendering

### Database Indexes

```prisma
model Booking {
  // ... fields ...

  @@index([studioId])
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}

model StudioOwnership {
  // ... fields ...

  @@index([userId])
  @@index([studioId])
}
```

### Caching Strategy

- **Static Pages**: Cached indefinitely (landing pages)
- **Dynamic Pages**: Revalidated on mutation (via `revalidatePath`)
- **API Routes**: No caching (real-time data)

## Monitoring & Observability

### Logging

All actions logged with:
- User ID
- Action type
- Resource ID
- Timestamp
- Result (success/error)

### Error Tracking

- Server errors logged with stack traces
- Client errors sent to monitoring service
- All errors include correlation IDs

### Metrics

- Page load times
- API response times
- Database query performance
- Error rates by route

## Future Enhancements

### Planned Features

1. **Staff Management**: Assign staff to bookings
2. **Advanced Calendar**: Drag-and-drop rescheduling
3. **Revenue Analytics**: Detailed financial reports
4. **Notification Center**: In-app notifications
5. **Multi-Studio Support**: Single user manages multiple studios
6. **Mobile App**: Native iOS/Android apps
7. **Webhooks**: Real-time event notifications
8. **API Keys**: Third-party integrations

### Technical Improvements

1. **Real-Time Updates**: WebSocket integration
2. **Optimistic UI**: Instant feedback on mutations
3. **Offline Support**: PWA with service workers
4. **Advanced Filtering**: Faceted search for bookings
5. **Export Functionality**: PDF/CSV exports
6. **Audit Logs**: Track all changes

---

**Last Updated**: 2025-11-04
**Maintained By**: Development Team
**Version**: 1.0.0
