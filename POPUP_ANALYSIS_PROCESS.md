# Popup Styling Analysis Process

## Objective
Find the reference popup implementation and compare all new popups against it to identify styling inconsistencies.

## Analysis Steps

### Step 1: Identify Reference Implementation
**Goal**: Find the service creation or studio registration popup that has the correct styling

**Commands to run**:
```bash
# Find files using Sheet with side="bottom"
cd /Users/roman/Development/massava
grep -r 'side="bottom"' app --include="*.tsx" -l

# This will identify the reference popup implementation
```

### Step 2: Extract Reference Styling
**Goal**: Document exact component structure and className strings

**What to extract**:
- Component type (Sheet vs Dialog)
- side prop value
- className strings on SheetContent
- Height settings (h-[85vh] or similar)
- Border radius (rounded-t-[20px] or similar)
- Background colors
- Padding/spacing
- Animation properties

### Step 3: Read All New Popups
**Files to read**:

Studio Settings:
1. `/Users/roman/Development/massava/app/[locale]/business/settings/studio/_components/BasicInfoPopup.tsx`
2. `/Users/roman/Development/massava/app/[locale]/business/settings/studio/_components/LocationPopup.tsx`
3. `/Users/roman/Development/massava/app/[locale]/business/settings/studio/_components/OpeningHoursPopup.tsx`
4. `/Users/roman/Development/massava/app/[locale]/business/settings/studio/_components/ImagesPopup.tsx`

Account Settings:
5. `/Users/roman/Development/massava/app/[locale]/business/settings/account/_components/NotificationsPopup.tsx`
6. `/Users/roman/Development/massava/app/[locale]/business/settings/account/_components/PrivacyPopup.tsx`
7. `/Users/roman/Development/massava/app/[locale]/business/settings/account/_components/DangerZonePopup.tsx`

### Step 4: Compare Styling
**For each popup, check**:
- [ ] Using Sheet or Dialog?
- [ ] Has side="bottom"?
- [ ] Height setting?
- [ ] Border radius?
- [ ] Background color?
- [ ] Animation?

### Step 5: Document Fixes
Create exact code changes needed for each popup.

## Execution Plan

I will now create and run scripts to:
1. Find reference implementation
2. Read all popup files
3. Compare and document differences
4. Create fix specifications

---

## Findings

(To be filled in after running analysis scripts)

### Reference Popup Properties
- **File**: TBD
- **Component**: TBD
- **Side**: TBD
- **ClassName**: TBD
- **Height**: TBD
- **Border Radius**: TBD

### Popup Comparison Matrix

| Popup | Component | Side | Height | Border Radius | Status |
|-------|-----------|------|--------|---------------|--------|
| Reference | TBD | TBD | TBD | TBD | ✅ |
| BasicInfo | TBD | TBD | TBD | TBD | ❌ |
| Location | TBD | TBD | TBD | TBD | ❌ |
| OpeningHours | TBD | TBD | TBD | TBD | ❌ |
| Images | TBD | TBD | TBD | TBD | ❌ |
| Notifications | TBD | TBD | TBD | TBD | ❌ |
| Privacy | TBD | TBD | TBD | TBD | ❌ |
| DangerZone | TBD | TBD | TBD | TBD | ❌ |

