# Security Audit Summary: `/business` Portal Separation

**TL;DR**: ❌ **DO NOT use cookie path separation. Use middleware RBAC instead.**

---

## Critical Finding

**Cookie path restriction is NOT a security boundary.**

Your proposed approach:
- ❌ `customer_session` cookie with `path: '/'`
- ❌ `business_session` cookie with `path: '/business'`

**Problem**: Server-side code can access ALL cookies regardless of path. This is a client-side hint, not server-side enforcement.

---

## Why Cookie Path Fails

### 1. NextAuth Uses Single Cookie

NextAuth.js hardcodes `next-auth.session-token` - you cannot have multiple session cookies without abandoning NextAuth entirely.

### 2. Server Can Access All Cookies

```typescript
// Attacker extracts customer_session from DevTools
// Then manually adds it to /business request
fetch('/business/api/studios', {
  credentials: 'include',  // Sends ALL cookies
  headers: { Cookie: 'customer_session=stolen_token' }
})
// Server cannot tell this is cross-context abuse
```

### 3. No Security Benefit

Your existing ownership checks already prevent cross-studio access. Route separation adds NO additional security.

---

## Recommended Approach: Middleware RBAC

**Single NextAuth session + role-based middleware enforcement**

### Implementation (7 days)

```typescript
// middleware.ts
export default async function middleware(req: NextRequest) {
  const session = await auth()
  const path = req.nextUrl.pathname
  
  // Require STUDIO_OWNER role for /business/*
  if (path.startsWith('/business')) {
    if (!session?.user) return redirectToLogin()
    
    const role = (session.user as any).primaryRole
    if (role !== UserRole.STUDIO_OWNER) {
      return redirectToDashboard()
    }
  }
  
  return NextResponse.next()
}
```

**Benefits**:
- ✅ Secure (role-based authorization)
- ✅ Simple (reuses existing NextAuth)
- ✅ Fast (7 days implementation)
- ✅ GDPR compliant (no new cookies)

---

## GDPR Compliance Status

### ✅ Art. 9 GDPR - Health Data Consent (IMPLEMENTED)

**Status**: ✅ **COMPLIANT**

Health consent checkbox exists in:
- `/app/[locale]/booking/[studioId]/[slotId]/_components/GuestCheckoutForm.tsx`

```typescript
<Checkbox
  id="health"
  checked={form.watch("explicitHealthConsent")}
  onCheckedChange={(checked) => form.setValue("explicitHealthConsent", !!checked)}
/>
<label htmlFor="health">
  Ich willige ein, dass meine Gesundheitsdaten zum Zweck der Behandlung 
  verarbeitet werden (Art. 9 DSGVO) *
</label>
```

**Validation**:
```typescript
explicitHealthConsent: z.boolean().refine(val => val === true, "Zustimmung erforderlich")
```

**Database Storage**:
```prisma
model NewBooking {
  explicitHealthConsent Boolean? @default(false)
  healthConsentGivenAt  DateTime?
  healthConsentText     String?  // Audit trail
}
```

✅ **Good implementation** - explicit consent, required field, audit trail.

### ⚠️ Cookie Consent Banner (CHECK NEEDED)

**Issue**: If using analytics (Umami, GA), cookie consent is legally required.

**Action**: Verify if analytics used, implement banner if yes.

**Status**: ⚠️ **CHECK IF ANALYTICS USED**

---

## Security Issues Summary

### High Priority (Fix Before /business Rollout)

