# Device Token Validation

## Overview

The device token validation system prevents invalid or malicious tokens from being stored in the database. It validates tokens based on platform-specific requirements (FCM for Android, APNS for iOS, Web Push for Web).

## Security Features

- **Format Validation**: Ensures tokens match expected patterns for each platform
- **Length Checks**: Prevents DoS attacks via extremely long tokens
- **Character Set Validation**: Blocks tokens with invalid characters
- **Injection Prevention**: Detects and blocks SQL injection, XSS, and other injection attempts
- **Automatic Sanitization**: Removes whitespace and common formatting characters

## Token Types

### FCM (Firebase Cloud Messaging) Tokens

**Used for:** Android and iOS (when using FCM)

**Format Requirements:**
- Length: 100-300 characters (typical: 152-163)
- Characters: Alphanumeric + colon + underscore + hyphen only
- Pattern: `^[A-Za-z0-9:_-]+$`

**Example:**
```
cPdK8zRxQ7y:APA91bHsR8zK3L4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8cD9eF0gH1iJ
```

### APNS (Apple Push Notification Service) Tokens

**Used for:** iOS (native APNS)

**Format Requirements:**
- Length: Exactly 64 hexadecimal characters
- Characters: 0-9, a-f, A-F only
- Pattern: `^[0-9a-fA-F]{64}$`

**Example:**
```
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Note:** iOS tokens may include spaces or angle brackets in some formats:
```
<1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef>
```
These are automatically sanitized before validation.

### Web Push Tokens

**Used for:** Web browsers (Progressive Web Apps)

**Format Requirements:**
- Length: 50-500 characters
- Format: Either a valid URL (subscription endpoint) or base64url-encoded string
- URL Pattern: Must be valid HTTPS/HTTP URL
- Base64url Pattern: `^[A-Za-z0-9_-]+$`

**Examples:**

URL format:
```
https://fcm.googleapis.com/fcm/send/abc123def456ghi789jkl012mno345
```

Base64url format:
```
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_
```

## API Usage

### Register Device Token

**Endpoint:** `POST /api/notifications/devices`

**Request Body:**
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

**Success Response (200):**
```json
{
  "device": {
    "id": "device-123",
    "userId": "user-456",
    "token": "cPdK8zRxQ7y:APA91bH...",
    "platform": "ANDROID",
    "isActive": true,
    "lastUsedAt": "2025-12-02T10:30:00Z"
  }
}
```

**Token Validation Error (422):**
```json
{
  "error": "Invalid device token",
  "message": "Token too short",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "token": ["FCM tokens must be at least 100 characters"]
    }
  }
}
```

**General Validation Error (400):**
```json
{
  "error": "Invalid request",
  "message": "Request validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "platform": ["Platform is required"]
    }
  }
}
```

## Validation Rules

### Required Fields

- `token` (string, non-empty)
- `platform` (enum: `IOS`, `ANDROID`, `WEB`)

### Optional Fields

- `deviceName` (string, max 100 chars)
- `deviceModel` (string, max 100 chars)
- `appVersion` (string, max 50 chars)
- `osVersion` (string, max 50 chars)

### Token Validation by Platform

#### Android
```typescript
validateFCMToken(token)
// - Length: 100-300 characters
// - Characters: [A-Za-z0-9:_-]
// - No suspicious patterns (SQL, XSS, etc.)
```

#### iOS
```typescript
validateAPNSToken(token) || validateFCMToken(token)
// Option 1: APNS token (64 hex chars)
// Option 2: FCM token (iOS apps using FCM)
```

#### Web
```typescript
validateWebToken(token)
// Option 1: Valid HTTPS/HTTP URL
// Option 2: Base64url string (50-500 chars)
```

## Security Considerations

### Blocked Patterns

The validator automatically rejects tokens containing:

1. **SQL Injection Attempts**
   - Keywords: `OR`, `AND` (case-insensitive)
   - Characters: `'`, `"`, `;`, `` ` ``

2. **XSS Attempts**
   - Pattern: `<script`
   - Characters: `<`, `>`

3. **JavaScript Protocol Injection**
   - Pattern: `javascript:`

4. **Template Literal Injection**
   - Pattern: `${`

### Automatic Sanitization

Before validation, tokens are sanitized:
```typescript
sanitizeToken(token)
// - Removes leading/trailing whitespace
// - Removes internal spaces
// - Removes angle brackets (<>)
```

