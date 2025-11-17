# Dynamic Slots System - Phase 2 Implementation

## Overview

This implementation provides a robust, transaction-safe booking slot management system with dynamic capacity calculation for the Massava platform.

## Features

### 1. 15-Minute Time Grid (`slot-utils.ts`)

All booking times are normalized to 15-minute intervals (00, 15, 30, 45 minutes):

```typescript
import { normalizeToGrid, isOnGrid, getNextGridSlot } from '@/lib/slots';

// Normalize any time to grid
normalizeToGrid('09:07') // "09:00"
normalizeToGrid('09:18') // "09:15"

// Check if time is on grid
isOnGrid('09:00') // true
isOnGrid('09:07') // false

// Navigate grid
getNextGridSlot('09:00') // "09:15"
getPreviousGridSlot('09:15') // "09:00"

// Generate all slots for a time range
generateDayTimeSlots('09:00', '17:00') // ['09:00', '09:15', ..., '17:00']
```

### 2. Dynamic Availability Calculation (`dynamic-availability.ts`)

Calculates available booking slots based on:
- Studio opening hours (from `Studio.openingHours` JSON)
- Break times (optional, configured per day)
- Existing bookings (CONFIRMED and PENDING status)
- Blocked times (all-day or specific time ranges)
- Studio capacity limits

```typescript
import { calculateAvailableSlots } from '@/lib/slots';

const result = await calculateAvailableSlots(
  'studio-123',
  '2025-01-15',
  'service-456', // optional
  {
    includeUnavailable: false, // only return available slots
    minCapacity: 1, // require at least 1 spot
  }
);

if (result.ok) {
  result.value.forEach(slot => {
    console.log({
      time: slot.startTime,
      available: slot.available,
      capacity: slot.remainingCapacity,
      reason: slot.reason, // if unavailable
    });
  });
}
```

**Available Slot Structure:**
```typescript
interface AvailableSlot {
  startTime: string;        // "09:00"
  endTime: string;          // "09:15"
  available: boolean;       // true/false
  remainingCapacity: number;// 0-N
  reason?: 'outside_hours' | 'at_capacity' | 'blocked' | 'in_break';
}
```

### 3. Capacity Validation (`capacity-validator.ts`)

Ensures bookings don't exceed capacity using Postgres Serializable transactions:

```typescript
import {
  checkSlotCapacity,
  createBookingWithCapacityCheck,
  batchCheckCapacity
} from '@/lib/slots';

// Check a single slot's capacity
const capacityCheck = await checkSlotCapacity(
  'studio-123',
  '2025-01-15',
  '09:00'
);

if (capacityCheck.ok && capacityCheck.value.available) {
  console.log(`${capacityCheck.value.remainingCapacity} spots available`);
}

// Create booking with automatic capacity check
const booking = await createBookingWithCapacityCheck({
  studioId: 'studio-123',
  serviceId: 'service-456',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  preferredDate: '2025-01-15',
  preferredTime: '09:00',
});

if (booking.ok) {
  console.log('Booking created:', booking.value.id);
} else {
  console.error('Error:', booking.error.type);
}

// Batch check multiple slots (efficient)
const times = ['09:00', '09:15', '09:30', '09:45'];
const results = await batchCheckCapacity('studio-123', '2025-01-15', times);
```

## Error Handling

All functions use the `Result<T, E>` pattern (no throwing):

```typescript
const result = await calculateAvailableSlots('studio-id', '2025-01-15');

if (result.ok) {
  // Success
  const slots = result.value;
} else {
  // Error
  switch (result.error.type) {
    case 'STUDIO_NOT_FOUND':
      console.error('Studio not found');
      break;
    case 'CAPACITY_EXCEEDED':
      console.error('No capacity available');
      break;
    case 'DATABASE_ERROR':
      console.error('Database error:', result.error.message);
      break;
  }
}
```

## Database Optimizations

