# Studio Registration - Quick Integration Guide

## Getting Started in 3 Steps

### Step 1: Import the Dialog Component

```tsx
import { StudioRegistrationDialog } from '@/app/(main)/dashboard/_components/studio-registration';
```

### Step 2: Add State to Your Component

```tsx
'use client';

import { useState } from 'react';
import { StudioRegistrationDialog } from '@/app/(main)/dashboard/_components/studio-registration';

export default function YourPage() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const handleRegistrationSuccess = (studioId: string) => {
    console.log('Studio registered with ID:', studioId);
    // Optionally redirect or refresh data
    // router.push(`/dashboard/studio/${studioId}`);
  };

  return (
    <div>
      {/* Your existing content */}

      <button onClick={() => setIsRegistrationOpen(true)}>
        Register Your Studio
      </button>

      <StudioRegistrationDialog
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
```

### Step 3: Test It!

```bash
npm run dev
```

Navigate to your page and click the button. The registration flow will appear!

---

## Alternative: Use the Pre-built Trigger Component

If you want a styled button that matches the design system:

```tsx
import { StudioRegistrationTrigger } from '@/app/(main)/dashboard/_components/StudioRegistrationTrigger';

export default function YourPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <StudioRegistrationTrigger />
    </div>
  );
}
```

That's it! The trigger component handles everything internally.

---

## Integration Patterns

### Pattern 1: Dashboard Card

```tsx
import { Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StudioRegistrationTrigger } from '@/app/(main)/dashboard/_components/StudioRegistrationTrigger';

export function DashboardWelcome() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-terracotta-500" />
          <div>
            <CardTitle>Welcome to Massava</CardTitle>
            <CardDescription>Get started by registering your studio</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Complete your studio profile to start accepting bookings and managing your business.
        </p>
        <StudioRegistrationTrigger />
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: Navigation Bar Action

```tsx
import { StudioRegistrationDialog } from '@/app/(main)/dashboard/_components/studio-registration';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>

      <Button
        onClick={() => setIsOpen(true)}
        variant="default"
        className="bg-terracotta-500 hover:bg-terracotta-600"
      >
        <Building2 className="h-4 w-4 mr-2" />
        Register Studio
      </Button>

      <StudioRegistrationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(studioId) => {
          // Handle success
          console.log('Studio created:', studioId);
        }}
      />
    </nav>
  );
}
```

### Pattern 3: Empty State

```tsx
import { Building2 } from 'lucide-react';
import { StudioRegistrationDialog } from '@/app/(main)/dashboard/_components/studio-registration';

export function NoStudioEmptyState() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-terracotta-100 flex items-center justify-center mb-6">
        <Building2 className="h-10 w-10 text-terracotta-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        No Studio Yet
      </h2>

      <p className="text-gray-600 mb-6 max-w-md">
        Get started by registering your wellness studio. It only takes a few minutes
        to set up your profile and start accepting bookings.
      </p>

      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium rounded-xl transition-colors"
      >
        Register Your Studio
      </button>

      <StudioRegistrationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(studioId) => {
          // Redirect to studio dashboard
          window.location.href = `/dashboard/studio/${studioId}`;
        }}
      />
    </div>
  );
}
```

### Pattern 4: Conditional Rendering (Show Only if No Studio)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { StudioRegistrationDialog } from '@/app/(main)/dashboard/_components/studio-registration';

export function ConditionalStudioPrompt() {
  const [hasStudio, setHasStudio] = useState<boolean | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  useEffect(() => {
    // Check if user has a studio
    async function checkStudio() {
      const response = await fetch('/api/studio/check');
      const data = await response.json();
      setHasStudio(data.hasStudio);

      // Auto-open registration if no studio
      if (!data.hasStudio) {
        setIsRegistrationOpen(true);
      }
    }

    checkStudio();
  }, []);

  if (hasStudio === null) {
    return <div>Loading...</div>;
  }

  if (hasStudio) {
    return <div>Welcome back! Your studio is registered.</div>;
  }

  return (
    <StudioRegistrationDialog
      isOpen={isRegistrationOpen}
      onClose={() => setIsRegistrationOpen(false)}
      onSuccess={(studioId) => {
        setHasStudio(true);
        console.log('Studio registered:', studioId);
      }}
    />
  );
}
```

---

## Common Customizations

### 1. Custom Button Style

```tsx
<button
  onClick={() => setIsOpen(true)}
  className="your-custom-classes"
>
  <YourIcon />
  Your Text
</button>
```