Example:
```typescript
Input:  "  <1234 5678>  "
Output: "12345678"
```

## Implementation Details

### File Structure

```
lib/
  notifications/
    utils/
      token-validator.ts          # Core validation logic
  schemas/
    notification.schema.ts        # Zod schemas

app/
  api/
    notifications/
      devices/
        route.ts                  # API endpoint with validation

__tests__/
  unit/
    notifications/
      utils/
        token-validator.test.ts   # Unit tests (64 tests)
  integration/
    notifications/
      device-registration.test.ts # Integration tests (23 tests)
```

### Validation Flow

```
1. Client sends POST /api/notifications/devices
   ↓
2. Auth middleware verifies user session
   ↓
3. Token is sanitized (whitespace/formatting removed)
   ↓
4. Zod schema validates request structure
   ↓
5. Custom refinement calls validateDeviceToken()
   ↓
6. Platform-specific validation runs
   ↓
7. Success: Token stored in database
   ↓
8. Failure: 422 error with specific message
```

### Code Example

```typescript
import { validateDeviceToken } from '@/lib/notifications/utils/token-validator';

// Validate token
const result = validateDeviceToken(
  'cPdK8zRxQ7y:APA91bH...',
  'ANDROID'
);

if (result.valid) {
  // Store token in database
} else {
  // Return error
  console.error(result.error); // "Token too short"
  console.error(result.details); // "FCM tokens must be at least 100 characters"
}
```

## Testing

### Unit Tests

**File:** `__tests__/unit/notifications/utils/token-validator.test.ts`

**Coverage:** 64 tests covering:
- Valid FCM tokens (7 tests)
- Invalid FCM tokens (10 tests)
- Valid APNS tokens (6 tests)
- Invalid APNS tokens (6 tests)
- Valid Web tokens (6 tests)
- Invalid Web tokens (6 tests)
- Platform-specific validation (12 tests)
- Helper functions (11 tests)

### Integration Tests

**File:** `__tests__/integration/notifications/device-registration.test.ts`

**Coverage:** 23 tests covering:
- Successful registration (6 tests)
- Token validation failures (10 tests)
- General validation errors (4 tests)
- Authentication (2 tests)
- Edge cases (2 tests)

### Run Tests

```bash
# Run all token validation tests
npm test -- token-validator

# Run unit tests only
npm test -- __tests__/unit/notifications/utils/token-validator.test.ts

# Run integration tests only
npm test -- __tests__/integration/notifications/device-registration.test.ts
```

## Error Messages

### Token Too Short
```
FCM tokens must be at least 100 characters
```

### Token Too Long
```
FCM tokens must not exceed 300 characters
```

### Invalid Format
```
FCM tokens may only contain alphanumeric characters, colons, underscores, and hyphens
```

### Suspicious Content
```
Token contains potentially malicious patterns
```

### Invalid iOS Token
```
Token must be either a 64-character APNS token or a valid FCM token
```

### Empty Token
```
Token cannot be empty
```

### Invalid Platform
```
Platform "INVALID" is not supported
```

## Best Practices

### Client Implementation

1. **Always validate tokens client-side first**
   ```typescript
   if (token.length < 100) {
     throw new Error('Invalid token received from FCM');
   }
   ```

2. **Retry on token refresh**
   ```typescript
   // If token is rejected, request new token from FCM/APNS
   const newToken = await messaging.getToken();
   ```

3. **Handle 422 errors gracefully**
   ```typescript
   if (response.status === 422) {
     // Token format invalid - request new token
     await refreshDeviceToken();
   }
   ```

### Server Implementation

1. **Always use Zod schema validation**
   ```typescript
   const parsed = registerDeviceSchema.safeParse(body);
   ```

2. **Sanitize before validation**
   ```typescript
   body.token = sanitizeToken(body.token);
   ```

3. **Log validation failures for monitoring**
   ```typescript
   logger.warn('Invalid token rejected', {
     platform,
     error: result.error,
   });
   ```

## Future Enhancements

- [ ] Support for additional platforms (e.g., Windows, Huawei)
- [ ] Rate limiting for token registration per user
- [ ] Token expiration and automatic cleanup
- [ ] Analytics on token validation failures
- [ ] Machine learning for anomaly detection

## References

- [FCM Token Format](https://firebase.google.com/docs/cloud-messaging/android/client)
- [APNS Token Format](https://developer.apple.com/documentation/usernotifications)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

**Last Updated:** 2025-12-02
**Maintained By:** Security Team
