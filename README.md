# Massava

Multilingual massage booking platform connecting wellness seekers with massage studios.

## Features

- 🌍 **Multilingual Support** - Available in 7 languages (DE, EN, TH, ZH, VI, PL, RU)
- 💆 **Studio Discovery** - Find massage studios near you
- 📅 **Easy Booking** - Book appointments directly
- 🏢 **Studio Management** - Studios can manage their profile and bookings
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
