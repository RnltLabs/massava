# Studio Owner Navigation Improvements

## Overview
Added Calendar and Services quick links to both desktop and mobile navigation for studio owners.

---

## Desktop Navigation (Header Dropdown)

**Location**: Top-right user dropdown menu

**Before**:
```
┌─────────────────────┐
│ 👤 Studio Name   ▼  │
├─────────────────────┤
│ 📊 Dashboard        │
│ 🚪 Logout          │
└─────────────────────┘
```

**After**:
```
┌─────────────────────┐
│ 👤 Studio Name   ▼  │
├─────────────────────┤
│ 📊 Dashboard        │
│ 📅 Kalender         │ ← NEW
│ 💼 Leistungen       │ ← NEW
│ 🚪 Logout          │
└─────────────────────┘
```

**Conditions**:
- Links only visible if user has at least one studio (`studios.length > 0`)
- Hidden on mobile (mobile uses hamburger menu instead)

---

## Mobile Navigation (Hamburger Menu)

**Location**: Mobile hamburger menu (top-right)

**Before**:
```
┌─────────────────────┐
│ 🌍 Language         │
├─────────────────────┤
│ Welcome Back!       │
├─────────────────────┤
│ 👤 My Profile       │
│ 📅 My Bookings      │
├─────────────────────┤
│ ❓ Help & Support   │
│ 🚪 Sign Out        │
└─────────────────────┘
```

**After**:
```
┌─────────────────────┐
│ 🌍 Language         │
├─────────────────────┤
│ Welcome Back!       │
├─────────────────────┤
│ 👤 My Profile       │
│ 📅 Kalender         │ ← NEW (studio owners only)
│ 💼 Leistungen       │ ← NEW (studio owners only)
│ 📅 My Bookings      │
├─────────────────────┤
│ ❓ Help & Support   │
│ 🚪 Sign Out        │
└─────────────────────┘
```

**Conditions**:
- Calendar and Services links only visible if `hasStudio={true}`
- Positioned between "My Profile" and "My Bookings"

---

## Bottom Tab Navigation (Mobile Only)

**Location**: Fixed at bottom of screen on mobile devices

**Layout**:
```
┌────────────────────────────────────┐
│  📊        📅        💼        ⋯   │
│ Dashboard  Kalender  Services  More│
│  (badge)   (badge)   (count)       │
└────────────────────────────────────┘
```

**Features**:
- Always visible on mobile (`fixed bottom-0`)
- Hidden on desktop (`md:hidden`)
- Shows badge counts for pending bookings, today's schedule, and service count
- High z-index (`z-50`) ensures it stays on top
- Backdrop blur for modern appearance

**Pages with Bottom Nav**:
1. `/[locale]/dashboard/owner` - Dashboard (main page)
2. `/[locale]/dashboard/owner/calendar` - Calendar view
3. `/[locale]/dashboard/owner/services` - Services management
4. `/[locale]/dashboard/owner/more` - More options

---

## Navigation Paths

All navigation links use the locale-aware routing:

- **Dashboard**: `/{locale}/dashboard/owner`
- **Calendar**: `/{locale}/dashboard/owner/calendar`
- **Services**: `/{locale}/dashboard/owner/services`
- **More**: `/{locale}/dashboard/owner/more`

Where `{locale}` is dynamically set (e.g., `de`, `en`, `th`)

---

## User Experience Improvements

### Desktop Users
- Quick access to Calendar and Services from any page
- No need to visit Dashboard first
- One-click navigation to key features

### Mobile Users
- **Three ways to access Calendar/Services**:
  1. Bottom tab navigation (persistent)
  2. Hamburger menu (top navigation)
  3. Dashboard page (when viewing main dashboard)

### Responsive Design
- Desktop: Header dropdown
- Mobile: Hamburger menu + Bottom tabs
- Seamless transition between breakpoints
- Mobile-first approach with bottom navigation for thumb-friendly access

---

## Technical Implementation

### Conditional Rendering
Both Header and MobileNav check if user has a studio before showing links:

```typescript
// Header.tsx
{studios.length > 0 && (
  <>
    <Link href={`/${locale}/dashboard/owner/calendar`}>...</Link>
    <Link href={`/${locale}/dashboard/owner/services`}>...</Link>
  </>
)}

// MobileNav.tsx
{hasStudio && (
  <>
    <Link href={`/${locale}/dashboard/owner/calendar`}>...</Link>
    <Link href={`/${locale}/dashboard/owner/services`}>...</Link>
  </>
)}
```

### Icons Used
- Dashboard: `LayoutDashboard`
- Calendar: `Calendar`
- Services: `Briefcase` (German: "Leistungen")
- More: `MoreHorizontal`

---

**Result**: Studio owners now have quick, easy access to their Calendar and Services from anywhere in the app, on both desktop and mobile devices.
