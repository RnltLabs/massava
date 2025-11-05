# Design Specification: Digital Terminbuch (Appointment Book)

**Mission**: Transform traditional Thai studio paper appointment book into digital experience with "Stift & Papier Einfachheit" (pen & paper simplicity)

**Target Users**: 60+ year old Thai massage studio owners who have used paper books for 10+ years

**Success Metric**: Digital booking < 10 seconds (vs. 30 seconds paper)

---

## PART 1: THAI STUDIO WORKFLOW ANALYSIS

### Current Paper Book Reality

#### Daily Routine Timeline

**Morning (08:00)**:
1. Owner arrives, unlocks studio
2. Opens appointment book to today's page
3. Scans day to see who's coming
4. Prepares massage rooms accordingly

**Throughout Day**:
- Every 30 minutes: Glances at book to see who's next
- Phone rings: Picks up with one hand, book with other
- Walk-in customer: Checks current time slot, writes name
- Between appointments: Crosses off completed appointments
- Lunch time: Draws line through 12:00-13:00, writes "Pause"

**Evening (19:00)**:
- Reviews tomorrow's schedule
- Calls customers without phone confirmation
- Closes book, locks studio

#### Paper Booking Process (Timed Analysis)

**Scenario**: Regular customer calls for appointment

**Steps** (Total: 20-30 seconds):
1. **Phone rings** (0s)
2. Owner picks up: "Sawadee ka, Studio Sunshine" (2s)
3. Customer: "Hallo Maria, ich möchte einen Termin" (3s)
4. Owner: "Ja gerne, wann möchtest du kommen?" (2s)
5. Customer: "Morgen um 14 Uhr, geht das?" (2s)
6. **Owner flips to tomorrow's page** (1s)
7. **Owner scans 14:00 slot - sees it's free** (2s)
8. **Owner writes: "Sabine K. - Thai"** (4s)
9. Owner: "Ja, 14 Uhr ist frei. Bis morgen!" (2s)
10. **Hangs up** (1s)

**Total time: ~19 seconds** (with writing: ~23 seconds)

**Key observation**: Writing is NOT the bottleneck - conversation is.

#### Visual Layout of Paper Book

```
═══════════════════════════════════════════
    DONNERSTAG, 30. OKTOBER 2025
═══════════════════════════════════════════

08:00 ________________________________

09:00 Sabine K. - Meridian-Massage
      ☎ 0176 1234 5678

10:00 (Fortsetzung - 90 Min)

11:00 ________________________________

12:00 ╳╳╳╳╳╳ MITTAGSPAUSE ╳╳╳╳╳╳╳

13:00 ________________________________

14:00 Max M. - Thai Massage
      Neukunde

15:00 ________________________________

16:00 Frau Schmidt - Öl-Massage
      (bezahlt mit Gutschein)

17:00 ________________________________

18:00 Peter L. - Fußreflexzone

19:00 FEIERABEND
═══════════════════════════════════════════
```

**Observations**:
- Time slots are visual anchors
- Names abbreviated (saves writing time)
- Service type noted (preparation)
- Notes in parentheses or below
- Strikethrough for cancellations
- Visual blocks for breaks
- Entire day visible at once

#### Pain Points with Paper

| Pain Point | Frequency | Severity | Impact |
|------------|-----------|----------|--------|
| **Lost book = lost everything** | Rare (1x/year?) | CRITICAL | Business stops |
| **Can't see next week easily** | Daily (10x/day) | HIGH | Requires page flipping |
| **Handwriting illegible** | Often (3-4x/day) | MEDIUM | Confusion, wrong customer |
| **No automatic reminders** | Daily (every customer) | HIGH | Manual calls/texts needed |
| **Double bookings** (human error) | Occasional (1x/week) | HIGH | Customer conflict |
| **Can't search past appointments** | Weekly (2x/week) | MEDIUM | "When was Sabine last here?" |
| **Wet hands from massage oil** | Daily (2-3x/day) | LOW | Smudged pages |
| **No backup** | N/A | CRITICAL | Risk of total data loss |
| **Running out of pages** | Yearly | LOW | Need to buy new book |

#### What They LOVE About Paper

| Advantage | Why It Matters | Digital Must Preserve This |
|-----------|----------------|---------------------------|
| **Instant access** | Pick up, see schedule | < 1 second to open app + see today |
| **Entire day visible** | Mental overview | Full day on one screen (no scrolling) |
| **Tactile feedback** | Feels "real", trustworthy | Haptic feedback, instant visual confirmation |
| **Write anywhere** | Margins, corners, squeezes | Flexible note-taking, annotations |
| **No learning curve** | Lines = slots, write = book | Zero training, instant understanding |
| **Always works** | No batteries, no crashes | Offline mode, cached data |
| **Simple** | No menus, buttons, settings | < 3 taps for any action |
| **Visual scanning** | See patterns (busy days, gaps) | Color coding, density visualization |

### Competitive Research Analysis

#### 1. Booksy (Salon Booking App)

**What Works Well**:
- Calendar-first interface (opens to today)
- Quick-add via FAB (floating action button)
- Customer autocomplete with photos
- Color-coded services
- Swipe gestures for navigation

