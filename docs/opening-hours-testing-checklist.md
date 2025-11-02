# Opening Hours Calendar - Testing Checklist

## Pre-Testing Setup

### 1. Database Preparation

Ensure you have a test studio with opening hours configured:

```sql
-- Check existing studio opening hours
SELECT id, name, "openingHours" FROM "studios" LIMIT 5;

-- Update a test studio with opening hours (if needed)
UPDATE "studios"
SET "openingHours" = '{"everyday": {"open": "09:00", "close": "18:00"}}'
WHERE id = 'your-test-studio-id';
```

### 2. Test Data Scenarios

Create test studios with different configurations:

**Scenario A: Same hours every day**
```json
{
  "everyday": {
    "open": "09:00",
    "close": "18:00"
  }
}
```

**Scenario B: Different hours per day**
```json
{
  "monday": { "open": "08:00", "close": "20:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  "wednesday": null,
  "thursday": { "open": "10:00", "close": "16:00" },
  "friday": { "open": "09:00", "close": "20:00" },
  "saturday": { "open": "10:00", "close": "14:00" },
  "sunday": null
}
```

**Scenario C: No opening hours**
```json
null
```

---

## Functional Testing

### Day View Tests

#### Test 1: Virtual Blocks Appear
- [ ] Navigate to `/dashboard/owner/calendar?view=day`
- [ ] Verify times before opening show "Geschlossen" block
- [ ] Verify times after closing show "Geschlossen" block
- [ ] Verify blocks have dashed border
- [ ] Verify blocks have clock icon (🕒)

**Expected**:
- Block 1: 00:00 → 09:00 (if opening at 09:00)
- Block 2: 18:00 → 23:59 (if closing at 18:00)

---

#### Test 2: Visual Distinction
- [ ] Virtual blocks have dashed border
- [ ] Virtual blocks have light gray background
- [ ] Virtual blocks show "Geschlossen" label
- [ ] User-created blocks have solid border
- [ ] User-created blocks show "Blockiert" label

---

#### Test 3: Click Behavior
- [ ] Click on virtual block (before opening) → No dialog opens
- [ ] Hover over virtual block → Tooltip shows "Außerhalb der Öffnungszeiten"
- [ ] Click on user-created block → Delete dialog opens
- [ ] Click on booking → Booking details sheet opens

---

#### Test 4: Different Hours Per Day
- [ ] View Monday (08:00-20:00) → Blocks before 08:00 and after 20:00
- [ ] View Tuesday (09:00-18:00) → Blocks before 09:00 and after 18:00
- [ ] View Wednesday (closed) → Full-day block (00:00-23:59)
- [ ] View Thursday (10:00-16:00) → Blocks before 10:00 and after 16:00

---

#### Test 5: No Opening Hours
- [ ] Studio with `openingHours: null`
- [ ] Navigate to calendar
- [ ] Verify NO virtual blocks shown
- [ ] All time slots appear available

---

### Week View Tests

#### Test 6: Week View Virtual Blocks
- [ ] Navigate to `/dashboard/owner/calendar?view=week`
- [ ] Verify all 7 days show virtual blocks
- [ ] Monday: Correct blocks based on Monday hours
- [ ] Tuesday: Correct blocks based on Tuesday hours
- [ ] Wednesday (closed): Full-day block
- [ ] Thursday-Sunday: Correct blocks

---

#### Test 7: Week View Navigation
- [ ] Click "Previous Week" → New week loads with correct virtual blocks
- [ ] Click "Next Week" → New week loads with correct virtual blocks
- [ ] Click "Heute" (Today) → Returns to current week with correct blocks

---

#### Test 8: Week View Click Behavior
- [ ] Click virtual block in any day column → No dialog
- [ ] Click user block in any day column → Delete dialog
- [ ] Click booking in any day column → Booking details

---

### Edge Cases

#### Test 9: 24-Hour Studio
- [ ] Set opening hours: `{"everyday": {"open": "00:00", "close": "23:59"}}`
- [ ] View calendar
- [ ] Verify minimal or no virtual blocks (only last minute if any)

---

