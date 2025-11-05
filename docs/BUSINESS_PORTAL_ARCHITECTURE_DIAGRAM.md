# Business Portal Separation - Architecture Diagrams

## 1. High-Level Portal Structure (AFTER)

```
                        MASSAVA PLATFORM
                              |
                    __________|___________
                   |                      |
              CUSTOMER PORTAL        BUSINESS PORTAL
              (Public-facing)        (Studio Owners)
                   |                      |
             localhost:3000         localhost:3000
                 /en/                 /en/business
                 /de/                 /de/business
                  /                   /business/[locale]
                  |                      |
         ┌─────────────────┐    ┌──────────────────┐
         │ Search studios  │    │ Studio Dashboard │
         │ Browse services │    │ Manage bookings  │
         │ Book massage    │    │ Manage services  │
         │ View history    │    │ View analytics   │
         │ Save favorites  │    │ Team management  │
         └─────────────────┘    └──────────────────┘
                  |                      |
            Shared Auth                Shared Auth
           (Same NextAuth             (Same NextAuth
            endpoint)                 endpoint)
             /api/auth/                /api/auth/
                  |                      |
                  └─────────┬────────────┘
                            |
                   UNIFIED USER MODEL
                   (Single DB table)
                            |
                  ┌──────────┴──────────┐
                  |                     |
            Customer Role        Studio Owner Role
            (primaryRole:         (primaryRole:
             CUSTOMER)           STUDIO_OWNER)
```

## 2. Authentication & Session Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    NEW USER SIGNUP                          │
└─────────────────────────────────────────────────────────────┘

1. User visits app
   ├─ Customer: goes to /en/ (landing page)
   └─ Studio: goes to /en/business (business portal)

2. Clicks "Sign Up"
   ├─ Modal opens (shared component)
   └─ User selects account type:
      ├─ CUSTOMER: "Ich möchte einen Termin buchen"
      └─ STUDIO_OWNER: "Ich möchte mein Studio registrieren"

3. Submits registration form
   └─ server action: signUp() in /app/actions/auth.ts
      ├─ Creates User record with primaryRole = selected role
      ├─ Sends verification email
      └─ Returns success

4. User verifies email
   └─ Clicks magic link in email
      ├─ Verifies email in DB
      └─ Shows "Email verified" message

5. User clicks "Login" after verification
   └─ Server action: signIn()
      ├─ Validates credentials
      ├─ Calls NextAuth: await signIn('credentials', {...})
      ├─ NextAuth returns JWT token with:
      │  ├─ id
      │  ├─ email
      │  ├─ primaryRole (CUSTOMER or STUDIO_OWNER)
      │  ├─ roles (array of all roles)
      │  └─ accountType ('customer' or 'studio')
      └─ Determines redirect URL:
         ├─ If CUSTOMER → redirect to /en/
         └─ If STUDIO_OWNER → redirect to /en/business/dashboard

6. Browser navigates to redirect URL
   └─ Server component layout renders:
      ├─ Calls auth() to get session
      ├─ Verifies user.id exists
      ├─ Checks role via primaryRole
      ├─ If unauthorized → redirect('/') 
      └─ If authorized → render page content

7. User sees appropriate portal
   ├─ CUSTOMER: Customer dashboard
   └─ STUDIO_OWNER: Studio dashboard


┌─────────────────────────────────────────────────────────────┐
│              EXISTING USER LOGIN (SAME FLOW)               │
│     But find existing account instead of creating new    │
└─────────────────────────────────────────────────────────────┘
```

## 3. Route Structure (BEFORE vs AFTER)

### BEFORE: Mixed Routes
```
app/
├── [locale]/
│   ├── page.tsx                     ← Customer landing
│   ├── search/
│   │   └── appointments/page.tsx
│   ├── booking/
│   │   ├── [studioId]/[slotId]/page.tsx
│   │   └── confirmation/[bookingId]/page.tsx
│   ├── studios/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── register/page.tsx
│   ├── auth/
│   │   └── verify-email/page.tsx
│   └── dashboard/
│       ├── page.tsx                 ← ROUTER (checks role)
│       └── owner/
│           ├── page.tsx             ← Studio owner dashboard
│           ├── calendar/page.tsx
│           ├── services/page.tsx
│           ├── settings/page.tsx
│           └── more/page.tsx
│
└── api/
    └── auth/[...nextauth]/route.ts  ← NextAuth endpoint