**What's Too Complex**:
- ❌ Too many menu options (Settings, Reports, Marketing, etc.)
- ❌ Requires customer app signup (friction)
- ❌ Onboarding tutorial (means it's not intuitive)
- ❌ Subscription pricing shown everywhere (distracting)

**Ideas to Steal**:
- ✅ FAB for quick add (always accessible)
- ✅ Customer photos (visual recognition)
- ✅ Swipe days like flipping pages

#### 2. Square Appointments

**What Works Well**:
- Clean, minimal interface
- Inline editing (click slot → type)
- Keyboard shortcuts (desktop)
- Multiple view options (day/week/month)

**What's Too Complex**:
- ❌ Requires Square POS integration (lock-in)
- ❌ Too many fields in booking form (Duration, Staff, Location, etc.)
- ❌ Marketing features clutter interface

**Ideas to Steal**:
- ✅ Inline editing pattern
- ✅ Keyboard shortcuts for power users
- ✅ Clean visual hierarchy

#### 3. Calendly

**What Works Well**:
- Minimal clicks to book (name + email + confirm)
- Clear available/unavailable slots
- Smart time zone handling

**What's Too Complex**:
- ❌ Customer-facing (doesn't solve studio owner's needs)
- ❌ Integration-heavy (Google Cal, Zoom, etc.)
- ❌ No walk-in booking flow

**Ideas to Steal**:
- ✅ Clear slot availability visualization
- ✅ Minimal required fields

#### 4. Google Calendar

**What Works Well**:
- Keyboard shortcut "C" for quick create
- Drag-and-drop time slots
- Multiple calendar layers
- Smart natural language input ("Lunch tomorrow at noon")

**What's Too Complex**:
- ❌ Too general-purpose (not appointment-focused)
- ❌ Overwhelming feature set
- ❌ Poor mobile experience

**Ideas to Steal**:
- ✅ Natural language input (optional advanced feature)
- ✅ Drag-and-drop for rescheduling
- ✅ Keyboard shortcuts

#### 5. Traditional Paper Appointment Books (Real-World)

**Research Findings** (from salon/spa industry):
- **Time slot increment**: 15-minute blocks (most common)
- **Page layout**: Vertical time axis, horizontal days (weekly view) OR single day per page
- **Color coding**: Different colored pens for service types
- **Abbreviations**: "TM" = Thai Massage, "OM" = Oil Massage
- **Symbols**: ✓ = confirmed, ☎ = needs callback, € = paid

**Ideas to Steal**:
- ✅ 15-minute time slot granularity
- ✅ Abbreviations/initials for compact display
- ✅ Symbol system for status

---

## PART 2: DIGITAL TERMINBUCH DESIGN

### Core Design Principle: "One Tap = One Action"

**Paper**: Pick up pen → Write in slot → Done (2 actions)
**Digital**: Tap slot → Type name → Auto-save (2 actions)

**CRITICAL RULE**: Never add a third step.

### Feature 1: Quick Add Appointment

#### User Story
> **As a** studio owner
> **I want to** book a customer appointment while on the phone
> **So that** I can confirm availability immediately without the customer waiting

**Acceptance Criteria**:
- ✅ Complete booking in < 10 seconds
- ✅ Works with one hand (holding phone in other)
- ✅ Keyboard appears immediately (no delay)
- ✅ Auto-save on sheet close (no save button)
- ✅ Supports new + existing customers

#### Design: Smart Bottom Sheet (Mobile)

**WINNER: Option B - Smart Bottom Sheet**

**Why**: Combines structure (prevents errors) with speed (auto-suggestions, smart defaults)

**Flow**:

```
┌─────────────────────────────┐
│ Donnerstag, 30. Oktober     │
├─────────────────────────────┤
│ 08:00 _____________________ │
│ 09:00 Sabine K. - Meridian  │
│ 10:00 (Fortsetzung)         │
│ 11:00 _____________________ │ ← User taps this slot
│ 12:00 ╳╳╳ Mittagspause ╳╳╳ │
└─────────────────────────────┘

[TAPS 11:00]
→ Sheet slides up from bottom (200ms ease-out animation)
→ Haptic feedback (light impact)

┌─────────────────────────────┐
│ ⎯⎯⎯⎯                       │ ← Drag handle
│ Neuer Termin - 11:00       │
│                             │
│ Kunde                      │
│ ┌─────────────────────────┐ │
│ │ Sabine K. ▼             │ │ ← Autocomplete dropdown
│ └─────────────────────────┘ │
│                             │
│ Letzte Kunden:             │
│ • Sabine K. (vor 2 Tagen)  │ ← Tap to select
│ • Max M. (vor 1 Woche)     │
│ • Peter L. (Stammkunde)    │
│                             │
│ [+ Neuer Kunde]            │ ← If not in list
│                             │
│ Massage                    │
│ [Thai Massage (60 Min)] ▼  │ ← Auto-selected (most common)
│                             │
│ ┌───────────────────────┐  │
│ │  Jetzt buchen         │  │ ← Large, green, always visible
│ └───────────────────────┘  │
└─────────────────────────────┘

[TAPS "Sabine K."]
→ Auto-fills customer
→ Pre-selects her usual service (Thai Massage)
→ "Jetzt buchen" button pulses (ready to tap)

[TAPS "Jetzt buchen"]
→ Sheet slides down (150ms)
→ Appointment appears in calendar immediately
→ Success toast: "Termin gebucht für Sabine K. um 11:00"
→ Haptic feedback (success vibration)

Total time: ~5-7 seconds (faster than paper!)
```

**Advanced: Smart Autocomplete with Learning**

```
┌─────────────────────────────┐
│ Neuer Termin - 14:00       │
│                             │
│ Wer kommt? (Kunde)         │
│ ┌─────────────────────────┐ │
│ │ [M____________]         │ │ ← User types "M"
│ └─────────────────────────┘ │
│                             │
│ Vorschläge:                │
│ 👤 Max Müller              │ ← Tap to select
│    Thai Massage (üblich)   │
│                             │
│ 👤 Maria Schmidt           │
│    Öl Massage (üblich)     │
│                             │
│ [+ "M..." als Neukunde]    │
└─────────────────────────────┘

[TAPS "Max Müller"]
→ Name selected
→ Service auto-filled: "Thai Massage"
→ Duration auto-set: 60 Min (11:00-12:00 blocked)
→ "Jetzt buchen" ready

[TAPS "Jetzt buchen"]
→ Done in 3 taps + 1 letter!
```

**New Customer Flow**:

```
[User types "Anna Schmidt" - not found]

┌─────────────────────────────┐
│ Neuer Termin - 11:00       │
│                             │
│ Kunde                      │
│ ┌─────────────────────────┐ │
│ │ Anna Schmidt            │ │
│ └─────────────────────────┘ │
│                             │
│ "Anna Schmidt" ist neu     │
│                             │
│ Telefon (optional)         │
│ ┌─────────────────────────┐ │
│ │ 0176 ___________        │ │ ← Optional, can skip
│ └─────────────────────────┘ │
│                             │
│ Massage                    │
│ [Thai Massage (60 Min)] ▼  │
│                             │
│ ┌───────────────────────┐  │
│ │  Termin erstellen     │  │
│ └───────────────────────┘  │
└─────────────────────────────┘

[TAPS "Termin erstellen"]
→ Customer created in database
→ Appointment booked
→ Toast: "Neukunde Anna Schmidt angelegt + Termin gebucht"

Total: ~10-12 seconds (including typing phone number)
```

#### Component Specification

```typescript
// components/terminbuch/QuickAddSheet.tsx
"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeSlot: {
    date: Date
    time: string // "11:00"
  }
  recentCustomers: Array<{
    id: string
    name: string
    lastVisit: Date
    usualService: string
  }>
  services: Array<{
    id: string
    name: string
    duration: number // minutes
  }>
}

export function QuickAddSheet({
  open,
  onOpenChange,
  timeSlot,
  recentCustomers,
  services
}: QuickAddSheetProps) {
  const [customerInput, setCustomerInput] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string>(services[0]?.id || "")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (open) {
      // Focus happens automatically via autofocus prop
      // Pre-select most common service
      if (services.length > 0) {
        setSelectedService(services[0].id)
      }
    }
  }, [open, services])

  // Filter customers based on input
  const filteredCustomers = recentCustomers.filter(c =>
    c.name.toLowerCase().includes(customerInput.toLowerCase())
  )

  // Check if customer is new
  const isNewCustomer = customerInput.length > 0 && filteredCustomers.length === 0

  // Handle customer selection from dropdown
  const handleSelectCustomer = (customer: typeof recentCustomers[0]) => {
    setCustomerInput(customer.name)
    setSelectedCustomer(customer.id)
    // Auto-select their usual service
    const usualService = services.find(s => s.name === customer.usualService)
    if (usualService) {
      setSelectedService(usualService.id)
    }
  }

  // Handle booking submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create appointment (Server Action)
      const result = await createAppointment({
        customerName: customerInput,
        customerId: selectedCustomer,
        serviceId: selectedService,
        phone: phone || null,
        dateTime: new Date(`${timeSlot.date.toISOString().split('T')[0]}T${timeSlot.time}:00`)
      })

      if (result.success) {
        toast({
          title: isNewCustomer ? "Neukunde angelegt + Termin gebucht" : "Termin gebucht",
          description: `${customerInput} - ${timeSlot.time} Uhr`
        })

        // Close sheet
        onOpenChange(false)

        // Reset form
        setCustomerInput("")
        setSelectedCustomer(null)
        setPhone("")

        // Trigger calendar refresh (via callback or event)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Termin konnte nicht gespeichert werden",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto">
        <SheetHeader>
          <SheetTitle>
            Neuer Termin - {timeSlot.time} Uhr
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Customer Input */}
          <div className="space-y-2">
            <Label htmlFor="customer">Kunde</Label>
            <Input
              id="customer"
              value={customerInput}
              onChange={(e) => setCustomerInput(e.target.value)}
              placeholder="Name eingeben..."
              autoFocus
              required
              className="text-lg"
            />

            {/* Recent customers suggestions */}
            {customerInput.length > 0 && filteredCustomers.length > 0 && (
              <div className="border rounded-lg divide-y">
                <p className="text-xs text-muted-foreground px-3 py-2">
                  Vorschläge:
                </p>
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.usualService} (üblich)
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* New customer indicator */}
            {isNewCustomer && (
              <p className="text-sm text-amber-600">
                "{customerInput}" ist neu - wird als Neukunde angelegt
              </p>
            )}
          </div>

          {/* Phone (optional, only for new customers) */}
          {isNewCustomer && (
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefon <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0176 ..."
              />
            </div>
          )}

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Massage</Label>
            <Select
              value={selectedService}
              onValueChange={setSelectedService}
              required
            >
              <SelectTrigger id="service" className="text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration} Min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading || !customerInput || !selectedService}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isNewCustomer ? "Termin erstellen" : "Jetzt buchen"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

### Feature 2: Quick Block Time

#### User Story
> **As a** studio owner
> **I want to** block time for lunch/breaks/errands
> **So that** customers can't book during unavailable times

**Acceptance Criteria**:
- ✅ Block time in < 5 seconds
- ✅ Common presets (lunch, break, closed)
- ✅ Custom time range option
- ✅ Multi-day blocking (e.g., vacation)
- ✅ Easy to unblock

#### Design: Long-Press with Quick Presets

**WINNER: Long-Press + Quick Presets**

**Why**: Feels like drawing a line through paper book (strikethrough)

**Flow**:

```
┌─────────────────────────────┐
│ 11:00 _____________________ │
│ 12:00 _____________________ │ ← User long-presses (500ms)
│ 13:00 _____________________ │
└─────────────────────────────┘

[LONG-PRESS 12:00]
→ Haptic feedback (medium impact)
→ Slot highlights with gray border
→ Popup appears instantly

┌─────────────────────────────┐
│ 12:00 [████████████]       │ ← Slot highlighted
│       │ Zeit blockieren?   │
│       │                    │
│       │ 🍽️ Mittagspause   │ ← 12:00-13:00
│       │    (1 Stunde)      │
│       │                    │
│       │ ☕ Kurze Pause    │ ← 12:00-12:30
│       │    (30 Min)        │
│       │                    │
│       │ 🚪 Geschlossen    │ ← Rest of day
│       │    (bis Feierabend)│
│       │                    │
│       │ ⚙️ Eigene Zeit... │ ← Custom range
│       └────────────────────┘
└─────────────────────────────┘

[TAPS "🍽️ Mittagspause"]
→ Popup closes (100ms)
→ 12:00-13:00 slots turn gray with striped pattern
→ Label appears: "MITTAGSPAUSE"
→ Toast: "12:00-13:00 blockiert"
→ Haptic success feedback

Total time: ~3 seconds!
```

**Custom Time Range**:

```
[TAPS "⚙️ Eigene Zeit..."]

┌─────────────────────────────┐
│ Zeit blockieren             │
│                             │
│ Von                        │
│ [12:00] ▼                  │ ← Time picker
│                             │
│ Bis                        │
│ [14:00] ▼                  │
│                             │
│ Grund (optional)           │
│ [Arzttermin__________]     │
│                             │
│ [Blockieren]               │
└─────────────────────────────┘
```

**Multi-Day Block (Vacation)**:

```
[Long-press + drag across days in week view]

┌────────────────────────────────────┐
│      Mo  Di  Mi  Do  Fr  Sa  So   │
├────────────────────────────────────┤
│ 09:00 [████████████████████]      │ ← Dragged selection
│ 10:00 [████████████████████]      │
│ ...                                │
└────────────────────────────────────┘

→ Popup: "4 Tage blockieren (Mo-Do)?"
→ [🏖️ Urlaub] [🏥 Krankheit] [⚙️ Eigener Grund]
```

**Unblock Flow**:

```
┌─────────────────────────────┐
│ 12:00 ╳╳ MITTAGSPAUSE ╳╳   │ ← User taps blocked slot
└─────────────────────────────┘

[TAPS blocked slot]
→ Popup appears

┌─────────────────────────────┐
│ Blockierung aufheben?      │
│                             │
│ MITTAGSPAUSE               │
│ 12:00 - 13:00              │
│                             │
│ [Aufheben] [Bearbeiten]    │
└─────────────────────────────┘

[TAPS "Aufheben"]
→ Gray striped pattern disappears
→ Slots become white/available again
→ Toast: "Blockierung entfernt"
```

#### Component Specification

```typescript
// components/terminbuch/QuickBlockPopover.tsx
"use client"

import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface QuickBlockPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeSlot: {
    date: Date
    time: string
  }
}