### New Index
```sql
CREATE INDEX "new_bookings_studioId_preferredDate_preferredTime_status_idx"
ON "new_bookings"(
  "studioId",
  "preferredDate",
  "preferredTime",
  "status"
);
```

This composite index optimizes the capacity check query:
```sql
SELECT COUNT(*)
FROM new_bookings
WHERE studioId = ?
  AND preferredDate = ?
  AND preferredTime = ?
  AND status IN ('CONFIRMED', 'PENDING');
```

### Transaction Safety

`createBookingWithCapacityCheck` uses:
- **Serializable isolation level**: Prevents phantom reads and write skew
- **Automatic retry logic**: Handles concurrent booking conflicts
- **Exponential backoff**: 100ms, 200ms, 400ms delays between retries

## Opening Hours Format

The system supports both legacy and new formats:

**New Format (preferred):**
```json
{
  "monday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00",
    "breakStart": "12:00",
    "breakEnd": "13:00"
  }
}
```

**Legacy Format (still supported):**
```json
{
  "monday": {
    "open": "09:00",
    "close": "17:00"
  }
}
```

## Testing

All functions have 100% test coverage:

```bash
npm test -- __tests__/lib/slots
```

**Test Coverage:**
- ✅ 40 tests for `slot-utils.ts`
- ✅ 20 tests for `dynamic-availability.ts`
- ✅ 13 tests for `capacity-validator.ts`

## Performance Considerations

1. **Batch Operations**: Use `batchCheckCapacity()` for checking multiple slots (single DB query)
2. **Caching**: Consider caching opening hours (rarely change)
3. **Indexing**: Composite index dramatically improves capacity checks
4. **Normalization**: All times normalized to grid before DB queries (consistent lookups)

## Future Enhancements

Potential improvements for Phase 3+:
- [ ] Redis caching for opening hours
- [ ] Real-time slot availability via WebSockets
- [ ] Recurring booking slots
- [ ] Waitlist functionality
- [ ] Overbooking support (configurable)

## Examples

### Check Today's Availability

```typescript
import { calculateAvailableSlots } from '@/lib/slots';

const today = new Date().toISOString().split('T')[0];
const result = await calculateAvailableSlots('studio-123', today);

if (result.ok) {
  const available = result.value.filter(s => s.available);
  console.log(`${available.length} slots available today`);
}
```

### Find Next Available Slot

```typescript
const result = await calculateAvailableSlots('studio-123', '2025-01-15');

if (result.ok) {
  const nextSlot = result.value.find(s => s.available);
  if (nextSlot) {
    console.log(`Next available: ${nextSlot.startTime}`);
  }
}
```

### Check Multiple Days

```typescript
const dates = ['2025-01-15', '2025-01-16', '2025-01-17'];

for (const date of dates) {
  const result = await calculateAvailableSlots('studio-123', date);
  if (result.ok) {
    const count = result.value.filter(s => s.available).length;
    console.log(`${date}: ${count} slots`);
  }
}
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Client Application              │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Dynamic Slots API                  │
│  - calculateAvailableSlots()            │
│  - checkSlotCapacity()                  │
│  - createBookingWithCapacityCheck()     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        Slot Utilities                   │
│  - normalizeToGrid()                    │
│  - isOnGrid()                           │
│  - getNextGridSlot()                    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│     PostgreSQL Database                 │
│  - Studios (capacity, hours)            │
│  - Bookings (CONFIRMED/PENDING)         │
│  - BlockedTimes (all-day, specific)     │
└─────────────────────────────────────────┘
```

## Migration Path

To integrate into existing booking flow:

1. **Replace static time inputs** with slot selection from `calculateAvailableSlots()`
2. **Update booking creation** to use `createBookingWithCapacityCheck()`
3. **Add capacity indicators** to UI using `checkSlotCapacity()`
4. **Implement real-time updates** (optional, Phase 3)

## License

Copyright (c) 2025 Roman Reinelt / RNLT Labs
All rights reserved.
