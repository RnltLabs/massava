# Testing Guide - Thai Studio Dashboard

**Implementation Date**: 2025-10-30
**Status**: Ready for Local Testing

## Quick Start

### Prerequisites

1. **Database with Test Data**:
   - At least one User with role `STUDIO_OWNER`
   - At least one Studio linked via StudioOwnership
   - Some Services for the Studio
   - Some NewBookings in PENDING and CONFIRMED status

2. **Environment**:
   - Node.js running
   - Database accessible
   - Next.js dev server

### Start Testing

```bash
# Start dev server
npm run dev

# Open browser
# http://localhost:3000/de (or your locale)

# Login as studio owner
# Should auto-redirect to /de/dashboard/owner
```

## Test Scenarios

### Scenario 1: First Login (Studio Owner)

**Goal**: Verify redirect and dashboard loads correctly

**Steps**:
1. Navigate to `/de/dashboard`
2. Verify automatic redirect to `/de/dashboard/owner`
3. Check page loads without errors
4. Verify studio name displays in header
5. Check bottom tab navigation appears on mobile (<768px)

**Expected Results**:
- ✅ Smooth redirect
- ✅ Dashboard loads with studio data
- ✅ Bottom tabs visible on mobile
- ✅ Badge counts show correct numbers
- ✅ No console errors

---

### Scenario 2: View Pending Bookings

**Goal**: Verify pending bookings display and actions work

**Steps**:
1. Ensure test data has PENDING bookings
2. Navigate to dashboard
3. Locate "Neue Anfragen" section
4. Check booking cards display:
   - Orange "Reserviert" badge
   - Customer name
   - Date and time
   - Service name
   - Large Accept/Decline buttons
5. Check empty state if no bookings

**Expected Results**:
- ✅ All pending bookings visible
- ✅ Information complete and readable
- ✅ Buttons are large (56px height)
- ✅ Empty state shows if no bookings
- ✅ Mobile responsive layout

---

### Scenario 3: Accept Booking (Optimistic Update)

**Goal**: Test booking confirmation with optimistic UI

**Steps**:
1. Find a PENDING booking
2. Click "Annehmen" (Accept) button
3. Observe immediate UI changes:
   - Button shows "Wird bestätigt..."
   - Badge changes to green "Bestätigt"
4. Wait for server response
5. Check toast notification appears
6. Verify booking moves to "Heute" section if today's date
7. Refresh page to confirm persistence

**Expected Results**:
- ✅ Instant visual feedback (optimistic)
- ✅ Loading state on button
- ✅ Success toast appears
- ✅ Booking updates in UI
- ✅ Data persists after refresh
- ✅ No errors in console

---

### Scenario 4: Decline Booking (With Confirmation)

**Goal**: Test booking declination with confirmation dialog

**Steps**:
1. Find a PENDING booking
2. Click "Ablehnen" (Decline) button
3. Verify confirmation dialog appears:
   - Title: "Buchung ablehnen?"
   - Description mentions customer notification
   - "Abbrechen" and "Ja, ablehnen" buttons
4. Click "Abbrechen" → Dialog closes, no change
5. Click "Ablehnen" again
6. Click "Ja, ablehnen"
7. Observe optimistic update
8. Wait for server response
9. Check toast notification
10. Verify booking removed/updated

**Expected Results**:
- ✅ Confirmation dialog appears
- ✅ Cancel works (no action)
- ✅ Confirm works (booking declined)
- ✅ Optimistic update happens
- ✅ Success toast appears
- ✅ Booking status updates
- ✅ Data persists

---

### Scenario 5: View Today's Schedule

**Goal**: Verify confirmed bookings for today display

**Steps**:
1. Ensure test data has CONFIRMED bookings for today
2. Navigate to dashboard
3. Locate "Heute" section
4. Check booking cards display:
   - Green "Bestätigt" badge
   - Compact layout
   - Time and customer info
5. Check empty state if no bookings today

**Expected Results**:
- ✅ All today's bookings visible
- ✅ Sorted by time
- ✅ Compact display (no action buttons)
- ✅ Empty state shows correctly
- ✅ Count in tab badge matches

---

### Scenario 6: Navigate to Calendar

**Goal**: Test calendar view and navigation

**Steps**:
1. Click "Kalender" tab (bottom on mobile, or direct URL)
2. Verify calendar page loads: `/de/dashboard/owner/calendar`
3. Check Week View displays by default
4. Verify 7-day grid shows (Monday-Sunday)
5. Check today is highlighted
6. Check bookings display in correct days
7. Test navigation:
   - Click "← Previous"
   - Click "→ Next"
   - Click "Heute" (Today)
