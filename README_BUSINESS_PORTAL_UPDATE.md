# README.md Update for Business Portal

This file contains the content that should be added to the main `/README.md` file to document the Business Portal.

**Instructions**: Add the following sections to your existing README.md file.

---

## Business Portal

The business portal at `/business/*` provides studio owners with tools to manage their studios, bookings, and services.

### Features

- **Dashboard**: Real-time statistics showing today's bookings, pending requests, monthly revenue, and recent booking activity
- **Booking Management**: View, confirm, decline, and manage all bookings with advanced filtering and search
- **Calendar View**: Visualize your schedule with day, week, and month views
- **Service Management**: Create, edit, and delete services with pricing and duration
- **Studio Profile**: Manage your public profile, location, and contact information
- **Opening Hours**: Configure your weekly schedule with flexible time slots

### Architecture

- **Path-based routing**: `/business/*` (not subdomain) for simplified authentication
- **RBAC protection**: Only STUDIO_OWNER and SUPER_ADMIN roles can access
- **Server Components**: Optimal performance with zero JavaScript for data fetching
- **Server Actions**: Secure mutations with built-in CSRF protection
- **Middleware**: All business routes automatically protected

[Read full architecture documentation →](./docs/architecture/business-portal-architecture.md)

### Getting Started (Studio Owners)

1. **Sign up** for an account (select "Studio Owner" role)
2. **Complete onboarding** at `/business/onboarding`:
   - Add your studio information
   - Set location and contact details
   - Create your first services
   - Configure opening hours
3. **Start receiving bookings** from customers!

[Read complete studio owner guide →](./docs/guides/studio-owner-guide.md)

### For Developers

**Tech Stack**:
- Next.js 14+ App Router
- TypeScript (strict mode)
- shadcn/ui components
- Tailwind CSS
- Prisma ORM + PostgreSQL

**Key Features**:
- Server Components for optimal performance
- Server Actions for secure mutations
- Middleware-based authentication
- Role-based access control (RBAC)

**API Endpoints**:
```
GET    /api/business/bookings           # List bookings with filters
PATCH  /api/business/bookings/{id}/status  # Update booking status
GET    /api/business/services           # List services
POST   /api/business/services           # Create service
GET    /api/business/stats              # Dashboard statistics
GET    /api/business/calendar           # Calendar events
```

[Read API documentation →](./docs/api/business-portal-api.md)

---

## User Roles

### CUSTOMER
- Browse and search studios
- Book appointments
- Manage personal bookings
- View booking history

### STUDIO_OWNER
- All customer features
- Access business portal (`/business/*`)
- Manage own studio
- Handle bookings for their studio
- Configure services and settings

### SUPER_ADMIN
- Full system access
- Manage all studios
- Access all data
- System configuration

---

## Documentation

### For Studio Owners
- [Studio Owner Guide](./docs/guides/studio-owner-guide.md) - Complete guide for managing your studio
- [Quick Reference](./docs/QUICK_REFERENCE.md) - One-page cheat sheet

### For Developers
- [Business Portal Architecture](./docs/architecture/business-portal-architecture.md) - Technical architecture
- [API Documentation](./docs/api/business-portal-api.md) - Complete API reference
- [Documentation Index](./docs/index.md) - All documentation

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/roman/massava.git
   cd massava
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Configure in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/massava"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. **Initialize database**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Customer Portal: http://localhost:3000
   - Business Portal: http://localhost:3000/business

### Development Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm test                 # Run tests
npm run lint             # Run linter
npx prisma studio        # Database browser
```

---

## Project Structure

```
massava/
├── app/
│   ├── [locale]/
│   │   ├── (customer)/          # Customer-facing routes
│   │   ├── auth/                # Authentication
│   │   └── business/            # Business portal
│   │       ├── bookings/        # Booking management
│   │       ├── calendar/        # Calendar views
│   │       ├── onboarding/      # Studio setup
│   │       ├── services/        # Service management
│   │       └── settings/        # Studio settings
│   └── api/
│       └── business/            # Business API endpoints
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── business/                # Business portal components
├── docs/                        # Documentation
│   ├── architecture/            # Architecture docs
│   ├── guides/                  # User guides
│   └── api/                     # API reference
├── lib/                         # Utilities
├── prisma/                      # Database schema
└── middleware.ts                # Auth middleware
```

---

## Security

### Authentication
- Session-based via NextAuth.js
- 30-day expiration with refresh
- Secure httpOnly cookies

### Authorization
- Role-based access control (RBAC)
- Middleware route protection
- Resource-level ownership verification

### Data Protection
- Parameterized queries (Prisma)
- Input validation (Zod schemas)
- CSRF protection (Server Actions)
- XSS prevention (React auto-escaping)

---

## Support

- **Email**: support@massava.com
- **API Support**: api@massava.com
- **GitHub Issues**: github.com/roman/massava/issues
- **Documentation**: [docs/index.md](./docs/index.md)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the Massava Team**
