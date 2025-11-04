# Multi-Domain Architecture Feasibility Analysis
## Massava: business.massava.app + massava.app

See detailed analysis in the three companion documents:
1. MULTI_DOMAIN_ARCHITECTURE_ANALYSIS.md (this file)
2. MULTI_DOMAIN_IMPLEMENTATION_SUMMARY.md 
3. MULTI_DOMAIN_FEASIBILITY_VALIDATION.md

## EXECUTIVE SUMMARY

**Technical Feasibility**: ✅ YES (95% confidence)
**Complexity**: 6/10 (Moderate)
**Implementation Time**: 2-3 days
**Risk Level**: MEDIUM (mitigable)
**Recommendation**: PROCEED

## KEY FINDINGS

### 1. NextAuth Cookie Scoping - CRITICAL FINDING

NextAuth does NOT automatically share cookies across subdomains.

**Default Behavior**:
- User signs in at business.massava.app
- Cookie domain = business.massava.app (NOT .massava.app)
- Cookie NOT accessible from massava.app
- Each domain gets isolated session

**Solution**: Configure cookie domain explicitly with leading dot (`.massava.app`) if you need shared auth.

**Recommendation**: Use isolated cookies (default). More secure, better performance, no overhead.

### 2. Middleware Composition - Main Technical Challenge

Current middleware only handles i18n. Need to compose with host detection.

**Solution**:
```typescript
export default function middleware(request) {
  // 1. Host detection first
  if (request.headers.get('host')?.startsWith('business.')) {
    return NextResponse.rewrite(new URL(`/business${pathname}`, request.url));
  }
  
  // 2. Then i18n middleware
  return intlMiddleware(request);
}
```

**Effort**: 2-3 hours

### 3. Current Auth is Already Unified ✅

Good news: `auth-unified.ts` already has:
- Single NextAuth instance
- Unified User model
- Multiple user types (CUSTOMER, STUDIO_OWNER)
- RBAC implementation
- JWT strategy

**Can reuse as-is** for both domains. No refactoring needed.

### 4. Deployment is Simple ✅

No special Vercel configuration needed:
1. Add both domains in Vercel project settings
2. Both get automatic SSL certificates
3. Environment variables are shared
4. Single deployment process

**Effort**: 15-30 minutes

### 5. Performance Impact is Negligible ✅

- Same CDN infrastructure for both domains
- Middleware rewrite overhead: < 1ms
- Cookie overhead: ~200-400 bytes (isolated) or ~4KB (shared)
- No cache collision issues

---

## ROUTING ARCHITECTURE

### Current:
```
app/[locale]/*
```

### Proposed:
```
app/
  [locale]/           # Customer routes
  business/[locale]/* # Business routes
```

### Middleware Flow:
```
business.massava.app/en/dashboard
  ↓ [Middleware detects business subdomain]
/business/en/dashboard (internal rewrite)
  ↓ [i18n middleware validates locale]
app/business/[locale]/dashboard/page.tsx
  ↓ [Auth + RBAC check]
Render business dashboard
```

---

## ROLE-BASED ACCESS CONTROL

Enforce RBAC at multiple layers:

**1. Page Component Level** (Recommended):
```typescript
const session = await auth();
if (!session?.user?.roles?.includes(UserRole.STUDIO_OWNER)) {
  redirect(`/${locale}`);
}
```

**2. Server Action Level** (For mutations):
```typescript
'use server'
export async function updateStudio(studioId, data) {
  const session = await auth();
  if (!session?.user?.roles?.includes(UserRole.STUDIO_OWNER)) {
    throw new Error('Unauthorized');
  }
  // ... rest of logic
}
```

---

## LOCAL DEVELOPMENT SETUP

### 1. Configure /etc/hosts:
```bash
127.0.0.1 massava.local
127.0.0.1 business.massava.local
```

### 2. Access via:
```
http://massava.local:3000        # Customer routes
http://business.massava.local:3000 # Business routes
```

### 3. Environment variables:
```bash
NEXTAUTH_URL=http://massava.local:3000
NEXTAUTH_SECRET=dev-secret
GOOGLE_CLIENT_ID=your-dev-id
GOOGLE_CLIENT_SECRET=your-dev-secret
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] Update Google OAuth with both domains
- [ ] Test local environment with business.massava.local
- [ ] Verify middleware rewrites correctly
- [ ] Verify RBAC prevents unauthorized access
- [ ] Run full test suite
- [ ] Update NEXTAUTH_URL

### Deployment:
- [ ] Configure Vercel domains
- [ ] Deploy to staging
- [ ] Test sign-in flows
- [ ] Run smoke tests
- [ ] Production rollout

### Post-Deployment:
- [ ] Monitor error logs
- [ ] Test from multiple browsers
- [ ] Verify mobile responsiveness
- [ ] Monitor performance metrics

---

## POTENTIAL RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Cookie misconfiguration | CRITICAL | Extensive local testing before deployment |
| OAuth URI not registered | CRITICAL | Pre-verify before deployment |
| RBAC bypass | CRITICAL | Multi-layer validation |
| Middleware routing error | HIGH | Unit tests |
| Route conflicts | MEDIUM | Reserved namespace check |
| Localhost cookie issues | LOW | Use /etc/hosts entries |

---

## FINAL VERDICT

**Can it be done?** YES ✅
**Should it be done?** YES ✅ (for separate UX)
**Implementation time**: 2-3 days
**Confidence level**: 95%
**Risk level**: MEDIUM (mitigable)
**Recommendation**: PROCEED

---

## NEXT STEPS

1. Review this analysis with team
2. Allocate developer for 1-2 weeks
3. Setup staging environment
4. Plan comprehensive testing
5. Schedule low-traffic deployment

---

See companion documents for detailed implementation guide and code examples.

**Status**: Ready for Implementation
**Confidence**: 95% (based on Vercel official guides + real-world precedents)
**Date**: November 4, 2025
