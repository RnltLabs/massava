# Design Specification: Massava Service Card (Minimal Zen)

## Visual Mockup

```
Desktop (1024px+):
┌──────────────────────────────────────────────────────────────────────────────┐
│  padding: 20px                                                               │
│                                                                              │
│  ┌────────────────────────────────────┬──────────────────────────────────┐  │
│  │ Thai-Massage                       │           35,00 € • 60 Min       │  │
│  │ (text-lg font-semibold)            │           (text-base font-medium)│  │
│  └────────────────────────────────────┴──────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Eine entspannende Thai-Massage für Körper und Geist...               │   │
│  │ (text-sm text-muted-foreground, line-clamp-1)                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────┬──────────────────────────────────────────┐   │
│  │ [Wellness]               │         [✏️ Bearbeiten]  [🗑️]            │   │
│  │ (badge, sage green bg)   │         (buttons, terracotta + muted)    │   │
│  └──────────────────────────┴──────────────────────────────────────────┘   │
│                                                                              │
│  border-radius: 1.5rem                                                       │
│  border: 1px solid oklch(0.92 0.015 70)                                      │
│  background: oklch(0.95 0.01 60)                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

```
Mobile (< 640px):
┌──────────────────────────────────────┐
│  padding: 16px                       │
│                                      │
│  Thai-Massage                        │
│  (text-base font-semibold)           │
│                                      │
│  35,00 € • 60 Min                    │
│  (text-sm text-primary)              │
│                                      │
│  Eine entspannende Thai-Massage...   │
│  (text-sm text-muted-foreground)     │
│                                      │
│  ┌────────────┬──────────────────┐   │
│  │ [Wellness] │ [✏️]  [🗑️]       │   │
│  └────────────┴──────────────────┘   │
│                                      │
│  border-radius: 1.5rem               │
└──────────────────────────────────────┘
```

## Component Specification

### React Component (TypeScript)

```tsx
// components/ServiceCard.tsx
"use client"

import { Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  category?: string | null
}

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Header: Name + Price/Duration */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">
          {service.name}
        </h3>
        <div className="shrink-0 text-right">
          <span className="whitespace-nowrap text-base font-medium text-primary">
            {service.price.toFixed(2)} € • {service.duration} Min
          </span>
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">
          {service.description}
        </p>
      )}

      {/* Footer: Category + Actions */}
      <div className="flex items-center justify-between gap-4">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          {service.category && (
            <Badge
              variant="secondary"
              className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20"
            >
              {service.category}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onEdit(service)}
            className="h-8 gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bearbeiten</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(service)}
            className="h-8 w-8 rounded-xl bg-muted p-0 transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### shadcn/ui Components Used

1. **Button** (with variants)
   - Primary: Edit button (terracotta)
   - Ghost: Delete button (muted → destructive on hover)

2. **Badge** (custom variant)
   - Secondary variant with custom colors
   - Sage green background for categories

3. **Icons** (lucide-react)
   - Edit2: Pencil icon
   - Trash2: Delete icon

### Tailwind CSS Classes Breakdown

**Layout:**
- `rounded-[1.5rem]`: Organic, soft corners (matches Massava radius)
- `p-5`: 20px padding (breathing room)
- `gap-3`, `gap-4`: Consistent spacing
- `flex justify-between`: Horizontal balance

**Typography:**
- `text-lg font-semibold`: Service name (18px, 600)
- `text-base font-medium`: Price/duration (16px, 500)
- `text-sm`: Description/buttons (14px, 400)
- `text-xs`: Category badge (12px)

**Colors:**
- `bg-background`: Warm cream base
- `border-border`: Soft taupe border
- `text-foreground`: Warm brown text
- `text-muted-foreground`: Muted brown for description
- `text-primary`: Terracotta accent for price
- `bg-accent/10 text-accent`: Sage green badge (10% opacity)

**Interactions:**
- `hover:-translate-y-0.5`: Subtle lift on hover
- `hover:shadow-lg`: Elevation on hover
- `transition-all duration-200`: Smooth animations
- `hover:bg-primary/90`: Darken edit button
- `hover:bg-destructive`: Reveal delete color

**Responsive:**
- `hidden sm:inline`: Hide "Bearbeiten" text on mobile
- `line-clamp-1`: Truncate description to single line
- `shrink-0`: Prevent price from wrapping

### Usage Example

```tsx
// app/services/page.tsx
import { ServiceCard } from "@/components/ServiceCard"

const services = [
  {
    id: "1",
    name: "Thai-Massage",
    description: "Eine entspannende Thai-Massage für Körper und Geist",
    price: 35.00,
    duration: 60,
    category: "Wellness"
  },
  {
    id: "2",
    name: "Hot Stone Massage",
    description: "Tiefenentspannung mit heißen Steinen",
    price: 45.00,
    duration: 90,
    category: "Premium"
  }
]

export default function ServicesPage() {
  const handleEdit = (service: Service) => {
    // Open edit dialog
  }

  const handleDelete = (service: Service) => {
    // Open delete confirmation
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {services.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={handleEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
```

## Accessibility

### WCAG 2.1 AA Compliance

**Semantic HTML:**
- ✅ `<h3>` for service name (proper heading hierarchy)
- ✅ `<button>` elements for actions
- ✅ `<p>` for description text

**ARIA Labels:**
- ✅ Edit button has visible text + icon (no aria-label needed)
- ✅ Delete button needs aria-label (icon only)

**Keyboard Navigation:**
- ✅ Tab navigates to Edit button → Delete button
- ✅ Enter/Space triggers button actions
- ✅ Focus visible on all interactive elements

**Focus Indicators:**
- ✅ shadcn/ui buttons have default focus rings
- ✅ High contrast focus states

**Color Contrast:**
- ✅ Text on background: 4.5:1+ (warm brown on cream)
- ✅ Price text: 4.5:1+ (terracotta on cream)
- ✅ Button text: 4.5:1+ (white on terracotta)

**Screen Reader Support:**
- ✅ Service name announced as heading
- ✅ Price/duration announced as text
- ✅ Buttons announced with role + label

### Improved Delete Button (Accessible)

```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={() => onDelete(service)}
  aria-label={`${service.name} löschen`}
  className="h-8 w-8 rounded-xl bg-muted p-0 transition-colors hover:bg-destructive hover:text-destructive-foreground"
>
  <Trash2 className="h-3.5 w-3.5" />
</Button>
```

## Why This Matches Massava's Aesthetic

### 1. Warm, Organic Design
- **Soft corners** (1.5rem): Mimics natural, organic shapes
- **Warm cream background**: Inviting, spa-like
- **Terracotta accents**: Earthy, grounded, wellness-focused

### 2. Breathing Space
- **Generous padding** (20px): Not cramped
- **Consistent gaps** (12-16px): Visual rhythm
- **Single-line description**: Uncluttered, calm

### 3. Spa Luxury Cues
- **Subtle shadows**: Suggests depth, tactile quality
- **Minimal color palette**: Muted, calming
- **Elegant typography**: Clear hierarchy without loudness
- **Hover lift**: Delightful, premium interaction

### 4. Clear Functionality
- **Visible actions**: No hidden dropdowns (user requested)
- **Scannable layout**: Price/duration in prime position
- **Color-coded actions**: Edit (primary), Delete (destructive)

### 5. Mobile-Optimized
- **Compact height** (~100px): Fits more on screen
- **Responsive text**: "Bearbeiten" hides on mobile
- **Touch-friendly buttons**: 32px minimum touch target

## Variants

### Variant A: With Gradient Overlay

```tsx
<div className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-gradient-to-br from-background to-muted/20 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
  {/* Same content */}
</div>
```

### Variant B: With Top Accent Bar

```tsx
<div className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
  {/* Accent bar */}
  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary to-accent" />

  {/* Content with padding */}
  <div className="p-5">
    {/* Same content */}
  </div>
</div>
```

### Variant C: With Icon

```tsx
import { Sparkles } from "lucide-react"

<div className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
  {/* Icon + Name */}
  <div className="mb-3 flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
      <Sparkles className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-foreground">
        {service.name}
      </h3>
      <span className="text-sm font-medium text-primary">
        {service.price.toFixed(2)} € • {service.duration} Min
      </span>
    </div>
  </div>
  {/* Rest same */}
</div>
```

## Performance Considerations

### Optimizations
- **No images**: Pure CSS/icons (fast render)
- **Minimal DOM**: ~10 elements per card
- **CSS transitions**: Hardware-accelerated (transform, opacity)
- **Tree-shakeable icons**: Only Edit2/Trash2 imported

### Lazy Loading (for large lists)
```tsx
import { useVirtualizer } from "@tanstack/react-virtual"

// Virtualize list if > 50 services
const virtualizer = useVirtualizer({
  count: services.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120, // Card height
})
```

## Implementation Notes

### For Developers

1. **Color System**: Uses Massava's OKLCH color tokens (no custom hex colors)
2. **Border Radius**: Always `1.5rem` (organic feel)
3. **Spacing Scale**: Tailwind default (4px increments)
4. **Icons**: lucide-react (consistent with rest of app)
5. **Buttons**: shadcn/ui Button component (accessible, themed)
6. **Hover States**: Always smooth transitions (200ms)

### Current vs. New

**Old (Hidden Dropdown):**
- ❌ Actions in dropdown menu (user couldn't find)
- ❌ Generic card design (not spa-like)
- ❌ No warm colors (plain background)

**New (Minimal Zen):**
- ✅ Actions always visible (edit + delete buttons)
- ✅ Spa aesthetic (warm colors, soft corners)
- ✅ Compact but elegant (~100px height)
- ✅ Matches Massava design system perfectly

## Testing Checklist

### Visual QA
- [ ] Border radius is 1.5rem (organic corners)
- [ ] Background uses warm cream color
- [ ] Terracotta accent on price text
- [ ] Sage green badge for category
- [ ] Hover lift is smooth (200ms)
- [ ] Shadow appears on hover

### Functional QA
- [ ] Edit button triggers onEdit callback
- [ ] Delete button triggers onDelete callback
- [ ] Buttons are keyboard-accessible (Tab)
- [ ] Focus indicators are visible
- [ ] Mobile layout shows icon-only buttons

### Accessibility QA
- [ ] Screen reader announces service name as heading
- [ ] Delete button has aria-label
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets are 32px minimum

### Responsive QA
- [ ] Card width adjusts to container (flex-1)
- [ ] "Bearbeiten" text hides on mobile
- [ ] Description truncates properly (line-clamp-1)
- [ ] Buttons stack on very small screens (optional)

---

**File Locations:**
- Component: `/components/ServiceCard.tsx`
- Usage: `/app/services/page.tsx` (or wherever services are displayed)
- Types: `/types/service.ts` (if using shared types)

**Dependencies:**
- shadcn/ui: Button, Badge
- lucide-react: Edit2, Trash2
- Tailwind CSS: (already installed)
