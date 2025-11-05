# Massava Authentication & Routing Architecture Analysis
## For `/business` Portal Separation

**Analysis Date:** November 4, 2025
**Current Branch:** feature/customer-booking-flow
**Scope:** Identify minimal changes needed to separate `/business` portal from customer-facing `/` portal

---

## EXECUTIVE SUMMARY

The Massava codebase is **well-positioned for portal separation** with **MINIMAL changes required**:

- **Current State:** Single unified authentication system + intelligent routing based on user role
- **Desired State:** Separate `/business` and `/` (customer) routes with shared auth
- **Effort Estimate:** 2-3 days (routing + session paths only)
- **Risk Level:** LOW - no authentication logic changes needed

### Key Finding
The infrastructure already supports role-based routing. The separation is primarily a **routing and URL structure change**, not an authentication overhaul.

---

## 1. CURRENT AUTHENTICATION SETUP

### 1.1 NextAuth Configuration

**File:** `/Users/roman/Development/massava/auth-unified.ts`

**Current Setup:**
- **Version:** NextAuth.js v5 (beta.29)
- **Strategy:** JWT-based sessions (30-day maxAge)
- **Providers:**
  - Google OAuth
  - Credentials (email/password) - unified for all users
  - Magic Link (custom credentials) - for passwordless auth

**Key Implementation Details:**
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: process.env.NEXTAUTH_BASEPATH || '/api/auth',
  adapter: UnifiedUserAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
```

**API Route Handler:** `/Users/roman/Development/massava/app/api/auth/[...nextauth]/route.ts`
- Simply re-exports handlers from `auth-unified.ts`
- Can support multiple basePaths via `NEXTAUTH_BASEPATH` env var

### 1.2 Session Structure

**Type Definition:** `/Users/roman/Development/massava/types/next-auth.d.ts`

```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
```

**Session Enrichment:** Callbacks in `auth-unified.ts` add:
- `user.id` - User ID
- `user.primaryRole` - Main role (CUSTOMER, STUDIO_OWNER, SUPER_ADMIN, GUEST)
- `user.roles` - Array of all assigned roles
- `user.accountType` - 'customer' or 'studio' (preference hint for routing)

```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id as string;
    (session.user as any).primaryRole = token.primaryRole;
    (session.user as any).roles = token.roles;
    (session.user as any).accountType = token.accountType || 'customer';
  }
  return session;
}
```

### 1.3 User Type Differentiation

**Database Model:** Unified `User` model in `/Users/roman/Development/massava/prisma/schema.prisma`

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  password      String?
  primaryRole   UserRole  @default(CUSTOMER)
  isActive      Boolean   @default(true)
  isSuspended   Boolean   @default(false)
  
  // Relations for role-based features
  roles        UserRoleAssignment[]
  ownedStudios StudioOwnership[]
  newBookings  NewBooking[]
  // ...
}

enum UserRole {
  SUPER_ADMIN
  STUDIO_OWNER
  CUSTOMER
  GUEST
}
```

**Key Points:**
- Single User table replaces legacy `StudioOwner` and `Customer` tables
- `primaryRole` determines main account type
- `UserRoleAssignment` allows users with STUDIO_OWNER + CUSTOMER roles
- Backward compatibility maintained for legacy models

### 1.4 Login/Signup Pages

**Current Pages:**
- Unified registration/login dialog: `/components/auth/UnifiedAuthDialog.tsx`
- Email verification: `/app/[locale]/auth/verify-email/`
- Auth error page: `/app/auth/error/page.tsx`

**Server Actions:** `/app/actions/auth.ts`
- `signUp()` - Creates user with selectedRole (CUSTOMER or STUDIO_OWNER)
- `signIn()` - Validates credentials, determines redirect URL based on role
- `signInWithGoogle()` - OAuth flow
- `requestPasswordReset()` - Password reset flow
- `resendVerificationEmail()` - Resend verification

**Current Flow:**
1. User selects account type (CUSTOMER or STUDIO_OWNER)
2. User enters email/password
3. Server validates and creates User with `primaryRole` set
4. On login, `accountType` preference stored in session
5. Redirect URL determined in auth action based on role

---

## 2. CURRENT ROUTING STRUCTURE

### 2.1 App Router Layout

