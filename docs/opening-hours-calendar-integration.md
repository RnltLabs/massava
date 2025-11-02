# Opening Hours Calendar Integration

**Status**: Implemented
**Date**: 2025-10-31
**Author**: Claude Code / RNLT Labs

## Overview

The calendar now automatically blocks times outside of business hours by generating virtual blocked time entries based on the studio's configured opening hours. This prevents customers from booking appointments during closed hours and provides visual feedback to studio owners.

## Architecture

### Key Components

1. **`/lib/opening-hours-utils.ts`** - Utility functions for generating virtual blocked times
2. **`/app/[locale]/dashboard/owner/calendar/page.tsx`** - Server component that generates virtual blocks
3. **`/app/[locale]/dashboard/owner/calendar/_components/BlockedTimeBlock.tsx`** - Renders both real and virtual blocks
4. **`/app/[locale]/dashboard/owner/calendar/_components/CalendarClient.tsx`** - Client-side calendar state management
5. **`/app/[locale]/dashboard/owner/calendar/_components/TimeSlotGrid.tsx`** - Day view grid
6. **`/app/[locale]/dashboard/owner/calendar/_components/WeekView.tsx`** - Week view grid

### Data Flow

```
Studio.openingHours (JSON in DB)
    ↓
generateClosedTimeBlocks() (opening-hours-utils.ts)
    ↓
Virtual BlockedTime objects
    ↓
Merged with real BlockedTime entries from DB
    ↓
Passed to CalendarClient → TimeSlotGrid/WeekView
    ↓
Rendered by BlockedTimeBlock component
```

## Implementation Details

### Opening Hours Format

Opening hours are stored in `Studio.openingHours` as JSON:

```typescript
// Same hours every day
{
  "everyday": { "open": "09:00", "close": "20:00" }
}

// Different hours per day
{
  "monday": { "open": "09:00", "close": "20:00" },
  "tuesday": { "open": "09:00", "close": "20:00" },
  "wednesday": null, // Closed all day
  "thursday": { "open": "10:00", "close": "18:00" },
  "friday": { "open": "09:00", "close": "20:00" },
  "saturday": { "open": "10:00", "close": "16:00" },
  "sunday": null // Closed all day
}
```

### Virtual Blocked Time Type

```typescript
export type VirtualBlockedTime = {
  id: string;              // Format: "virtual-{type}-{date}"
  studioId: string;
  startTime: Date;
  endTime: Date;
  reason: string;          // "Geschlossen"
  isAllDay: boolean;       // true for full-day closures
  isVirtual: true;         // Flag to distinguish from DB entries
  createdAt: Date;
  updatedAt: Date;
};
```

### Block Generation Logic

**Scenario 1: Studio Open (e.g., 09:00-18:00)**
- Virtual block 1: 00:00 → 09:00 (before opening)
- Virtual block 2: 18:00 → 23:59 (after closing)

**Scenario 2: Studio Closed All Day**
- Virtual block: 00:00 → 23:59 (full day, `isAllDay: true`)

**Scenario 3: No Opening Hours Set**
- No virtual blocks generated (allows full flexibility during setup)

### Visual Design

**Virtual Blocks (Closed Hours)**:
- Dashed border (`border-2 border-dashed border-gray-400`)
- Light gray background (`bg-gray-100/50`)
- Clock icon (🕒)
- Label: "Geschlossen"
- Non-clickable (no delete/edit option)
- Tooltip: "Außerhalb der Öffnungszeiten"

**User-Created Blocks**:
- Solid border (`border border-gray-300`)
- Gray background (`bg-gray-100`)
- Stop sign icon (🚫)
- Label: "Blockiert"
- Clickable (can delete/edit)
- Shows custom reason if provided

## Usage

### Day View

1. Server component loads studio with `openingHours`
2. Calls `generateClosedTimeBlocks(selectedDate, openingHours, studioId)`
3. Merges virtual blocks with DB blocked times
4. Passes combined array to `CalendarClient`
5. Renders in `TimeSlotGrid`

