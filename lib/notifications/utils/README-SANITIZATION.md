# Notification Content Sanitization

## Overview

The notification system includes comprehensive input sanitization to prevent XSS (Cross-Site Scripting) attacks. All user-provided content is automatically sanitized before storage and display.

## Features

### 1. HTML Tag Stripping

All HTML tags are removed from notification content to prevent script injection:

```typescript
// Input
title: '<script>alert("xss")</script>Booking Confirmed'

// Output
title: 'alert(&quot;xss&quot;)Booking Confirmed'
```

### 2. Special Character Escaping

HTML special characters are escaped to prevent execution:

- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`

### 3. URL Validation

Action URLs are validated to prevent protocol injection attacks:

**Allowed protocols:**
- `https://` - Secure web links
- `http://` - Standard web links
- `mailto:` - Email links
- `tel:` - Phone links
- `sms:` - SMS links
- `/path` - Relative paths (but not `//` protocol-relative)

**Blocked protocols:**
- `javascript:` - Script execution
- `data:` - Data URIs
- `vbscript:` - VBScript execution
- `file:` - File system access
- `about:` - Browser internals
- `//` - Protocol-relative URLs

### 4. Length Limits

Content is automatically truncated to prevent buffer overflow attacks:

- **Title**: 100 characters max (with `...` suffix if truncated)
- **Body**: 500 characters max (with `...` suffix if truncated)

### 5. Metadata Sanitization

All metadata values are recursively sanitized:

```typescript
// Input
metadata: {
  studioName: '<script>alert(1)</script>Studio ABC',
  nested: {
    description: 'Test <b>HTML</b>',
  },
  tags: ['<script>XSS</script>', 'normal tag'],
}

// Output
metadata: {
  studioName: 'alert(1)Studio ABC',
  nested: {
    description: 'Test HTML',
  },
  tags: ['XSS', 'normal tag'],
}
```

## Usage

### Automatic Sanitization

Sanitization is **automatic** when creating notifications via the `NotificationService`:

```typescript
import { notificationService } from '@/lib/notifications/notification-service';

const result = await notificationService.create({
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'User input with <script>XSS</script>',
  body: 'Content with <img onerror=alert(1)>',
  actionUrl: 'javascript:alert(1)', // Will be rejected
  metadata: {
    studioName: 'Studio <b>ABC</b>', // HTML stripped
  },
});
```

All content is sanitized before database storage. No additional action required.

### Manual Sanitization

If you need to sanitize content outside the service:

```typescript
import {
  sanitizeTitle,
  sanitizeBody,
  sanitizeActionUrl,
  sanitizeMetadata,
  sanitizeNotificationContent,
} from '@/lib/notifications/utils/sanitizer';

// Sanitize individual fields
const titleResult = sanitizeTitle('<script>XSS</script>Title');
console.log(titleResult.value); // 'XSSTitle'
console.log(titleResult.wasModified); // true

const bodyResult = sanitizeBody('Content with <b>HTML</b>');
console.log(bodyResult.value); // 'Content with HTML'

const url = sanitizeActionUrl('javascript:alert(1)');
console.log(url); // null (rejected)

const safeUrl = sanitizeActionUrl('/bookings/123');
console.log(safeUrl); // '/bookings/123'

// Sanitize complete notification
const result = sanitizeNotificationContent({
  title: '<script>XSS</script>',
  body: 'Content',
  actionUrl: 'https://example.com',
  metadata: { key: '<b>value</b>' },
});

console.log(result.wasModified); // true if any field was modified
```

## Security Logging

When sanitization modifies input, a warning is logged for security monitoring:

```typescript
logger.warn('Notification content was sanitized (potential XSS attempt)', {
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  sanitizationPerformed: true,
});
```

This helps detect potential attack attempts and malicious users.

## Attack Vectors Prevented

The sanitizer protects against:

1. **Script injection**: `<script>alert(1)</script>`
2. **Event handlers**: `<img onerror=alert(1)>`
3. **Protocol injection**: `javascript:alert(1)`
4. **Data URIs**: `data:text/html,<script>alert(1)</script>`
5. **SVG attacks**: `<svg onload=alert(1)>`
6. **Style injection**: `<style>body{display:none}</style>`
7. **Iframe injection**: `<iframe src="evil.com"></iframe>`
8. **HTML comments**: `<!-- malicious comment -->`
9. **Protocol-relative URLs**: `//evil.com`
10. **Cookie stealing**: `<img src=x onerror="fetch('/steal?cookie='+document.cookie)">`

## Testing

The sanitizer is extensively tested with 80+ test cases covering:

- Unit tests for individual sanitization functions
- Integration tests with NotificationService
- Real-world attack vector simulations
- Edge cases (unicode, emoji, special characters)

Run tests:

```bash
npm test -- __tests__/notifications/sanitizer.test.ts
npm test -- __tests__/notifications/notification-service-sanitization.test.ts
```

## Best Practices

1. **Always use NotificationService**: Sanitization is automatic
2. **Never trust user input**: All external content is sanitized
3. **Monitor logs**: Check for sanitization warnings to detect attacks
4. **Keep templates clean**: Template outputs are also sanitized
5. **Validate at boundaries**: Sanitization happens at service entry point

## Configuration

Constants are defined in `/lib/notifications/utils/sanitizer.ts`:

```typescript
export const MAX_TITLE_LENGTH = 100;
export const MAX_BODY_LENGTH = 500;
```

These can be adjusted if needed, but current values match notification UI constraints.

## Limitations

1. **Metadata IDs not sanitized**: Fields like `bookingId` and `studioId` are stored as-is since they're not displayed to users. If used in templates, they're sanitized during rendering.

2. **No HTML allowlist**: All HTML is stripped. If you need rich formatting, use a markdown parser after sanitization.

3. **URL query parameters**: Query parameters in URLs are escaped, which may affect some use cases. Use relative paths where possible.

## Related Documentation

- [Notification Service](/lib/notifications/notification-service.ts)
- [Notification Templates](/lib/notifications/notification-templates.ts)
- [Error Handling](/lib/notifications/errors.ts)
- [Security Best Practices](/docs/security/xss-prevention.md)

## Compliance

This implementation follows OWASP XSS Prevention guidelines and helps meet:

- OWASP Top 10 A03:2021 (Injection)
- PCI DSS Requirement 6.5.7
- GDPR Article 32 (Security of Processing)

---

**Last Updated**: 2025-01-02
**Maintained By**: Security & Backend Team