#### Test 10: Midnight Opening
- [ ] Set opening hours: `{"everyday": {"open": "00:00", "close": "12:00"}}`
- [ ] View calendar
- [ ] Verify block from 12:00 → 23:59 only (no before-opening block)

---

#### Test 11: Late Night Closing
- [ ] Set opening hours: `{"everyday": {"open": "12:00", "close": "23:59"}}`
- [ ] View calendar
- [ ] Verify block from 00:00 → 12:00 only (no after-closing block)

---

#### Test 12: Mixed Real and Virtual Blocks
- [ ] Studio with opening hours 09:00-18:00
- [ ] Create user block from 12:00-13:00 (lunch break)
- [ ] View calendar
- [ ] Verify virtual blocks at 08:00 and 18:00 (dashed)
- [ ] Verify user block at 12:00 (solid)
- [ ] All blocks visible and distinct

---

### Mobile Responsive Tests

#### Test 13: Mobile Day View
- [ ] Open on mobile device (or DevTools mobile view)
- [ ] Navigate to calendar
- [ ] Virtual blocks display correctly (compact)
- [ ] Text readable at small size
- [ ] Icons visible
- [ ] Touch interactions work (tap booking, tap block)

---

#### Test 14: Mobile Week View
- [ ] Switch to week view on mobile
- [ ] Horizontal scroll works
- [ ] All 7 days visible
- [ ] Virtual blocks in each column
- [ ] Readable labels

---

## Performance Testing

#### Test 15: Load Time
- [ ] Open calendar (cold load)
- [ ] Measure time to render
- [ ] Should be < 1 second for day view
- [ ] Should be < 2 seconds for week view

---

#### Test 16: Week View Performance
- [ ] Switch to week view
- [ ] Virtual blocks for 7 days generate quickly
- [ ] No lag or stuttering
- [ ] Scrolling is smooth

---

#### Test 17: Date Navigation
- [ ] Navigate through multiple days (Previous/Next)
- [ ] Virtual blocks update correctly
- [ ] No cumulative memory leaks
- [ ] Performance stays consistent

---

## Accessibility Testing

#### Test 18: Keyboard Navigation
- [ ] Tab through calendar
- [ ] User blocks and bookings are focusable
- [ ] Virtual blocks are NOT in tab order
- [ ] Enter key opens details on focused booking/block

---

#### Test 19: Screen Reader
- [ ] Enable screen reader (VoiceOver/NVDA)
- [ ] Navigate to virtual block
- [ ] Announces: "Geschlossen, 08:00 bis 09:00"
- [ ] Announces: "Außerhalb der Öffnungszeiten"

---

#### Test 20: Color Contrast
- [ ] Virtual block text readable (WCAG AA)
- [ ] Border patterns visible for colorblind users
- [ ] Icons provide non-color distinction

---

## Integration Testing

#### Test 21: Create Booking During Open Hours
- [ ] Click FAB (Floating Action Button)
- [ ] Select service
- [ ] Select time during open hours (e.g., 10:00)
- [ ] Submit booking
- [ ] Booking appears on calendar
- [ ] Virtual blocks still visible

---

#### Test 22: Create User Block During Open Hours
- [ ] Long-press on time slot during open hours
- [ ] Block time dialog opens
- [ ] Create block from 12:00-13:00
- [ ] Block appears with solid border
- [ ] Virtual blocks still visible
- [ ] No overlap issues

---

#### Test 23: Change Opening Hours
- [ ] Navigate to studio settings
- [ ] Change opening hours (e.g., 10:00-17:00 instead of 09:00-18:00)
- [ ] Save changes
- [ ] Return to calendar
- [ ] Virtual blocks update to new times
- [ ] Block from 00:00-10:00 (new opening)
- [ ] Block from 17:00-23:59 (new closing)

---

#### Test 24: Delete Opening Hours
- [ ] Navigate to studio settings
- [ ] Remove opening hours (set to null)
- [ ] Save changes
- [ ] Return to calendar
- [ ] Virtual blocks disappear
- [ ] All time slots appear available

---

## Browser Compatibility