// Preset time blocks
const PRESETS = [
  {
    id: "lunch",
    emoji: "🍽️",
    label: "Mittagspause",
    duration: 60, // minutes
    icon: "🍽️"
  },
  {
    id: "short-break",
    emoji: "☕",
    label: "Kurze Pause",
    duration: 30
  },
  {
    id: "closed",
    emoji: "🚪",
    label: "Geschlossen",
    duration: "end-of-day" // special value
  }
] as const

export function QuickBlockPopover({
  open,
  onOpenChange,
  timeSlot
}: QuickBlockPopoverProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customEnd, setCustomEnd] = useState("")
  const [customReason, setCustomReason] = useState("")
  const { toast } = useToast()

  const handlePresetBlock = async (preset: typeof PRESETS[0]) => {
    try {
      // Calculate end time based on preset
      const startTime = timeSlot.time
      let endTime: string

      if (preset.duration === "end-of-day") {
        endTime = "19:00" // Studio closing time
      } else {
        // Add duration minutes to start time
        const [hours, minutes] = startTime.split(":").map(Number)
        const endMinutes = minutes + preset.duration
        const endHours = hours + Math.floor(endMinutes / 60)
        endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
      }

      // Create block via Server Action
      await blockTimeSlot({
        date: timeSlot.date,
        startTime,
        endTime,
        reason: preset.label
      })

      toast({
        title: "Zeit blockiert",
        description: `${preset.label}: ${startTime}-${endTime} Uhr`
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Blockierung konnte nicht gespeichert werden",
        variant: "destructive"
      })
    }
  }

  const handleCustomBlock = async () => {
    // Custom block logic
    // ...
  }

  if (showCustom) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Zeit blockieren</h3>
              <p className="text-sm text-muted-foreground">
                Eigene Zeitspanne
              </p>
            </div>

            <div className="space-y-2">
              <Label>Von</Label>
              <Input value={timeSlot.time} disabled />
            </div>

            <div className="space-y-2">
              <Label>Bis</Label>
              <Select value={customEnd} onValueChange={setCustomEnd}>
                <SelectTrigger>
                  <SelectValue placeholder="Endzeit wählen" />
                </SelectTrigger>
                <SelectContent>
                  {/* Generate time slots */}
                  <SelectItem value="12:30">12:30</SelectItem>
                  <SelectItem value="13:00">13:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  {/* etc. */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grund (optional)</Label>
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="z.B. Arzttermin"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCustom(false)}
                className="flex-1"
              >
                Zurück
              </Button>
              <Button
                onClick={handleCustomBlock}
                className="flex-1"
              >
                Blockieren
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent className="w-72">
        <div className="space-y-1">
          <h3 className="font-medium mb-3">Zeit blockieren?</h3>

          {PRESETS.map(preset => (
            <Button
              key={preset.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handlePresetBlock(preset)}
            >
              <span className="text-xl mr-3">{preset.emoji}</span>
              <div className="text-left">
                <p className="font-medium">{preset.label}</p>
                <p className="text-xs text-muted-foreground">
                  {preset.duration === "end-of-day"
                    ? "bis Feierabend"
                    : `${preset.duration} Min`}
                </p>
              </div>
            </Button>
          ))}

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowCustom(true)}
          >
            <span className="text-xl mr-3">⚙️</span>
            <div className="text-left">
              <p className="font-medium">Eigene Zeit...</p>
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Feature 3: Calendar Views (Day/Week)

#### Responsive Strategy

| Screen Size | Default View | Toggle Available | Rationale |
|-------------|--------------|------------------|-----------|
| **Mobile (< 640px)** | Day only | No | Screen too small for week, focus on today |
| **Tablet (640-1024px)** | Day | Yes | User can toggle day/week as needed |
| **Desktop (> 1024px)** | Week | Yes | More screen space, overview preferred |

#### Mobile Day View (Primary Interface)

```
┌─────────────────────────────┐
│ ← Do, 30. Okt →    📅  [+] │ ← Swipe to navigate days
├─────────────────────────────┤
│ 6 Termine heute             │ ← Summary
├─────────────────────────────┤
│ 08:00 _____________________ │
│                             │
│ 09:00 ┌─────────────────┐  │
│       │ Sabine K.       │  │ ← Tap to view/edit
│       │ Meridian-Massage│  │
│       │ ☎ Anrufen       │  │ ← Quick action
│       └─────────────────┘  │
│                             │
│ 10:00 │ (Fortsetzung)   │  │ ← Continuation of 90min service
│       └─────────────────┘  │
│                             │
│ 11:00 _____________________ │ ← Empty, tap to add
│                             │
│ 12:00 ┌═════════════════┐  │
│       ║ MITTAGSPAUSE    ║  │ ← Blocked time (striped)
│       └═════════════════┘  │
│                             │
│ 13:00 _____________________ │
│                             │
│ 14:00 ┌─────────────────┐  │
│       │ Max M.          │  │
│       │ Thai Massage    │  │
│       │ ⚠️ Neukunde     │  │ ← Warning badge
│       └─────────────────┘  │
│                             │
│ 15:00 _____________________ │
│                             │
└─────────────────────────────┘
     [Heute] [Woche]          ← Bottom nav (optional)
```

**Visual Specifications**:

- **Time slots**: 15-minute increments (show every hour, subdivide on zoom)
- **Empty slots**: Light gray border, dashed
- **Booked slots**: White background, solid border, shadow
- **Blocked slots**: Gray background, diagonal stripes pattern
- **Continuation slots**: Lighter shade, italic text
- **Past times**: 50% opacity, not interactive
- **Current time**: Red horizontal line across calendar

**Interaction States**:

```typescript
// Appointment Card States
enum AppointmentState {
  PENDING = "pending",      // Light yellow border - needs confirmation
  CONFIRMED = "confirmed",  // Green border - customer confirmed
  COMPLETED = "completed",  // Gray background - already happened
  CANCELLED = "cancelled",  // Red strikethrough text
  NO_SHOW = "no-show"       // Red background - didn't show up
}

// Visual representation
<Card
  className={cn(
    "relative",
    state === "pending" && "border-amber-400 border-2",
    state === "confirmed" && "border-green-500",
    state === "completed" && "bg-muted opacity-75",
    state === "cancelled" && "opacity-50",
    state === "no-show" && "bg-red-50 border-red-400"
  )}
>
  {state === "cancelled" && (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-0.5 w-full bg-red-500 rotate-[-15deg]" />
    </div>
  )}
  {/* Content */}
</Card>
```