8. Test view toggle:
   - Click "Tag" → Shows placeholder
   - Click "Monat" → Shows placeholder
   - Click "Woche" → Returns to Week View

**Expected Results**:
- ✅ Calendar loads without errors
- ✅ Week View shows 7 days
- ✅ Today highlighted with border
- ✅ Bookings display in correct days
- ✅ Navigation works smoothly
- ✅ View toggles work
- ✅ URL updates with view parameter
- ✅ Badge count on Calendar tab correct

---

### Scenario 7: Week View - Booking Display

**Goal**: Verify bookings appear correctly in Week View

**Steps**:
1. Navigate to Calendar → Week View
2. Find a day with bookings
3. Check booking display:
   - Time (e.g., "14:00")
   - Customer name
   - Service name (smaller text)
   - Background color (orange=pending, green=confirmed)
4. Count bookings per day
5. Verify legend at bottom shows colors

**Expected Results**:
- ✅ Bookings grouped by day
- ✅ All information visible
- ✅ Color coding correct
- ✅ Readable on mobile
- ✅ Legend explains colors
- ✅ Empty days show "Keine Termine"

---

### Scenario 8: Navigate to Services

**Goal**: Test service list page

**Steps**:
1. Click "Services" tab
2. Verify services page loads: `/de/dashboard/owner/services`
3. Check services display as cards
4. Verify each card shows:
   - Service name (large)
   - Duration in minutes
   - Price in EUR
   - Edit button
   - Delete button
5. Check empty state if no services
6. Check "Service hinzufügen" button exists

**Expected Results**:
- ✅ Services list loads
- ✅ All services displayed
- ✅ Information complete
- ✅ Buttons present
- ✅ Empty state shows CTA
- ✅ Grid responsive (1 col → 2-3 cols)
- ✅ Badge count on Services tab correct

---

### Scenario 9: Create New Service (Full Flow)

**Goal**: Test complete service creation flow

**Steps**:

**Step 1 - Name**:
1. Click "Service hinzufügen"
2. Verify dialog opens (Sheet on mobile, Dialog on desktop)
3. Check progress dots (3 total, first active)
4. Enter service name: "Test Thai-Massage"
5. Check character counter updates
6. Try examples by clicking them
7. Click "Weiter"

**Step 2 - Duration**:
8. Verify step 2 loads (second dot active)
9. Click preset "60" minutes
10. Verify button highlights
11. Try custom input: change to "90"
12. Click "Weiter"

**Step 3 - Price**:
13. Verify step 3 loads (third dot active)
14. Enter price: "75"
15. Check preview shows hourly rate
16. Click "Weiter zur Übersicht"

**Step 4 - Review**:
17. Verify review screen shows all data:
    - Name: Test Thai-Massage
    - Duration: 90 Minuten
    - Price: 75.00 €
18. Click "Service speichern"
19. Observe loading state

**Step 5 - Success**:
20. Verify success screen shows:
    - Animated green checkmark
    - "Geschafft!" message
21. Wait for auto-close (3 seconds) OR click "Fertig"
22. Verify return to services list
23. Check new service appears in list

**Expected Results**:
- ✅ All steps work smoothly
- ✅ Animations play correctly
- ✅ Validation prevents empty fields
- ✅ Data persists through steps
- ✅ Review shows correct info
- ✅ Success animation plays
- ✅ Service created in database
- ✅ List updates with new service
- ✅ No errors in console

---

### Scenario 10: Edit Existing Service

**Goal**: Test service editing

**Steps**:
1. Find a service in the list
2. Click "Bearbeiten" button
3. Verify dialog opens with existing data:
   - Name field pre-filled
   - Duration pre-selected
   - Price pre-filled
4. Change name to "Updated Service Name"
5. Change price to "80"
6. Complete flow to Review
7. Click "Service aktualisieren"
8. Verify success
9. Check service list shows updated data

**Expected Results**:
- ✅ Edit opens with correct data
- ✅ All fields editable
- ✅ Changes save correctly
- ✅ UI updates immediately
- ✅ Data persists after refresh

---

### Scenario 11: Delete Service (No Active Bookings)

**Goal**: Test service deletion

