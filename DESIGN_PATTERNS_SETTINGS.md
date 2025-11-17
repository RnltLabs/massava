# Massava Settings Pages Design Patterns Style Guide

**Last Updated:** 2025-11-11  
**Project:** Massava  
**Scope:** Settings Pages Redesign and Reusable Patterns

---

## Executive Summary

This guide documents the proven design patterns used throughout Massava's business portal, extracted from:
- **Service Pages** (gold standard CRUD interface)
- **Studio Registration Flow** (step-by-step wizard)
- **Location & Images Settings** (specialized form pages)
- **Opening Hours Management** (complex data structures)

The patterns are organized for **easy replication** across new settings pages with emphasis on accessibility, mobile-first design, and consistent developer experience.

---

## Table of Contents

1. [Page Structure & Layout](#page-structure--layout)
2. [Service Page Pattern (Gold Standard)](#service-page-pattern-gold-standard)
3. [Companion Popups & Sheets](#companion-popups--sheets)
4. [Form Patterns](#form-patterns)
5. [Mobile-First Patterns](#mobile-first-patterns)
6. [Business Portal Conventions](#business-portal-conventions)
7. [Component Reference](#component-reference)
8. [Code Examples](#code-examples)
9. [Dos and Don'ts](#dos-and-donts)
10. [Implementation Checklist](#implementation-checklist)

---

## Page Structure & Layout

### Standard Settings Page Structure

All settings pages follow a consistent hierarchy:

```
Server Component (page.tsx)
├── Authentication check
├── Data fetching from database
└── Pass to Client Component

Client Component (PageClient.tsx or PageNameClient.tsx)
├── Layout wrapper (gradient background)
├── Back button + breadcrumb
├── Page header (title + subtitle)
├── Main content area
│  ├── Card-based sections
│  ├── Forms
│  └── Preview sidebars
└── Action buttons (save, delete, etc.)
```

### File Structure by Settings Page

```
app/[locale]/business/settings/{feature}/
├── page.tsx                          (server component)
└── _components/
    ├── {Feature}Client.tsx           (main layout)
    ├── {Feature}Form.tsx             (form handling)
    ├── {Feature}Section.tsx          (content section)
    ├── {Feature}Dialog.tsx           (modal for actions)
    └── {Feature}Preview.tsx          (preview/preview sidebar)
```

**Examples:**
- Location Settings: `LocationContactClient.tsx`, `LocationContactForm.tsx`, `LocationMap.tsx`, `LocationPreview.tsx`
- Images Settings: `StudioImagesClient.tsx`, `LogoSection.tsx`, `GallerySection.tsx`, `ProfilePreview.tsx`
- Services: `ServicesPageClient.tsx`, `ServiceDeleteDialog.tsx`

---

## Service Page Pattern (Gold Standard)

### Overview

The **Services page** is the proven gold standard for CRUD operations in Massava. It demonstrates:
- Proper separation of concerns (server/client components)
- Responsive card-based layouts
- Inline action buttons (always visible)
- Keyboard accessible dialogs
- Mobile-first design

### Key Characteristics

```
Location: app/[locale]/business/settings/_components/ServicesPageClient.tsx
Status: Production, Proven Pattern
Use for: Any CRUD-heavy settings page (Services, Packages, Capacity, etc.)
```

### Page Layout

**Desktop (1024px+):**
```
┌─────────────────────────────────────────────────────────────┐
│  Back Button  Services                                       │
│               Manage your service offerings                  │
└─────────────────────────────────────────────────────────────┘
│                                                   [+ Add]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ Thai Massage         │  │ Hot Stone Massage    │         │
│  │ 35€ • 60 Min         │  │ 45€ • 90 Min         │         │
│  │ Relaxing...          │  │ Deep relaxation...   │         │
│  │ [Wellness] [✏️] [🗑️] │  │ [Premium] [✏️] [🗑️] │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ Swedish Massage      │  │ Couples Massage      │         │
│  │ 40€ • 75 Min         │  │ 150€ • 120 Min       │         │
│  │ Full body massage... │  │ Couples relaxation.. │         │
│  │ [Wellness] [✏️] [🗑️] │  │ [Premium] [✏️] [🗑️] │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Mobile (<640px):**
```
┌──────────────────────────┐
│ ← Services              │
├──────────────────────────┤
│                    [+]   │
├──────────────────────────┤
│ Thai Massage             │
│ 35€ • 60 Min             │
│ Relaxing...              │
│ [Wellness] [✏️] [🗑️]    │
├──────────────────────────┤
│ Hot Stone Massage        │
│ 45€ • 90 Min             │
│ Deep relaxation...       │
│ [Premium] [✏️] [🗑️]    │
└──────────────────────────┘
```

### Service Card Component

The service card is a self-contained, reusable component. Current implementation:

**File:** `/app/[locale]/business/settings/_components/` (referenced in design-spec)

**Key Features:**
- ✅ **Visible Actions**: Edit and Delete buttons always visible (no hidden dropdowns)
- ✅ **Responsive**: Adapts to mobile/tablet/desktop
- ✅ **Accessible**: ARIA labels, keyboard navigation, semantic HTML
- ✅ **Spa Aesthetic**: Warm colors (cream, terracotta), soft rounded corners (1.5rem)
- ✅ **Performance**: No images, pure CSS, minimal DOM

**Visual Specs:**

```css
/* Card Container */
border-radius: 1.5rem
border: 1px solid oklch(0.92 0.015 70)    /* soft taupe */
background: oklch(0.95 0.01 60)           /* warm cream */
padding: 20px (5 Tailwind units)
gap: 12-16px (consistent spacing)

/* Typography */
Title: text-lg font-semibold (18px, 600)
Price: text-base font-medium text-primary (16px, 500, terracotta)
Description: text-sm text-muted-foreground (14px, clamp to 1 line)
Category: text-xs font-medium (12px, sage green badge)

/* Interactions */
Hover: -translate-y-0.5 + shadow-lg (200ms smooth transition)
Buttons: Always visible, keyboard accessible
Delete: Icon-only with aria-label

/* Mobile Optimizations */
"Bearbeiten" text hides below 640px
Buttons remain 32px touch targets minimum
Description truncates to single line
```

### Implementation Pattern

**Server Component (page.tsx):**
```typescript
async function getStudioServices(userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedStudios: {
        include: {
          studio: {
            include: { services: true }
          }
        }
      }
    }
  });
  return user?.ownedStudios[0]?.studio?.services ?? [];
}

export default async function ServicesPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect(`/${locale}/auth/login?callbackUrl=...`);
  
  const services = await getStudioServices(session.user.email);
  return <ServicesPageClient services={services} />;
}
```

**Client Component (ServicesPageClient.tsx):**
```typescript
'use client';

export function ServicesPageClient({ services, studioId, locale }: Props) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Section - Fixed on Mobile */}
        <div className="flex-shrink-0 px-4 pt-4 pb-6 sticky top-0 z-10 backdrop-blur-lg">
          <Link href={`/${locale}/business/more`}>
            <ArrowLeftIcon /> Einstellungen
          </Link>
          <h1 className="text-3xl font-bold">Services verwalten</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon /> Hinzufügen
          </Button>
        </div>
        
        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {services.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => { setSelectedService(service); setIsDialogOpen(true); }}
                  onDelete={() => { setSelectedService(service); setIsDeleteOpen(true); }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Dialogs */}
        <ServiceManagementDialog
          isOpen={isDialogOpen}
          service={selectedService}
          onClose={() => setIsDialogOpen(false)}
        />
      </div>
    </div>
  );
}
```

### When to Use This Pattern

**Perfect for:**
- Services management
- Team members/staff
- Product packages
- Capacity/availability slots
- Any list with CRUD operations

**Not recommended for:**
- Complex forms with many interdependent fields
- Settings requiring map interactions
- Multi-step wizards

---

## Companion Popups & Sheets

### Overview

Massava uses **bottom sheets** for mobile-friendly input dialogs. These are "companion" UI elements that help users input data without leaving the context.

### Sheet Component (Radix UI)

**File:** `/components/ui/sheet.tsx`

```typescript
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="bottom" className="h-auto rounded-t-3xl p-6">
    <VisuallyHidden>
      <SheetTitle>Dialog Title</SheetTitle>
    </VisuallyHidden>
    {/* Your content */}
  </SheetContent>
</Sheet>
```

### Success Examples in Codebase

#### 1. QuickActionsSheet (Navigation)
**File:** `/components/business/QuickActionsSheet.tsx`

**Usage:** Bottom sheet with action buttons

```typescript
export function QuickActionsSheet({
  open,
  onOpenChange,
  locale,
}: QuickActionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[85vh] rounded-t-3xl p-6"
      >
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {quickActions.map(action => (
            <ActionButton
              action={action}
              onClick={action.action}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Key Pattern:**
- Bottom sheet slides up from bottom on mobile
- Full-screen dialog on desktop
- Smooth rounded top corners (3xl radius)
- Action buttons with icons + text
- Memoized components for performance

#### 2. TimePickerSheet (Input Companion)
**File:** `/app/[locale]/dashboard/_components/studio-registration/components/TimePickerSheet.tsx`

**Usage:** Time input in a bottom sheet (from registration flow)

```typescript
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="bottom" className="rounded-t-3xl">
    {/* Time Picker UI */}
    <div className="space-y-4">
      <h2>Select Time</h2>
      {/* Hour/Minute inputs */}
      <Button onClick={handleConfirm}>Confirm</Button>
    </div>
  </SheetContent>
</Sheet>
```

#### 3. Image Upload Dialogs (Upload Companion)
**File:** `/app/[locale]/business/settings/images/_components/LogoUploadDialog.tsx`
**File:** `/app/[locale]/business/settings/images/_components/GalleryUploadDialog.tsx`

**Usage:** Drag-and-drop file uploads in dialogs

```typescript
export function LogoUploadDialog({
  studioId,
  isOpen,
  onClose,
  onLogoUpdate,
}: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Only JPG, PNG, or WebP allowed';
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'File too large (max 2MB)';
    }
    return null;
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      const error = validateFile(e.dataTransfer.files[0]);
      if (!error) setSelectedFile(e.dataTransfer.files[0]);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p>Drag your logo here or click to select</p>
        </div>
        
        {previewUrl && <Image src={previewUrl} alt="preview" />}
        
        <Button onClick={handleUpload} disabled={!selectedFile}>
          {isUploading ? <Loader2 className="animate-spin" /> : 'Upload'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

### Sheet Best Practices

**DO:**
- ✅ Use for temporary input (time, file, small forms)
- ✅ Show rounded top corners on mobile (`rounded-t-3xl`)
- ✅ Include clear title and cancel option
- ✅ Support drag-and-drop for file inputs
- ✅ Show validation errors inline
- ✅ Prevent scroll behind sheet on mobile

**DON'T:**
- ❌ Use for complex multi-step forms (use Dialog instead)
- ❌ Stack multiple sheets
- ❌ Make sheet full-height unless necessary
- ❌ Use without backdrop overlay
- ❌ Forget accessibility (title, ARIA labels)

---

## Form Patterns

### Location Form Pattern

**File:** `/app/[locale]/business/settings/location/_components/LocationContactForm.tsx`

This is the most complex form in the settings, demonstrating:
- Two-column layout (desktop) / single column (mobile)
- Google Maps integration
- Address autocomplete
- Interactive map with draggable marker
- Form state management
- Server action integration
- Toast notifications

**Structure:**

```typescript
export function LocationContactForm({ studio }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    address: studio.address,
    city: studio.city,
    postalCode: studio.postalCode || '',
    latitude: studio.latitude || 52.52,
    longitude: studio.longitude || 13.405,
    phone: studio.phone,
    email: studio.email,
    website: studio.website || '',
  });
  const [isMapEditMode, setIsMapEditMode] = useState(false);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await updateStudioProfile({
      name: studio.name,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      latitude: formData.latitude,
      longitude: formData.longitude,
    });
    
    if (result.success) {
      toast({ title: 'Success', description: '...' });
      router.refresh();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    
    setIsLoading(false);
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column - Form (60%) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Address Section - Card */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Address Autocomplete */}
              <div className="space-y-2">
                <Label>Street Address *</Label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(addr) => setFormData({...formData, address: addr})}
                  onAddressSelect={handleAddressSelect}
                  required
                />
              </div>
              
              {/* Other fields */}
              <Input label="City" value={formData.city} />
              <Input label="Postal Code" value={formData.postalCode} />
              
            </CardContent>
          </Card>
          
          {/* Contact Section - Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Phone" value={formData.phone} />
              <Input label="Email" type="email" value={formData.email} />
              <Input label="Website (Optional)" value={formData.website} />
            </CardContent>
          </Card>
          
        </div>
        
        {/* Right Column - Map + Preview (40%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Map Section */}
          <Card>
            <CardHeader>
              <CardTitle>Location on Map</CardTitle>
              <Button onClick={() => setIsMapEditMode(!isMapEditMode)}>
                {isMapEditMode ? 'Done' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent>
              <LocationMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                isEditMode={isMapEditMode}
                onPositionChange={handleMapPositionChange}
              />
            </CardContent>
          </Card>
          
          {/* Preview Section */}
          <LocationPreview address={formData} />
          
        </div>
        
      </div>
      
      {/* Sticky Save Button on Mobile */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full md:ml-auto md:w-auto sticky bottom-0 md:static"
      >
        {isLoading && <Loader2 className="animate-spin mr-2" />}
        Save Changes
      </Button>
      
    </form>
  );
}
```

### Address Autocomplete Pattern

**File:** `/app/[locale]/business/settings/location/_components/AddressAutocomplete.tsx`
**File:** `/app/[locale]/dashboard/_components/studio-registration/components/AddressAutocomplete.tsx`

**Key Feature:** Addresses can be populated WITHOUT requiring latitude/longitude upfront. Auto-completion fills all fields.

```typescript
export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  error,
  required,
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const performAddressSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const results = await debouncedSearch(query);
      setSuggestions(results);
      setIsOpen(true);
    } catch (error) {
      logger.error('Address search failed', { error });
      // Graceful degradation - allow manual entry
    }
    setIsLoading(false);
  };
  
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.address); // Update input
    onAddressSelect({
      street: suggestion.address,
      city: suggestion.city,
      postalCode: suggestion.postalCode,
      country: suggestion.country,
    });
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => performAddressSearch(e.target.value)}
        placeholder="Start typing address..."
        error={error}
        required={required}
      />
      
      {isLoading && <Loader2 className="absolute right-3 animate-spin" />}
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              <div className="font-medium">{suggestion.address}</div>
              <div className="text-sm text-gray-500">
                {suggestion.city} • {suggestion.postalCode}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Opening Hours Pattern

**File:** `/app/[locale]/business/settings/hours/_components/PreviewCard.tsx`

```typescript
interface PreviewCardProps {
  hours: OpeningHours;
}

export function PreviewCard({ hours }: PreviewCardProps) {
  return (
    <Card className="rounded-3xl border-2 border-[#B56550]/20 bg-gradient-to-br from-white to-[#B56550]/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#B56550]" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const dayHours = hours[day.key];
            if (!dayHours.isOpen) {
              return (
                <div key={day.key} className="flex justify-between px-3 py-2">
                  <span className="text-sm font-medium">{day.label}</span>
                  <span className="text-sm text-gray-400">Closed</span>
                </div>
              );
            }
            
            return (
              <div key={day.key} className="flex justify-between px-3 py-2 rounded-lg hover:bg-white/50">
                <span className="text-sm font-medium">{day.label}</span>
                <span className="text-sm font-semibold text-[#B56550]">
                  {formatTimeRange(dayHours.openTime, dayHours.closeTime)}
                  {dayHours.breakStart && dayHours.breakEnd && (
                    <> (Break: {formatTimeRange(dayHours.breakStart, dayHours.breakEnd)})</>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Studio Registration Flow (Multi-Step)

**File:** `/app/[locale]/dashboard/_components/studio-registration/`

This is a complete multi-step form with context management. Use this pattern for complex onboarding flows.

**Key Features:**
- Step-by-step wizard with progress indicator
- Context-based state management
- Each step is self-contained
- Bottom sheet for secondary inputs (time picker)
- Address autocomplete without requiring lat/lng

**Steps:**
1. Welcome (introduction)
2. Basic Info (name, description)
3. Address (address with autocomplete)
4. Images (logo + gallery with drag-reorder)
5. Contact (phone, email, website)
6. Opening Hours (complex day/time picker)
7. Capacity (staff count, max bookings)
8. Services (add services)
9. Success (confirmation)

---

## Mobile-First Patterns

### Back Navigation Pattern

**All settings pages must have back navigation:**

```typescript
// In Client Component
<Link
  href={`/${locale}/business/more`}
  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
>
  <ArrowLeftIcon className="h-4 w-4" />
  <span>Einstellungen</span>
</Link>
```

**Pattern:**
- Arrow icon + text label
- Subtle gray color, darkens on hover
- Always clickable, not a visual-only hint
- Consistent placement at top-left

### Sticky Header Pattern

**For list views with headers (Services, etc.):**

```typescript
<div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
  {/* Back button, title, action buttons */}
</div>
```

**Benefits:**
- Header stays visible while scrolling
- Frosted glass effect (blur) prevents content overlap
- Action buttons always accessible
- z-10 ensures it's above content

### Sticky Action Buttons

**For forms on mobile:**

```typescript
<Button
  type="submit"
  disabled={isLoading}
  className="w-full md:ml-auto md:w-auto sticky bottom-0 md:static"
>
  {isLoading && <Loader2 className="animate-spin mr-2" />}
  Save
</Button>
```

**Pattern:**
- Full width on mobile (sticky to bottom)
- Normal width on desktop (static)
- Always accessible while scrolling
- Loading state with spinner

### Bottom Sheet Pattern for Mobile

**Modals should use sheets on mobile:**

```typescript
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent
    side="bottom"
    className="h-auto rounded-t-3xl p-6 overflow-y-auto max-h-[85vh]"
  >
    {/* Content */}
  </SheetContent>
</Sheet>
```

**CSS Classes:**
- `side="bottom"`: Slides up from bottom
- `rounded-t-3xl`: Organic curved top
- `h-auto`: Only as tall as needed
- `max-h-[85vh]`: Doesn't cover entire screen
- `overflow-y-auto`: Scroll if content overflows

### Responsive Grid Patterns

**2-column layout that collapses to 1 on mobile:**

```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Cards */}
</div>
```

**Variations:**

```typescript
// 60/40 split (form / preview)
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">{/* Form */}</div>
  <div className="lg:col-span-2">{/* Preview */}</div>
