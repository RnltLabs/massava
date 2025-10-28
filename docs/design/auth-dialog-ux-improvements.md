# Design Specification: Unified Auth Dialog UX Improvements

## Overview
Redesign the unified authentication dialog for Massava (Thai massage booking platform) to provide a seamless, mobile-first experience for non-tech-savvy Thai studio owners.

**Target Audience**: Thai studio owners, primarily mobile users, not tech-savvy
**Goal**: Eliminate scrollbars, improve readability, simplify mobile interactions, reduce confusion

---

## Current Issues Analysis

### 1. Hover State Text Readability (AccountTypeSelector)
**Problem**: Subtitle text "Massagen finden und Termine online reservieren" has poor contrast on hover
**Impact**: Users can't read the descriptive text when hovering, reducing clarity
**Root Cause**: Likely white/light text on light background during hover state

### 2. Card Spacing Inequality
**Problem**: Left and right margins of account type selection cards are not equal
**Impact**: Visually unbalanced, unprofessional appearance
**Root Cause**: Inconsistent padding/margin values in flex/grid layout

### 3. Terms Checkbox Mobile UX
**Problem**: Standard checkbox is difficult to interact with on mobile (small touch target)
**Impact**: Frustrating user experience, accidental misclicks, accessibility issues
**Root Cause**: Native checkbox is too small for thumb-based interaction

### 4. Scrollbar in Popup
**Problem**: Dialog content requires scrolling on mobile
**Impact**: Poor mobile experience, content feels cramped, unprofessional
**Root Cause**: Dialog content height exceeds viewport, not optimized for mobile

### 5. Login vs Signup Confusion
**Problem**: After email verification, users don't know if they're logging in or signing up
**Impact**: Cognitive load, confusion, potential abandonment
**Root Cause**: No visual indicator showing current auth mode at account type selection

### 6. Tab Redundancy Question
**Problem**: Landing page has separate Login/Signup buttons, but dialog also has tabs
**Impact**: Unnecessary UI element, additional decision point for users
**Root Cause**: Design inherited from previous implementation

---

## User Flow Analysis

### Current Flow
```
Entry Point (Landing Page):
├─ "Login" button → Dialog opens (Login tab selected)
└─ "Sign Up" button → Dialog opens (Sign Up tab selected)

Inside Dialog:
├─ Tabs: "Anmelden" | "Registrieren"
├─ Account Type Selection (2 buttons)
│  ├─ "Ich bin Studiobetreiber" (Studio Owner)
│  └─ "Ich möchte buchen" (Customer)
└─ Form (Login or Sign Up based on tab)

After Email Verification:
└─ Returns to dialog → Account Type Selection (CONFUSION HERE)
```

### Pain Points
1. **Double Selection**: Landing button + Dialog tab (redundant)
2. **Lost Context**: After email verification, user forgets their original intent
3. **Cognitive Load**: Too many decision points for simple task
4. **Mobile Scroll**: Content doesn't fit in mobile viewport

---

## Proposed Solutions

### Solution 1: Remove Tabs (RECOMMENDED)

**Rationale**:
- Landing page already has clear "Login" vs "Sign Up" buttons
- Removing tabs reduces cognitive load
- Single clear path based on user's initial intent
- Simplifies dialog layout (more space, no scrollbar)

**Implementation**:
```typescript
// UnifiedAuthDialog receives prop: mode: 'login' | 'signup'
<UnifiedAuthDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  mode="signup" // Set based on which landing button was clicked
/>
```

**Benefits**:
- ✅ Eliminates tab switching confusion
- ✅ Reduces dialog height (helps remove scrollbar)
- ✅ Clear user intent from start to finish
- ✅ Simpler state management

**User Flow After Change**:
```
Landing Page "Sign Up" → Dialog (Signup Mode Only)
  └─ Header: "REGISTRIERUNG" (clear indicator)
  └─ Account Type Selection
  └─ Signup Form

Landing Page "Login" → Dialog (Login Mode Only)
  └─ Header: "ANMELDUNG" (clear indicator)
  └─ Account Type Selection (if needed)
  └─ Login Form
```

