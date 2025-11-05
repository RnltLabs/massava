# Opening Hours Calendar - Visual Guide

## Overview

This guide shows how the calendar displays times outside business hours after the opening hours integration.

## Visual Comparison

### Before Integration

**Calendar without opening hours integration:**
```
┌────────────────────────────────────┐
│ 08:00                              │ ← Empty slot (but studio might be closed)
├────────────────────────────────────┤
│ 09:00                              │ ← Empty slot
├────────────────────────────────────┤
│ 10:00  ┌──────────────────────┐   │
│        │ Thai Massage         │   │ ← Booking
│ 11:00  │ Customer: Max M.     │   │
│        └──────────────────────┘   │
├────────────────────────────────────┤
│ 12:00                              │ ← Empty slot
├────────────────────────────────────┤
│ 13:00                              │ ← Empty slot
├────────────────────────────────────┤
│ 14:00                              │ ← Empty slot
├────────────────────────────────────┤
│ 15:00                              │ ← Empty slot
├────────────────────────────────────┤
│ 16:00                              │ ← Empty slot
├────────────────────────────────────┤
│ 17:00                              │ ← Empty slot
├────────────────────────────────────┤
│ 18:00                              │ ← Empty slot (but studio might be closed)
├────────────────────────────────────┤
│ 19:00                              │ ← Empty slot (but studio might be closed)
├────────────────────────────────────┤
│ 20:00                              │ ← Empty slot (but studio might be closed)
└────────────────────────────────────┘
```

**Problem**: Users can't tell which hours are actually available vs. closed.

---

### After Integration

**Calendar with opening hours integration (09:00-18:00):**
```
┌────────────────────────────────────┐
│ 08:00  ╔═══════════════════════╗  │
│        ║ 🕒 Geschlossen        ║  │ ← Virtual block (dashed border)
│ 09:00  ╚═══════════════════════╝  │ ← Opening time
├────────────────────────────────────┤
│ 09:00                              │ ← Available slot
├────────────────────────────────────┤
│ 10:00  ┌──────────────────────┐   │
│        │ Thai Massage         │   │ ← Booking (solid border)
│ 11:00  │ Customer: Max M.     │   │
│        └──────────────────────┘   │
├────────────────────────────────────┤
│ 12:00  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│        │ 🚫 Blockiert         │   │ ← User-created block
│ 13:00  │ Mittagspause         │   │   (can be deleted)
│        └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
├────────────────────────────────────┤
│ 14:00                              │ ← Available slot
├────────────────────────────────────┤
│ 15:00                              │ ← Available slot
├────────────────────────────────────┤
│ 16:00                              │ ← Available slot
├────────────────────────────────────┤
│ 17:00                              │ ← Available slot
├────────────────────────────────────┤
│ 18:00  ╔═══════════════════════╗  │ ← Closing time
│        ║ 🕒 Geschlossen        ║  │ ← Virtual block (dashed border)
│ 19:00  ║                       ║  │
│        ╚═══════════════════════╝  │
├────────────────────────────────────┤
│ 20:00                              │
└────────────────────────────────────┘
```

**Improvement**: Clear visual distinction between:
- ✅ Available hours (white background)
- 🕒 Closed hours (dashed gray blocks)
- 🚫 User blocks (solid gray blocks with custom reason)
- 📅 Bookings (colored blocks)

---

## Block Types

### 1. Virtual Block (Closed Hours)

**Appearance**:
```
╔═══════════════════════════╗
║ 🕒 Geschlossen            ║  ← Dashed border (border-2 border-dashed)
║ 08:00 - 09:00             ║  ← Light gray background (bg-gray-100/50)
╚═══════════════════════════╝
```

**Properties**:
- Icon: 🕒 (clock)
- Label: "Geschlossen"
- Border: Dashed (2px)
- Background: Light gray with transparency
- Interaction: Non-clickable
- Tooltip: "Außerhalb der Öffnungszeiten"
- Pattern: Subtle diagonal stripes

**When shown**:
- Before opening time (e.g., 00:00 - 09:00)
- After closing time (e.g., 18:00 - 23:59)
- Full day when studio is closed (e.g., Sunday)

