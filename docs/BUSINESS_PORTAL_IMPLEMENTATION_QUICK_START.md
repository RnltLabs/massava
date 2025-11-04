# Business Portal Separation - Quick Start Guide

## TL;DR: What's Changing

**BEFORE:**
```
User logs in → /dashboard → Redirects to /dashboard/owner (if studio owner)
                         → Shows customer dashboard (if customer)
```

**AFTER:**
```
User logs in → /dashboard (removed) 
           → /business/[locale]/dashboard (if studio owner)
           → / (if customer)
```

---

## Quick File Reference

### Files to Create (NEW)
```
app/business/
├── [locale]/
│   ├── layout.tsx          (Copy from app/[locale]/layout.tsx, modify branding)
│   ├── page.tsx            (New entry point)
│   └── dashboard/
│       ├── page.tsx        (Copy from old /app/[locale]/dashboard/owner/page.tsx)
│       ├── calendar/...
│       ├── services/...
│       ├── settings/...
│       └── _components/    (Move from old location)
```

### Files to Modify (CRITICAL)
```
1. app/actions/auth.ts
   - Line ~241: Update redirect URL for STUDIO_OWNER
     OLD: redirectUrl = '/dashboard'; // Will redirect to /dashboard/owner
     NEW: redirectUrl = '/business/${locale}/dashboard';

2. app/[locale]/dashboard/page.tsx
   - Line ~64-67: Remove redirect to /dashboard/owner
   - Only show customer dashboard

3. components/auth/UnifiedAuthDialog.tsx
   - Update success callback to use correct redirect URL
```

### Files to Delete (CLEANUP)
```
app/[locale]/dashboard/owner/    (ENTIRE DIRECTORY)
app/[locale]/dashboard/owner/_components/
```

---

## Step-by-Step Implementation

### Step 1: Create Business Directory Structure
```bash
mkdir -p app/business/[locale]/dashboard/_components
mkdir -p app/business/[locale]/dashboard/calendar
mkdir -p app/business/[locale]/dashboard/services
mkdir -p app/business/[locale]/dashboard/settings
```

### Step 2: Create Core Business Layout Files
Create `/app/business/[locale]/layout.tsx`:
```typescript
import { auth } from '@/auth-unified';
import { UserRole } from '@/app/generated/prisma';
import { redirect } from 'next/navigation';

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  // Only studio owners can access /business
  if (!session?.user?.id) {
    redirect(`/${locale}?openAuth=login`);
  }

  const role = (session.user as any).primaryRole;
  if (role !== UserRole.STUDIO_OWNER) {
    redirect(`/${locale}`);
  }

  return (
    // Business-specific layout
    // Header, footer, navigation differ from customer portal
    <>{children}</>
  );
}
```

Create `/app/business/[locale]/page.tsx`:
```typescript
import { redirect } from 'next/navigation';

export default async function BusinessHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to dashboard
  redirect(`/business/${locale}/dashboard`);
}
```

Create `/app/business/[locale]/dashboard/page.tsx`:
```typescript
// COPY THE ENTIRE CONTENT FROM:
// app/[locale]/dashboard/owner/page.tsx
// (No modifications needed)
```

### Step 3: Move Components and Nested Routes
Copy all files and directories:
```bash
# Copy owner dashboard to business
cp -r app/[locale]/dashboard/owner/_components app/business/[locale]/dashboard/
cp -r app/[locale]/dashboard/owner/calendar app/business/[locale]/dashboard/
cp -r app/[locale]/dashboard/owner/services app/business/[locale]/dashboard/
cp -r app/[locale]/dashboard/owner/settings app/business/[locale]/dashboard/
cp -r app/[locale]/dashboard/owner/more app/business/[locale]/dashboard/
```

### Step 4: Update Auth Redirect Logic

**File:** `/app/actions/auth.ts` (around line 241)

```typescript
// BEFORE:
let redirectUrl = '/dashboard';
if (accountType === 'studio') {
  redirectUrl = '/dashboard'; // Will redirect to /dashboard/owner
} else if (accountType === 'customer') {
  redirectUrl = '/'; // Landing page
}

// AFTER:
let redirectUrl = accountType === 'studio' ? `/business/${locale}/dashboard` : '/';
```

### Step 5: Update Dashboard Page (Customer Only)

**File:** `/app/[locale]/dashboard/page.tsx`

```typescript
// REMOVE ENTIRE SECTION (around line 64-67):
if (studios.length > 0) {
  redirect(`/${locale}/dashboard/owner`);
}

// NOW JUST RENDER CUSTOMER DASHBOARD
// If a studio owner somehow reaches this page, redirect:
if (userRole === UserRole.STUDIO_OWNER) {
  redirect(`/business/${locale}/dashboard`);
}
```

### Step 6: Update Auth Components

**File:** `/components/auth/UnifiedAuthDialog.tsx`

Find the success handler and ensure it respects the redirect URL returned from `signIn()`:

```typescript
// This should already work if signIn() returns correct redirectUrl
const result = await signIn(formData);
if (result.success && result.data?.redirectUrl) {
  router.push(result.data.redirectUrl);
}
```

### Step 7: Cleanup Old Files

```bash
# Delete the old owner dashboard
rm -rf app/[locale]/dashboard/owner/
```

### Step 8: Update Imports (if needed)

Search for any hardcoded links to `/dashboard/owner`:
```bash
grep -r "/dashboard/owner" app/ --include="*.tsx" --include="*.ts"
```

Replace with `/business/${locale}/dashboard` as appropriate.

---

## Testing Checklist

### Authentication Flows
- [ ] Register as CUSTOMER → Lands on `/`
- [ ] Register as STUDIO_OWNER → Lands on `/business/[locale]/dashboard`
- [ ] Login as CUSTOMER → Redirects to `/`
- [ ] Login as STUDIO_OWNER → Redirects to `/business/[locale]/dashboard`
- [ ] Google OAuth as new CUSTOMER → Lands on `/`
- [ ] Google OAuth as existing STUDIO_OWNER → Lands on `/business/[locale]/dashboard`

### Navigation
- [ ] CUSTOMER cannot access `/business/*` routes
- [ ] STUDIO_OWNER cannot access `/dashboard` (should redirect)
- [ ] All internal links use correct portal URLs
- [ ] Logout and login again works seamlessly

### Edge Cases
- [ ] Multi-language support works (`/de/`, `/en/`, etc.)
- [ ] Email verification works for both portals
- [ ] Password reset works for both portals
- [ ] Session persists across page navigation
- [ ] Role-based access control enforced

---

## Common Issues & Solutions

### Issue: "Cannot read property 'primaryRole'"

**Cause:** Session data not properly loaded
**Solution:** Ensure `auth()` is called and session is awaited:
```typescript
const session = await auth();
if (!session?.user?.id) redirect('/');
const role = (session.user as any).primaryRole;
```

### Issue: User redirects to wrong portal

**Cause:** Redirect URL in auth action doesn't include locale
**Solution:** Make sure to use `locale` variable:
```typescript
redirectUrl = `/business/${locale}/dashboard`; // ✓ Correct
redirectUrl = `/business/dashboard`; // ✗ Missing locale
```

### Issue: Old `/dashboard/owner` URLs still exist

**Cause:** Incomplete file moves or old links not updated
**Solution:** Search for all occurrences:
```bash
grep -r "dashboard/owner" app/ components/
```

### Issue: "Cannot find module" errors after moving files

**Cause:** Relative imports not updated
**Solution:** Update import paths in moved files:
```typescript
// OLD: import { Component } from '@/app/[locale]/dashboard/owner/_components'
// NEW: import { Component } from '@/app/business/[locale]/dashboard/_components'
```

Use absolute imports (`@/`) to make moves easier.

---

## Files Summary

### New Files (2)
- `app/business/[locale]/layout.tsx`
- `app/business/[locale]/page.tsx`

### Modified Files (3)
- `app/actions/auth.ts` (~5 lines)
- `app/[locale]/dashboard/page.tsx` (~20 lines)
- `components/auth/UnifiedAuthDialog.tsx` (if needed)

### Moved Files (~20)
- All files from `app/[locale]/dashboard/owner/` to `app/business/[locale]/dashboard/`

### Deleted Files (~20)
- `app/[locale]/dashboard/owner/` (entire directory)

### No Changes Needed
- `auth-unified.ts` - auth logic unchanged
- `app/api/auth/[...nextauth]/` - API endpoint shared
- Prisma schema - no migrations
- Middleware - i18n works as-is
- Database - no changes

---

## Expected Impact

### Development Time
- **Routing setup:** 30 minutes
- **File moves:** 30 minutes
- **Redirect logic:** 30 minutes
- **Testing:** 1-2 hours
- **Documentation:** 30 minutes
- **Total:** 3-4 hours

### User Impact
- **Zero downtime** (just routing changes)
- **Same login/signup flows** (just different redirect)
- **Same session management** (JWT still works)
- **Clear portal separation** (different URLs)

### Risk Level
**🟢 LOW** - Routing-only changes, no auth logic modifications

---

## Rollback Plan

If something breaks:

1. **Keep old `/dashboard/owner/` files** until confident
2. **Don't delete immediately** - keep as backup
3. **Easy to revert:** Just change redirect URLs back
4. **Session is unaffected** - no data loss

If major issues occur:
```bash
# Restore old directory
git restore app/[locale]/dashboard/owner/

# Revert auth action
git restore app/actions/auth.ts

# Redeploy
```

---

## Success Criteria

✅ All tests pass
✅ CUSTOMER signup → lands on `/`
✅ STUDIO_OWNER signup → lands on `/business/[locale]/dashboard`
✅ No 404 errors for valid routes
✅ All role-based redirects work
✅ Sessions persist across portals
✅ Can logout and switch accounts

---

**Estimated Effort:** 3-5 hours including testing
**Risk Level:** LOW
**Complexity:** MEDIUM (just routing, no auth changes)