```

### AFTER: Clear Separation
```
app/
├── [locale]/
│   ├── page.tsx                     ← Customer landing
│   ├── search/
│   │   └── appointments/page.tsx
│   ├── booking/
│   │   ├── [studioId]/[slotId]/page.tsx
│   │   └── confirmation/[bookingId]/page.tsx
│   ├── studios/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── register/page.tsx        ← Still here (signup)
│   ├── auth/
│   │   └── verify-email/page.tsx    ← Shared auth
│   ├── dashboard/
│   │   └── page.tsx                 ← REMOVED (was router)
│   └── layout.tsx                   ← Customer-specific
│
├── business/                        ← NEW portal root
│   └── [locale]/
│       ├── page.tsx                 ← Entry page (redirect to dashboard)
│       ├── layout.tsx               ← Business-specific layout
│       └── dashboard/
│           ├── page.tsx             ← Studio dashboard (moved here)
│           ├── calendar/page.tsx    ← (moved here)
│           ├── services/page.tsx    ← (moved here)
│           ├── settings/page.tsx    ← (moved here)
│           ├── more/page.tsx        ← (moved here)
│           └── _components/         ← (moved here)
│
└── api/
    └── auth/[...nextauth]/route.ts  ← Shared endpoint
```

## 4. Data Flow: Role-Based Routing

```
┌──────────────────────────────┐
│  User submits login form    │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ signIn() in /app/actions/auth.ts │
├──────────────────────────────────┤
│ 1. Validate email/password       │
│ 2. Find User in database         │
│ 3. Check primaryRole             │
│ 4. Call NextAuth signIn()        │
│ 5. Determine redirectUrl:        │
│    if primaryRole === STUDIO_OWNER:
│      redirectUrl = '/business/[locale]/dashboard'
│    else:
│      redirectUrl = '/'
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Session Created (JWT token)      │
├──────────────────────────────────┤
│ {                                │
│   user: {                        │
│     id: "cuid123",               │
│     email: "user@example.com",   │
│     primaryRole: "STUDIO_OWNER", │
│     roles: ["STUDIO_OWNER"],     │
│     accountType: "studio"        │
│   },                             │
│   expires: "2025-12-04"          │
│ }                                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Browser navigates to             │
│ /business/[locale]/dashboard     │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Server-side layout.tsx renders   │
├──────────────────────────────────┤
│ 1. Call auth()                   │
│ 2. Check session.user.id         │
│ 3. Extract primaryRole           │
│ 4. Verify role === STUDIO_OWNER  │
│    (if not, redirect('/'))       │
│ 5. Render business layout        │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Studio Owner Dashboard Rendered   │
│ (with business-specific nav)      │
└──────────────────────────────────┘
```

## 5. Session Lifecycle

```
Session Stays Alive During:
┌─────────────────────────────────┐
│ Browser requests                │
├─────────────────────────────────┤
│ /en/ (customer)                 │
│ /en/search/appointments         │
│ /en/booking/...                 │
│ /en/business/dashboard (studio) │
│ /en/business/calendar (studio)  │
└─────────────────────────────────┘

Same JWT token works for ALL routes!

Session invalidates on:
├─ logout() called → token deleted
├─ Token expires (30 days)
└─ Manual signOut via NextAuth

Switching accounts:
1. User on /en/business/dashboard (STUDIO_OWNER)
2. Clicks logout
3. Session cleared
4. Redirected to /en/?openAuth=login
5. Login as CUSTOMER
6. Gets new JWT with primaryRole: CUSTOMER
7. Redirected to /en/
8. Layout.tsx verifies role and shows customer content
```

## 6. File Changes Summary (Visual)

```
Files to CREATE:
┌─────────────────────────────────┐
│ app/business/[locale]/          │  ← New directory
│ ├── layout.tsx (NEW)            │  
│ ├── page.tsx (NEW)              │  
│ └── dashboard/                  │  
│     ├── page.tsx (COPY+PASTE)   │  From old location
│     ├── calendar/...            │  (copy all subdirs)
│     ├── services/...            │  
│     ├── settings/...            │  
│     └── _components/            │  
└─────────────────────────────────┘

Files to MODIFY:
┌─────────────────────────────────┐
│ 1. /app/actions/auth.ts         │  ← Change redirect URL
│    Line ~241                    │
│    OLD: redirectUrl = '/dash...'│
│    NEW: redirectUrl = `/busin...│
│                                 │
│ 2. /app/[locale]/dashboard/...  │  ← Remove studio logic
│    Line ~64-67                  │
│    DELETE: if (studios.length) redirect
│                                 │
│ 3. /components/auth/...Dialog   │  ← Ensure correct redirect
│                                 │
└─────────────────────────────────┘

Files to DELETE:
┌─────────────────────────────────┐
│ app/[locale]/dashboard/owner/   │  ← Entire directory
│ (AFTER files are safely moved)  │
└─────────────────────────────────┘

Files that DON'T change:
┌─────────────────────────────────┐
│ ✓ auth-unified.ts              │
│ ✓ app/api/auth/[...nextauth]/  │
│ ✓ prisma/schema.prisma         │
│ ✓ middleware.ts                │
│ ✓ Database models              │
│ ✓ Auth logic/flows             │
└─────────────────────────────────┘
```

## 7. Testing Decision Tree

