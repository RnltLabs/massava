# Massava Business Portal

A modern booking platform connecting customers with studios for tattoos, piercings, and body art services. Built with performance, type safety, and exceptional user experience in mind.

## Features

### For Customers
- **Browse Studios**: Discover local studios with detailed profiles and portfolios
- **Easy Booking**: Book appointments with real-time availability
- **Service Selection**: Choose from a variety of services with transparent pricing
- **Booking Management**: View, modify, and cancel your bookings
- **Mobile-First Design**: Seamless experience on any device

### For Studio Owners
- **Business Portal**: Comprehensive dashboard at `/business/*`
- **Booking Management**: View, confirm, decline, and manage all bookings
- **Calendar Views**: Day, week, and month views of your schedule
- **Service Management**: Create and manage your service offerings
- **Studio Settings**: Control your profile, location, and opening hours
- **Real-Time Statistics**: Track bookings, revenue, and performance

## Business Portal

The business portal at `/business/*` provides studio owners with powerful tools to manage their business.

### Key Features

- **Dashboard**: Real-time statistics and recent bookings overview
- **Booking Management**: Filter, search, and manage all bookings with status updates
- **Calendar Integration**: Visual schedule with day/week/month views
- **Service CRUD**: Full service lifecycle management
- **Opening Hours**: Flexible weekly schedule configuration
- **Studio Profile**: Complete control over your public profile

### Architecture

- **Path-based Routing**: `/business/*` (not subdomain) for simplified authentication
- **Role-Based Access Control**: Only STUDIO_OWNER and SUPER_ADMIN roles
- **Server Components**: Optimized performance with zero JavaScript for data fetching
- **Server Actions**: Secure mutations with built-in CSRF protection
- **Middleware Protection**: All business routes automatically protected

[Read full architecture documentation →](./architecture/business-portal-architecture.md)

### Getting Started (Studio Owners)

1. **Sign Up**: Create an account at `/auth/signup` and select "Studio Owner"
2. **Onboarding**: Complete the guided setup wizard at `/business/onboarding`
   - Add studio information
   - Set location and contact details
   - Create your first services
   - Configure opening hours
3. **Start Accepting Bookings**: Your studio is now live and accepting bookings!

[Read complete studio owner guide →](./guides/studio-owner-guide.md)

### API Integration

Developers can integrate with the Business Portal API for custom workflows.

**Base URL**: `https://massava.com/api/business`

**Available Endpoints**:
- `GET /api/business/bookings` - List and filter bookings
- `PATCH /api/business/bookings/{id}/status` - Update booking status
- `GET/POST /api/business/services` - Manage services
- `GET /api/business/stats` - Dashboard statistics
- `GET/POST /api/business/opening-hours` - Opening hours management
- `GET /api/business/calendar` - Calendar events

[Read full API documentation →](./api/business-portal-api.md)

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js v4

### Backend
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5+
- **API**: RESTful + Server Actions

### Infrastructure
- **Hosting**: Vercel (or Node.js server)
- **Database**: Managed PostgreSQL
- **CDN**: Vercel Edge Network

## User Roles

### CUSTOMER
- Browse and search studios
- Book appointments
- Manage personal bookings
- View booking history

### STUDIO_OWNER
- All customer features
- Access business portal (`/business/*`)
- Manage own studio only
- Handle bookings for their studio
- Configure services and settings

### SUPER_ADMIN
- Full system access
- Manage all studios
- Access all data
- System configuration

## Getting Started (Development)

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

   Configure the following in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/massava"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # Optional: Email provider for notifications
   EMAIL_SERVER_HOST="smtp.example.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email"
   EMAIL_SERVER_PASSWORD="your-password"
   EMAIL_FROM="noreply@massava.com"
   ```

4. **Initialize the database**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Customer Portal: [http://localhost:3000](http://localhost:3000)
   - Business Portal: [http://localhost:3000/business](http://localhost:3000/business)
   - Sign in with seeded accounts or create new ones

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format

# Database migrations
npx prisma migrate dev
npx prisma studio

# Generate Prisma client
npx prisma generate
```

## Project Structure

```
massava/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Internationalized routes
│   │   ├── (customer)/           # Customer-facing routes
│   │   │   ├── booking/          # Booking flow
│   │   │   ├── search/           # Studio search
│   │   │   └── studios/          # Studio profiles
│   │   ├── auth/                 # Authentication pages
│   │   └── business/             # Business portal
│   │       ├── bookings/         # Booking management
│   │       ├── calendar/         # Calendar views
│   │       ├── onboarding/       # Studio registration
│   │       ├── services/         # Service management
│   │       └── settings/         # Studio settings
│   └── api/                      # API routes
│       ├── auth/                 # NextAuth handlers
│       └── business/             # Business API endpoints
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── business/                 # Business portal components
├── lib/                          # Utilities and helpers
│   ├── db.ts                     # Prisma client
│   ├── auth.ts                   # Auth configuration
│   └── utils.ts                  # Shared utilities
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Database seeding
├── docs/                         # Documentation
│   ├── architecture/             # Architecture docs
│   ├── guides/                   # User guides
│   └── api/                      # API documentation
├── public/                       # Static assets
└── middleware.ts                 # Next.js middleware (auth)
```

## Documentation

### Architecture Documentation
- [Business Portal Architecture](./architecture/business-portal-architecture.md)
- [Database Schema Design](./architecture/database-schema.md) (coming soon)
- [Authentication & Authorization](./architecture/auth-system.md) (coming soon)

### User Guides
- [Studio Owner Guide](./guides/studio-owner-guide.md)
- [Customer Guide](./guides/customer-guide.md) (coming soon)
- [Admin Guide](./guides/admin-guide.md) (coming soon)

### API Documentation
- [Business Portal API](./api/business-portal-api.md)
- [Customer API](./api/customer-api.md) (coming soon)

### Development Guides
- [Contributing Guidelines](../CONTRIBUTING.md) (coming soon)
- [Code Style Guide](./development/code-style.md) (coming soon)
- [Git Workflow](./development/git-workflow.md) (coming soon)

## Support

### Documentation
- [Documentation Home](./)
- [FAQ](./FAQ.md) (coming soon)
- [Troubleshooting](./TROUBLESHOOTING.md) (coming soon)

### Contact
- **Email**: [support@massava.com](mailto:support@massava.com)
- **API Support**: [api@massava.com](mailto:api@massava.com)
- **GitHub Issues**: [github.com/roman/massava/issues](https://github.com/roman/massava/issues)

---

**Made with ❤️ by the Massava Team**

**Last Updated**: 2025-11-04
**Version**: 1.0.0
