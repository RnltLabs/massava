# Massava Settings Pages - Quick Reference Guide

This is a condensed version of DESIGN_PATTERNS_SETTINGS.md for quick lookups while coding.

## File Structure Template

```
app/[locale]/business/settings/{feature}/
├── page.tsx                          # Server component
└── _components/
    ├── {Feature}Client.tsx           # Layout
    ├── {Feature}Form.tsx             # Form logic
    ├── {Feature}Section.tsx          # Content
    ├── {Feature}Dialog.tsx           # Modal
    └── {Feature}Preview.tsx          # Preview sidebar
```

## Page Setup (Copy-Paste Template)

### Server Component
```typescript
// page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

async function getStudioData(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { ownedStudios: { include: { studio: true } } },
  });
  return user?.ownedStudios[0]?.studio ?? null;
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/auth/login`);
  
  const studio = await getStudioData(session.user?.email ?? '');
  if (!studio) redirect(`/${locale}/business/more`);
  
  return <FeatureClient studio={studio} locale={locale} />;
}
```

### Client Component Layout
```typescript
// _components/FeatureClient.tsx
'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

export function FeatureClient({ studio, locale }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Back Button */}
        <Link
          href={`/${locale}/business/more`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Einstellungen
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Feature Title
          </h1>
          <p className="text-muted-foreground mt-2">Description</p>
        </div>

        {/* Content */}
        <FeatureForm studio={studio} />
      </div>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Simple CRUD List (Services)

Use when you have a list of items with edit/delete.

```typescript
<div className="grid gap-4 md:grid-cols-2">
  {items.map(item => (
    <div className="rounded-[1.5rem] border border-border bg-background p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all">
      <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={() => handleEdit(item)}>Edit</Button>
        <Button variant="ghost" onClick={() => handleDelete(item)}>Delete</Button>
      </div>
    </div>
  ))}
</div>
```

### Pattern 2: Form with Sticky Save (Location)

Use when you have a complex form.

```typescript
<form onSubmit={handleSubmit} className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
    <div className="lg:col-span-3 space-y-6">
      {/* Form sections */}
      <Card>
        <CardHeader><CardTitle>Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Fields */}
        </CardContent>
      </Card>
    </div>
    
    <div className="lg:col-span-2 space-y-6">
      {/* Preview sidebar */}
    </div>
  </div>
  
  {/* Sticky save button */}
  <Button
    type="submit"
    disabled={isLoading}
    className="w-full md:w-auto sticky bottom-0 md:static"
  >
    {isLoading && <Loader2 className="animate-spin mr-2" />}
    Save
  </Button>
</form>
```

### Pattern 3: Bottom Sheet (Mobile Dialog)

```typescript
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent
    side="bottom"
    className="h-auto max-h-[85vh] rounded-t-3xl p-6"
  >
    <VisuallyHidden>
      <SheetTitle>Dialog Title</SheetTitle>
    </VisuallyHidden>
    
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Title</h2>
      {/* Content */}
    </div>
  </SheetContent>
</Sheet>
```

## Form Handling

### Basic Form with Validation

```typescript
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState<Record<string, string>>({});
const [isLoading, setIsLoading] = useState(false);
const { toast } = useToast();

const validateField = (field: string, value: string) => {
  try {
    schema.shape[field].parse(value);
    setErrors(prev => ({ ...prev, [field]: '' }));
  } catch (error) {
    if (error instanceof ZodError) {
      setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
    }
  }
};

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setIsLoading(true);
  
  const result = await updateAction(formData);
  if (result.success) {
    toast({ title: 'Success' });
    router.refresh();
  } else {
    toast({ title: 'Error', description: result.error, variant: 'destructive' });
  }
  
  setIsLoading(false);
}
```

### Form Field

```typescript
<div className="space-y-2">
  <Label htmlFor="field">Label *</Label>
  <Input
    id="field"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    onBlur={() => validateField('field', value)}
    className={errors.field ? 'border-red-500' : ''}
    aria-invalid={!!errors.field}
    aria-describedby={errors.field ? 'error-field' : undefined}
  />
  {errors.field && (
    <p id="error-field" className="text-sm text-red-500">
      {errors.field}
    </p>
  )}
</div>
```

## Colors & Styling

### Tailwind Classes

```
Primary Color:      text-primary (terracotta #B56550)
Background:         bg-background (cream)
Border:             border-border (taupe)
Muted Text:         text-muted-foreground
Card Radius:        rounded-[1.5rem]
Button Gap:         gap-2 (8px)
Section Gap:        gap-4 (16px)
Form Gap:           space-y-4 (16px)
```

### Hover Effects

```
Card hover:         hover:-translate-y-0.5 hover:shadow-lg
Button hover:       hover:bg-primary/90
Transition:         transition-all duration-200
```

## Icons (lucide-react)

```typescript
import {
  ArrowLeftIcon,     // Back button
  PlusIcon,          // Add
  Edit2Icon,         // Edit
  Trash2Icon,        // Delete
  Loader2,           // Loading spinner
  Check,             // Success
  MapPin,            // Location
  Phone,             // Phone
  Mail,              // Email
} from 'lucide-react'
```

## Responsive Classes

```
Mobile:             px-4 py-6 text-base
Tablet:             md:px-6 md:py-8
Desktop:            lg:px-8 lg:py-12
Grid (2 col):       grid-cols-1 lg:grid-cols-2
Grid (3 col):       grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Form/Preview:       grid-cols-1 lg:grid-cols-5
                    lg:col-span-3 / lg:col-span-2
```

## Error Messages

```typescript
// Display errors inline
{errors.field && (
  <p className="text-sm text-red-500">{errors.field}</p>
)}

// Toast for server errors
if (result.error) {
  toast({
    title: 'Error',
    description: result.error,
    variant: 'destructive',
  });
}
```

## Accessibility Checklist

- [ ] `aria-label` on icon-only buttons
- [ ] `aria-invalid` on fields with errors
- [ ] `aria-describedby` linking errors to fields
- [ ] Labels connected to inputs via `htmlFor`
- [ ] Semantic HTML (button, form, input, label)
- [ ] Focus indicators visible
- [ ] Tab navigation works
- [ ] Color contrast WCAG AA

## Mobile Optimization

```typescript
// Sticky header (list pages)
<div className="sticky top-0 z-10 backdrop-blur-lg bg-neutral-50/95">
  {/* Header content */}
</div>

// Sticky save button (forms)
<Button className="w-full md:w-auto sticky bottom-0 md:static">
  Save
</Button>

// Touch targets min 32px
<Button size="sm" className="h-10 w-10" />

// Hide text on mobile
<span className="hidden sm:inline">Bearbeiten</span>

// Stack on mobile
<div className="flex flex-col md:flex-row gap-2">
```

## Server Actions

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function updateFeature(data: z.infer<typeof schema>) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Validate
    const validated = schema.parse(data);

    // 3. Update database
    const result = await prisma.studio.update({
      where: { id: studioId },
      data: validated,
    });

    // 4. Revalidate cache
    revalidatePath('/business/settings');

    // 5. Return success
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed' };
    }
    return { success: false, error: 'Update failed' };
  }
}
```

## Toast Examples

```typescript
const { toast } = useToast();

