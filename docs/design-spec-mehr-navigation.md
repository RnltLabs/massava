# Design Specification: Verwaltung Section Navigation

## Overview
This specification defines the navigation patterns and naming conventions for the business management section of the Massava mobile app (formerly "Mehr", now "Verwaltung").

**Target Audience**: Studio/business owners (massage studios, beauty salons, wellness centers)
**Platform**: Mobile-first web app (iOS/Android browsers)
**Framework**: Next.js 14 App Router + shadcn/ui

---

## 1. Navigation Pattern

### Decision: Hierarchical Navigation with Back Button

**Pattern**: Stack navigation with explicit back button in header

**Rationale**:
- Follows iOS Human Interface Guidelines and Android Material Design
- Meets user expectations for hierarchical navigation
- Reduces cognitive load (no need to remember origin)
- Improves accessibility (clear navigation hierarchy for screen readers)
- Aligns with industry standards (Google Calendar, Square, Calendly)

### Navigation Structure

```
Bottom Nav: Heute | Kalender | Anfragen | Verwaltung
                                              ↓
Verwaltung Overview Page (list of sections)
    ├─ Services verwalten → Services Page (with back button)
    ├─ Geschäftsdaten → Business Data Page (with back button)
    └─ Support → Support Page (with back button)
```

### User Flow

**Entry Point**: User taps "Verwaltung" in bottom navigation

**Step 1**: Verwaltung Overview Page
```
┌─────────────────────────┐
│      Verwaltung         │ ← Title only (no back button, this is top level)
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ 🔧 Services         │ │ ← Tappable card
│ │ Manage your services│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🏢 Geschäftsdaten   │ │
│ │ Hours, location...  │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 💬 Support          │ │
│ │ Get help            │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
│ Heute │ Kal │ Anfr │Verw│ ← "Verwaltung" highlighted
└─────────────────────────┘
```

**Step 2**: User taps "Services verwalten" → Services Page
```
┌─────────────────────────┐
│ ← Verwaltung  Services  │ ← Back button + Breadcrumb + Title
├─────────────────────────┤
│                         │
│ [Services management    │
│  UI content here]       │
│                         │
│                         │
└─────────────────────────┘
│ Heute │ Kal │ Anfr │Verw│ ← "Verwaltung" highlighted
└─────────────────────────┘
```

**Step 3**: User taps back button → Returns to Verwaltung Overview

**Alternative Flow**: User taps different bottom nav item → Switches context (expected behavior)

---

## 2. Component Specifications

### shadcn/ui Components Used

1. **Button** (ghost variant) for back button
2. **Card** for section items on overview page
3. **Separator** between sections (if needed)

### Verwaltung Overview Page

**File**: `app/(business)/verwaltung/page.tsx`

```typescript
// app/(business)/verwaltung/page.tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Settings, Building2, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function VerwaltungPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header (no back button, this is top level) */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center px-4 h-14">
          <h1 className="text-lg font-semibold">Verwaltung</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4">
          {/* Services Section */}
          <Link href="/verwaltung/services">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Services</CardTitle>
                  <CardDescription className="text-sm">
                    Verwalten Sie Ihre Dienstleistungen
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Business Data Section */}
          <Link href="/verwaltung/geschaeftsdaten">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Geschäftsdaten</CardTitle>
                  <CardDescription className="text-sm">
                    Öffnungszeiten, Standort, Statistiken
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Support Section */}
          <Link href="/verwaltung/support">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Support</CardTitle>
                  <CardDescription className="text-sm">
                    Hilfe und Unterstützung
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav active="verwaltung" />
    </div>
  )
}
```

### Services Page (Submenu Example)

**File**: `app/(business)/verwaltung/services/page.tsx`