</div>

// 3-column grid
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

### Touch-Friendly Sizing

**All interactive elements must be at least 32px × 32px:**

```typescript
// Good - adequate touch target
<Button size="sm" className="h-10 w-10" />

// Bad - too small
<button className="h-6 w-6" />

// Use consistent spacing
gap-2 (8px)  // Small gaps
gap-3 (12px) // Medium gaps
gap-4 (16px) // Large gaps
```

### Loading States

**Show loading state during submission:**

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    const result = await serverAction(data);
    if (result.success) {
      toast({ title: 'Success' });
    } else {
      toast({ title: 'Error', variant: 'destructive' });
    }
  } finally {
    setIsLoading(false);
  }
}

return (
  <Button type="submit" disabled={isLoading}>
    {isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Saving...
      </>
    ) : (
      'Save Changes'
    )}
  </Button>
);
```

---

## Business Portal Conventions

### Page Header Pattern

**All settings pages start with:**

```typescript
<div className="space-y-4">
  {/* Back Button */}
  <Link href={`/${locale}/business/more`}>
    <ArrowLeftIcon className="h-4 w-4" />
    Einstellungen
  </Link>
  
  {/* Title + Subtitle */}
  <div>
    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
      Studio-Profil
    </h1>
    <p className="text-muted-foreground mt-1">
      Verwalten Sie Ihre Studio-Informationen
    </p>
  </div>