#### Test 25: Chrome
- [ ] Day view works
- [ ] Week view works
- [ ] Virtual blocks render correctly
- [ ] Dashed borders display
- [ ] Icons display

#### Test 26: Firefox
- [ ] Day view works
- [ ] Week view works
- [ ] Virtual blocks render correctly
- [ ] Dashed borders display
- [ ] Icons display

#### Test 27: Safari
- [ ] Day view works
- [ ] Week view works
- [ ] Virtual blocks render correctly
- [ ] Dashed borders display
- [ ] Icons display

#### Test 28: Mobile Safari (iOS)
- [ ] Calendar loads
- [ ] Virtual blocks visible
- [ ] Touch interactions work
- [ ] Scrolling smooth

#### Test 29: Chrome Mobile (Android)
- [ ] Calendar loads
- [ ] Virtual blocks visible
- [ ] Touch interactions work
- [ ] Scrolling smooth

---

## Regression Testing

#### Test 30: Existing Bookings
- [ ] Existing bookings still display correctly
- [ ] Time positions accurate
- [ ] Click behavior unchanged
- [ ] Details sheet works

---

#### Test 31: Existing User Blocks
- [ ] User-created blocks still display
- [ ] Solid border styling maintained
- [ ] Delete functionality works
- [ ] No conflicts with virtual blocks

---

#### Test 32: Current Time Indicator
- [ ] Red line shows current time
- [ ] Moves in real-time
- [ ] Visible during open hours
- [ ] Hidden during closed hours (virtual blocks on top)

---

## Error Handling

#### Test 33: Invalid Opening Hours Format
- [ ] Set malformed JSON in database
- [ ] Calendar loads without crashing
- [ ] Falls back gracefully (no virtual blocks)

---

#### Test 34: Missing Opening Hours Field
- [ ] Studio without `openingHours` field
- [ ] Calendar loads normally
- [ ] No virtual blocks shown
- [ ] No errors in console

---

## Database Testing

#### Test 35: No Database Writes
- [ ] Open calendar with virtual blocks
- [ ] Check `BlockedTime` table
- [ ] Verify no new entries created for virtual blocks
- [ ] Only user-created blocks in database

---

#### Test 36: Virtual Block IDs
- [ ] Inspect virtual blocks in DevTools
- [ ] IDs follow format: `virtual-before-open-2025-11-01`
- [ ] IDs are unique per date
- [ ] IDs are deterministic (same for same date)

---

## Sign-Off Checklist

### Functional
- [ ] All day view tests passing
- [ ] All week view tests passing
- [ ] All edge cases handled

### Visual
- [ ] Virtual blocks have dashed borders
- [ ] User blocks have solid borders
- [ ] Color contrast meets WCAG AA
- [ ] Icons display correctly

### Performance
- [ ] Load time acceptable
- [ ] No memory leaks
- [ ] Smooth scrolling

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color-blind friendly

### Cross-Browser
- [ ] Chrome working
- [ ] Firefox working
- [ ] Safari working
- [ ] Mobile browsers working

### Integration
- [ ] Works with existing bookings
- [ ] Works with user blocks
- [ ] Opening hours changes reflect immediately

---

## Bug Reporting Template

If you find issues, report using this format:

**Title**: [Component] Brief description

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happens

**Environment**:
- Browser: Chrome 119
- OS: macOS 14.0
- Screen size: 1920x1080

**Screenshots**:
Attach relevant screenshots

**Console Errors**:
```
Paste any console errors
```

---

## Success Criteria

All tests passing = Ready for production ✅

**Minimum Requirements**:
- ✅ Virtual blocks appear for closed hours
- ✅ Visual distinction from user blocks
- ✅ No click action on virtual blocks
- ✅ Week view shows all 7 days correctly
- ✅ No database writes for virtual blocks
- ✅ No TypeScript errors
- ✅ Build succeeds
- ✅ Mobile responsive

**Nice to Have**:
- ⭐ Smooth animations
- ⭐ Perfect accessibility
- ⭐ Sub-second load time
- ⭐ Zero console warnings

---

**Testing Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete
**Last Updated**: 2025-10-31
