# Design Specification: Customer Booking Flow

## Overview
Mobile-first booking experience for massage platform targeting 17-38 year-old users who expect intuitive, app-like interactions similar to Booksy, Fresha, and Treatwell.

**Core User Journey:**
1. Enter location, date/time, preferences → Search
2. Browse available studios with pricing and time slots → Select
3. View studio details and full service menu → Book

---

## 1. UX Benchmarking Insights

### Key Findings from Competitor Analysis

| Feature | Booksy | Fresha | Treatwell | **Massava Approach** |
|---------|--------|--------|-----------|----------------------|
| **Price Display** | "ab €X" range | Per-service pricing | Full service list | **"ab €X" + expandable details** |
| **Search Entry** | Location → Category | Hybrid search | Location → Category | **Location → Date → Service** |
| **Results Layout** | Card grid | List with images | Comparison list | **Card list (mobile), grid (desktop)** |
| **Availability** | Click for calendar | "Next available" badge | Filter-based | **"Next 3 slots" preview** |
| **Map Integration** | Toggle view | Integrated pins | Separate tab | **Collapsible integrated map** |

### Critical UX Patterns

**Progressive Pricing Disclosure:**
- Level 1 (Results): "ab €55" for quick comparison
- Level 2 (Preview): "€55-75" shows service range
- Level 3 (Detail): "€55 (60min), €75 (90min)" full breakdown