</div>
```

**Pattern:**
- Back navigation above title
- Descriptive title (German, clear action)
- Optional subtitle for context
- 4-unit spacing between sections

### Card-Based Sections

**Organize content into logical cards:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Optional: What this section is for</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Form fields or content */}
  </CardContent>
</Card>
```

**Pattern:**
- One logical concept per card
- Clear headers with icons if needed
- Consistent spacing inside cards
- Cards stack vertically on mobile

### Action Button Placement

**Different patterns for different pages:**

**Pattern 1: Header Action (Add/Create)**
```typescript
// In sticky header for list views
<Button onClick={handleAdd}>
  <PlusIcon className="mr-2" />
  Add Item
</Button>
```

**Pattern 2: Footer Action (Save/Submit)**
```typescript
// After form, sticky on mobile
<Button type="submit" disabled={isLoading}>
  Save Changes
</Button>
```

**Pattern 3: Inline Actions (Edit/Delete)**
```typescript
// On individual items
<Button onClick={() => handleEdit(item)}>Edit</Button>
<Button variant="ghost" onClick={() => handleDelete(item)}>Delete</Button>
```

### Success & Error States

**Toast notifications (not alerts):**

```typescript
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

// Success
toast({
  title: 'Erfolg',
  description: 'Ihre Daten wurden gespeichert.',
});

// Error
toast({
  title: 'Fehler',
  description: error?.message || 'Something went wrong',
  variant: 'destructive',
});

// Loading
toast({
  title: 'Speichern...',
  description: 'Bitte warten Sie',
});
```

