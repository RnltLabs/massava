# Task 2.6: NextAuth Redirect - Code Reference

Quick reference for the NextAuth redirect callback implementation.

---

## Core Implementation

### Redirect Callback (`/auth-unified.ts`)

```typescript
async redirect({ url, baseUrl }) {
  // Handle role-based redirects after sign-in
  try {
    const urlObj = new URL(url, baseUrl);
    const callbackUrl = urlObj.searchParams.get('callbackUrl');
    const accountType = urlObj.searchParams.get('accountType');

    // Check if this is an auth callback URL
    const isAuthCallback = url.includes('/api/auth/callback/') ||
                           url.includes('/api/auth/signin');

    // Determine if user is business user
    const isBusinessUser = accountType === 'studio' ||
                           callbackUrl?.includes('/dashboard/owner') ||
                           callbackUrl?.includes('/business');

    // Redirect business users to business portal
    if (isBusinessUser) {
      if (callbackUrl &&
          (callbackUrl.includes('/dashboard/owner') ||
           callbackUrl.includes('/business'))) {
        // Preserve business callback URL (with security check)
        if (callbackUrl.startsWith(baseUrl)) {
          return callbackUrl;
        }
        if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          return `${baseUrl}${callbackUrl}`;
        }
      }
      return `${baseUrl}/dashboard/owner`;
    }

    // Redirect customers to callback URL or homepage
    if (callbackUrl) {
      if (callbackUrl.startsWith(baseUrl)) {
        return callbackUrl;
      }
      if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
        return `${baseUrl}${callbackUrl}`;
      }
    }

    // Default redirects
    if (isAuthCallback) return baseUrl;
    if (url.startsWith(baseUrl) && !isAuthCallback) return url;
    if (url.startsWith('/') && !isAuthCallback) return `${baseUrl}${url}`;

    return baseUrl; // Safe fallback
  } catch (error) {
    console.error('[NextAuth] Redirect error:', error);
    return baseUrl; // Safe fallback
  }
}
```

---

## Type Definitions

### NextAuth Types (`/types/next-auth.d.ts`)

```typescript
import { DefaultSession } from 'next-auth';
import { UserRole } from '@/app/generated/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      primaryRole?: UserRole;
      roles?: UserRole[];
      accountType?: 'customer' | 'studio';
    } & DefaultSession['user'];
  }

  interface User {
    primaryRole?: UserRole;
    roles?: UserRole[];
    accountType?: 'customer' | 'studio';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    primaryRole?: UserRole;
    roles?: UserRole[];
    accountType?: 'customer' | 'studio';
  }
}
```

---

## Integration Example

### Server Action (`/app/actions/auth.ts`)

```typescript
export async function signIn(data: UnifiedLogin) {
  // ... validation ...

  const { email, password, accountType } = validatedFields.data;

  // Call NextAuth with accountType
  await nextAuthSignIn('credentials', {
    email,
    password,
    accountType, // 'studio' or 'customer' - passed to redirect callback
    redirect: false,
  });

  // Determine redirect URL
  const redirectUrl = accountType === 'studio'
    ? '/dashboard/owner'
    : '/';

  return { success: true, data: { redirectUrl } };
}
```

### Client Component (Login Form)

```typescript
'use client';

import { signIn } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await signIn({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      accountType: formData.get('accountType') as 'customer' | 'studio',
    });

    if (result.success) {
      router.push(result.data.redirectUrl);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <select name="accountType" required>
        <option value="customer">Customer</option>
        <option value="studio">Studio Owner</option>
      </select>
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

## Security Patterns

### Open Redirect Prevention

```typescript
// ✅ SAFE: Same-origin URL
if (callbackUrl.startsWith(baseUrl)) {
  return callbackUrl;
}

// ✅ SAFE: Absolute path (single slash)
if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
  return `${baseUrl}${callbackUrl}`;
}

// ❌ BLOCKED: External domain
// callbackUrl = 'https://evil.com'
// Result: Falls through to baseUrl (safe fallback)

