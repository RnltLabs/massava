# Design Specification: Date-Time Picker Component

## Overview
A modern, intuitive date and time picker component for the appointment search feature, replacing the native `<input type="datetime-local">` with a custom solution using shadcn/ui components. Inspired by Treatwell's approach with clear visual hierarchy and quick selection options.

## User Flow

### Entry Points
- Click on "Datum und Uhrzeit wählen" input field in SearchWidget
- Input field shows placeholder text when empty
- Shows formatted date/time when value is set

### Main Flow
1. User clicks input field
   → Sheet opens from bottom (mobile) or Popover appears (desktop)
   → Shows date selection step

2. User selects date via:
   - Quick shortcuts: "Beliebiges Datum", "Heute", "Morgen"
   - Calendar grid for custom date
   → Quick shortcuts immediately show time selection
   → Calendar selection shows time selection

3. User selects time via:
   - Pre-defined time slots: "Morgen" (06-12), "Nachmittag" (12-18), "Abend" (18-24)
   - Or specific time picker (optional)
   → Visual feedback shows selected time

4. User clicks "Fertig" button
   → Sheet/Popover closes
   → Input field shows formatted date and time
   → onChange callback fired with Date object

### Alternative Flows
- **Cancel**: Click outside, press Escape, or click X → Sheet closes, no changes
- **Change Selection**: Click "Zurück" to return to date selection
- **Clear Selection**: Click X icon in input field → Clears value

### Exit Points
- Success: Input field updated with selected date/time
- Cancel: Returns to previous state, input unchanged

## Wireframes

### Mobile Layout (< 768px)

```
┌─────────────────────────────────────┐
│ SearchWidget Input Field            │
│ ┌─────────────────────────────────┐ │
│ │ 📅 Datum und Uhrzeit wählen    │ │
│ │                              [x]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
          ↓ (User clicks)
┌─────────────────────────────────────┐
│ BOTTOM SHEET (Sheet component)      │
│═════════════════════════════════════│
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Datum auswählen         [X] │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🗓️  Beliebiges Datum        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ☀️  Heute                   │   │
│  │     Di, 28. Oktober         │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🌅  Morgen                  │   │
│  │     Mi, 29. Oktober         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Oder wählen Sie ein Datum:  │   │
│  │                             │   │
│  │  Oktober 2025               │   │
│  │  Mo Di Mi Do Fr Sa So       │   │
│  │      1  2  3  4  5  6       │   │
│  │   7  8  9 10 11 12 13       │   │
│  │  14 15 16 17 18 19 20       │   │
│  │  21 22 23 24 25 26 27       │   │
│  │  28 29 30 31                │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘

          ↓ (User selects date)

┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │ ← Uhrzeit auswählen     [X] │   │
│  └─────────────────────────────┘   │
│                                     │
│  Ausgewählt: Di, 28. Oktober 2025   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🌅  Morgen                  │   │
│  │     06:00 - 12:00           │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ☀️  Nachmittag              │   │
│  │     12:00 - 18:00           │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🌙  Abend                   │   │
│  │     18:00 - 24:00           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Fertig                │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Desktop Layout (768px+)

```
┌────────────────────────────┐
│ SearchWidget Input         │
│ ┌────────────────────────┐ │
│ │ 📅 Select date & time  │ │
│ └────────────────────────┘ │
└────────────────────────────┘
          ↓ (User clicks)
