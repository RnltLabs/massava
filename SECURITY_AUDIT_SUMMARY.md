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

### Implementation (8 days)

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
- ✅ Fast (8 days implementation)
- ✅ GDPR compliant (no new cookies)

---

## Critical GDPR Blockers

### 1. ❌ Art. 9 GDPR - Health Data Consent Missing

**Issue**: Privacy policy claims explicit consent checkbox exists, but it's NOT in the booking form code.

**Risk**: GDPR violation (€20M fine or 4% revenue)

**Fix Required**:
```typescript
// Add to booking form
<Checkbox id="health-consent" required />
<label>
  Ich willige ausdrücklich ein, dass meine Gesundheitsdaten
  zum Zweck der Massage-Behandlung verarbeitet werden (Art. 9 DSGVO).
</label>
```

**Status**: ⚠️ **MUST FIX BEFORE LAUNCH**

### 2. ⚠️ Cookie Consent Banner Missing

**Issue**: If using analytics (Umami, GA), cookie consent is legally required.

**Fix**: Implement opt-in cookie banner BEFORE loading analytics.

**Status**: ⚠️ **CHECK IF ANALYTICS USED**

---

## Security Issues Summary

### High Priority (Fix Before /business Rollout)

1. ❌ **Health data consent missing** (GDPR Art. 9)
2. ⚠️ **Rate limiting missing** (brute force risk)
3. ⚠️ **Data export/deletion UI missing** (GDPR rights)
4. ⚠️ **JWT not refreshed on role change** (stale permissions)

### Medium Priority (Post-Launch OK)

5. ⚠️ **Long session expiry** (30 days)
6. ⚠️ **No MFA support** (recommended for studio owners)
7. ⚠️ **No auth failure logging** (brute force detection)

### Security Strengths ✅

- ✅ bcrypt cost factor 12
- ✅ Prisma ORM (no SQL injection)
- ✅ Ownership checks in Server Actions
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ No npm vulnerabilities

---

## Implementation Checklist

### Phase 1: GDPR Compliance (1 day)
- [ ] Add health data consent checkbox to booking form
- [ ] Add consent validation to booking schema
- [ ] Test booking fails without consent
- [ ] Check if analytics used → implement cookie banner if yes

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

### Phase 5: Testing (1 day)
- [ ] STUDIO_OWNER cannot access `/customer/*`
- [ ] CUSTOMER cannot access `/business/*`
- [ ] Studio owner A cannot edit studio B
- [ ] Rate limiting blocks brute force
- [ ] Health consent required for booking
- [ ] Data export/deletion works

**Total Time**: 8 days (1-2 sprints)

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

## Next Steps

1. **Fix GDPR blockers** (health consent + cookie consent)
2. **Implement middleware RBAC** (8 days)
3. **Add rate limiting** (1 day)
4. **Security testing** (penetration test recommended)

**Contact**: security-auditor agent via `@security-auditor`

---

**Full Report**: See `BUSINESS_PORTAL_SECURITY_AUDIT.md` for detailed analysis, code examples, and OWASP Top 10 assessment.
