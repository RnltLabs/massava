# Booking Flow Redesign - Key Code Changes

## Summary of Key File Changes

### 1. BookingSheet.tsx
**Location:** `/app/[locale]/booking/[studioId]/[slotId]/_components/BookingSheet.tsx`

**Key Changes:**
```typescript
// NEW: Added BookingStatus import
import type { Studio, Service, TimeSlot, BookingStatus } from "@/app/generated/prisma"

// CHANGED: Updated type definition (removed "review")
type BookingStep = "service" | "confirm" | "success"

// CHANGED: Updated initial step
const [currentStep, setCurrentStep] = useState<BookingStep>("service")

// NEW: Added booking status state
const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(null)

// CHANGED: Updated step numbering
const getStepNumber = (step: BookingStep): number => {
  const steps = { service: 1, confirm: 2, success: 3 }
  return steps[step]
}

// CHANGED: Updated handleSubmit to capture status
setBookingStatus((result.status as BookingStatus) || null)

// CHANGED: Updated service case in renderStepContent
case "service":
  return (
    <StepService
      services={services}
      selectedServiceId={selectedServiceId}
      onServiceSelect={handleServiceSelect}
      onContinue={handleContinueFromService}
      onCancel={handleCancel}      // Changed from onBack
      timeSlot={timeSlot}           // NEW prop
      studio={studio}               // NEW prop
    />
  )

// CHANGED: Updated success case
case "success":
  return (
    <SuccessState
      bookingNumber={bookingNumber}
      customerEmail={form.getValues("customerEmail")}
      onViewBooking={handleViewBooking}
      onNewSearch={handleNewSearch}
      bookingStatus={bookingStatus}     // NEW prop
      isGuest={!form.getValues("customerId")}  // NEW prop
    />
  )
```

---

### 2. StepService.tsx
**Location:** `/app/[locale]/booking/[studioId]/[slotId]/_components/StepService.tsx`

**Key Changes:**
```typescript
// NEW: Added date-fns and icons
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { X, ChevronRight, Search, Calendar, Clock, MapPin } from "lucide-react"

// CHANGED: Updated interface
interface StepServiceProps {
  services: Service[]
  selectedServiceId: string | null
  onServiceSelect: (serviceId: string) => void
  onContinue: () => void
  onCancel: () => void  // Changed from onBack
  timeSlot: TimeSlot     // NEW
  studio: Studio         // NEW
}

// NEW: Context Badge (shows selected date/time/studio)
<div className="bg-accent/10 border-l-4 border-primary p-3 mb-4 rounded-r-lg">
  <div className="flex items-center gap-2 text-sm">
    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
    <span>{format(startTime, "EEE, dd. MMM yyyy", { locale: de })}</span>
    <span className="text-muted-foreground">•</span>
    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
    <span>{format(startTime, "HH:mm", { locale: de })} Uhr</span>
  </div>
  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
    <MapPin className="h-4 w-4 flex-shrink-0" />
    <span className="truncate">{studio.name}</span>
  </div>
</div>

// CHANGED: Cancel button instead of back button
<Button
  variant="ghost"
  size="icon"
  onClick={onCancel}
  aria-label="Buchung abbrechen"
>
  <X className="h-5 w-5" />
</Button>
```

---

### 3. StepConfirm.tsx
**Location:** `/app/[locale]/booking/[studioId]/[slotId]/_components/StepConfirm.tsx`

**Key Changes:**
```typescript
// NEW: Added imports
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { User } from "lucide-react"

// NEW: Session hook and auth logic
const { data: session, status } = useSession()
const isAuthenticated = status === 'authenticated'

// NEW: Pre-fill form when logged in
useEffect(() => {
  if (session?.user) {
    form.setValue('customerName', session.user.name || '')
    form.setValue('customerEmail', session.user.email || '')
  }
}, [session, form])

// NEW: Auth status alerts (before booking summary)
{isAuthenticated && session?.user && (
  <Alert className="mb-4">
    <User className="h-4 w-4" />
    <AlertTitle>Angemeldet als</AlertTitle>
    <AlertDescription>
      {session.user.name} ({session.user.email})
    </AlertDescription>
  </Alert>
)}

{!isAuthenticated && (
  <Alert className="mb-4">
    <Info className="h-4 w-4" />
    <AlertTitle>Tipp</AlertTitle>
    <AlertDescription>
      <a href="/auth/signin" className="underline font-medium">
        Jetzt anmelden
      </a> für schnellere zukünftige Buchungen
    </AlertDescription>
  </Alert>
)}

// CHANGED: Currency fix (CHF → EUR)
<span className="text-2xl font-bold text-primary">
  €{selectedService.price.toFixed(2)}
</span>

// CHANGED: Make fields read-only when authenticated
<Input
  {...field}
  disabled={isSubmitting || isAuthenticated}
  className={isAuthenticated ? "h-12 bg-muted" : "h-12"}
/>
```