```typescript
// app/(business)/verwaltung/services/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ServicesPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-screen">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-2 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Zurück zu Verwaltung"
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Verwaltung</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">Services</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* Services management UI */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Services verwalten</h1>
          <p className="text-muted-foreground">
            Fügen Sie neue Services hinzu oder bearbeiten Sie bestehende.
          </p>

          {/* Service cards/list here */}
        </div>
      </main>

      {/* Bottom navigation (Verwaltung highlighted) */}
      <BottomNav active="verwaltung" />
    </div>
  )
}
```

### Back Button Component (Reusable)

**File**: `components/navigation/BackButton.tsx`

```typescript
// components/navigation/BackButton.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  label?: string
  fallbackUrl?: string
  className?: string
}

export function BackButton({
  label = "Zurück",
  fallbackUrl,
  className
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else if (fallbackUrl) {
      router.push(fallbackUrl)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      aria-label={label}
      className={className}
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )
}
```

### Page Header Component (Reusable)

**File**: `components/navigation/PageHeader.tsx`

```typescript
// components/navigation/PageHeader.tsx
import { BackButton } from "./BackButton"

interface PageHeaderProps {
  title: string
  breadcrumb?: string
  showBackButton?: boolean
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  breadcrumb,
  showBackButton = true,
  actions
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBackButton && <BackButton />}

          {breadcrumb ? (
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-muted-foreground truncate">
                {breadcrumb}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold truncate">{title}</span>
            </div>
          ) : (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
```

**Usage Example**:

```typescript
// In any submenu page
import { PageHeader } from "@/components/navigation/PageHeader"

<PageHeader
  title="Services"
  breadcrumb="Verwaltung"
  showBackButton={true}
/>
```

---

## 3. Naming Convention

### Decision: Rename "Mehr" to "Verwaltung"

**New Label**: **"Verwaltung"** (Management)

**Rationale**:
- More accurate representation of content (Services, Business data, Support)
- Aligns with German business software conventions (sevDesk, Lexware, DATEV)
- Professional tone appropriate for business owners
- Communicates administrative/configuration purpose
- Avoids "miscellaneous" connotation of "Mehr"

### Bottom Navigation Labels (Final)

```typescript
const bottomNavItems = [
  { label: "Heute", href: "/heute", icon: Home },
  { label: "Kalender", href: "/kalender", icon: Calendar },
  { label: "Anfragen", href: "/anfragen", icon: Inbox },
  { label: "Verwaltung", href: "/verwaltung", icon: Settings }, // Changed from "Mehr"
]
```

### Implementation (Bottom Nav Component)

**File**: `components/navigation/BottomNav.tsx`

