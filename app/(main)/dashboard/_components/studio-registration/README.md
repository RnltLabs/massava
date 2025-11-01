# Studio Registration Feature

A complete multi-step dialog flow for studio registration, following the exact pattern of `UnifiedAuthDialog`.

## Features

- **Multi-step flow**: Welcome → Basic Info → Address → Contact → Success
- **Responsive**: Sheet on mobile (h-95vh, bottom drawer), Dialog on desktop
- **Validation**: Client-side and server-side with Zod schemas
- **Animations**: Framer Motion transitions between steps
- **Accessibility**: WCAG 2.1 AA compliant
- **Type-safe**: Full TypeScript with strict types
- **Context-based**: React Context for state management

## Directory Structure

```
studio-registration/
├── StudioRegistrationDialog.tsx       # Main wrapper (Sheet mobile + Dialog desktop)
├── StudioRegistrationContext.tsx      # React Context for state management
├── steps/
│   ├── WelcomeStep.tsx                # Step 0 - Introduction
│   ├── BasicInfoStep.tsx              # Step 1 - Name & Description
│   ├── AddressStep.tsx                # Step 2 - Location
│   ├── ContactStep.tsx                # Step 3 - Contact Info + Submit
│   └── SuccessStep.tsx                # Step 4 - Success message
├── components/
│   ├── ProgressIndicator.tsx          # Dot-based progress (steps 1-3)
│   └── PhoneInput.tsx                 # Formatted phone input
├── hooks/
│   └── useStudioRegistration.ts       # Custom hook for context
└── validation/
    └── studioSchemas.ts               # Zod validation schemas
```

## Usage

### Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StudioRegistrationDialog } from '@/app/(main)/dashboard/_components/studio-registration';

export default function MyPage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (studioId: string) => {
    console.log('Studio registered:', studioId);
    // Redirect or refresh data
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Register Studio
      </Button>

      <StudioRegistrationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

### With Trigger Component

```tsx
import { StudioRegistrationTrigger } from '@/app/(main)/dashboard/_components/StudioRegistrationTrigger';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <StudioRegistrationTrigger />
    </div>
  );
}
```

## Step Flow

### Step 0: Welcome
- Icon with terracotta background
- Title and subtitle
- Three feature cards (Studio Details, Location, Contact)
- "Get Started" button
- "Takes about 2-3 minutes" text

### Step 1: Basic Info
- Studio Name (min 3, max 100 chars)
- Description (min 10, max 500 chars)
- Character counters
- Real-time validation
- "Continue" button

### Step 2: Address
- Street Address (min 5 chars)
- Address Line 2 (optional)
- City (min 2 chars)
- State/Province (min 2 chars) + Postal Code (min 3 chars) - 2 columns on desktop
- Country (min 2 chars)
- "Continue" button

### Step 3: Contact
- Phone (formatted input, min 10 chars)
- Email (validated format)
- Website (optional, URL format)
- "Complete Registration" button
- Calls `registerStudio` server action
- Shows loading state

### Step 4: Success
- Animated checkmark (spring animation)
- Success message with studio name
- "What's next?" section with 2 cards
- Two CTAs:
  - "Add Your First Service" (primary)
  - "Go to Dashboard" (secondary)

## Validation Schemas

### Basic Info
```typescript
{
  name: string (min: 3, max: 100),
  description: string (min: 10, max: 500)
}
```

### Address
```typescript
{
  street: string (min: 5),
  line2?: string,
  city: string (min: 2),
  state: string (min: 2),
  postalCode: string (min: 3),
  country: string (min: 2)
}
```

### Contact
```typescript
{
  phone: string (min: 10),
  email: string (email format),
  website?: string (url format)
}
```

## Server Action

The `registerStudio` server action handles:
1. Authentication check (requires logged-in user)
2. Server-side validation with Zod
3. Studio creation in database
4. StudioOwnership relation creation
5. STUDIO_OWNER role assignment
6. Error handling (unique constraints, validation, etc.)

**Location**: `/app/actions/studio/registerStudio.ts`

## Styling

### Colors
- Primary buttons: `bg-terracotta-500 hover:bg-terracotta-600`
- Secondary buttons: `variant="outline"`
- Focus states: `focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100`
- Progress dots: `bg-terracotta-500` (completed/current), `bg-sage-200` (upcoming)

### Responsive Breakpoints
- Mobile: `< 768px` (Sheet with h-[95vh], rounded-t-3xl)
- Desktop: `>= 768px` (Dialog with sm:max-w-[500px])

### Spacing
- Container: `px-4 py-6` mobile, `sm:px-6 sm:py-8` desktop
- Form fields: `space-y-4`
- Sections: `space-y-6`

## Accessibility

- All inputs have labels
- Required fields marked with asterisk (*)
- Error messages below fields with `role="alert"`
- Keyboard navigation (Tab, Enter, Escape)
- Focus management (trapped in dialog)
- ARIA labels for icon buttons
- Progress indicator with `role="progressbar"`
- Hidden titles for screen readers (`sr-only`)

## Autofill Attributes

All inputs have proper `autocomplete` attributes:
- Name: `organization`
- Street: `street-address`
- Line 2: `address-line2`
- City: `address-level2`
- State: `address-level1`
- Postal: `postal-code`
- Country: `country-name`
- Phone: `tel`
- Email: `email`
- Website: `url`

## Dependencies

- **framer-motion**: Animations and transitions
- **zod**: Validation schemas
- **lucide-react**: Icons
- **@/components/ui**: shadcn/ui components (Dialog, Sheet, Input, Textarea, Button, Label)
- **@/hooks/use-media-query**: Responsive detection

## Error Handling

### Client-side
- Real-time validation on blur
- Character counters with warnings at 90%
- Field-specific error messages
- Form-level submit errors

### Server-side
- Authentication errors
- Validation errors
- Unique constraint violations
- Generic error fallbacks

## State Management

Uses React Context with reducer pattern:

```typescript
{
  currentStep: number,
  formData: {
    basicInfo: { name, description },
    address: { street, line2, city, state, postalCode, country },
    contact: { phone, email, website }
  },
  errors: Record<string, string>,
  isSubmitting: boolean,
  studioId?: string
}
```

## Testing

To test the feature:

1. Start the development server
2. Navigate to a page with the trigger component
3. Click "Register Studio"
4. Complete all steps
5. Verify success message appears
6. Check database for new Studio and StudioOwnership records

## Future Enhancements

- Multiple studio support (remove ownership check)
- Image upload for studio logo
- Google Places API integration for address autocomplete
- Opening hours configuration
- Service management after registration
- Team invitation system

## Notes

- Mobile detection uses `useMediaQuery("(max-width: 767px)")`
- Progress indicator only shows for steps 1-3
- Back button hidden on step 0 and step 4
- Step data persists in context until dialog closes
- Context resets on dialog close
- All animations use Framer Motion with consistent timing (0.3s easeInOut)

## License

Copyright (c) 2025 Roman Reinelt / RNLT Labs