**Mobile-First Interactions:**
- Bottom sheets for filters (don't disrupt flow)
- Horizontal date strip (easier thumb navigation)
- Pull-to-refresh for new availability
- Large tap targets (minimum 48px)

---

## 2. User Flow

### Entry Point: Search Form (Landing Page)

```
User lands on homepage
    ↓
Sees hero search form with:
    - Location input (GPS auto-detect)
    - Date/Time picker (defaults: today + next hour)
    - Radius slider (default: 10km)
    - Massage type filter (optional)
    ↓
Clicks "Termin finden" (primary CTA)
    ↓
[Loading state: Skeleton cards]
    ↓
Results page loads
```

### Main Flow: Results → Selection → Booking

```
Results Page displays:
    - Header: "X verfügbare Termine in [City]"
    - Filters: Price, Distance, Rating (collapsible on mobile)
    - Toggle: List view / Map view
    - Result cards (paginated/infinite scroll)
    ↓
User scans result cards showing:
    - Studio logo, name, rating
    - "ab €X" starting price
    - Distance from search location
    - Next 3 available time slots
    - Service preview (2-3 services)
    ↓
User clicks time slot OR "Details ansehen"
    ↓
    ├─ Time slot click → Direct booking flow
    └─ Details click → Studio detail page
                        ↓
                Studio detail page shows:
                    - Full service list with duration/price matrix
                    - Calendar with all available slots
                    - Reviews, photos, description
                    ↓
                User selects service + time slot
                    ↓
                Clicks "Jetzt buchen"
                    ↓
                Checkout flow (out of scope)
```

### Alternative Flows

**No Results Found:**
```
Empty state displays:
    - Illustration + message
    - Suggestions: "Radius erweitern", "Datum ändern", "Filter entfernen"
    - "Suche anpassen" button → Returns to search form (pre-filled)
```

**Filter Adjustment:**
```
User clicks "Preis ▼"
    ↓
Bottom sheet opens (mobile) or inline filter (desktop)
    ↓
User adjusts price range slider
    ↓
Clicks "Anwenden"
    ↓
Results update with loading skeleton
```

**Map View Toggle:**
```
User clicks "Karte 🗺️"
    ↓
List view replaced with map
    ↓
Studio pins displayed on map
    ↓
Click pin → Studio card overlay
    ↓
Click "Details" → Studio detail page
```

---

## 3. Wireframes & Component Specifications

### Mobile: Search Form (< 640px)

```
┌────────────────────────────────┐
│ Massava Logo                   │
├────────────────────────────────┤
│                                │
│ Finde deine perfekte Massage   │
│ Verfügbare Termine in der Nähe │
│                                │
│ ┌────────────────────────────┐ │
│ │ 📍 Standort                │ │
│ │ ┌────────────────────────┐ │ │
│ │ │ München            [GPS]│ │ │
│ │ └────────────────────────┘ │ │
│ │ (Autocomplete dropdown)    │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 📅 Datum       🕐 Uhrzeit  │ │
│ │ ┌──────────┬─────────────┐ │ │
│ │ │ Heute    │ 14:00       │ │ │
│ │ └──────────┴─────────────┘ │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ Suchradius: 10 km          │ │
│ │ ●─────────○─────────────   │ │
│ │ 5km      15km         25km │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ Massage-Typ (Optional)     │ │
│ │ ┌────────────────────────┐ │ │
│ │ │ Alle Typen         ▼   │ │ │
│ │ └────────────────────────┘ │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │  🔍 Termin finden          │ │
│ │      (Large button)        │ │
│ └────────────────────────────┘ │
│                                │
│ Beliebte Massage-Studios       │
│ ┌──────┬──────┬──────┐        │
│ │ Card │ Card │ Card │        │
│ └──────┴──────┴──────┘        │
│ (Horizontal scroll)            │
└────────────────────────────────┘
```

**Component Breakdown:**

```typescript
// Search Form (Client Component)
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { MapPin, Calendar as CalendarIcon, Search, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

export function SearchForm() {
  const [location, setLocation] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState("14:00")
  const [radius, setRadius] = useState(10)
  const [massageType, setMassageType] = useState("all")
  const [isLoading, setIsLoading] = useState(false)

  const detectLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          // Reverse geocode to get city name
          const response = await fetch(
            `/api/geocode?lat=${latitude}&lng=${longitude}`
          )
          const data = await response.json()
          setLocation(data.city)
        },
        (error) => {
          toast({
            title: "Standort nicht verfügbar",
            description: "Bitte geben Sie Ihren Standort manuell ein.",
            variant: "destructive"
          })
        }
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const searchParams = new URLSearchParams({
      location,
      date: format(date, "yyyy-MM-dd"),
      time,
      radius: radius.toString(),
      massageType: massageType !== "all" ? massageType : ""
    })

    window.location.href = `/search/results?${searchParams}`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Standort <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="location"
                name="location"
                placeholder="Stadt oder PLZ eingeben"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pr-12"
                required
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={detectLocation}
                aria-label="Aktuellen Standort nutzen"
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Uhrzeit</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Uhrzeit" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 9).map(hour => (
                    <SelectItem key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Radius Slider */}
          <div className="space-y-2">
            <Label htmlFor="radius">
              Suchradius: {radius} km
            </Label>
            <Slider
              id="radius"
              min={5}
              max={25}
              step={5}
              value={[radius]}
              onValueChange={([value]) => setRadius(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 km</span>
              <span>15 km</span>
              <span>25 km</span>
            </div>
          </div>

          {/* Massage Type */}
          <div className="space-y-2">
            <Label htmlFor="massage-type">
              Massage-Typ <span className="text-muted-foreground text-sm">(Optional)</span>
            </Label>
            <Select value={massageType} onValueChange={setMassageType}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Typen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="thai">Thai-Massage</SelectItem>
                <SelectItem value="sport">Sport-Massage</SelectItem>
                <SelectItem value="oil">Öl-Massage</SelectItem>
                <SelectItem value="hot-stone">Hot Stone</SelectItem>
                <SelectItem value="deep-tissue">Deep Tissue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Search className="mr-2 h-4 w-4" />
            Termin finden
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
```

---

### Mobile: Results Page (< 640px)

```
┌────────────────────────────────┐
│ ← Zurück   |   🔍 Neue Suche   │ ← Sticky header
├────────────────────────────────┤
│                                │
│ 12 verfügbare Termine          │
│ München • Heute, 14:00         │
│                                │
│ ┌────────────────────────────┐ │
│ │ [Preis ▼] [Entfernung ▼]  │ │ ← Filter chips
│ │ [Bewertung ▼]              │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ [Liste] [Karte 🗺️]        │ │ ← View toggle
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ ┌──────┬─────────────────┐ │ │
│ │ │ LOGO │ Thai Spa München│ │ │
│ │ │ [60x │ ⭐ 4.8 (120)    │ │ │
│ │ │ 60px]│ ab €55 • 0.8 km │ │ │
│ │ └──────┴─────────────────┘ │ │
│ │                            │ │
│ │ Nächste Termine:           │ │
│ │ ┌────────┬────────┬─────┐ │ │
│ │ │15:00   │17:30   │+mehr│ │ │
│ │ │Heute   │Heute   │     │ │ │
│ │ └────────┴────────┴─────┘ │ │
│ │                            │ │
│ │ Services:                  │ │
│ │ • Thai-Massage (€55-75)    │ │
│ │ • Öl-Massage (€60)         │ │
│ │                            │ │
│ │ [Details ansehen →]        │ │
│ └────────────────────────────┘ │
│                                │
│ [Result Card 2]                │
│ [Result Card 3]                │
│                                │
│ [Weitere Termine laden...]     │
│                                │
└────────────────────────────────┘
```

**Component Breakdown:**

```typescript
// Result Card Component
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, MapPin, Clock, ChevronRight } from "lucide-react"

interface ResultCardProps {
  studio: {
    id: string
    name: string
    logoUrl: string
    rating: number
    reviewCount: number
    priceFrom: number
    distance: number
    nextSlots: Array<{ id: string; time: string; date: string }>
    services: Array<{
      id: string
      name: string
      priceFrom?: number
      priceTo?: number
      price?: number
    }>
  }
}

export function ResultCard({ studio }: ResultCardProps) {
  const navigateToStudio = (studioId: string) => {
    window.location.href = `/studios/${studioId}`
  }

  const handleSlotClick = (studioId: string, slot: any) => {
    // Navigate to booking with pre-selected time
    window.location.href = `/studios/${studioId}/book?slot=${slot.id}`
  }

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">

        {/* Studio Header */}
        <div className="flex gap-3 mb-3">
          <Avatar className="h-16 w-16 rounded-md">
            <AvatarImage src={studio.logoUrl} alt={studio.name} />
            <AvatarFallback>{studio.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">
              {studio.name}
            </h3>

            <div className="flex items-center gap-2 text-sm mb-1">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{studio.rating}</span>
                <span className="text-muted-foreground ml-1">
                  ({studio.reviewCount})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                ab €{studio.priceFrom}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {studio.distance} km
              </span>
            </div>
          </div>
        </div>

        {/* Available Time Slots */}
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Nächste Termine:
          </p>
          <div className="flex gap-2 flex-wrap">
            {studio.nextSlots.slice(0, 2).map(slot => (
              <Button
                key={slot.id}
                variant="outline"
                size="sm"
                className="flex-1 min-w-[100px]"
                onClick={() => handleSlotClick(studio.id, slot)}
              >
                <Clock className="h-3 w-3 mr-1" />
                <div className="text-xs">
                  <div className="font-semibold">{slot.time}</div>
                  <div className="text-muted-foreground">{slot.date}</div>
                </div>
              </Button>
            ))}

            {studio.nextSlots.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToStudio(studio.id)}
              >
                +{studio.nextSlots.length - 2} mehr
              </Button>
            )}
          </div>
        </div>

        {/* Services Preview */}
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Services:
          </p>
          <div className="space-y-1">
            {studio.services.slice(0, 2).map(service => (
              <div key={service.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{service.name}</span>
                <span className="text-muted-foreground">
                  {service.priceFrom && service.priceTo ? (
                    `€${service.priceFrom}-${service.priceTo}`
                  ) : (
                    `€${service.price}`
                  )}
                </span>
              </div>
            ))}
            {studio.services.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{studio.services.length - 2} weitere Services
              </p>
            )}
          </div>
        </div>

        <Separator className="my-3" />

        {/* Action Button */}
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => navigateToStudio(studio.id)}
        >
          <span>Details ansehen</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

      </CardContent>
    </Card>
  )
}
```

---

### Desktop: Results Page (> 1024px)

```
┌─────────────────────────────────────────────────────────────┐
│ Navigation Bar                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ <div className="container mx-auto py-6 px-4">              │
│                                                             │
│  <div className="grid grid-cols-12 gap-6">                 │
│                                                             │
│    ┌─────────────────────┐  ┌──────────────────────────┐   │
│    │ LEFT SIDEBAR (3/12) │  │ MAIN CONTENT (9/12)      │   │
│    │                     │  │                          │   │
│    │ ┌─────────────────┐ │  │ <div className="mb-4">   │   │
│    │ │ Card: Filters   │ │  │   <h1 className="text-   │   │
│    │ │                 │ │  │        2xl font-bold">   │   │
│    │ │ Preis           │ │  │     12 verfügbare        │   │
│    │ │ [€0──────€150]  │ │  │     Termine              │   │
│    │ │                 │ │  │   </h1>                  │   │
│    │ │ Entfernung      │ │  │   <p className="text-sm  │   │
│    │ │ [0km──25km]     │ │  │        text-muted">      │   │
│    │ │                 │ │  │     München • Heute,     │   │
│    │ │ Bewertung       │ │  │     14:00                │   │
│    │ │ ☐ 4+ Sterne     │ │  │   </p>                   │   │
│    │ │ ☐ 3+ Sterne     │ │  │ </div>                   │   │
│    │ │                 │ │  │                          │   │
│    │ │ Massage-Typ     │ │  │ ┌──────┬──────┬────────┐ │   │
│    │ │ ☐ Thai          │ │  │ │Liste │Karte │Grid    │ │   │
│    │ │ ☐ Sport         │ │  │ └──────┴──────┴────────┘ │   │
│    │ │ ☐ Öl            │ │  │                          │   │
│    │ │ ☐ Hot Stone     │ │  │ <div className="grid     │   │
│    │ │                 │ │  │      grid-cols-2 gap-4"> │   │
│    │ │ [Filter Reset]  │ │  │                          │   │
│    │ └─────────────────┘ │  │ ┌──────────────────────┐ │   │
│    │                     │  │ │ RESULT CARD (Grid)   │ │   │
│    │ ┌─────────────────┐ │  │ │ ┌────────────────┐   │ │   │
│    │ │ Card: Mini Map  │ │  │ │ │ Studio Image   │   │ │   │
│    │ │ (Sticky)        │ │  │ │ │ (Aspect 16:9)  │   │ │   │
│    │ │                 │ │  │ │ └────────────────┘   │ │   │
│    │ │ [Map with pins] │ │  │ │ Thai Spa ⭐ 4.8      │ │   │
│    │ │                 │ │  │ │ ab €55 • 0.8 km      │ │   │
│    │ │                 │ │  │ │ [15:00][17:30][+]    │ │   │
│    │ │                 │ │  │ │ [Details ansehen →]  │ │   │
│    │ │                 │ │  │ └──────────────────────┘ │   │
│    │ │                 │ │  │                          │   │
│    │ └─────────────────┘ │  │ [Card 2] [Card 3]        │   │
│    │                     │  │ [Card 4] [Card 5]        │   │
│    └─────────────────────┘  │                          │   │
│                             │ </div>                   │   │
│                             │                          │   │
│                             │ <Pagination />           │   │
│                             └──────────────────────────┘   │
│  </div>                                                    │
│                                                             │
│ </div>                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Pricing Display Strategy

### Progressive Disclosure Pattern

**Level 1: Results Card (Quick Scan)**

```typescript
// Display "ab €X" for quick comparison
<div className="flex items-center gap-2">
  <span className="text-lg font-semibold">ab €{studio.priceFrom}</span>
  <span className="text-xs text-muted-foreground">pro Massage</span>
</div>

// Example: "ab €55 pro Massage"
// User understands: Starting price, actual depends on service choice
```

**Why this works:**
- Low cognitive load (single number to compare)
- Enables sorting/filtering by price
- Honest ("ab" signals variability)
- Industry-standard (Booksy, Fresha use this)

---

**Level 2: Service Preview (Context)**

```typescript
// Show 2-3 most popular services with price ranges
<div className="space-y-1 text-sm">
  <div className="flex justify-between">
    <span>Thai-Massage</span>
    <span className="text-muted-foreground">€55-75</span>
  </div>
  <div className="flex justify-between">
    <span>Öl-Massage</span>
    <span className="text-muted-foreground">€60</span>
  </div>
  <p className="text-xs text-muted-foreground">
    +3 weitere Services
  </p>
</div>
```

**Why this works:**
- Shows what influences price (service type, duration)
- Price range (€55-75) hints at duration options
- Not overwhelming (only 2-3 services)

---

**Level 3: Studio Detail Page (Full Transparency)**

```typescript
// Show all services with duration + price matrix
<div className="space-y-4">
  <h3 className="font-semibold">Verfügbare Services</h3>

  <Card>
    <CardHeader>
      <CardTitle>Thai-Massage</CardTitle>
      <CardDescription>
        Traditionelle Thai-Massage mit Dehnung und Akupressur
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <div className="flex items-center gap-3">
            <input type="radio" name="service" value="thai-60" />
            <div>
              <p className="font-medium">60 Minuten</p>
              <p className="text-sm text-muted-foreground">Ganzkörper-Massage</p>
            </div>
          </div>
          <span className="font-semibold text-lg">€55</span>
        </label>

        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <div className="flex items-center gap-3">
            <input type="radio" name="service" value="thai-90" />
            <div>
              <p className="font-medium">90 Minuten</p>
              <p className="text-sm text-muted-foreground">Intensiv-Behandlung</p>
            </div>
          </div>
          <span className="font-semibold text-lg">€75</span>
        </label>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Öl-Massage</CardTitle>
    </CardHeader>
    <CardContent>
      <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
        <div className="flex items-center gap-3">
          <input type="radio" name="service" value="oil-60" />
          <div>
            <p className="font-medium">60 Minuten</p>
          </div>
        </div>
        <span className="font-semibold text-lg">€60</span>
      </label>
    </CardContent>
  </Card>
</div>
```

**Why this works:**
- Complete transparency (all options visible)
- Decision support (compare duration/price trade-offs)
- Booking-ready (selection feeds directly into checkout)

---

### Pricing Display Decision Matrix

| Context | Format | Example | Use Case |
|---------|--------|---------|----------|
| **Results Card** | `ab €X` | ab €55 | Quick comparison, sorting, filtering |
| **Service Preview** | `€X-Y` or `€X` | €55-75 or €60 | Show range without overwhelming |
| **Detail Page** | `€X (Duration)` | €55 (60min) | Full transparency for booking decision |
| **Checkout** | `€X` (exact) | €55 | No ambiguity at payment |

---

### Edge Cases

**Same price across all services:**
```typescript
// Don't show range, just single price
<span className="font-semibold">€60</span>
<span className="text-xs text-muted-foreground">alle Massagen</span>
```

**Wide price range (€40-€120):**
```typescript
// Show categories to explain variance
<span className="font-semibold">ab €40</span>
<p className="text-xs text-muted-foreground">
  Thai (€40-60) • Öl (€50-70) • Hot Stone (€90-120)
</p>
```

**Introductory offer:**
```typescript
// Show badge + strikethrough
<div className="flex items-center gap-2">
  <Badge variant="secondary">-20% Neukunden</Badge>
  <span className="font-semibold">€44</span>
  <span className="line-through text-muted-foreground text-sm">€55</span>
</div>
```

---

## 5. Mobile-First Design Principles

### 1. Touch Target Sizes (WCAG 2.1 AA)

**Minimum: 48x48px tap targets**

```typescript
// Good: Large button
<Button size="lg" className="min-h-[48px] px-6">
  Termin finden
</Button>

// Bad: Too small
<Button size="sm" className="h-8 w-8">
  <X />
</Button>

// Fixed: Increase size for mobile
<Button
  size="icon"
  className="h-12 w-12"
  aria-label="Schließen"
>
  <X className="h-5 w-5" />
</Button>
```

---

### 2. Thumb-Friendly Layout Zones

**Bottom 1/3: Primary actions (easy thumb reach)**
**Top: Navigation (less critical)**
**Middle: Scrollable content**

```typescript
// Fixed bottom CTA (mobile only)
<div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:relative md:border-0 md:p-0">
  <Button className="w-full" size="lg">
    Jetzt buchen (€55)
  </Button>
</div>
```

---

### 3. Progressive Disclosure

**Show essential info first, expand on demand**

```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function ExpandableCard({ studio }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{studio.name}</CardTitle>
        <p className="text-sm">ab €{studio.priceFrom} • {studio.distance} km</p>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-medium">Beschreibung</h4>
            <p className="text-sm text-muted-foreground">{studio.description}</p>

            <h4 className="font-medium mt-4">Alle Services</h4>
            <ul className="space-y-1">
              {studio.services.map(s => (
                <li key={s.id} className="text-sm flex justify-between">
                  <span>{s.name}</span>
                  <span>€{s.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}

      <CardFooter>
        <Button
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? "Weniger" : "Mehr anzeigen"}
          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

### 4. Mobile-Optimized Inputs

**GPS Auto-Detect:**
```typescript
const detectLocation = async () => {
  if (!navigator.geolocation) {
    toast({
      title: "GPS nicht verfügbar",
      description: "Ihr Browser unterstützt keine Standorterkennung.",
      variant: "destructive"
    })
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords

      // Reverse geocode to city name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      )
      const data = await response.json()

      setLocation(data.address.city || data.address.town)
      setCoordinates({ lat: latitude, lng: longitude })
    },
    (error) => {
      console.error(error)
      toast({
        title: "Standort nicht gefunden",
        description: "Bitte geben Sie Ihren Standort manuell ein.",
        variant: "destructive"
      })
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  )
}
```

**Native Date Picker (Mobile Only):**
```typescript
// Use native input on mobile, custom calendar on desktop
{isMobile ? (
  <input
    type="date"
    className="w-full px-3 py-2 border rounded-md"
    min={format(new Date(), "yyyy-MM-dd")}
    value={format(date, "yyyy-MM-dd")}
    onChange={(e) => setDate(new Date(e.target.value))}
  />
) : (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">
        <CalendarIcon className="mr-2 h-4 w-4" />
        {format(date, "dd.MM.yyyy")}
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={(date) => date < new Date()}
      />
    </PopoverContent>
  </Popover>
)}
```

---

### 5. Performance: Lazy Loading & Infinite Scroll

**Lazy Load Images:**
```typescript
import Image from "next/image"

<Image
  src={studio.logoUrl}
  alt={studio.name}
  width={64}
  height={64}
  className="rounded-md"
  loading="lazy"
  placeholder="blur"
  blurDataURL={studio.blurHash}
/>
```

**Infinite Scroll (Mobile) vs. Pagination (Desktop):**
```typescript
"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"

export function ResultsList({ initialResults }) {
  const [results, setResults] = useState(initialResults)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreResults()
    }
  }, [inView])

  const loadMoreResults = async () => {
    const nextPage = page + 1
    const response = await fetch(`/api/search?page=${nextPage}`)
    const newResults = await response.json()

    if (newResults.length === 0) {
      setHasMore(false)
    } else {
      setResults([...results, ...newResults])
      setPage(nextPage)
    }
  }

  return (
    <>
      {results.map(result => (
        <ResultCard key={result.id} studio={result} />
      ))}

      {hasMore && (
        <div ref={ref} className="py-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            Weitere Termine laden...
          </p>
        </div>
      )}
    </>
  )
}
```

---

### 6. Bottom Sheet for Filters (Mobile)

```typescript
"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { SlidersHorizontal } from "lucide-react"

export function FilterSheet({ onApplyFilters }) {
  const [priceRange, setPriceRange] = useState([0, 150])
  const [distance, setDistance] = useState(10)
  const [ratings, setRatings] = useState([])
  const [massageTypes, setMassageTypes] = useState([])

  const handleApply = () => {
    onApplyFilters({
      priceRange,
      distance,
      ratings,
      massageTypes
    })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh]">
        {/* Pull-to-close indicator */}
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Price Range */}
          <div className="space-y-2">
            <Label>Preis: €{priceRange[0]} - €{priceRange[1]}</Label>
            <Slider
              min={0}
              max={200}
              step={5}
              value={priceRange}
              onValueChange={setPriceRange}
            />
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <Label>Entfernung: {distance} km</Label>
            <Slider
              min={5}
              max={50}
              step={5}
              value={[distance]}
              onValueChange={([v]) => setDistance(v)}
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Bewertung</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="rating-4" />
                <label htmlFor="rating-4" className="text-sm">
                  4+ Sterne
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="rating-3" />
                <label htmlFor="rating-3" className="text-sm">
                  3+ Sterne
                </label>
              </div>
            </div>
          </div>

          {/* Massage Type */}
          <div className="space-y-2">
            <Label>Massage-Typ</Label>
            <div className="space-y-2">
              {['Thai', 'Sport', 'Öl', 'Hot Stone', 'Deep Tissue'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox id={`type-${type}`} />
                  <label htmlFor={`type-${type}`} className="text-sm">
                    {type}-Massage
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
          <Button variant="outline" className="flex-1">
            Zurücksetzen
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Anwenden
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## 6. Accessibility (WCAG 2.1 AA Compliance)

### Semantic HTML Structure

```typescript
<main className="container mx-auto py-8">
  <nav aria-label="Filter-Navigation">
    <div className="flex gap-2">
      <FilterSheet />
      <Button variant="outline">Sortieren</Button>
    </div>
  </nav>

  <section aria-labelledby="results-heading">
    <h1 id="results-heading">
      12 verfügbare Termine in München
    </h1>

    <div className="grid gap-4 mt-6">
      <article aria-labelledby={`studio-${studio.id}`}>
        <ResultCard studio={studio} />
      </article>
    </div>
  </section>
</main>
```

---

### ARIA Labels & Live Regions

```typescript
// Location detect button
<Button
  aria-label="Aktuellen Standort nutzen"
  onClick={detectLocation}
>
  <MapPin className="h-4 w-4" />
</Button>

// Filter with count
<Button
  aria-label={`Filter anzeigen${activeFilters > 0 ? `, ${activeFilters} aktiv` : ''}`}
>
  Filter
  {activeFilters > 0 && (
    <Badge className="ml-2">{activeFilters}</Badge>
  )}
</Button>

// Loading state announcement
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {isLoading
    ? "Termine werden geladen..."
    : `${results.length} Termine gefunden`
  }
</div>
```

---

### Keyboard Navigation

```typescript
// Focus management in dialogs
const dialogRef = useRef<HTMLDivElement>(null)
const triggerRef = useRef<HTMLButtonElement>(null)

const handleOpenChange = (open: boolean) => {
  if (!open) {
    // Return focus to trigger on close
    triggerRef.current?.focus()
  }
}

<Button ref={triggerRef} onClick={() => setOpen(true)}>
  Filter öffnen
</Button>

<Dialog open={open} onOpenChange={handleOpenChange}>
  <DialogContent ref={dialogRef}>
    {/* Focus trapped here when open */}
  </DialogContent>
</Dialog>
```

**Keyboard Shortcuts:**
- `Tab`: Navigate through interactive elements
- `Enter/Space`: Activate buttons, select options
- `Escape`: Close dialogs, bottom sheets
- `Arrow keys`: Navigate within Select, Combobox

---

### Color Contrast & Visual Indicators

```typescript
// Don't rely on color alone
<Badge
  variant={studio.isOpen ? "default" : "secondary"}
  className="gap-1"
>
  <Circle
    className="h-2 w-2"
    fill={studio.isOpen ? "currentColor" : "gray"}
  />
  {studio.isOpen ? "Geöffnet" : "Geschlossen"}
</Badge>

// Error states with icon + text
{errors.location && (
  <div className="flex items-center gap-2 text-sm text-destructive">
    <AlertCircle className="h-4 w-4" />
    <span>{errors.location}</span>
  </div>
)}
```

---

### Screen Reader Announcements

```typescript
// Announce dynamic content changes
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only' // Visually hidden
  announcement.textContent = message
  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Usage
useEffect(() => {
  if (results.length > 0) {
    announceToScreenReader(`${results.length} Termine gefunden`)
  } else {
    announceToScreenReader('Keine Termine verfügbar. Bitte passen Sie Ihre Suche an.')
  }
}, [results])
```

---

## 7. Implementation Roadmap

### Phase 1: Search Form (Week 1)
- [ ] Create search form component (Client Component)
- [ ] Implement location autocomplete (OpenStreetMap Nominatim API)
- [ ] Add GPS detection functionality
- [ ] Build date/time picker (responsive)
- [ ] Implement radius slider
- [ ] Add massage type select
- [ ] Create Server Action for search submission
- [ ] Setup URL param handling for search state

### Phase 2: Results Page (Week 2)
- [ ] Create results page layout (Server Component)
- [ ] Build ResultCard component
- [ ] Implement filter sheet (mobile) and sidebar (desktop)
- [ ] Add map view toggle
- [ ] Setup pagination/infinite scroll
- [ ] Implement sorting functionality
- [ ] Add empty state component
- [ ] Create loading skeletons

### Phase 3: Studio Detail Page (Week 3)
- [ ] Build studio detail page layout
- [ ] Create service selection component
- [ ] Implement full calendar view
- [ ] Add photo gallery
- [ ] Display reviews section
- [ ] Build booking CTA flow
- [ ] Add breadcrumb navigation

### Phase 4: Performance & Accessibility (Week 4)
- [ ] Optimize images (Next.js Image, WebP)
- [ ] Add lazy loading for off-screen content
- [ ] Implement caching strategy (Redis)
- [ ] WCAG 2.1 AA audit & fixes
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Mobile performance testing (Lighthouse)

---

## 8. Technical Specifications for feature-builder

### File Structure

```
app/
  search/
    page.tsx                    # Search form (Server Component)
    results/
      page.tsx                  # Results page (Server Component)
      loading.tsx               # Suspense boundary loading state
      _components/
        ResultsClient.tsx       # Client wrapper for results
        ResultCard.tsx          # Individual result card
        FilterSheet.tsx         # Mobile filter bottom sheet
        FilterSidebar.tsx       # Desktop filter sidebar
        MapView.tsx             # Map component (lazy loaded)
        EmptyState.tsx          # No results state

  studios/
    [id]/
      page.tsx                  # Studio detail page
      book/
        page.tsx                # Booking flow (out of scope)

  actions/
    search.ts                   # Server Actions for search

  api/
    geocode/
      route.ts                  # Reverse geocoding API
    search/
      route.ts                  # Search API (if needed for real-time)

lib/
  db/
    queries/
      search.ts                 # Database queries for search
```

---

### Database Schema (Prisma)

```prisma
model Studio {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  logoUrl     String?
  address     String
  city        String
  postalCode  String
  latitude    Float
  longitude   Float
  phone       String
  email       String
  rating      Float    @default(0)
  reviewCount Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  services    Service[]
  bookings    Booking[]
  reviews     Review[]

  @@index([latitude, longitude]) // Geo-spatial queries
  @@index([city])
  @@index([isActive])
}

model Service {
  id          String   @id @default(cuid())
  studioId    String
  name        String
  description String?
  type        ServiceType
  duration    Int      // minutes
  price       Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)

  studio      Studio   @relation(fields: [studioId], references: [id], onDelete: Cascade)

  @@index([studioId, type])
  @@index([price])
}

enum ServiceType {
  THAI
  SPORT
  OIL
  HOT_STONE
  DEEP_TISSUE
  AROMATHERAPY
  REFLEXOLOGY
}

model Availability {
  id        String   @id @default(cuid())
  studioId  String
  date      DateTime
  startTime String   // "09:00"
  endTime   String   // "10:00"
  isBooked  Boolean  @default(false)

  studio    Studio   @relation(fields: [studioId], references: [id], onDelete: Cascade)

  @@unique([studioId, date, startTime])
  @@index([studioId, date, isBooked])
}
```

---

### Server Action: Search

```typescript
// app/actions/search.ts
"use server"

import { z } from "zod"
import { db } from "@/lib/db"

const searchSchema = z.object({
  location: z.string().min(2).max(100),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  radius: z.number().min(5).max(50).default(10),
  massageType: z.enum(['all', 'thai', 'sport', 'oil', 'hot-stone', 'deep-tissue']).optional()
})

export async function searchStudios(params: z.infer<typeof searchSchema>) {
  const validated = searchSchema.parse(params)

  // Haversine formula for distance calculation
  const studios = await db.$queryRaw`
    SELECT
      s.*,
      (
        6371 * acos(
          cos(radians(${validated.latitude}))
          * cos(radians(s.latitude))
          * cos(radians(s.longitude) - radians(${validated.longitude}))
          + sin(radians(${validated.latitude}))
          * sin(radians(s.latitude))
        )
      ) AS distance,
      (
        SELECT MIN(sv.price)
        FROM "Service" sv
        WHERE sv."studioId" = s.id
        AND sv."isActive" = true
      ) AS "priceFrom"
    FROM "Studio" s
    WHERE s."isActive" = true
    AND (
      6371 * acos(
        cos(radians(${validated.latitude}))
        * cos(radians(s.latitude))
        * cos(radians(s.longitude) - radians(${validated.longitude}))
        + sin(radians(${validated.latitude}))
        * sin(radians(s.latitude))
      )
    ) <= ${validated.radius}
    ORDER BY distance ASC
    LIMIT 50
  `

  // Fetch services and next available slots for each studio
  const studiosWithDetails = await Promise.all(
    studios.map(async (studio) => {
      const services = await db.service.findMany({
        where: { studioId: studio.id, isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          duration: true,
          price: true
        }
      })

      const nextSlots = await db.availability.findMany({
        where: {
          studioId: studio.id,
          date: { gte: new Date(validated.date) },
          isBooked: false
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 5
      })

      return {
        ...studio,
        services,
        nextSlots: nextSlots.map(slot => ({
          id: slot.id,
          time: slot.startTime,
          date: format(slot.date, 'dd.MM.yyyy', { locale: de })
        }))
      }
    })
  )

  return studiosWithDetails
}
```

---

### Caching Strategy

```typescript
// lib/cache/search.ts
import { redis } from "@/lib/redis"

export async function getCachedSearch(params: SearchParams) {
  const cacheKey = `search:${JSON.stringify(params)}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  return null
}

export async function setCachedSearch(params: SearchParams, results: any) {
  const cacheKey = `search:${JSON.stringify(params)}`
  await redis.setex(cacheKey, 300, JSON.stringify(results)) // 5 min TTL
}
```

---

## 9. Security Considerations for security-auditor

### Input Validation

```typescript
// Zod schema validation (already shown above)
// Additional: Rate limiting

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10s
  analytics: true
})

export async function searchStudios(params: SearchParams) {
  const ip = headers().get('x-forwarded-for') ?? 'unknown'
  const { success, remaining } = await ratelimit.limit(ip)

  if (!success) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  // Proceed with search...
}
```

---

### SQL Injection Prevention

```typescript
// Use Prisma ORM (parameterized queries)
// AVOID raw SQL with user input

// Bad
const results = await db.$queryRaw`
  SELECT * FROM studios WHERE city = '${userInput}'
` // DON'T DO THIS

// Good
const results = await db.$queryRaw`
  SELECT * FROM studios WHERE city = ${userInput}
` // Prisma escapes parameters

// Better: Use Prisma client methods
const results = await db.studio.findMany({
  where: { city: userInput }
})
```

---

### XSS Prevention

```typescript
// React escapes by default, but sanitize user-generated content

import DOMPurify from 'isomorphic-dompurify'

// When rendering user-generated HTML (reviews, descriptions)
<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(studio.description)
  }}
/>
```

---

### CSRF Protection

```typescript
// Server Actions have built-in CSRF protection
// Ensure all mutations use Server Actions, not API routes

// Good (Server Action)
export async function bookAppointment(formData: FormData) {
  // CSRF token validated automatically
}

// If using API routes, add CSRF token
import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  await csrf.validate(request)
  // Process request
}
```

---

## 10. Performance Optimization Checklist

### Database
- [ ] Add geo-spatial indexes (latitude, longitude)
- [ ] Composite indexes on frequently filtered columns
- [ ] Query optimization (EXPLAIN ANALYZE)
- [ ] Connection pooling (Prisma)

### Caching
- [ ] Redis caching for popular searches (5 min TTL)
- [ ] Browser caching for static assets
- [ ] Service worker for offline support (optional)

### Images
- [ ] Next.js Image component (automatic optimization)
- [ ] WebP format with fallback
- [ ] Lazy loading (loading="lazy")
- [ ] Blur placeholder (blurDataURL)

### Code Splitting
- [ ] Lazy load Map component
- [ ] Dynamic imports for heavy libraries
- [ ] Tree-shaking (import only used modules)

### Rendering
- [ ] Server Components for initial render
- [ ] Client Components only for interactivity
- [ ] Streaming with Suspense boundaries
- [ ] Prefetch studio detail pages on hover

---

## Summary

This design specification provides:

1. **Benchmarking insights** from Booksy, Fresha, Treatwell
2. **Complete user flow** from search to booking
3. **Mobile-first wireframes** with shadcn/ui components
4. **Progressive pricing strategy** (ab €X → ranges → full breakdown)
5. **Mobile design principles** (touch targets, thumb zones, progressive disclosure)
6. **WCAG 2.1 AA accessibility** guidelines
7. **Technical implementation** roadmap and code examples
8. **Security & performance** best practices

**Next Steps for feature-builder:**
1. Implement search form with GPS detection
2. Build results page with filtering
3. Create studio detail page
4. Add booking flow integration

**Key Design Decisions:**
- "ab €X" pricing for quick comparison (industry standard)
- Bottom sheets for mobile filters (non-disruptive)
- Infinite scroll on mobile, pagination on desktop
- Next 3 time slots preview (reduces clicks)
- Map view as optional toggle (not default)

All components use **shadcn/ui library** exclusively, ensuring consistency with the existing Massava design system.
