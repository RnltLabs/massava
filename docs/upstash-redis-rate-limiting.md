# Upstash Redis Rate Limiting Implementation

## Overview

Replaced in-memory rate limiting with production-ready distributed rate limiting using Upstash Redis. This ensures rate limits work correctly across multiple server instances in serverless/distributed deployments.

## Changes Made

### 1. Installed Upstash Redis

```bash
npm install @upstash/redis
```

### 2. Updated Rate Limit Utility

**File**: `/Users/roman/Development/massava/lib/rate-limit.ts`

**Key Features**:
- Lazy-initialized Redis client (singleton pattern)
- Graceful fallback to in-memory rate limiting if Redis is not configured
- Production warning when Redis is not configured
- Studio deletion rate limiting with 3 attempts per hour limit
- Reset function for manual admin actions or testing

**Functions Added**:
- `getRedisClient()`: Singleton Redis client initialization
- `checkDeletionRateLimit(userId)`: Check if user can perform deletion (async)
- `resetDeletionRateLimit(userId)`: Reset deletion rate limit for a user
- `checkInMemoryDeletionRateLimit()`: Fallback for development

### 3. Updated Studio Deletion Action

**File**: `/Users/roman/Development/massava/app/actions/studio/deleteStudio.ts`

**Changes**:
- Imported `checkDeletionRateLimit` from rate-limit utility
- Removed in-memory rate limiting code (lines 20-52 removed)
- Replaced with Redis-backed rate limiting check
- Simplified logic by removing manual attempt tracking

### 4. Environment Variables

**File**: `/Users/roman/Development/massava/.env.example`

Added:
```bash
# Upstash Redis (for distributed rate limiting)
# Get credentials from: https://console.upstash.com/
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

## Setup Instructions

### Development Environment

1. **No setup required**: The implementation automatically falls back to in-memory rate limiting if Redis is not configured.

2. **Optional**: To test with Redis in development:
   - Sign up at [Upstash Console](https://console.upstash.com/)
   - Create a Redis database
   - Copy the REST URL and token
   - Add to `.env.local`:
     ```
     UPSTASH_REDIS_REST_URL="your-url-here"
     UPSTASH_REDIS_REST_TOKEN="your-token-here"
     ```

### Production Environment

1. **Required**: Create Upstash Redis database
2. Add environment variables to production deployment (Vercel, Railway, etc.)
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Warning**: If Redis is not configured in production, the app will log a warning and fall back to in-memory rate limiting (not recommended for multi-server deployments).

## Rate Limiting Rules

### Studio Deletion
- **Limit**: 3 attempts per hour per user
- **Window**: 1 hour (3600 seconds)
- **Key**: `studio:deletion:{userId}`
- **Behavior**:
  - Each attempt increments counter
  - After 3 attempts, user must wait until window expires
  - Error message shows remaining time in minutes

## Implementation Details

### Redis Key Design
```
studio:deletion:{userId}  -> counter with 1-hour TTL
```

### Rate Limit Check Flow
1. Get Redis client (or use in-memory fallback)
2. Increment counter for user
3. Set TTL on first attempt
4. Check if counter exceeds limit
5. Return allowed/denied with error message and attempts left

### Error Handling
- Redis connection errors: Automatic fallback to in-memory
- Missing environment variables: Graceful degradation with warning
- All errors logged for debugging

## Testing

### Manual Testing
```typescript
// In your code
import { checkDeletionRateLimit, resetDeletionRateLimit } from '@/lib/rate-limit';

// Test rate limit
const result = await checkDeletionRateLimit('user-123');
console.log(result); // { allowed: true, attemptsLeft: 2 }

// Reset for testing
await resetDeletionRateLimit('user-123');
```

### Integration Testing
1. Attempt to delete studio 3 times
2. Verify 4th attempt is blocked
3. Wait 1 hour or reset manually
4. Verify deletion works again

## Monitoring

### Production Monitoring
- Check logs for `[rate-limit]` warnings
- Monitor Redis dashboard for key count
- Set up alerts for fallback to in-memory rate limiting

### Upstash Dashboard
- View rate limit keys: `studio:deletion:*`
- Monitor request count
- Check response times
- Review memory usage

## Migration Notes

### Breaking Changes
- None (backwards compatible with in-memory fallback)

### Rollback Plan
If issues occur with Redis:
1. Remove `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from environment
2. App automatically falls back to in-memory rate limiting
3. No code changes required

## Future Improvements

1. **Unified Rate Limiting**: Apply Redis rate limiting to other endpoints (auth, bookings)
2. **Sliding Window**: Implement more sophisticated sliding window algorithm
3. **Dynamic Limits**: Allow admin to configure rate limits via dashboard
4. **Rate Limit Headers**: Add `X-RateLimit-*` headers to responses
5. **User Notifications**: Notify users before they hit rate limits

## Cost Considerations

### Upstash Free Tier
- 10,000 commands per day
- ~3,000 deletion attempts per day (assuming 3 commands per check)
- Should be sufficient for most use cases

### Paid Tier
- $0.20 per 100K commands
- Very cost-effective for production use

## Security Notes

- Rate limiting applied before password verification (prevents timing attacks)
- User ID used as key (no IP address needed, better for privacy)
- Redis keys expire automatically (no manual cleanup needed)
- Graceful degradation prevents service disruption

## Related Files

- `/Users/roman/Development/massava/lib/rate-limit.ts` - Rate limiting utility
- `/Users/roman/Development/massava/app/actions/studio/deleteStudio.ts` - Studio deletion action
- `/Users/roman/Development/massava/.env.example` - Environment variables example

## Support

For issues or questions:
1. Check Upstash status: https://status.upstash.com/
2. Review logs for `[rate-limit]` errors
3. Verify environment variables are set correctly
4. Test Redis connection with Upstash CLI

---

**Last Updated**: 2025-11-01
**Status**: Production Ready
