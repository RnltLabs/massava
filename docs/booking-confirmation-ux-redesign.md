# Design Specification: Booking Confirmation Page Redesign

## Overview
Mobile-first redesign of the booking confirmation page for Massava wellness/massage booking platform. The page allows users to confirm their appointment selection, choose a service, and complete the booking process.

**Target Users**: Wellness & massage customers (primarily female, 25-55 years), mobile-first users who value elegant, calming design and need a quick, intuitive booking process.

**Current Issues**:
- Desktop-style layout on mobile devices
- Poor use of screen space
- Lacks wellness/spa aesthetic
- Information hierarchy unclear
- Not optimized for touch interactions

## User Flow Analysis

### Current Flow (Issues Identified)

```
User Journey:
1. Search Results Page
   → User sees available time slots

2. Click Time Slot (e.g., "15:00")
   → Direct navigation to booking page

3. Booking Confirmation Page ❌ ISSUES:
   → Full page load (jarring transition)
   → Desktop-style layout on mobile
   → All information shown at once (overwhelming)
   → Studio info takes too much vertical space
   → Service selection buried below fold
   → No clear visual hierarchy
   → Buttons too small for touch
   → No progress indicator
   → No back navigation clarity

4. Service Selection
   → Unclear which services are available
   → No service details preview
   → Price not prominent

5. Confirmation
   → No confirmation feedback
   → No booking summary before final submit
```

### Improved Mobile-First Flow

```
User Journey (Redesigned):

1. Search Results Page
   → User sees available time slots
   → IMPROVEMENT: Add subtle animation hint on tap

2. Tap Time Slot
   → IMPROVEMENT: Smooth slide-up transition (Sheet component)
   → Progressive disclosure (show essentials first)

3. Booking Confirmation Sheet (Mobile)
   ┌─────────────────────────────────────┐
   │ Step 1: Review Details              │
   │ ─────────────────────────────────── │
   │ ✓ Compact studio info (1 line)      │
   │ ✓ Prominent date/time display       │
   │ ✓ Clear "Continue" CTA              │
   │ ✓ Visual progress indicator (1/3)   │
   └─────────────────────────────────────┘

4. Service Selection Sheet
   ┌─────────────────────────────────────┐
   │ Step 2: Choose Service              │
   │ ─────────────────────────────────── │
   │ ✓ Visual service cards              │
   │ ✓ Prominent pricing                 │
   │ ✓ Duration indicators               │
   │ ✓ Expandable descriptions           │
   │ ✓ Progress indicator (2/3)          │
   └─────────────────────────────────────┘

5. Final Confirmation
   ┌─────────────────────────────────────┐
   │ Step 3: Confirm Booking             │
   │ ─────────────────────────────────── │
   │ ✓ Booking summary                   │
   │ ✓ Total price                       │
   │ ✓ Cancellation policy               │
   │ ✓ Large "Book Now" button           │
   │ ✓ Progress indicator (3/3)          │
   └─────────────────────────────────────┘

6. Success State
   ┌─────────────────────────────────────┐
   │ ✓ Success animation                 │
   │ ✓ Booking confirmation number       │
   │ ✓ Next steps (calendar, directions) │
   │ ✓ Return to search CTA              │
   └─────────────────────────────────────┘

Exit Points:
- Tap outside sheet → Closes, returns to search
- Back button → Previous step
- Cancel button → Confirmation dialog → Return to search
- Success → Option to book another or view booking
```

## UX Analysis of Current Issues

### Critical Issues

**1. Layout Not Mobile-Optimized**
- Desktop-style card layout on mobile
- Fixed widths don't adapt to small screens
- Horizontal space wasted
- Vertical scrolling excessive

**2. Information Hierarchy Poor**
- Studio avatar too large (takes 20% of screen)
- Studio address takes 3 lines (unnecessary detail)
- Selected time not visually prominent
- Service selection buried below fold
- No clear primary action

**3. Visual Design Misalignment**
- Lacks wellness/spa aesthetic
- Generic card design (not calming)
- No use of terracotta brand color
- Shadows too harsh
- No breathing room

**4. Interaction Design Issues**
- Buttons too small for touch (< 48px)
- No touch feedback
- No loading states
- No error prevention (can double-tap submit)
- Back navigation unclear

**5. Progressive Disclosure Missing**
- All information shown at once
- Overwhelming for mobile users
- No step-by-step guidance
- No progress indicator

### Medium Issues

**6. Accessibility Gaps**
- Focus states not prominent
- Color contrast may be insufficient
- No skip-to-content option
- Touch targets too small

**7. Performance Concerns**
- Full page load for what could be a modal
- No transition animations
- Abrupt navigation