```
/app
├── [locale]/                           # Internationalization wrapper
│   ├── layout.tsx                      # Root layout (auth context, nav)
│   ├── page.tsx                        # Landing page (customer view)
│   ├── auth/
│   │   └── verify-email/               # Email verification
│   ├── search/
│   │   └── appointments/               # Customer search results
│   ├── studios/
│   │   ├── page.tsx                    # Studio directory
│   │   ├── [id]/page.tsx              # Studio detail page
│   │   └── register/page.tsx           # Studio registration
│   ├── booking/
│   │   ├── [studioId]/[slotId]/       # Booking confirmation
│   │   └── confirmation/[bookingId]/   # Booking receipt
│   ├── customer/
│   │   └── dashboard/page.tsx          # Legacy customer dashboard
│   ├── dashboard/
│   │   ├── page.tsx                    # Main dashboard (mixed)
│   │   └── owner/
│   │       ├── page.tsx                # Studio owner dashboard
│   │       ├── calendar/               # Booking calendar
│   │       ├── services/               # Service management
│   │       ├── settings/               # Account settings
│   │       └── more/                   # Additional options
│   └── datenschutz/page.tsx            # Privacy policy
├── api/
│   └── auth/[...nextauth]/route.ts     # NextAuth handler
├── auth/
│   └── error/page.tsx                  # Auth error page
└── globals.css
```

### 2.2 Current Routing Logic

**File:** `/app/[locale]/dashboard/page.tsx`

This page intelligently routes users based on their role:

```typescript
export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}?openAuth=login`);
  }

  const userRole = (user as any).primaryRole as UserRole;
  const isStudioOwner = userRole === UserRole.STUDIO_OWNER;

  // Check if user owns studios
  const ownerships = await db.studioOwnership.findMany({
    where: { userId: user.id },
  });

  // If studio owner: redirect to owner dashboard
  if (studios.length > 0) {
    redirect(`/${locale}/dashboard/owner`);
  }

  // If customer: show customer dashboard UI
  return <CustomerDashboardContent />;
}
```

**Current Behavior:**
- `/dashboard` acts as a router page
- If user is STUDIO_OWNER → redirects to `/dashboard/owner`
- If user is CUSTOMER → shows customer dashboard
- If not authenticated → redirects to `/` with `?openAuth=login`

### 2.3 Separate Routes Already Exist

**Studio Owner Routes:** `/dashboard/owner/`
- `/dashboard/owner` - Main owner dashboard
- `/dashboard/owner/calendar` - Booking calendar
- `/dashboard/owner/services` - Service management
- `/dashboard/owner/settings` - Account settings
- `/dashboard/owner/more` - Additional options

**Customer Routes:** Implicitly under `/`
- `/` - Landing page with search widget
- `/search/appointments` - Search results
- `/studios` - Studio directory
- `/studios/[id]` - Studio detail
- `/booking/[studioId]/[slotId]` - Booking form
- `/booking/confirmation/[bookingId]` - Booking receipt

**Problem:** Studios can access both `/` AND `/dashboard` routes without clear separation.

---

## 3. CURRENT SESSION MANAGEMENT

### 3.1 Session Creation

**Flow:**
1. User submits credentials via `signUp()` or `signIn()` server action
2. Server validates email/password against User table
3. Calls `nextAuthSignIn('credentials', {...})` with:
   - email
   - password
   - accountType ('customer' or 'studio')
4. NextAuth's credentials provider `authorize()` callback:
   - Finds user in database
   - Compares hashed password
   - Returns user object with primaryRole and accountType
5. JWT callback enriches token with role data
6. Session callback enriches session with role data

**File:** `/app/actions/auth.ts` - `signIn()` function (lines 142-280)

```typescript
export async function signIn(
  data: UnifiedLogin
): Promise<ActionResult<{ redirectUrl: string }>> {
  const { email, password, accountType } = validatedFields.data;

  // Manually verify credentials
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      primaryRole: true,
    },
  });

  // Validate account type matches user's role
  if (accountType === 'studio' && primaryRole !== 'STUDIO_OWNER') {
    return { error: 'This account is registered as a customer...' };
  }

  // Determine redirect URL
  let redirectUrl = '/dashboard';
  if (accountType === 'studio') {
    redirectUrl = '/dashboard'; // Will redirect to /dashboard/owner
  } else if (accountType === 'customer') {
    redirectUrl = '/'; // Landing page
  }

  // Call NextAuth
  await nextAuthSignIn('credentials', {
    email,
    password,
    accountType,
    redirect: false,
  });

  return { success: true, data: { redirectUrl } };
}
```

### 3.2 Session Checks

**Pattern Used:** Server-side checks with `auth()` function

```typescript
const session = await auth();
const userRole = (session.user as any).primaryRole;

