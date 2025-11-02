# Calendar Week/Day View - Manual Test Plan

## Test Date: 2025-10-30

## Prerequisites

- [ ] Development server running (`npm run dev`)
- [ ] Database seeded with test bookings
- [ ] At least one studio configured
- [ ] Test user authenticated as studio owner

## Test Environment Setup

1. Navigate to: `/[locale]/dashboard/owner/calendar`
2. Open browser DevTools (Responsive Design Mode)
3. Clear localStorage: `localStorage.clear()` (reset preferences)

---

## 1. Mobile Behavior (< 640px)

### Test Device: iPhone 12 (390px width)

- [ ] **View Toggle Hidden**
  - Toggle buttons NOT visible
  - Only date navigation and "Heute" button shown

- [ ] **Day View Only**
  - Calendar shows single day time-slot grid
  - Bookings displayed as full cards
  - Vertical scrolling works

- [ ] **Navigation**
  - Left arrow: Goes to previous day
  - Right arrow: Goes to next day
  - "Heute" button: Jumps to today

- [ ] **Booking Interaction**
  - Tap booking: Opens detail sheet
  - Long press empty slot: Opens block time dialog

---

## 2. Tablet Behavior (640px - 1024px)

### Test Device: iPad (768px width)

- [ ] **View Toggle Visible**
  - "Tag" button visible
  - "Woche" button HIDDEN (only shows on desktop)

- [ ] **Default View**
  - First visit: Day view shown
  - After toggle: Preference saved to localStorage

- [ ] **Day View**
  - Time-slot grid (08:00 - 20:00)
  - Full booking cards with details
  - Summary: "X Buchung(en) • Y Blockierung(en)"

- [ ] **Navigation in Day View**
  - Arrows: ±1 day
  - Date display: "Montag, 30. Oktober 2025"

---

## 3. Desktop Behavior (> 1024px)

### Test Device: MacBook (1440px width)

- [ ] **View Toggle Visible**
  - "Tag" button visible
  - "Woche" button visible

- [ ] **Default View**
  - First visit: Week view shown
  - After localStorage clear: Defaults to week view

- [ ] **Week View Layout**
  - 7 columns: Monday - Sunday
  - Day headers show weekday + date
  - Today's column highlighted (subtle background)
  - Hourly rows: 08:00 - 20:00

- [ ] **Week View Bookings**
  - Booking blocks show start time
  - Booking blocks show customer initials (2 letters)
  - Green background with border
  - Click booking: Opens detail sheet
  - Tooltip on hover: Full booking info

- [ ] **Week View Blocked Times**
  - Gray background with border
  - Shows start time + 🚫 emoji
  - Click blocked: Opens unblock dialog

- [ ] **Week View Current Time**
  - Red line indicator only on today's column
  - Updates position in real-time

- [ ] **Navigation in Week View**
  - Arrows: ±1 week
  - Date display: "28. Okt - 3. Nov 2025"
  - "Heute" button: Jumps to current week

---

## 4. View Toggle Functionality

- [ ] **Day → Week Switch**
  - Click "Woche" button
  - URL updates: `?view=week&date=...`
  - Week grid loads with 7 days
  - Button becomes active (default variant)

- [ ] **Week → Day Switch**
  - Click "Tag" button
  - URL updates: `?view=day&date=...`
  - Single day grid loads
  - Button becomes active (default variant)

- [ ] **Preference Persistence**
  - Switch to week view
  - Refresh page (F5)
  - Week view still active
  - Check localStorage: `calendar-view-preference: "week"`

---

## 5. Data Loading

### Day View Data

- [ ] **Correct Date Range**
  - Only bookings for selected day shown
  - Only blocked times for selected day shown

- [ ] **Status Filter**
  - CONFIRMED bookings shown
  - PENDING bookings shown
  - CANCELLED bookings NOT shown

### Week View Data

- [ ] **Correct Date Range**
  - Bookings for all 7 days loaded
  - Blocked times for all 7 days loaded

- [ ] **Per-Day Filtering**
  - Each day column shows only its bookings
  - No overlap between day columns

---

## 6. Responsive Breakpoints

- [ ] **Resize: Desktop → Tablet (1024px)**
  - "Woche" button disappears
  - If week view active, stays in week view
  - If day view active, stays in day view

- [ ] **Resize: Tablet → Mobile (640px)**
  - All toggle buttons disappear
  - If week view active, stays in week view (horizontal scroll)
  - If day view active, stays in day view

