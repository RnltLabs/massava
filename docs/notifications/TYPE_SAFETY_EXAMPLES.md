# Type Safety Examples - Before & After

This document shows concrete examples of the type safety improvements made to the notification system.

## Example 1: Status History

### Before (Unsafe)
```typescript
// notification-service.ts
const notification = await prisma.notification.findUnique({
  where: { id },
  select: { statusHistory: true },
});

// UNSAFE: Type cast bypasses TypeScript
const history = (notification?.statusHistory as unknown as StatusHistoryEntry[]) ?? [];
history.push({
  status,
  timestamp: new Date().toISOString(),
  reason,
});

// UNSAFE: Another type cast
await prisma.notification.update({
  where: { id },
  data: { status, statusHistory: history as unknown as Prisma.InputJsonValue },
});
```

**Problems:**
- No runtime validation
- Type casts bypass TypeScript
- Invalid data causes runtime errors
- Hard to debug

### After (Type-Safe)
```typescript
// notification-service.ts
import { parseStatusHistory, toStatusHistoryJson } from './utils/json-helpers';

const notification = await prisma.notification.findUnique({
  where: { id },
  select: { statusHistory: true },
});

// SAFE: Zod validates the JSON data
const history = parseStatusHistory(notification?.statusHistory ?? null);
history.push({
  status,
  timestamp: new Date().toISOString(),
  reason,
});

// SAFE: Type-safe conversion
await prisma.notification.update({
  where: { id },
  data: { status, statusHistory: toStatusHistoryJson(history) },
});
```

**Benefits:**
- Runtime validation with Zod
- No type casts
- Invalid data logged and handled
- Full TypeScript inference

---

## Example 2: Type Preferences

### Before (Unsafe)
```typescript
// preference-checker.ts
const typePrefs: TypePreference | undefined =
  (preferences?.typePreferences as unknown as Record<string, TypePreference>)?.[type] ??
  DEFAULT_TYPE_PREFERENCES[type];
```

**Problems:**
- Unsafe type cast
- No validation
- Could access undefined properties

### After (Type-Safe)
```typescript
// preference-checker.ts
import { parseTypePreferences } from './json-helpers';

const parsedPreferences = preferences
  ? parseTypePreferences(preferences.typePreferences)
  : {};

const typePrefs: TypePreference =
  parsedPreferences[type] ?? DEFAULT_TYPE_PREFERENCES[type];
```

**Benefits:**
- Zod validates JSON structure
- Safe property access
- Clear fallback to defaults

---

## Example 3: Notification Templates

### Before (Unsafe)
```typescript
// notification-templates.ts
BOOKING_CONFIRMED: (meta) => {
  // UNSAFE: Type cast without validation
  const m = meta as unknown as BookingNotificationMetadata;

  return {
    title: 'Buchung bestätigt',
    body: `Dein Termin bei ${m.studioName} für ${m.serviceName}...`,
    actionUrl: `/bookings/${m.bookingId}`,
  };
},
```

**Problems:**
- No runtime validation
- Could access undefined properties
- Silent failures in production

### After (Type-Safe)
```typescript
// notification-templates.ts
import { assertBookingMetadata } from './utils/metadata-guards';

BOOKING_CONFIRMED: (meta) => {
  // SAFE: Validates and narrows type
  assertBookingMetadata(meta);

  return {
    title: 'Buchung bestätigt',
    body: `Dein Termin bei ${meta.studioName} für ${meta.serviceName}...`,
    actionUrl: `/bookings/${meta.bookingId}`,
  };
},
```

**Benefits:**
- Runtime validation with Zod
- Type narrowing after assertion
- Clear error messages
- Full autocomplete support

---

## Example 4: Creating Notifications

### Before (Unsafe)
```typescript
// notification-service.ts
const notification = await prisma.notification.create({
  data: {
    userId: input.userId,
    type: input.type,
    metadata: input.metadata as Prisma.InputJsonValue | undefined,
    statusHistory: [{
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      reason: 'Created',
    }] as Prisma.InputJsonValue,
  },
});
```

**Problems:**
- Type casts bypass validation
- Invalid metadata structure allowed
- No runtime checks

### After (Type-Safe)
```typescript
// notification-service.ts
import { toMetadataJson, toStatusHistoryJson } from './utils/json-helpers';
import type { StatusHistoryEntry } from '@/lib/schemas/notification.schema';

const initialStatusHistory: StatusHistoryEntry[] = [{
  status: 'PENDING',
  timestamp: new Date().toISOString(),
  reason: 'Created',
}];

const notification = await prisma.notification.create({
  data: {
    userId: input.userId,
    type: input.type,
    metadata: toMetadataJson(input.metadata),
    statusHistory: toStatusHistoryJson(initialStatusHistory),
  },
});
```

**Benefits:**
- Type-safe array construction
- Validated conversion to Prisma JSON
- Clear intent with helper functions
- No type casts

---

## Example 5: Helper Function Usage

### parseStatusHistory

```typescript
import { parseStatusHistory } from '@/lib/notifications/utils/json-helpers';

// From database
const dbRecord = await prisma.notification.findUnique({ where: { id } });

// Safe parsing with Zod validation
const history = parseStatusHistory(dbRecord.statusHistory);

// history is now StatusHistoryEntry[] with full type safety
history.forEach(entry => {
  console.log(entry.status);      // TypeScript knows this exists
  console.log(entry.timestamp);   // Validated ISO 8601 string
  console.log(entry.reason);      // Optional string
});
```

### toStatusHistoryJson