#### Desktop Week View

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Woche 44 →            [Tag] [Woche]               [Heute]  [+]  │
├────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────────┤
│Zeit│ Mo 28   │ Di 29   │ Mi 30   │ Do 31   │ Fr 1    │ Sa 2    So│
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│    │         │         │         │ ◄ HEUTE │         │            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│08:00│        │         │         │         │         │            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│09:00│        │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │            │
│    │         │ │ S.K.│ │ │ M.M.│ │ │ S.K.│ │ │ P.L.│ │            │
│    │         │ │ Mer.│ │ │ Thai│ │ │ Mer.│ │ │ Fuß │ │            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│10:00│        │ └─────┘ │         │ └─────┘ │         │            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│11:00│ ┌─────┐│         │         │         │         │            │
│    │ │ A.S.│ │         │         │         │         │            │
│    │ │ Öl  │ │         │         │         │         │            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│12:00│ [═══════════════ MITTAGSPAUSE ═══════════════]│            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│13:00│         │         │         │         │         │            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│14:00│         │         │ ┌─────┐ │         │         │            │
│    │         │         │ │ K.L.│ │         │         │            │
│    │         │         │ │ Thai│ │         │         │            │
├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│15:00│         │         │ └─────┘ │         │         │            │
└────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────────┘

Visual Cues:
- Hover over cell: Highlight + "Klicken zum Buchen"
- Hover over appointment: Show full name tooltip + quick actions
- Today column: Light blue background tint
- Current time: Thick red horizontal line
- Weekend columns: Light gray background (if studio closed)
```

**Compact Display Strategy**:

Week view shows **initials only** to fit more information:

| Full (Day View) | Compact (Week View) |
|-----------------|---------------------|
| Sabine K. - Meridian-Massage | S.K. - Mer. |
| Max Müller - Thai Massage | M.M. - Thai |
| Peter Lang - Fußreflexzone | P.L. - Fuß |

**Hover Tooltip** (on week view cards):
```
┌─────────────────────────┐
│ Sabine Krüger          │
│ Meridian-Massage        │
│ 09:00 - 10:30 (90 Min)  │
│                         │
│ ☎ 0176 123 456         │
│ Stammkunde (42x)       │
│                         │
│ [Bearbeiten] [Anrufen] │
└─────────────────────────┘
```

#### Component Specification

```typescript
// components/terminbuch/CalendarView.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react"
import { DayView } from "./DayView"
import { WeekView } from "./WeekView"
import { QuickAddSheet } from "./QuickAddSheet"

export function CalendarView() {
  const [view, setView] = useState<"day" | "week">("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null)

  const navigatePrevious = () => {
    if (view === "day") {
      // Go to previous day
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))
    } else {
      // Go to previous week
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))
    }
  }

  const navigateNext = () => {
    if (view === "day") {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleSlotClick = (date: Date, time: string) => {
    setSelectedSlot({ date, time })
    setQuickAddOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigatePrevious}
            aria-label="Zurück"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {view === "day"
              ? currentDate.toLocaleDateString("de-DE", {
                  weekday: "short",
                  day: "numeric",
                  month: "long"
                })
              : `Woche ${getWeekNumber(currentDate)}`
            }
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={navigateNext}
            aria-label="Weiter"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle (hidden on mobile) */}
          <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")} className="hidden sm:block">
            <TabsList>
              <TabsTrigger value="day">Tag</TabsTrigger>
              <TabsTrigger value="week">Woche</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" onClick={goToToday}>
            Heute
          </Button>

          <Button onClick={() => setQuickAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neu
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {view === "day" ? (
          <DayView
            date={currentDate}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <WeekView
            weekStart={currentDate}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      {/* Quick Add Sheet */}
      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        timeSlot={selectedSlot || { date: new Date(), time: "09:00" }}
        recentCustomers={[]} // Pass from server
        services={[]} // Pass from server
      />
    </div>
  )
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
```

### Feature 4: Floating Action Button (FAB)

#### Design Decision: Context-Aware FAB

**Mobile**: Always visible FAB (bottom-right)
**Desktop**: Hidden (use header "+ Neu" button instead)

```
Mobile:
┌─────────────────────────────┐
│                             │
│   [Day View Calendar]       │
│                             │
│                             │
│                             │
│                             │
│                        [🟢+]│ ← FAB (56x56px)
│                             │
└─────────────────────────────┘
     ^^^ Bottom nav if needed

Desktop:
┌──────────────────────────────────┐
│ Header [Tag][Woche] [Heute][+Neu]│ ← No FAB needed
├──────────────────────────────────┤
│                                  │
│   [Week View Calendar]           │
│                                  │
└──────────────────────────────────┘
```

**FAB Interaction**:

```typescript
// Simple: Single tap opens quick-add
[Tap FAB]
→ Opens QuickAddSheet at next available slot

// Advanced: Long-press shows radial menu
[Long-press FAB for 500ms]
→ Haptic feedback
→ Mini FABs appear around main FAB

        [📅]  ← Termin buchen
          |
    [🚫]─[+]─[📊] ← Statistik
          |
        [⚙️]  ← Einstellungen
```

Component:

```typescript
// components/terminbuch/FAB.tsx
"use client"

import { Plus, Calendar, Ban, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function FloatingActionButton({
  onNewAppointment,
  onBlockTime,
  onViewStats,
  onSettings
}: {
  onNewAppointment: () => void
  onBlockTime: () => void
  onViewStats?: () => void
  onSettings?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 sm:hidden z-50">
      {/* Expanded mini FABs */}
      {expanded && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={() => {
              onNewAppointment()
              setExpanded(false)
            }}
          >
            <Calendar className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={() => {
              onBlockTime()
              setExpanded(false)
            }}
          >
            <Ban className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-transform",
          expanded && "rotate-45"
        )}
        onClick={() => {
          if (!expanded) {
            onNewAppointment() // Single tap = quick add
          }
        }}
        onMouseDown={(e) => {
          // Long-press detection
          const timer = setTimeout(() => {
            setExpanded(true)
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(50)
            }
          }, 500)

          const cancel = () => {
            clearTimeout(timer)
            document.removeEventListener("mouseup", cancel)
            document.removeEventListener("touchend", cancel)
          }

          document.addEventListener("mouseup", cancel)
          document.addEventListener("touchend", cancel)
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Backdrop (closes expanded state) */}
      {expanded && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setExpanded(false)}
        />
      )}
    </div>
  )
}
```

---

## PART 3: DASHBOARD EVALUATION

### Current Dashboard Analysis

**Question**: Does the current `/dashboard/owner/page.tsx` align with "Stift & Papier" philosophy?

**Answer**: Need to see current implementation, but likely TOO COMPLEX.

**Problem with typical dashboards**:
- Too many metrics (bookings, revenue, ratings, etc.)
- Too many actions (approve, decline, reschedule, etc.)
- Too many sections (pending, today, upcoming, past, etc.)
- Information overload

### Proposed: "Terminbuch Startseite" (Appointment Book Home)

**Philosophy**: Like opening a paper appointment book - you see TODAY first.

```
┌─────────────────────────────────────┐
│ Guten Morgen, Maria! ☀️            │ ← Personalized greeting
├─────────────────────────────────────┤
│                                     │
│ Heute - Donnerstag, 30. Oktober    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔔 2 unbestätigte Buchungen     │ │ ← Needs attention (yellow)
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Als Nächstes:                   │ │
│ │                                 │ │
│ │ 09:00 - Sabine Krüger          │ │ ← Next appointment (large)
│ │ Meridian-Massage (90 Min)       │ │
│ │                                 │ │
│ │ [✓ Bestätigt] [☎ Anrufen]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📅 Heute insgesamt: 6 Termine      │
│ 🚫 Pause: 12:00-13:00              │
│ ⏰ Letzter Termin: 18:00           │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ Zum Kalender →                │  │ ← Primary CTA
│ └───────────────────────────────┘  │
│                                     │
│ ──────────────────────────────────  │
│                                     │
│ Letzte Aktivität:                  │
│ • Max M. gebucht (vor 12 Min)      │
│ • Anna S. abgesagt (vor 2 Std)     │
│ • Sabine K. bestätigt (vor 3 Std)  │
│                                     │
└─────────────────────────────────────┘

Bottom Nav:
[🏠 Start] [📅 Kalender] [👤 Kunden] [⚙️ Mehr]
```

**Even Simpler Version** (ultra-minimal):

```
┌─────────────────────────────────────┐
│ Dein Terminbuch 📖                 │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────┐  │
│ │                               │  │
│ │  HEUTE ANSEHEN                │  │ ← Huge button
│ │                               │  │
│ │  6 Termine geplant            │  │
│ │  2 brauchen Bestätigung       │  │
│ │                               │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─────────────┐ ┌─────────────┐   │
│ │             │ │             │   │
│ │ Neuer       │ │ Zeit        │   │ ← Secondary actions
│ │ Termin      │ │ blockieren  │   │
│ │             │ │             │   │
│ └─────────────┘ └─────────────┘   │
│                                     │
│ Zuletzt gebucht:                   │
│ • Max M. (vor 12 Min)              │
│ • Anna S. (vor 2 Std)              │
│ • Peter L. (heute Morgen)          │
│                                     │
└─────────────────────────────────────┘
```

**Recommendation**:

**REPLACE current dashboard** with ultra-simple "Terminbuch Startseite".

**Rationale**:
1. **Paper book analogy**: When you open a paper book, you see TODAY's page
2. **Zero cognitive load**: One big button = "HEUTE ANSEHEN"
3. **Action-focused**: Only show what needs action (unconfirmed bookings)
4. **Quick glance**: Stats in one line (6 Termine, 2 unbestätigt)
5. **Faster workflow**: Fewer taps to get to calendar (main tool)

Component:

```typescript
// app/dashboard/owner/page.tsx
import { Suspense } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Ban } from "lucide-react"
import Link from "next/link"
import { getTodayStats, getUpcomingAppointments, getRecentActivity } from "@/lib/queries"

