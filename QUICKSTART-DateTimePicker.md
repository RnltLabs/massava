# DateTimePicker - Quick Start Guide

Get up and running with the DateTimePicker component in 5 minutes.

## Installation (2 minutes)

```bash
# 1. Install shadcn/ui components
npx shadcn-ui@latest add calendar popover sheet button separator

# 2. Install date utilities
npm install date-fns

# 3. Component and hook are already in your project:
# - /components/ui/date-time-picker.tsx
# - /hooks/use-media-query.ts
```

## Basic Usage (1 minute)

```tsx
'use client'

import { useState } from 'react'
import { DateTimePicker } from '@/components/ui/date-time-picker'

export function MyComponent() {
  const [dateTime, setDateTime] = useState<Date | undefined>()

  return (
    <DateTimePicker
      value={dateTime}
      onChange={setDateTime}
    />
  )
}
```

## Common Use Cases

### Appointment Booking

```tsx
const [appointment, setAppointment] = useState<Date | undefined>()

<DateTimePicker
  value={appointment}
  onChange={setAppointment}
  minDate={new Date()} // No past dates
  placeholder="Select appointment time"
/>
```

### SearchWidget Integration

```tsx
import { DateTimePicker } from '@/components/ui/date-time-picker'

export function SearchWidget() {
  const [filters, setFilters] = useState({
    location: '',
    treatment: '',
    dateTime: undefined as Date | undefined,
  })

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Location Input */}
      <input
        value={filters.location}
        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        placeholder="Location"
      />

      {/* Treatment Input */}
      <input
        value={filters.treatment}
        onChange={(e) => setFilters({ ...filters, treatment: e.target.value })}
        placeholder="Treatment"
      />

      {/* Date Time Picker */}
      <DateTimePicker
        value={filters.dateTime}
        onChange={(date) => setFilters({ ...filters, dateTime: date })}
        minDate={new Date()}
      />
    </div>
  )
}
```

## Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `Date \| undefined` | No | `undefined` | Selected date-time |
| `onChange` | `(date: Date \| undefined) => void` | Yes | - | Change handler |
| `minDate` | `Date` | No | `new Date()` | Minimum selectable date |
| `placeholder` | `string` | No | Auto-translated | Placeholder text |
| `disabled` | `boolean` | No | `false` | Disable picker |
| `className` | `string` | No | `''` | Custom CSS classes |

## User Flow

1. **Click Trigger**: User clicks input field
2. **Select Date**: Choose "Today", "Tomorrow", or pick from calendar
3. **Select Time**: Choose "Morning", "Afternoon", or "Evening"
4. **Confirm**: Click "Done" button
5. **Result**: Picker closes, value updates

## Mobile vs Desktop

### Mobile (< 768px)
- Bottom sheet slides up
- Full-screen experience
- Touch-optimized buttons

### Desktop (768px+)
- Compact popover
- Mouse-optimized
- Positioned near trigger

## Keyboard Shortcuts

- **Tab**: Navigate elements
- **Enter/Space**: Activate buttons
- **Arrow Keys**: Navigate calendar
- **Escape**: Close picker

## Translations

Already included for:
- 🇩🇪 German (de)
- 🇬🇧 English (en)
- 🇹🇭 Thai (th)

Translations are in:
- `/public/locales/de/common.json`
- `/public/locales/en/common.json`
- `/public/locales/th/common.json`

## Examples

Full examples in: `/components/ui/date-time-picker.example.tsx`

Including:
- Basic usage
- Form integration
- Validation
- Multiple pickers
- Custom styling
- And more...

## Testing

```bash
# Run tests
npm test date-time-picker

# With coverage
npm test date-time-picker -- --coverage
```

## Troubleshooting

### Picker doesn't open
- Check if shadcn/ui components are installed
- Verify `useMediaQuery` hook exists in `/hooks/`

### Wrong language
- Check `next-i18next` configuration
- Verify translation keys in `/public/locales/*/common.json`

### Styles broken
- Ensure Tailwind CSS is configured
- Verify `@/lib/utils` exports `cn` function

## Need Help?

- 📖 Full Documentation: `/components/ui/date-time-picker.README.md`
- 🎨 Design Spec: `/docs/design-specs/date-time-picker.md`
- 💡 Examples: `/components/ui/date-time-picker.example.tsx`
- 🧪 Tests: `/components/ui/__tests__/date-time-picker.test.tsx`

---

**Quick Start Time**: ~5 minutes
**Status**: Ready to use
**Support**: Massava Development Team