// Success
toast({
  title: 'Erfolgreich',
  description: 'Ihre Daten wurden gespeichert.',
});

// Error
toast({
  title: 'Fehler',
  description: 'Etwas ist schief gelaufen.',
  variant: 'destructive',
});

// Loading (with async/await)
const toastId = toast({
  title: 'Lädt...',
  description: 'Bitte warten Sie.',
});

// Later, dismiss with id
// (if toast has dismiss support)
```

## Common Mistakes to Avoid

```typescript
// ❌ DON'T - console.log in production
console.log(data);

// ✅ DO - use logger
logger.debug('Data loaded', { id: data.id });

// ❌ DON'T - missing validation
await api.post('/endpoint', userInput);

// ✅ DO - validate
const result = schema.safeParse(userInput);
if (!result.success) return;

// ❌ DON'T - hardcoded strings
className="text-blue-500"

// ✅ DO - use design system
className="text-primary"

// ❌ DON'T - missing error handling
{items.map(item => <Item item={item} />)}

// ✅ DO - handle all states
{isLoading && <Skeleton />}
{error && <Error />}
{items && items.map(item => <Item item={item} />)}

// ❌ DON'T - throw in client code
throw new Error('Something failed');

// ✅ DO - return result
return { success: false, error: 'Something failed' };
```

## Quick File Checklist

When creating a new settings page, use this checklist:

```
[ ] Create folder structure
[ ] Create page.tsx (server)
[ ] Create {Feature}Client.tsx (layout)
[ ] Create {Feature}Form.tsx (form)
[ ] Create schema in lib/schemas/
[ ] Create server action
[ ] Add back button
[ ] Add page header
[ ] Add form fields with validation
[ ] Add loading state
[ ] Add toast notifications
[ ] Add mobile styling
[ ] Add accessibility attributes
[ ] Test on mobile (375px)
[ ] Test on tablet (768px)
[ ] Test on desktop (1024px)
[ ] Remove console.log statements
[ ] Test keyboard navigation
[ ] Verify WCAG AA contrast
```

---

**For detailed patterns, examples, and best practices, see DESIGN_PATTERNS_SETTINGS.md**