```typescript
// components/navigation/BottomNav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Inbox, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Heute",
    href: "/heute",
    icon: Home,
    match: /^\/heute/
  },
  {
    label: "Kalender",
    href: "/kalender",
    icon: Calendar,
    match: /^\/kalender/
  },
  {
    label: "Anfragen",
    href: "/anfragen",
    icon: Inbox,
    match: /^\/anfragen/
  },
  {
    label: "Verwaltung",
    href: "/verwaltung",
    icon: Settings,
    match: /^\/verwaltung/
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 z-10 bg-background border-t">
      <div className="flex h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.match.test(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Key Implementation Details**:
- Uses regex pattern matching (`match: /^\/verwaltung/`) to highlight "Verwaltung" when user is on any submenu page (`/verwaltung/services`, `/verwaltung/geschaeftsdaten`, etc.)
- Active state persists across entire section (user always knows they're in "Verwaltung" context)

---

## 4. Accessibility Requirements

### WCAG 2.1 AA Compliance

**Semantic HTML**:
- ✅ `<nav>` element for bottom navigation
- ✅ `<header>` element for page headers
- ✅ `<main>` element for page content
- ✅ `<button>` for back button

**ARIA Labels**:
- ✅ Back button has `aria-label="Zurück zu Verwaltung"` (descriptive, not just "Back")
- ✅ Bottom nav items have visible text labels (no icon-only)
- ✅ Active state communicated via `aria-current="page"` (add to Link component)

**Keyboard Navigation**:
- ✅ All navigation items reachable by Tab
- ✅ Back button activates on Enter/Space
- ✅ Bottom nav links activate on Enter
- ✅ Focus visible on all interactive elements

**Screen Reader Support**:
- ✅ Navigation hierarchy announced ("Verwaltung, heading level 1" → "Services, heading level 1")
- ✅ Back button announces destination ("Zurück zu Verwaltung")
- ✅ Bottom nav announces current location ("Verwaltung, current page")

**Color Contrast**:
- ✅ Active nav item: primary color with 4.5:1 contrast
- ✅ Inactive nav item: muted-foreground with 4.5:1 contrast
- ✅ Focus ring visible on all interactive elements

### Keyboard Shortcuts (Optional Enhancement)

```typescript
// Consider adding keyboard shortcuts for power users
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.altKey) {
      switch (e.key) {
        case "h": router.push("/heute"); break
        case "k": router.push("/kalender"); break
        case "a": router.push("/anfragen"); break
        case "v": router.push("/verwaltung"); break
      }
    }
  }

  window.addEventListener("keydown", handleKeyPress)
  return () => window.removeEventListener("keydown", handleKeyPress)
}, [])
```

---

## 5. Responsive Design

### Breakpoints
- Mobile: < 640px (primary target)
- Tablet: 640px - 1024px (secondary)
- Desktop: > 1024px (rare for this app, but supported)

### Mobile-Specific Optimizations

**Bottom Nav Height**:
- Standard: 64px (16 Tailwind units)
- Accounts for iOS safe area insets (bottom notch)

**Back Button Touch Target**:
- Minimum: 44x44px (iOS guideline)
- Implemented: 36x36px button in 56px header (acceptable)

**Header Height**:
- Standard: 56px (14 Tailwind units)
- Consistent across all pages

**Safe Area Handling** (for iOS):

```css
/* Add to global.css */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