**Pattern:**
- Use toast for transient feedback
- Use inline validation for form errors
- Use dialog for destructive confirmations (delete)

### Empty States

**When no data exists:**

```typescript
{items.length === 0 ? (
  <Card>
    <CardContent className="py-16 text-center space-y-4">
      <p className="text-lg font-medium text-neutral-900">
        No items yet
      </p>
      <p className="text-sm text-muted-foreground">
        Get started by adding your first item
      </p>
      <Button onClick={handleAdd}>
        <PlusIcon className="mr-2" />
        Add Item
      </Button>
    </CardContent>
  </Card>
) : (
  <div className="grid gap-4">
    {/* Items */}
  </div>
)}
```

### Validation & Error Display

**For forms:**

```typescript
const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

const validateField = (field: string, value: string) => {
  try {
    schema.shape[field].parse(value);
    setLocalErrors(prev => ({ ...prev, [field]: '' }));
  } catch (error) {
    if (error instanceof ZodError) {
      setLocalErrors(prev => ({
        ...prev,
        [field]: error.errors[0].message
      }));
    }
  }
};

return (
  <div className="space-y-2">
    <Label htmlFor={field}>{label}</Label>
    <Input
      id={field}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => validateField(field, value)}
      className={errors[field] ? 'border-red-500' : ''}
      aria-invalid={!!errors[field]}
      aria-describedby={errors[field] ? `error-${field}` : undefined}
    />
    {errors[field] && (
      <p id={`error-${field}`} className="text-sm text-red-500">
        {errors[field]}
      </p>
    )}
  </div>
);
```

