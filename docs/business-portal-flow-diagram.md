# Business Portal Access Flow Diagram

Visual representation of the business portal access control flow.

## Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
│                    /business/studios                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware (Next.js)                          │
│                                                                   │
│  1. i18n Middleware                                               │
│     - Extract locale (de, en, th, etc.)                          │
│     - Normalize path                                              │
│                                                                   │
│  2. Business Portal Check                                         │
│     - Is this /business/* or /api/business/* ?                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────┴──────────┐
                   │                    │
                  Yes                  No
                   │                    │
                   ▼                    ▼
         ┌─────────────────┐   ┌──────────────┐
         │ Business Route  │   │ Other Route  │
         │ Protection      │   │ (Pass thru)  │
         └─────────┬───────┘   └──────┬───────┘
                   │                    │
                   ▼                    │
         ┌─────────────────┐           │
         │ Check Session   │           │
         │ await auth()    │           │
         └─────────┬───────┘           │
                   │                    │
         ┌─────────┴──────────┐        │
         │                    │        │
    Session Exists      No Session    │
         │                    │        │
         ▼                    ▼        │
┌─────────────────┐  ┌──────────────────────┐
│ Check Role      │  │ Redirect to Sign In  │
│                 │  │ /auth/signin         │
│ primaryRole?    │  │ ?callbackUrl=        │
│ roles[]?        │  │   /business/studios  │
└────────┬────────┘  └──────────────────────┘
         │
┌────────┴─────────┐
│                  │
│   STUDIO_OWNER   │   CUSTOMER, GUEST
│   SUPER_ADMIN    │   (other roles)
│                  │
▼                  ▼
┌──────────────┐  ┌─────────────────┐
│ Allow Access │  │ Unauthorized    │
│ Continue to  │  │ Redirect to     │
│ Component    │  │ /unauthorized   │
└──────┬───────┘  │ ?requested=...  │
       │          └─────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Business Portal Page     │
│ - Dashboard              │
│ - Studio Management      │
│ - Bookings               │
│ - Settings               │
└──────────────────────────┘
```

## Role-Based Access Matrix

```
┌────────────────┬──────────────┬─────────────┬──────────────┬─────────┐
│ Route          │ STUDIO_OWNER │ SUPER_ADMIN │  CUSTOMER    │  GUEST  │
├────────────────┼──────────────┼─────────────┼──────────────┼─────────┤
│ /              │      ✅      │     ✅      │      ✅      │   ✅    │
│ /studios       │      ✅      │     ✅      │      ✅      │   ✅    │
│ /search        │      ✅      │     ✅      │      ✅      │   ✅    │
│ /booking/*     │      ✅      │     ✅      │      ✅      │   ❌    │
│ /customer/*    │      ✅      │     ✅      │      ✅      │   ❌    │
├────────────────┼──────────────┼─────────────┼──────────────┼─────────┤
│ /business/*    │      ✅      │     ✅      │      ❌      │   ❌    │
│ /api/business/*│      ✅      │     ✅      │      ❌      │   ❌    │
└────────────────┴──────────────┴─────────────┴──────────────┴─────────┘

Legend:
✅ = Access Granted
❌ = Access Denied (redirected)
```

## Unauthorized Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User (CUSTOMER role)                          │
│                Attempts to access /business                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Middleware    │
                    │  checks session │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Role Check:    │
                    │  primaryRole =  │
                    │  CUSTOMER       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Role NOT in    │
                    │  [STUDIO_OWNER, │
                    │   SUPER_ADMIN]  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────────────┐
                    │  Redirect to:           │
                    │  /unauthorized          │
                    │  ?requested=/business   │
                    └────────┬────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Unauthorized Page                             │
│                                                                   │
│  🛡️  Access Not Allowed                                         │
│                                                                   │
│  You don't have permission for the business portal.              │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │ 🏠  Back to Homepage                             │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
│  Help:                                                            │
│  • You're a studio owner? Register your studio first            │
│  • Wrong account? Sign out and try another                      │
│  • Need help? Contact support@massava.app                       │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow (Unauthenticated)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Anonymous User                                │
│                Attempts to access /business/studios              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Middleware    │
                    │  checks session │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  No Session     │
                    │  (null)         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌──────────────────────────────┐
                    │  Redirect to:                │
                    │  /auth/signin                │
                    │  ?callbackUrl=/business/...  │
                    └────────┬─────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Sign In Page                              │
│                                                                   │
│  🔐  Sign In                                                     │
│                                                                   │
│  Email: _______________                                          │
│  Password: _______________                                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │ Sign In                                          │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
│  After sign in → redirect to /business/studios                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               Client Request to API                              │
│          POST /api/business/studios                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware (Next.js)                          │
│                                                                   │
│  1. Match /api/business/*                                        │
│  2. Check session                                                │
│  3. Validate role                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────┴──────────┐
                   │                    │
              Valid Role          Invalid/No Session
                   │                    │
                   ▼                    ▼
         ┌─────────────────┐   ┌──────────────────┐
         │ Pass to API     │   │ Return 401/403   │
         │ Route Handler   │   │ {error: ...}     │
         └─────────┬───────┘   └──────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ API Handler     │
         │ - Additional    │
         │   auth checks   │
         │ - Business      │
         │   logic         │
         └─────────┬───────┘
                   │
                   ▼
         ┌─────────────────┐
         │ Return Response │
         │ 200 OK          │
         │ {data: ...}     │
         └─────────────────┘
```

## Multi-Role User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                User with Multiple Roles                          │
│          primaryRole: CUSTOMER                                   │
│          roles: [CUSTOMER, STUDIO_OWNER]                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Business       │
                    │  Portal Guard   │
                    └────────┬────────┘
                             │
                   ┌─────────┴──────────┐
                   │                    │
         Check primaryRole      Check roles[]
                   │                    │
                   ▼                    ▼
         ┌─────────────────┐   ┌──────────────────┐
         │ CUSTOMER        │   │ Contains         │
         │ ❌ Not allowed  │   │ STUDIO_OWNER     │
         │                 │   │ ✅ Allowed!      │
         └─────────────────┘   └────────┬─────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │ Grant Access    │
                               │ to Business     │
                               │ Portal          │
                               └─────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Security Layers                           │
│                                                                   │
│  Layer 1: Middleware (Edge)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • First line of defense                                  │   │
│  │ • Runs on every request                                  │   │
│  │ • Redirects before component rendering                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  Layer 2: Server Components                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Optional double-check                                  │   │
│  │ • Use hasBusinessPortalAccess()                          │   │
│  │ • Render appropriate UI                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  Layer 3: Server Actions                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Use requireBusinessAccess()                            │   │
│  │ • Throws error if unauthorized                           │   │
│  │ • Validates every mutation                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  Layer 4: API Routes                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Check hasBusinessPortalAccess()                        │   │
│  │ • Return 403 if unauthorized                             │   │
│  │ • Validate external API calls                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Files

```
massava/
│
├── middleware.ts ← Main protection logic
│   └── Chains: i18n + business portal check
│
├── lib/auth/
│   ├── business-portal-guard.ts ← Core utilities
│   │   ├── isBusinessPortalUser()
│   │   ├── hasBusinessPortalAccess()
│   │   ├── requireBusinessAccess()
│   │   └── BusinessPortalAccessDeniedError
│   │
│   └── business-portal-guard.test.ts ← 100% coverage
│
├── app/[locale]/
│   ├── unauthorized/
│   │   └── page.tsx ← Error page
│   │
│   └── business/ ← Protected routes
│       ├── page.tsx
│       ├── studios/
│       ├── bookings/
│       └── settings/
│
└── types/
    └── next-auth.d.ts ← Type extensions
        ├── Session (primaryRole, roles)
        └── JWT (primaryRole, roles)
```

---

**Last Updated**: 2025-11-04
**Task**: MASTER_ORCHESTRATION_PLAN.md - Task 2.1
