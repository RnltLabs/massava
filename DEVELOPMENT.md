# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed test data (Karlsruhe)
npm run seed:karlsruhe

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

### Development
```bash
npm run dev              # Start Next.js dev server (Turbopack)
npm run build            # Build production bundle
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio (GUI)
npx prisma db push       # Push schema changes (no migration)
npx prisma db pull       # Pull schema from database
npx prisma migrate reset # Reset database (WARNING: deletes all data)
```

### Testing Data
```bash
npm run seed:karlsruhe   # Seed Karlsruhe test data
```

This creates:
- 8 Studios in different Karlsruhe districts
- 35 Services (Thai, Oil, Sport, Hot Stone, etc.)
- 1,337 TimeSlots (63% available, 19% booked, 18% blocked)
- 14 Demo bookings
- 8 BlockedTimes

See [prisma/SEED_README.md](./prisma/SEED_README.md) for details.

## Project Structure

```
massava/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── (dashboard)/   # Protected dashboard routes
│   │   └── (public)/      # Public routes
│   ├── api/               # API routes
│   └── generated/         # Generated code (Prisma)
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
│
├── lib/                  # Utilities & helpers
│   ├── constants/        # Constants (SERVICE_TYPES, etc.)
│   ├── schemas/          # Zod validation schemas
│   └── utils/            # Helper functions
│
├── prisma/               # Database
│   ├── schema.prisma     # Prisma schema
│   ├── migrations/       # Migration files
│   ├── seed.ts           # Main seed script
│   └── seed-karlsruhe.ts # Karlsruhe test data
│
├── docs/                 # Documentation
│   └── testing-with-seed-data.md
│
└── public/               # Static assets
```

## Database Models

### Core Models
- **Studio** - Massage/wellness studios
- **Service** - Services offered by studios
- **TimeSlot** - Available appointment slots
- **Booking** - Customer bookings
- **BlockedTime** - Blocked time periods
- **User** - Unified user model (customers + studio owners)

### Authentication
- **Account** - OAuth accounts (NextAuth.js)
- **Session** - User sessions
- **EmailVerificationToken** - Email verification
- **PasswordResetToken** - Password reset

See [prisma/schema.prisma](./prisma/schema.prisma) for full schema.

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/massava?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Email (Resend)
RESEND_API_KEY="re_xxx"
RESEND_FROM_EMAIL="noreply@massava.app"

# Sentry (optional)
SENTRY_DSN="https://xxx@sentry.io/xxx"
```

## Testing Workflow

### 1. Setup Test Data
```bash
npm run seed:karlsruhe
```

### 2. Test Landing Page
1. Visit: http://localhost:3000
2. Search for: **Karlsruhe**
3. Radius: **20 km**
4. You should see 8 studios

### 3. Test Studio Detail Page
1. Click on a studio
2. View services, opening hours, etc.
3. Check available time slots

### 4. Test Booking Flow
1. Select a service
2. Choose a time slot
3. Fill booking form
4. Submit booking

See [docs/testing-with-seed-data.md](./docs/testing-with-seed-data.md) for comprehensive testing guide.

## Database Schema Changes

### Making Changes
1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Verify in Prisma Studio:
   ```bash
   npx prisma studio
   ```

### Reset Database (if needed)
```bash
# WARNING: Deletes all data
npx prisma migrate reset

# Re-seed
npm run seed:karlsruhe
```

## Internationalization (i18n)

Supported languages:
- 🇩🇪 German (DE) - Default
- 🇬🇧 English (EN)
- 🇹🇭 Thai (TH)
- 🇨🇳 Chinese (ZH)
- 🇻🇳 Vietnamese (VI)
- 🇵🇱 Polish (PL)
- 🇷🇺 Russian (RU)

Translation files: `messages/{locale}.json`

## Common Tasks

### Add a New Service Type
1. Edit `lib/constants/serviceTypes.ts`
2. Add to `SERVICE_TYPES` constant
3. Add to `SERVICE_TYPE_OPTIONS` array
4. Add synonyms to `SERVICE_TYPE_SYNONYMS`
5. Update seed data templates if needed

### Create a New Studio (via Seed)
1. Edit `prisma/seed-karlsruhe.ts`
2. Add to `STUDIO_TEMPLATES` array
3. Run: `npm run seed:karlsruhe`

### Debug Database Issues
1. Open Prisma Studio: `npx prisma studio`
2. Inspect data visually
3. Check foreign key relationships
4. Verify data integrity

## Deployment

### Staging
```bash
git push origin develop
# Auto-deploys to staging.massava.app
```

### Production
```bash
git push origin main
# Auto-deploys to massava.app
```

## Troubleshooting

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Database Out of Sync
```bash
npx prisma migrate dev
```

### Seed Script Fails
```bash
# Reset and try again
npx prisma migrate reset
npm run seed:karlsruhe
```

### Port 3000 Already in Use
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
npm run dev
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## Getting Help

- Check [docs/](./docs) folder for guides
- Open Prisma Studio for database inspection
- Review seed data: `npm run seed:karlsruhe`

---

**Last Updated:** 2025-11-02
**Maintained By:** Roman Reinelt / RNLT Labs