**Steps**:
1. Find a service with NO active bookings
2. Click "Löschen" button
3. Verify confirmation dialog appears
4. Click "Abbrechen" → No change
5. Click "Löschen" again
6. Click "Ja, löschen"
7. Observe loading state
8. Check success toast
9. Verify service removed from list

**Expected Results**:
- ✅ Confirmation dialog works
- ✅ Cancel prevents deletion
- ✅ Confirm deletes service
- ✅ Success toast appears
- ✅ Service removed from UI
- ✅ Data deleted from database

---

### Scenario 12: Delete Service (With Active Bookings)

**Goal**: Test deletion prevention

**Steps**:
1. Create/find a service with active bookings (PENDING or CONFIRMED)
2. Click "Löschen" button
3. Click "Ja, löschen" in confirmation
4. Observe error toast appears:
   - "Dieser Service hat X aktive Buchung(en) und kann nicht gelöscht werden"
5. Verify service still in list

**Expected Results**:
- ✅ Deletion prevented
- ✅ Error message clear and helpful
- ✅ Service remains in database
- ✅ UI unchanged

---

### Scenario 13: Mobile Responsiveness

**Goal**: Verify mobile-first design

**Steps**:
1. Resize browser to 375px width (iPhone SE)
2. Navigate through all pages:
   - Dashboard
   - Calendar
   - Services
   - More
3. Check bottom tab navigation:
   - Fixed at bottom
   - Icons visible
   - Labels readable
   - Badges display correctly
4. Test service creation:
   - Opens as Sheet from bottom
   - Swipeable to close
5. Test booking actions:
   - Buttons full width
   - Touch-friendly (56px height)
6. Test calendar:
   - Week view scrollable
   - Days stack on narrow screens

**Expected Results**:
- ✅ All content visible
- ✅ No horizontal scroll
- ✅ Bottom tabs work perfectly
- ✅ Touch targets large enough
- ✅ Sheets work on mobile
- ✅ Readable text sizes
- ✅ No layout breaks

---

### Scenario 14: Desktop Layout

**Goal**: Verify desktop enhancements

**Steps**:
1. Resize browser to 1920px width
2. Check dashboard layout:
   - Content max-width 1024px
   - Centered on screen
3. Check bottom tabs:
   - Hidden on desktop (md:hidden)
   - Alternative navigation? (Future)
4. Check service dialog:
   - Opens as centered Dialog
   - Max width 500px
5. Check calendar:
   - Week View: 7 columns side-by-side
   - Readable without scrolling

**Expected Results**:
- ✅ Content not stretched
- ✅ Max-width respected
- ✅ Dialog centered
- ✅ Calendar readable
- ✅ No empty space issues

---

### Scenario 15: Keyboard Navigation

**Goal**: Test accessibility

**Steps**:
1. Navigate dashboard using Tab key
2. Verify focus indicators visible
3. Press Enter on focused buttons
4. Navigate service dialog with keyboard:
   - Tab through form fields
   - Press Escape to close
5. Navigate booking actions
6. Test calendar navigation with arrow keys (future)

**Expected Results**:
- ✅ All interactive elements focusable
- ✅ Focus indicators visible
- ✅ Enter/Space activate buttons
- ✅ Escape closes dialogs
- ✅ Tab order logical
- ✅ No keyboard traps

---

### Scenario 16: Empty States

**Goal**: Verify all empty states display correctly

**Steps**:
1. Test with studio that has:
   - No pending bookings
   - No bookings today
   - No services
2. Check each empty state:
   - Dashboard: "Keine neuen Anfragen"
   - Dashboard: "Keine Termine heute"
   - Services: "Noch keine Services" + CTA
   - Calendar: "Keine Termine" per empty day

**Expected Results**:
- ✅ Helpful empty state messages
- ✅ Icons/illustrations present
- ✅ CTAs encourage actions
- ✅ Not confusing or alarming

---

### Scenario 17: Badge Counts

**Goal**: Verify tab badges show correct counts

**Steps**:
1. Count manually:
   - Pending bookings
   - Today's confirmed bookings
   - Total services
2. Check bottom tab badges match counts
3. Accept a pending booking → Badge decreases
4. Create a service → Services badge increases
5. Confirm booking for today → Calendar badge increases

**Expected Results**:
- ✅ All badges accurate
- ✅ Real-time updates after actions
- ✅ Visual indicators (colors)
- ✅ "99+" for counts over 99

---

### Scenario 18: Error Handling

**Goal**: Test error scenarios

