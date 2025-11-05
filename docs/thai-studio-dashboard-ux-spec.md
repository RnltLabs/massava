# Thai Studio Dashboard - UX Design Specification

**Version**: 1.0
**Date**: 2025-10-30
**Target Users**: Thai massage studio owners (low digital literacy, non-technical)
**Primary Device**: Mobile phones (iOS/Android)
**Design Philosophy**: "If my mother can't use it, it's too complex"

---

## Table of Contents

1. [Research Findings](#research-findings)
2. [Design Principles](#design-principles)
3. [User Flow Overview](#user-flow-overview)
4. [Dashboard Landing Page](#dashboard-landing-page)
5. [Navigation Structure](#navigation-structure)
6. [Booking Management](#booking-management)
7. [Calendar Views](#calendar-views)
8. [Service Management](#service-management)
9. [Component Specifications](#component-specifications)
10. [Accessibility](#accessibility)
11. [Implementation Notes](#implementation-notes)

---

## Research Findings

### Competitor Analysis: Booksy & Fresha

**Key Patterns Observed:**

1. **Booksy** (4.8★ rating, 500K+ downloads):
   - Large, colorful action buttons
   - Card-based layout for bookings
   - Clear status badges (New, Confirmed, Completed)
   - Bottom tab navigation (4-5 items max)
   - Today's schedule is FIRST thing you see
   - Notification badges on tabs

2. **Fresha** (4.7★ rating, 1M+ downloads):
   - Time-based booking list (chronological)
   - Swipe actions for quick accept/decline
   - Large accept/decline buttons (green/red)
   - Minimal text, maximum icons
   - Bottom navigation with icons + labels

**Common Success Patterns:**
- Bookings are the PRIMARY focus (landing page)
- Large touch targets (minimum 44x44px)
- High contrast colors for actions (green = accept, red = decline)
- Status indicators use color + icon + text (redundancy for clarity)
- Minimal navigation depth (2 levels max)
- Persistent bottom navigation bar

### Best Practices for Low-Tech-Literacy Users

**Research Sources**: Nielsen Norman Group, Material Design, iOS HIG

1. **Visual Hierarchy**:
   - Use size to indicate importance (largest = most important)
   - Maximum 3 levels of text size
   - Avoid subtle visual cues (use obvious ones)

2. **Color Usage**:
   - Universal colors: Green (good/yes), Red (bad/no), Yellow (warning)
   - Never rely on color alone (add icons + text)
   - High contrast ratios (7:1 for body text)

3. **Touch Targets**:
   - Minimum 44x44px (iOS standard)
   - Spacing between targets: 8px minimum
   - Full-width buttons on mobile

4. **Text & Language**:
   - Maximum 5-7 words per sentence
   - Use verbs for actions ("Accept", not "Acceptance")
   - Avoid jargon (no "CRM", "Dashboard", "Analytics")

5. **Feedback**:
   - Immediate visual feedback on tap
   - Loading states for everything
   - Success confirmation (visual + haptic)

6. **Icons**:
   - Universal icons only (home, calendar, plus, checkmark)
   - Always pair icons with text labels
   - No abstract/symbolic icons

### Mobile-First Dashboard Patterns

**Successful Patterns:**

1. **Widget-Based Landing Page**:
   - Priority: Today's schedule at top
   - Secondary: Quick actions (big buttons)
   - Tertiary: Recent activity/stats

2. **Bottom Tab Navigation** (proven best):
   - 4 tabs maximum
   - Icon + label always visible
   - Active state clearly distinguished

3. **Card Pattern**:
   - Each booking = one card
   - White background, subtle shadow
   - Clear hierarchy: Name → Time → Service → Action buttons

4. **FAB (Floating Action Button)**:
   - For primary action (Add Service, Add Booking)
   - Always visible, doesn't scroll away
   - Large (56x56px minimum)

---

## Design Principles

### 1. EXTREME Simplicity
- One primary action per screen
- Maximum 3 choices at any decision point
- No hidden features (everything visible)

### 2. Immediate Value
- Show "what needs my attention now" first
- Minimize steps to complete core tasks
- No empty states without clear call-to-action

### 3. Visual Clarity
- Large text (16px minimum body, 24px+ headings)
- High contrast (background white, text dark)
- Generous spacing (no cramped layouts)

### 4. Forgiving Design
- Undo actions when possible
- Confirmation dialogs for destructive actions
- Auto-save where possible (no "Save" buttons)

### 5. Consistent Patterns
- Same action = same button style everywhere
- Same information = same layout everywhere
- Predictable navigation (never surprising)

### 6. Offline-First Mindset
- Works with poor connectivity
- Show cached data immediately
- Clear indicators when offline

---

## User Flow Overview

### Entry Points

**New Studio Owner (First Login After Registration):**
```
Studio Registration Complete
    ↓
Welcome Screen (one-time)
    ↓
"Add Your First Service" Flow (Companion-Style)
    ↓
Dashboard Landing Page (empty state)
```

**Returning Studio Owner:**
```
App Launch / Login
    ↓
Dashboard Landing Page (shows bookings)
```

### Core User Journeys

**Journey 1: Check Today's Bookings**
```
Dashboard → See today's bookings → Done
(1 screen, 0 taps)
```

**Journey 2: Accept a New Booking**
```
Dashboard → See "New Booking" card → Tap "Accept" → Confirmation toast → Done
(1 screen, 1 tap)
```

**Journey 3: View Week's Schedule**
```
Dashboard → Tap "Calendar" tab → See week view → Tap day → See day's bookings
(2 screens, 2 taps)
```

**Journey 4: Add New Service**
```
Dashboard → Tap "Services" tab → Tap "Add Service" button →
Companion-Style Flow (4-5 steps) → Service added → Services list
(Multiple screens, guided flow)
```

**Journey 5: Edit Existing Service**
```
Services tab → Tap service card → Edit screen → Change details → Save → Services list
(3 screens, 3+ taps)
```

### Decision Points

**Decision: What to show first?**
- ✅ Today's bookings (most urgent, highest value)
- ❌ Empty dashboard with widgets (no immediate value)
- ❌ Welcome message (wastes time)

**Decision: How to handle "no bookings yet"?**
- ✅ Show empty state with helpful message + illustration
- ✅ Provide clear next step ("Share your booking link")
- ❌ Show blank screen (confusing)

**Decision: Accept booking flow - immediate or two-step?**
- ✅ Immediate acceptance with confirmation toast (faster)
- ❌ Confirmation dialog (extra tap, slows down)
- Rationale: Bookings can be cancelled later if needed

---

## Dashboard Landing Page

### Layout Structure

**Mobile (< 640px) - Primary Design:**

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │ ← Status Bar (system)
│ │ 9:41 AM          [WiFi] [Bat]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │ ← Header (fixed)
│ │                                 │ │
│ │  Sawadee, Khun Somchai! 👋     │ │   (Greeting + name)
│ │  วันพฤหัสบดี 30 ตุลาคม 2025      │ │   (Thai date)
│ │                                 │ │
│ │  [🔔 2]                         │ │   (Notification badge)
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │ ← Section: Bookings Need Attention
│ │ 🔔 Bookings Need Confirmation   │ │   (if any pending)
│ │ ────────────────────────────── │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 🆕 NEW BOOKING              │ │ │   ← Badge (pulsing animation)
│ │ │                             │ │ │
│ │ │ 👤 Khun Apinya              │ │ │   ← Customer name (large)
│ │ │ 📱 089-123-4567             │ │ │   ← Phone (clickable)
│ │ │                             │ │ │
│ │ │ 🕐 Today, 2:00 PM           │ │ │   ← Time (large, bold)
│ │ │ 💆 Thai Massage (90 min)    │ │ │   ← Service + duration
│ │ │ 💰 500 THB                  │ │ │   ← Price
│ │ │                             │ │ │
│ │ │ ┌─────────┐  ┌────────────┐ │ │ │
│ │ │ │ ✅ Accept│  │ ❌ Decline │ │ │ │   ← Action buttons
│ │ │ └─────────┘  └────────────┘ │ │ │   (green / red)
│ │ │                             │ │ │
│ │ └─────────────────────────────┘ │ │   ← Card (white bg, shadow)
│ │                                 │ │
│ │ [Show 1 more pending...]        │ │   ← Collapsed if >2
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │ ← Section: Today's Schedule
│ │ 📅 Today's Schedule (3)         │ │   (count badge)
│ │ ────────────────────────────── │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ ✅ CONFIRMED                │ │ │   ← Status badge (green)
│ │ │                             │ │ │
│ │ │ 10:00 AM - 11:30 AM         │ │ │   ← Time range (bold)
│ │ │ 👤 Khun Nattaya             │ │ │   ← Customer name
│ │ │ 💆 Oil Massage (90 min)     │ │ │   ← Service
│ │ │                             │ │ │
│ │ │ [View Details →]            │ │ │   ← Link (subtle)
│ │ │                             │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ ✅ CONFIRMED                │ │ │
│ │ │                             │ │ │
│ │ │ 2:00 PM - 3:30 PM           │ │ │
│ │ │ 👤 Khun Apinya              │ │ │
│ │ │ 💆 Thai Massage (90 min)    │ │ │
│ │ │                             │ │ │
│ │ │ [View Details →]            │ │ │
│ │ │                             │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ [See All Today (3) →]          │ │ │   ← Link to day view
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │ ← Section: Quick Stats (optional)
│ │ 📊 This Week                    │ │
│ │ ────────────────────────────── │ │
│ │                                 │ │
│ │ ┌─────────┐  ┌─────────┐       │ │
│ │ │   12    │  │  8,400  │       │ │   ← Large numbers
│ │ │Bookings │  │   THB   │       │ │   ← Labels below
│ │ └─────────┘  └─────────┘       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
│ [Bottom Navigation - 60px height]  │ ← Fixed bottom nav
│                                     │
└─────────────────────────────────────┘
```

### Empty State (No Bookings Yet)

```
┌─────────────────────────────────────┐
│ Header (same as above)              │
└─────────────────────────────────────┘
│                                     │
│         [Illustration]              │   ← Happy therapist with phone
│          📱 💆 ✨                   │   (colorful, friendly)
│                                     │
│     No bookings yet!                │   ← Heading (24px, bold)
│                                     │
│  Your studio is ready to accept     │   ← Body text (16px, centered)
│  bookings from customers.           │
│                                     │
│  Share your booking link to start!  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📤 Share Booking Link          │ │   ← Primary action button
│ └─────────────────────────────────┘ │   (large, full-width, colorful)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ➕ Add Service                 │ │   ← Secondary action
│ └─────────────────────────────────┘ │   (outline style)
│                                     │
│                                     │
│ [Bottom Navigation]                 │
│                                     │
└─────────────────────────────────────┘
```

### Component Hierarchy

**Information Architecture:**

```
Dashboard (Screen)
├── Header (fixed)
│   ├── Greeting (dynamic based on time of day)
│   ├── Date (Thai Buddhist calendar format)
│   └── Notification badge (if unread notifications)
│
├── Content (scrollable)
│   ├── Pending Bookings Section (if any)
│   │   ├── Section Header ("Bookings Need Confirmation")
│   │   ├── Booking Card (repeated for each pending)
│   │   │   ├── Status Badge ("NEW BOOKING" - pulsing)
│   │   │   ├── Customer Info (name, phone)
│   │   │   ├── Booking Details (time, service, price)
│   │   │   └── Action Buttons (Accept / Decline)
│   │   └── "Show more" link (if >2 pending)
│   │
│   ├── Today's Schedule Section
│   │   ├── Section Header ("Today's Schedule" + count)
│   │   ├── Booking Card (repeated for each confirmed)
│   │   │   ├── Status Badge ("CONFIRMED" - static)
│   │   │   ├── Time Range
│   │   │   ├── Customer Name
│   │   │   ├── Service Name
│   │   │   └── "View Details" link
│   │   └── "See All Today" link
│   │
│   └── Quick Stats Section (optional)
│       ├── Section Header ("This Week")
│       ├── Stat Card (Bookings count)
│       └── Stat Card (Revenue)
│
└── Bottom Navigation (fixed)
    ├── Tab: Dashboard (active)
    ├── Tab: Calendar
    ├── Tab: Services
    └── Tab: More
```

---

## Navigation Structure

### Bottom Tab Navigation (Primary)

**4 Tabs - Icon + Label Always Visible:**

```
┌─────────────────────────────────────┐
│                                     │
│ ┌────────┬────────┬────────┬──────┐│
│ │   🏠   │   📅   │   💆   │  ⋯  ││
│ │ Dashboard Calendar Services More ││
│ └────────┴────────┴────────┴──────┘│
└─────────────────────────────────────┘
```

**Tab 1: Dashboard (Home)**
- Icon: 🏠 (House)
- Label: "Dashboard" (Thai: "หน้าหลัก")
- Default landing screen
- Badge: Shows count of pending bookings

**Tab 2: Calendar**
- Icon: 📅 (Calendar)
- Label: "Calendar" (Thai: "ปฏิทิน")
- Default view: Week view
- Badge: Shows count of today's bookings

**Tab 3: Services**
- Icon: 💆 (Massage/Service)
- Label: "Services" (Thai: "บริการ")
- Lists all studio services
- FAB: "Add Service" button (visible when scrolling)

**Tab 4: More**
- Icon: ⋯ (Three dots - horizontal)
- Label: "More" (Thai: "เพิ่มเติม")
- Secondary features:
  - Studio Profile
  - Operating Hours
  - Settings
  - Help & Support
  - Logout

### Active State Design

**Visual Indicators:**
- Icon color: Primary brand color (e.g., #3B82F6 blue)
- Label color: Same as icon
- Background: Subtle fill (e.g., light blue tint)
- Bottom border: 3px solid color bar (optional)

**Inactive State:**
- Icon color: Gray (#6B7280)
- Label color: Same as icon
- No background fill

### Navigation Rules

**State Persistence:**
- Each tab remembers scroll position
- Calendar remembers selected date
- Returning to tab restores previous state

**No Deep Nesting:**
- Maximum 2 levels from bottom nav
- Always provide clear back button
- Back button labeled with context (e.g., "Back to Services")

**Gesture Support:**
- Swipe right = Go back (iOS pattern)
- Pull down = Refresh current screen
- No hidden gesture-only features

---

## Booking Management

### Booking Card Design (Pending Booking)

**Component Structure:**

```typescript
<Card className="border-2 border-orange-300 bg-orange-50">
  {/* Pulsing status badge */}
  <div className="absolute top-2 right-2">
    <Badge className="animate-pulse bg-orange-500">
      🆕 NEW BOOKING
    </Badge>
  </div>

  {/* Customer info */}
  <CardHeader>
    <div className="flex items-center gap-2">
      <Avatar className="h-12 w-12">
        <span className="text-2xl">👤</span>
      </Avatar>
      <div>
        <h3 className="text-xl font-bold">Khun Apinya</h3>
        <a href="tel:0891234567" className="text-blue-600 text-sm">
          📱 089-123-4567
        </a>
      </div>
    </div>
  </CardHeader>

  {/* Booking details */}
  <CardContent className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-2xl">🕐</span>
      <div>
        <p className="text-lg font-bold">Today, 2:00 PM</p>
        <p className="text-sm text-gray-600">วันนี้ 14:00 น.</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-2xl">💆</span>
      <div>
        <p className="text-base font-semibold">Thai Massage</p>
        <p className="text-sm text-gray-600">90 minutes</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-2xl">💰</span>
      <p className="text-lg font-bold text-green-700">500 THB</p>
    </div>
  </CardContent>

  {/* Action buttons */}
  <CardFooter className="flex gap-3">
    <Button
      className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700"
      onClick={handleAccept}
    >
      ✅ Accept
    </Button>
    <Button
      className="flex-1 h-14 text-lg bg-red-600 hover:bg-red-700"
      onClick={handleDecline}
    >
      ❌ Decline
    </Button>
  </CardFooter>
</Card>
```

### Booking Card Design (Confirmed Booking)

```typescript
<Card className="border border-gray-200 bg-white">
  {/* Status badge */}
  <div className="absolute top-2 right-2">
    <Badge className="bg-green-100 text-green-800 border border-green-300">
      ✅ CONFIRMED
    </Badge>
  </div>

  {/* Booking details (more compact) */}
  <CardContent className="pt-6">
    <div className="space-y-2">
      <p className="text-lg font-bold">10:00 AM - 11:30 AM</p>

      <div className="flex items-center gap-2">
        <span className="text-lg">👤</span>
        <p className="text-base">Khun Nattaya</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg">💆</span>
        <p className="text-sm text-gray-600">Oil Massage (90 min)</p>
      </div>
    </div>

    <Button
      variant="ghost"
      className="w-full mt-3 text-blue-600"
      onClick={handleViewDetails}
    >
      View Details →
    </Button>
  </CardContent>
</Card>
```

### Accept Booking Flow

**User Journey:**

```
Step 1: User sees pending booking card
    ↓
Step 2: User taps "Accept" button
    ↓
Step 3: Button shows loading spinner (1-2 seconds)
    ↓
Step 4: Success feedback:
    - Haptic feedback (vibration)
    - Toast notification: "✅ Booking confirmed!"
    - Card updates to "CONFIRMED" status
    - Card moves to "Today's Schedule" section
    ↓
Step 5: Optional: Auto-send confirmation SMS to customer
```

**Implementation Notes:**
- Optimistic UI update (instant visual feedback)
- Server request happens in background
- If request fails: Revert UI + show error toast
- No confirmation dialog (action is reversible)

### Decline Booking Flow

**User Journey:**

```
Step 1: User sees pending booking card
    ↓
Step 2: User taps "Decline" button
    ↓
Step 3: Confirmation dialog appears:
        "Are you sure you want to decline this booking?"
        [Cancel] [Yes, Decline]
    ↓
Step 4: User confirms
    ↓
Step 5: Success feedback:
    - Toast: "Booking declined"
    - Card fades out and removes from list
    ↓
Step 6: Optional: Auto-send notification to customer
```

**Rationale for Confirmation:**
- Declining is less common than accepting
- Declining has customer service impact
- Prevents accidental taps

### Booking Details Screen (Tap "View Details")

```
┌─────────────────────────────────────┐
│ [← Back]          Booking Details   │ ← Header with back button
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Status Badge: ✅ CONFIRMED          │
│ (or 🔶 RESERVED, ✅ COMPLETED)      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👤 Customer Information             │
│ ─────────────────────────────────── │
│                                     │
│ Name: Khun Nattaya Somchai          │
│ Phone: [📱 089-123-4567] (Call)     │ ← Clickable to call
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📅 Booking Details                  │
│ ─────────────────────────────────── │
│                                     │
│ Date: Thursday, Oct 30, 2025        │
│ Time: 10:00 AM - 11:30 AM           │
│ Duration: 90 minutes                │
│                                     │
│ Service: Oil Massage                │
│ Price: 500 THB                      │
│                                     │
│ Booked on: Oct 28, 2025 3:45 PM    │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 Notes                            │
│ ─────────────────────────────────── │
│                                     │
│ "First-time customer, prefers       │
│  strong pressure"                   │
│                                     │
│ [Add Note] (if empty)               │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Actions                             │
│ ─────────────────────────────────── │
│                                     │
│ [📞 Call Customer]                  │ ← Full-width button
│ [✏️ Edit Booking]                   │
│ [❌ Cancel Booking]                 │ ← Red, destructive
│                                     │
└─────────────────────────────────────┘
```

### Status Badge Colors

**Visual Design:**

```typescript
// Status: Reserved (pending confirmation)
<Badge className="bg-orange-100 text-orange-800 border-2 border-orange-400">
  🔶 RESERVED
</Badge>

// Status: Confirmed
<Badge className="bg-green-100 text-green-800 border-2 border-green-400">
  ✅ CONFIRMED
</Badge>

// Status: Completed (past booking)
<Badge className="bg-gray-100 text-gray-800 border-2 border-gray-400">
  ✅ COMPLETED
</Badge>

// Status: Cancelled
<Badge className="bg-red-100 text-red-800 border-2 border-red-400">
  ❌ CANCELLED
</Badge>

// Status: No-show
<Badge className="bg-yellow-100 text-yellow-800 border-2 border-yellow-400">
  ⚠️ NO-SHOW
</Badge>
```

**Color Rationale:**
- Orange: Needs attention (universal warning color)
- Green: Good/confirmed (universal success color)
- Gray: Neutral/completed (no action needed)
- Red: Problem/cancelled (universal error color)
- Yellow: Caution/warning (universal alert color)

---

## Calendar Views

### Calendar Tab - Default View (Week View)

**Why Week View (not Month)?**
- Easier to see booking details at a glance
- Less cognitive load than month view
- Better for mobile screen size
- Common pattern in scheduling apps

**Layout:**

```
┌─────────────────────────────────────┐
│ [← Back]            Calendar         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ October 2025                        │ ← Month/Year header
│                                     │
│ [←] Week 5 (Oct 27 - Nov 2) [→]   │ ← Week navigation
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Day-by-Day List:                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Mon, Oct 28                     │ │ ← Day header
│ │ ─────────────────────────────── │ │
│ │                                 │ │
│ │ No bookings                     │ │ ← Empty state (gray text)
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Tue, Oct 29                     │ │
│ │ ─────────────────────────────── │ │
│ │                                 │ │
│ │ 10:00 AM ✅ Khun Nattaya        │ │ ← Booking (compact)
│ │ Thai Massage • 90 min           │ │
│ │                                 │ │
│ │ 2:00 PM ✅ Khun Somchai         │ │
│ │ Oil Massage • 60 min            │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Wed, Oct 30 (TODAY) 🔵          │ │ ← Today highlighted
│ │ ─────────────────────────────── │ │
│ │                                 │ │
│ │ 10:00 AM ✅ Khun Apinya         │ │
│ │ Thai Massage • 90 min           │ │
│ │                                 │ │
│ │ 2:00 PM 🔶 Khun Suda (NEW)      │ │ ← Reserved booking
│ │ Foot Massage • 60 min           │ │
│ │                                 │ │
│ │ [+ Add Booking]                 │ │ ← Quick add (optional)
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Thu, Oct 31] [Fri, Nov 1] ...     │ ← Continue for rest of week
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Switch to Month View]              │ ← Toggle option
└─────────────────────────────────────┘
```

### Month View (Alternative)

**Access:** Tap "Switch to Month View" link

**Layout:**

```
┌─────────────────────────────────────┐
│ [← Back to Week]       Calendar     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        [←] October 2025 [→]         │ ← Month navigation
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Su  Mo  Tu  We  Th  Fr  Sa         │
│ ─────────────────────────────────── │
│         1   2   3   4   5          │
│                                     │
│ 6   7   8   9  10  11  12          │
│                                     │
│ 13  14  15  16  17  18  19         │
│                                     │
│ 20  21  22  23  24  25  26         │
│                                     │
│ 27  28● 29● 30● 31   1   2         │ ← Dots = has bookings
│                                     │
└─────────────────────────────────────┘

Key:
● Blue dot = Has confirmed bookings
● Orange dot = Has pending bookings
○ Gray outline = Today

Tap any date to see day view
```

### Day View (Drill-Down)

**Access:** Tap any day in month/week view

**Layout:**

```
┌─────────────────────────────────────┐
│ [← Back]   Wednesday, Oct 30, 2025  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [←] Today [→]                       │ ← Day navigation (swipe)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3 Bookings • 500 THB                │ ← Summary
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 10:00 AM - 11:30 AM             │ │ ← Time (large, bold)
│ │ ─────────────────────────────── │ │
│ │ ✅ CONFIRMED                    │ │ ← Status badge
│ │                                 │ │
│ │ 👤 Khun Nattaya                 │ │
│ │ 💆 Thai Massage (90 min)        │ │
│ │ 💰 500 THB                      │ │
│ │                                 │ │
│ │ [View Details →]                │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 2:00 PM - 3:00 PM               │ │
│ │ ─────────────────────────────── │ │
│ │ 🔶 RESERVED (NEW)               │ │ ← Needs action
│ │                                 │ │
│ │ 👤 Khun Suda                    │ │
│ │ 💆 Foot Massage (60 min)        │ │
│ │ 💰 400 THB                      │ │
│ │                                 │ │
│ │ ┌──────────┐  ┌───────────┐    │ │
│ │ │✅ Accept │  │ ❌ Decline│    │ │ ← Quick actions
│ │ └──────────┘  └───────────┘    │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [No more bookings today]            │ ← End marker
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [➕ Add Booking for This Day]       │ ← Action button
└─────────────────────────────────────┘
```

### Calendar Interaction Patterns

**Swipe Gestures:**
- Swipe left: Next day/week/month
- Swipe right: Previous day/week/month
- Visual feedback: Content slides in from edge

**Tap Actions:**
- Tap date: Open day view
- Tap booking: Open booking details
- Long press (optional): Quick actions menu

**Loading States:**
- Skeleton cards while fetching bookings
- Smooth transitions (no jarring content shifts)

---

## Service Management

### Services Tab - List View

**Layout:**

```
┌─────────────────────────────────────┐
│            Services                 │ ← Header
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Your Services (4)                   │ ← Count
│ ─────────────────────────────────── │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💆 Thai Traditional Massage     │ │ ← Service icon + name
│ │                                 │ │
│ │ ⏱️  90 minutes                  │ │ ← Duration
│ │ 💰 500 THB                      │ │ ← Price (large)
│ │                                 │ │
│ │ [✏️ Edit]    [🗑️ Delete]       │ │ ← Action buttons
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💆 Oil Massage                  │ │
│ │                                 │ │
│ │ ⏱️  90 minutes                  │ │
│ │ 💰 500 THB                      │ │
│ │                                 │ │
│ │ [✏️ Edit]    [🗑️ Delete]       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🦶 Foot Massage                 │ │
│ │                                 │ │
│ │ ⏱️  60 minutes                  │ │
│ │ 💰 400 THB                      │ │
│ │                                 │ │
│ │ [✏️ Edit]    [🗑️ Delete]       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Continue for all services...]      │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    [➕ Add New Service]              │ ← FAB (Floating Action Button)
└─────────────────────────────────────┘ ← Sticky at bottom
```

### Empty State (No Services Yet)

**Shown after first login / registration:**

```
┌─────────────────────────────────────┐
│            Services                 │
└─────────────────────────────────────┘

│                                     │
│         [Illustration]              │ ← Massage icon/graphic
│          💆✨🌸                      │
│                                     │
│     Add your first service!         │ ← Heading (24px)
│                                     │
│  Let customers know what services   │
│  you offer and how much they cost.  │
│                                     │
│  Examples:                          │
│  • Thai Traditional Massage         │
│  • Oil Massage                      │
│  • Foot Massage                     │
│  • Aromatherapy                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ➕ Add Your First Service      │ │ ← Large CTA button
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Add Service Flow (Companion-Style)

**Philosophy:**
- One question per screen
- Large input fields
- Clear progress indicator
- Can go back to edit previous answers
- Auto-save (no manual save)

**Flow Structure:**

```
Step 1: Service Name
    ↓
Step 2: Duration
    ↓
Step 3: Price
    ↓
Step 4: Review & Confirm
    ↓
Success Screen
```

---

#### Step 1: Service Name

```
┌─────────────────────────────────────┐
│ [← Back]    Add Service      [1/3]  │ ← Progress indicator
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│         💆                          │ ← Large icon
│                                     │
│   What service do you offer?        │ ← Question (24px, bold)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │ [Service name]                  │ │ ← Large input (56px height)
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Examples:                           │ ← Helpful examples
│ • Thai Traditional Massage          │
│ • Oil Massage                       │
│ • Foot Massage                      │
│ • Aromatherapy                      │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Next →                  │ │ ← Large button (56px)
│ └─────────────────────────────────┘ │ ← Disabled until input valid
│                                     │
└─────────────────────────────────────┘
```

**Validation:**
- Required field
- Minimum 3 characters
- Maximum 100 characters
- No special characters except spaces, hyphens, &

---

#### Step 2: Duration

```
┌─────────────────────────────────────┐
│ [← Back]    Add Service      [2/3]  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│         ⏱️                           │
│                                     │
│   How long is this service?         │ ← Question
│                                     │
│   Thai Traditional Massage          │ ← Service name reminder
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Choose duration:                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       30 minutes                │ │ ← Option button
│ └─────────────────────────────────┘ │ (large, full-width)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       60 minutes                │ │ ← Selected = blue bg
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       90 minutes                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       120 minutes (2 hours)     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ✏️ Custom duration...          │ │ ← Opens number input
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          Next →                     │ ← Enabled once selected
└─────────────────────────────────────┘
```

**Validation:**
- Required selection
- Custom: 15-480 minutes (8 hours max)
- Increment: 15-minute intervals

---

#### Step 3: Price

```
┌─────────────────────────────────────┐
│ [← Back]    Add Service      [3/3]  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│         💰                          │
│                                     │
│   How much do you charge?           │ ← Question
│                                     │
│   Thai Traditional Massage          │ ← Service name reminder
│   90 minutes                        │ ← Duration reminder
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │          [500]                  │ │ ← Large number input
│ │          THB                    │ │ (centered, 48px font)
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Quick amounts:                      │ ← Preset buttons
│                                     │
│ [300] [400] [500] [600] [800]      │ ← Tap to select
│                                     │
│                                     │
│ ℹ️ Tip: Check your competitors'     │ ← Helpful tip
│    pricing in your area            │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          Next →                     │
└─────────────────────────────────────┘
```

**Validation:**
- Required field
- Minimum: 50 THB
- Maximum: 10,000 THB
- Integer only (no decimals)

---

#### Step 4: Review & Confirm

```
┌─────────────────────────────────────┐
│ [← Back]    Review Service          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│         ✅                          │
│                                     │
│   Does this look correct?           │ ← Question
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  💆 Thai Traditional Massage    │ │ ← Preview card
│ │                                 │ │
│ │  ⏱️  90 minutes                 │ │ (same style as list view)
│ │  💰 500 THB                     │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Want to change something?           │
│ [← Go Back]                         │ ← Link to edit
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   ✅ Add This Service           │ │ ← Primary action
│ └─────────────────────────────────┘ │ (green, large)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   ✖️  Cancel                    │ │ ← Secondary (outline)
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

#### Step 5: Success Screen

```
┌─────────────────────────────────────┐
│            Success!                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│                                     │
│         ✅                          │ ← Large success icon
│          🎉                         │ (animated)
│                                     │
│   Service added successfully!       │ ← Success message (24px)
│                                     │
│   Thai Traditional Massage          │ ← Service name
│   is now available for booking      │
│                                     │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ What's next?                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ➕ Add Another Service         │ │ ← Primary action
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📋 View All Services           │ │ ← Secondary action
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🏠 Go to Dashboard             │ │ ← Tertiary action
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

Auto-redirect to Services list after 5 seconds
```

---

### Edit Service Flow

**Similar to Add Service, but:**
- Pre-populated fields
- Title: "Edit Service" instead of "Add Service"
- Final button: "Save Changes" instead of "Add This Service"
- Cancel button returns to Services list without saving

**Layout:**

```
┌─────────────────────────────────────┐
│ [← Cancel]   Edit Service           │
└─────────────────────────────────────┘

[Same 3-step flow as Add Service]

Final step:

┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │   ✅ Save Changes               │ │ ← Primary action
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   ✖️  Cancel                    │ │ ← Discard changes
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

### Delete Service Confirmation

```
┌─────────────────────────────────────┐
│                                     │
│         ⚠️                          │ ← Warning icon
│                                     │
│   Delete this service?              │ ← Question (24px)
│                                     │
│   Thai Traditional Massage          │ ← Service name
│   90 minutes • 500 THB              │
│                                     │
│   This action cannot be undone.     │ ← Warning text (red)
│                                     │
│   ℹ️ Note: Active bookings for this │
│   service will not be affected.     │ ← Reassurance
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │   🗑️ Yes, Delete Service       │ │ ← Destructive (red)
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   ✖️  Cancel                    │ │ ← Safe option (gray)
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## Component Specifications

### 1. Bottom Navigation Component

```typescript
// components/studio/BottomNavigation.tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Calendar, Layers, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
}

export function BottomNavigation({
  pendingBookings = 0,
  todayBookings = 0,
}: {
  pendingBookings?: number
  todayBookings?: number
}) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      href: "/studio/dashboard",
      icon: Home,
      label: "Dashboard",
      badge: pendingBookings,
    },
    {
      href: "/studio/calendar",
      icon: Calendar,
      label: "Calendar",
      badge: todayBookings,
    },
    {
      href: "/studio/services",
      icon: Layers,
      label: "Services",
    },
    {
      href: "/studio/more",
      icon: MoreHorizontal,
      label: "More",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full gap-1 relative
                transition-colors duration-200
                ${isActive
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge ? (
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500"
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs font-medium">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

---

### 2. Booking Card Component (Pending)

```typescript
// components/studio/BookingCardPending.tsx
"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Check, X, Phone, Loader2 } from "lucide-react"
import { formatTime, formatDate } from "@/lib/utils"
import type { Booking } from "@prisma/client"

export function BookingCardPending({
  booking,
  onAccept,
  onDecline,
}: {
  booking: Booking
  onAccept: (bookingId: string) => Promise<void>
  onDecline: (bookingId: string) => Promise<void>
}) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await onAccept(booking.id)
      // Success handled by parent component
    } catch (error) {
      console.error("Failed to accept booking:", error)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    // Show confirmation dialog first
    const confirmed = window.confirm(
      "Are you sure you want to decline this booking?"
    )
    if (!confirmed) return

    setIsDeclining(true)
    try {
      await onDecline(booking.id)
    } catch (error) {
      console.error("Failed to decline booking:", error)
    } finally {
      setIsDeclining(false)
    }
  }

  return (
    <Card className="border-2 border-orange-300 bg-orange-50 relative">
      {/* Pulsing badge */}
      <div className="absolute top-2 right-2">
        <Badge className="animate-pulse bg-orange-500 text-white font-bold">
          🆕 NEW BOOKING
        </Badge>
      </div>

      {/* Customer info */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-gray-200">
            <span className="text-2xl">👤</span>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {booking.customerName}
            </h3>
            <a
              href={`tel:${booking.customerPhone}`}
              className="text-blue-600 text-sm font-medium flex items-center gap-1"
            >
              <Phone className="w-4 h-4" />
              {booking.customerPhone}
            </a>
          </div>
        </div>
      </CardHeader>

      {/* Booking details */}
      <CardContent className="space-y-3 pb-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🕐</span>
          <div>
            <p className="text-lg font-bold">
              {formatDate(booking.date)}, {formatTime(booking.startTime)}
            </p>
            <p className="text-sm text-gray-600">
              {/* Thai date format */}
              {formatDate(booking.date, "th-TH")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl">💆</span>
          <div>
            <p className="text-base font-semibold">
              {booking.service.name}
            </p>
            <p className="text-sm text-gray-600">
              {booking.service.duration} minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <p className="text-lg font-bold text-green-700">
            {booking.service.price} THB
          </p>
        </div>
      </CardContent>

      {/* Action buttons */}
      <CardFooter className="flex gap-3 pt-0">
        <Button
          onClick={handleAccept}
          disabled={isAccepting || isDeclining}
          className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700 text-white font-bold"
        >
          {isAccepting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Check className="mr-2 h-5 w-5" />
          )}
          Accept
        </Button>
        <Button
          onClick={handleDecline}
          disabled={isAccepting || isDeclining}
          className="flex-1 h-14 text-lg bg-red-600 hover:bg-red-700 text-white font-bold"
        >
          {isDeclining ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <X className="mr-2 h-5 w-5" />
          )}
          Decline
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

### 3. Booking Card Component (Confirmed)

```typescript
// components/studio/BookingCardConfirmed.tsx
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import type { Booking } from "@prisma/client"

export function BookingCardConfirmed({
  booking,
}: {
  booking: Booking
}) {
  return (
    <Card className="border border-gray-200 bg-white relative">
      {/* Status badge */}
      <div className="absolute top-2 right-2">
        <Badge className="bg-green-100 text-green-800 border border-green-300 font-bold">
          ✅ CONFIRMED
        </Badge>
      </div>

      <CardContent className="pt-6 space-y-2">
        <p className="text-lg font-bold">
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <p className="text-base">{booking.customerName}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg">💆</span>
          <p className="text-sm text-gray-600">
            {booking.service.name} ({booking.service.duration} min)
          </p>
        </div>

        <Button
          asChild
          variant="ghost"
          className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Link href={`/studio/bookings/${booking.id}`}>
            View Details →
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

### 4. Service Card Component

```typescript
// components/studio/ServiceCard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2 } from "lucide-react"
import type { Service } from "@prisma/client"

export function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => Promise<void>
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${service.name}"?\n\nThis action cannot be undone.\n\nNote: Active bookings for this service will not be affected.`
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDelete(service.id)
    } catch (error) {
      console.error("Failed to delete service:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-2xl">💆</span>
            <h3 className="text-lg font-bold flex-1">
              {service.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <p className="text-base text-gray-600">
              {service.duration} minutes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <p className="text-lg font-bold text-green-700">
              {service.price} THB
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => onEdit(service)}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            className="flex-1 h-12 text-base text-red-600 border-red-200 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### 5. Companion-Style Step Component

```typescript
// components/studio/CompanionStep.tsx
"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function CompanionStep({
  stepNumber,
  totalSteps,
  icon,
  question,
  children,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = "Next",
}: {
  stepNumber: number
  totalSteps: number
  icon: ReactNode
  question: string
  children: ReactNode
  onNext?: () => void
  onBack?: () => void
  nextDisabled?: boolean
  nextLabel?: string
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {onBack ? (
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-blue-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}
        <span className="text-sm font-medium text-gray-600">
          {stepNumber}/{totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-blue-600 h-1 transition-all duration-300"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-8">
        {/* Icon */}
        <div className="text-6xl text-center mb-6">
          {icon}
        </div>

        {/* Question */}
        <h1 className="text-2xl font-bold text-center mb-8">
          {question}
        </h1>

        {/* Input/Content */}
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </div>

      {/* Next button (fixed at bottom) */}
      {onNext && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className="w-full h-14 text-lg font-bold"
          >
            {nextLabel}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
```

---

### 6. Empty State Component

```typescript
// components/studio/EmptyState.tsx
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">
        {icon}
      </div>

      <h2 className="text-2xl font-bold mb-3">
        {title}
      </h2>

      <p className="text-base text-gray-600 mb-8 max-w-md">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="w-full max-w-xs h-14 text-lg font-bold mb-3"
        >
          {actionLabel}
        </Button>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Button
          onClick={onSecondaryAction}
          variant="outline"
          className="w-full max-w-xs h-14 text-lg"
        >
          {secondaryActionLabel}
        </Button>
      )}
    </div>
  )
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

**Semantic HTML:**
- ✅ Use `<nav>` for bottom navigation
- ✅ Use `<button>` for all actions
- ✅ Use `<a>` for navigation links
- ✅ Use proper heading hierarchy (h1 → h2 → h3)

**ARIA Labels:**
- ✅ Bottom navigation: `aria-label="Main navigation"`
- ✅ Active tab: `aria-current="page"`
- ✅ Badge counts: `aria-label="3 pending bookings"`
- ✅ Icon-only buttons: `aria-label` attribute
- ✅ Loading states: `aria-live="polite"` announcements

**Keyboard Navigation:**
- ✅ All interactive elements accessible via Tab
- ✅ Bottom nav: Arrow keys navigate between tabs
- ✅ Enter/Space activates buttons
- ✅ Escape closes dialogs
- ✅ Focus visible on all elements

**Touch Targets:**
- ✅ Minimum 44x44px (iOS standard)
- ✅ Spacing between targets: 8px minimum
- ✅ Bottom nav tabs: 60px height
- ✅ Action buttons: 56px height

**Color Contrast:**
- ✅ Body text: 16px, 7:1 contrast ratio
- ✅ Heading text: 24px+, 4.5:1 ratio
- ✅ Button text: Bold, high contrast
- ✅ Never rely on color alone (use icon + text)

**Screen Reader Support:**
- ✅ Form labels properly associated
- ✅ Error messages announced
- ✅ Success toasts announced
- ✅ Loading states announced

**Localization (Thai Language):**
- ✅ All UI text in Thai
- ✅ Thai Buddhist calendar format
- ✅ Thai phone number format (XXX-XXX-XXXX)
- ✅ Thai currency (THB / บาท)
- ✅ Right-to-left support (not needed for Thai)

---

## Implementation Notes

### For feature-builder Agent

**Tech Stack:**
- Next.js 14+ App Router
- Server Components for initial page loads
- Client Components for interactivity
- Server Actions for mutations
- Prisma ORM for database

**Project Structure:**
```
app/
  studio/
    dashboard/
      page.tsx (Server Component)
      _components/
        DashboardClient.tsx
        BookingCardPending.tsx
        BookingCardConfirmed.tsx
    calendar/
      page.tsx
      _components/
        WeekView.tsx
        MonthView.tsx
        DayView.tsx
    services/
      page.tsx
      add/
        page.tsx (Companion flow)
      [id]/
        edit/
          page.tsx
    layout.tsx (includes BottomNavigation)

components/
  studio/
    BottomNavigation.tsx
    EmptyState.tsx
    CompanionStep.tsx

lib/
  actions/
    bookings.ts (Server Actions)
    services.ts
  utils/
    formatters.ts (date, time, currency)
```

**Database Schema:**
```prisma
model Booking {
  id            String   @id @default(cuid())
  studioId      String
  studio        Studio   @relation(fields: [studioId], references: [id])

  serviceId     String
  service       Service  @relation(fields: [serviceId], references: [id])

  customerName  String
  customerPhone String

  date          DateTime
  startTime     DateTime
  endTime       DateTime

  status        BookingStatus @default(RESERVED)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([studioId, date])
  @@index([studioId, status])
}

enum BookingStatus {
  RESERVED    // Needs confirmation
  CONFIRMED   // Accepted by studio
  COMPLETED   // Service provided
  CANCELLED   // Cancelled by studio/customer
  NO_SHOW     // Customer didn't show up
}

model Service {
  id          String   @id @default(cuid())
  studioId    String
  studio      Studio   @relation(fields: [studioId], references: [id])

  name        String
  duration    Int      // minutes
  price       Int      // THB (integer, no decimals)

  isActive    Boolean  @default(true)

  bookings    Booking[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([studioId, isActive])
}
```

**Server Actions:**
```typescript
// lib/actions/bookings.ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentStudioId } from "@/lib/auth"

export async function acceptBooking(bookingId: string) {
  const studioId = await getCurrentStudioId()

  // Update booking status
  await db.booking.update({
    where: {
      id: bookingId,
      studioId, // Security: ensure studio owns booking
    },
    data: {
      status: "CONFIRMED",
      updatedAt: new Date(),
    },
  })

  // Revalidate pages
  revalidatePath("/studio/dashboard")
  revalidatePath("/studio/calendar")

  // TODO: Send confirmation SMS to customer

  return { success: true }
}

export async function declineBooking(bookingId: string) {
  const studioId = await getCurrentStudioId()

  await db.booking.update({
    where: {
      id: bookingId,
      studioId,
    },
    data: {
      status: "CANCELLED",
      updatedAt: new Date(),
    },
  })

  revalidatePath("/studio/dashboard")
  revalidatePath("/studio/calendar")

  // TODO: Send notification to customer

  return { success: true }
}
```

**Performance Optimizations:**
- Use Server Components for initial data (no client JS)
- Fetch bookings on server (fast, no loading spinners)
- Optimistic UI updates for accept/decline
- Lazy load calendar views (only fetch when navigating)
- Cache service list (rarely changes)

**Mobile-First CSS:**
```css
/* Use Tailwind utilities primarily, but custom CSS for: */

/* Safe area insets (iOS notch/home indicator) */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* Touch target minimum */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Prevent text selection on buttons */
button {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Hide scrollbar but keep functionality */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

---

### For performance-optimizer Agent

**Critical Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Optimization Strategies:**

1. **Server Components First:**
   - Dashboard page: Server Component
   - Fetch bookings on server
   - No client JS for static content

2. **Code Splitting:**
   - Lazy load calendar views
   - Lazy load booking details modal
   - Split service management flow

3. **Image Optimization:**
   - Use emojis instead of icon images (no network requests)
   - If user avatars added: Next.js Image component
   - Lazy load images below fold

4. **Data Fetching:**
   - Parallel fetch bookings + services
   - Cache service list (stale-while-revalidate)
   - Incremental Static Regeneration for dashboard

5. **Bundle Size:**
   - Use lucide-react (tree-shakeable)
   - Avoid moment.js (use date-fns or native Intl)
   - Remove unused Tailwind classes (purge config)

---

### For security-auditor Agent

**Security Checklist:**

1. **Authentication:**
   - ✅ Studio owner must be authenticated
   - ✅ Session validated on every request
   - ✅ JWT tokens stored in httpOnly cookies

2. **Authorization:**
   - ✅ Verify studioId matches logged-in user
   - ✅ All booking actions check studio ownership
   - ✅ Service CRUD operations scoped to studio

3. **Input Validation:**
   - ✅ Zod schemas for all form inputs
   - ✅ Server-side validation (never trust client)
   - ✅ Sanitize user input (XSS prevention)

4. **CSRF Protection:**
   - ✅ Server Actions have built-in CSRF protection
   - ✅ SameSite=Lax cookies

5. **Rate Limiting:**
   - ✅ Limit booking accept/decline actions (prevent abuse)
   - ✅ Limit service creation (max 20 services per studio)

6. **Data Privacy:**
   - ✅ Customer phone numbers: masked in logs
   - ✅ PII not exposed in URLs
   - ✅ HTTPS only (no HTTP)

**Zod Schemas:**
```typescript
// lib/validations/service.ts
import { z } from "zod"

export const serviceSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Invalid characters in name"),

  duration: z.number()
    .int("Duration must be a whole number")
    .min(15, "Minimum duration is 15 minutes")
    .max(480, "Maximum duration is 8 hours")
    .multipleOf(15, "Duration must be in 15-minute intervals"),

  price: z.number()
    .int("Price must be a whole number")
    .min(50, "Minimum price is 50 THB")
    .max(10000, "Maximum price is 10,000 THB"),
})
```

---

## Design Principles Summary

### 1. EXTREME Simplicity
- One primary action per screen
- Large touch targets (44x44px minimum)
- Maximum 3 choices at any point
- No hidden features

### 2. Visual Clarity
- Large text (16px body, 24px headings)
- High contrast (WCAG AAA where possible)
- Generous spacing
- Icons + text (never icons alone)

### 3. Forgiving Design
- Undo actions when possible
- Clear confirmation for destructive actions
- Auto-save (no manual save buttons)
- Helpful error messages

### 4. Mobile-First
- Bottom navigation (thumb-friendly)
- Full-width buttons on mobile
- Swipe gestures for navigation
- Offline-first architecture

### 5. Consistent Patterns
- Same action = same button style
- Same data = same card layout
- Predictable navigation
- Universal color meanings (green=good, red=bad)

### 6. Immediate Feedback
- Haptic feedback on actions
- Loading states everywhere
- Success/error toasts
- Optimistic UI updates

---

## Next Steps

1. **Prototype Testing:**
   - Test with 5 Thai studio owners
   - Observe task completion (accept booking, add service)
   - Note confusion points
   - Iterate based on feedback

2. **Localization:**
   - Translate all UI text to Thai
   - Validate Thai date/time formats
   - Test with Thai phone numbers
   - Cultural appropriateness review

3. **Accessibility Audit:**
   - Screen reader testing (iOS VoiceOver, Android TalkBack)
   - Keyboard navigation testing
   - Color contrast validation
   - Touch target size verification

4. **Performance Testing:**
   - Test on low-end Android devices
   - Test with poor network (3G simulation)
   - Measure Core Web Vitals
   - Optimize bottlenecks

5. **Implementation Phases:**
   - **Phase 1**: Dashboard + Booking Management
   - **Phase 2**: Calendar Views
   - **Phase 3**: Service Management (Companion-Style)
   - **Phase 4**: Polish + Optimization

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Author**: UX Designer Agent
**For Implementation By**: feature-builder, performance-optimizer, security-auditor