export default async function DashboardPage() {
  const [stats, upcoming, activity] = await Promise.all([
    getTodayStats(),
    getUpcomingAppointments(1), // Next 1 appointment
    getRecentActivity(3) // Last 3 bookings
  ])

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Guten Morgen, {stats.ownerName}! ☀️
        </h1>
      </div>

      {/* Unconfirmed bookings alert */}
      {stats.unconfirmedCount > 0 && (
        <Card className="mb-6 border-amber-400 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium">
              🔔 {stats.unconfirmedCount} unbestätigte {stats.unconfirmedCount === 1 ? "Buchung" : "Buchungen"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next appointment */}
      {upcoming.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Als Nächstes:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xl font-bold">
                {upcoming[0].time} - {upcoming[0].customerName}
              </p>
              <p className="text-muted-foreground">
                {upcoming[0].serviceName} ({upcoming[0].duration} Min)
              </p>
              <div className="flex gap-2 mt-4">
                {!upcoming[0].confirmed && (
                  <Button size="sm" variant="outline">
                    ✓ Bestätigen
                  </Button>
                )}
                <Button size="sm" variant="ghost">
                  ☎ Anrufen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p>📅 Heute insgesamt: <strong>{stats.totalToday} Termine</strong></p>
            {stats.blockedTime && (
              <p>🚫 Pause: {stats.blockedTime}</p>
            )}
            {stats.lastAppointmentTime && (
              <p>⏰ Letzter Termin: {stats.lastAppointmentTime}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <Link href="/dashboard/terminbuch">
        <Button size="lg" className="w-full mb-6">
          <Calendar className="mr-2 h-5 w-5" />
          Zum Kalender
        </Button>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/terminbuch?action=new">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Termin
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/terminbuch?action=block">
            <Ban className="mr-2 h-4 w-4" />
            Zeit blockieren
          </Link>
        </Button>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Letzte Aktivität</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {activity.map(item => (
              <li key={item.id} className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{item.description}</span>
                <span className="text-muted-foreground text-xs ml-auto">
                  {item.timeAgo}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## PART 4: EDGE CASES & SOLUTIONS

### 1. New Customer (Not in System)

**Scenario**: Walk-in customer "Anna Schmidt", name not in dropdown

**Solution**: Auto-suggest "Als Neukunde anlegen"

```
[User types "Anna"]
→ No matches
→ Shows:

┌─────────────────────────────┐
│ "Anna" nicht gefunden       │
│                             │
│ [➕ Anna als Neukunde      │
│     anlegen]                │
└─────────────────────────────┘

[Taps "Als Neukunde anlegen"]
→ Expands form:

┌─────────────────────────────┐
│ Neukunde anlegen            │
│                             │
│ Name*                      │
│ [Anna Schmidt________]      │
│                             │
│ Telefon (empfohlen)        │
│ [0176 ___________]          │
│                             │
│ E-Mail (optional)          │
│ [_________________]         │
│                             │
│ [Anlegen + Termin buchen]  │
└─────────────────────────────┘
```

**Key decision**: Don't force phone/email input - allow skipping.

### 2. Service List Too Long

**Problem**: Studio offers 20+ service types, hard to scroll

**Solution**: Search + Favorites + Recent

```
┌─────────────────────────────┐
│ Massage wählen              │
│                             │
│ [🔍 Suche___________]       │ ← Type to filter
│                             │
│ ⭐ Favoriten               │
│ • Thai Massage (60 Min)     │ ← Most used (80%)
│ • Öl Massage (90 Min)       │
│ • Meridian-Massage (90 Min) │
│                             │
│ 🕐 Zuletzt verwendet       │
│ • Fußreflexzone (45 Min)    │
│ • Hot Stone (120 Min)       │
│                             │
│ 📋 Alle Massagen (18)      │ ← Expandable
│                             │
└─────────────────────────────┘
```

**Auto-favorite logic**:
- Track service usage per customer
- Auto-select most common service (e.g., Sabine always books Meridian)
- Studio-wide: Show top 3 most booked services as favorites

### 3. Overlapping Bookings

**Problem**: User taps 14:00 slot, but 13:30-15:00 already booked

**Solution**: Show warning + suggest alternatives

```
[User taps 14:00]

┌─────────────────────────────┐
│ ⚠️ Zeit teilweise belegt    │
│                             │
│ 13:30-15:00 bereits:        │
│ Max M. - Thai Massage       │
│                             │
│ Trotzdem buchen?           │
│ (bei 2 Massage-Räumen)     │
│                             │
│ [Trotzdem buchen]          │
│                             │
│ ──── ODER ────             │
│                             │
│ Nächste freie Slots:       │
│ • 15:00 Uhr (heute)         │
│ • 11:00 Uhr (morgen)        │
│                             │
│ [Abbrechen]                 │
└─────────────────────────────┘
```

**Business logic**:
- If studio has 2+ massage rooms: Allow overlapping bookings
- If single room: Prevent overlap, suggest alternatives
- Setting in studio config: "Maximale parallele Termine: 1/2/3"

### 4. Past Time Slots

**Problem**: It's 10:00, user tries to book 09:00 appointment

**Solutions**:

**Option A - Prevent**:
```
[User taps 09:00 - already passed]
→ Slot is grayed out, not clickable
→ Tooltip: "Zeit liegt in der Vergangenheit"
```

**Option B - Allow (for walk-ins)**:
```
[User taps 09:00]

┌─────────────────────────────┐
│ ⚠️ Zeit liegt in der        │
│    Vergangenheit            │
│                             │
│ 09:00 war vor 1 Stunde      │
│                             │
│ Trotzdem eintragen?        │
│ (für bereits anwesende      │
│  Walk-in Kunden)           │
│                             │
│ [Ja, eintragen]            │
│ [Abbrechen]                 │
└─────────────────────────────┘
```

**Recommendation**: **Option B** (allow with warning)

**Rationale**: Real-world scenario = Walk-in customer arrives at 09:05, owner wants to log appointment for record-keeping.

### 5. Offline Mode

**Problem**: Internet connection lost, app unusable

**Solution**: Progressive Web App (PWA) with offline support

**Technical Implementation**:

```typescript
// lib/offline-storage.ts
import { openDB, DBSchema } from "idb"

interface TerminbuchDB extends DBSchema {
  appointments: {
    key: string
    value: {
      id: string
      date: string
      time: string
      customerName: string
      serviceId: string
      status: "pending" | "confirmed"
      syncStatus: "synced" | "pending" | "failed"
      createdAt: string
      updatedAt: string
    }
  }
  customers: {
    key: string
    value: {
      id: string
      name: string
      phone: string
      email: string
    }
  }
  services: {
    key: string
    value: {
      id: string
      name: string
      duration: number
    }
  }
}

// Open IndexedDB connection
const db = await openDB<TerminbuchDB>("terminbuch", 1, {
  upgrade(db) {
    db.createObjectStore("appointments", { keyPath: "id" })
    db.createObjectStore("customers", { keyPath: "id" })
    db.createObjectStore("services", { keyPath: "id" })
  }
})

// Save appointment offline
export async function saveAppointmentOffline(appointment: Appointment) {
  await db.put("appointments", {
    ...appointment,
    syncStatus: "pending"
  })
}

// Sync when back online
window.addEventListener("online", async () => {
  const pendingAppointments = await db.getAll("appointments")
  const unsynced = pendingAppointments.filter(a => a.syncStatus === "pending")

  for (const appointment of unsynced) {
    try {
      await syncToServer(appointment)
      await db.put("appointments", {
        ...appointment,
        syncStatus: "synced"
      })
    } catch (error) {
      await db.put("appointments", {
        ...appointment,
        syncStatus: "failed"
      })
    }
  }
})
```

**UI Indicators**:

```
Offline banner:
┌─────────────────────────────┐
│ 📡 Offline-Modus           │
│ Änderungen werden später    │
│ synchronisiert              │
└─────────────────────────────┘

Unsync appointment indicator:
┌─────────────────────────────┐
│ 14:00 Max M. - Thai        │
│ ⏳ Wird synchronisiert...  │ ← Pending sync
└─────────────────────────────┘

Failed sync:
┌─────────────────────────────┐
│ 14:00 Max M. - Thai        │
│ ⚠️ Sync fehlgeschlagen     │ ← Tap to retry
└─────────────────────────────┘
```

**Offline Capabilities**:

✅ **Allowed offline**:
- View today's appointments (cached)
- View this week's appointments (cached)
- Add new appointments (queued for sync)
- Edit appointments (queued for sync)
- Block time (queued for sync)
- View customer list (cached)

❌ **NOT allowed offline**:
- View past appointments (not cached)
- Search customers (requires server)
- View statistics/reports (requires server)

---

## PART 5: INTERACTION DESIGN PRINCIPLES

### "Stift & Papier" Design System

#### 1. Visual Language

**Color Palette** (inspired by paper appointment books):

```css
/* Base (Paper) */
--paper-white: #FAFAF9;
--paper-lines: #E5E5E5; /* Grid lines */
--ink-black: #1C1C1C;   /* Handwriting */

/* Functional Colors */
--free-slot: #FFFFFF;            /* Empty, available */
--booked-slot: #F0F9FF;          /* Light blue - filled */
--blocked-slot: #F5F5F4;         /* Gray - unavailable */
--past-slot: #FAFAF9;            /* Faded - already happened */
--current-time: #EF4444;         /* Red line - NOW */

/* Status Colors */
--pending: #FEF3C7;      /* Yellow - needs confirmation */
--confirmed: #D1FAE5;    /* Green - confirmed */
--cancelled: #FEE2E2;    /* Red - cancelled */
--no-show: #FECACA;      /* Dark red - didn't show up */

/* Accents */
--primary: #2563EB;      /* Blue - CTAs */
--success: #16A34A;      /* Green - success feedback */
--warning: #F59E0B;      /* Amber - warnings */
--destructive: #DC2626;  /* Red - delete actions */
```

**Typography** (readable, not handwriting):

```css
/* NOT handwriting fonts - too gimmicky, hard to read */
/* Use clean, professional fonts */

--font-sans: "Inter", system-ui, sans-serif;
--font-display: "Inter", sans-serif;

/* Sizes */
--text-xs: 0.75rem;    /* 12px - helper text */
--text-sm: 0.875rem;   /* 14px - body text */
--text-base: 1rem;     /* 16px - default */
--text-lg: 1.125rem;   /* 18px - emphasis */
--text-xl: 1.25rem;    /* 20px - headings */
--text-2xl: 1.5rem;    /* 24px - page titles */
```

**Visual Elements**:

```
Grid Lines (subtle):
┌─────────────────────────────┐
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ← 15-minute subdivisions
│                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Hour mark (bold)
└─────────────────────────────┘

Strikethrough (cancelled):
┌─────────────────────────────┐
│ 14:00 Max M. - Thai        │
│ ━━━━━━━━━━━━━━━━━━━━━━━  │ ← Red line through
└─────────────────────────────┘

Blocked time (hatched):
┌─────────────────────────────┐
│ ╱╱╱╱╱ MITTAGSPAUSE ╱╱╱╱╱  │ ← Diagonal lines
└─────────────────────────────┘
```

**CSS Implementation**:

```css
/* Appointment card */
.appointment-card {
  background: white;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 150ms ease-out;
}

.appointment-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* Blocked time slot */
.time-slot-blocked {
  background:
    repeating-linear-gradient(
      45deg,
      #F5F5F4,
      #F5F5F4 10px,
      #E7E5E4 10px,
      #E7E5E4 20px
    );
  opacity: 0.7;
}

/* Cancelled appointment */
.appointment-cancelled {
  position: relative;
  opacity: 0.6;
}

.appointment-cancelled::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #DC2626;
  transform: rotate(-8deg);
}

/* Current time indicator */
.current-time-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #EF4444;
  z-index: 10;
}

.current-time-line::before {
  content: "";
  position: absolute;
  left: 0;
  top: -4px;
  width: 10px;
  height: 10px;
  background: #EF4444;
  border-radius: 50%;
}
```

#### 2. Interaction Patterns

**Tap Targets** (mobile-optimized):

```
Minimum tap target: 44x44px (Apple HIG)
Recommended: 48x48px (Material Design)

Time slot height: 60px (for 15-min slots)
→ 4 slots per hour = 240px per hour
→ Easily tappable on mobile

Button height:
- Default: 40px
- Large (primary): 48px
- Icon only: 44x44px
```

**Gestures**:

| Gesture | Action | Feedback |
|---------|--------|----------|
| **Single tap** | Select slot / Open appointment | Haptic light, visual highlight |
| **Long-press (500ms)** | Block time / Quick actions | Haptic medium, popup appears |
| **Swipe left/right** | Navigate days (like flipping pages) | Page transition animation |
| **Swipe down** | Refresh appointments | Pull-to-refresh animation |
| **Pinch (optional)** | Zoom time scale (future feature) | - |

**Drag & Drop** (desktop):

```
[User drags appointment card]
→ Card lifts (shadow increases)
→ Valid drop zones highlight (green border)
→ Invalid zones show red border
→ On drop: Confirmation toast
→ On cancel (Esc): Card snaps back
```

**Keyboard Shortcuts** (desktop power users):

```
C or N    = Create new appointment
B         = Block time
T         = Go to today
←/→       = Navigate days
Shift+←/→ = Navigate weeks
/         = Focus search
Esc       = Close dialog/sheet
Enter     = Submit form
```

#### 3. Feedback & Animations

**Animation Speed** (feel instant, not sluggish):

```css
/* Fast transitions (feel instant) */
--duration-instant: 100ms;  /* Hover effects */
--duration-fast: 150ms;     /* Button clicks, sheet close */
--duration-normal: 200ms;   /* Sheet open, page transitions */
--duration-slow: 300ms;     /* Emphasis animations */

/* Easing functions */
--ease-out: cubic-bezier(0, 0, 0.2, 1);     /* Entering */
--ease-in: cubic-bezier(0.4, 0, 1, 1);      /* Exiting */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Both */
```

**Haptic Feedback** (mobile):

```typescript
// Utility functions
function hapticLight() {
  if (navigator.vibrate) {
    navigator.vibrate(10) // Light tap
  }
}

function hapticMedium() {
  if (navigator.vibrate) {
    navigator.vibrate(20) // Selection
  }
}

function hapticHeavy() {
  if (navigator.vibrate) {
    navigator.vibrate([20, 10, 20]) // Success/error
  }
}

// Usage
button.addEventListener("click", () => {
  hapticLight()
  // ... action
})

longPressDetected(() => {
  hapticMedium() // User knows long-press registered
})

appointmentCreated(() => {
  hapticHeavy() // Success confirmation
})
```

**Sound Effects** (optional, off by default):

```typescript
// Subtle sounds (can be disabled in settings)
const sounds = {
  tap: new Audio("/sounds/tap.mp3"),         // Button click
  success: new Audio("/sounds/success.mp3"), // Booking created
  flip: new Audio("/sounds/page-flip.mp3"),  // Day navigation
  error: new Audio("/sounds/error.mp3")      // Validation error
}

// Play sound with volume control
function playSound(sound: keyof typeof sounds, volume = 0.3) {
  const audio = sounds[sound]
  audio.volume = volume
  audio.play()
}

// Usage
createAppointment().then(() => {
  playSound("success")
  hapticHeavy()
})
```

**Loading States** (optimistic UI):

```
Optimistic UI principle:
1. Show change immediately (assume success)
2. If server confirms: Keep change
3. If server rejects: Rollback + show error

Example: Create appointment
┌─────────────────────────────┐
│ 14:00 Max M. - Thai        │ ← Appears immediately
│       ⏳ Speichert...      │ ← Small indicator
└─────────────────────────────┘

[After 200ms - server response]
→ Success: Indicator disappears
→ Error: Card shakes, shows error toast
```

**Error States**:

```
Form validation error:
┌─────────────────────────────┐
│ Name                       │
│ [_____________________]    │ ← Red border
│ ⚠️ Name ist erforderlich   │ ← Error message
└─────────────────────────────┘

Network error:
┌─────────────────────────────┐
│ ⚠️ Verbindungsfehler       │
│ Termin konnte nicht         │
│ gespeichert werden          │
│                             │
│ [Erneut versuchen]         │
└─────────────────────────────┘

Conflict error:
┌─────────────────────────────┐
│ ⚠️ Slot bereits belegt     │
│ 14:00 wurde gerade von      │
│ jemand anderem gebucht      │
│                             │
│ Nächste freie Zeit: 15:00  │
│ [15:00 buchen]             │
└─────────────────────────────┘
```

**Success States**:

```
Toast notification (bottom-center):
┌─────────────────────────────┐
│ ✓ Termin gebucht           │ ← Green background
│ Max M. - 14:00 Uhr         │
│                             │
│ [Rückgängig]  [×]          │ ← Undo option!
└─────────────────────────────┘
Auto-dismiss after 5 seconds

Confetti animation (optional, for first booking):
→ Burst of colored dots from center
→ Fades out after 1 second
→ Only shows once per session
```

**Undo Functionality** (critical for trust):

```typescript
// Undo stack (last 10 actions)
const undoStack: Action[] = []

// After any destructive action
function performAction(action: Action) {
  // Do the action
  action.execute()

  // Add to undo stack
  undoStack.push(action)

  // Show undo toast
  toast({
    title: action.successMessage,
    action: {
      label: "Rückgängig",
      onClick: () => {
        action.undo()
        toast({
          title: "Rückgängig gemacht"
        })
      }
    },
    duration: 5000 // 5 seconds to undo
  })
}

// Example: Delete appointment
deleteAppointment(id).then(() => {
  performAction({
    execute: () => removeFromUI(id),
    undo: () => restoreToUI(id),
    successMessage: "Termin gelöscht"
  })
})
```

---

## PART 6: IMPLEMENTATION ROADMAP

### Phase 1: MVP (Must-Have for Launch)

**Timeline**: 2-3 weeks

**Features**:
1. ✅ **Mobile Day View**
   - Vertical time slots (08:00-19:00)
   - Tap slot to add appointment
   - View existing appointments
   - Current time indicator
   - Components: DayView, TimeSlot, AppointmentCard

2. ✅ **Quick Add Appointment**
   - Bottom sheet on mobile
   - Customer autocomplete
   - Service selection
   - Auto-save on close
   - Components: QuickAddSheet, CustomerAutocomplete, ServiceSelect

3. ✅ **Quick Block Time**
   - Long-press slot → Popup
   - Preset time blocks (lunch, break, closed)
   - Custom time range
   - Components: QuickBlockPopover

4. ✅ **Simple Dashboard**
   - "HEUTE ANSEHEN" big button
   - Next appointment preview
   - Today's summary stats
   - Recent activity feed
   - Component: DashboardPage

5. ✅ **Basic Customer Management**
   - Add new customer inline (during booking)
   - Customer list view
   - Search customers
   - Components: CustomerForm, CustomerList

**Database Schema** (Prisma):

```prisma
model Studio {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  services     Service[]
  appointments Appointment[]
  customers    Customer[]
  timeBlocks   TimeBlock[]
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  email     String?
  studioId  String
  studio    Studio   @relation(fields: [studioId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  appointments Appointment[]

  @@index([studioId])
  @@index([name]) // For autocomplete search
}

model Service {
  id        String   @id @default(cuid())
  name      String   // "Thai Massage"
  duration  Int      // Minutes (60, 90, 120)
  price     Decimal? // Optional
  studioId  String
  studio    Studio   @relation(fields: [studioId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  appointments Appointment[]

  @@index([studioId])
}

model Appointment {
  id         String   @id @default(cuid())
  studioId   String
  studio     Studio   @relation(fields: [studioId], references: [id])
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  serviceId  String
  service    Service  @relation(fields: [serviceId], references: [id])

  dateTime   DateTime // Start time
  duration   Int      // Minutes (from service)
  status     AppointmentStatus @default(PENDING)
  notes      String?  // Optional notes

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([studioId, dateTime]) // Query appointments by studio + date
  @@index([customerId])
}

enum AppointmentStatus {
  PENDING    // Not yet confirmed
  CONFIRMED  // Confirmed by customer/owner
  COMPLETED  // Already happened
  CANCELLED  // Cancelled
  NO_SHOW    // Customer didn't show up
}

model TimeBlock {
  id        String   @id @default(cuid())
  studioId  String
  studio    Studio   @relation(fields: [studioId], references: [id])

  startTime DateTime
  endTime   DateTime
  reason    String   // "Mittagspause", "Urlaub", etc.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([studioId, startTime, endTime]) // Query blocks by time range
}
```

**MVP Success Criteria**:
- ✅ Studio owner can book appointment in < 10 seconds
- ✅ Works on iPhone SE (375px width)
- ✅ Offline mode for today's appointments
- ✅ Zero training needed (intuitive UI)

### Phase 2: Improvements (Nice-to-Have)

**Timeline**: 1-2 weeks after MVP

**Features**:
1. ✅ **Desktop Week View**
   - Horizontal days (Mon-Sun)
   - Vertical time slots
   - Drag & drop appointments
   - Keyboard shortcuts
   - Component: WeekView

2. ✅ **Customer Details**
   - View appointment history
   - Visit frequency stats
   - Preferred services
   - Notes field
   - Component: CustomerProfile

3. ✅ **Appointment Editing**
   - Tap appointment → Edit
   - Change time (drag-and-drop or picker)
   - Change service
   - Add notes
   - Component: EditAppointmentSheet

4. ✅ **Status Management**
   - Mark as confirmed
   - Mark as no-show
   - Mark as completed
   - Cancel appointment
   - Component: StatusBadge, StatusActions

5. ✅ **Multi-Day Time Blocks**
   - Block vacation dates
   - Block multiple days at once
   - Recurring blocks (e.g., every Monday closed)
   - Component: MultiDayBlockDialog

**Phase 2 Success Criteria**:
- ✅ Studio owner prefers digital over paper after 1 week
- ✅ Can manage appointments on both mobile + desktop
- ✅ Editing appointments is faster than erasing paper

### Phase 3: Advanced Features (Future)

**Timeline**: 1-2 months after MVP

**Features**:
1. ✅ **Customer Notifications**
   - SMS reminders (1 day before)
   - WhatsApp reminders (optional)
   - Email confirmations
   - Integration: Twilio or similar

2. ✅ **Analytics Dashboard**
   - Busiest days/times
   - Most popular services
   - Revenue tracking
   - Customer retention stats
   - Component: AnalyticsDashboard

3. ✅ **Multi-Room Support**
   - Multiple massage rooms
   - Assign appointments to rooms
   - Parallel bookings
   - Room utilization view

4. ✅ **Customer Self-Booking** (optional)
   - Public booking page
   - Customer selects time + service
   - Owner approves booking
   - Integration with existing calendar

5. ✅ **Staff Management** (for larger studios)
   - Multiple staff members
   - Assign appointments to staff
   - Staff availability calendar
   - Permission levels

6. ✅ **Recurring Appointments**
   - Customer books every week (e.g., "Every Monday 14:00")
   - Auto-create appointments
   - Easy to modify/cancel series

**Phase 3 Success Criteria**:
- ✅ Studio owner completely abandons paper book
- ✅ 50% reduction in no-shows (due to reminders)
- ✅ Able to serve 20% more customers (better scheduling)

---

## PART 7: ACCESSIBILITY & USABILITY

### WCAG 2.1 AA Compliance

**Keyboard Navigation**:
- ✅ All interactive elements reachable by Tab
- ✅ Focus indicators visible (2px outline, high contrast)
- ✅ Escape closes dialogs/sheets
- ✅ Enter submits forms
- ✅ Arrow keys navigate time slots (optional enhancement)

**Screen Reader Support**:
```html
<!-- Time slot -->
<button
  aria-label="14:00 Uhr, frei, klicken zum Buchen"
  aria-describedby="slot-14-00-desc"
>
  <span aria-hidden="true">14:00</span>
</button>

<!-- Appointment -->
<div
  role="article"
  aria-label="Termin: Sabine Krüger, Meridian-Massage, 09:00 bis 10:30 Uhr"
>
  <h3>Sabine Krüger</h3>
  <p>Meridian-Massage</p>
  <p>09:00 - 10:30 Uhr (90 Minuten)</p>
</div>

<!-- Status indicator -->
<span
  className="status-badge"
  aria-label="Status: Bestätigt"
  role="status"
>
  ✓
</span>
```

**Color Contrast**:
- ✅ Text: 4.5:1 minimum (WCAG AA)
- ✅ Large text (18pt+): 3:1 minimum
- ✅ Interactive elements: 3:1 against background
- ✅ Don't rely on color alone (use icons + text)

**Touch Targets**:
- ✅ Minimum 44x44px (Apple HIG)
- ✅ Spacing between targets: 8px minimum
- ✅ No accidental taps

**Form Labels**:
```html
<!-- All inputs have labels -->
<Label htmlFor="customer-name">
  Kunde <span className="text-destructive">*</span>
</Label>
<Input id="customer-name" required aria-required="true" />

<!-- Error messages -->
<Input
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-customer-name" : undefined}
/>
{hasError && (
  <p id="error-customer-name" role="alert" className="text-destructive">
    Name ist erforderlich
  </p>
)}
```

### Senior-Friendly Design

**For 60+ year old users**:

1. ✅ **Larger Text**
   - Minimum 16px base font size
   - Can increase to 20px in settings
   - High contrast mode option

2. ✅ **Simpler Language**
   - Avoid jargon ("Synchronisieren" → "Speichern")
   - Clear button labels ("Termin buchen" not just "OK")
   - Confirmation messages ("Termin gebucht für Max M.")

3. ✅ **Fewer Choices**
   - Limit options to 3-5 per screen
   - Use presets instead of custom inputs
   - Progressive disclosure (advanced options hidden)

4. ✅ **Visual Hierarchy**
   - Most important action = largest button
   - Clear headings
   - Sufficient whitespace

5. ✅ **Error Prevention**
   - Undo button for all actions
   - Confirmation only for destructive actions
   - Clear error messages with solutions

6. ✅ **Consistent Patterns**
   - Same interaction for similar tasks
   - Predictable navigation
   - No hidden gestures (swipe is optional, buttons always visible)

---

## PART 8: TESTING PLAN

### Usability Testing

**Test Participants**:
- 3-5 Thai massage studio owners (age 55-70)
- 2-3 salon owners (similar workflow)
- 1-2 non-tech-savvy users (control group)

**Test Scenarios**:

1. **Book an Appointment** (Success: < 15 seconds)
   - "A customer calls and wants to book Thai Massage for tomorrow at 2pm"
   - Observe: How many taps? Any confusion? Errors?

2. **Block Lunch Break** (Success: < 10 seconds)
   - "You want to take lunch break from 12-1pm"
   - Observe: Do they find long-press? Use menu instead?

3. **Edit an Appointment** (Success: < 20 seconds)
   - "Customer calls to reschedule from 2pm to 3pm"
   - Observe: Can they find the appointment? Know how to edit?

4. **View Tomorrow's Schedule** (Success: < 5 seconds)
   - "Show me all appointments for tomorrow"
   - Observe: Do they swipe or use navigation?

5. **Add a New Customer** (Success: < 30 seconds)
   - "A new customer Anna Schmidt calls for first appointment"
   - Observe: Can they create customer while booking?

**Success Metrics**:
- ✅ Task completion rate: 90%+
- ✅ Average time per task: < target time
- ✅ User satisfaction (SUS score): 80+
- ✅ Errors per session: < 2
- ✅ "Would you use this instead of paper?": 80%+ yes

### A/B Testing

**Test Variations**:

**Variant A: Quick Add (Bottom Sheet)**
- Sheet slides from bottom
- Customer dropdown
- Service dropdown
- "Jetzt buchen" button

**Variant B: Quick Add (Inline)**
- Slot expands inline
- Autocomplete input
- Pre-selected service
- Auto-saves on blur

**Metrics**:
- Time to complete booking
- Error rate
- User preference survey

**Hypothesis**: Inline editing (B) will be faster but bottom sheet (A) will have fewer errors.

### Performance Testing

**Metrics**:
| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load (mobile) | < 2 seconds | Lighthouse |
| Time to Interactive | < 3 seconds | Lighthouse |
| Calendar render (100 appointments) | < 500ms | Custom timer |
| Quick-add sheet open | < 200ms | Custom timer |
| Offline mode activate | < 1 second | Custom timer |
| Sync 50 pending appointments | < 5 seconds | Custom timer |

**Load Testing**:
- Simulate 100 concurrent users
- 1000 appointments in database
- Calendar should still load < 2 seconds

### Accessibility Testing

**Tools**:
- ✅ axe DevTools (automated checks)
- ✅ NVDA screen reader (Windows)
- ✅ VoiceOver (macOS/iOS)
- ✅ Keyboard-only navigation
- ✅ Color contrast analyzer

**Manual Tests**:
- Navigate entire app with keyboard only
- Complete booking flow with screen reader
- Test with browser zoom at 200%
- Test with Windows high contrast mode

---

## SUMMARY: DESIGN DECISIONS

### Key Principles

1. **Speed Over Features**
   - Every feature must be < 10 seconds to use
   - If slower than paper, cut it

2. **Mobile-First, Always**
   - Studio owners use phones while answering calls
   - Desktop is secondary

3. **Zero Learning Curve**
   - If you know paper books, you know this app
   - No tutorials, no manuals

4. **Trust Through Familiarity**
   - Visual design mimics paper books
   - Interactions feel "pen-like"
   - Terminology matches paper world

5. **Offline-First Architecture**
   - App works without internet
   - Sync happens in background
   - Never block user actions

### What Makes This Different

**vs. Booksy**:
- ❌ Booksy: Too many features (marketing, payments, reviews)
- ✅ Massava: ONLY appointment booking (laser-focused)

**vs. Square Appointments**:
- ❌ Square: Requires POS system, complex setup
- ✅ Massava: Standalone, works immediately

**vs. Paper Book**:
- ❌ Paper: No backup, no reminders, hard to read
- ✅ Massava: Automatic backup, optional reminders, always legible
- ✅ **BUT KEEPS**: Simplicity, speed, visual overview

### Technical Stack (Recommendation)

**Frontend**:
- Next.js 14 (App Router)
- shadcn/ui components
- Tailwind CSS
- IndexedDB (offline storage)
- PWA (Progressive Web App)

**Backend**:
- Fastify API
- PostgreSQL + Prisma ORM
- Server Actions (Next.js)
- WebSocket (real-time updates, optional)

**Infrastructure**:
- Vercel (frontend hosting)
- Railway/Fly.io (backend hosting)
- Cloudflare (CDN + DDoS protection)

**Third-Party Services** (Phase 3):
- Twilio (SMS reminders)
- Resend (email notifications)
- Stripe (payments, optional)

---

## FILES TO CREATE

Based on this design spec, these files need to be created/modified:

### New Pages
- `/app/dashboard/terminbuch/page.tsx` - Main calendar view
- `/app/dashboard/terminbuch/loading.tsx` - Loading skeleton
- `/app/dashboard/customers/page.tsx` - Customer management
- `/app/dashboard/owner/page.tsx` - Simplified dashboard (redesign)

### New Components
- `/components/terminbuch/CalendarView.tsx` - View switcher
- `/components/terminbuch/DayView.tsx` - Mobile day view
- `/components/terminbuch/WeekView.tsx` - Desktop week view
- `/components/terminbuch/TimeSlot.tsx` - Individual time slot
- `/components/terminbuch/AppointmentCard.tsx` - Appointment display
- `/components/terminbuch/QuickAddSheet.tsx` - Bottom sheet for booking
- `/components/terminbuch/QuickBlockPopover.tsx` - Time blocking popup
- `/components/terminbuch/CustomerAutocomplete.tsx` - Customer search/select
- `/components/terminbuch/ServiceSelect.tsx` - Service selection
- `/components/terminbuch/FAB.tsx` - Floating action button
- `/components/terminbuch/CurrentTimeLine.tsx` - Red time indicator

### New Server Actions
- `/app/actions/appointments.ts` - CRUD operations
- `/app/actions/time-blocks.ts` - Blocking operations
- `/app/actions/customers.ts` - Customer management

### New Utilities
- `/lib/offline-storage.ts` - IndexedDB wrapper
- `/lib/sync-manager.ts` - Offline sync logic
- `/lib/time-utils.ts` - Time slot calculations
- `/lib/appointment-utils.ts` - Business logic

### Database Migrations
- `prisma/migrations/xxx_add_appointments.sql`
- `prisma/migrations/xxx_add_time_blocks.sql`

### Testing
- `__tests__/terminbuch/QuickAddSheet.test.tsx`
- `__tests__/terminbuch/DayView.test.tsx`
- `__tests__/terminbuch/offline-sync.test.ts`

---

**End of Design Specification**

This document serves as the complete design blueprint for the digital Terminbuch system. All development should reference this spec to ensure consistency with the "Stift & Papier Einfachheit" philosophy.