---

### 4. ServiceCard.tsx
**Location:** `/app/[locale]/booking/[studioId]/[slotId]/_components/ServiceCard.tsx`

**Key Changes:**
```typescript
// CHANGED: Currency fix (CHF → EUR)
<p className="text-lg font-bold text-primary">
  €{service.price.toFixed(0)}
</p>
```

---

### 5. SuccessState.tsx
**Location:** `/app/[locale]/booking/[studioId]/[slotId]/_components/SuccessState.tsx`

**Key Changes:**
```typescript
// NEW: Added imports
import type { BookingStatus } from "@/app/generated/prisma"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Info } from "lucide-react"

// CHANGED: Updated interface
interface SuccessStateProps {
  bookingNumber: string
  customerEmail: string
  onViewBooking: () => void
  onNewSearch: () => void
  bookingStatus: BookingStatus | null  // NEW
  isGuest: boolean                     // NEW
}

// NEW: Status-based styling
const isPending = bookingStatus === 'PENDING'

// CHANGED: Dynamic icon with status-based colors
<div
  className={cn(
    "w-20 h-20 rounded-full flex items-center justify-center mb-6",
    isPending ? "bg-amber-100" : "bg-green-100"
  )}
>
  <Check
    className={cn(
      "w-10 h-10",
      isPending ? "text-amber-600" : "text-green-600"
    )}
    strokeWidth={2}
  />
</div>

// NEW: Status-based messaging
{isPending ? (
  <>
    <h2 className="text-2xl font-bold mb-2">
      Buchungsanfrage erhalten!
    </h2>
    <p className="text-muted-foreground mb-6">
      Das Studio wird Ihre Buchung prüfen und sich bei Ihnen melden.
    </p>
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertTitle>Wartet auf Bestätigung</AlertTitle>
      <AlertDescription>
        Ihr Termin ist reserviert und für andere gesperrt.
      </AlertDescription>
    </Alert>
  </>
) : (
  <>
    <h2 className="text-2xl font-bold mb-2">
      Buchung bestätigt!
    </h2>
    <p className="text-muted-foreground mb-6">
      Ihre Buchung wurde erfolgreich bestätigt.
    </p>
  </>
)}

// NEW: Guest account creation offer
{isGuest && (
  <Card className="w-full max-w-md mb-6 bg-accent/10">
    <CardHeader>
      <CardTitle className="text-lg">Konto erstellen?</CardTitle>
      <CardDescription>
        Verwalten Sie Ihre Buchungen und erhalten Sie automatische Erinnerungen
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-start gap-2 text-sm">
        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <span>Alle Termine an einem Ort</span>
      </div>
      {/* ... more benefits ... */}
    </CardContent>
    <CardFooter>
      <Button className="w-full" variant="outline">
        Jetzt kostenloses Konto erstellen
      </Button>
    </CardFooter>
  </Card>
)}
```

---

### 6. createBooking.ts (Server Action)
**Location:** `/app/actions/createBooking.ts`

**Key Changes:**
```typescript
// CHANGED: Updated interface
interface BookingResult {
  success: boolean
  bookingId?: string
  status?: string  // NEW
  error?: string
}

// CHANGED: Accept customerId and set status conditionally
const newBooking = await tx.booking.create({
  data: {
    studioId: validated.studioId,
    serviceId: validated.serviceId,
    customerId: validated.customerId || null,  // NEW
    customerName: validated.customerName,
    customerEmail: validated.customerEmail,
    customerPhone: validated.customerPhone,
    preferredDate,
    preferredTime,
    message: validated.message || null,
    explicitHealthConsent: validated.explicitHealthConsent,
    healthConsentGivenAt: new Date(),
    healthConsentText: "...",
    status: validated.customerId ? "PENDING" : "CONFIRMED",  // CHANGED
  },
  // ...
})

// CHANGED: Return status
return {
  success: true,
  bookingId: booking.id,
  status: booking.status,  // NEW
}
```