```typescript
import { toStatusHistoryJson } from '@/lib/notifications/utils/json-helpers';
import type { StatusHistoryEntry } from '@/lib/schemas/notification.schema';

// Type-safe array construction
const newHistory: StatusHistoryEntry[] = [
  {
    status: 'PENDING',
    timestamp: new Date().toISOString(),
    reason: 'Created',
  },
  {
    status: 'QUEUED',
    timestamp: new Date().toISOString(),
    reason: 'Added to queue',
  },
];

// Safe conversion to Prisma JSON
await prisma.notification.update({
  where: { id },
  data: {
    statusHistory: toStatusHistoryJson(newHistory),
  },
});
```

---

## Example 6: Type Guards in Templates

### isBookingMetadata (Type Guard)

```typescript
import { isBookingMetadata } from '@/lib/notifications/utils/metadata-guards';

function processMetadata(meta: unknown) {
  if (isBookingMetadata(meta)) {
    // TypeScript knows meta is BookingNotificationMetadata here
    console.log(meta.bookingId);
    console.log(meta.studioName);
    console.log(meta.serviceName);
    // All properties are type-safe!
  } else {
    console.log('Not booking metadata');
  }
}
```

### assertBookingMetadata (Assertion Function)

```typescript
import { assertBookingMetadata } from '@/lib/notifications/utils/metadata-guards';

function processBooking(meta: unknown) {
  // Throws if invalid, narrows type if valid
  assertBookingMetadata(meta);

  // After assertion, TypeScript knows meta is BookingNotificationMetadata
  const bookingUrl = `/bookings/${meta.bookingId}`;
  const message = `Booking at ${meta.studioName}`;

  return { bookingUrl, message };
}
```

---

## Example 7: Error Handling

### Before (Silent Failures)
```typescript
const m = meta as unknown as BookingNotificationMetadata;
// If meta is invalid, runtime error occurs later:
// TypeError: Cannot read property 'studioName' of undefined
```

### After (Logged and Handled)
```typescript
// In json-helpers.ts
export function parseStatusHistory(json: Prisma.JsonValue | null): StatusHistory {
  if (!json) {
    return [];
  }

  const result = statusHistorySchema.safeParse(json);

  if (!result.success) {
    logger.error('Invalid status history JSON:', {
      error: result.error,
      json,
    });
    return []; // Safe fallback
  }

  return result.data;
}

// In metadata-guards.ts
export function assertBookingMetadata(meta: unknown): asserts meta is BookingNotificationMetadata {
  if (!isBookingMetadata(meta)) {
    throw new Error('Invalid booking metadata'); // Clear error
  }
}
```

**Benefits:**
- Errors logged for debugging
- Safe fallbacks prevent crashes
- Clear error messages
- Easy to track in production

---

## Pattern for New Features

When adding new notification types with custom metadata:

```typescript
// 1. Define schema in lib/schemas/notification.schema.ts
export const myNewMetadataSchema = z.object({
  customField: z.string(),
  amount: z.number(),
});

export type MyNewMetadata = z.infer<typeof myNewMetadataSchema>;

// 2. Add type guard in lib/notifications/utils/metadata-guards.ts
export function isMyNewMetadata(meta: unknown): meta is MyNewMetadata {
  const result = myNewMetadataSchema.safeParse(meta);
  return result.success;
}

export function assertMyNewMetadata(meta: unknown): asserts meta is MyNewMetadata {
  if (!isMyNewMetadata(meta)) {
    throw new Error('Invalid metadata');
  }
}

// 3. Use in templates
MY_NEW_NOTIFICATION: (meta) => {
  assertMyNewMetadata(meta);
  return {
    title: 'New Notification',
    body: `Amount: ${meta.amount}, Field: ${meta.customField}`,
  };
},
```

---

## Testing Examples

### Unit Test for Helper Functions

```typescript
import { describe, it, expect } from 'vitest';
import { parseStatusHistory, toStatusHistoryJson } from '@/lib/notifications/utils/json-helpers';

describe('parseStatusHistory', () => {
  it('should parse valid status history', () => {
    const json = [
      { status: 'PENDING', timestamp: '2025-01-15T10:00:00Z', reason: 'Created' },
      { status: 'QUEUED', timestamp: '2025-01-15T10:00:01Z' },
    ];

    const result = parseStatusHistory(json);

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('PENDING');
    expect(result[1].reason).toBeUndefined();
  });

  it('should return empty array for invalid data', () => {
    const json = { invalid: 'data' };

    const result = parseStatusHistory(json as any);

    expect(result).toEqual([]);
  });

  it('should return empty array for null', () => {
    const result = parseStatusHistory(null);

    expect(result).toEqual([]);
  });
});
```

### Integration Test

```typescript
import { describe, it, expect } from 'vitest';
import { notificationService } from '@/lib/notifications/notification-service';

describe('NotificationService', () => {
  it('should create notification with type-safe metadata', async () => {
    const result = await notificationService.create({
      userId: 'user-123',
      type: 'BOOKING_CONFIRMED',
      metadata: {
        bookingId: 'booking-456',
        studioName: 'Studio ABC',
        serviceName: 'Haircut',
        appointmentTime: '2025-01-15T14:00:00Z',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBeDefined();
    }
  });
});
```

---

**Key Takeaways:**

1. **Never use `as unknown`** - Use helper functions and type guards
2. **Always validate JSON** - Use Zod schemas for runtime safety
3. **Use assertion functions** - For type narrowing in templates
4. **Log errors** - Invalid data should be logged for debugging
5. **Provide fallbacks** - Prevent crashes with safe defaults
6. **Test validation** - Unit test schema parsing and guards