### Solution 2: Hover State Contrast Fix

**Problem**: White text on light hover background
**Solution**: Use dark text with sufficient contrast ratio (WCAG AA: 4.5:1)

**Implementation**:
```tsx
// AccountTypeSelector.tsx
<Button
  className="h-auto py-6 px-6 hover:bg-primary hover:text-primary-foreground transition-colors"
>
  <div className="flex flex-col items-start gap-2">
    <span className="text-lg font-semibold">
      {title}
    </span>
    <span className="text-sm opacity-90 font-normal text-left">
      {subtitle}
    </span>
  </div>
</Button>
```

**Key Changes**:
- `hover:text-primary-foreground`: Ensures text contrasts with hover background
- `opacity-90`: Subtle differentiation for subtitle while maintaining readability
- `text-left`: Ensures long German text aligns properly

### Solution 3: Equal Card Spacing

**Problem**: Unequal margins due to inconsistent spacing
**Solution**: Use Tailwind grid with equal gaps

**Implementation**:
```tsx
// AccountTypeSelector.tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-6 py-4">
  {/* Cards render here */}
</div>
```

**Key Changes**:
- `grid`: Ensures equal column widths
- `gap-4`: Consistent spacing between cards
- `px-6`: Equal left/right padding
- `w-full`: Ensures full width usage

### Solution 4: Mobile-Friendly Terms Acceptance (CREATIVE SOLUTION)

**Problem**: Tiny checkbox hard to tap on mobile
**Solution**: Transform into large, tappable card button

**Design Concept**:
```
┌─────────────────────────────────────────────┐
│  [✓] Ich akzeptiere die Nutzungsbedingungen │
│      und Datenschutzrichtlinien             │
└─────────────────────────────────────────────┘
  ↓ Tapped (toggles state)
┌─────────────────────────────────────────────┐
│  [✓] Ich akzeptiere die Nutzungsbedingungen │ ← Blue background
│      und Datenschutzrichtlinien             │   White text
└─────────────────────────────────────────────┘
```

**Implementation**:
```tsx
// SignUpForm.tsx (Replace checkbox)
<button
  type="button"
  onClick={() => setTermsAccepted(!termsAccepted)}
  className={cn(
    "w-full p-4 rounded-lg border-2 text-left transition-all",
    "flex items-start gap-3 active:scale-[0.98]",
    termsAccepted
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-background border-border hover:border-primary/50"
  )}
  aria-pressed={termsAccepted}
  aria-label="Nutzungsbedingungen akzeptieren"
>
  <div className="flex-shrink-0 mt-0.5">
    <div className={cn(
      "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
      termsAccepted
        ? "bg-white border-white"
        : "bg-background border-border"
    )}>
      {termsAccepted && (
        <Check className="w-4 h-4 text-primary" strokeWidth={3} />
      )}
    </div>
  </div>
  <div className="flex-1 text-sm">
    <span>Ich akzeptiere die </span>
    <a
      href="/terms"
      className="underline font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      Nutzungsbedingungen
    </a>
    <span> und </span>
    <a
      href="/privacy"
      className="underline font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      Datenschutzrichtlinien
    </a>
  </div>
</button>

{!termsAccepted && showError && (
  <p className="text-sm text-destructive mt-1">
    Bitte akzeptieren Sie die Bedingungen
  </p>
)}
```

**Benefits**:
- ✅ Large touch target (entire card is tappable)
- ✅ Clear visual feedback (background changes)
- ✅ Active scale animation provides tactile feedback
- ✅ Links still clickable independently
- ✅ Accessible (aria-pressed, aria-label)
- ✅ Works perfectly on both mobile and desktop

### Solution 5: Remove Scrollbar - Mobile-First Layout

**Strategy**: Optimize dialog content height for mobile (320px width, ~600px height available)