1. ⚠️ **Rate limiting missing** (brute force risk)
2. ⚠️ **Data export/deletion UI missing** (GDPR rights - API exists, UI doesn't)
3. ⚠️ **JWT not refreshed on role change** (stale permissions)

### Medium Priority (Post-Launch OK)

4. ⚠️ **Long session expiry** (30 days)
5. ⚠️ **No MFA support** (recommended for studio owners)
6. ⚠️ **No auth failure logging** (brute force detection)

### Security Strengths ✅

- ✅ bcrypt cost factor 12
- ✅ Prisma ORM (no SQL injection)
- ✅ Ownership checks in Server Actions
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ No npm vulnerabilities
- ✅ Health data consent (Art. 9 GDPR)

---

## Implementation Checklist

### Phase 1: Cookie Consent Check (0.5 days)
- [ ] Check if analytics scripts loaded (Umami, GA)
- [ ] If yes: implement cookie consent banner
- [ ] If no: skip (no analytics = no cookie consent needed)

### Phase 2: /business Separation (3 days)
- [ ] Create `/business` route structure
- [ ] Move studio owner pages to `/business/*`
- [ ] Add middleware role enforcement
- [ ] Update all internal navigation links
- [ ] Add role checks to Server Actions

### Phase 3: Security Hardening (2 days)
- [ ] Install `@upstash/ratelimit`
- [ ] Add rate limiting to login/signup
- [ ] Add JWT role change detection
- [ ] Add audit logging for auth failures

### Phase 4: GDPR UI (1 day)
- [ ] Add "Datenexport" button in settings
- [ ] Add "Konto löschen" button with confirmation
- [ ] Test data export (JSON + CSV)
- [ ] Test account deletion (cascade)

### Phase 5: Testing (0.5 days)
- [ ] STUDIO_OWNER cannot access `/customer/*`
- [ ] CUSTOMER cannot access `/business/*`
- [ ] Studio owner A cannot edit studio B
- [ ] Rate limiting blocks brute force
- [ ] Data export/deletion works

**Total Time**: 7 days (1-2 sprints)

---

## Final Recommendation

### ✅ SAFE APPROACH

**Use middleware RBAC with single NextAuth session**

- Minimal code changes
- Reuses existing auth
- No security vulnerabilities
- GDPR compliant

### ❌ UNSAFE APPROACH

**Cookie path separation**

- Not supported by NextAuth
- Client-side only (not enforced server-side)
- High complexity (custom JWT)
- No security benefit

---

## Answer to Your Questions

### 1. Is cookie path restriction sufficient for GDPR compliance?

**Answer**: ❌ **NO**

Cookie path is a client-side browser hint, not server-side enforcement. GDPR requires actual access control, which must be enforced server-side.

**Correct Approach**: Middleware RBAC (checks role on every request)

---

### 2. Session security - can both sessions coexist safely?

**Answer**: ❌ **NOT POSSIBLE WITH NEXTAUTH**

NextAuth uses a single session cookie. To have dual sessions, you'd need to:
1. Abandon NextAuth entirely
2. Implement custom JWT system
3. Manage two separate JWT secrets
4. Handle token refresh, CSRF, session fixation manually

**Recommendation**: Don't do it. Use single session + role checks.

---

### 3. What happens if user has both CUSTOMER and STUDIO_OWNER roles?

**Answer**: ✅ **ALREADY SUPPORTED**

Your database schema supports multiple roles via `UserRoleAssignment`:

```prisma
model User {
  primaryRole UserRole  // Main role
  roles       UserRoleAssignment[]  // Additional roles
}
```

**Implementation**:
- Use `primaryRole` to determine default dashboard
- Allow role switching via UI dropdown
- Check both `primaryRole` and `roles[]` in middleware

---

### 4. Any CSRF risks with this approach?

**Answer**: ⚠️ **MITIGATED BUT CHECK API ROUTES**

- ✅ Next.js Server Actions have built-in CSRF protection (origin header check)
- ⚠️ Custom API routes need CSRF tokens if they modify data
- ✅ NextAuth handles CSRF for auth endpoints

**Action**: Review custom API routes, add CSRF tokens if needed.

---

### 5. Minimal implementation checklist?

**Answer**: See "Implementation Checklist" above (7 days total)

Key steps:
1. Verify analytics usage → cookie consent if yes
2. Move routes to `/business/*`
3. Add middleware RBAC
4. Add rate limiting
5. Add GDPR UI buttons

---

### 6. Can we reuse existing auth without major refactor?

**Answer**: ✅ **YES**

Your existing auth is solid:
- NextAuth with JWT
- Role stored in JWT (`primaryRole`)
- Ownership checks in Server Actions

**Changes needed**:
- Add middleware role enforcement (50 lines)
- Update route structure (move files)
- No auth refactor needed

---

### 7. Any security pitfalls to avoid?

**Answer**: ⚠️ **KEY PITFALLS**

1. ❌ **Don't rely on cookie path** - not a security boundary
2. ❌ **Don't skip ownership checks** - middleware role check is not enough
3. ❌ **Don't forget rate limiting** - brute force risk
4. ❌ **Don't assume JWT is fresh** - role changes require token refresh

**Best Practice**: Defense in depth (middleware + Server Action checks)

---

### 8. Does current schema support this cleanly?

**Answer**: ✅ **YES**

Your schema is well-designed:

```prisma
model User {
  primaryRole   UserRole  // CUSTOMER | STUDIO_OWNER
  roles         UserRoleAssignment[]  // Multiple roles
  ownedStudios  StudioOwnership[]  // Studio ownership
}
```

**Supports**:
- ✅ Role-based routing (`primaryRole`)
- ✅ Multi-studio ownership (`StudioOwnership`)
- ✅ Granular permissions (`UserRoleAssignment`)

**No schema changes needed.**

---

### 9. Do we need to migrate Booking → NewBooking now?

**Answer**: ⚠️ **RECOMMENDED BUT NOT BLOCKING**

Your codebase has:
- Legacy `Booking` model (old)
- New `NewBooking` model (current)

**Status**: Already migrated in booking flow (`NewBooking` used)

**Action**: Clean up legacy `Booking` references (low priority)

---

### 10. OWASP compliance - broken access control risks?

**Answer**: ✅ **MOSTLY COMPLIANT**

**Current State**:
- ✅ Ownership checks in Server Actions (good)
- ✅ JWT-based authentication (good)
- ⚠️ No middleware route protection (add this)

**Required Fix**:
```typescript
// middleware.ts - Add this
if (path.startsWith('/business') && userRole !== 'STUDIO_OWNER') {
  return redirect('/dashboard')
}
```

**After fix**: ✅ OWASP A01:2021 compliant

---

## Next Steps

### Immediate Action (Today)

1. ✅ **Verify analytics usage**
   - Check if Umami/GA loaded
   - If yes, plan cookie consent banner

2. ✅ **Plan /business migration**
   - List all studio owner pages
   - Design route structure
   - Estimate effort (3 days)

### Week 1: Implementation

1. Move routes to `/business/*`
2. Add middleware RBAC
3. Add rate limiting
4. Test role-based access

### Week 2: Polish & Testing

1. Add GDPR UI buttons
2. Security testing
3. User acceptance testing
4. Deploy to staging

**Total Time**: 7-10 days

---

## Contact & Resources

**Full Report**: `BUSINESS_PORTAL_SECURITY_AUDIT.md` (50+ pages)

**Includes**:
- Detailed OWASP Top 10 analysis
- GDPR compliance assessment (10 articles)
- Code examples (middleware, rate limiting, health consent)
- Testing checklist
- Red flags & blockers

**Contact**: `@security-auditor` for follow-up questions

---

**Updated**: 2025-11-04 (Health consent verified as implemented ✅)
