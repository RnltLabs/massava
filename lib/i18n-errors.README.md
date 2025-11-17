# Internationalized Error Messages

This module provides localized error messages for API responses based on Accept-Language headers.

## Features

- Support for German (de) and English (en)
- Automatic locale detection from Accept-Language header
- Type-safe error message keys
- Fallback to German for unsupported locales

## Usage

### Basic Usage

```typescript
import { getErrorMessage } from '@/lib/i18n-errors';

// Get error message with explicit locale
const germanMessage = getErrorMessage('INVALID_EMAIL', 'de');
// Returns: "Ungültige E-Mail-Adresse"

const englishMessage = getErrorMessage('INVALID_EMAIL', 'en');
// Returns: "Invalid email address"

// Fallback to German (default)
const defaultMessage = getErrorMessage('INVALID_EMAIL');
// Returns: "Ungültige E-Mail-Adresse"
```

### With Next.js API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessageFromRequest } from '@/lib/i18n-errors';

export async function POST(request: NextRequest) {
  // Automatically detect locale from Accept-Language header
  const errorMessage = getErrorMessageFromRequest('INVALID_EMAIL', request);

  return NextResponse.json(
    { success: false, error: errorMessage },
    { status: 400 }
  );
}
```

### With Rate Limiting

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessageFromRequest } from '@/lib/i18n-errors';
import { rateLimitByIP } from '@/lib/auth/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitByIP(request, {
    maxRequests: 5,
    windowSeconds: 15 * 60,
  });

  if (rateLimit.limited) {
    const errorMessage = getErrorMessageFromRequest('RATE_LIMIT_EXCEEDED', request);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 429 }
    );
  }

  // ... rest of the handler
}
```

### Manual Locale Extraction

```typescript
import { extractLocaleFromHeader } from '@/lib/i18n-errors';

const acceptLanguage = request.headers.get('accept-language');
const locale = extractLocaleFromHeader(acceptLanguage);
// Returns: 'de' | 'en'
```

## Available Error Keys

- `INVALID_EMAIL` - Invalid email address
- `TOKEN_EXPIRED` - Token has expired
- `TOKEN_INVALID` - Invalid token
- `TOKEN_ALREADY_USED` - Token has already been used
- `USER_NOT_FOUND` - User not found
- `UNAUTHORIZED` - Unauthorized access
- `FORBIDDEN` - Access forbidden
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Internal server error
- `VALIDATION_ERROR` - Validation error
- `WEAK_PASSWORD` - Password is too weak
- `PASSWORDS_DO_NOT_MATCH` - Passwords do not match
- `ACCOUNT_INACTIVE` - Account is not active
- `EMAIL_ALREADY_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Invalid credentials

## Adding New Error Messages

1. Update the `ErrorMessageKey` type in `lib/i18n-errors.ts`
2. Add the message to both `de` and `en` dictionaries
3. Update tests in `__tests__/i18n-errors.test.ts`

Example:

```typescript
export type ErrorMessageKey =
  | 'INVALID_EMAIL'
  // ... existing keys
  | 'NEW_ERROR_KEY'; // Add new key

const errorMessages = {
  de: {
    // ... existing messages
    NEW_ERROR_KEY: 'Neue Fehlermeldung',
  },
  en: {
    // ... existing messages
    NEW_ERROR_KEY: 'New error message',
  },
};
```

## Testing

Run tests with:

```bash
npm test -- __tests__/i18n-errors.test.ts
```

## Best Practices

1. **Always use type-safe keys**: Import `ErrorMessageKey` type to ensure you use valid keys
2. **Prefer `getErrorMessageFromRequest`**: Automatically handles locale detection
3. **Add new messages in both languages**: Maintain consistency between German and English
4. **Test new error messages**: Update test suite when adding new keys
5. **Use for user-facing errors only**: Not for internal logging

## Example: Complete API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorMessageFromRequest } from '@/lib/i18n-errors';
import { rateLimitByIP } from '@/lib/auth/rate-limit';
import { logger, generateCorrelationId } from '@/lib/logger';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();

  try {
    // Rate limiting
    const rateLimit = await rateLimitByIP(request, {
      maxRequests: 5,
      windowSeconds: 15 * 60,
    });

    if (rateLimit.limited) {
      const errorMessage = getErrorMessageFromRequest('RATE_LIMIT_EXCEEDED', request);

      return NextResponse.json(
        { success: false, error: errorMessage, correlationId },
        { status: 429 }
      );
    }

    // Validation
    const body = await request.json();
    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = getErrorMessageFromRequest('INVALID_EMAIL', request);

      return NextResponse.json(
        { success: false, error: errorMessage, correlationId },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({ success: true, correlationId });
  } catch (error) {
    logger.error('API error', { correlationId, error });

    const errorMessage = getErrorMessageFromRequest('INTERNAL_SERVER_ERROR', request);

    return NextResponse.json(
      { success: false, error: errorMessage, correlationId },
      { status: 500 }
    );
  }
}
```