```
                          START TEST
                              │
                ┌─────────────┴──────────────┐
                │                            │
           SIGNUP FLOW                   LOGIN FLOW
                │                            │
        ┌───────┴────────┐          ┌───────┴────────┐
        │                │          │                │
    CUSTOMER      STUDIO_OWNER   CUSTOMER    STUDIO_OWNER
        │                │          │                │
        ▼                ▼          ▼                ▼
   Redirect to    Redirect to  Redirect to   Redirect to
     / (home)     /business/   / (home)      /business/
                  dashboard               dashboard
        │                │          │                │
        └────────┬───────┘          └────────┬───────┘
                 │                          │
                 ▼                          ▼
         VERIFY CORRECT              VERIFY CORRECT
         PAGE CONTENT              PAGE CONTENT
                 │                          │
        ┌────────┴────────┐        ┌────────┴────────┐
        │                 │        │                 │
     Pass route           Pass role  Can't access    Can't access
     guards               guards    /business/*      /dashboard
        │                 │        (auto-redirect)  (auto-redirect)
        └─────────────────┴────────┴─────────────────┘
                         │
                         ▼
                    ✓ ALL TESTS PASS
```

## 8. Sequence Diagram: New Customer Registration

```
CUSTOMER                AUTH              NEXTAUTH              DATABASE
   │                     │                   │                    │
   ├─ Fill signup form ──┤                   │                    │
   │  (Email, Password)  │                   │                    │
   │                     │                   │                    │
   ├─ Click Submit ──────►signUp()           │                    │
   │                     │                   │                    │
   │                     ├─ Validate input ──┤                    │
   │                     │                   │                    │
   │                     ├─ Check email exists──────────────────► │
   │                     │                   │      Query users    │
   │                     │                   │◄─────────────────   │
   │                     │                   │    (not found ✓)    │
   │                     │                   │                    │
   │                     ├─ Hash password ───┤                    │
   │                     │                   │                    │
   │                     ├─ Create user ─────────────────────────►│
   │                     │  primaryRole:      │                    │
   │                     │   CUSTOMER         │    INSERT User     │
   │                     │                    │◄──────────────────  │
   │                     │                    │   (returns id)     │
   │                     │                    │                    │
   │                     ├─ Send email ──────►│                    │
   │                     │                    │ (async, non-block)  │
   │                     │                    │                    │
   │                     ├─ Return success ──►│                    │
   │                     │                    │                    │
   │◄────── Success ──────┤                   │                    │
   │   message           │                   │                    │
   │                     │                   │                    │
   ├─ Check email ──────►│                   │                    │
   │  Gets magic link    │                   │                    │
   │                     │                   │                    │
   ├─ Clicks link ───────►signIn() or        │                    │
   │                     │ verify endpoint   │                    │
   │                     │                   │                    │
   │                     ├─ Mark email ──────────────────────────►│
   │                     │  verified         │    UPDATE User     │
   │                     │                   │◄──────────────────  │
   │                     │                   │  (emailVerified)    │
   │                     │                   │                    │
   │◄──── Logged in ──────┤                   │                    │
   │  with JWT token     │                   │                    │
   │                     │                   │                    │
   ├─ Redirect to / ─────┤                   │                    │
   │  (Customer portal)  │                   │                    │
   │                     │                   │                    │
   └─────────────────────┴───────────────────┴────────────────────┘

JWT Token Contains:
{
  user: {
    id: "cuid123...",
    email: "customer@example.com",
    primaryRole: "CUSTOMER",
    roles: ["CUSTOMER"],
    accountType: "customer"
  },
  iat: 1234567890,
  exp: 1704067890  // 30 days
}
```

## 9. Permission Matrix

```
                  CUSTOMER ROLE    STUDIO_OWNER ROLE    GUEST
                  ─────────────    ──────────────────    ─────
/en/              ✓ FULL           ✓ FULL               ✗ Limited
/en/search        ✓                ✓                    ✓ Read-only
/en/booking       ✓                ✓                    ✗ (AUTH required)
/en/dashboard     ✗ BLOCKED        ✗ REDIRECT           ✗ BLOCKED
/en/studios       ✓                ✓                    ✓
/en/studios/[id]  ✓                ✓                    ✓

/business         ✗ 403 FORBIDDEN  ✓ FULL               ✗ FORBIDDEN
/business/[locale]/dashboard
                  ✗ 303 REDIRECT   ✓ FULL               ✗ FORBIDDEN
/business/calendar
                  ✗ 303 REDIRECT   ✓                    ✗ FORBIDDEN
/business/services
                  ✗ 303 REDIRECT   ✓                    ✗ FORBIDDEN

Legend:
✓ = Allowed
✗ = Blocked/Redirected
```

---

This completes the architectural analysis with visual diagrams showing:
1. Portal structure separation
2. Auth and session flow
3. Route organization before/after
4. Data flow with role-based routing
5. Session lifecycle
6. File organization changes
7. Testing decision tree
8. Sequence diagram for signup
9. Permission matrix

All diagrams use ASCII art for clarity and can be rendered in markdown.
