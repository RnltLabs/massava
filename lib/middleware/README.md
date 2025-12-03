# API Middleware

Reusable middleware for Next.js API routes.

## Available Middleware

### API Rate Limiter

Protects API routes from abuse with Redis-based rate limiting.

**Import**:
```typescript
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from '@/lib/middleware/api-rate-limiter';
```

**Quick Start**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { withRateLimit, NOTIFICATION_RATE_LIMITS } from '@/lib/middleware/api-rate-limiter';

export async function GET(request: NextRequest) {
  const session = await auth();

  return withRateLimit(
    request,
    NOTIFICATION_RATE_LIMITS.listNotifications,
    session,
    async () => {
      // Your route handler logic
      return NextResponse.json({ data: 'success' });
    }
  );
}
```

**Custom Rate Limits**:
```typescript
return withRateLimit(
  request,
  {
    requests: 100,
    windowSeconds: 60,
    requireAuth: true,
    ipLimit: true,
    userLimit: true,
  },
  session,
  handler
);
```

**Predefined Limits**:
- `NOTIFICATION_RATE_LIMITS.createNotification` - 10 req/min (admin only)
- `NOTIFICATION_RATE_LIMITS.listNotifications` - 60 req/min
- `NOTIFICATION_RATE_LIMITS.getNotification` - 60 req/min
- `NOTIFICATION_RATE_LIMITS.registerDevice` - 5 req/min
- `NOTIFICATION_RATE_LIMITS.deleteDevice` - 10 req/min
- `NOTIFICATION_RATE_LIMITS.unreadCount` - 120 req/min
- `NOTIFICATION_RATE_LIMITS.preferences` - 30 req/min
- `NOTIFICATION_RATE_LIMITS.stream` - 10 req/min
- `NOTIFICATION_RATE_LIMITS.readNotification` - 60 req/min

**Features**:
- IP-based rate limiting (prevents DDoS)
- User-based rate limiting (prevents account abuse)
- Proper 429 responses with Retry-After headers
- Fail-open on Redis errors
- Integration with notification error system
- Automatic rate limit headers on responses

**Documentation**: [Full API Rate Limiting Guide](/docs/notifications/api-rate-limiting.md)

---

## Creating New Middleware

When adding new middleware to this directory:

1. **Name it clearly**: `{purpose}-middleware.ts`
2. **Export utilities**: Export both the middleware function and any helpers
3. **Document it**: Add README section above
4. **Test it**: Create tests in `__tests__/lib/middleware/`
5. **Type it**: Use TypeScript with strict types

**Template**:
```typescript
/**
 * My Middleware
 *
 * Description of what it does.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface MyMiddlewareConfig {
  option1: string;
  option2: number;
}

export async function withMyMiddleware(
  request: NextRequest,
  config: MyMiddlewareConfig,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Middleware logic

  // Execute handler
  return handler();
}
```