**8. Content Issues**
- Subtitle too wordy ("Bitte bestätigen Sie Ihre Buchung bei...")
- Date format verbose
- No service descriptions visible
- No cancellation policy shown

## Mobile-First Wireframes

### Mobile Layout (320px-768px) - PRIMARY

**STEP 1: Initial View (Sheet Component)**

```
┌─────────────────────────────────┐
│ ┌───────────────────────────┐   │ ← Handle for drag-down
│ │         ═══════           │   │
│ └───────────────────────────┘   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ○ ○ ○                       │ │ ← Progress dots (1 of 3 filled)
│ └─────────────────────────────┘ │
│                                 │
│ Termin bestätigen               │ ← h2 text-2xl font-bold
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Avatar] Thai Wellness Oase │ │ ← Compact studio info
│ │          Zürich             │ │    Single line, small text
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  ╔═══════════════════════╗  │ │
│ │  ║   📅 Montag           ║  │ │ ← Prominent date/time
│ │  ║   03. November 2025   ║  │ │    Soft terracotta bg
│ │  ║                       ║  │ │    Large text
│ │  ║   🕐 15:00 Uhr        ║  │ │
│ │  ╚═══════════════════════╝  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │   Behandlung wählen →       │ │ ← Large CTA button
│ │                             │ │    Terracotta bg
│ └─────────────────────────────┘ │    Min 48px height
│                                 │
│ ┌─────────────────────────────┐ │
│ │ × Abbrechen                 │ │ ← Ghost button
│ └─────────────────────────────┘ │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Component Breakdown:**
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent
    side="bottom"
    className="h-[85vh] rounded-t-3xl"
  >
    {/* Drag handle */}
    <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mb-6" />

    {/* Progress indicator */}
    <ProgressDots current={1} total={3} />

    {/* Content */}
    <SheetHeader className="space-y-4">
      <SheetTitle className="text-2xl font-bold">
        Termin bestätigen
      </SheetTitle>
    </SheetHeader>

    <div className="flex-1 space-y-6 py-6">
      {/* Compact studio info */}
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl">
        <Avatar className="h-10 w-10">
          <AvatarImage src={studio.avatar} />
          <AvatarFallback>{studio.initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{studio.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {studio.city}
          </p>
        </div>
      </div>

      {/* Prominent date/time card */}
      <Card className="bg-terracotta/10 border-terracotta/20">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-terracotta" />
            <div>
              <p className="text-sm text-muted-foreground">Datum</p>
              <p className="text-lg font-semibold">
                {formatDate(selectedSlot.date, 'EEEE, dd. MMMM yyyy')}
              </p>
            </div>
          </div>
          <Separator className="bg-terracotta/20" />
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-terracotta" />
            <div>
              <p className="text-sm text-muted-foreground">Uhrzeit</p>
              <p className="text-lg font-semibold">
                {formatTime(selectedSlot.time)} Uhr
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Actions */}
    <div className="space-y-3 pt-4 border-t">
      <Button
        size="lg"
        className="w-full h-14 text-lg bg-terracotta hover:bg-terracotta/90"
        onClick={() => setStep(2)}
      >
        Behandlung wählen
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
      <Button
        size="lg"
        variant="ghost"
        className="w-full"
        onClick={handleCancel}
      >
        Abbrechen
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

**STEP 2: Service Selection**

```
┌─────────────────────────────────┐
│         ═══════                 │ ← Drag handle
│                                 │
│ ● ● ○                           │ ← Progress (2 of 3)
│                                 │
│ ← Behandlung wählen             │ ← Back button + title
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Suchen...                │ │ ← Search/filter services
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ◯ Thai Massage              │ │ ← Service card (radio)
│ │    90 min • CHF 150         │ │    Terracotta border when selected
│ │    ⓘ Details anzeigen       │ │    Expandable description
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ◯ Aromatherapie             │ │
│ │    60 min • CHF 120         │ │
│ │    ⓘ Details anzeigen       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ◯ Hot Stone Massage         │ │
│ │    75 min • CHF 140         │ │
│ │    ⓘ Details anzeigen       │ │
│ └─────────────────────────────┘ │
│                                 │
│ [More services...scroll]        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │   Weiter                    │ │ ← Disabled until selection
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**STEP 3: Final Confirmation**

