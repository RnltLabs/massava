# Notification System Type Safety Improvements

## Summary

Removed all `as unknown` type casts from the notification system and replaced them with proper TypeScript type safety using Zod schemas, type guards, and assertion functions.

## Changes Made

### 1. Created Zod Schemas (`lib/schemas/notification.schema.ts`)

**New file** with comprehensive validation schemas for all notification JSON types:

- `statusHistoryEntrySchema` - Validates individual status history entries
- `statusHistorySchema` - Validates status history arrays
- `typePreferenceSchema` - Validates notification type preferences
- `typePreferencesSchema` - Validates preference maps
- `notificationMetadataSchema` - Union of all metadata types

**Benefits:**
- Runtime validation of data from database
- Type inference for TypeScript types
- Single source of truth for JSON structure

### 2. Created JSON Helper Functions (`lib/notifications/utils/json-helpers.ts`)

**New file** with type-safe conversion utilities:

#### Status History Helpers
- `parseStatusHistory(json)` - Safely parse from Prisma JSON → TypeScript array
- `toStatusHistoryJson(history)` - Convert TypeScript array → Prisma JSON

#### Type Preferences Helpers
- `parseTypePreferences(json)` - Safely parse from Prisma JSON → TypeScript object
- `toTypePreferencesJson(preferences)` - Convert TypeScript object → Prisma JSON

#### Metadata Helpers
- `parseMetadata(json)` - Safely parse generic metadata
- `toMetadataJson(metadata)` - Convert metadata → Prisma JSON

#### Type Guards
- `isPrismaJsonValue(value)` - Check if value is valid Prisma JSON
- `isPrismaJsonObject(value)` - Check if value is Prisma JSON object
- `isPrismaJsonArray(value)` - Check if value is Prisma JSON array

**Benefits:**
- Centralized conversion logic
- Zod validation with error logging
- Type-safe interfaces

### 3. Created Metadata Type Guards (`lib/notifications/utils/metadata-guards.ts`)

**New file** with runtime type guards and assertion functions:

#### Type Guards
- `isBookingMetadata(meta)` - Check if booking metadata
- `isPaymentMetadata(meta)` - Check if payment metadata
- `isReviewMetadata(meta)` - Check if review metadata
- `isSecurityMetadata(meta)` - Check if security metadata
- `isSystemMetadata(meta)` - Check if system metadata

#### Assertion Functions (TypeScript assertions)
- `assertBookingMetadata(meta)` - Assert booking metadata or throw
- `assertPaymentMetadata(meta)` - Assert payment metadata or throw
- `assertReviewMetadata(meta)` - Assert review metadata or throw
- `assertSecurityMetadata(meta)` - Assert security metadata or throw
- `assertSystemMetadata(meta)` - Assert system metadata or throw

**Benefits:**
- Type narrowing in templates
- Runtime validation with Zod
- Clear error messages

### 4. Updated Notification Service (`lib/notifications/notification-service.ts`)

**Removed type casts:**

#### Before:
```typescript
// Line 195 - Creating notification
metadata: input.metadata as Prisma.InputJsonValue | undefined,
statusHistory: [{
  status: 'PENDING',
  timestamp: new Date().toISOString(),
  reason: 'Created',
}] as Prisma.InputJsonValue,

// Line 479 - Reading status history
const history = (notification?.statusHistory as unknown as StatusHistoryEntry[]) ?? [];

// Line 488 - Writing status history
data: { status, statusHistory: history as unknown as Prisma.InputJsonValue },

// Line 627 - Parsing metadata
metadata: notification.metadata as Record<string, unknown> | undefined,
```

#### After:
```typescript
// Creating notification
const initialStatusHistory: StatusHistoryEntry[] = [{
  status: 'PENDING',
  timestamp: new Date().toISOString(),
  reason: 'Created',
}];

const notification = await prisma.notification.create({
  data: {
    metadata: toMetadataJson(input.metadata),
    statusHistory: toStatusHistoryJson(initialStatusHistory),
  },
});

// Reading and updating status history
const history = parseStatusHistory(notification?.statusHistory ?? null);
history.push({
  status,
  timestamp: new Date().toISOString(),
  reason,
});

await prisma.notification.update({
  where: { id },
  data: { status, statusHistory: toStatusHistoryJson(history) },
});

// Parsing metadata
metadata: parseMetadata(notification.metadata),
```

**Benefits:**
- Type-safe JSON operations
- Runtime validation with Zod
- Error logging for invalid data
- No type casts

### 5. Updated Preference Checker (`lib/notifications/utils/preference-checker.ts`)

**Removed type casts:**

#### Before:
```typescript
const typePrefs: TypePreference | undefined =
  (preferences?.typePreferences as unknown as Record<string, TypePreference>)?.[type] ??
  DEFAULT_TYPE_PREFERENCES[type];
```

#### After:
```typescript
const parsedPreferences = preferences
  ? parseTypePreferences(preferences.typePreferences)
  : {};

const typePrefs: TypePreference =
  parsedPreferences[type] ?? DEFAULT_TYPE_PREFERENCES[type];
```