---

### 7. booking.ts (Validation Schema)
**Location:** `/lib/validations/booking.ts`

**Key Changes:**
```typescript
export const bookingFormSchema = z.object({
  studioId: z.string().cuid("Ungültige Studio-ID"),
  slotId: z.string().cuid("Ungültige Zeitslot-ID"),
  serviceId: z.string().cuid("Bitte wählen Sie eine Leistung aus"),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().min(10).max(20).regex(/^[\d\s+()-]+$/),
  message: z.string().max(1000).optional().or(z.literal("")),
  explicitHealthConsent: z.boolean().refine((val) => val === true),
  customerId: z.string().cuid().nullable().optional(),  // NEW
})
```

---

## Flow Diagram

```
BEFORE (4 steps):
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Review  │──>│ Service │──>│ Confirm │──>│ Success │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
   Step 1        Step 2        Step 3        Step 4

AFTER (3 steps):
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Service │──>│ Confirm │──>│ Success │
└─────────┘   └─────────┘   └─────────┘
   Step 1        Step 2        Step 3
```

## Status Logic Flow

```
User Booking Flow:
┌────────────────┐
│ User fills form│
└────────┬───────┘
         │
    ┌────▼─────┐
    │Logged in?│
    └────┬─────┘
         │
    ┌────┴─────────────┐
    │                  │
   YES                NO
    │                  │
    ▼                  ▼
┌─────────────┐  ┌──────────────┐
│customerId   │  │customerId    │
│provided     │  │null          │
└──────┬──────┘  └──────┬───────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│Status:      │  │Status:       │
│PENDING      │  │CONFIRMED     │
│(amber)      │  │(green)       │
└──────┬──────┘  └──────┬───────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│"Buchungs-   │  │"Buchung      │
│anfrage      │  │bestätigt!"   │
│erhalten!"   │  │              │
└─────────────┘  └──────────────┘
```

## Testing Quick Reference

### Test Guest Flow:
1. Clear session/logout
2. Click on a time slot
3. Should see "Behandlung wählen" first (no review)
4. Should see context badge with date/time/studio
5. Select service → see "Tipp" alert with signin link
6. Fill form manually (all editable)
7. Submit → should show "Buchung bestätigt!" (green)
8. Should see guest account creation offer

### Test Logged-In Flow:
1. Login as customer
2. Click on a time slot
3. Should see "Behandlung wählen" first (no review)
4. Should see context badge
5. Select service → see "Angemeldet als" alert
6. Form pre-filled with name/email (read-only)
7. Submit → should show "Buchungsanfrage erhalten!" (amber)
8. Should NOT see guest account offer

### Currency Verification:
- Service cards should show: €99 (no decimals)
- Confirmation summary should show: €99.00 (with decimals)
- All should be EUR (€) not CHF

---

## Absolute File Paths

All modified files (absolute paths):
1. `/Users/roman/Development/massava/app/[locale]/booking/[studioId]/[slotId]/_components/BookingSheet.tsx`
2. `/Users/roman/Development/massava/app/[locale]/booking/[studioId]/[slotId]/_components/StepService.tsx`
3. `/Users/roman/Development/massava/app/[locale]/booking/[studioId]/[slotId]/_components/StepConfirm.tsx`
4. `/Users/roman/Development/massava/app/[locale]/booking/[studioId]/[slotId]/_components/ServiceCard.tsx`
5. `/Users/roman/Development/massava/app/[locale]/booking/[studioId]/[slotId]/_components/SuccessState.tsx`
6. `/Users/roman/Development/massava/app/actions/createBooking.ts`
7. `/Users/roman/Development/massava/lib/validations/booking.ts`

Deleted:
- `/Users/roman/Development/massava/app/[locale]/booking/[studioId]/[slotId]/_components/StepReview.tsx` ❌
