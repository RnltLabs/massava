# API Rate Limiting

Comprehensive API-level rate limiting for notification routes using Upstash Redis.

## Overview

The notification API implements multi-tier rate limiting to protect against abuse and ensure service availability for all users. Rate limits are enforced using Redis-based sliding window counters with automatic expiration.

## Architecture

### Components

1. **Rate Limiter Middleware** (`lib/middleware/api-rate-limiter.ts`)
   - Reusable rate limiting logic
   - IP-based and user-based limiting
   - Configurable limits per route
   - Fail-open on Redis errors

2. **Integration**
   - Applied to all notification API routes
   - Returns RFC 6585 compliant 429 responses
   - Integrates with notification error system

3. **Storage**
   - Upstash Redis for distributed rate limiting
   - Sliding window counters with TTL
   - Atomic increment operations

## Rate Limits

### Notification Routes

| Route | Method | Limit | Window | Notes |
|-------|--------|-------|--------|-------|
| `/api/notifications` | GET | 60 req | 1 min | Normal reading |
| `/api/notifications` | POST | 10 req | 1 min | Admin only, strict |
| `/api/notifications/:id` | GET | 60 req | 1 min | Individual fetch |
| `/api/notifications/:id` | DELETE | 60 req | 1 min | Same as GET |
| `/api/notifications/devices` | GET | 60 req | 1 min | List devices |
| `/api/notifications/devices` | POST | 5 req | 1 min | Device registration |
| `/api/notifications/devices/:id` | DELETE | 10 req | 1 min | Unregister device |
| `/api/notifications/unread-count` | GET | 120 req | 1 min | High limit for polling |
| `/api/notifications/preferences` | GET/PATCH | 30 req | 1 min | Preference management |
| `/api/notifications/stream` | GET | 10 req | 1 min | SSE connections |

### Limit Types

1. **IP-Based Limits**
   - Prevents DDoS attacks
   - Applied to public/auth endpoints
   - Checks `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`

2. **User-Based Limits**
   - Prevents authenticated user abuse
   - Applied to authenticated routes
   - Keyed by user ID

3. **Combined Limits**
   - Both IP and user must pass
   - Used for sensitive operations (create, device registration)
   - Most restrictive limit wins

## Implementation

### Basic Usage

```typescript
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

### Custom Rate Limits

```typescript
import { withRateLimit } from '@/lib/middleware/api-rate-limiter';

export async function POST(request: NextRequest) {
  const session = await auth();

  return withRateLimit(
    request,
    {
      requests: 20,
      windowSeconds: 60,
      requireAuth: true,
      ipLimit: true,
      userLimit: true,
    },
    session,
    async () => {
      // Handler logic
    }
  );
}
```

### Manual Rate Limit Check

```typescript
import { rateLimit } from '@/lib/middleware/api-rate-limiter';

export async function POST(request: NextRequest) {
  const session = await auth();

  const rateLimitResult = await rateLimit(request, config, session);

  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult; // Rate limited
  }

  // Proceed with custom logic
  const response = NextResponse.json({ data: 'success' });

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));

  return response;
}
```

## Response Headers

All API responses include rate limit headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701360000
```

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1701360000

{
  "error": "RATE_LIMITED",
  "message": "Too many requests",
  "correlationId": "abc-123",
  "statusCode": 429,
  "details": {
    "retryAfter": 45,
    "limit": 60
  }
}
```

## Configuration

### Environment Variables

```bash
# Upstash Redis credentials
UPSTASH_REDIS_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_TOKEN="your-token-here"
```

### Predefined Limits

Located in `NOTIFICATION_RATE_LIMITS` constant:

```typescript
export const NOTIFICATION_RATE_LIMITS = {
  createNotification: {
    requests: 10,
    windowSeconds: 60,
    requireAuth: true,
    ipLimit: true,
    userLimit: true,
  },
  // ... more configs
};
```

## Security Features

### 1. Multi-Tier Protection

- **IP-based**: Prevents DDoS and automated attacks
- **User-based**: Prevents individual account abuse
- **Combined**: Most restrictive limit applies

### 2. Fail-Open Strategy

If Redis is unavailable:
- Requests are allowed (fail-open)
- Error is logged for monitoring
- Service remains available

**Rationale**: Availability > strict rate limiting

### 3. IP Detection

Checks headers in order:
1. `x-forwarded-for` (takes first IP in chain)
2. `x-real-ip`
3. `cf-connecting-ip` (Cloudflare)
4. Request IP
5. Falls back to `'unknown'`

### 4. Correlation IDs

Rate limit errors include correlation IDs for debugging:

```typescript
const error = createNotificationError('RATE_LIMITED', 'Too many requests', {
  correlationId: request.headers.get('x-correlation-id') || undefined,
  userId,
  retryAfter: 60,
  limit: 100,
});
```

## Testing

### Unit Tests

```typescript
describe('rateLimit()', () => {
  it('should allow request when under limit', async () => {
    mockRedis.incr.mockResolvedValue(5);
    const result = await rateLimit(request, config, session);
    expect(result.allowed).toBe(true);
  });

  it('should block when limit exceeded', async () => {
    mockRedis.incr.mockResolvedValue(101);
    const result = await rateLimit(request, config, session);
    expect(result).toBeInstanceOf(NextResponse);
  });
});
```

### Integration Tests

```bash
npm test -- __tests__/integration/api-rate-limiting.test.ts
```

### Manual Testing

```bash
# Test rate limiting with curl
for i in {1..15}; do
  curl -H "Authorization: Bearer $TOKEN" \
       http://localhost:3000/api/notifications