---

### 2. User-Created Block

**Appearance**:
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ 🚫 Blockiert            │  ← Solid border (border)
│ Mittagspause            │  ← Gray background (bg-gray-100)
│ 12:00 - 13:00           │  ← Custom reason shown
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Properties**:
- Icon: 🚫 (stop sign)
- Label: "Blockiert"
- Border: Solid (1px)
- Background: Gray
- Interaction: Clickable (opens delete dialog)
- Custom reason: Shown if provided
- Pattern: Diagonal stripes

**When shown**:
- Created by studio owner via "Block Time" button
- Examples: lunch breaks, personal appointments, maintenance

---

### 3. Booking Block

**Appearance**:
```
┌──────────────────────────┐
│ Thai Massage             │  ← Service name
│ Customer: Max M.         │  ← Customer name
│ 10:00 - 11:00            │  ← Time range
└──────────────────────────┘
```

**Properties**:
- Icon: Service emoji or default
- Border: Solid, colored
- Background: Colored (status-based)
- Interaction: Clickable (opens booking details)
- Shows: Service, customer, time

---

## Week View

**Example: Monday 09:00-18:00, Wednesday Closed**

```
┌──────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Time │  Mon   │  Tue   │  Wed   │  Thu   │  Fri   │  Sat   │
├──────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ 08:00│ ╔════╗ │ ╔════╗ │ ╔════╗ │ ╔════╗ │ ╔════╗ │ ╔════╗ │
│      │ ║🕒  ║ │ ║🕒  ║ │ ║🕒  ║ │ ║🕒  ║ │ ║🕒  ║ │ ║🕒  ║ │
│ 09:00│ ╚════╝ │ ╚════╝ │ ║    ║ │ ╚════╝ │ ╚════╝ │ ╚════╝ │
├──────┼────────┼────────┤ ║    ║ ├────────┼────────┼────────┤
│ 10:00│        │ ┌────┐ │ ║Full║ │ ┌────┐ │        │        │
│      │        │ │Book│ │ ║Day ║ │ │Book│ │        │        │
│ 11:00│        │ └────┘ │ ║    ║ │ └────┘ │        │        │
├──────┼────────┼────────┤ ║    ║ ├────────┼────────┼────────┤
│ 12:00│        │        │ ║🕒  ║ │        │        │        │
│      │        │        │ ║    ║ │        │        │        │
│ 13:00│        │        │ ║    ║ │        │        │        │
├──────┼────────┼────────┤ ║    ║ ├────────┼────────┼────────┤
│ 14:00│        │        │ ║    ║ │        │        │        │
│      │        │        │ ║    ║ │        │        │        │
│ 15:00│        │        │ ║    ║ │        │        │        │
├──────┼────────┼────────┤ ║    ║ ├────────┼────────┼────────┤
│ 16:00│        │        │ ║    ║ │        │        │        │
│      │        │        │ ║    ║ │        │        │        │
│ 17:00│        │        │ ║    ║ │        │        │        │
├──────┼────────┼────────┤ ║    ║ ├────────┼────────┼────────┤
│ 18:00│ ╔════╗ │ ╔════╗ │ ║    ║ │ ╔════╗ │ ╔════╗ │ ╔════╗ │
│      │ ║🕒  ║ │ ║🕒  ║ │ ╚════╝ │ ║🕒  ║ │ ║🕒  ║ │ ║🕒  ║ │
│ 19:00│ ║    ║ │ ║    ║ │        │ ║    ║ │ ║    ║ │ ║    ║ │
│      │ ╚════╝ │ ╚════╝ │        │ ╚════╝ │ ╚════╝ │ ╚════╝ │
└──────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

**Notes**:
- Wednesday: Full-day block (00:00-23:59) with `isAllDay: true`
- Other days: Two blocks per day (before open, after close)
- Week view generates blocks for all 7 days

---

## Mobile View

**Optimized for small screens:**

```
┌──────────────────────────┐
│ Freitag, 1. November 2025│ ← Date header
├──────────────────────────┤
│ 08:00 ╔════════════════╗ │
│       ║ 🕒 Geschlossen ║ │ ← Compact virtual block
│ 09:00 ╚════════════════╝ │
├──────────────────────────┤
│ 09:00                    │ ← Available
├──────────────────────────┤
│ 10:00 ┌────────────────┐ │
│       │ Thai Massage   │ │ ← Booking
│ 11:00 │ Max M.         │ │
│       └────────────────┘ │
├──────────────────────────┤
│ 12:00 ┌ ─ ─ ─ ─ ─ ─ ─ ┐│
│       │ 🚫 Pause      │ │ ← User block
│ 13:00 └ ─ ─ ─ ─ ─ ─ ─ ┘│
├──────────────────────────┤
│ 14:00                    │ ← Available
├──────────────────────────┤
│ ...                      │
├──────────────────────────┤
│ 18:00 ╔════════════════╗ │
│       ║ 🕒 Geschlossen ║ │ ← Virtual block
│ 19:00 ║                ║ │
│       ╚════════════════╝ │
└──────────────────────────┘
```

---

## Color Palette

### Virtual Blocks (Closed Hours)
- Border: `#9ca3af` (gray-400)
- Background: `rgba(243, 244, 246, 0.5)` (gray-100/50)
- Text: `#4b5563` (gray-600)
- Pattern: `rgba(0,0,0,0.03)` stripes

