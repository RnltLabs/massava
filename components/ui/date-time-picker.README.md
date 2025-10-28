# DateTimePicker Component

A modern, accessible date and time picker component built with shadcn/ui, designed for appointment booking and scheduling interfaces.

## Features

- **Mobile-First Design**: Bottom sheet on mobile (< 768px), popover on desktop
- **Quick Selection Options**: Any Date, Today, Tomorrow shortcuts
- **Time Slots**: Morning (06:00-12:00), Afternoon (12:00-18:00), Evening (18:00-24:00)
- **Calendar Grid**: Custom date selection with disabled past dates
- **Internationalization**: Full i18n support (de, en, th)
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation, screen reader support
- **Smooth Animations**: Polished transitions and visual feedback
- **Type-Safe**: Full TypeScript support

## Installation

### 1. Install Dependencies

```bash
# Required shadcn/ui components
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add button
npx shadcn-ui@latest add separator

# Date utilities
npm install date-fns
```

### 2. Copy Component Files

```bash
# Copy the main component
cp components/ui/date-time-picker.tsx your-project/components/ui/

# Copy the useMediaQuery hook
cp hooks/use-media-query.ts your-project/hooks/
```

### 3. Add Translation Keys

Add the following to your i18n JSON files:

**German (`public/locales/de/common.json`):**
```json
{
  "dateTimePicker": {
    "placeholder": "Datum und Uhrzeit wählen",
    "selectDate": "Datum auswählen",
    "selectTime": "Uhrzeit auswählen",
    "anyDate": "Beliebiges Datum",
    "today": "Heute",
    "tomorrow": "Morgen",
    "orChooseDate": "Oder wählen Sie ein Datum:",
    "morning": "Morgen",
    "afternoon": "Nachmittag",
    "evening": "Abend",
    "done": "Fertig",
    "back": "Zurück",
    "selected": "Ausgewählt:",
    "timeRange": {
      "morning": "06:00 - 12:00",
      "afternoon": "12:00 - 18:00",
      "evening": "18:00 - 24:00"
    }
  }
}
```

See `public/locales/en/common.json` and `public/locales/th/common.json` for English and Thai translations.

## Usage

### Basic Example

```tsx
'use client'

import { useState } from 'react'
import { DateTimePicker } from '@/components/ui/date-time-picker'

export function AppointmentForm() {
  const [dateTime, setDateTime] = useState<Date | undefined>()

  return (
    <div>
      <DateTimePicker
        value={dateTime}
        onChange={setDateTime}
        placeholder="Select date and time"
      />
    </div>
  )
}
```

### With Minimum Date (No Past Dates)

```tsx
<DateTimePicker
  value={dateTime}
  onChange={setDateTime}
  minDate={new Date()}
  placeholder="Select future date"
/>
```

### Disabled State

```tsx
<DateTimePicker
  value={dateTime}
  onChange={setDateTime}
  disabled={true}
/>
```

### Custom Styling

```tsx
<DateTimePicker
  value={dateTime}
  onChange={setDateTime}
  className="shadow-lg border-2 border-primary"
/>
```

### In a Search Widget

```tsx
export function SearchWidget() {
  const [searchParams, setSearchParams] = useState({
    dateTime: undefined as Date | undefined,
    location: '',
    treatment: '',
  })

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <input
        placeholder="Location"
        value={searchParams.location}
        onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
      />

      <input
        placeholder="Treatment"
        value={searchParams.treatment}
        onChange={(e) => setSearchParams({ ...searchParams, treatment: e.target.value })}
      />

      <DateTimePicker
        value={searchParams.dateTime}
        onChange={(date) => setSearchParams({ ...searchParams, dateTime: date })}
        minDate={new Date()}
      />

      <button onClick={() => console.log(searchParams)}>
        Search
      </button>
    </div>
  )
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date \| undefined` | `undefined` | Currently selected date and time |
| `onChange` | `(date: Date \| undefined) => void` | - | Callback when selection changes |
| `minDate` | `Date` | `new Date()` | Minimum selectable date (past dates disabled) |
| `placeholder` | `string` | `t('dateTimePicker.placeholder')` | Placeholder text when no value |
| `disabled` | `boolean` | `false` | Disable the picker |
| `className` | `string` | `''` | Additional CSS classes for trigger |

### Return Value

The component is fully controlled and returns nothing. Use the `onChange` callback to handle state updates.

## User Flow

1. **Trigger Click**: User clicks the input-like trigger
2. **Date Selection**: Sheet/Popover opens showing quick options and calendar
   - Click "Any Date" → Immediately closes, calls `onChange(undefined)`
   - Click "Today" or "Tomorrow" → Proceeds to time selection
   - Click calendar date → Proceeds to time selection
3. **Time Selection**: User selects time slot (Morning/Afternoon/Evening)
4. **Confirmation**: User clicks "Done" button
5. **Result**: Picker closes, trigger shows formatted date-time, `onChange` called with Date object

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between elements
- **Shift+Tab**: Navigate backwards
- **Enter/Space**: Open picker, activate buttons
- **Arrow Keys**: Navigate calendar grid
- **Escape**: Close picker