if (!session?.user?.id) {
  redirect(`/${locale}?openAuth=login`);
}
```

**Locations:**
- `/dashboard/page.tsx` - Checks if user is authenticated, routes by role
- `/dashboard/owner/page.tsx` - Guards studio owner routes
- All other protected pages

**No Middleware Guard:**
- NextAuth middleware not currently used for route protection
- All protection happens via server-side checks and redirects
- Good for flexibility, but means manual guarding on each route

### 3.3 Session Data Storage

**In JWT Token:**
- `id` - User ID
- `email` - User email
- `primaryRole` - Main role enum
- `roles` - Array of all roles
- `accountType` - 'customer' or 'studio' (preference)

**Accessible in Session:**
```typescript
session.user.id
(session.user as any).primaryRole
(session.user as any).roles
(session.user as any).accountType
```

**No Cookies or Local Storage for Role:**
- Role only in JWT → secure by default
- Role verified on server for every protected route
- Can't be spoofed from client-side

---

## 4. DATABASE SCHEMA ANALYSIS

### 4.1 User Model (Unified)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  password      String?
  name          String?
  phone         String?
  image         String?

  // RBAC
  primaryRole   UserRole  @default(CUSTOMER)
  isActive      Boolean   @default(true)
  isSuspended   Boolean   @default(false)

  // Relations
  roles        UserRoleAssignment[]  // Multiple roles
  ownedStudios StudioOwnership[]     // Studio ownership
  newBookings  NewBooking[]          // Bookings
  newFavorites Studio[]              // Favorite studios
  auditLogs    AuditLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Supports:**
- ✅ Multi-role users (CUSTOMER + STUDIO_OWNER)
- ✅ Role expiration (future feature via `expiresAt`)
- ✅ Resource-scoped roles (via `studioId` in UserRoleAssignment)
- ✅ Audit trail (grantedBy, grantedAt)

### 4.2 Multi-Ownership Model

```prisma
model StudioOwnership {
  userId      String
  studioId    String
  canTransfer Boolean @default(false)
  
  invitedBy   String?
  invitedAt   DateTime @default(now())
  acceptedAt  DateTime?
}
```

**Supports:**
- ✅ Multiple owners per studio
- ✅ Team invitations (future)
- ✅ Ownership transfer capability

### 4.3 Booking Models (Dual)

**Legacy:** `Booking` model (links to Customer)
**New:** `NewBooking` model (links to User)

Both exist for backward compatibility during migration.

### 4.4 Key Finding
Database schema is **perfectly designed** for portal separation:
- Single user table with role-based access
- No conflict between customer and studio owner data
- Clear separation via primaryRole and StudioOwnership

---

## 5. WHAT NEEDS TO CHANGE FOR `/business` SEPARATION

### 5.1 Routing Changes (Primary Work)

**Current Structure:**
```
/ (root)
├── [locale]/page.tsx           → Customer landing page
├── [locale]/dashboard/         → Mixed (routes by role)
├── [locale]/dashboard/owner/   → Studio owner dashboard
└── [locale]/auth/              → Auth pages
```

**Proposed Structure:**
```
/ (root)
├── [locale]/
│   ├── page.tsx                → Customer landing page
│   ├── search/                 → Customer search
│   ├── booking/                → Customer booking
│   ├── auth/                   → Shared auth pages
│   ├── api/auth/               → Shared NextAuth endpoint
│   └── (customer)/             → Route group (optional)
│
└── business/
    └── [locale]/
        ├── page.tsx            → Studio dashboard landing
        ├── dashboard/          → Studio dashboard
        ├── services/           → Service management
        ├── calendar/           → Booking calendar
        ├── settings/           → Account settings
        └── auth/               → Auth pages (can be shared)