┌────────────────────────────┐
│ POPOVER (Popover component)│
├────────────────────────────┤
│ Date Selection             │
│                            │
│ ┌────────────────────────┐ │
│ │ 🗓️ Any Date           │ │
│ └────────────────────────┘ │
│ ┌──────────┬─────────────┐ │
│ │ ☀️ Today │ 🌅 Tomorrow │ │
│ └──────────┴─────────────┘ │
│                            │
│  October 2025              │
│  Mo Tu We Th Fr Sa Su      │
│      1  2  3  4  5  6      │
│   7  8  9 10 11 12 13      │
│  14 15 16 17 18 19 20      │
│  21 22 23 24 25 26 27      │
│  28 29 30 31               │
│                            │
│ [Time Selection Section]   │
│ ┌────────────────────────┐ │
│ │ 🌅 Morning (06-12)     │ │
│ │ ☀️ Afternoon (12-18)   │ │
│ │ 🌙 Evening (18-24)     │ │
│ └────────────────────────┘ │
│                            │
│        [Done Button]       │
└────────────────────────────┘
```

## Component Specification

### 1. DateTimePicker Component (Main)

```typescript
// components/ui/date-time-picker.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de, enUS, th } from 'date-fns/locale'
import { Calendar, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTranslation } from '@/lib/i18n'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  placeholder?: string
  disabled?: boolean
  className?: string
}

type DateTimeStep = 'date' | 'time'
type TimeSlot = 'any' | 'morning' | 'afternoon' | 'evening'

