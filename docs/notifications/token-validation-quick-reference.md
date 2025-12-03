# Device Token Validation - Quick Reference

## Token Requirements

| Platform | Length | Valid Characters | Example |
|----------|--------|-----------------|---------|
| Android (FCM) | 100-300 | `A-Za-z0-9:_-` | `cPdK8zRxQ:APA91bH...` |
| iOS (APNS) | 64 | `0-9a-fA-F` | `1234567890abcdef...` |
| iOS (FCM) | 100-300 | `A-Za-z0-9:_-` | `cPdK8zRxQ:APA91bH...` |
| Web Push | 50-500 | URL or `A-Za-z0-9_-` | `https://fcm.googleapis.com/...` |

## API Endpoint

```
POST /api/notifications/devices
```

### Request
```json
{
  "token": "cPdK8zRxQ7y:APA91bH...",
  "platform": "ANDROID",
  "deviceName": "Pixel 8",
  "deviceModel": "Pixel 8 Pro",
  "appVersion": "1.0.0",
  "osVersion": "14"
}
```

### Response Codes
- `200` - Success
- `400` - Invalid request (missing fields)
- `401` - Unauthorized
- `422` - Invalid token format
- `500` - Server error

## Common Errors

### Token Too Short
```
Error: "Token too short"
Fix: Ensure token is at least 100 characters (FCM) or 64 (APNS)
```

### Invalid Characters
```
Error: "Invalid token format"
Fix: Token contains forbidden characters (spaces, quotes, etc.)
```

### Empty Token
```
Error: "Device token cannot be empty"
Fix: Provide a valid token string
```

## Code Examples

### Validate Token (TypeScript)
```typescript
import { validateDeviceToken } from '@/lib/notifications/utils/token-validator';

const result = validateDeviceToken(token, 'ANDROID');
if (!result.valid) {
  console.error(result.error, result.details);
}
```

### Register Device (Client)
```typescript
const response = await fetch('/api/notifications/devices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: fcmToken,
    platform: 'ANDROID',
    deviceName: 'My Phone',
  }),
});

if (response.status === 422) {
  // Token invalid - request new token
  const newToken = await messaging.getToken();
}
```

### Sanitize Token
```typescript
import { sanitizeToken } from '@/lib/notifications/utils/token-validator';

const clean = sanitizeToken('  <token>  '); // Returns: "token"
```

## Testing

### Run Tests
```bash
# All token validation tests
npm test -- token-validator

# Unit tests only
npm test -- __tests__/unit/notifications/utils/token-validator.test.ts

# Integration tests only
npm test -- __tests__/integration/notifications/device-registration.test.ts
```

## Security Checklist

- [ ] Token length validated
- [ ] Character set restricted
- [ ] SQL injection blocked
- [ ] XSS attempts blocked
- [ ] JavaScript injection blocked
- [ ] Template literal injection blocked
- [ ] Whitespace sanitized
- [ ] Platform-specific rules enforced

## Best Practices

1. **Always validate client-side first**
   ```typescript
   if (token.length < 100) throw new Error('Invalid token');
   ```

2. **Handle 422 errors gracefully**
   ```typescript
   if (status === 422) await refreshToken();
   ```

3. **Log validation failures**
   ```typescript
   logger.warn('Token validation failed', { platform, error });
   ```

4. **Retry on failure**
   ```typescript
   const newToken = await getNewToken();
   await registerDevice(newToken);
   ```

## Files

| Type | File |
|------|------|
| Validator | `lib/notifications/utils/token-validator.ts` |
| Schema | `lib/schemas/notification.schema.ts` |
| API Route | `app/api/notifications/devices/route.ts` |
| Unit Tests | `__tests__/unit/notifications/utils/token-validator.test.ts` |
| Integration | `__tests__/integration/notifications/device-registration.test.ts` |
| Docs | `docs/notifications/token-validation.md` |

## Support

**Questions?** See full documentation: `docs/notifications/token-validation.md`

**Issues?** Check test examples: `__tests__/unit/notifications/utils/token-validator.test.ts`

---

Last Updated: 2025-12-02