done

# Should get 429 after 10 requests
```

## Monitoring

### Redis Keys

Rate limit counters use this format:

```
ratelimit:api:user:/api/notifications:user-123
ratelimit:api:ip:/api/notifications:192.168.1.1
```

### Viewing Current Limits

```bash
# Connect to Redis CLI
redis-cli -h your-redis-host.upstash.io -p 6379 -a your-token

# View all rate limit keys
KEYS ratelimit:api:*

# Check specific user's limit
GET ratelimit:api:user:/api/notifications:user-123

# Check TTL
TTL ratelimit:api:user:/api/notifications:user-123
```

### Logs

Rate limit violations are logged:

```typescript
logger.warn('Rate limit exceeded', {
  route: '/api/notifications',
  identifier: 'User user-123',
  limit: 60,
  retryAfter: 45,
  ip: '192.168.1.1',
  userId: 'user-123',
});
```

## Administration

### Reset Rate Limits

```typescript
import { resetRateLimits } from '@/lib/middleware/api-rate-limiter';

// Reset all limits for a user
await resetRateLimits({ userId: 'user-123' });

// Reset all limits for an IP
await resetRateLimits({ ip: '192.168.1.1' });

// Reset specific route for a user
await resetRateLimits({
  userId: 'user-123',
  route: '/api/notifications'
});
```

**Warning**: Only expose this in admin endpoints, not in production UI.

### Adjust Limits

To change rate limits, modify `NOTIFICATION_RATE_LIMITS`:

```typescript
export const NOTIFICATION_RATE_LIMITS = {
  myRoute: {
    requests: 100, // Increase limit
    windowSeconds: 60,
    requireAuth: true,
    ipLimit: false,
    userLimit: true,
  },
};
```

Then update your route:

```typescript
return withRateLimit(
  request,
  NOTIFICATION_RATE_LIMITS.myRoute,
  session,
  handler
);
```

## Best Practices

### 1. Choose Appropriate Limits

- **Read operations**: 60-120 req/min
- **Write operations**: 10-30 req/min
- **Sensitive operations**: 5-10 req/min (device registration, admin actions)
- **Polling endpoints**: 120+ req/min (allow 30s polling interval)

### 2. Authentication Requirements

```typescript
{
  requireAuth: true, // Block unauthenticated requests
  ipLimit: false,    // Skip IP check for authenticated routes
  userLimit: true,   // Check user-based limit
}
```

### 3. Combined Limits for Sensitive Operations

```typescript
{
  requests: 5,
  windowSeconds: 60,
  requireAuth: true,
  ipLimit: true,  // Check both IP and user
  userLimit: true,
}
```

### 4. Fail-Open Philosophy

- Never fail-close on Redis errors
- Log errors for monitoring
- Prefer availability over strict limits

### 5. Clear Error Messages

Rate limit errors include:
- Current limit
- Retry-After header
- Correlation ID for debugging
- User-friendly message

## Performance

### Redis Operations

Each rate-limited request performs:
1. `INCR` - Atomic counter increment (O(1))
2. `EXPIRE` - Set TTL on first request (O(1))
3. `TTL` - Get remaining time (O(1))

**Total**: 2-3 Redis operations per request

### Optimization Tips

1. **Reduce checks**: Disable IP limit for authenticated routes
2. **Batch operations**: Use Redis pipelines if checking multiple limits
3. **Monitor Redis**: Use Upstash dashboard for performance metrics
4. **Adjust limits**: Higher limits = fewer rejections = better UX

## Troubleshooting

### Issue: Rate limits not working

**Check**:
1. Redis credentials in `.env`
2. Redis connection from app
3. Middleware applied to routes

```bash
# Test Redis connection
curl -H "Authorization: Bearer $UPSTASH_TOKEN" \
     https://your-redis.upstash.io/ping
```

### Issue: Too many 429 errors

**Solutions**:
1. Increase rate limits
2. Check for bot traffic
3. Review client polling intervals
4. Check Redis TTL settings

### Issue: Rate limits not resetting

**Check**:
1. Redis TTL set correctly
2. `EXPIRE` called on first request
3. Clock synchronization

```bash
# Check TTL
redis-cli TTL ratelimit:api:user:/api/notifications:user-123
```

### Issue: Different limits per environment

**Solution**: Use environment-specific configs

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const NOTIFICATION_RATE_LIMITS = {
  createNotification: {
    requests: isDevelopment ? 100 : 10,
    windowSeconds: 60,
    // ...
  },
};
```

## Future Enhancements

1. **Dynamic limits**: Adjust limits based on user tier/plan
2. **Rate limit quotas**: Daily/monthly limits in addition to per-minute
3. **Geolocation**: Different limits per region
4. **Adaptive limiting**: Increase limits during low traffic periods
5. **Distributed tracing**: Correlation with OpenTelemetry
6. **Rate limit dashboard**: Admin UI for viewing/adjusting limits

## References

- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585#section-4)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Notification Error System](/docs/notifications/error-handling.md)
- [API Security Guidelines](/docs/security/api-security.md)