### Screen Reader Support

- All interactive elements have proper ARIA labels
- Calendar announces selected dates
- Sheet/Popover announces open/close states
- Time slots include time ranges in labels

### Touch Targets

- Minimum 44px × 44px for all buttons
- Adequate spacing between interactive elements
- Large tap targets for calendar days

### Color Contrast

- WCAG 2.1 AA compliant (4.5:1 for text)
- High contrast for selected states
- Clear visual distinction for disabled dates

## Internationalization

The component uses `next-i18next` for translations. Supported locales:

- `de`: German
- `en`: English (default)
- `th`: Thai

Date formatting automatically adapts to the selected locale using `date-fns` locale objects.

### Custom Locale

```tsx
import { DateTimePicker } from '@/components/ui/date-time-picker'

// The component automatically uses the current locale from next-i18next
// No additional configuration needed
```

## Responsive Behavior

### Mobile (< 768px)
- Bottom sheet slides up from bottom
- Full-screen experience
- Touch-optimized buttons (min 44px height)
- Rounded top corners for modern feel
- Fixed "Done" button at bottom

### Desktop (768px+)
- Compact popover
- Positioned near trigger
- Mouse-optimized interactions
- Inline "Done" button
- Can be dismissed by clicking outside

## Customization

### Time Slots

To modify time slot hours, edit the `getTimeForSlot` function:

```tsx
const getTimeForSlot = (date: Date, slot: TimeSlot): Date => {
  switch (slot) {
    case 'morning':
      return setHours(setMinutes(date, 0), 9) // Change 9 to your desired hour
    case 'afternoon':
      return setHours(setMinutes(date, 0), 14) // Change 14 to your desired hour
    case 'evening':
      return setHours(setMinutes(date, 0), 19) // Change 19 to your desired hour
    default:
      return setHours(setMinutes(date, 0), 12)
  }
}
```

### Quick Date Options

To add/remove quick options, edit the `renderDateSelection` function:

```tsx
// Add "Next Week" option
<Button
  variant="outline"
  className="justify-start h-auto py-4"
  onClick={() => handleQuickDate('nextWeek')}
>
  <CalendarIcon className="h-5 w-5" />
  <div>Next Week</div>
</Button>
```

### Styling

The component uses Tailwind CSS utility classes. Customize via:

1. **Trigger styling**: Pass `className` prop
2. **Global theme**: Modify shadcn/ui theme in `tailwind.config.js`
3. **Component internals**: Edit classes in `date-time-picker.tsx`

## Examples

See `date-time-picker.example.tsx` for comprehensive usage examples including:

- Basic usage
- Minimum date validation
- Disabled state
- Form integration
- Custom styling
- Controlled with reset
- SearchWidget integration
- Validation
- Multiple pickers
- Date range selection

## Testing

Comprehensive test suite available in `__tests__/date-time-picker.test.tsx`:

```bash
# Run tests
npm test date-time-picker

# With coverage
npm test date-time-picker -- --coverage
```

Test coverage includes:
- Rendering and initial state
- Quick date selection
- Calendar selection
- Time slot selection
- Mobile vs Desktop rendering
- Keyboard navigation
- Accessibility (ARIA, focus management)
- Internationalization

## Performance Considerations

- **Lazy Rendering**: Sheet/Popover content only renders when open
- **Memoization**: Date calculations are memoized to prevent re-renders
- **Optimistic Updates**: Immediate UI feedback, no loading states
- **Small Bundle**: Uses tree-shakeable `date-fns` utilities

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Android 8+

## Troubleshooting

### Picker doesn't open on mobile

- Check if `useMediaQuery` hook is correctly detecting screen size
- Verify Sheet component is installed: `npx shadcn-ui@latest add sheet`

### Dates are in wrong locale

- Ensure `next-i18next` is configured correctly
- Check that locale files include all `dateTimePicker.*` keys
- Verify `date-fns` locale is imported (de, enUS, th)

### Calendar shows past dates as enabled

- Set `minDate` prop: `<DateTimePicker minDate={new Date()} />`
- Check that date comparison accounts for time (use `setHours(0,0,0,0)`)

### Styles look broken

- Ensure all shadcn/ui dependencies are installed
- Check that Tailwind CSS is configured correctly
- Verify `@/lib/utils` exports `cn` function

## Contributing

Contributions welcome! Please:

1. Follow existing code style (Prettier, ESLint)
2. Add tests for new features
3. Update documentation
4. Test on mobile and desktop
5. Verify accessibility (keyboard, screen reader)

## License

MIT License - see LICENSE file for details

## Credits

- Inspired by [Treatwell](https://www.treatwell.de/) date picker UX
- Built with [shadcn/ui](https://ui.shadcn.com/)
- Date utilities by [date-fns](https://date-fns.org/)
- Internationalization via [next-i18next](https://github.com/i18next/next-i18next)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Maintainer**: Massava Development Team
