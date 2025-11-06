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
- **Caching:** Upstash Redis
- **Message Queue:** RabbitMQ
- **Background Workers:** Auth sync worker for async operations
- **Internationalization:** next-intl
- **Deployment:** Docker + GitHub Actions

## Development

### Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start infrastructure services:**
   ```bash
   npm run docker:up
   ```
   This starts PostgreSQL, RabbitMQ, and the Auth Worker.

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

### Background Worker

The auth sync worker processes user synchronization jobs asynchronously to reduce OAuth sign-in latency by 73%.

**Run worker in development:**
```bash
npm run worker:auth:dev
```

**Build and run worker:**
```bash
npm run worker:build
npm run worker:auth
```

**Monitor worker:**
```bash
npm run docker:logs
```

See [docs/WORKER_DEPLOYMENT.md](docs/WORKER_DEPLOYMENT.md) for detailed deployment instructions.

## Deployment

- **Staging:** https://staging.massava.app
- **Production:** https://massava.app

Automatic deployments via GitHub Actions:
- Push to `develop` → Staging
- Push to `main` → Production

## License

Copyright (c) 2025 Roman Reinelt / RNLT Labs. All rights reserved.

This is proprietary software. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit written permission from the copyright holder.
