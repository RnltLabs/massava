# Massava

A multilingual aggregation platform connecting customers with service providers.

## Features

- 🌍 **Multilingual Support** - Available in 7 languages (DE, EN, TH, ZH, VI, PL, RU)
- 🔍 **Discovery** - Find service providers in your area
- 📅 **Booking System** - Direct appointment scheduling
- 🏢 **Provider Management** - Service providers can manage their profile and availability
- 📱 **Mobile Responsive** - Optimized for all devices

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Internationalization:** next-intl
- **Deployment:** Docker + GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to see the application.

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://..."
RESEND_API_KEY="re_..."
```

## Deployment

- **Staging:** https://staging.rnltlabs.de/massava
- **Production:** https://rnltlabs.de/massava

Automatic deployments via GitHub Actions:
- Push to `develop` → Staging
- Push to `main` → Production

## License

Copyright (c) 2025 Roman Reinelt / RNLT Labs. All rights reserved.

This is proprietary software. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit written permission from the copyright holder.
