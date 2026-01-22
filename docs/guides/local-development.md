# Local Development Setup

This guide covers setting up Massava for local development, including configuration of environment variables and troubleshooting common issues.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start infrastructure:**
   ```bash
   npm run docker:up
   ```
   This starts PostgreSQL, RabbitMQ, and the Auth Worker.

3. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start dev server:**
   ```bash
   npm run dev
   ```

## Environment Variables

### Required Variables

**Database** (started by `npm run docker:up`):
```
DATABASE_URL="postgresql://user:password@localhost:5432/massava_dev"
```

**Email** (Resend):
```
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@massava.app"
```

**Authentication**:
```
AUTH_SECRET="your-auth-secret" # Generate: openssl rand -base64 32
NEXTAUTH_BASEPATH="/api/auth"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Cron Jobs**:
```
CRON_SECRET="your-cron-secret" # Generate: openssl rand -base64 32
```

### Optional Variables

**Application URL** (for QStash webhooks):
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Default in development
```

If running on a different port:
```
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

**Redis** (Upstash):
```
UPSTASH_REDIS_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_TOKEN="your-token"
```

**Notifications** (Upstash QStash):
```
QSTASH_TOKEN=""  # Empty in local dev - uses sync fallback
QSTASH_URL="https://qstash.upstash.io"
```

**Google Maps**:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-key"
```

## Notifications in Local Development

The notification system uses **Upstash QStash** for production but includes a **graceful fallback** for local development.

### How It Works

1. **With QStash** (production): Notifications are queued asynchronously
2. **Without QStash** (local dev): Notifications are processed synchronously

No configuration needed! Just leave `QSTASH_TOKEN=""` in `.env`.

### Verification

When you create a notification locally, you should see:
```
[INFO] QStash not configured, processing notification synchronously
```

This means the system is working correctly and falling back to sync processing.

### If You Want to Use QStash Locally

1. Get credentials from: https://console.upstash.com/
2. Set in `.env`:
   ```
   QSTASH_TOKEN="your-token"
   QSTASH_URL="https://qstash.upstash.io"
   QSTASH_CURRENT_SIGNING_KEY="key"
   QSTASH_NEXT_SIGNING_KEY="key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

## Common Issues

### "NEXT_PUBLIC_APP_URL or VERCEL_URL must be set for QStash webhooks"

This error is **usually harmless** and happens when:
- You have `QSTASH_TOKEN` set but `NEXT_PUBLIC_APP_URL` is missing
- The system is trying to setup QStash webhooks

**Solution:**
1. Either add `NEXT_PUBLIC_APP_URL="http://localhost:3000"` to `.env`
2. Or remove `QSTASH_TOKEN` to use sync fallback (recommended for local dev)

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

Then update `.env`:
```
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### Database Connection Failed

Ensure Docker services are running:
```bash
npm run docker:up
docker ps  # Check if PostgreSQL container is running
```

## Background Workers

### Auth Sync Worker

Process user synchronization jobs asynchronously:

```bash
npm run worker:auth:dev
```

Monitor logs:
```bash
npm run docker:logs
```

For production deployment, see [docs/WORKER_DEPLOYMENT.md](../WORKER_DEPLOYMENT.md).

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- auth
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm test -- --coverage
```

## Debugging

### VS Code Debugger

1. Set breakpoint in code
2. Run: `npm run dev`
3. Open Chrome DevTools (F12)
4. Set breakpoint in browser console
5. Or use VS Code's debug console

### Server-Side Logging

Logs appear in terminal where `npm run dev` is running.

### Database Queries

View all SQL queries during development:

```env
DATABASE_URL="postgresql://...?logLevel=query"
```

## Performance

### Redis Caching

For development, Redis is optional. To enable caching:

```bash
# Get free tier from https://console.upstash.com/
```

### Hot Reload

Both frontend and backend support hot reload:
- Frontend changes: Automatic (Next.js)
- Backend changes: Automatic (Node.js/TypeScript)
- Database changes: Requires `npx prisma migrate dev`

## Cleanup

### Stop Services

```bash
npm run docker:down
```

### Reset Database

```bash
npm run docker:down
npm run docker:up
npx prisma migrate dev
```

### Clean Installation

```bash
rm -rf node_modules .next
npm install
npm run docker:up
npx prisma migrate dev
npm run dev
```

## Documentation

For more information, see:
- [Architecture](../architecture/)
- [Testing Guide](../TESTING_GUIDE_STUDIO_DASHBOARD.md)
- [Notifications System](../notifications/)
- [Database Optimization](../db-optimization/)