**Approach**:
1. Remove tabs (saves ~48px)
2. Reduce padding/spacing strategically
3. Make form fields more compact on mobile
4. Use responsive typography

**Implementation**:
```tsx
// UnifiedAuthDialog.tsx
<DialogContent className="sm:max-w-[480px] max-w-[95vw] max-h-[90vh] p-0 flex flex-col">
  {/* Header - Compact on mobile */}
  <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 border-b">
    <DialogTitle className="text-xl sm:text-2xl">
      {mode === 'signup' ? 'REGISTRIERUNG' : 'ANMELDUNG'}
    </DialogTitle>
    <DialogDescription className="text-xs sm:text-sm">
      {mode === 'signup'
        ? 'Konto erstellen und loslegen'
        : 'Bei Ihrem Konto anmelden'}
    </DialogDescription>
  </DialogHeader>

  {/* Content - Scrollable only if needed */}
  <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
    {children}
  </div>

  {/* Footer - Compact on mobile */}
  <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t">
    {footer}
  </DialogFooter>
</DialogContent>
```

**Form Optimization**:
```tsx
// SignUpForm.tsx / LoginForm.tsx
<form className="space-y-3 sm:space-y-4">
  <div className="space-y-1.5 sm:space-y-2">
    <Label className="text-sm">Email</Label>
    <Input className="h-10 sm:h-11" />
  </div>
  {/* Repeat for other fields */}
</form>
```

**Height Budget (Mobile 320px × 600px viewport)**:
```
Dialog Header: 80px (title + description + padding)
Account Type Cards: 140px (2 buttons × 60px + gap)
Form Fields: 280px (4 fields × 70px average)
Terms Card: 60px (compact button)
Submit Button: 40px
Padding/Spacing: 40px
─────────────────
Total: ~640px (slightly over, needs optimization)

OPTIMIZATION:
- Reduce form field spacing: -20px
- Compact account type cards: -20px
- Reduce header padding: -10px
─────────────────
Optimized Total: ~590px ✅ Fits in 600px viewport
```

### Solution 6: Login vs Signup Visual Indicator

**Problem**: Users don't know if they're at login or signup after email verification
**Solution**: Prominent mode indicator at top of dialog + account type step

**Implementation**:
```tsx
// UnifiedAuthDialog.tsx
<DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b">
  {/* Mode Badge */}
  <div className="flex items-center gap-2 mb-2">
    <Badge
      variant={mode === 'signup' ? 'default' : 'secondary'}
      className="text-xs font-semibold"
    >
      {mode === 'signup' ? 'REGISTRIERUNG' : 'ANMELDUNG'}
    </Badge>
    {step === 'account-type' && (
      <span className="text-xs text-muted-foreground">
        Schritt 1 von 2
      </span>
    )}
  </div>

  <DialogTitle className="text-xl sm:text-2xl">
    {getTitle(mode, step)}
  </DialogTitle>

  <DialogDescription className="text-xs sm:text-sm">
    {getDescription(mode, step)}
  </DialogDescription>
</DialogHeader>
```

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ [REGISTRIERUNG] Schritt 1 von 2         │ ← Blue badge
│                                         │
│ Wählen Sie Ihren Kontotyp               │ ← Title
│ Für eine personalisierte Erfahrung      │ ← Description
├─────────────────────────────────────────┤
│                                         │
│  [Ich bin Studiobetreiber]              │
│  [Ich möchte buchen]                    │
│                                         │
└─────────────────────────────────────────┘

