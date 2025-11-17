# Massava Settings Pages Design Patterns - Index

**Last Updated:** 2025-11-11  
**Exploration Status:** Complete  
**Documentation:** 3 comprehensive guides  

---

## Start Here

This index guides you to the right documentation for your needs.

### Quick Decision Tree

**I need to create a new settings page...**

1. **It's a simple list with CRUD (Services, Staff, Packages)**  
   → Read: [Service Page Pattern](#service-page-pattern) in DESIGN_PATTERNS_SETTINGS.md  
   → Template: DESIGN_PATTERNS_QUICK_REFERENCE.md → Pattern 1  
   → Example: `/app/[locale]/business/settings/` services page

2. **It's a complex form with maps/preview (Location, Profile)**  
   → Read: [Form Patterns](#form-patterns) in DESIGN_PATTERNS_SETTINGS.md  
   → Template: DESIGN_PATTERNS_QUICK_REFERENCE.md → Pattern 2  
   → Example: `/app/[locale]/business/settings/location/`

3. **It involves images/media (Logo, Gallery)**  
   → Read: [Component Reference](#component-reference) in DESIGN_PATTERNS_SETTINGS.md  
   → Template: DESIGN_PATTERNS_QUICK_REFERENCE.md → Pattern 3  
   → Example: `/app/[locale]/business/settings/images/`

4. **It's a multi-step wizard (Onboarding)**  
   → Read: [Studio Registration Flow](#form-patterns) in DESIGN_PATTERNS_SETTINGS.md  
   → Example: `/app/[locale]/dashboard/_components/studio-registration/`

---

## Documentation Files

### 1. DESIGN_PATTERNS_SETTINGS.md (51KB, 1,838 lines)
**The Comprehensive Style Guide**

**Contents:**
- Executive Summary
- Page Structure & Layout
- Service Page Pattern (Gold Standard)
- Companion Popups & Sheets
- Form Patterns (Location, Validation, Hours, Registration)
- Mobile-First Patterns (6 sections)
- Business Portal Conventions (6 sections)
- Component Reference (UI components, icons, colors)
- Code Examples (10 detailed examples)
- Dos and Don'ts (20+ rules)
- Implementation Checklist (10 phases)

**Best for:**
- Deep understanding of patterns
- Code examples and implementation details
- Decision making about patterns
- Code review guidelines

**Read time:** 30-45 minutes

---

### 2. DESIGN_PATTERNS_QUICK_REFERENCE.md (11KB, 461 lines)
**Quick Lookup Guide**

**Contents:**
- File Structure Template
- Page Setup Templates (copy-paste ready)
- Common Patterns (3 variants)
- Form Handling (validation, error display)
- Colors & Styling Quick Ref
- Icons List
- Responsive Classes
- Accessibility Checklist
- Mobile Optimization Snippets
- Server Actions Template
- Toast Examples
- Common Mistakes
- Quick File Checklist

**Best for:**
- While coding (quick lookup)
- Copy-paste templates
- Checklists and reminders
- Team sharing

**Read time:** 10-15 minutes

---

### 3. Existing Reference Documentation

**Location Settings:**
- `/app/[locale]/business/settings/location/README.md` (236 lines)
- Complete Google Maps integration guide
- Testing checklist
- Accessibility notes

**Service Card Design:**
- `/design-spec-service-card.md` (444 lines)
- Visual mockups (desktop and mobile)
- Component specification
- Implementation notes

---

## Reference by Feature

### Services Management
**File Structure:**
```
app/[locale]/business/settings/{services}/
├── page.tsx (server)
└── _components/
    ├── ServicesPageClient.tsx (layout)
    ├── ServicesForm.tsx (form) [if needed]
    └── ServiceDeleteDialog.tsx (modal)
```

**Documentation:**
- Section: "Service Page Pattern (Gold Standard)" in DESIGN_PATTERNS_SETTINGS.md
- Pattern: DESIGN_PATTERNS_QUICK_REFERENCE.md → Pattern 1
- Reference: `/app/[locale]/business/settings/` existing services

**Key Points:**
- Card-based grid layout
- Visible action buttons (no dropdowns)
- Sticky header for navigation
- 2-column grid (md:grid-cols-2)

---

### Location & Contact
**File Structure:**
```
app/[locale]/business/settings/location/
├── page.tsx (server)
└── _components/
    ├── LocationContactClient.tsx (layout)
    ├── LocationContactForm.tsx (form)
    ├── AddressAutocomplete.tsx (component)
    ├── LocationMap.tsx (component)
    └── LocationPreview.tsx (component)
```

**Documentation:**
- Section: "Form Patterns" → "Location Form Pattern" in DESIGN_PATTERNS_SETTINGS.md
- Template: DESIGN_PATTERNS_QUICK_REFERENCE.md → Pattern 2
- Reference: `/app/[locale]/business/settings/location/` full implementation
- Additional: `/app/[locale]/business/settings/location/README.md`

**Key Points:**
- 60/40 form/preview split (lg:grid-cols-5)
- Address autocomplete without requiring lat/lng
- Google Maps integration (draggable marker)
- Sticky save button on mobile

---

### Images & Media
**File Structure:**
```
app/[locale]/business/settings/images/
├── page.tsx (server)
└── _components/
    ├── StudioImagesClient.tsx (layout)
    ├── LogoSection.tsx (component)
    ├── GallerySection.tsx (component)
    ├── LogoUploadDialog.tsx (modal)
    ├── GalleryUploadDialog.tsx (modal)
    ├── GalleryGrid.tsx (component)
    └── ProfilePreview.tsx (component)
```

**Documentation:**
- Section: "Companion Popups & Sheets" in DESIGN_PATTERNS_SETTINGS.md
- Reference: `/app/[locale]/business/settings/images/` full implementation

**Key Points:**
- Drag-and-drop file uploads
- Image validation (type, size)
- Preview sidebar
- Main content (2 cols) + sidebar layout

---

### Opening Hours
**File Structure:**
```
app/[locale]/business/settings/hours/
├── page.tsx (server)
└── _components/
    ├── OpeningHoursClient.tsx (layout)
    ├── OpeningHoursForm.tsx (form)
    ├── DayCard.tsx (component)
    ├── TimePickerSheet.tsx (modal)
    └── PreviewCard.tsx (component)
```

**Documentation:**
- Section: "Form Patterns" → "Opening Hours Pattern" in DESIGN_PATTERNS_SETTINGS.md
- Reference: `/app/[locale]/business/settings/hours/_components/PreviewCard.tsx`

**Key Points:**
- Complex day/time structure
- Time picker in bottom sheet
- Live preview of hours
- Breaks and special hours support

---

### Account & Security
**File Structure:**
```
app/[locale]/business/settings/account/
├── page.tsx (server)
└── _components/
    ├── AccountSettingsClient.tsx (layout)
    ├── SecuritySection.tsx (component)
    ├── NotificationsSection.tsx (component)
    ├── PreferencesSection.tsx (component)
    ├── DangerZoneSection.tsx (component)
    └── ...DialogComponents (modals)
```

**Documentation:**
- Section: "Business Portal Conventions" in DESIGN_PATTERNS_SETTINGS.md
- Pattern: DESIGN_PATTERNS_QUICK_REFERENCE.md → Pattern 2
- Reference: `/app/[locale]/business/settings/` existing account pages

**Key Points:**
- Tabbed navigation (if multiple sections)
- Card-based sections
- Dialogs for sensitive actions (password change, 2FA)

---

## Code Examples Quick Links

### Example 1: Simple CRUD Page
**File:** DESIGN_PATTERNS_SETTINGS.md  
**Section:** "Code Examples" → "Example 2: Simple CRUD Page (Services Pattern)"  
**Lines:** ~100 lines of production-ready code

### Example 2: Simple Settings Form
**File:** DESIGN_PATTERNS_SETTINGS.md  
**Section:** "Code Examples" → "Example 3: Form with Validation"  
**Lines:** ~150 lines of complete form with validation

### Example 3: Location Form with Maps
**File:** `/app/[locale]/business/settings/location/_components/LocationContactForm.tsx`  
**Type:** Real production code  
**Complexity:** Advanced (maps, autocomplete, 2-column layout)

### Example 4: Image Upload Dialog
**File:** `/app/[locale]/business/settings/images/_components/GalleryUploadDialog.tsx`  
**Type:** Real production code  
**Complexity:** Medium (drag-drop, validation, progress)

### Example 5: Multi-Step Wizard
**File:** `/app/[locale]/dashboard/_components/studio-registration/`  
**Type:** Real production code  
**Complexity:** Advanced (context, multiple steps, state management)

---

## Patterns by Use Case

### "I need a modal/dialog"
→ Use: **Bottom Sheet Pattern** (mobile) or **Dialog** (desktop)  
→ Read: "Companion Popups & Sheets" section  
→ Code: `LogoUploadDialog.tsx`, `ServiceDeleteDialog.tsx`

### "I need to validate a form"
→ Use: **Zod Schema + Two-Step Validation**  
→ Read: "Form Patterns" section  
→ Code: `LocationContactForm.tsx`, `AddressStep.tsx`

### "I need address input"
→ Use: **Address Autocomplete Pattern**  
→ Read: "Address Autocomplete Pattern" section  
→ Code: `/components/AddressAutocomplete.tsx` (location or registration)

### "I need a responsive grid"
→ Use: **Responsive Grid Classes**  
→ Read: "Responsive Grid Patterns" in "Mobile-First Patterns"  
→ Reference: `grid-cols-1 lg:grid-cols-2` patterns in QUICK_REFERENCE.md

### "I need sticky buttons/headers"
→ Use: **Sticky Pattern**  
→ Read: "Sticky Header Pattern" and "Sticky Action Buttons"  
→ Code: `ServicesPageClient.tsx` (sticky header), `LocationContactForm.tsx` (sticky save)

### "I need to show errors"
→ Use: **Inline Error Display Pattern**  
→ Read: "Validation & Error Display" section  
→ Code: Form examples with `aria-invalid` and error messages

---

## Common Tasks

### Create a new settings page from scratch
1. Read: Pattern section in DESIGN_PATTERNS_SETTINGS.md
2. Copy: Template from DESIGN_PATTERNS_QUICK_REFERENCE.md
3. Follow: Implementation checklist (Phase 1-10)
4. Test: Mobile (375px), Tablet (768px), Desktop (1024px)
5. Review: Dos and Don'ts section

### Review a settings page PR
1. Check: Against Dos and Don'ts section
2. Verify: Implementation checklist items completed
3. Test: Accessibility checklist
4. Review: Mobile-first patterns are applied
5. Ensure: Loading states and error handling present

### Debug a form issue
1. Check: "Validation & Error Display" pattern
2. Verify: Zod schema on both client and server
3. Look: "Common Mistakes to Avoid" section
4. Test: Form submission with invalid data
5. Verify: Toast notifications appear

### Implement image upload
1. Read: "Companion Popups & Sheets" → "Image Upload Dialogs"
2. Copy: Template from `LogoUploadDialog.tsx` or `GalleryUploadDialog.tsx`
3. Adapt: For your use case
4. Add: Validation and error handling
5. Test: With various file types and sizes

---

## File Dependencies

### To use Form Patterns, you need:
- Zod (`z` from 'zod')
- shadcn/ui Button, Input, Label, Card
- useToast hook
- useRouter from next/navigation
- Server action with 'use server'

### To use Sheet Pattern, you need:
- Sheet component from '@/components/ui/sheet'
- SheetContent, SheetTitle from same
- VisuallyHidden from '@radix-ui/react-visually-hidden'

### To use Address Autocomplete, you need:
- Geocoding service (Google Places or Photon API)
- Debounce utility
- Logger for error handling

### To use Image Upload, you need:
- File validation utilities
- Image preview (with URL.createObjectURL)
- Upload endpoint (/api/studio/upload-*)
- Progress tracking

---

## Browser Support

All patterns use:
- Modern CSS (Grid, Flexbox, CSS Variables)
- ES2020+ JavaScript
- React 18+ features (hooks, server components)
- Radix UI primitives (ARIA compliant)

**Tested on:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

---

## Accessibility Standards

All patterns follow **WCAG 2.1 AA**:
- ✅ Color contrast 4.5:1 for text
- ✅ Touch targets minimum 32px × 32px
- ✅ Keyboard navigation fully supported
- ✅ ARIA labels on all interactive elements
- ✅ Semantic HTML (button, form, input, label)
- ✅ Focus indicators visible
- ✅ Screen reader compatible

---

## Performance Considerations

All patterns optimize for:
- **Mobile First:** CSS media queries start from mobile
- **Lazy Loading:** Images and components
- **Code Splitting:** Server/client component boundary
- **Caching:** Server-side with revalidatePath
- **Interactions:** Smooth transitions (200ms)
- **Bundle:** Minimal dependencies, tree-shakeable imports

---

## Git Branches & Features

Current branch: `feature/complete-settings-pages`

**Related branches:**
- `feature/service-popup-improvement` - Service management UX
- `develop` - Main development branch
- `main` - Production branch

**Related PRs:**
- Settings pages implementation
- Service card design spec review
- Location settings with maps

---

## Quick Links

**To Read First:**
1. [DESIGN_PATTERNS_QUICK_REFERENCE.md](DESIGN_PATTERNS_QUICK_REFERENCE.md) (10 min)
2. Relevant pattern section in [DESIGN_PATTERNS_SETTINGS.md](DESIGN_PATTERNS_SETTINGS.md) (15 min)
3. Production example code (10 min)

**To Reference While Coding:**
- [DESIGN_PATTERNS_QUICK_REFERENCE.md](DESIGN_PATTERNS_QUICK_REFERENCE.md)
- Implementation checklist
- Dos and Don'ts section

**To Share with Team:**
- [DESIGN_PATTERNS_QUICK_REFERENCE.md](DESIGN_PATTERNS_QUICK_REFERENCE.md)
- This INDEX file
- Links to specific patterns

**For Deep Learning:**
- [DESIGN_PATTERNS_SETTINGS.md](DESIGN_PATTERNS_SETTINGS.md) (complete reference)
- Production code examples
- Test files and documentation

---

## Support & Questions

**Questions about a pattern?**
→ Check the relevant section in DESIGN_PATTERNS_SETTINGS.md

**Need a code example?**
→ See "Code Examples" section (10 examples provided)

**Want to add a pattern?**
→ Follow the existing pattern structure
→ Include server/client separation
→ Test on mobile, tablet, desktop
→ Document with examples

**Found an issue?**
→ Check Dos and Don'ts section
→ Review accessibility checklist
→ Reference implementation checklist

---

## File Locations

```
/Users/roman/Development/massava/
├── DESIGN_PATTERNS_SETTINGS.md           (comprehensive guide)
├── DESIGN_PATTERNS_QUICK_REFERENCE.md    (quick lookup)
├── DESIGN_PATTERNS_INDEX.md              (this file)
│
├── app/[locale]/business/settings/
│   ├── location/                         (location + maps example)
│   ├── images/                           (image upload example)
│   ├── hours/                            (complex form example)
│   ├── profile/                          (simple form example)
│   ├── account/                          (sectioned settings example)
│   └── _components/                      (shared components)
│
├── app/[locale]/dashboard/_components/
│   └── studio-registration/              (multi-step wizard example)
│
├── lib/schemas/
│   ├── location.schema.ts                (Zod validation example)
│   ├── account.schema.ts
│   └── stats.schema.ts
│
└── components/
    ├── ui/
    │   ├── sheet.tsx                     (Sheet component)
    │   ├── button.tsx                    (Button component)
    │   └── ... (other ui components)
    └── business/
        └── QuickActionsSheet.tsx         (Sheet usage example)
```

---

## Summary

**You now have:**
- ✅ Comprehensive design patterns guide (51KB)
- ✅ Quick reference for coding (11KB)
- ✅ 10 detailed code examples
- ✅ Implementation checklists
- ✅ Accessibility guidelines
- ✅ Mobile-first patterns
- ✅ Best practices and dos/don'ts
- ✅ Links to production code examples

**Start with:** DESIGN_PATTERNS_QUICK_REFERENCE.md (10 min read)  
**Then read:** Relevant section in DESIGN_PATTERNS_SETTINGS.md (15 min)  
**Then implement:** Using the code examples and checklist  

All patterns are **production-tested** and ready for immediate use.

---

**Last Updated:** 2025-11-11  
**Status:** Complete and Ready for Use