// ❌ BLOCKED: Protocol-relative URL
// callbackUrl = '//evil.com'
// Result: Caught by !callbackUrl.startsWith('//') check
```

### URL Validation Flow

```typescript
function isSafeCallbackUrl(callbackUrl: string, baseUrl: string): boolean {
  // Check 1: Same origin (full URL)
  if (callbackUrl.startsWith(baseUrl)) {
    return true;
  }

  // Check 2: Absolute path (but not protocol-relative)
  if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
    return true;
  }

  // Everything else is blocked
  return false;
}
```

---

## Testing Examples

### Test Case: Studio Owner Default Redirect

```typescript
it('should redirect studio owners to /dashboard/owner', () => {
  const url = 'http://localhost:3000/api/auth/callback/credentials?accountType=studio';
  const baseUrl = 'http://localhost:3000';

  const result = redirect({ url, baseUrl });

  expect(result).toBe('http://localhost:3000/dashboard/owner');
});
```

### Test Case: Security - Block External Domain

```typescript
it('should block external domain redirects', () => {
  const url = 'http://localhost:3000/api/auth/callback/credentials?callbackUrl=https%3A%2F%2Fevil.com%2Fphishing';
  const baseUrl = 'http://localhost:3000';

  const result = redirect({ url, baseUrl });

  expect(result).toBe('http://localhost:3000'); // Safe fallback
});
```

### Test Case: Callback URL Preservation

```typescript
it('should preserve customer booking callback URL', () => {
  const callbackUrl = '/booking/studio123/slot456';
  const url = `http://localhost:3000/api/auth/callback/credentials?accountType=customer&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const baseUrl = 'http://localhost:3000';

  const result = redirect({ url, baseUrl });

  expect(result).toBe('http://localhost:3000/booking/studio123/slot456');
});
```

---

## Debugging Tips

### Enable Redirect Logging

Add to redirect callback:

```typescript
async redirect({ url, baseUrl }) {
  console.log('[NextAuth Redirect]', {
    url,
    baseUrl,
    accountType: new URL(url, baseUrl).searchParams.get('accountType'),
    callbackUrl: new URL(url, baseUrl).searchParams.get('callbackUrl'),
  });

  // ... rest of logic ...
}
```

### Test Redirect Logic Manually

```bash
# Run verification script
npx tsx scripts/verify-nextauth-redirects.ts

# Expected output:
# ✨ All tests passed! NextAuth redirect logic is working correctly.
# 📊 Results: 13 passed, 0 failed out of 13 tests
```

### Check Session Data

```typescript
import { auth } from '@/auth-unified';

export default async function Page() {
  const session = await auth();

  console.log({
    userId: session?.user?.id,
    primaryRole: session?.user?.primaryRole,
    roles: session?.user?.roles,
    accountType: session?.user?.accountType,
  });

  return <div>...</div>;
}
```

---

## Environment Variables

No new environment variables required. Uses existing NextAuth config:

```bash
# .env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_BASEPATH=/api/auth  # Optional, defaults to /api/auth
```

---

## Common Patterns

### Protected Page Redirect

When user tries to access protected page:

```typescript
// middleware.ts or page.tsx
export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    // Redirect to login with callback URL
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent('/protected-page')}`);
  }

  return <div>Protected content</div>;
}
```

NextAuth will automatically:
1. Show login page
2. Authenticate user
3. Run redirect callback with `callbackUrl=/protected-page`
4. Redirect user back to `/protected-page`

### Role-Based Access Control

```typescript
// Check user role in page
export default async function BusinessDashboard() {
  const session = await auth();

  if (session?.user?.primaryRole !== 'STUDIO_OWNER') {
    redirect('/unauthorized');
  }

  return <div>Business Dashboard</div>;
}
```

---

## Quick Reference

| User Type | accountType | Redirect Destination |
|-----------|-------------|----------------------|
| Studio Owner | `'studio'` | `/dashboard/owner` |
| Customer | `'customer'` | `/` (homepage) |
| OAuth (no hint) | `undefined` | Infer from callback URL |
| With callback URL | Any | Preserve callback URL |
| Security threat | Any | `baseUrl` (safe fallback) |

---

## Files Reference

- **Implementation:** `/auth-unified.ts` (lines 282-340)
- **Types:** `/types/next-auth.d.ts`
- **Tests:** `/__tests__/auth/nextauth-redirect.test.ts`
- **Verification:** `/scripts/verify-nextauth-redirects.ts`
- **Documentation:** `/docs/task-2.6-nextauth-redirect-implementation.md`

---

**Last Updated:** 2025-11-04