**Steps**:
1. **Network Error**:
   - Open dev tools → Network tab
   - Set to Offline
   - Try to accept booking
   - Check error toast appears
2. **Validation Errors**:
   - Create service with 1-char name
   - Check inline error message
   - Try duration < 15 minutes
   - Try price < 5€
3. **Server Error**:
   - (Simulate by modifying server action to throw)
   - Check generic error message

**Expected Results**:
- ✅ Errors don't break UI
- ✅ Error messages helpful
- ✅ User can retry
- ✅ No console errors (except expected)

---

### Scenario 19: Data Persistence

**Goal**: Verify all changes persist

**Steps**:
1. Accept a booking
2. Create a service
3. Update a service
4. Refresh browser (F5)
5. Check all changes still visible
6. Close browser
7. Reopen and login
8. Verify data still correct

**Expected Results**:
- ✅ All changes saved to database
- ✅ Data loads correctly after refresh
- ✅ No data loss

---

### Scenario 20: Toast Notifications

**Goal**: Test all toast notifications

**Steps**:
1. Accept booking → Success toast (green)
2. Decline booking → Success toast (green)
3. Create service → Success toast (green)
4. Update service → Success toast (green)
5. Delete service → Success toast (green)
6. Cause error → Error toast (red)
7. Check toast behavior:
   - Appears bottom-right
   - Auto-dismisses after 3 seconds
   - Can manually close with X
   - Multiple toasts stack

**Expected Results**:
- ✅ Toasts appear for all actions
- ✅ Correct variant (success/error)
- ✅ Clear messages
- ✅ Auto-dismiss works
- ✅ Manual dismiss works
- ✅ Stacking works correctly

---

## Performance Testing

### Page Load Times

**Measure**:
- Dashboard initial load
- Calendar load
- Services list load
- Dialog open time

**Expected**:
- < 2 seconds for initial load
- < 500ms for navigation
- < 200ms for dialog open
- < 100ms for optimistic updates

**Tools**:
- Chrome DevTools → Lighthouse
- Network tab → Disable cache
- Performance tab → Record

---

## Browser Testing

### Browsers to Test:

- ✅ Chrome (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

### Known Issues:
- (Document any browser-specific issues here)

---

## Regression Testing

### After Each Update:

1. Run all 20 scenarios above
2. Check TypeScript compilation: `npm run lint`
3. Check browser console for errors
4. Verify no layout breaks
5. Test mobile AND desktop
6. Test keyboard navigation
7. Verify all toasts work

---

## Bug Reporting Template

```markdown
**Bug Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Environment**:
- Browser: [Chrome 120]
- Screen Size: [1920x1080 / 375x667]
- User Role: [STUDIO_OWNER]

**Console Errors**:
```
[Paste any console errors]
```

**Screenshots**:
[Attach screenshots if helpful]
```

---

## Test Data Setup

### SQL Commands to Create Test Data:

```sql
-- Create test studio owner user (if needed)
-- INSERT INTO users (id, email, name, "primaryRole")
-- VALUES ('test-owner-id', 'owner@test.com', 'Test Owner', 'STUDIO_OWNER');

-- Create test bookings (PENDING)
INSERT INTO "NewBooking" (
  id, "studioId", "customerId", "customerName", "customerEmail",
  "preferredDate", "preferredTime", status, "createdAt"
) VALUES (
  'test-booking-1',
  'your-studio-id',
  'customer-id',
  'Test Customer',
  'customer@test.com',
  '2025-10-30',
  '14:00',
  'PENDING',
  NOW()
);

-- Create test services
INSERT INTO services (
  id, "studioId", name, duration, price, "createdAt"
) VALUES (
  'test-service-1',
  'your-studio-id',
  'Thai-Massage 60 Min',
  60,
  50.00,
  NOW()
);
```

---

## Success Criteria

### All Tests Pass When:

- ✅ No TypeScript errors
- ✅ No console errors
- ✅ All 20 scenarios pass
- ✅ Mobile and desktop work
- ✅ All browsers work
- ✅ Keyboard navigation works
- ✅ Page load < 2 seconds
- ✅ Optimistic updates instant
- ✅ All toasts appear
- ✅ Data persists correctly

---

## Next Steps After Testing

1. Document any bugs found
2. Prioritize fixes (critical first)
3. Re-test after fixes
4. Get user feedback (real studio owners)
5. Iterate based on feedback
6. Deploy to staging
7. Final testing on staging
8. Deploy to production

---

**Happy Testing! 🧪**