```
┌─────────────────────────────────┐
│         ═══════                 │
│                                 │
│ ● ● ●                           │ ← Progress (3 of 3)
│                                 │
│ ← Buchung bestätigen            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Zusammenfassung             │ │
│ │ ─────────────────────────── │ │
│ │ Thai Wellness Oase          │ │
│ │ Zürich                      │ │
│ │                             │ │
│ │ 📅 Mo, 03. Nov 2025         │ │
│ │ 🕐 15:00 Uhr                │ │
│ │                             │ │
│ │ Thai Massage                │ │
│ │ 90 Minuten                  │ │
│ │                             │ │
│ │ ─────────────────────────── │ │
│ │ Gesamt        CHF 150       │ │ ← Bold, large
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⓘ Stornierung               │ │ ← Collapsible info
│ │   Kostenlos bis 24h vorher  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │   ✓ Jetzt buchen            │ │ ← Large, prominent
│ └─────────────────────────────┘ │    Green accent
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ← Zurück                    │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**SUCCESS STATE**

```
┌─────────────────────────────────┐
│                                 │
│         ┌──────────┐            │
│         │   ✓      │            │ ← Animated checkmark
│         │          │            │    Green circle
│         └──────────┘            │
│                                 │
│    Buchung erfolgreich!         │ ← Large heading
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Ihre Buchungsnummer         │ │
│ │                             │ │
│ │      #MB-2025-1234          │ │ ← Monospace, large
│ │                             │ │
│ │ Eine Bestätigung wurde an   │ │
│ │ ihre E-Mail gesendet        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📅 Zum Kalender hinzufügen  │ │ ← Action buttons
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📍 Route anzeigen           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Buchung anzeigen            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Weitere Termine suchen      │ │ ← Secondary action
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Desktop Layout (768px+)

**Desktop approach: Keep mobile flow but center modal**

```
┌───────────────────────────────────────────────────────────┐
│ Header Navigation                                         │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                                                           │
│          ┌───────────────────────────────┐               │
│          │ Dialog (centered)             │               │
│          │ Max-width: 600px              │               │
│          │                               │               │
│          │ Same content as mobile        │               │
│          │ but in Dialog component       │               │
│          │ instead of Sheet              │               │
│          │                               │               │
│          │ [Content from mobile]         │               │
│          │                               │               │
│          └───────────────────────────────┘               │
│                                                           │
│ Background: Search results (dimmed)                       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Responsive Strategy:**
```tsx
// Detect screen size
const isMobile = useMediaQuery("(max-width: 768px)")