### Week View

1. Server component loads studio with `openingHours`
2. Generates virtual blocks for **all 7 days** of the week:
   ```typescript
   const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
   const virtualBlockedTimes = Array.from({ length: 7 }, (_, i) => {
     const day = addDays(weekStart, i);
     return generateClosedTimeBlocks(day, openingHours, studioId);
   }).flat();
   ```
3. Merges with DB blocked times
4. Passes to `CalendarClient` → `WeekView`

## User Interaction

### Studio Owner

- **View Calendar**: Sees closed hours automatically blocked with dashed borders
- **Click Virtual Block**: No action (non-editable, shows tooltip)
- **Click Real Block**: Opens dialog to delete/edit
- **Change Opening Hours**: Updates take effect immediately on next calendar load

### Customers (Future)

When booking integration is added:
- Closed hours won't show as available time slots
- Prevents accidental bookings outside business hours
- Improves UX by showing only realistic booking times

## Edge Cases Handled

1. **No Opening Hours Set**: Returns empty array (no blocks)
2. **24-Hour Studio**: Minimal blocks (only last minute if `close: "23:59"`)
3. **Closed Day**: Single full-day block with `isAllDay: true`
4. **Midnight Opening**: Handles `"00:00"` correctly
5. **Different Hours Per Day**: Generates correct blocks for each weekday

## Testing

### Unit Tests

Location: `/Users/roman/Development/massava/__tests__/lib/opening-hours-utils.test.ts`

Tests:
- ✅ Returns empty array when no opening hours
- ✅ Blocks entire day when studio is closed
- ✅ Blocks before and after opening hours
- ✅ Handles different hours per day
- ✅ Handles 24-hour opening
- ✅ Sets correct studioId for all blocks
- ✅ Generates unique IDs for different dates

### Manual Testing Checklist

- [ ] Open calendar with opening hours 09:00-18:00
- [ ] Verify times before 09:00 show "Geschlossen" with dashed border
- [ ] Verify times after 18:00 show "Geschlossen" with dashed border
- [ ] Click virtual block → No dialog opens
- [ ] Switch to week view → All 7 days show correct closed hours
- [ ] Set Wednesday as closed → Entire day blocked
- [ ] Change opening hours → Calendar updates correctly
- [ ] Studio with no opening hours → No virtual blocks shown

## Performance Considerations

- Virtual blocks generated on server (no client-side overhead)
- Minimal memory footprint (2-3 blocks per day max)
- No database queries for virtual blocks
- Week view generates 7 days × 2-3 blocks = ~14-21 virtual blocks max

## Future Enhancements

1. **Break Times**: Support for lunch breaks within opening hours
   ```json
   {
     "monday": {
       "open": "09:00",
       "close": "20:00",
       "breaks": [{ "start": "12:00", "end": "13:00" }]
     }
   }
   ```

2. **Seasonal Hours**: Different hours for different date ranges
3. **Public Holidays**: Auto-close on configurable holidays
4. **Booking Integration**: Pass virtual blocks to customer booking flow
5. **Drag-to-Adjust**: Allow owners to drag virtual block edges to adjust hours

## Related Files

- `/prisma/schema.prisma` - `Studio.openingHours` field (JSON type)
- `/lib/calendar-utils.ts` - Core calendar calculations
- `/app/[locale]/studios/register/_components/OpeningHoursForm.tsx` - Opening hours configuration UI

## Migration Notes

No database migration required - uses existing `Studio.openingHours` field.

Backwards compatible:
- Existing calendars without opening hours: No change in behavior
- Existing calendars with opening hours: Automatically show virtual blocks

## Support

For questions or issues:
- Check TypeScript types in `/lib/opening-hours-utils.ts`
- Review test cases in `/__tests__/lib/opening-hours-utils.test.ts`
- Inspect calendar page logic in `/app/[locale]/dashboard/owner/calendar/page.tsx`