After selecting account type:
┌─────────────────────────────────────────┐
│ [REGISTRIERUNG] Schritt 2 von 2         │
│                                         │
│ Studio-Konto erstellen                  │
│ Füllen Sie Ihre Daten aus               │
├─────────────────────────────────────────┤
│ [Form fields...]                        │
└─────────────────────────────────────────┘
```

**Benefits**:
- ✅ Persistent mode indicator (badge always visible)
- ✅ Progress indicator (Schritt 1 von 2)
- ✅ Context-aware titles and descriptions
- ✅ Reduces cognitive load
- ✅ Clear visual hierarchy

---

## Responsive Design Strategy

### Breakpoints
```
Mobile: < 640px (default, primary focus)
Tablet: sm: 640px+
Desktop: md: 768px+
```

### Mobile-First Approach (320px - 640px)

**Dialog Sizing**:
- Width: `max-w-[95vw]` (leaves 5% margin)
- Height: `max-h-[90vh]` (leaves 10% for visibility)
- Padding: Reduced (px-4, py-3)

**Typography**:
- Title: `text-xl` (mobile) → `sm:text-2xl` (desktop)
- Body: `text-sm` (mobile) → `sm:text-base` (desktop)
- Labels: `text-xs` (mobile) → `sm:text-sm` (desktop)

**Spacing**:
- Form gaps: `space-y-3` (mobile) → `sm:space-y-4` (desktop)
- Padding: `p-4` (mobile) → `sm:p-6` (desktop)
- Button height: `h-10` (mobile) → `sm:h-11` (desktop)

**Layout**:
```tsx
// Account Type Selector
<div className="grid grid-cols-1 gap-3 sm:gap-4">
  {/* Stacks vertically on mobile */}
  {/* Could expand to grid-cols-2 on larger screens if space allows */}
</div>

// Terms Acceptance Card
<button className="w-full p-3 sm:p-4 text-sm sm:text-base">
  {/* Full width, compact padding on mobile */}
</button>
```

### Desktop Optimization (640px+)

**Dialog Sizing**:
- Width: `sm:max-w-[480px]` (fixed width, centered)
- Height: `max-h-[90vh]` (usually won't need full height)

**Enhanced Spacing**:
- More generous padding
- Larger touch targets (less critical on desktop)
- Increased font sizes for readability

---

## Accessibility Requirements (WCAG 2.1 AA)

### Keyboard Navigation
- [x] Tab navigates through all interactive elements
- [x] Enter submits forms
- [x] Escape closes dialog
- [x] Space toggles terms acceptance card
- [x] Focus visible on all elements (ring-2 ring-offset-2)

### Screen Reader Support
- [x] Dialog has aria-labelledby (DialogTitle)
- [x] Dialog has aria-describedby (DialogDescription)
- [x] Terms button has aria-pressed state
- [x] Mode badge has role="status" for announcements
- [x] Form errors announced via aria-live

### Color Contrast
- [x] Text: 4.5:1 minimum (all body text)
- [x] Large text: 3:1 minimum (headings)
- [x] Interactive elements: 3:1 minimum
- [x] Hover states maintain contrast
- [x] Focus indicators clearly visible

### Touch Targets (Mobile)
- [x] Minimum 44x44px touch targets
- [x] Account type buttons: 60px+ height
- [x] Terms card: Full width, 60px+ height
- [x] Submit button: 44px+ height
- [x] Links: Adequate spacing (no accidental clicks)

### Alternative Text
- [x] Icons have aria-label (Check icon in terms button)
- [x] Decorative elements marked appropriately

---

## Component Specifications

### 1. UnifiedAuthDialog

**Props**:
```typescript
interface UnifiedAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'login' | 'signup' // NEW: No more tabs
  initialStep?: 'account-type' | 'form' // NEW: Can skip account selection for login
}
```

**Structure**:
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[480px] max-w-[95vw] max-h-[90vh] p-0 flex flex-col">
    {/* Header with mode indicator */}
    <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b">
      <Badge variant={mode === 'signup' ? 'default' : 'secondary'}>
        {mode === 'signup' ? 'REGISTRIERUNG' : 'ANMELDUNG'}
      </Badge>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>

    {/* Content */}
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
      {step === 'account-type' && <AccountTypeSelector />}
      {step === 'form' && (
        mode === 'signup' ? <SignUpForm /> : <LoginForm />
      )}
    </div>
  </DialogContent>
</Dialog>
```

