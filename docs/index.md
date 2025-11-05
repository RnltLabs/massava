# Massava Documentation

Welcome to the Massava documentation! This guide will help you understand the platform, whether you're a studio owner managing bookings, a customer booking services, or a developer contributing to the project.

## Quick Links

### For Studio Owners
- [Studio Owner Guide](./guides/studio-owner-guide.md) - Complete guide for managing your studio
- [Getting Started](./guides/studio-owner-guide.md#getting-started) - Set up your studio in 10 minutes
- [Managing Bookings](./guides/studio-owner-guide.md#managing-bookings) - Handle customer bookings
- [Business Portal Overview](./README-business-portal.md) - Features and capabilities

### For Developers
- [Business Portal Architecture](./architecture/business-portal-architecture.md) - Technical architecture details
- [API Documentation](./api/business-portal-api.md) - REST API reference
- [Development Setup](./README-business-portal.md#getting-started-development) - Local development guide

### For Customers
- [Customer Guide](./guides/customer-guide.md) - How to book and manage appointments (coming soon)
- [FAQ](./FAQ.md) - Common questions and answers (coming soon)

## Documentation Structure

### Architecture Documentation

Detailed technical documentation about system design and implementation:

- **[Business Portal Architecture](./architecture/business-portal-architecture.md)** ✓
  - Overview and design decisions
  - Path-based routing vs subdomain approach
  - Security model and authentication flow
  - Server Components vs Client Components
  - Data flow and ownership verification

- **Database Schema Design** (coming soon)
  - Entity relationship diagrams
  - Schema design rationale
  - Migration strategy
  - Performance optimization

- **Authentication & Authorization** (coming soon)
  - NextAuth.js configuration
  - Role-based access control (RBAC)
  - Session management
  - Security best practices

### User Guides

Step-by-step guides for using the platform:

- **[Studio Owner Guide](./guides/studio-owner-guide.md)** ✓
  - Getting started and onboarding
  - Dashboard overview
  - Managing bookings (confirm, decline, cancel)
  - Calendar views (day, week, month)
  - Service management (create, edit, delete)
  - Studio settings and profile
  - Opening hours configuration
  - Troubleshooting and FAQ

- **Customer Guide** (coming soon)
  - Finding and browsing studios
  - Booking process
  - Managing appointments
  - Cancellation policies
  - Account settings

- **Admin Guide** (coming soon)
  - System administration
  - User management
  - Studio moderation
  - Analytics and reporting

### API Documentation

Complete API reference for developers:

- **[Business Portal API](./api/business-portal-api.md)** ✓
  - Authentication and authorization
  - Bookings API (list, update status)
  - Services API (CRUD operations)
  - Statistics API (dashboard metrics)
  - Opening Hours API (schedule management)
  - Calendar API (event retrieval)
  - Error handling and codes
  - Rate limiting

- **Customer API** (coming soon)
  - Studio search and discovery
  - Availability checking
  - Booking creation
  - User profile management

### Development Guides

Resources for contributing to the project:

- **Contributing Guidelines** (coming soon)
  - Code of conduct
  - Pull request process
  - Code review guidelines
  - Testing requirements

- **Code Style Guide** (coming soon)
  - TypeScript conventions
  - Component structure
  - Naming conventions
  - File organization

- **Git Workflow** (coming soon)
  - Branch naming
  - Commit message format
  - Feature development flow
  - Release process

## Feature Documentation

### Business Portal Features

#### Dashboard
- Real-time statistics (bookings, revenue)
- Recent bookings overview
- Quick action buttons
- Performance metrics

[Learn more →](./guides/studio-owner-guide.md#dashboard-overview)

#### Booking Management
- List view with filters (status, date, search)
- Detailed booking view
- Status updates (confirm, decline, cancel, complete)
- Customer information display

[Learn more →](./guides/studio-owner-guide.md#managing-bookings)

#### Calendar
- Multiple view types (day, week, month)
- Visual schedule representation
- Event color coding by status
- Quick booking details

[Learn more →](./guides/studio-owner-guide.md#calendar-view)

#### Services
- Create new services
- Edit existing services
- Delete unused services
- Pricing and duration management

[Learn more →](./guides/studio-owner-guide.md#services-management)

#### Settings
- Studio profile editing
- Location and contact information
- Opening hours configuration
- Branding and images

[Learn more →](./guides/studio-owner-guide.md#studio-settings)

## Technical Overview

### Tech Stack

**Frontend**:
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- shadcn/ui components
- Tailwind CSS
- NextAuth.js v4

**Backend**:
- Node.js 18+
- PostgreSQL 15+
- Prisma ORM
- Server Actions

**Infrastructure**:
- Vercel hosting
- Edge Network CDN
- Managed PostgreSQL

### Key Concepts

#### Path-Based Routing

Business portal uses `/business/*` paths instead of subdomains:
- Single authentication session
- Simplified deployment
- Code sharing between portals
- Better developer experience

[Read architectural decision →](./architecture/business-portal-architecture.md#adr-001-path-based-routing)

#### Server Components First

React Server Components for optimal performance:
- Zero JavaScript for data fetching
- Direct database access
- No waterfall requests
- Better Core Web Vitals

[Read architectural decision →](./architecture/business-portal-architecture.md#adr-003-server-components-first)

#### Server Actions for Mutations

Next.js Server Actions for secure mutations:
- Built-in CSRF protection
- Type-safe function calls
- Progressive enhancement
- Automatic revalidation

[Read architectural decision →](./architecture/business-portal-architecture.md#adr-004-server-actions-for-mutations)

#### Role-Based Access Control

Three user roles with different permissions:
- **CUSTOMER**: Book and manage own appointments
- **STUDIO_OWNER**: Manage own studio and bookings
- **SUPER_ADMIN**: Full system access

[Read security model →](./architecture/business-portal-architecture.md#security-model)

## Common Tasks

### For Studio Owners

**Setting Up Your Studio**:
1. Sign up at `/auth/signup`
2. Complete onboarding wizard
3. Add services
4. Set opening hours
5. Start accepting bookings

[Full guide →](./guides/studio-owner-guide.md#getting-started)

**Managing Daily Operations**:
1. Check dashboard for pending bookings
2. Confirm or decline new requests
3. Review today's calendar
4. Update availability as needed

[Full guide →](./guides/studio-owner-guide.md#managing-bookings)

### For Developers

**Local Development Setup**:
1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Run database migrations
5. Start development server

[Full guide →](./README-business-portal.md#getting-started-development)

**Making Changes**:
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request

[Contributing guide →](../CONTRIBUTING.md) (coming soon)

## API Integration

### Authentication

All API requests require authentication via session cookies:

```typescript
fetch('/api/business/bookings', {
  credentials: 'include'
})
```

[Full authentication guide →](./api/business-portal-api.md#authentication)

### Example: Fetching Bookings

```typescript
async function getBookings(status?: string) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)

  const response = await fetch(`/api/business/bookings?${params}`, {
    credentials: 'include'
  })

  return await response.json()
}
```

[Full API reference →](./api/business-portal-api.md#bookings-api)

### Example: Updating Booking Status

```typescript
async function confirmBooking(bookingId: string) {
  const response = await fetch(`/api/business/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status: 'CONFIRMED' })
  })

  return await response.json()
}
```

[Full API reference →](./api/business-portal-api.md#update-booking-status)

## Troubleshooting

### Common Issues

**Cannot Access Business Portal**:
- Verify you're signed in
- Check account role (must be STUDIO_OWNER)
- Clear cookies and sign in again

[More solutions →](./guides/studio-owner-guide.md#common-issues--troubleshooting)

**Bookings Not Showing**:
- Check filter settings
- Verify date range
- Ensure services are active

[More solutions →](./guides/studio-owner-guide.md#no-bookings-showing)

**Time Slots Not Available**:
- Verify opening hours are set
- Check booking window settings
- Review existing bookings

[More solutions →](./guides/studio-owner-guide.md#time-slots-not-available)

## Support

### Get Help

- **Email**: [support@massava.com](mailto:support@massava.com)
- **API Support**: [api@massava.com](mailto:api@massava.com)
- **GitHub Issues**: [github.com/roman/massava/issues](https://github.com/roman/massava/issues)

### Documentation Feedback

Found an error or have suggestions? Please:
1. Open an issue on GitHub
2. Email [docs@massava.com](mailto:docs@massava.com)
3. Submit a pull request with improvements

## Roadmap

### Upcoming Features

**Q4 2025**:
- Staff management
- Advanced calendar with drag-and-drop
- Payment processing (Stripe)
- Customer reviews

**Q1 2026**:
- Mobile apps (iOS/Android)
- Multi-studio support
- Revenue analytics
- Notification center

**Q2 2026**:
- Webhooks
- API keys for external integrations
- Real-time updates
- Advanced search

[Full roadmap →](./ROADMAP.md) (coming soon)

## Contributing

We welcome contributions! See our [Contributing Guidelines](../CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Pull request process
- Testing requirements

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Documentation Version**: 1.0.0
**Last Updated**: 2025-11-04
**Maintained By**: Massava Development Team

**Need help?** Contact [support@massava.com](mailto:support@massava.com)