- [ ] **Resize: Mobile → Desktop (640px → 1024px)**
  - Toggle buttons reappear
  - Current view preserved
  - Preference from localStorage applied

---

## 7. Edge Cases

### Empty States

- [ ] **No Bookings**
  - Day view: Empty grid shown
  - Week view: Empty grid shown
  - Summary: "0 Buchung(en)"

- [ ] **No Blocked Times**
  - Summary: "0 Blockierung(en)"

### Date Boundaries

- [ ] **Week Spanning Month End**
  - Week: Oct 28 - Nov 3
  - Date display: "28. Okt - 3. Nov 2025"
  - Bookings load correctly across month boundary

- [ ] **Week Spanning Year End**
  - Week: Dec 30 - Jan 5
  - Date display: "30. Dez 2024 - 5. Jan 2025"

### Overlapping Bookings

- [ ] **Week View Overlap**
  - If 2 bookings at same time:
    - Both blocks visible (stacked)
    - Both clickable
    - z-index handles layering

- [ ] **Day View Overlap**
  - Same behavior as week view

---

## 8. Accessibility

- [ ] **Keyboard Navigation**
  - Tab through: Toggle buttons → Arrow buttons → "Heute" button
  - Enter/Space: Activate buttons
  - Focus indicators visible

- [ ] **Screen Reader**
  - ARIA labels on navigation buttons
  - Button roles announced
  - Current view announced

- [ ] **Color Contrast**
  - Toggle buttons: WCAG AA compliant
  - Booking cards: Text readable on background
  - Date headers: Today highlight not color-only

---

## 9. Performance

- [ ] **Week View Load Time**
  - Initial load: < 1 second
  - Week navigation: < 500ms
  - No layout shift

- [ ] **Day View Load Time**
  - Initial load: < 500ms
  - Day navigation: < 300ms

- [ ] **View Toggle Speed**
  - Switch day → week: < 300ms
  - Switch week → day: < 300ms

---

## 10. Integration with Existing Features

### Booking Detail Sheet

- [ ] **Open from Day View**
  - Click booking card
  - Sheet opens with full details
  - Close sheet: Returns to day view

- [ ] **Open from Week View**
  - Click condensed booking block
  - Sheet opens with full details
  - Close sheet: Returns to week view

### Block Time Dialog

- [ ] **Day View Only**
  - Long press empty slot
  - Dialog opens with prefilled time
  - Create block: Appears in grid

- [ ] **Week View (No Block)**
  - Cannot long press to block
  - Must switch to day view

### Unblock Confirm Dialog

- [ ] **Day View**
  - Click blocked time
  - Confirm dialog opens
  - Unblock: Removed from grid

- [ ] **Week View**
  - Click blocked time in week grid
  - Confirm dialog opens
  - Unblock: Removed from week grid

---

## 11. URL Query Parameters

- [ ] **View Parameter**
  - Day view: `?view=day&date=2025-10-30`
  - Week view: `?view=week&date=2025-10-30`
  - Default (no param): Uses localStorage or responsive default

- [ ] **Date Parameter**
  - Valid date: Loads that date/week
  - Invalid date: Falls back to today
  - Missing date: Falls back to today

- [ ] **Deep Linking**
  - Share URL: `?view=week&date=2025-10-30`
  - Recipient opens: Week view at correct date

---

## 12. Browser Compatibility

- [ ] **Chrome (latest)**
  - All features working
  - No console errors

- [ ] **Firefox (latest)**
  - All features working
  - No console errors

- [ ] **Safari (latest)**
  - All features working
  - localStorage works
  - Date formatting correct (de-DE locale)

- [ ] **Edge (latest)**
  - All features working

---

## Test Results Summary

**Date Tested**: ___________
**Tested By**: ___________
**Browser**: ___________
**Pass/Fail**: ___________

**Issues Found**:
1. _________________________________
2. _________________________________
3. _________________________________

**Notes**:
___________________________________________
___________________________________________
___________________________________________

---

## Automated Test Coverage (Future)

- [ ] Unit tests: View state management
- [ ] Unit tests: Date range calculations
- [ ] Integration tests: Server Actions
- [ ] E2E tests: View toggle flow
- [ ] E2E tests: Booking click in week view
- [ ] E2E tests: Responsive behavior

**Test Framework**: Playwright + Vitest
**Coverage Goal**: 100% for business logic

---

**Last Updated**: 2025-10-30
**Status**: Ready for Manual Testing