### 2. AccountTypeSelector

**Structure**:
```tsx
<div className="space-y-3 sm:space-y-4">
  <div className="grid grid-cols-1 gap-3 sm:gap-4">
    <Button
      onClick={() => onSelect('studio')}
      variant="outline"
      className={cn(
        "h-auto py-5 px-5 border-2 transition-all",
        "hover:bg-primary hover:text-primary-foreground hover:border-primary",
        "active:scale-[0.98]",
        "text-left"
      )}
    >
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-base sm:text-lg font-semibold">
          Ich bin Studiobetreiber
        </span>
        <span className="text-xs sm:text-sm opacity-90 font-normal">
          Studio verwalten und Buchungen empfangen
        </span>
      </div>
    </Button>

    <Button
      onClick={() => onSelect('customer')}
      variant="outline"
      className={cn(
        "h-auto py-5 px-5 border-2 transition-all",
        "hover:bg-primary hover:text-primary-foreground hover:border-primary",
        "active:scale-[0.98]",
        "text-left"
      )}
    >
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-base sm:text-lg font-semibold">
          Ich möchte buchen
        </span>
        <span className="text-xs sm:text-sm opacity-90 font-normal">
          Massagen finden und Termine online reservieren
        </span>
      </div>
    </Button>
  </div>
</div>
```

**Key Features**:
- Large touch targets (60px+ height)
- Clear hover states with maintained contrast
- Equal spacing (grid layout)
- Active animation for tactile feedback
- Responsive text sizes

### 3. SignUpForm (Terms Acceptance)

**Replace checkbox section with**:
```tsx
{/* Terms Acceptance Card */}
<button
  type="button"
  onClick={() => setTermsAccepted(!termsAccepted)}
  className={cn(
    "w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all",
    "flex items-start gap-3 active:scale-[0.98]",
    termsAccepted
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-background border-border hover:border-primary/50"
  )}
  aria-pressed={termsAccepted}
  aria-label="Nutzungsbedingungen akzeptieren"
>
  {/* Custom Checkbox */}
  <div className="flex-shrink-0 mt-0.5">
    <div className={cn(
      "w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-colors",
      termsAccepted
        ? "bg-white border-white"
        : "bg-background border-border"
    )}>
      {termsAccepted && (
        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" strokeWidth={3} />
      )}
    </div>
  </div>

  {/* Text with Links */}
  <div className="flex-1 text-xs sm:text-sm leading-relaxed">
    <span>Ich akzeptiere die </span>
    <a
      href="/terms"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "underline font-medium",
        termsAccepted ? "text-primary-foreground" : "text-primary"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      Nutzungsbedingungen
    </a>
    <span> und </span>
    <a
      href="/privacy"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "underline font-medium",
        termsAccepted ? "text-primary-foreground" : "text-primary"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      Datenschutzrichtlinien
    </a>
  </div>
</button>

{/* Error Message */}
{!termsAccepted && attemptedSubmit && (
  <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5">
    <AlertCircle className="w-4 h-4" />
    Bitte akzeptieren Sie die Bedingungen
  </p>
)}
```

### 4. Form Field Optimization

**Compact Form Fields for Mobile**:
```tsx
<div className="space-y-3 sm:space-y-4">
  <div className="space-y-1.5 sm:space-y-2">
    <Label htmlFor="email" className="text-xs sm:text-sm">
      E-Mail-Adresse <span className="text-destructive">*</span>
    </Label>
    <Input
      id="email"
      type="email"
      placeholder="ihre@email.de"
      className="h-10 sm:h-11 text-sm sm:text-base"
      required
    />
  </div>

  <div className="space-y-1.5 sm:space-y-2">
    <Label htmlFor="password" className="text-xs sm:text-sm">
      Passwort <span className="text-destructive">*</span>
    </Label>
    <Input
      id="password"
      type="password"
      placeholder="Mindestens 8 Zeichen"
      className="h-10 sm:h-11 text-sm sm:text-base"
      required
    />
  </div>
</div>
```

