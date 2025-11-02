# Studio Opening Hours Implementation

## Overview
Added Opening Hours step to the Studio Registration Dialog flow in the dashboard.

## Changes Made

### 1. New Files Created

#### `/app/(main)/dashboard/_components/studio-registration/validation/openingHoursSchema.ts`
- Zod validation schema for opening hours
- Two modes: 'same' (same hours every day) or 'different' (different hours per day)
- Time format validation (HH:MM)
- Validation that closing time is after opening time

#### `/app/(main)/dashboard/_components/studio-registration/components/TimePickerSheet.tsx`
- Sheet component for selecting opening and closing times
- Preset time buttons for quick selection (6am-11am opening, 5pm-10pm closing)
- Custom time input fallback
- Validation for time selection

#### `/app/(main)/dashboard/_components/studio-registration/steps/OpeningHoursStep.tsx`
- New step 4 in the registration flow
- Two mode selection cards: "Same hours every day" or "Different hours"
- Same hours mode: Single card with time picker
- Different hours mode: 7 day cards (Monday-Sunday) with toggle switches
- Skip functionality with helpful note
- Handles registration submission (moved from ContactStep)

### 2. Modified Files

#### `/app/(main)/dashboard/_components/studio-registration/StudioRegistrationContext.tsx`
- Added `openingHours?: Partial<OpeningHoursFormData>` to state
- Added `UPDATE_OPENING_HOURS` action type
- Added `updateOpeningHours` context method
- Added reducer case for opening hours updates

#### `/app/(main)/dashboard/_components/studio-registration/StudioRegistrationDialog.tsx`
- Imported OpeningHoursStep
- Added step to steps array (now 6 steps total: 0-5)
- Updated progress indicator to show steps 1-4 (was 1-3)
- Updated success step check to step 5 (was step 4)
- Updated back button and spacer conditions to < 5 (was < 4)
- Updated totalSteps in ProgressIndicator to 4 (was 3)

#### `/app/(main)/dashboard/_components/studio-registration/steps/ContactStep.tsx`
- Removed registration submission logic
- Removed `registerStudio` import
- Removed `setSubmitting` and `setStudioId` from hook
- Renamed `handleCompleteRegistration` to `handleContinue`
- Changed button text from "Registrierung abschließen" to "Weiter"
- Now just validates and goes to next step

#### `/app/actions/studio/registerStudio.ts`
- Added `hoursSchema` for time ranges
- Added optional `openingHours` to registration schema
- Transform opening hours to database format:
  - Same mode: `{ everyday: { open, close } }`
  - Different mode: `{ monday: { open, close }, ... }`
- Save `openingHours` as JSON in database

## New Flow

### Old Flow (5 steps)
1. Step 0: Welcome
2. Step 1: Basic Info
3. Step 2: Address
4. Step 3: Contact (submits registration)
5. Step 4: Success

### New Flow (6 steps)
1. Step 0: Welcome
2. Step 1: Basic Info
3. Step 2: Address
4. Step 3: Contact (just validates, goes to next step)
5. **Step 4: Opening Hours (NEW - submits registration or skip)**
6. Step 5: Success

## Features

### Opening Hours Modes

**Same Hours Every Day:**
- Single time selection card
- Applies same hours to all days
- Stored as `{ everyday: { open: "09:00", close: "18:00" } }`

**Different Hours:**
- 7 day cards with individual toggles
- Each day can be enabled/disabled
- Each enabled day has its own time selection
- Stored as `{ monday: { open, close }, tuesday: { open, close }, ... }`

### Time Picker
- Preset buttons for quick selection
- Custom time input for flexibility
- Validation that closing time > opening time
- Bottom sheet on mobile, respects design system

### Skip Functionality
- Users can skip opening hours setup
- Helpful note: "Sie können die Öffnungszeiten später jederzeit ändern"
- Registration proceeds without opening hours

### Styling
- Uses exact color scheme: `#B56550` for primary color
- Follows BasicInfoStep card styling
- Follows ContactStep button styling
- Mobile-first responsive design
- Smooth framer-motion animations