```

### 5.2 Required File Changes

#### 2A. Create `/business/[locale]/layout.tsx`
**Purpose:** Separate root layout for business portal
**Copy From:** `/app/[locale]/layout.tsx`
**Changes:**
- Different header/navigation (business branding)
- Different footer
- Different auth context handling (if needed)

#### 2B. Move studio owner routes
**Current:** `/app/[locale]/dashboard/owner/**`
**New:** `/app/business/[locale]/dashboard/**`
**Impact:** ~8 files

#### 2C. Update `/app/[locale]/dashboard/page.tsx`
**Current:** Acts as router, checks role and redirects
**New:** Remove studio owner logic, only show customer dashboard
**Remove:** Redirect to `/dashboard/owner` logic

#### 2D. Update auth redirect logic
**Current:** After login, redirect to `/dashboard` (which routes by role)
**New:** After login:
- If CUSTOMER → redirect to `/`
- If STUDIO_OWNER → redirect to `/business/[locale]/dashboard`

**Files to Update:**
- `/app/actions/auth.ts` - `signIn()` function
- `/components/auth/UnifiedAuthDialog.tsx` - Success callback

#### 2E. Shared Auth Pages
**Current:** `/app/[locale]/auth/` (only verification page exists)
**Decision:**
- Option A: Keep under `/app/[locale]/auth/` (accessible from both)
- Option B: Create mirror at `/app/business/[locale]/auth/`
- **Recommendation:** Option A - share auth pages, easier maintenance

#### 2F. Update Middleware (if needed)
**Current:** `/middleware.ts` - handles i18n
**Change:** May need to handle `/business` prefix intelligently
**Current Code:**
```typescript
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
```
**Status:** Should work as-is (next-intl handles any route)

### 5.3 Session Path Changes

**Current:** All session data in JWT with no path awareness
**Change:** None needed! Session is agnostic to route

**However:** Add explicit path checks in dashboard pages:

```typescript
// /app/[locale]/dashboard/page.tsx
if (userRole === UserRole.STUDIO_OWNER) {
  // Now must redirect to /business version instead
  redirect(`/business/${locale}/dashboard`);
}

// /app/business/[locale]/dashboard/page.tsx
if (userRole === UserRole.CUSTOMER) {
  redirect(`/${locale}`);
}
```

### 5.4 Auth Configuration Changes

**NextAuth Base Path:** Currently `/api/auth`
**Options:**
1. Keep `/api/auth` for both (shared endpoint)
2. Create `/api/business/auth` (new endpoint)
3. Support both via env var

**Recommendation:** Option 1 - keep shared endpoint
- Simplifies implementation
- NextAuth doesn't care about route structure
- Single session token works for both

**If splitting is required:**
- Would need separate NextAuth config files
- More complex, not recommended for this separation

---

## 6. MINIMAL CHANGES NEEDED - IMPLEMENTATION MAP

### Phase 1: Routing Structure (1 day)

```
[✓ Already done] Review schema - User model supports separation
[ ] Create /business route group
[ ] Create /business/[locale]/layout.tsx
[ ] Move /app/[locale]/dashboard/owner/* → /app/business/[locale]/*
[ ] Update imports in moved files
```

**Files to Create:** ~2
**Files to Move:** ~8
**Files to Modify:** ~5

### Phase 2: Redirect Logic (1 day)

```
[ ] Update /app/actions/auth.ts - signIn() function:
    - Change redirect URLs based on role
    - CUSTOMER → `/${locale}`
    - STUDIO_OWNER → `/business/${locale}/dashboard`

[ ] Update /components/auth/UnifiedAuthDialog.tsx
    - Update success callback redirect

[ ] Update /app/[locale]/dashboard/page.tsx
    - Remove STUDIO_OWNER display logic
    - Only show customer-facing content
    - Redirect STUDIO_OWNER to /business path

[ ] Create /app/business/[locale]/dashboard/page.tsx
    - Verify STUDIO_OWNER access
    - Show studio owner content (copy from old location)

[ ] Update environment configs (if using NEXTAUTH_BASEPATH)
    - No change needed if using shared /api/auth
```

**Files to Modify:** ~5
**Lines of Code:** ~50-100 total

### Phase 3: Navigation & Components (0.5 days)

```
[ ] Create separate navigation components:
    - /components/nav/CustomerNav.tsx (already exists in page)
    - /components/nav/BusinessNav.tsx (new for /business routes)

[ ] Update header layouts
    - /app/[locale]/layout.tsx - customer header
    - /app/business/[locale]/layout.tsx - business header

[ ] Update authentication dialogs
    - Ensure proper redirect based on selected account type
```

### Phase 4: Testing & Validation (0.5 days)

```
[ ] Test customer signup → lands on /
[ ] Test studio owner signup → lands on /business/[locale]/dashboard
[ ] Test login with CUSTOMER role → redirects to /
[ ] Test login with STUDIO_OWNER role → redirects to /business/[locale]/dashboard
[ ] Test navigation between customer and studio owner features
[ ] Test switching accounts (logout/login as different user)
[ ] Test OAuth flows (Google) → correct role routing
```

---

## 7. FILES REQUIRING CHANGES

### Critical Files (Must Change)

| File | Change Type | Reason |
|------|-------------|--------|
| `/app/actions/auth.ts` | Modify | Update redirect URLs based on role |
| `/app/[locale]/dashboard/page.tsx` | Modify | Remove studio logic, only customer |
| `/components/auth/UnifiedAuthDialog.tsx` | Modify | Update success redirect |

### New Files (Must Create)

| File | Purpose |
|------|---------|
| `/app/business/[locale]/layout.tsx` | Business portal root layout |
| `/app/business/[locale]/dashboard/page.tsx` | Business dashboard entry point |

### Files to Move (from one location to another)

| Current Location | New Location | Files |
|------------------|-------------|-------|
| `/app/[locale]/dashboard/owner/` | `/app/business/[locale]/dashboard/` | 7 files |
| `/app/[locale]/dashboard/owner/_components/` | `/app/business/[locale]/dashboard/_components/` | all components |

### Nice-to-Have Files (Optional for UX)

| File | Purpose |
|------|---------|
| `/components/nav/BusinessNav.tsx` | Dedicated business navigation |
| `/components/nav/CustomerNav.tsx` | Dedicated customer navigation |
| `/app/business/[locale]/auth/` | Mirror auth pages (or share) |

---

## 8. AUTHENTICATION LOGIC - NO CHANGES NEEDED

### Why Auth Logic Doesn't Change

1. **Session is role-aware:**
   - Already contains `primaryRole` and `roles`
   - Accessible in both `/` and `/business` routes

2. **No special auth per route:**
   - Same `auth()` function works for both
   - Same JWT token valid for both routes
   - Same token refresh mechanism

3. **Role checking is already in place:**
   ```typescript
   const session = await auth();
   const userRole = (session.user as any).primaryRole;
   ```
   This works identically in both `/app/[locale]` and `/app/business/[locale]`

4. **Password-less auth already implemented:**
   - Magic links work for both
   - Email verification works for both
   - Role assignment happens during registration

### What DOES Change

- **URL paths** (redirect destinations)
- **Route guards** (verify correct role on each route)
- **Layout/Navigation** (different UI for different portals)

---

## 9. RISK ASSESSMENT

### Low Risk Items
- Routing structure changes (isolated to route files)
- Redirect logic updates (in auth actions, well-contained)
- Layout separation (independent components)

### Medium Risk Items
- Ensuring all studio owner routes protected properly
- Ensuring all customer routes protected properly
- Cross-portal links (if any)

### Mitigation Strategies
1. **Create redirect guards:**
   ```typescript
   // /app/business/[locale]/layout.tsx
   export default async function BusinessLayout() {
     const session = await auth();
     if (!session?.user?.id) {
       redirect('/'); // No business access without auth
     }
     const role = (session.user as any).primaryRole;
     if (role !== UserRole.STUDIO_OWNER) {
       redirect('/'); // Only studio owners access /business
     }
   }
   ```

2. **Test comprehensive flows:**
   - All auth methods (email/password, Google, magic link)
   - Role transitions (if applicable)
   - Portal switching

3. **Keep shared infrastructure:**
   - Single NextAuth endpoint
   - Single session token
   - Single database

---

## 10. CURRENT STATE: What Already Exists

### Perfect for Separation
- ✅ Unified User model with role support
- ✅ RBAC system (UserRoleAssignment)
- ✅ Session already contains role data
- ✅ Studio owner routes already separated (`/dashboard/owner/`)
- ✅ Multiple auth providers (email, Google, magic link)

### Could Be Better
- ⚠️ No middleware-level route protection (manual per-route)
- ⚠️ Some legacy models still in schema (StudioOwner, Customer)
- ⚠️ Route structure not fully separated yet

### Not Needed for This Phase
- ❌ Change authentication logic
- ❌ Change session strategy
- ❌ Modify database schema
- ❌ Change password hashing
- ❌ Change OAuth providers

---

## 11. IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Create feature branch: `feature/business-portal-separation`
- [ ] Review this analysis with team
- [ ] Plan testing strategy

### Phase 1: Structure
- [ ] Create `/app/business/[locale]/` directory
- [ ] Create `/app/business/[locale]/layout.tsx`
- [ ] Create `/app/business/[locale]/page.tsx` (entry page)

### Phase 2: Move Routes
- [ ] Move `/app/[locale]/dashboard/owner/` → `/app/business/[locale]/dashboard/`
- [ ] Move `/app/[locale]/dashboard/owner/_components/` → `/app/business/[locale]/dashboard/_components/`
- [ ] Update all relative imports in moved files

### Phase 3: Update Redirects
- [ ] Modify `/app/actions/auth.ts` - `signIn()` function
- [ ] Modify `/components/auth/UnifiedAuthDialog.tsx` - success handler
- [ ] Modify `/app/[locale]/dashboard/page.tsx` - remove studio logic

### Phase 4: Create Layouts
- [ ] Create `/app/business/[locale]/layout.tsx`
- [ ] Create `/app/[locale]/layout.tsx` (update if needed)
- [ ] Ensure navigation is appropriate for each portal

### Phase 5: Testing
- [ ] Test signup flows (CUSTOMER and STUDIO_OWNER)
- [ ] Test login flows
- [ ] Test role-based redirects
- [ ] Test navigation
- [ ] Test auth edge cases

### Phase 6: Cleanup
- [ ] Remove old `/app/[locale]/dashboard/owner/` directory
- [ ] Update documentation
- [ ] Update any relevant comments
- [ ] Remove any duplicate code

---

## 12. ESTIMATION

### Time Breakdown
| Task | Hours | Risk |
|------|-------|------|
| Create file structure | 0.5 | Low |
| Move files + fix imports | 1 | Low |
| Update auth redirects | 0.5 | Low |
| Create layouts | 0.5 | Low |
| Add route guards | 0.5 | Medium |
| Testing | 1.5 | Low |
| Documentation | 0.5 | Low |
| **Total** | **5-6 hours** | **Low** |

### Confidence Level: **HIGH (90%)**
- Minimal authentication logic changes
- Already clear routing structure
- Well-tested auth system
- Clear separation between customer and studio features

---

## 13. DEPENDENCIES & CONSTRAINTS

### Hard Dependencies
- Next.js App Router (already in place)
- NextAuth.js v5 (already in place)
- Prisma ORM (already in place)
- next-intl for internationalization (already in place)

### Soft Dependencies
- Component library (Radix UI) - already in place
- Styling (Tailwind) - already in place

### No Constraints
- No database schema changes required
- No authentication library changes required
- No session strategy changes required

---

## 14. CONCLUSION: MINIMAL CHANGES SUMMARY

### What Must Change
1. **Route structure** - Create `/business` directory tree
2. **Redirect logic** - Update `signIn()` to route by role
3. **Layout files** - Create business-specific layouts
4. **Route guards** - Add role verification per portal

### What Doesn't Change
- Authentication system (stays exactly as is)
- Session strategy (JWT remains the same)
- Database schema (no migrations needed)
- Role management (RBAC system unchanged)
- OAuth/magic link flows (work for both)

### Why This is Minimal
- Auth system is **already role-aware**
- Session **already contains role data**
- Database **already supports separation**
- UI/Layout **already has potential for splitting**
- Only **routing and redirects** need adjustment

### Effort: **2-3 Days** (Development + Testing)
- Experienced developer familiar with Next.js: 2 days
- Team with code review: 2.5 days
- Conservative estimate with thorough testing: 3 days

This is a **routing exercise**, not an authentication refactor.

---

**Document Created By:** Architecture Analysis
**Status:** Ready for Implementation
**Approval Status:** Pending team review