---

## Implementation Plan

### Phase 1: Quick Wins (Immediate Impact)
1. **Fix hover contrast** in AccountTypeSelector
   - Update hover state classes
   - Test on light/dark themes
   - Verify WCAG AA compliance

2. **Fix card spacing** in AccountTypeSelector
   - Change to CSS Grid layout
   - Equal gap values
   - Test responsive behavior

3. **Add mode indicator** in UnifiedAuthDialog
   - Add Badge component at top
   - Update titles/descriptions based on mode
   - Test visibility on mobile

### Phase 2: Mobile UX Improvements
4. **Replace terms checkbox** with card button
   - Implement new design
   - Test touch interactions
   - Verify link clicks work independently

5. **Optimize dialog height** for mobile
   - Reduce padding/spacing
   - Compact form fields
   - Test on 320px width devices

### Phase 3: Structural Changes
6. **Remove tabs** from dialog
   - Update prop interface
   - Pass mode from landing page
   - Update state management
   - Test all user flows

### Phase 4: Testing & Refinement
7. **Cross-browser testing**
   - Chrome, Safari, Firefox (mobile + desktop)
   - Test on real devices (iPhone, Android)
   - Verify no scrollbars appear

8. **Accessibility audit**
   - Keyboard navigation
   - Screen reader testing
   - Color contrast verification
   - Touch target sizes

---

## Testing Checklist

### Mobile (320px - 640px)
- [ ] Dialog fits in viewport without scrolling
- [ ] All text is readable (no truncation)
- [ ] Touch targets are 44x44px minimum
- [ ] Terms card is easy to tap
- [ ] Links in terms card are tappable
- [ ] Form fields are easy to fill
- [ ] Submit button is easily reachable
- [ ] Mode indicator is visible at all times

### Desktop (640px+)
- [ ] Dialog is centered and appropriately sized
- [ ] Hover states work correctly
- [ ] Keyboard navigation flows logically
- [ ] Form validation displays clearly
- [ ] Terms card works with mouse click

### Accessibility
- [ ] Screen reader announces mode (ANMELDUNG/REGISTRIERUNG)
- [ ] Form errors are announced
- [ ] All interactive elements have focus indicators
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Keyboard-only navigation works completely

### User Flows
- [ ] Signup from landing page → Account type → Form → Success
- [ ] Login from landing page → Form → Success
- [ ] Email verification → Return to dialog → Clear mode indicator
- [ ] Terms acceptance → Error if not accepted → Success after accepting
- [ ] Cancel/close dialog → State resets appropriately

---

## Design Tokens

### Colors
```tsx
// Mode indicators
signup: "bg-primary text-primary-foreground" // Blue
login: "bg-secondary text-secondary-foreground" // Gray

// Terms card
accepted: "bg-primary text-primary-foreground border-primary"
not-accepted: "bg-background border-border hover:border-primary/50"

// Hover states
hover: "hover:bg-primary hover:text-primary-foreground hover:border-primary"
```

### Spacing (Mobile → Desktop)
```tsx
dialog-padding: "px-4 py-3 sm:px-6 sm:py-4"
form-gap: "space-y-3 sm:space-y-4"
field-gap: "space-y-1.5 sm:space-y-2"
card-gap: "gap-3 sm:gap-4"
```

### Typography (Mobile → Desktop)
```tsx
dialog-title: "text-xl sm:text-2xl"
dialog-description: "text-xs sm:text-sm"
button-title: "text-base sm:text-lg"
button-subtitle: "text-xs sm:text-sm"
label: "text-xs sm:text-sm"
input: "text-sm sm:text-base"
```

### Component Heights (Mobile → Desktop)
```tsx
input: "h-10 sm:h-11"
button: "h-10 sm:h-11"
account-type-button: "py-5" // Auto height
terms-card: "p-3 sm:p-4" // Auto height
```

---

## Visual Design Examples

### Before vs After: Account Type Selector