**Benefits:**
- Zod validation of JSON from database
- Type-safe preference lookup
- Proper error handling

### 6. Updated Notification Templates (`lib/notifications/notification-templates.ts`)

**Removed all `as unknown` casts:**

#### Before:
```typescript
BOOKING_REQUEST_RECEIVED: (meta) => {
  const m = meta as unknown as BookingNotificationMetadata;
  return {
    title: 'Neue Buchungsanfrage',
    body: `${m.customerName} möchte ${m.serviceName}...`,
  };
},
```

#### After:
```typescript
BOOKING_REQUEST_RECEIVED: (meta) => {
  assertBookingMetadata(meta);
  return {
    title: 'Neue Buchungsanfrage',
    body: `${meta.customerName} möchte ${meta.serviceName}...`,
  };
},
```

**Changed templates:**
- `BOOKING_REQUEST_RECEIVED` - Uses `assertBookingMetadata`
- `BOOKING_CANCELLED_BY_CUSTOMER` - Uses `assertBookingMetadata`
- `BOOKING_REMINDER_STUDIO` - Uses `assertBookingMetadata`
- `PAYMENT_RECEIVED` - Uses `assertPaymentMetadata`
- `REVIEW_POSTED` - Uses `assertReviewMetadata`
- `BOOKING_CONFIRMED` - Uses `assertBookingMetadata`
- `BOOKING_REJECTED` - Uses `assertBookingMetadata`
- `BOOKING_REMINDER_CUSTOMER` - Uses `assertBookingMetadata`
- `BOOKING_CANCELLED_BY_STUDIO` - Uses `assertBookingMetadata`
- `REVIEW_REQUEST` - Uses `assertBookingMetadata`

**Benefits:**
- Runtime validation with Zod
- Type narrowing after assertion
- Clear error messages when metadata is invalid
- No unsafe type casts

## Files Created

1. `/lib/schemas/notification.schema.ts` - Zod schemas for notification types
2. `/lib/notifications/utils/json-helpers.ts` - Type-safe JSON conversion utilities
3. `/lib/notifications/utils/metadata-guards.ts` - Runtime type guards and assertions

## Files Modified

1. `/lib/notifications/notification-service.ts` - Replaced 4 type casts
2. `/lib/notifications/utils/preference-checker.ts` - Replaced 2 type casts
3. `/lib/notifications/notification-templates.ts` - Replaced 10 type casts

## Type Safety Improvements

### Before
- **16 total `as unknown` type casts** bypassing TypeScript's type system
- No runtime validation of JSON data
- Risk of runtime errors from invalid data
- Difficult to debug type mismatches

### After
- **0 `as unknown` type casts**
- Runtime validation with Zod schemas
- Type-safe conversion functions
- Clear error messages with logging
- Full TypeScript type inference

## Testing Checklist

- [x] All `as unknown` casts removed
- [x] Zod schemas created for all JSON types
- [x] Type guards and assertions created
- [x] Helper functions use Zod for validation
- [x] Error logging added for invalid data
- [x] TypeScript types properly inferred
- [ ] Unit tests for helper functions (TODO)
- [ ] Integration tests for notification service (TODO)

## Migration Notes

### For Future Development

When working with Prisma JSON fields:

1. **Define Zod schema** in `/lib/schemas/notification.schema.ts`
2. **Create type guard** in appropriate utils file
3. **Use helper functions** for conversion:
   - `parseX(json)` - Parse from database
   - `toXJson(data)` - Convert to database
4. **Never use `as unknown`** - Use type guards/assertions instead

### Example Pattern

```typescript
// 1. Define schema
const myDataSchema = z.object({
  field1: z.string(),
  field2: z.number(),
});

// 2. Export type
export type MyData = z.infer<typeof myDataSchema>;

// 3. Create helpers
export function parseMyData(json: Prisma.JsonValue | null): MyData {
  const result = myDataSchema.safeParse(json);
  if (!result.success) {
    logger.error('Invalid data:', { error: result.error });
    return defaultValue;
  }
  return result.data;
}

export function toMyDataJson(data: MyData): Prisma.JsonObject {
  return data as Prisma.JsonObject;
}

// 4. Use in code
const parsed = parseMyData(dbRecord.jsonField);
await prisma.update({ data: { jsonField: toMyDataJson(myData) } });
```

## Benefits Summary

1. **Type Safety**: Full TypeScript type checking without bypassing with casts
2. **Runtime Validation**: Zod validates all JSON data from database
3. **Error Handling**: Clear error messages and logging for debugging
4. **Maintainability**: Centralized conversion logic in helper functions
5. **Developer Experience**: Better autocomplete and type inference
6. **Production Safety**: Invalid data caught at runtime instead of causing crashes

## Related Documentation

- [Notification System Architecture](./ARCHITECTURE.md)
- [Prisma JSON Best Practices](../PRISMA_JSON_PATTERNS.md)
- [Zod Validation Guide](../ZOD_VALIDATION.md)

---

**Last Updated**: 2025-12-02
**Author**: Development Team
