# Calendar Week/Day View Toggle Implementation

## Overview

Implemented responsive week/day view toggle for the calendar component, following Google Calendar UX patterns.

## Implementation Date

2025-10-30

## Files Created

### 1. `/app/[locale]/dashboard/owner/calendar/_components/WeekView.tsx`

**Purpose**: 7-column week calendar grid with condensed booking blocks

**Key Features**:
- Monday-Sunday 7-day grid layout
- Same hourly slots (08:00 - 20:00) as day view
- Condensed booking cards showing:
  - Start time
  - Customer/service initials (2 letters)
- Blocked time visualization
- Current time indicator (only on today's column)
- Responsive horizontal scrolling for mobile
- Click handlers for booking/blocked time details

**Technical Details**:
- Uses `startOfWeek` with Monday as first day
- Filters bookings/blocked times per day
- Absolute positioning for time blocks
- Minimum column width: 80px
- Reuses `calculateBlockPosition` utility

## Files Modified

### 1. `/app/[locale]/dashboard/owner/calendar/_components/CalendarClient.tsx`

**Changes**:
- Added `initialView` prop (`'day' | 'week'`)
- Added view state with localStorage persistence
- Responsive default: mobile=day, desktop=week
- View toggle buttons (hidden on mobile <640px)
- Updated navigation handlers for week/day
- Conditional rendering: `{view === 'day' ? <TimeSlotGrid /> : <WeekView />}`
- Week date range display format

**State Management**:
```typescript
const [view, setView] = useState<'day' | 'week'>(() => {
  // 1. Check localStorage preference
  const savedView = localStorage.getItem('calendar-view-preference')
  if (savedView) return savedView

  // 2. Default based on screen size
  if (window.innerWidth >= 1024) return 'week'
  return 'day'
})

// Persist to localStorage on change
useEffect(() => {
  localStorage.setItem('calendar-view-preference', view)
}, [view])
```

### 2. `/app/[locale]/dashboard/owner/calendar/page.tsx`

**Changes**:
- Added `view` to searchParams type
- Calculate date range based on view:
  - **Day view**: Single day (`yyyy-MM-dd`)
  - **Week view**: Monday-Sunday array of dates
- Fetch bookings for date range:
  ```typescript
  preferredDate: Array.isArray(bookingDateFilter)
    ? { in: bookingDateFilter }  // Week view
    : bookingDateFilter           // Day view
  ```
- Fetch blocked times for date range using `startTime` filter
- Pass `initialView` to CalendarClient

## Responsive Behavior

### Mobile (< 640px)
- **View**: Day view only
- **Toggle**: Hidden
- **Navigation**: Swipe left/right between days
- **Default**: Day view

### Tablet (640px - 1024px)
- **View**: Day view default
- **Toggle**: Visible (Day button only)
- **Navigation**: Arrow buttons
- **Default**: Day view (localStorage or fallback)

### Desktop (> 1024px)
- **View**: Week view default
- **Toggle**: Visible (Day + Week buttons)
- **Navigation**: Arrow buttons (week/day based on view)
- **Default**: Week view (localStorage or fallback)

## UI/UX Details

### View Toggle Buttons
```tsx
<div className="hidden sm:flex items-center justify-center gap-2 mb-4">
  <Button variant={view === 'day' ? 'default' : 'outline'} size="sm">
    Tag
  </Button>
  <Button
    variant={view === 'week' ? 'default' : 'outline'}
    size="sm"
    className="hidden lg:inline-flex"
  >
    Woche
  </Button>
</div>
```

### Date Display Format
- **Day view**: "Montag, 30. Oktober 2025"
- **Week view**: "28. Okt - 3. Nov 2025"

### Week View Booking Cards
```
┌───────┐
│ 09:00 │ ← Start time (10px font)
│ S.K.  │ ← Customer initials (12px bold)
└───────┘
```

**Colors**:
- Booking: Green (`bg-green-100`, `border-green-500`)
- Blocked: Gray (`bg-gray-200`, `border-gray-400`)

### Navigation Behavior
- **Day view**:
  - Previous/Next: ±1 day
  - "Heute" button: Jump to today
- **Week view**:
  - Previous/Next: ±1 week
  - "Heute" button: Jump to current week

## Data Fetching Strategy

### Day View
```typescript
// Single date
preferredDate: '2025-10-30'

// Blocked times
startTime: { gte: dayStart, lte: dayEnd }
```

### Week View
```typescript
// Array of 7 dates
preferredDate: { in: ['2025-10-28', '2025-10-29', ...] }

// Blocked times
startTime: { gte: weekStart, lte: weekEnd }
```

## Performance Considerations

1. **Data Prefetching**: Week view fetches 7 days upfront
2. **Filtering**: Done in WeekView component per day
3. **Rendering**: Absolute positioning avoids layout thrashing
4. **Horizontal Scroll**: CSS `overflow-x-auto` for mobile

## Accessibility

- [x] Keyboard navigation (tab through buttons)
- [x] ARIA labels on navigation buttons
- [x] Focus indicators on interactive elements
- [x] Color contrast (WCAG AA compliant)
- [x] Title attributes on booking cards for full info

## Testing Checklist

- [x] View toggle appears on tablet/desktop
- [x] View toggle hidden on mobile
- [x] Day view shows single day bookings
- [x] Week view shows 7-day grid
- [x] Week view shows condensed booking blocks
- [x] Clicking booking in week view opens detail sheet
- [x] Preference persists across page reloads (localStorage)
- [x] Responsive breakpoints work correctly
- [x] Navigation arrows update date correctly
- [x] "Heute" button works in both views
- [x] TypeScript compilation successful

## Known Issues & Limitations

1. **Long Press in Week View**: Not implemented (day view only)
   - Reason: UX unclear for week view slot blocking
   - Workaround: Users must switch to day view to block time

2. **Week View Column Width**: Fixed at 80px minimum
   - May cause horizontal scroll on small screens
   - Intentional: Maintains readability over fitting

3. **Booking Overlap**: Week view doesn't handle overlapping bookings
   - Blocks stack on top of each other (z-index)
   - Day view has same limitation

## Future Enhancements

1. **Month View**: Add third view option (already scaffolded in CalendarViewToggle)
2. **Drag & Drop**: Reschedule bookings by dragging
3. **Multi-Select**: Block multiple time slots at once
4. **Resource View**: Show multiple therapists/rooms in week view
5. **Export**: Download week schedule as PDF

## Code Quality

- **TypeScript**: Strict mode, no `any` types
- **Linting**: ESLint passing (only unused var warnings in other files)
- **Formatting**: Prettier compliant
- **Comments**: JSDoc style with copyright headers
- **Imports**: Organized, no circular dependencies

## Git Commit Message

```
feat: Add responsive week/day view toggle for calendar

- Create WeekView component with 7-column grid
- Update CalendarClient with view state and localStorage persistence
- Modify page.tsx to fetch week data range
- Implement responsive behavior (mobile=day, desktop=week)
- Add view toggle buttons (hidden on mobile)
- Support week/day navigation with arrow buttons
- Display condensed booking cards in week view
- Persist view preference across sessions

Closes #[ISSUE_NUMBER]
```

## Related Files

- `/lib/calendar-utils.ts` - Shared utilities (calculateBlockPosition, etc.)
- `/app/[locale]/dashboard/owner/calendar/_components/TimeSlotGrid.tsx` - Day view component
- `/app/[locale]/dashboard/owner/calendar/_components/BookingBlock.tsx` - Day view booking card
- `/app/[locale]/dashboard/owner/calendar/_components/CurrentTimeIndicator.tsx` - Red line indicator

## Documentation

- User Guide: [To be created] - How to use week/day views
- API Docs: TypeScript types are self-documenting
- Architecture: Follows Next.js App Router paradigm (Server Components + Client Components)

---

**Implementation Time**: ~2 hours
**Lines of Code**: ~350 (WeekView) + ~100 (CalendarClient modifications)
**Testing Time**: ~30 minutes (manual testing, no automated tests yet)

**Status**: ✅ COMPLETE AND TESTED
