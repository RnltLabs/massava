# Master Orchestration Plan: Business Portal Separation + GDPR Compliance

**Project**: Massava Business Portal Separation
**Approach**: Plan A - Path-based routing (`/business/*`)
**Timeline**: 2-3 weeks
**Execution Mode**: Automated parallel agent orchestration
**Created**: 2025-11-04

---

## Executive Summary

This plan provides **100% automated implementation** of the business portal separation using path-based routing (`/business/*`) combined with critical GDPR compliance improvements.

**Key Outcomes**:
- ✅ GDPR Art. 9 compliant health data encryption (AES-256-GCM)
- ✅ Cookie consent implementation (ePrivacy Directive)
- ✅ Data retention automation with automated deletion
- ✅ AVV contracts signed (Hetzner, Stripe)
- ✅ Business portal at `/business/*` with RBAC middleware
- ✅ Complete separation of customer vs studio owner UX
- ✅ Karlsruhe test data with 3+ studios
- ✅ Test login credentials documented

**Human Intervention Required**: 2 actions (AVV signatures - detailed checklists provided)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Execution Instructions](#execution-instructions)
3. [Phase 1: GDPR Compliance (P1-P5)](#phase-1-gdpr-compliance)
4. [Phase 2: Business Portal Separation](#phase-2-business-portal-separation)
5. [Phase 3: Testing & Deployment](#phase-3-testing--deployment)
6. [Human Intervention Checklist](#human-intervention-checklist)
7. [Test Data Specification](#test-data-specification)
8. [Test Login Credentials](#test-login-credentials)
9. [DAG: Task Dependencies](#dag-task-dependencies)
10. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Environment Variables (Required)

Create `.env.local` with the following:

```bash
# Existing (already configured)
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..." # Your existing secret

# NEW: Required for this implementation
HEALTH_DATA_ENCRYPTION_KEY="<generate-with-openssl-rand-hex-32>"
DATA_RETENTION_ENABLED="true"
COOKIE_CONSENT_ENABLED="true"

# Google Analytics (optional - for cookie consent testing)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX" # Your GA4 ID

# Email (for data export/deletion notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@massava.app"
SMTP_PASSWORD="..."
```

### Generate Encryption Key

Run this command to generate secure encryption key:

```bash
node -e "console.log('HEALTH_DATA_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy output to `.env.local`.

### Database Backup

Before starting, backup your database:

```bash
npm run db:backup
# Creates backup at ./backups/massava_YYYYMMDD_HHMMSS.sql
```

---

## Execution Instructions

### Automated Execution (Recommended)

```bash
# 1. Checkout develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/business-portal-gdpr

# 3. Run automated orchestration
npm run orchestrate:implement

# 4. Watch progress
# The script will:
# - Execute all tasks in parallel (based on DAG)
# - Show real-time progress
# - Stop at human intervention points
# - Generate test data
# - Run all tests
# - Create commit with changes
```

### Manual Execution (For Debugging)

If you need to execute phases individually:

```bash
# Phase 1: GDPR Compliance
npm run implement:phase1

# Phase 2: Business Portal
npm run implement:phase2

# Phase 3: Testing
npm run implement:phase3
```

---

## Phase 1: GDPR Compliance

**Duration**: ~3-5 days
**Tasks**: 5 parallel tasks (except Task 1.5 depends on 1.1-1.4)
**Priority**: P1 (Critical)

### Task 1.1: Health Data Encryption (P1)

**Agent**: `security-auditor`
**Duration**: 1 day
**Depends On**: None
**Automated**: ✅ Yes

**Objective**: Encrypt all health data fields (booking messages with health info) using AES-256-GCM to comply with GDPR Art. 9.

**Implementation Steps**:

1. Create encryption utility: `/lib/encryption/health-data.ts`
2. Create Prisma field encryption middleware: `/lib/prisma/middleware/encrypt-health-data.ts`
3. Update Booking model with encrypted fields
4. Create migration script to encrypt existing data
5. Add audit logging for health data access

**Files Created**:

```
/lib/encryption/health-data.ts
/lib/encryption/health-data.test.ts
/lib/prisma/middleware/encrypt-health-data.ts
/prisma/migrations/YYYYMMDD_encrypt_health_data/migration.sql
/lib/audit/health-data-access-logger.ts
```

**Complete Code**: See Appendix A

**Verification**:

```bash
# Run tests
npm test -- lib/encryption/health-data.test.ts

# Verify encryption working
npm run test:integration -- booking-encryption
```

**Success Criteria**:
- ✅ All booking messages encrypted at rest
- ✅ Decryption only happens in memory
- ✅ Audit log records all access
- ✅ 100% test coverage
- ✅ No plaintext health data in database

---

### Task 1.2: AVV Contracts (P1)

**Agent**: `smart-orchestrator`
**Duration**: 1-2 hours (human action required)
**Depends On**: None
**Automated**: ⚠️ Partial (checklists generated, human signs contracts)

**Objective**: Sign Auftragsverarbeitungsverträge (Data Processing Agreements) with all third-party processors per GDPR Art. 28.

**Human Action Required**: ✋ YES

**Implementation Steps**:

1. Generate AVV checklists for Hetzner and Stripe
2. Human signs contracts (detailed instructions provided)
3. Document contract numbers and dates
4. Archive signed PDFs in `/docs/legal/avv-contracts/`

**Files Created**:

```
/docs/legal/avv-hetzner-checklist.md
/docs/legal/avv-stripe-checklist.md
/docs/legal/avv-registry.md
/docs/legal/avv-contracts/hetzner-avv-signed.pdf (human uploads)
/docs/legal/avv-contracts/stripe-dpa-signed.pdf (human uploads)
```

**Complete Checklists**: See Appendix B

**Verification**:

```bash
# Check if AVV files exist
ls -la docs/legal/avv-contracts/

# Expected:
# - hetzner-avv-signed.pdf
# - stripe-dpa-signed.pdf
# - avv-registry.md (updated with contract numbers)
```

**Success Criteria**:
- ✅ Hetzner AVV signed and archived
- ✅ Stripe DPA signed and archived
- ✅ Contract registry updated with numbers and dates
- ✅ Both contracts stored securely

---

### Task 1.3: Cookie Consent (P2)

**Agent**: `feature-builder`
**Duration**: 1 day
**Depends On**: None
**Automated**: ✅ Yes

**Objective**: Implement GDPR-compliant cookie consent banner with granular consent categories per ePrivacy Directive.

**Implementation Steps**:

1. Create cookie consent component: `/components/CookieConsent.tsx`
2. Create cookie consent context: `/contexts/CookieConsentContext.tsx`
3. Add consent management API routes
4. Integrate with Google Analytics consent mode
5. Add settings page at `/cookie-settings`

**Files Created**:

```
/components/CookieConsent.tsx
/components/CookieSettings.tsx
/contexts/CookieConsentContext.tsx
/app/api/cookie-consent/route.ts
/app/[locale]/cookie-settings/page.tsx
/lib/analytics/consent-aware-ga.ts
```

**Complete Code**: See Appendix C

**Verification**:

```bash
# Start dev server
npm run dev

# Open browser
# - Visit http://localhost:3000
# - Should see cookie consent banner
# - Test all 3 consent options (necessary, analytics, marketing)
# - Verify GA only fires when analytics consent given
```

**Success Criteria**:
- ✅ Cookie banner appears on first visit
- ✅ User can accept/reject granular categories
- ✅ Preferences persisted in localStorage
- ✅ GA respects consent (no tracking without consent)
- ✅ Settings page functional at `/cookie-settings`

---

### Task 1.4: Data Retention & Deletion (P3)

**Agent**: `db-optimizer`
**Duration**: 1.5 days
**Depends On**: Task 1.1 (health data encryption)
**Automated**: ✅ Yes

**Objective**: Implement automated data retention policies with scheduled deletion per GDPR Art. 5(1)(e) and Art. 17.

**Implementation Steps**:

1. Create retention policy engine: `/lib/data-retention/retention-policy.ts`
2. Create cron job for automated deletion: `/lib/cron/data-retention-job.ts`
3. Implement data export API (GDPR Art. 15)
4. Implement data deletion API (GDPR Art. 17)
5. Add deletion logging and notifications

**Retention Policies**:

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| User Account | 3 years after last activity | Legitimate interest |
| Health Data (Booking Messages) | 1 year OR consent revocation | Consent (Art. 9) |
| Bookings (Non-Health) | 3 years | Contract fulfillment |
| Invoices | 10 years | Legal obligation (tax law) |
| Audit Logs | 90 days | Accountability (Art. 5(2)) |

**Files Created**:

```
/lib/data-retention/retention-policy.ts
/lib/data-retention/retention-policy.test.ts
/lib/cron/data-retention-job.ts
/app/api/gdpr/export-data/route.ts
/app/api/gdpr/delete-data/route.ts
/lib/notifications/deletion-notifier.ts
```

**Complete Code**: See Appendix D

**Verification**:

```bash
# Run retention job manually
npm run data-retention:execute

# Check logs
tail -f logs/data-retention.log

# Test GDPR API
curl -X POST http://localhost:3000/api/gdpr/export-data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Success Criteria**:
- ✅ Cron job runs daily at 2 AM
- ✅ Data deletion follows retention policies
- ✅ Users notified before deletion (7 day warning)
- ✅ Export API returns complete user data (JSON + CSV)
- ✅ Deletion API deletes all user data irreversibly
- ✅ Audit trail for all deletions

---

### Task 1.5: Privacy Policy Update (P4)

**Agent**: `ux-designer`
**Duration**: 0.5 days
**Depends On**: Tasks 1.1, 1.2, 1.3, 1.4
**Automated**: ✅ Yes (generates updated policy)

**Objective**: Update privacy policy to reflect new GDPR measures (encryption, retention, cookie consent, AVV contracts).

**Implementation Steps**:

1. Generate updated privacy policy markdown
2. Add sections for health data encryption
3. Add sections for cookie consent
4. Add sections for data retention
5. Add AVV processor list
6. Create changelog showing what changed

**Files Created/Updated**:

```
/app/[locale]/datenschutz/page.tsx (updated)
/docs/legal/privacy-policy-v2.md
/docs/legal/privacy-policy-changelog.md
```

**Complete Policy**: See Appendix E

**Verification**:

```bash
# View privacy policy in browser
npm run dev
# Visit http://localhost:3000/datenschutz

# Expected sections:
# - Health data encryption (Art. 9)
# - Cookie consent management
# - Data retention policies
# - Third-party processors (AVV list)
# - User rights (export, deletion)
```

**Success Criteria**:
- ✅ Privacy policy updated with all GDPR measures
- ✅ Clear language (B2 German reading level)
- ✅ Links to cookie settings page
- ✅ AVV processor list included
- ✅ Contact info for data protection officer
- ✅ Changelog documents changes from v1

---

## Phase 2: Business Portal Separation

**Duration**: ~5-7 days
**Tasks**: 7 tasks (mixed dependencies)
**Priority**: P2 (High)

### Task 2.1: Middleware Protection

**Agent**: `feature-builder`
**Duration**: 0.5 days
**Depends On**: None
**Automated**: ✅ Yes

**Objective**: Create middleware to protect `/business/*` routes, restricting access to STUDIO_OWNER and STUDIO_STAFF roles only.

**Implementation Steps**:

1. Update `/middleware.ts` with business portal protection
2. Add role-based route guards
3. Redirect unauthorized users to customer portal
4. Add middleware tests

**Files Created/Updated**:

```
/middleware.ts (updated)
/lib/auth/business-portal-guard.ts
/lib/auth/business-portal-guard.test.ts
```

**Code**:

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isBusinessRoute = req.nextUrl.pathname.startsWith('/business')

    if (isBusinessRoute) {
      // Only STUDIO_OWNER and STUDIO_STAFF allowed
      if (token?.userType !== 'STUDIO_OWNER' && token?.userType !== 'STUDIO_STAFF') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/business/:path*',
    '/api/business/:path*',
  ]
}
```

**Verification**:

```bash
# Test as customer (should redirect)
# Test as studio owner (should allow)
npm test -- middleware.test.ts
```

**Success Criteria**:
- ✅ `/business/*` only accessible to studio owners/staff
- ✅ Customers redirected to `/unauthorized`
- ✅ API routes also protected (`/api/business/*`)
- ✅ Middleware tests passing

---

### Task 2.2: Business Portal File Structure

**Agent**: `feature-builder`
**Duration**: 1 day
**Depends On**: Task 2.1
**Automated**: ✅ Yes

**Objective**: Create new file structure for business portal routes at `/business/*`.

**Implementation Steps**:

1. Create business portal layout
2. Create business dashboard page
3. Create bookings management page
4. Create calendar/schedule page
5. Create settings page
6. Add navigation component

**Files Created**:

```
/app/[locale]/business/layout.tsx
/app/[locale]/business/page.tsx (dashboard)
/app/[locale]/business/bookings/page.tsx
/app/[locale]/business/calendar/page.tsx
/app/[locale]/business/settings/page.tsx
/components/business/BusinessNav.tsx
/components/business/BusinessSidebar.tsx
/components/business/DashboardStats.tsx
```

**Business Portal Structure**:

```
/business
├── / (Dashboard - stats, recent bookings)
├── /bookings (All bookings list with filters)
├── /calendar (Weekly/monthly schedule view)
├── /settings
│   ├── /profile (Studio info, opening hours)
│   ├── /services (Add/edit services)
│   └── /staff (Manage staff accounts)
└── /help (Documentation)
```

**Code**: See Appendix F

**Verification**:

```bash
# Start dev server
npm run dev

# Login as studio owner (credentials in section below)
# Visit http://localhost:3000/business
# Should see business dashboard
```

**Success Criteria**:
- ✅ Business portal has distinct layout from customer portal
- ✅ All pages created and functional
- ✅ Navigation works correctly
- ✅ Responsive design (mobile + desktop)

---

### Task 2.3: Move Existing Studio Owner Features

**Agent**: `feature-builder`
**Duration**: 1.5 days
**Depends On**: Task 2.2
**Automated**: ✅ Yes

**Objective**: Migrate existing studio owner features from root to `/business/*`.

**Features to Migrate**:

1. Studio registration form → `/business/onboarding`
2. Studio profile edit → `/business/settings/profile`
3. Service management → `/business/settings/services`
4. Opening hours → `/business/settings/opening-hours`

**Files Moved/Updated**:

```
# OLD LOCATIONS (delete after migration)
/app/[locale]/studio/register/page.tsx
/app/[locale]/studio/profile/page.tsx
/app/[locale]/studio/services/page.tsx

# NEW LOCATIONS
/app/[locale]/business/onboarding/page.tsx
/app/[locale]/business/settings/profile/page.tsx
/app/[locale]/business/settings/services/page.tsx
/app/[locale]/business/settings/opening-hours/page.tsx

# Components (update imports)
/components/StudioRegistrationForm.tsx → /components/business/OnboardingForm.tsx
```

**Migration Checklist**:

- [ ] Move studio registration to `/business/onboarding`
- [ ] Update all imports and links
- [ ] Update API route references
- [ ] Add redirects from old URLs to new URLs
- [ ] Test all forms still work
- [ ] Delete old files

**Code**: See Appendix G

**Verification**:

```bash
# Old URLs should redirect
curl -I http://localhost:3000/studio/register
# Should: 301 → /business/onboarding

# New URLs should work
curl -I http://localhost:3000/business/onboarding
# Should: 200 OK
```

**Success Criteria**:
- ✅ All studio owner features moved to `/business/*`
- ✅ Old URLs redirect to new URLs
- ✅ All forms functional
- ✅ No broken links
- ✅ Old files deleted

---

### Task 2.4: Business Portal API Routes

**Agent**: `feature-builder`
**Duration**: 1 day
**Depends On**: Task 2.1
**Automated**: ✅ Yes

**Objective**: Create protected API routes for business portal operations.

**API Endpoints to Create**:

```
POST   /api/business/bookings             # Get studio's bookings
PATCH  /api/business/bookings/[id]/status # Update booking status
POST   /api/business/services             # Add new service
PATCH  /api/business/services/[id]        # Update service
DELETE /api/business/services/[id]        # Delete service
GET    /api/business/stats                # Dashboard statistics
POST   /api/business/opening-hours        # Update opening hours
GET    /api/business/calendar             # Get calendar data
```

**Files Created**:

```
/app/api/business/bookings/route.ts
/app/api/business/bookings/[id]/status/route.ts
/app/api/business/services/route.ts
/app/api/business/services/[id]/route.ts
/app/api/business/stats/route.ts
/app/api/business/opening-hours/route.ts
/app/api/business/calendar/route.ts
```

**Code**: See Appendix H

**Verification**:

```bash
# Test API with studio owner token
npm run test:api -- business-portal

# Manual test
curl -X GET http://localhost:3000/api/business/stats \
  -H "Authorization: Bearer <studio-owner-token>"
```

**Success Criteria**:
- ✅ All API endpoints implemented
- ✅ Role-based access control enforced
- ✅ Zod validation on all inputs
- ✅ Error handling with proper status codes
- ✅ API tests passing (100% coverage)

---

### Task 2.5: Customer Portal Cleanup

**Agent**: `feature-builder`
**Duration**: 0.5 days
**Depends On**: Task 2.3
**Automated**: ✅ Yes

**Objective**: Ensure customer portal (`/`) is clean and has no studio owner features.

**Implementation Steps**:

1. Audit root routes for studio owner content
2. Remove any studio owner UI from customer pages
3. Update navigation (remove studio owner links)
4. Add "For Studios" link pointing to `/business`

**Files Updated**:

```
/components/Header.tsx (update navigation)
/app/[locale]/page.tsx (ensure no studio content)
/components/Footer.tsx (add /business link for studios)
```

**Navigation Changes**:

**Before** (mixed):
```
Header: [Search, My Bookings, Register Studio]
```

**After** (clean separation):
```
Header (Customer): [Search, My Bookings, For Studios →]
Header (Studio Owner at /business): [Dashboard, Bookings, Calendar, Settings]
```

**Code**: See Appendix I

**Verification**:

```bash
# Visit customer portal as customer
# Should NOT see any studio owner features
npm run dev
# Visit http://localhost:3000
# Inspect navigation and pages
```

**Success Criteria**:
- ✅ No studio owner features in customer portal
- ✅ Clean navigation for customers
- ✅ "For Studios" link in footer points to `/business`
- ✅ No mixed UI elements

---

### Task 2.6: Update NextAuth Configuration

**Agent**: `feature-builder`
**Duration**: 0.5 days
**Depends On**: Task 2.1
**Automated**: ✅ Yes

**Objective**: Update NextAuth callbacks to handle business portal redirects based on user role.

**Implementation Steps**:

1. Update `signIn` callback to redirect based on userType
2. Update `redirect` callback for role-based routing
3. Add separate sign-in pages for customers vs studios (optional)

**Files Updated**:

```
/lib/auth.ts (NextAuth configuration)
```

**Code**:

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... existing config
  callbacks: {
    async signIn({ user, account }) {
      // Allow sign in
      return true
    },

    async redirect({ url, baseUrl }) {
      // After sign in, redirect based on user type
      const session = await getServerSession(authOptions)
      const userType = session?.user?.userType

      if (userType === 'STUDIO_OWNER' || userType === 'STUDIO_STAFF') {
        // Redirect studio owners to business portal
        return `${baseUrl}/business`
      }

      // Redirect customers to home or callback URL
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return baseUrl
    },

    async session({ session, token }) {
      // Add userType to session
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.userType = token.userType as UserType
      }
      return session
    },

    async jwt({ token, user }) {
      // Add userType to token
      if (user) {
        token.userType = user.userType
      }
      return token
    },
  },
}
```

**Verification**:

```bash
# Test login as customer → should redirect to /
# Test login as studio owner → should redirect to /business
npm test -- auth-redirect.test.ts
```

**Success Criteria**:
- ✅ Customers redirect to `/` after login
- ✅ Studio owners redirect to `/business` after login
- ✅ Session includes userType
- ✅ Redirect tests passing

---

### Task 2.7: Documentation Update

**Agent**: `ux-designer`
**Duration**: 0.5 days
**Depends On**: Tasks 2.1-2.6
**Automated**: ✅ Yes

**Objective**: Document the new business portal architecture for developers and studio owners.

**Files Created**:

```
/docs/architecture/business-portal-architecture.md
/docs/guides/studio-owner-guide.md
/docs/api/business-portal-api.md
/README.md (update with new structure)
```

**Documentation Sections**:

1. Architecture overview (path-based separation)
2. Route protection strategy (middleware)
3. API documentation (business endpoints)
4. Studio owner user guide
5. Developer guide (adding new features)

**Code**: See Appendix J

**Verification**:

```bash
# Review documentation
cat docs/architecture/business-portal-architecture.md

# Ensure all links work
npm run docs:verify-links
```

**Success Criteria**:
- ✅ Architecture documented clearly
- ✅ Studio owner guide complete
- ✅ API documentation complete
- ✅ README updated
- ✅ All internal links working

---

## Phase 3: Testing & Deployment

**Duration**: ~2-3 days
**Tasks**: 5 tasks
**Priority**: P1 (Critical)

### Task 3.1: Create Karlsruhe Test Data

**Agent**: `general-purpose`
**Duration**: 0.5 days
**Depends On**: Phase 1 & 2 complete
**Automated**: ✅ Yes

**Objective**: Create comprehensive test data with 3+ Karlsruhe studios, services, time slots, and bookings.

**Test Studios**:

1. **Siam Spa Karlsruhe**
   - Address: Kaiserstraße 134, 76133 Karlsruhe
   - Services: Thai Massage, Oil Massage, Foot Reflexology
   - Owner: Maria Schmidt (maria.schmidt@siamspa-ka.de)

2. **Wellness Oase Durlach**
   - Address: Pfinztalstraße 67, 76227 Karlsruhe
   - Services: Hot Stone Massage, Aromatherapy, Deep Tissue
   - Owner: Thomas Weber (thomas.weber@wellness-oase.de)

3. **Thai Massage Mühlburg**
   - Address: Rheinstraße 45, 76185 Karlsruhe
   - Services: Traditional Thai, Couples Massage, Sports Massage
   - Owner: Sabine Fischer (sabine.fischer@thaimassage-ka.de)

**Files Created**:

```
/prisma/seed-test-karlsruhe.ts
/prisma/test-data/karlsruhe-studios.json
```

**Complete Code**: See Appendix K

**Verification**:

```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Seed test data
npm run db:seed:test

# Verify data
npm run db:studio
# Check Studios table - should see 3 Karlsruhe studios
```

**Success Criteria**:
- ✅ 3 studios in Karlsruhe created
- ✅ Each studio has 3-5 services
- ✅ Time slots created for next 30 days
- ✅ 5 test customers created
- ✅ 10+ test bookings created
- ✅ Some bookings have encrypted health data

---

### Task 3.2: Generate Test Login Credentials

**Agent**: `general-purpose`
**Duration**: 0.25 days
**Depends On**: Task 3.1
**Automated**: ✅ Yes

**Objective**: Generate and document test login credentials for all test accounts.

**Files Created**:

```
/.env.test (git-ignored)
/docs/testing/test-credentials.md
```

**Credentials Format**:

See [Test Login Credentials](#test-login-credentials) section below.

**Verification**:

```bash
# Check credentials file exists
cat .env.test

# Try logging in with each credential
npm run test:login -- --email maria.schmidt@siamspa-ka.de --password Test1234!
```

**Success Criteria**:
- ✅ All test accounts have documented credentials
- ✅ Credentials stored in `.env.test` (git-ignored)
- ✅ Credentials documented in `/docs/testing/test-credentials.md`
- ✅ All accounts can log in successfully

---

### Task 3.3: Integration Testing

**Agent**: `test-generator`
**Duration**: 1 day
**Depends On**: Tasks 3.1, 3.2
**Automated**: ✅ Yes

**Objective**: Create comprehensive integration tests for all new features.

**Test Suites to Create**:

1. Health data encryption tests
2. Cookie consent tests
3. Data retention tests
4. Business portal access control tests
5. Business portal API tests
6. GDPR API tests (export/delete)

**Files Created**:

```
/tests/integration/health-data-encryption.test.ts
/tests/integration/cookie-consent.test.ts
/tests/integration/data-retention.test.ts
/tests/integration/business-portal-auth.test.ts
/tests/integration/business-portal-api.test.ts
/tests/integration/gdpr-api.test.ts
```

**Code**: See Appendix L

**Verification**:

```bash
# Run all integration tests
npm run test:integration

# Expected: All tests passing
# Coverage should be 100% for new code
```

**Success Criteria**:
- ✅ All integration tests passing
- ✅ 100% coverage for new code
- ✅ Tests cover happy paths + error cases
- ✅ Tests verify GDPR compliance measures

---

### Task 3.4: E2E Testing

**Agent**: `test-generator`
**Duration**: 1 day
**Depends On**: Task 3.3
**Automated**: ✅ Yes

**Objective**: Create E2E tests for critical user flows.

**Test Flows**:

1. **Customer Booking Flow** (with cookie consent)
   - Visit homepage
   - Accept/reject cookies
   - Search for massage in Karlsruhe
   - Select studio and time slot
   - Complete booking (guest or logged in)
   - Verify confirmation email

2. **Studio Owner Onboarding Flow**
   - Register new studio account
   - Complete onboarding
   - Add services
   - Set opening hours
   - Receive first booking

3. **Business Portal Management Flow**
   - Login as studio owner
   - View dashboard
   - Check bookings list
   - Update booking status
   - View calendar

4. **GDPR Data Export Flow**
   - Login as customer
   - Request data export
   - Receive export (JSON + CSV)
   - Verify all data included

5. **GDPR Data Deletion Flow**
   - Login as customer
   - Request account deletion
   - Confirm deletion
   - Verify data deleted from database

**Files Created**:

```
/tests/e2e/customer-booking.spec.ts
/tests/e2e/studio-onboarding.spec.ts
/tests/e2e/business-portal.spec.ts
/tests/e2e/gdpr-export.spec.ts
/tests/e2e/gdpr-deletion.spec.ts
```

**Code**: See Appendix M

**Verification**:

```bash
# Run E2E tests with Playwright
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed
```

**Success Criteria**:
- ✅ All 5 E2E flows passing
- ✅ Tests run in CI/CD pipeline
- ✅ Screenshots captured on failure
- ✅ Tests verify GDPR compliance

---

### Task 3.5: Deployment

**Agent**: `deployment-validator`
**Duration**: 0.5 days
**Depends On**: Tasks 3.3, 3.4
**Automated**: ✅ Yes (except final production deploy)

**Objective**: Deploy to staging, validate, then deploy to production.

**Deployment Steps**:

1. Run deployment validator (checks tests, types, migrations)
2. Deploy to staging environment
3. Run smoke tests on staging
4. Get manual QA approval (human)
5. Deploy to production
6. Run smoke tests on production
7. Monitor for errors (24 hours)

**Files Used**:

```
/scripts/deploy-staging.sh
/scripts/deploy-production.sh
/scripts/smoke-test.sh
```

**Deployment Commands**:

```bash
# 1. Validate deployment readiness
npm run deploy:validate

# 2. Deploy to staging
npm run deploy:staging

# 3. Run smoke tests on staging
npm run smoke:staging

# 4. Deploy to production (requires approval)
npm run deploy:production

# 5. Run smoke tests on production
npm run smoke:production
```

**Smoke Tests**:

- [ ] Homepage loads
- [ ] Search works
- [ ] Booking flow completes
- [ ] Cookie consent appears
- [ ] Business portal accessible (studio owner)
- [ ] Business portal blocked (customer)
- [ ] GDPR export API works
- [ ] Health data encrypted in database

**Success Criteria**:
- ✅ Staging deployment successful
- ✅ All smoke tests passing on staging
- ✅ Production deployment successful
- ✅ All smoke tests passing on production
- ✅ No errors in production logs (24h monitoring)

---

## Human Intervention Checklist

**Total Human Actions Required**: 2

### Action 1: Sign Hetzner AVV

**When**: During Phase 1, Task 1.2
**Duration**: ~45 minutes
**Required**: ✅ YES (legal requirement)

**Step-by-Step Instructions**:

1. **Preparation (5 min)**
   - [ ] Go to https://robot.hetzner.com
   - [ ] Have your Hetzner account credentials ready
   - [ ] Have company info ready (name, address, contact)

2. **Navigate to AVV Section (5 min)**
   - [ ] Log in to Hetzner Robot
   - [ ] Click on left menu: "Ordered Products" → "Servers"
   - [ ] Select your server (e.g., `massava-production-1`)
   - [ ] Scroll down to "Contracts & Agreements" section
   - [ ] Click "Data Processing Agreement (AVV/DPA)"

3. **Fill Out AVV Form (20 min)**
   - [ ] Section 1: Controller Information
     - Company Name: `<Your Company Name>`
     - Address: `<Your Address>`
     - Contact Person: `<Your Name>`
     - Email: `<Your Email>`

   - [ ] Section 2: Processing Details
     - Nature of processing: `Web application hosting, database storage`
     - Purpose: `Providing booking platform for massage studios`
     - Categories of data: `Personal data (names, emails), health data (booking messages)`
     - Categories of data subjects: `Customers booking massage appointments`

   - [ ] Section 3: Technical & Organizational Measures
     - Review pre-filled measures by Hetzner
     - Confirm they meet your requirements
     - Add any additional measures you implement (e.g., "AES-256-GCM encryption for health data at-rest")

4. **Sign Contract (5 min)**
   - [ ] Review entire AVV document
   - [ ] Check "I agree to the terms" checkbox
   - [ ] Click "Sign Agreement" button
   - [ ] Wait for confirmation email from Hetzner

5. **Download & Archive (5 min)**
   - [ ] Download signed AVV PDF from Hetzner Robot
   - [ ] Save as: `docs/legal/avv-contracts/hetzner-avv-signed.pdf`
   - [ ] Update `/docs/legal/avv-registry.md`:
     ```markdown
     ## Hetzner AVV
     - Signed Date: YYYY-MM-DD
     - Contract Number: HET-AVV-XXXXXX
     - File: `/docs/legal/avv-contracts/hetzner-avv-signed.pdf`
     - Next Review: YYYY-MM-DD (1 year from signing)
     ```

6. **Verify in Git (5 min)**
   - [ ] Run: `git add docs/legal/avv-contracts/hetzner-avv-signed.pdf`
   - [ ] Run: `git add docs/legal/avv-registry.md`
   - [ ] Run: `git commit -m "docs(legal): add signed Hetzner AVV contract"`

**Troubleshooting**:

- **Can't find AVV section**: Contact Hetzner support at support@hetzner.com
- **Contract number not showing**: Wait 24h, then check email for confirmation
- **Need legal review**: Send AVV draft to legal counsel before signing

---

### Action 2: Sign Stripe DPA

**When**: During Phase 1, Task 1.2
**Duration**: ~30 minutes
**Required**: ✅ YES (legal requirement)

**Step-by-Step Instructions**:

1. **Preparation (5 min)**
   - [ ] Go to https://dashboard.stripe.com
   - [ ] Have your Stripe account credentials ready
   - [ ] Have company info ready

2. **Navigate to DPA Section (5 min)**
   - [ ] Log in to Stripe Dashboard
   - [ ] Click on your profile (top-right) → "Settings"
   - [ ] Left menu: "Business settings" → "Data processing"
   - [ ] Click "Data Processing Agreement"

3. **Review & Sign DPA (15 min)**
   - [ ] Read Stripe's standard DPA
   - [ ] Stripe's DPA is pre-written (you can't modify it)
   - [ ] Confirm your company information is correct
   - [ ] Click "Accept Agreement" button
   - [ ] Wait for confirmation email

4. **Download & Archive (5 min)**
   - [ ] Download signed DPA PDF from Stripe Dashboard
   - [ ] Save as: `docs/legal/avv-contracts/stripe-dpa-signed.pdf`
   - [ ] Update `/docs/legal/avv-registry.md`:
     ```markdown
     ## Stripe DPA
     - Signed Date: YYYY-MM-DD
     - Agreement ID: STR-DPA-XXXXXX
     - File: `/docs/legal/avv-contracts/stripe-dpa-signed.pdf`
     - Next Review: YYYY-MM-DD (1 year from signing)
     ```

5. **Verify in Git (same as Hetzner)**

**Troubleshooting**:

- **Can't find DPA**: Stripe sometimes changes UI - search settings for "DPA" or "Data Processing"
- **DPA already signed**: Check email for confirmation - may have been auto-signed when account created
- **Need EU-specific DPA**: Stripe's standard DPA covers EU/GDPR requirements

---

### Post-Human-Action Verification

After completing both AVV signings, run:

```bash
# Verify both files exist
ls -la docs/legal/avv-contracts/

# Expected output:
# hetzner-avv-signed.pdf
# stripe-dpa-signed.pdf
# avv-registry.md

# Verify registry updated
cat docs/legal/avv-registry.md

# Should show both contracts with:
# - Signed dates
# - Contract/Agreement numbers
# - File paths
```

If everything checks out, the orchestration script will automatically continue to next phase.

---

## Test Data Specification

### Studios

| ID | Name | City | Address | Owner Email | Services |
|----|------|------|---------|-------------|----------|
| 1 | Siam Spa Karlsruhe | Karlsruhe | Kaiserstraße 134, 76133 | maria.schmidt@siamspa-ka.de | Thai Massage (60€, 90min), Oil Massage (50€, 60min), Foot Reflexology (35€, 45min) |
| 2 | Wellness Oase Durlach | Karlsruhe | Pfinztalstraße 67, 76227 | thomas.weber@wellness-oase.de | Hot Stone (75€, 90min), Aromatherapy (60€, 75min), Deep Tissue (65€, 60min) |
| 3 | Thai Massage Mühlburg | Karlsruhe | Rheinstraße 45, 76185 | sabine.fischer@thaimassage-ka.de | Traditional Thai (70€, 120min), Couples Massage (140€, 90min), Sports Massage (55€, 60min) |

### Opening Hours (All Studios)

- Monday-Friday: 10:00-20:00
- Saturday: 10:00-18:00
- Sunday: Closed

### Time Slots

Each studio has available time slots for the next 30 days:
- 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00 (Mon-Fri)
- 10:00, 11:30, 13:00, 14:30, 16:00 (Sat)

### Test Customers

| Email | Name | Phone | Password |
|-------|------|-------|----------|
| anna.mueller@example.com | Anna Müller | +49 151 12345678 | Test1234! |
| max.schmidt@example.com | Max Schmidt | +49 152 23456789 | Test1234! |
| lisa.wagner@example.com | Lisa Wagner | +49 153 34567890 | Test1234! |
| tom.becker@example.com | Tom Becker | +49 154 45678901 | Test1234! |
| sarah.hoffmann@example.com | Sarah Hoffmann | +49 155 56789012 | Test1234! |

### Test Bookings

10 bookings will be created with:
- 5 confirmed bookings (status: CONFIRMED)
- 3 pending bookings (status: PENDING)
- 2 cancelled bookings (status: CANCELLED)
- Some with encrypted health data (e.g., "Ich habe Rückenschmerzen im unteren Bereich")

---

## Test Login Credentials

**⚠️ WARNING**: These are TEST credentials only. Never use in production.

### Studio Owners

| Studio | Email | Password | Role |
|--------|-------|----------|------|
| Siam Spa Karlsruhe | maria.schmidt@siamspa-ka.de | Test1234! | STUDIO_OWNER |
| Wellness Oase Durlach | thomas.weber@wellness-oase.de | Test1234! | STUDIO_OWNER |
| Thai Massage Mühlburg | sabine.fischer@thaimassage-ka.de | Test1234! | STUDIO_OWNER |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000/business (business portal dashboard)

### Customers

| Name | Email | Password | Role |
|------|-------|----------|------|
| Anna Müller | anna.mueller@example.com | Test1234! | CUSTOMER |
| Max Schmidt | max.schmidt@example.com | Test1234! | CUSTOMER |
| Lisa Wagner | lisa.wagner@example.com | Test1234! | CUSTOMER |
| Tom Becker | tom.becker@example.com | Test1234! | CUSTOMER |
| Sarah Hoffmann | sarah.hoffmann@example.com | Test1234! | CUSTOMER |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000 (customer portal homepage)

### Quick Test Commands

```bash
# Test studio owner login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=maria.schmidt@siamspa-ka.de&password=Test1234!"

# Test customer login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=anna.mueller@example.com&password=Test1234!"
```

### Accessing Business Portal

1. Open browser
2. Go to http://localhost:3000
3. Click "Sign In" (top-right)
4. Use studio owner credentials (e.g., maria.schmidt@siamspa-ka.de / Test1234!)
5. Should redirect to http://localhost:3000/business (dashboard)
6. Should see:
   - Dashboard with stats
   - Sidebar navigation
   - Recent bookings
   - Calendar link

### Verifying Access Control

**Test 1: Customer tries to access business portal** (should fail)
```bash
# 1. Login as customer
# 2. Navigate to http://localhost:3000/business
# 3. Expected: Redirect to /unauthorized
```

**Test 2: Studio owner tries to access business portal** (should work)
```bash
# 1. Login as studio owner
# 2. Navigate to http://localhost:3000/business
# 3. Expected: See business dashboard
```

---

## DAG: Task Dependencies

This Directed Acyclic Graph shows which tasks can run in parallel and which have dependencies.

```
Phase 1: GDPR Compliance
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [1.1 Health Data Encryption] ───┐                          │
│  [1.2 AVV Contracts (Human)]     │                          │
│  [1.3 Cookie Consent]            ├──→ [1.5 Privacy Policy]  │
│  [1.4 Data Retention] ───────────┘                          │
│        ↑                                                     │
│        └─── Depends on 1.1                                  │
└──────────────────────────────────────────────────────────────┘

Phase 2: Business Portal Separation
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [2.1 Middleware] ───┬──→ [2.2 File Structure] ──┐          │
│                      │                            │          │
│                      ├──→ [2.4 API Routes]        │          │
│                      │                            │          │
│                      └──→ [2.6 NextAuth Update]   │          │
│                                                   │          │
│  [2.3 Move Features] ←────────────────────────────┘          │
│        ↓                                                     │
│  [2.5 Customer Cleanup]                                      │
│        ↓                                                     │
│  [2.7 Documentation]                                         │
└──────────────────────────────────────────────────────────────┘

Phase 3: Testing & Deployment
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [3.1 Test Data] ──→ [3.2 Credentials] ──┐                  │
│                                          │                  │
│                                          ├──→ [3.3 Integration Tests]│
│                                          │                  │
│                                          └──→ [3.4 E2E Tests]│
│                                                   ↓          │
│                                          [3.5 Deployment]    │
└──────────────────────────────────────────────────────────────┘

Parallel Execution Groups:
┌─────────────────────────────────────────────┐
│ Group 1 (No dependencies - START HERE):    │
│  - 1.1, 1.2, 1.3 (can run simultaneously)  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 2 (After 1.1 completes):              │
│  - 1.4 (depends on 1.1)                     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 3 (After 1.1-1.4 complete):           │
│  - 1.5                                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 4 (After Phase 1):                    │
│  - 2.1 (start Phase 2)                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 5 (After 2.1):                        │
│  - 2.2, 2.4, 2.6 (parallel)                 │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 6 (After 2.2):                        │
│  - 2.3                                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 7 (After 2.3):                        │
│  - 2.5                                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 8 (After 2.1-2.6):                    │
│  - 2.7                                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 9 (After Phase 2):                    │
│  - 3.1 (start Phase 3)                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 10 (After 3.1):                       │
│  - 3.2                                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 11 (After 3.2):                       │
│  - 3.3, 3.4 (parallel)                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Group 12 (After 3.3, 3.4):                  │
│  - 3.5 (final deployment)                   │
└─────────────────────────────────────────────┘
```

### Optimal Execution Order

For maximum parallelization, the orchestration script executes tasks in this order:

1. **Wave 1** (Parallel): 1.1, 1.2, 1.3
2. **Wave 2** (After 1.1): 1.4
3. **Wave 3** (After 1.1-1.4): 1.5
4. **Wave 4**: 2.1
5. **Wave 5** (Parallel): 2.2, 2.4, 2.6
6. **Wave 6**: 2.3
7. **Wave 7**: 2.5
8. **Wave 8**: 2.7
9. **Wave 9**: 3.1
10. **Wave 10**: 3.2
11. **Wave 11** (Parallel): 3.3, 3.4
12. **Wave 12**: 3.5

**Total Estimated Duration**: 10-12 days (with parallelization)
**Sequential Duration**: 18-21 days (without parallelization)
**Time Saved**: ~8 days (42% faster)

---

## Rollback Procedures

### Rollback from Phase 3 (Deployment)

**Scenario**: Production deployment failed or critical bug discovered.

```bash
# 1. Quick rollback to previous deployment
npm run deploy:rollback

# 2. Verify rollback successful
npm run smoke:production

# 3. Investigate issue
git log --oneline -20
git diff HEAD~1

# 4. Fix and redeploy when ready
```

### Rollback from Phase 2 (Business Portal)

**Scenario**: Business portal implementation has issues, need to revert.

```bash
# 1. Checkout previous branch
git checkout develop
git pull

# 2. Delete feature branch
git branch -D feature/business-portal-gdpr

# 3. Database rollback (if migrations run)
npm run db:rollback -- --to-migration=YYYYMMDD_before_business_portal

# 4. Redeploy from develop
npm run deploy:staging
```

### Rollback from Phase 1 (GDPR)

**Scenario**: Encryption implementation breaks database access.

```bash
# 1. Emergency decrypt script (if needed)
npm run decrypt:emergency -- --backup-file=./backups/massava_YYYYMMDD.sql

# 2. Restore from database backup
npm run db:restore -- --file=./backups/massava_YYYYMMDD.sql

# 3. Remove encryption code
git revert <commit-hash-of-encryption>

# 4. Redeploy
npm run deploy:staging
```

### Database Backup Strategy

**Before each phase**, automated backups are created:

```bash
# Backup created at:
./backups/
  ├── phase1_before_YYYYMMDD_HHMMSS.sql
  ├── phase2_before_YYYYMMDD_HHMMSS.sql
  └── phase3_before_YYYYMMDD_HHMMSS.sql
```

**Retention**: 30 days (automated cleanup)

---

## Appendices

### Appendix A: Health Data Encryption Code

See file: `/lib/encryption/health-data.ts` (created by Task 1.1)

Full implementation available in orchestration script output.

### Appendix B: AVV Checklists

See files:
- `/docs/legal/avv-hetzner-checklist.md`
- `/docs/legal/avv-stripe-checklist.md`

Full checklists available in [Human Intervention Checklist](#human-intervention-checklist) section.

### Appendix C: Cookie Consent Code

See file: `/components/CookieConsent.tsx` (created by Task 1.3)

### Appendix D: Data Retention Code

See file: `/lib/data-retention/retention-policy.ts` (created by Task 1.4)

### Appendix E: Updated Privacy Policy

See file: `/docs/legal/privacy-policy-v2.md` (created by Task 1.5)

### Appendix F: Business Portal File Structure

See files in `/app/[locale]/business/*` (created by Task 2.2)

### Appendix G: Migration Code

See migration scripts in Task 2.3

### Appendix H: Business API Code

See files in `/app/api/business/*` (created by Task 2.4)

### Appendix I: Customer Portal Cleanup

See updated navigation components (Task 2.5)

### Appendix J: Documentation

See files in `/docs/architecture/` and `/docs/guides/` (created by Task 2.7)

### Appendix K: Test Data Seeder

See file: `/prisma/seed-test-karlsruhe.ts` (created by Task 3.1)

### Appendix L: Integration Tests

See files in `/tests/integration/*` (created by Task 3.3)

### Appendix M: E2E Tests

See files in `/tests/e2e/*` (created by Task 3.4)

---

## Support & Troubleshooting

### Common Issues

**Issue**: Encryption key not found
**Solution**: Ensure `HEALTH_DATA_ENCRYPTION_KEY` in `.env.local`. Regenerate if needed.

**Issue**: Cookie consent not appearing
**Solution**: Check `COOKIE_CONSENT_ENABLED=true` in `.env.local`. Clear browser cache.

**Issue**: Business portal redirects to /unauthorized
**Solution**: Verify user has `userType: STUDIO_OWNER` in database. Check middleware logs.

**Issue**: AVV contract upload failed
**Solution**: Ensure file is PDF, max 10MB. Check `/docs/legal/avv-contracts/` write permissions.

**Issue**: Test data seeding fails
**Solution**: Run `npm run db:reset` first to clear existing data. Check database connection.

### Getting Help

1. **Check logs**: `tail -f logs/app.log`
2. **Run diagnostics**: `npm run diagnose`
3. **Contact support**: Create issue in GitHub repo with logs and error messages

---

**END OF MASTER ORCHESTRATION PLAN**

---

**Next Steps**:

1. ✅ Read this plan thoroughly
2. ✅ Ensure `.env.local` configured with encryption key
3. ✅ Create database backup
4. ✅ Run: `npm run orchestrate:implement`
5. ✅ Wait for human intervention prompts (AVV signatures)
6. ✅ Monitor progress and logs
7. ✅ Celebrate successful deployment! 🎉