---

## Component Reference

### UI Components Used Across Settings

| Component | Location | Use Case |
|-----------|----------|----------|
| Card | shadcn/ui | Content sections |
| Button | shadcn/ui | Actions (submit, delete, etc.) |
| Input | shadcn/ui | Text inputs |
| Label | shadcn/ui | Form labels |
| Sheet | @radix-ui/react-dialog | Mobile bottom sheets |
| Dialog | shadcn/ui | Modals (desktop) |
| Toast | Custom hook | Feedback notifications |
| Badge | shadcn/ui | Category/status pills |
| Progress | shadcn/ui | Upload progress |
| Tabs | shadcn/ui | Tab navigation |

### Icon Library

All icons use **lucide-react**:

```typescript
import {
  ArrowLeftIcon,        // Back button
  PlusIcon,            // Add action
  Edit2Icon,           // Edit action
  Trash2Icon,          // Delete action
  MapPin,              // Location
  Phone,               // Phone
  Mail,                // Email
  Globe,               // Website
  Clock,               // Hours
  Camera,              // Photo
  Upload,              // File upload
  Loader2,             // Loading spinner
  Check,               // Success
  X,                   // Close
  ChevronDown,         // Dropdown
} from 'lucide-react'
```

### Color System

Massava uses OKLCH colors for warmth and accessibility:

```
Primary (Terracotta):     #B56550
Accent (Sage Green):      Used for badges
Background (Cream):       oklch(0.95 0.01 60)
Muted Foreground (Taupe): oklch(0.6 0.02 70)
Border:                   oklch(0.92 0.015 70)
```

---

## Code Examples

### Example 1: Simple Settings Page (Template)

Create a new settings page by copying this template:

**File:** `app/[locale]/business/settings/{feature}/page.tsx`

```typescript
import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { {Feature}Client } from './_components/{Feature}Client';

interface {Feature}PageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getStudio{Feature}(userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedStudios: {
        include: {
          studio: {
            select: {
              id: true,
              name: true,
              // ... fields you need
            },
          },
        },
      },
    },
  });

  return user?.ownedStudios[0]?.studio ?? null;
}

export default async function {Feature}Page({
  params,
}: {Feature}PageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business/settings/{feature}`);
  }

  const studio = await getStudio{Feature}(session.user?.email ?? '');

  if (!studio) {
    redirect(`/${locale}/business/more`);
  }

  return <{Feature}Client studio={studio} locale={locale} />;
}
```

**File:** `app/[locale]/business/settings/{feature}/_components/{Feature}Client.tsx`

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { {Feature}Form } from './{Feature}Form';

interface {Feature}ClientProps {
  studio: {
    id: string;
    name: string;
    // ... fields
  };
  locale: string;
}

export function {Feature}Client({
  studio,
  locale,
}: {Feature}ClientProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Back Button */}
        <Link
          href={`/${locale}/business/more`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Einstellungen</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Feature Title
          </h1>
          <p className="text-muted-foreground mt-2">
            Feature description
          </p>
        </div>

        {/* Form Component */}
        <{Feature}Form studio={studio} />
      </div>
    </div>
  );
}
```

### Example 2: Simple CRUD Page (Services Pattern)

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, Edit2Icon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface ItemsPageClientProps {
  items: Item[];
  studioId: string;
  locale: string;
}