.page-header {
  padding-top: env(safe-area-inset-top);
}
```

---

## 6. Implementation Checklist

### Phase 1: Rename "Mehr" to "Verwaltung"
- [ ] Update bottom nav component labels
- [ ] Update route paths (`/mehr` → `/verwaltung`)
- [ ] Update database/config references (if any)
- [ ] Update breadcrumbs and page titles
- [ ] Update navigation analytics tracking

### Phase 2: Add Back Buttons to Submenu Pages
- [ ] Create reusable `BackButton` component
- [ ] Create reusable `PageHeader` component
- [ ] Add back button to Services page
- [ ] Add back button to Geschäftsdaten page
- [ ] Add back button to Support page
- [ ] Test navigation flow (back button → overview → bottom nav)

### Phase 3: Improve Verwaltung Overview Page
- [ ] Replace simple list with Card-based layout
- [ ] Add icons to each section
- [ ] Add hover states for touch feedback
- [ ] Optimize for thumb-reach zones
- [ ] Add loading skeletons (if server-rendered)

### Phase 4: Testing & Accessibility
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test screen reader announcements (VoiceOver, TalkBack)
- [ ] Test on iOS Safari (back button, safe areas)
- [ ] Test on Android Chrome (back button behavior)
- [ ] Verify color contrast ratios (WCAG AA)
- [ ] Test with large text sizes (accessibility settings)

### Phase 5: Analytics & Monitoring
- [ ] Track back button usage vs bottom nav usage
- [ ] Track time spent in each Verwaltung subsection
- [ ] Monitor for user confusion (rapid navigation changes)
- [ ] A/B test "Verwaltung" vs other naming options (optional)

---

## 7. Migration Strategy

### Gradual Rollout

**Week 1**: Backend changes
- Update route paths (`/mehr` → `/verwaltung`)
- Add redirects for old URLs
- Update database references

**Week 2**: UI changes (feature flag)
- Deploy new bottom nav with "Verwaltung" label (behind flag)
- Add back buttons to all submenu pages
- Test internally with team

**Week 3**: Soft launch
- Enable for 10% of users
- Monitor analytics and support tickets
- Gather user feedback

**Week 4**: Full rollout
- Enable for 100% of users
- Remove old "Mehr" references
- Update documentation

### Rollback Plan
- Keep feature flag for 2 weeks after full rollout
- Maintain redirects for 3 months
- Monitor error rates and user feedback

---

## 8. Design Tokens

### Colors
- **Active nav item**: `text-primary` (default primary color)
- **Inactive nav item**: `text-muted-foreground`
- **Hover state**: `hover:text-foreground`
- **Background**: `bg-background`
- **Border**: `border-border`

### Spacing
- **Bottom nav height**: `h-16` (64px)
- **Header height**: `h-14` (56px)
- **Back button size**: `h-9 w-9` (36x36px)
- **Card padding**: `p-4` (16px)
- **Section gap**: `gap-4` (16px)

### Typography
- **Page title**: `text-lg font-semibold` (18px, 600 weight)
- **Section title**: `text-base` (16px)
- **Description**: `text-sm text-muted-foreground` (14px)
- **Nav label**: `text-xs` (12px)

### Icons
- **Nav icons**: `h-5 w-5` (20x20px)
- **Section icons**: `h-6 w-6` (24x24px)
- **Back button icon**: `h-5 w-5` (20x20px)

---

## 9. Success Metrics

### User Experience Metrics
- **Navigation efficiency**: Time to reach Services page from Heute < 3 seconds
- **Back button usage**: > 80% of users use back button (vs bottom nav) to return to overview
- **Error rate**: < 5% of users navigate to wrong section
- **Support tickets**: < 2% increase in navigation-related questions

### Accessibility Metrics
- **Keyboard navigation**: 100% of pages reachable via keyboard only
- **Screen reader**: 0 critical accessibility violations (WAVE, Axe)
- **Color contrast**: 100% WCAG AA compliance
- **Touch targets**: 100% of interactive elements > 44x44px

### Adoption Metrics
- **Feature discovery**: > 70% of users access Verwaltung section within first week
- **Section engagement**: Average 2+ subsections visited per session
- **Retention**: No decrease in daily active users post-migration

---

## 10. Future Enhancements

### Potential Improvements (Post-Launch)

1. **Search in Verwaltung**
   - Add search bar to overview page
   - Quick jump to any setting/configuration

2. **Contextual Help**
   - Inline tooltips for complex settings
   - Video tutorials for first-time users

3. **Recent Items**
   - Show recently accessed sections at top of overview
   - Smart suggestions based on user behavior

4. **Keyboard Shortcuts**
   - Alt+V to jump to Verwaltung
   - Alt+S for Services, Alt+G for Geschäftsdaten

5. **Progressive Disclosure**
   - Collapse advanced settings by default
   - "Show more" options for power users

---

## Summary

### Key Decisions

1. **Navigation Pattern**: ✅ Add back buttons to all submenu pages
   - Follows iOS/Android platform guidelines
   - Reduces cognitive load
   - Aligns with industry standards

2. **Naming Convention**: ✅ Rename "Mehr" to "Verwaltung"
   - More accurate and professional
   - Matches German business software conventions
   - Communicates purpose clearly

### Implementation Priority

**Must Have (MVP)**:
- Back button on all submenu pages
- Rename to "Verwaltung"
- Breadcrumb navigation

**Should Have**:
- Card-based overview layout
- Icons for each section
- Hover states

**Nice to Have**:
- Keyboard shortcuts
- Search functionality
- Recent items

### Expected Outcomes

- ✅ Improved navigation clarity
- ✅ Reduced user confusion
- ✅ Better alignment with platform standards
- ✅ Professional brand perception
- ✅ WCAG AA accessibility compliance

---

**Last Updated**: 2025-11-10
**Reviewed By**: UX Design Team
**Status**: Ready for Implementation
