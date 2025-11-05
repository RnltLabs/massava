# Business Portal - Quick Start Guide

**For**: Developers implementing business portal features
**Task**: MASTER_ORCHESTRATION_PLAN.md - Phase 2

## TL;DR

The business portal at `/business/*` is now **protected by middleware**. Only `STUDIO_OWNER` and `SUPER_ADMIN` roles can access it.

## What Changed?

### New Files
- `/lib/auth/business-portal-guard.ts` - Access control utilities
- `/app/[locale]/unauthorized/page.tsx` - Error page for unauthorized access

### Updated Files
- `/middleware.ts` - Now protects `/business/*` routes
- `/types/next-auth.d.ts` - Added RBAC types to session

## Quick Examples

### ✅ Creating a Business Portal Page

```typescript
// app/[locale]/business/studios/page.tsx
import { auth } from '@/auth-unified';
import { redirect } from 'next/navigation';
import { hasBusinessPortalAccess } from '@/lib/auth/business-portal-guard';

export default async function StudiosPage() {
  const session = await auth();

  // Optional: Double-check access (middleware already protects)
  if (!hasBusinessPortalAccess(session)) {
    redirect('/unauthorized');
  }

  return (
    <div>
      <h1>My Studios</h1>
      {/* Business portal content */}
    </div>
  );
}
```

### ✅ Creating a Business Server Action

```typescript
// app/actions/business/studios.ts
"use server"

import { auth } from '@/auth-unified';
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard';

export async function createStudio(data: StudioData) {
  const session = await auth();

  // Throws error if user doesn't have access
  requireBusinessAccess(session?.user);

  // Create studio...
  return { success: true };
}
```

### ✅ Creating a Business API Route

```typescript
// app/api/business/studios/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth-unified';
import { hasBusinessPortalAccess } from '@/lib/auth/business-portal-guard';

export async function GET() {
  const session = await auth();

  if (!hasBusinessPortalAccess(session)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // Return business data...
  return NextResponse.json({ studios: [] });
}
```

### ✅ Conditional UI in Client Components

```typescript
"use client"

import { useSession } from 'next-auth/react';
import { isBusinessPortalUser } from '@/lib/auth/business-portal-guard';
import Link from 'next/link';

export function Navigation() {
  const { data: session } = useSession();

  return (
    <nav>
      <Link href="/">Home</Link>

      {/* Show business link only to authorized users */}
      {session?.user && isBusinessPortalUser(session.user) && (
        <Link href="/business">Business Portal</Link>
      )}
    </nav>
  );
}
```

## Testing Your Code

### Test with Different Roles

```typescript
// In your development environment

// 1. Sign in as CUSTOMER
// Navigate to /business
// Expected: Redirect to /unauthorized

// 2. Sign in as STUDIO_OWNER
// Navigate to /business
// Expected: Access granted

// 3. Sign out
// Navigate to /business
// Expected: Redirect to /auth/signin?callbackUrl=/business
```

### API Testing

```bash
# Test without auth
curl http://localhost:3000/api/business/studios
# Expected: 401 or 403

# Test with customer account
curl http://localhost:3000/api/business/studios \
  -H "Cookie: next-auth.session-token=<customer-token>"
# Expected: 403

# Test with studio owner account
curl http://localhost:3000/api/business/studios \
  -H "Cookie: next-auth.session-token=<owner-token>"
# Expected: 200 with data
```

## Common Patterns

### Pattern 1: Page-Level Protection (Recommended)

Middleware handles protection automatically:

```typescript
// app/[locale]/business/settings/page.tsx
export default async function SettingsPage() {
  // No auth check needed - middleware protects this route
  return <div>Settings</div>;
}
```

### Pattern 2: Server Action Protection

```typescript
"use server"

import { auth } from '@/auth-unified';
import { requireBusinessAccess } from '@/lib/auth/business-portal-guard';

export async function deleteStudio(id: string) {
  const session = await auth();
  requireBusinessAccess(session?.user);

  // Delete studio...
}
```

### Pattern 3: API Route Protection

```typescript
import { auth } from '@/auth-unified';
import { hasBusinessPortalAccess } from '@/lib/auth/business-portal-guard';

export async function POST(request: Request) {
  const session = await auth();

  if (!hasBusinessPortalAccess(session)) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Handle request...
}
```

## Common Mistakes

### ❌ Don't: Check roles manually

```typescript
// BAD - Don't do this
if (session?.user?.primaryRole !== 'STUDIO_OWNER') {
  redirect('/unauthorized');
}
```

### ✅ Do: Use provided utilities

```typescript
// GOOD - Use this instead
import { hasBusinessPortalAccess } from '@/lib/auth/business-portal-guard';

if (!hasBusinessPortalAccess(session)) {
  redirect('/unauthorized');
}
```

### ❌ Don't: Forget API protection

```typescript
// BAD - API route without auth check
export async function GET() {
  const studios = await getStudios();
  return NextResponse.json(studios);
}
```

### ✅ Do: Protect API routes

```typescript
// GOOD - API route with auth check
import { hasBusinessPortalAccess } from '@/lib/auth/business-portal-guard';

export async function GET() {
  const session = await auth();

  if (!hasBusinessPortalAccess(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const studios = await getStudios();
  return NextResponse.json(studios);
}
```

## Next Steps

1. **Create Business Routes**: Start building pages under `/app/[locale]/business/`
2. **Add Business API**: Create API routes under `/app/api/business/`
3. **Test Authorization**: Verify access control works correctly
4. **Add Features**: Implement business portal functionality

## Need Help?

- **Documentation**: See [business-portal-middleware-protection.md](./business-portal-middleware-protection.md)
- **Examples**: Check existing business portal pages (when created)
- **Support**: Contact development team

---

**Ready to build?** Start creating business portal features! 🚀