export function ItemsPageClient({
  items,
  studioId,
  locale,
}: ItemsPageClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static">
      
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Items"
          subtitle="Manage your items"
          breadcrumb="Settings"
          backHref={`/${locale}/business/more`}
          backLabel="Settings"
          showBackButton={true}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add
            </Button>
          }
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-0">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-lg font-medium mb-4">No items yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusIcon className="mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-border bg-background p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <div className="mb-3 flex justify-between">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <span className="text-primary font-medium">${item.price}</span>
                </div>
                {item.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit2Icon className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {/* Add your dialog components here */}
    </div>
  );
}
```

### Example 3: Form with Validation

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(3, 'Name too short').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone too short').optional(),
});

type FormData = z.infer<typeof formSchema>;

export function SettingsForm({ studio }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: studio.name,
    email: studio.email,
    phone: studio.phone || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { toast } = useToast();
  const router = useRouter();

  const validateField = (field: keyof FormData, value: unknown) => {
    try {
      formSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: error.errors[0].message
        }));
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      // Validate full form
      const validated = formSchema.parse(formData);
      
      setIsLoading(true);
      const result = await updateStudio(validated);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Your settings have been saved.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: typeof errors = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="name">Studio Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => validateField('name', formData.name)}
              className={errors.name ? 'border-red-500' : ''}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'error-name' : undefined}
            />
            {errors.name && (
              <p id="error-name" className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={() => validateField('email', formData.email)}
              className={errors.email ? 'border-red-500' : ''}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'error-email' : undefined}
            />
            {errors.email && (
              <p id="error-email" className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onBlur={() => validateField('phone', formData.phone)}
              className={errors.phone ? 'border-red-500' : ''}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'error-phone' : undefined}
            />
            {errors.phone && (
              <p id="error-phone" className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full md:w-auto"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
```

---

## Dos and Don'ts

### DO

✅ **DO use server components for data fetching**
```typescript
async function getStudioData(email: string) {
  const studio = await prisma.studio.findUnique({...});
  return studio;
}
```

✅ **DO use 'use client' for interactivity**
```typescript
'use client';
export function SettingsForm() {
  const [state, setState] = useState();
  // ...
}
```

✅ **DO validate on both client and server**
```typescript
// Client-side with Zod
const errors = validate(formData);

// Server-side with Zod
const result = schema.safeParse(data);
```

✅ **DO show loading states**
```typescript
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="animate-spin" />}
  Save
</Button>
```

✅ **DO use toast for feedback**
```typescript
toast({ title: 'Saved', description: '...' });
```

✅ **DO make buttons at least 32×32px**
```typescript
<Button size="sm" className="h-10 w-10" /> // ✅ Good
<button className="h-6 w-6" />              // ❌ Too small
```

✅ **DO handle empty states gracefully**
```typescript
{items.length === 0 ? <EmptyState /> : <ItemsList />}
```

✅ **DO use back buttons consistently**
```typescript
<Link href={`/${locale}/business/more`}>
  <ArrowLeftIcon /> Back
</Link>
```

✅ **DO organize related fields in cards**
```typescript
<Card>
  <CardHeader><CardTitle>Address</CardTitle></CardHeader>
  <CardContent>{/* address fields */}</CardContent>
</Card>
```

### DON'T

❌ **DON'T use console.log in production**
```typescript
// ❌ Bad
console.log('User:', user);

// ✅ Good
logger.debug('User loaded', { userId: user.id });
```

❌ **DON'T throw errors from client code**
```typescript
// ❌ Bad
throw new Error('Something failed');

// ✅ Good
return { success: false, error: 'Something failed' };
```

❌ **DON'T use `any` types**
```typescript
// ❌ Bad
function handle(data: any) { ... }

// ✅ Good
function handle(data: FormData) { ... }
```

❌ **DON'T forget ARIA labels on icon-only buttons**
```typescript
// ❌ Bad
<button><Trash2Icon /></button>

// ✅ Good
<button aria-label="Delete item"><Trash2Icon /></button>
```

❌ **DON'T stack multiple sheets/dialogs**
```typescript
// ❌ Bad - confusing UX
<Sheet><Sheet>{/* nested */}</Sheet></Sheet>

// ✅ Good - one at a time
{isFirstOpen && <Sheet />}
{isSecondOpen && <Sheet />}
```

❌ **DON'T hide important actions in dropdowns**
```typescript
// ❌ Bad - users can't find it
<Menu>
  <MenuItem>Edit</MenuItem>
  <MenuItem>Delete</MenuItem>
</Menu>

// ✅ Good - visible buttons
<Button onClick={handleEdit}>Edit</Button>
<Button onClick={handleDelete}>Delete</Button>
```

❌ **DON'T use hardcoded colors**
```typescript
// ❌ Bad
className="text-blue-500"

// ✅ Good
className="text-primary"
```

❌ **DON'T submit forms without validation**
```typescript
// ❌ Bad
async function submit(data) {
  await api.post('/endpoint', data);
}

// ✅ Good
async function submit(data) {
  const validated = schema.safeParse(data);
  if (!validated.success) return handleErrors(validated.error);
  await api.post('/endpoint', validated.data);
}
```

❌ **DON'T forget loading/error states**
```typescript
// ❌ Bad
{response.data.map(item => <Item />)}

// ✅ Good
{isLoading && <Skeleton />}
{error && <ErrorMessage />}
{response.data && response.data.map(item => <Item />)}
```