## Data Flow

1. User selects mode (same/different)
2. User sets times via TimePickerSheet
3. On "Registrierung abschließen":
   - Validates opening hours data
   - Prepares complete registration data (basic info + address + contact + opening hours)
   - Calls `registerStudio()` server action
   - Transforms opening hours to database format
   - Saves to database
   - Goes to success step
4. On "Jetzt überspringen":
   - Skips opening hours
   - Calls `registerStudio()` without opening hours
   - Goes to success step

## Testing Checklist

- [ ] Open dashboard
- [ ] Trigger studio registration dialog
- [ ] Navigate through all steps (Welcome → Basic Info → Address → Contact)
- [ ] Verify Contact step button says "Weiter" (not "Registrierung abschließen")
- [ ] Click "Weiter" on Contact step
- [ ] Verify Opening Hours step appears
- [ ] Test "Same hours every day" mode
  - [ ] Click card to set time
  - [ ] Verify TimePickerSheet opens
  - [ ] Test preset buttons
  - [ ] Test custom time input
  - [ ] Verify validation (closing > opening)
  - [ ] Save and verify time displays on card
- [ ] Test "Different hours" mode
  - [ ] Toggle days on/off
  - [ ] Set times for multiple days
  - [ ] Verify each day stores independently
- [ ] Test "Jetzt überspringen" button
  - [ ] Click skip
  - [ ] Verify registration completes without opening hours
- [ ] Test "Registrierung abschließen" button
  - [ ] Set opening hours
  - [ ] Click complete
  - [ ] Verify loading state
  - [ ] Verify success step appears
- [ ] Verify database record
  - [ ] Check `openingHours` JSON field in studio table
  - [ ] Verify format matches expected structure
- [ ] Test on mobile
  - [ ] Verify TimePickerSheet is bottom sheet
  - [ ] Verify responsive design
- [ ] Test back button
  - [ ] Go back from Opening Hours to Contact
  - [ ] Verify state preserved
- [ ] Test progress indicator
  - [ ] Shows steps 1-4
  - [ ] Correct highlighting

## Database Schema

The `openingHours` field in the `studio` table stores JSON:

**Same hours format:**
```json
{
  "everyday": {
    "open": "09:00",
    "close": "18:00"
  }
}
```

**Different hours format:**
```json
{
  "monday": { "open": "08:00", "close": "17:00" },
  "tuesday": { "open": "08:00", "close": "17:00" },
  "wednesday": { "open": "08:00", "close": "17:00" },
  "thursday": { "open": "08:00", "close": "17:00" },
  "friday": { "open": "08:00", "close": "17:00" },
  "saturday": { "open": "10:00", "close": "15:00" },
  "sunday": null
}
```

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus indicators on buttons and inputs
- Screen reader friendly
- Proper semantic HTML
- Error messages with `role="alert"`

## File Paths

All files are in absolute paths:

**New files:**
- `/Users/roman/Development/massava/app/(main)/dashboard/_components/studio-registration/validation/openingHoursSchema.ts`
- `/Users/roman/Development/massava/app/(main)/dashboard/_components/studio-registration/components/TimePickerSheet.tsx`
- `/Users/roman/Development/massava/app/(main)/dashboard/_components/studio-registration/steps/OpeningHoursStep.tsx`

**Modified files:**
- `/Users/roman/Development/massava/app/(main)/dashboard/_components/studio-registration/StudioRegistrationContext.tsx`
- `/Users/roman/Development/massava/app/(main)/dashboard/_components/studio-registration/StudioRegistrationDialog.tsx`
- `/Users/roman/Development/massava/app/(main)/dashboard/_components/studio-registration/steps/ContactStep.tsx`
- `/Users/roman/Development/massava/app/actions/studio/registerStudio.ts`

## Next Steps

1. Test the implementation thoroughly
2. Consider adding opening hours editing in studio settings
3. Consider displaying opening hours on studio profile page
4. Consider validation for business hours (e.g., max 24 hours per day)