### User Blocks
- Border: `#d1d5db` (gray-300)
- Background: `#f3f4f6` (gray-100)
- Text: `#374151` (gray-700)
- Pattern: `rgba(0,0,0,0.05)` stripes

### Bookings
- Border: Service-specific color
- Background: Lighter shade of service color
- Text: `#1f2937` (gray-900)

---

## Accessibility

### Screen Readers
- Virtual blocks announce: "Geschlossen, 08:00 bis 09:00, Außerhalb der Öffnungszeiten"
- User blocks announce: "Blockiert, 12:00 bis 13:00, Mittagspause"
- Focus indicator visible on keyboard navigation

### Color Contrast
- All text meets WCAG AA standard (4.5:1 minimum)
- Border patterns provide visual distinction beyond color
- Icons supplement color coding

### Keyboard Navigation
- Tab: Navigate between interactive elements
- Enter/Space: Open booking/block details
- Virtual blocks: Not in tab order (non-interactive)

---

## Edge Cases

### 1. 24-Hour Studio
**Opening Hours**: `{ "open": "00:00", "close": "23:59" }`

```
┌────────────────────────────────────┐
│ 00:00                              │ ← Available all day
│ 01:00                              │
│ ...                                │
│ 22:00                              │
│ 23:00  ╔═══════════════════════╗  │
│        ║ 🕒 Geschlossen        ║  │ ← Only last minute blocked
│ 23:59  ╚═══════════════════════╝  │
└────────────────────────────────────┘
```

### 2. Closed All Day
**Opening Hours**: `{ "wednesday": null }`

```
┌────────────────────────────────────┐
│ 08:00  ╔═══════════════════════╗  │
│        ║                       ║  │
│ 09:00  ║                       ║  │
│        ║                       ║  │
│ 10:00  ║   🕒 Geschlossen      ║  │ ← Single full-day block
│        ║                       ║  │
│ ...    ║   Ganztägig           ║  │
│        ║                       ║  │
│ 19:00  ║                       ║  │
│        ╚═══════════════════════╝  │
│ 20:00                              │
└────────────────────────────────────┘
```

### 3. No Opening Hours Set
**Opening Hours**: `null`

```
┌────────────────────────────────────┐
│ 08:00                              │ ← All slots available
│ 09:00                              │
│ 10:00                              │
│ ...                                │
│ 18:00                              │
│ 19:00                              │
│ 20:00                              │
└────────────────────────────────────┘
```

---

## Summary

The opening hours integration provides:
- ✅ Clear visual distinction between open/closed hours
- ✅ Automatic blocking based on configured hours
- ✅ Different styling for virtual vs. user-created blocks
- ✅ Support for day and week views
- ✅ Mobile-optimized layout
- ✅ Accessibility compliance
- ✅ Graceful handling of edge cases

Users can now immediately see which hours are available for booking without confusion.