// Conditional rendering
{isMobile ? (
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
    <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
      {/* Mobile content */}
    </SheetContent>
  </Sheet>
) : (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      {/* Same content, desktop centered modal */}
    </DialogContent>
  </Dialog>
)}
```

## Component Specification

### shadcn/ui Components Used

1. **Sheet (Mobile) / Dialog (Desktop)** - Modal wrapper
2. **Card** - Content containers
3. **Button** - All actions
4. **Input** - Search services
5. **RadioGroup** - Service selection
6. **Avatar** - Studio image
7. **Separator** - Visual dividers
8. **ScrollArea** - Service list
9. **Collapsible** - Cancellation policy
10. **Toast** - Success/error notifications
11. **Skeleton** - Loading states

### Custom Components

**ProgressDots**
```tsx
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-2 rounded-full transition-all",
            index < current
              ? "bg-terracotta w-8"
              : "bg-muted w-2"
          )}
        />
      ))}
    </div>
  )
}
```

**ServiceCard**
```tsx
function ServiceCard({ service, isSelected }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className={cn(
      "cursor-pointer transition-all",
      isSelected && "border-terracotta border-2 shadow-terracotta"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <RadioGroupItem value={service.id} />
          <div className="flex-1">
            <h3 className="font-semibold">{service.name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5" />
              <span>{service.duration} min</span>
              <span>•</span>
              <span className="font-semibold">CHF {service.price}</span>
            </div>

            {service.description && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Info className="h-3 w-3 mr-1" />
                  {isExpanded ? 'Details ausblenden' : 'Details anzeigen'}
                </Button>

                {isExpanded && (
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## File Structure

```
app/[locale]/booking/[studioId]/[slotId]/
  ├── page.tsx (Server Component - data fetching)
  └── _components/
      ├── BookingSheet.tsx (Client - main orchestrator)
      ├── StepReview.tsx (Step 1 content)
      ├── StepService.tsx (Step 2 content)
      ├── StepConfirm.tsx (Step 3 content)
      ├── SuccessState.tsx (Success screen)
      ├── ServiceCard.tsx (Individual service card)
      └── ProgressDots.tsx (Progress indicator)
```

## Responsive Behavior

### Mobile (< 768px) - PRIMARY TARGET

- Sheet component slides up from bottom
- 85vh height (allows peek at background)
- Rounded top corners (rounded-t-3xl)
- Drag handle for visual affordance
- Single column layout
- Touch targets minimum 48px
- Primary buttons 56px (h-14)

### Tablet (768px - 1024px)

- Dialog component (centered modal)
- Max-width: 600px
- Same content, more breathing room
- Larger padding (p-6 vs p-4)

### Desktop (1024px+)

- Dialog component (centered modal)
- Hover states on interactive elements
- Keyboard shortcuts enabled
- Focus states more prominent

## Accessibility

### WCAG 2.1 AA Compliance

**Semantic HTML**
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ `<form>` element wraps inputs
- ✅ `<button>` for actions (not div)

**ARIA Labels**
- ✅ Dialog has aria-labelledby (SheetTitle)
- ✅ Progress indicator has role="progressbar"
- ✅ Radio buttons properly labeled
- ✅ Icon-only buttons have aria-label

**Keyboard Navigation**
- ✅ Tab navigates all interactive elements
- ✅ Enter activates buttons
- ✅ Space selects radio buttons
- ✅ Escape closes dialog
- ✅ Focus trap within dialog

**Focus Indicators**
- ✅ Visible focus ring (ring-2 ring-offset-2)
- ✅ High contrast focus states

**Color Contrast**
- ✅ Text: 4.5:1 minimum
- ✅ Large text: 3:1 minimum
- ✅ Interactive elements: 3:1 against background

**Touch Targets**
- ✅ Minimum 48x48px (WCAG AAA)
- ✅ Primary buttons: 56px height
- ✅ 8px minimum spacing between targets

## Design Tokens

### Colors

```css
/* Brand - Terracotta */
--terracotta: #B56550;
--terracotta-light: #C98171;
--terracotta-dark: #A05540;

/* Wellness Shadows */
--wellness-shadow: 0 4px 6px -1px rgb(181 101 80 / 0.1);
--shadow-terracotta: 0 4px 12px -2px rgb(181 101 80 / 0.2);
```

### Typography

- Page title: text-2xl font-bold (24px)
- Section title: text-lg font-semibold (18px)
- Body text: text-base (16px)
- Helper text: text-sm text-muted-foreground (14px)

### Spacing

- Container: px-4 py-4 (mobile), px-6 py-6 (desktop)
- Section gaps: space-y-6 (24px)
- Card padding: p-4 (mobile), p-6 (desktop)
- Button gaps: gap-3 (12px)

### Borders

- Small: rounded-lg (8px)
- Medium: rounded-xl (12px)
- Large: rounded-2xl (16px)
- XL: rounded-3xl (24px)

## Implementation Notes

### For feature-builder Agent

**Server Component (page.tsx)**
- Fetch studio and services data
- Validate slot availability
- Pass data to client component

**Client Component (BookingSheet.tsx)**
- Manage step state
- Handle service selection
- Submit booking via Server Action
- Show success/error states

**Server Action**
```typescript
// app/[locale]/booking/actions.ts
"use server"

export async function createBooking(data: BookingInput) {
  // Validate with Zod
  const result = bookingSchema.safeParse(data)
  if (!result.success) {
    return { success: false, error: "Invalid data" }
  }

  // Create booking
  const booking = await db.booking.create({
    data: result.data
  })

  // Revalidate search results
  revalidatePath("/search")

  return {
    success: true,
    bookingNumber: `MB-${booking.id.slice(0, 8).toUpperCase()}`
  }
}
```

### For performance-optimizer Agent

- Lazy load success state animation
- Virtual scroll service list (if >20 items)
- Optimize images (Next.js Image component)
- Code split by step
- Minimize bundle size (tree-shake icons)

### For security-auditor Agent

- Zod validation client + server
- CSRF protection (Server Actions built-in)
- Rate limit booking endpoint
- Validate slot availability before booking
- Prevent double booking with optimistic locking

## Success Metrics

**Conversion Funnel**
- Step 1 → Step 2: Target 85%+
- Step 2 → Step 3: Target 75%+
- Step 3 → Success: Target 90%+
- Overall conversion: Target 57%+

**Performance**
- Time to Interactive: < 3.5s
- Sheet open animation: 60fps
- Form submission: < 2s

**User Experience**
- Mobile satisfaction: 4.5+ stars
- Time to booking: < 90 seconds
- Error rate: < 5%

---

## Summary

This mobile-first redesign transforms the booking confirmation page into a smooth, step-by-step experience optimized for wellness/spa aesthetics.

**Key Improvements**:
1. ✅ Mobile-first Sheet component (bottom drawer)
2. ✅ Progressive disclosure (3-step flow)
3. ✅ Prominent date/time display
4. ✅ Visual service cards with expandable details
5. ✅ Large touch targets (56px buttons)
6. ✅ Terracotta brand color integration
7. ✅ Wellness shadows and soft corners
8. ✅ Clear progress indicator
9. ✅ Smooth animations
10. ✅ WCAG 2.1 AA compliant

**Expected Impact**:
- 🚀 +25% mobile conversion rate
- 😊 4.5+ user satisfaction
- ⚡ < 90s time to booking
- ♿ WCAG AAA touch targets
- 🎨 Strong wellness brand alignment