### 2. Success Redirect

```tsx
<StudioRegistrationDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(studioId) => {
    // Redirect to studio page
    router.push(`/dashboard/studio/${studioId}`);
  }}
/>
```

### 3. Success with Data Refresh

```tsx
<StudioRegistrationDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(studioId) => {
    // Refresh data
    mutate('/api/studios'); // if using SWR
    // or
    queryClient.invalidateQueries('studios'); // if using React Query
  }}
/>
```

### 4. Analytics Tracking

```tsx
<StudioRegistrationDialog
  isOpen={isOpen}
  onClose={() => {
    setIsOpen(false);
    // Track dialog close
    analytics.track('studio_registration_closed');
  }}
  onSuccess={(studioId) => {
    // Track successful registration
    analytics.track('studio_registration_completed', { studioId });
  }}
/>
```

---

## Server-Side Check for Existing Studio

If you want to prevent users who already have a studio from seeing the registration:

```tsx
// app/dashboard/page.tsx (Server Component)
import { auth } from '@/auth-unified';
import { prisma } from '@/lib/prisma';
import { StudioRegistrationTrigger } from './_components/StudioRegistrationTrigger';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user has a studio
  const studioOwnership = await prisma.studioOwnership.findFirst({
    where: { userId: session.user.id },
    include: { studio: true },
  });

  return (
    <div>
      <h1>Dashboard</h1>

      {studioOwnership ? (
        <div>
          <h2>Your Studio: {studioOwnership.studio.name}</h2>
          {/* Show studio management UI */}
        </div>
      ) : (
        <div>
          <p>You haven't registered a studio yet.</p>
          <StudioRegistrationTrigger />
        </div>
      )}
    </div>
  );
}
```

---

## Handling Multiple Studios (Future)

If you want to support multiple studios per user, modify the server action:

```typescript
// app/actions/studio/registerStudio.ts

// Comment out this check:
/*
const existingOwnership = await prisma.studioOwnership.findFirst({
  where: { userId: session.user.id },
});

if (existingOwnership) {
  return {
    success: false,
    error: 'You already have a registered studio.',
  };
}
*/
```

Then update your UI to show "Add Another Studio" instead of just "Register Studio".

---

## Troubleshooting

### Issue: Dialog doesn't open
**Solution**: Ensure `isOpen` state is being set to `true`

```tsx
// Debug
console.log('isOpen:', isOpen); // Should be true
```

### Issue: No user ID in session
**Solution**: User must be logged in. Add auth check:

```tsx
const session = await auth();
if (!session?.user?.id) {
  return <div>Please sign in to register a studio</div>;
}
```

### Issue: Server action fails
**Solution**: Check browser console for error details. Common causes:
- User not authenticated
- Database connection issue
- Validation errors

### Issue: Mobile layout not working
**Solution**: Verify viewport meta tag in root layout:

```tsx
// app/layout.tsx
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

---

## Testing Your Integration

### 1. Quick Test

```bash
npm run dev
```

- Navigate to your page
- Click the registration button
- Complete all steps
- Verify success message

### 2. Database Check

After registration, verify in your database:

```sql
-- Check Studio
SELECT * FROM studios WHERE id = 'your-studio-id';

-- Check Ownership
SELECT * FROM studio_ownership WHERE "studioId" = 'your-studio-id';

-- Check Role
SELECT * FROM user_role_assignments
WHERE "userId" = 'your-user-id' AND role = 'STUDIO_OWNER';
```

### 3. Mobile Test

- Resize browser to mobile width (< 768px)
- Verify Sheet appears from bottom
- Test touch gestures
- Check keyboard behavior

---

## Next Steps After Integration

1. **Add the trigger** to your dashboard page
2. **Test the flow** end-to-end
3. **Verify database** records are created
4. **Test on mobile** devices
5. **Check accessibility** with keyboard navigation
6. **Review analytics** (if integrated)
7. **Deploy to staging** for team testing

---

## Support

For detailed documentation, see:
- **Usage**: `/app/(main)/dashboard/_components/studio-registration/README.md`
- **Testing**: `/app/(main)/dashboard/_components/studio-registration/TESTING.md`
- **Technical**: `/app/(main)/dashboard/_components/studio-registration/IMPLEMENTATION_SUMMARY.md`

---

**Ready to integrate?** Start with Step 1 above! 🚀