**BEFORE** (Issues):
```
┌─────────────────────────────────────────┐
│                                         │
│  Unequal margins →  [Card 1]  ← too close
│                                         │
│  [Card 2]  ← unequal spacing            │
│                                         │
│  Hover: White text on light bg (unreadable)
└─────────────────────────────────────────┘
```

**AFTER** (Fixed):
```
┌─────────────────────────────────────────┐
│                                         │
│    [Ich bin Studiobetreiber]            │
│    Studio verwalten und Buchungen...    │
│                                         │
│    [Ich möchte buchen]                  │
│    Massagen finden und Termine...       │
│                                         │
│  Equal margins, readable hover text     │
└─────────────────────────────────────────┘
```

### Before vs After: Terms Acceptance

**BEFORE** (Tiny checkbox):
```
[ ] Ich akzeptiere die Nutzungsbedingungen
    ↑ Hard to tap on mobile
```

**AFTER** (Large card):
```
┌─────────────────────────────────────────┐
│ [✓] Ich akzeptiere die                  │
│     Nutzungsbedingungen und             │
│     Datenschutzrichtlinien              │
└─────────────────────────────────────────┘
  ↑ Entire card is tappable, clear feedback
```

### Before vs After: Mode Indicator

**BEFORE** (Confusing):
```
┌─────────────────────────────────────────┐
│ [Anmelden | Registrieren] ← Tabs       │
│                                         │
│ Wählen Sie Ihren Kontotyp               │
│ ← User confused: Am I logging in?       │
└─────────────────────────────────────────┘
```

**AFTER** (Clear):
```
┌─────────────────────────────────────────┐
│ [REGISTRIERUNG] Schritt 1 von 2         │
│ ↑ Clear indicator                       │
│ Wählen Sie Ihren Kontotyp               │
│ Für eine personalisierte Erfahrung      │
└─────────────────────────────────────────┘
```

---

## Recommendation Summary

### HIGH PRIORITY (Do These First)
1. ✅ **Remove tabs** - Simplifies UX, reduces confusion, saves space
2. ✅ **Fix hover contrast** - Immediate readability improvement
3. ✅ **Replace terms checkbox** - Major mobile UX improvement
4. ✅ **Add mode indicator** - Eliminates confusion after email verification

### MEDIUM PRIORITY
5. ✅ **Fix card spacing** - Professional appearance
6. ✅ **Optimize dialog height** - Remove scrollbars on mobile

### BONUS IMPROVEMENTS
7. Progressive form validation (show errors on blur, not submit)
8. Add password strength indicator
9. Add "Remember me" option for login
10. Add social login buttons (Google, Apple) if applicable

---

## Final Notes

**Why Remove Tabs?**
- Landing page already has Login/Signup buttons (clear intent)
- Tabs add cognitive load for non-tech-savvy users
- Saves vertical space (helps eliminate scrollbar)
- Reduces state complexity
- Aligns with mobile-first philosophy (fewer choices = better mobile UX)

**Why Large Terms Card?**
- Mobile users struggle with tiny checkboxes
- Entire card as touch target = more forgiving
- Visual feedback (background change) = clearer state
- Follows mobile design best practices
- Still works great on desktop

**Why Badge Indicator?**
- Persistent visual reference (always visible)
- Clear semantic meaning (REGISTRIERUNG vs ANMELDUNG)
- Reduces memory load (user doesn't need to remember)
- Professional appearance
- Minimal space usage

**Mobile-First Success Criteria**:
- ✅ No scrollbars on 320px × 600px viewport
- ✅ All touch targets 44px+ minimum
- ✅ Text readable without zooming
- ✅ Clear visual hierarchy
- ✅ One-thumb operation possible
- ✅ Fast loading (minimal JS)

---

**Implementation Status**: Ready for development
**Estimated Effort**: 4-6 hours
**Priority**: High (impacts core user flow)
**Risk**: Low (no breaking changes, gradual rollout possible)
