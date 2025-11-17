# Manual Popup Analysis Guide

## Quick Start

Run this command to gather all data:
```bash
cd /Users/roman/Development/massava
bash GATHER_ALL_DATA.sh
```

Then read the output file:
```bash
cat COMPLETE_POPUP_DATA.md
```

## Alternative: Step-by-Step Manual Analysis

### Step 1: Find Reference Popup
```bash
cd /Users/roman/Development/massava

# Find files with Sheet side="bottom"
grep -r 'side="bottom"' app --include="*.tsx" -l

# Read the first one (this is your reference)
grep -r 'side="bottom"' app --include="*.tsx" -l | head -1 | xargs cat
```

### Step 2: Read New Popups

**Studio Settings:**
```bash
cat "app/[locale]/business/settings/studio/_components/BasicInfoPopup.tsx"
cat "app/[locale]/business/settings/studio/_components/LocationPopup.tsx"
cat "app/[locale]/business/settings/studio/_components/OpeningHoursPopup.tsx"
cat "app/[locale]/business/settings/studio/_components/ImagesPopup.tsx"
```

**Account Settings:**
```bash
cat "app/[locale]/business/settings/account/_components/NotificationsPopup.tsx"
cat "app/[locale]/business/settings/account/_components/PrivacyPopup.tsx"
cat "app/[locale]/business/settings/account/_components/DangerZonePopup.tsx"
```

### Step 3: Compare Styling

For each popup, check these properties:

**Component Type:**
- Reference: `<Sheet>` ✅
- New Popup: `<Dialog>` or `<Sheet>`?

**Side Property:**
- Reference: `side="bottom"` ✅
- New Popup: Has `side` prop?

**SheetContent className:**
- Reference: Look for height like `h-[85vh]` or `h-[90vh]`
- Reference: Look for border radius like `rounded-t-[20px]`
- New Popup: Compare className strings

**Example comparison:**
```
REFERENCE:
<Sheet>
  <SheetContent
    side="bottom"
    className="h-[85vh] rounded-t-[20px] md:rounded-[20px]"
  >

NEW POPUP (WRONG):
<Dialog>
  <DialogContent
    className="sm:max-w-[425px]"
  >

FIX NEEDED:
- Change Dialog to Sheet
- Add side="bottom"
- Change className to match reference
```

## What to Look For

### Critical Styling Properties:

1. **Component**: Sheet (not Dialog)
2. **side**: "bottom"
3. **height**: h-[85vh] or similar
4. **Border radius**: rounded-t-[20px] (top only on mobile)
5. **Background**: Usually bg-background or default
6. **Max width**: Often removed on mobile, set on desktop
7. **Padding**: Check p-6 or similar
8. **Animation**: Slide up from bottom (automatic with side="bottom")

### Desktop vs Mobile:

Reference likely has responsive classes:
```
className="h-[85vh] md:h-auto rounded-t-[20px] md:rounded-[20px]"
```

Mobile (< 768px):
- Height: 85vh (fills most of screen)
- Border radius: Top corners only (rounded-t-[20px])
- Full width

Desktop (>= 768px):
- Height: auto (fits content)
- Border radius: All corners (rounded-[20px])
- Max width constraint

## Files to Check

Based on git status, these are NEW files (created by agents):
```
app/[locale]/business/settings/account/
app/[locale]/business/settings/hours/
app/[locale]/business/settings/images/
app/[locale]/business/settings/location/
```

These likely contain the problematic popups.

## Expected Output

After analysis, you should have:

1. **Reference popup code snippet**
2. **For each new popup:**
   - Current code
   - What's wrong
   - Fixed code
3. **Comparison table**
4. **Fix specifications**