---

## Implementation Checklist

Use this checklist when creating a new settings page:

### Phase 1: Setup

- [ ] Create folder structure under `app/[locale]/business/settings/{feature}/`
- [ ] Create `page.tsx` (server component)
- [ ] Create `_components/{Feature}Client.tsx` (layout)
- [ ] Create `_components/{Feature}Form.tsx` (form handling)
- [ ] Create schema in `lib/schemas/{feature}.schema.ts`
- [ ] Create server action in `app/[locale]/business/actions/{feature}.ts`

### Phase 2: Server Component

- [ ] Implement authentication check
- [ ] Fetch studio data from database
- [ ] Handle not found case (redirect)
- [ ] Pass data to client component
- [ ] Add TypeScript interfaces for data

### Phase 3: Client Layout

- [ ] Add gradient background
- [ ] Add back button with navigation
- [ ] Add page title and subtitle
- [ ] Ensure responsive layout
- [ ] Test mobile viewport

### Phase 4: Form Implementation

- [ ] Create form state with useState
- [ ] Add field-level validation
- [ ] Add error display
- [ ] Implement form submission
- [ ] Add loading state to submit button
- [ ] Add toast notifications

### Phase 5: Actions & Validation

- [ ] Create Zod schema
- [ ] Create server action with 'use server'
- [ ] Add authentication check in action
- [ ] Validate input with schema
- [ ] Update database
- [ ] Revalidate cache
- [ ] Return success/error response

### Phase 6: Mobile Optimization

- [ ] Test on iPhone SE (375px)
- [ ] Test on iPad (768px)
- [ ] Test on desktop (1024px+)
- [ ] Ensure sticky header works
- [ ] Ensure sticky save button works
- [ ] Test back button on mobile
- [ ] Verify touch target sizes (32px min)

### Phase 7: Accessibility

- [ ] Add ARIA labels to icon buttons
- [ ] Test keyboard navigation (Tab)
- [ ] Verify focus indicators visible
- [ ] Check color contrast (WCAG AA)
- [ ] Test with screen reader
- [ ] Verify form labels connected to inputs
- [ ] Check for semantic HTML

### Phase 8: Testing

- [ ] Test form submission success
- [ ] Test form submission error
- [ ] Test validation errors
- [ ] Test empty state
- [ ] Test loading state
- [ ] Test back button navigation
- [ ] Test on mobile/tablet/desktop
- [ ] Test keyboard accessibility

### Phase 9: Polish

- [ ] Add page transitions
- [ ] Verify spacing is consistent
- [ ] Check typography hierarchy
- [ ] Test dark mode (if applicable)
- [ ] Optimize images
- [ ] Remove console.log statements
- [ ] Check for unused imports

### Phase 10: Documentation

- [ ] Document component structure
- [ ] Add TypeScript comments
- [ ] Document server actions
- [ ] Add README.md if complex
- [ ] Update main navigation if needed

---

## File Reference Summary

| Feature | Page | Server Component | Client Components | Schema |
|---------|------|-----------------|------------------|--------|
| Services | `/settings` | `page.tsx` | `ServicesPageClient.tsx`, `ServiceDeleteDialog.tsx` | N/A |
| Location | `/settings/location` | `page.tsx` | `LocationContactClient.tsx`, `LocationContactForm.tsx`, `LocationMap.tsx`, `LocationPreview.tsx` | `location.schema.ts` |
| Images | `/settings/images` | `page.tsx` | `StudioImagesClient.tsx`, `LogoSection.tsx`, `GallerySection.tsx`, `ProfilePreview.tsx` | N/A |
| Profile | `/settings/profile` | `page.tsx` | `ProfileEditForm.tsx`, `LocationEditForm.tsx` | N/A |
| Hours | `/settings/hours` | `page.tsx` | `OpeningHoursClient.tsx`, `PreviewCard.tsx` | `opening-hours.ts` |

---

## Conclusion

These patterns have been proven in production across multiple settings pages. They prioritize:

1. **User Experience**: Mobile-first, accessible, fast
2. **Developer Experience**: Consistent structure, reusable patterns, clear conventions
3. **Maintenance**: Type-safe, well-organized, documented
4. **Accessibility**: WCAG 2.1 AA compliant, keyboard navigable, semantic HTML

When creating a new settings page, follow the **Services pattern** for CRUD operations or the **Location pattern** for complex forms. Don't reinvent the wheel—reuse existing components and patterns.

---

**Questions or suggestions?** Review the actual files referenced in this guide for the latest implementation details.