export function DateTimePicker({
  value,
  onChange,
  minDate = new Date(),
  placeholder,
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<DateTimeStep>('date')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('any')

  const isMobile = useMediaQuery('(max-width: 768px)')
  const { t, locale } = useTranslation()

  // Component logic...
}
```

### 2. shadcn/ui Components Used

**From shadcn/ui:**
- **Sheet**: Mobile bottom drawer (SheetContent, SheetHeader, SheetTitle, SheetTrigger)
- **Popover**: Desktop overlay (PopoverContent, PopoverTrigger)
- **Calendar**: Date selection grid
- **Button**: All interactive buttons (variants: default, outline, ghost)
- **Card**: Quick selection options container
- **Separator**: Visual dividers

**Additional Components:**
- **Input-like trigger**: Custom styled trigger that looks like input field
- **Badge**: Selected date/time indicator

### 3. Component Structure

```typescript
// Trigger (looks like input)
<div className="relative">
  <div className="flex items-center gap-2 px-4 py-3 border rounded-lg bg-background">
    <Calendar className="h-5 w-5 text-muted-foreground" />
    <span className={cn(
      "flex-1",
      !value && "text-muted-foreground"
    )}>
      {value ? formatDateTime(value) : placeholder}
    </span>
    {value && (
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={handleClear}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
</div>

// Mobile: Sheet
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent
    side="bottom"
    className="h-[85vh] rounded-t-2xl"
  >
    <SheetHeader>
      <SheetTitle>
        {step === 'date' ? 'Datum auswählen' : 'Uhrzeit auswählen'}
      </SheetTitle>
    </SheetHeader>

    {step === 'date' ? (
      <DateSelection />
    ) : (
      <TimeSelection />
    )}
  </SheetContent>
</Sheet>

// Desktop: Popover
<Popover open={open} onOpenChange={setOpen}>
  <PopoverContent
    className="w-auto p-0"
    align="start"
  >
    <div className="p-4 space-y-4">
      <DateSelection />
      <Separator />
      <TimeSelection />
      <Button
        className="w-full"
        onClick={handleDone}
      >
        Done
      </Button>
    </div>
  </PopoverContent>
</Popover>
```

### 4. Quick Selection Cards

```typescript
// Date Quick Options
<div className="grid gap-2">
  <Button
    variant="outline"
    className="justify-start h-auto py-4"
    onClick={() => handleQuickDate('any')}
  >
    <div className="flex items-center gap-3">
      <Calendar className="h-5 w-5" />
      <div className="text-left">
        <div className="font-semibold">Beliebiges Datum</div>
      </div>
    </div>
  </Button>

  <Button
    variant="outline"
    className="justify-start h-auto py-4"
    onClick={() => handleQuickDate('today')}
  >
    <div className="flex items-center gap-3">
      <Sun className="h-5 w-5 text-amber-500" />
      <div className="text-left">
        <div className="font-semibold">Heute</div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
        </div>
      </div>
    </div>
  </Button>

  <Button
    variant="outline"
    className="justify-start h-auto py-4"
    onClick={() => handleQuickDate('tomorrow')}
  >
    <div className="flex items-center gap-3">
      <Sunrise className="h-5 w-5 text-orange-500" />
      <div className="text-left">
        <div className="font-semibold">Morgen</div>
        <div className="text-sm text-muted-foreground">
          {format(addDays(new Date(), 1), 'EEEE, d. MMMM', { locale: de })}
        </div>
      </div>
    </div>
  </Button>
</div>

// Time Quick Options
<div className="grid gap-2">
  <Button
    variant={selectedTimeSlot === 'morning' ? 'default' : 'outline'}
    className="justify-start h-auto py-4"
    onClick={() => handleTimeSlot('morning')}
  >
    <div className="flex items-center gap-3">
      <Sunrise className="h-5 w-5" />
      <div className="text-left">
        <div className="font-semibold">Morgen</div>
        <div className="text-sm opacity-80">06:00 - 12:00</div>
      </div>
    </div>
  </Button>

  <Button
    variant={selectedTimeSlot === 'afternoon' ? 'default' : 'outline'}
    className="justify-start h-auto py-4"
    onClick={() => handleTimeSlot('afternoon')}
  >
    <div className="flex items-center gap-3">
      <Sun className="h-5 w-5" />
      <div className="text-left">
        <div className="font-semibold">Nachmittag</div>
        <div className="text-sm opacity-80">12:00 - 18:00</div>
      </div>
    </div>
  </Button>

  <Button
    variant={selectedTimeSlot === 'evening' ? 'default' : 'outline'}
    className="justify-start h-auto py-4"
    onClick={() => handleTimeSlot('evening')}
  >
    <div className="flex items-center gap-3">
      <Moon className="h-5 w-5" />
      <div className="text-left">
        <div className="font-semibold">Abend</div>
        <div className="text-sm opacity-80">18:00 - 24:00</div>
      </div>
    </div>
  </Button>
</div>
```

### 5. Calendar Component

```typescript
<div className="space-y-3">
  <div className="text-sm font-medium text-muted-foreground">
    Oder wählen Sie ein Datum:
  </div>
  <CalendarComponent
    mode="single"
    selected={selectedDate}
    onSelect={handleDateSelect}
    disabled={(date) => date < minDate}
    locale={locale === 'de' ? de : locale === 'th' ? th : enUS}
    className="rounded-lg border"
    classNames={{
      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
      month: "space-y-4",
      caption: "flex justify-center pt-1 relative items-center",
      caption_label: "text-sm font-medium",
      nav: "space-x-1 flex items-center",
      nav_button: cn(
        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
      ),
      table: "w-full border-collapse space-y-1",
      head_row: "flex",
      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
      row: "flex w-full mt-2",
      cell: cn(
        "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        "[&:has([aria-selected])]:bg-accent"
      ),
      day: cn(
        "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        "hover:bg-accent hover:text-accent-foreground",
        "rounded-md"
      ),
      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
      day_today: "bg-accent text-accent-foreground",
      day_disabled: "text-muted-foreground opacity-50",
    }}
  />
</div>
```

### 6. Loading and Confirmation States

```typescript
// Done Button (Mobile)
<div className="sticky bottom-0 bg-background pt-4 border-t">
  <Button
    className="w-full"
    size="lg"
    onClick={handleDone}
    disabled={!selectedDate}
  >
    Fertig
  </Button>
</div>

// Back Button (Time Selection Step)
<Button
  variant="ghost"
  size="sm"
  onClick={() => setStep('date')}
>
  <ChevronLeft className="h-4 w-4 mr-1" />
  Zurück
</Button>

// Selected Date Indicator
{step === 'time' && selectedDate && (
  <div className="px-4 py-2 bg-accent rounded-lg">
    <div className="text-sm text-muted-foreground">Ausgewählt:</div>
    <div className="font-medium">
      {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
    </div>
  </div>
)}
```

## Accessibility

### WCAG 2.1 AA Requirements

**Semantic HTML:**
- ✅ Button elements for all interactive actions
- ✅ Proper heading hierarchy (SheetTitle)
- ✅ Label associations via aria-label

**ARIA Labels:**
- ✅ Trigger button: aria-label="Select date and time"
- ✅ Clear button: aria-label="Clear selection"
- ✅ Calendar: Built-in ARIA from shadcn/ui
- ✅ Sheet/Popover: aria-describedby for instructions

**Keyboard Navigation:**
- ✅ Tab: Navigate through quick options → calendar → time slots → done button
- ✅ Enter/Space: Activate buttons and select dates
- ✅ Arrow keys: Navigate calendar grid
- ✅ Escape: Close sheet/popover
- ✅ Focus trap: Sheet prevents focus escape

**Focus Indicators:**
- ✅ Visible focus ring on all interactive elements
- ✅ Focus returns to trigger after closing
- ✅ Calendar day cells have clear focus states

**Color Contrast:**
- ✅ Text: 4.5:1 minimum (handled by shadcn/ui theme)
- ✅ Selected state: High contrast background
- ✅ Disabled dates: Clear visual distinction
- ✅ Time slot icons: Colored but not color-dependent

**Screen Reader Support:**
- ✅ Calendar announces selected date
- ✅ Sheet/Popover announces open/close
- ✅ Quick options have descriptive labels
- ✅ Time slots include time range in label

**Touch Targets:**
- ✅ Minimum 44px × 44px for all interactive elements
- ✅ Adequate spacing between buttons (gap-2)
- ✅ Large tap targets for calendar days

### Keyboard Shortcuts
- **Tab**: Navigate forward through elements
- **Shift+Tab**: Navigate backward
- **Enter/Space**: Select date, activate button
- **Arrow Keys**: Navigate calendar grid (Up/Down/Left/Right)
- **Escape**: Close picker without saving
- **Home**: Jump to first day of month
- **End**: Jump to last day of month
- **Page Up/Down**: Change month

## Interaction Design

### Loading States
- Initial render: No loading needed (static content)
- Date selection: Immediate visual feedback
- Time selection: Immediate visual feedback
- Done button: Instant close (no async operation)

### Error Handling

**Validation Errors:**
- Past date selected: Disabled in calendar (cannot select)
- No date selected: Done button disabled
- Invalid date format: Handled by Date object validation

**Empty States:**
- No value: Shows placeholder text
- After clear: Returns to placeholder state

**User Guidance:**
- Clear step indicators (Date → Time)
- Selected date always visible in time step
- Visual feedback on hover/focus

### Success Feedback

**Selection Confirmation:**
- Date selected: Highlight in calendar, proceed to time step
- Time selected: Visual highlight on selected slot
- Done clicked: Sheet closes, input shows formatted value
- Smooth transitions between all states

**Visual Feedback:**
- Quick option hover: Subtle background change
- Calendar day hover: Accent background
- Selected state: Primary color background
- Time slot selected: Filled button style

### Animation & Transitions

```typescript
// Sheet entrance (mobile)
<SheetContent
  className="transition-transform duration-300 ease-out"
  // Slides up from bottom
>

// Popover entrance (desktop)
<PopoverContent
  className="animate-in fade-in-0 zoom-in-95"
  // Fades in with slight scale
>

// Button hover states
className="transition-colors duration-200 hover:bg-accent"

// Selected state transition
className="transition-all duration-200"

// Step transitions (fade)
<div className="animate-in fade-in-50 duration-200">
  {step === 'date' ? <DateSelection /> : <TimeSelection />}
</div>
```

## Responsive Design

### Breakpoints
```
Mobile: < 768px (Sheet bottom drawer)
Desktop: 768px+ (Popover)
```

### Responsive Patterns

```typescript
// Layout switching based on screen size
const isMobile = useMediaQuery('(max-width: 768px)')

{isMobile ? (
  <Sheet>
    {/* Mobile: Full-screen bottom sheet */}
  </Sheet>
) : (
  <Popover>
    {/* Desktop: Compact popover */}
  </Popover>
)}

// Mobile-specific styles
<SheetContent
  side="bottom"
  className={cn(
    "h-[85vh]",
    "rounded-t-2xl", // Rounded top corners only
    "pb-safe-area-inset-bottom" // Safe area for notched devices
  )}
>

// Desktop-specific styles
<PopoverContent
  className="w-[420px] p-0"
  align="start"
  sideOffset={8}
>

// Responsive quick options layout
<div className={cn(
  "grid gap-2",
  "md:grid-cols-2" // 2 columns on desktop (Today | Tomorrow)
)}>

// Responsive spacing
<div className={cn(
  "p-4 space-y-4",
  "md:p-6 md:space-y-6" // More spacious on desktop
)}>
```

## Design Tokens

### Colors
- **Primary**: Brand color for selected states
- **Accent**: Hover states, today indicator
- **Muted**: Helper text, disabled states
- **Border**: Dividers, card outlines

### Spacing
- **Touch targets**: min-h-[44px] (mobile)
- **Gap between options**: gap-2 (8px)
- **Section spacing**: space-y-4 (16px)
- **Padding**: p-4 mobile, p-6 desktop

### Typography
- **Title**: text-lg font-semibold
- **Quick option primary**: text-base font-semibold
- **Quick option secondary**: text-sm text-muted-foreground
- **Calendar text**: text-sm
- **Helper text**: text-xs text-muted-foreground

### Border Radius
- **Sheet top**: rounded-t-2xl (24px)
- **Cards**: rounded-lg (8px)
- **Buttons**: rounded-md (6px)
- **Calendar**: rounded-lg (8px)

### Shadows
- **Sheet**: none (uses backdrop)
- **Popover**: shadow-lg
- **Cards**: shadow-sm on hover

## Internationalization (i18n)

### Translation Keys

```typescript
// de (German)
{
  "dateTimePicker.placeholder": "Datum und Uhrzeit wählen",
  "dateTimePicker.selectDate": "Datum auswählen",
  "dateTimePicker.selectTime": "Uhrzeit auswählen",
  "dateTimePicker.anyDate": "Beliebiges Datum",
  "dateTimePicker.today": "Heute",
  "dateTimePicker.tomorrow": "Morgen",
  "dateTimePicker.orChooseDate": "Oder wählen Sie ein Datum:",
  "dateTimePicker.morning": "Morgen",
  "dateTimePicker.afternoon": "Nachmittag",
  "dateTimePicker.evening": "Abend",
  "dateTimePicker.done": "Fertig",
  "dateTimePicker.back": "Zurück",
  "dateTimePicker.selected": "Ausgewählt:",
  "dateTimePicker.timeRange.morning": "06:00 - 12:00",
  "dateTimePicker.timeRange.afternoon": "12:00 - 18:00",
  "dateTimePicker.timeRange.evening": "18:00 - 24:00",
}

// en (English)
{
  "dateTimePicker.placeholder": "Select date and time",
  "dateTimePicker.selectDate": "Select date",
  "dateTimePicker.selectTime": "Select time",
  "dateTimePicker.anyDate": "Any Date",
  "dateTimePicker.today": "Today",
  "dateTimePicker.tomorrow": "Tomorrow",
  "dateTimePicker.orChooseDate": "Or choose a date:",
  "dateTimePicker.morning": "Morning",
  "dateTimePicker.afternoon": "Afternoon",
  "dateTimePicker.evening": "Evening",
  "dateTimePicker.done": "Done",
  "dateTimePicker.back": "Back",
  "dateTimePicker.selected": "Selected:",
  "dateTimePicker.timeRange.morning": "06:00 AM - 12:00 PM",
  "dateTimePicker.timeRange.afternoon": "12:00 PM - 06:00 PM",
  "dateTimePicker.timeRange.evening": "06:00 PM - 12:00 AM",
}

// th (Thai)
{
  "dateTimePicker.placeholder": "เลือกวันที่และเวลา",
  "dateTimePicker.selectDate": "เลือกวันที่",
  "dateTimePicker.selectTime": "เลือกเวลา",
  "dateTimePicker.anyDate": "วันใดก็ได้",
  "dateTimePicker.today": "วันนี้",
  "dateTimePicker.tomorrow": "พรุ่งนี้",
  "dateTimePicker.orChooseDate": "หรือเลือกวันที่:",
  "dateTimePicker.morning": "ช่วงเช้า",
  "dateTimePicker.afternoon": "ช่วงบ่าย",
  "dateTimePicker.evening": "ช่วงเย็น",
  "dateTimePicker.done": "เสร็จสิ้น",
  "dateTimePicker.back": "ย้อนกลับ",
  "dateTimePicker.selected": "เลือกแล้ว:",
  "dateTimePicker.timeRange.morning": "06:00 - 12:00",
  "dateTimePicker.timeRange.afternoon": "12:00 - 18:00",
  "dateTimePicker.timeRange.evening": "18:00 - 24:00",
}
```

### Date Formatting

```typescript
import { format } from 'date-fns'
import { de, enUS, th } from 'date-fns/locale'

const getLocale = (locale: string) => {
  switch (locale) {
    case 'de': return de
    case 'th': return th
    default: return enUS
  }
}

// Format patterns by locale
const formatDateTime = (date: Date, locale: string) => {
  const localeObj = getLocale(locale)

  // Full format: "Tuesday, October 28, 2025 at 3:00 PM"
  return format(date, 'EEEE, MMMM d, yyyy', { locale: localeObj })
}

const formatDate = (date: Date, locale: string) => {
  const localeObj = getLocale(locale)

  // Short format: "Oct 28, 2025"
  return format(date, 'MMM d, yyyy', { locale: localeObj })
}
```

## Implementation Notes

### For Feature Builder
- Use shadcn/ui components exclusively (no custom date picker libraries)
- Implement as Client Component (requires useState, event handlers)
- Create reusable hook: `useDateTimePicker()`
- Handle timezone considerations (store as UTC, display in user timezone)
- Optimistic UI updates (no loading spinners needed)

### For Performance Optimizer
- Lazy load Sheet/Popover content (only render when open)
- Memoize date calculations (useMemo for calendar dates)
- Debounce rapid date selections (prevent unnecessary re-renders)
- Virtual scrolling if time slots expand to many options

### For Security Auditor
- Validate date ranges (minDate, maxDate)
- Sanitize date inputs (prevent invalid Date objects)
- No XSS risk (date-fns handles formatting safely)
- CSRF protection: N/A (no server mutations in picker itself)

### Integration with SearchWidget
```typescript
// In SearchWidget.tsx
import { DateTimePicker } from '@/components/ui/date-time-picker'

const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>()

<DateTimePicker
  value={selectedDateTime}
  onChange={setSelectedDateTime}
  minDate={new Date()}
  placeholder={t('search.selectDateTime')}
/>
```

## Testing Requirements

### Unit Tests
- Date selection logic (today, tomorrow, custom)
- Time slot calculations (morning/afternoon/evening ranges)
- Date validation (past dates disabled)
- Formatting functions (different locales)

### Integration Tests
- Open/close Sheet on mobile
- Open/close Popover on desktop
- Select date → proceed to time selection
- Select time → close with value
- Cancel/close without value change

### E2E Tests (Critical User Flow)
1. User opens date-time picker
2. User selects "Tomorrow"
3. User selects "Afternoon"
4. User clicks "Done"
5. Input field shows formatted date/time
6. Search can be triggered with selected date

### Accessibility Tests
- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader announcements (VoiceOver/NVDA)
- Focus management (trap, return to trigger)
- Color contrast (automated tools)
- Touch target sizes (mobile)

---

**Last Updated**: 2025-10-28
**Status**: Ready for Implementation
