# Phase 3: Unified User Model + RBAC - Implementation Guide

**Status:** ✅ Implementation Complete - Migration Pending
**Date:** 2025-10-27
**Branch:** feature/auth-rbac-security-overhaul

---

## Overview

Phase 3 implements a unified User model with Role-Based Access Control (RBAC), replacing the separate `StudioOwner` and `Customer` tables. This enables:

- Single user can be both customer AND studio owner
- Magic link passwordless authentication
- Granular permission system
- Multi-studio ownership
- Comprehensive audit logging

## What Was Implemented

### 1. Database Schema ✅

**Location:** `/prisma/schema.prisma`

**New Models:**
- `User` - Unified user model (replaces StudioOwner + Customer)
- `UserRole` enum - SUPER_ADMIN, STUDIO_OWNER, CUSTOMER, GUEST
- `UserRoleAssignment` - Multiple roles per user
- `StudioOwnership` - Many-to-many studio ownership
- `MagicLinkToken` - Passwordless authentication tokens
- `NewBooking` - Bookings linked to User (not Customer)
- `NewAccount` - OAuth accounts for User
- `NewSession` - Sessions for User
- `AuditLog` - GDPR-compliant audit trail

**Old Models Kept:**
- `StudioOwner`, `Customer`, `Booking`, `Account`, `Session`
- These will be dropped AFTER successful migration

### 2. Authorization System ✅

**Location:** `/lib/auth/`

**Files:**
- `rbac.ts` - Permission definitions and role hierarchy
- `permissions.ts` - Runtime permission checks
- `adapter.ts` - Custom Prisma adapter for NextAuth

**Key Functions:**
```typescript
// Check permission
await checkPermission('studio:create')

// Require permission (throws if missing)
await requirePermission('booking:view_all')

// Check studio access
await checkStudioAccess(studioId)

// Get current user with roles
const user = await getCurrentUser()
```

### 3. Audit Logging ✅

**Location:** `/lib/audit.ts`

**Features:**
- IP anonymization (GDPR Art. 32)
- User action tracking
- Resource change tracking
- GDPR data export support
- 3-year retention policy

**Usage:**
```typescript
await createAuditLog({
  userId: user.id,
  action: 'BOOKING_CREATED',
  resource: 'booking',
  resourceId: booking.id,
  metadata: { studioId, hasHealthData: true },
  request,
})
```

### 4. Magic Link Authentication ✅

**Location:** `/lib/magic-link.ts` + `/app/api/auth/magic-link/`

**Endpoints:**
- `POST /api/auth/magic-link/request` - Generate magic link
- `POST /api/auth/magic-link/verify` - Verify and sign in
- `GET /api/auth/magic-link/verify?token=xxx` - Email click handler

**Security:**
- Cryptographically secure tokens (32 bytes)
- 15-minute expiration
- One-time use enforcement
- Email verification on first use

### 5. Unified Auth Configuration ✅

**Location:** `/auth-unified.ts`

**Features:**
- Unified credentials provider (no separate customer/owner)
- Magic link provider
- Google OAuth (maintained)
- Role-based JWT callbacks
- Auto-upgrade OAuth users to STUDIO_OWNER if they own studios
- Account suspension checks

**Note:** `auth.ts` kept for backwards compatibility during migration

### 6. Updated API Routes ✅

**Location:** `/app/[locale]/api/*-unified/`

**New Routes:**
- `bookings-unified/route.ts` - Automatic user creation for guests
- `studios-unified/route.ts` - Ownership management
- `user/studios-unified/route.ts` - Owned studios listing
- `auth/register-unified/route.ts` - Role-based registration

**Key Features:**
- RBAC permission checks on all routes
- Audit logging for mutations
- Magic link generation for guest bookings
- Passwordless account creation
- Role-based data filtering

### 7. Data Migration Script ✅

**Location:** `/scripts/migrate-to-unified-user.ts`

**What It Does:**
1. Migrate StudioOwner → User (STUDIO_OWNER role)
2. Migrate Customer → User (CUSTOMER role)
3. Create StudioOwnership records
4. Migrate OAuth accounts and sessions
5. Migrate Bookings to NewBooking
6. Handle duplicate emails (users who are both)
7. Create passwordless users for orphaned bookings
8. Comprehensive verification checks
9. Transactional with rollback on error

**Usage:**
```bash
# DO NOT RUN YET - requires Prisma migration first
npx ts-node scripts/migrate-to-unified-user.ts
```

---

## Migration Steps (DO NOT RUN YET)

### Prerequisites

1. ✅ All code implemented (Phase 3)
2. ⏳ Database backup created
3. ⏳ Staging environment tested
4. ⏳ Team notified of maintenance window

### Step 1: Create Prisma Migration

```bash
# Generate migration for new models
npx prisma migrate dev --name add-unified-user-model

# This will:
# - Create User, UserRoleAssignment, StudioOwnership, etc.
# - Keep old tables (StudioOwner, Customer, etc.)
```

### Step 2: Deploy Schema Changes

```bash
# Deploy to database
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Step 3: Run Data Migration

```bash
# Migrate data from old tables to new tables
npx ts-node scripts/migrate-to-unified-user.ts
```

**Expected Output:**
```
✅ Migration completed successfully!

📊 Final Statistics:
   Studio Owners migrated: 42
   Customers migrated: 158
   Studio ownerships created: 47
   Bookings migrated: 312
```

### Step 4: Switch to Unified Auth

```bash
# 1. Update import in app/api/auth/[...nextauth]/route.ts
# OLD: import { handlers } from '@/auth'
# NEW: import { handlers } from '@/auth-unified'

# 2. Update all API routes to use -unified versions
# - bookings/route.ts → bookings-unified/route.ts
# - studios/route.ts → studios-unified/route.ts
# - etc.

# 3. Update frontend components to use unified auth
```

### Step 5: Test Thoroughly

**Test Cases:**
- [ ] Google OAuth login (studio owner)
- [ ] Password login (studio owner)
- [ ] Password login (customer)
- [ ] Guest booking (creates passwordless user)
- [ ] Magic link login
- [ ] Studio creation (creates ownership)
- [ ] Booking creation (all user types)
- [ ] Role-based access control
- [ ] Audit log creation
- [ ] Data export (GDPR)

### Step 6: Remove Old Tables

**ONLY after 2 weeks of successful testing:**

```prisma
// Remove from schema.prisma:
model StudioOwner { ... }
model Customer { ... }
model Booking { ... }
model Account { ... }
model Session { ... }
```

```bash
# Generate migration
npx prisma migrate dev --name remove-old-user-tables

# Deploy
npx prisma migrate deploy
```

---

## Permission Matrix

| Permission | SUPER_ADMIN | STUDIO_OWNER | CUSTOMER | GUEST |
|------------|-------------|--------------|----------|-------|
| `platform:view_all_studios` | ✅ | ❌ | ❌ | ❌ |
| `platform:suspend_studio` | ✅ | ❌ | ❌ | ❌ |
| `studio:create` | ✅ | ✅ | ❌ | ❌ |
| `studio:edit_own` | ✅ | ✅ | ❌ | ❌ |
| `studio:view_public` | ✅ | ✅ | ✅ | ✅ |
| `booking:view_all` | ✅ | ❌ | ❌ | ❌ |
| `booking:view_studio` | ✅ | ✅ (own) | ❌ | ❌ |
| `booking:create` | ✅ | ✅ | ✅ | ❌ |
| `booking:view_own` | ✅ | ✅ | ✅ | ❌ |
| `booking:confirm` | ✅ | ✅ (own) | ❌ | ❌ |
| `user:export_own_data` | ✅ | ✅ | ✅ | ❌ |

---

## API Route Changes

### Before (Separate Tables)

```typescript
// Old: Separate customer and owner auth
const studioOwner = await prisma.studioOwner.findUnique(...)
const customer = await prisma.customer.findUnique(...)

// Old: Studios owned directly
const studios = await prisma.studio.findMany({
  where: { ownerId: user.id }
})

// Old: Bookings link to Customer table
const booking = await prisma.booking.create({
  data: { customerId: customer.id }
})
```

### After (Unified User Model)

```typescript
// New: Unified user lookup
const user = await prisma.user.findUnique({
  where: { email },
  include: { roles: true }
})

// New: Studios via ownership relation
const ownerships = await prisma.studioOwnership.findMany({
  where: { userId: user.id },
  include: { studio: true }
})

// New: Bookings link to User table
const booking = await prisma.newBooking.create({
  data: { customerId: user.id }
})

// New: Permission checks
await requirePermission('booking:create')
await requireStudioAccess(studioId)
```

---

## Backwards Compatibility

**During Migration:**
- Old routes (`/api/bookings`) still work
- New routes (`/api/bookings-unified`) available
- Old auth.ts still functional
- New auth-unified.ts ready to switch

**After Migration:**
- Redirect old routes to new routes
- Remove old routes after 1 week
- Switch to auth-unified.ts
- Remove auth.ts after testing

---

## Testing Checklist

### Unit Tests
- [ ] RBAC permission checks
- [ ] Magic link generation/verification
- [ ] Audit log creation
- [ ] User model validation

### Integration Tests
- [ ] User registration (all roles)
- [ ] Magic link flow
- [ ] OAuth flow (Google)
- [ ] Booking creation (guest + authenticated)
- [ ] Studio ownership assignment

### E2E Tests
- [ ] Guest booking → passwordless account → magic link
- [ ] Studio owner registration → studio creation → booking management
- [ ] Customer registration → booking → cancellation
- [ ] Role-based dashboard access

---

## Rollback Plan

**If migration fails:**

1. **Immediate:** Stop application
2. **Database:** Restore from backup
3. **Code:** Revert to previous commit
4. **Users:** Old StudioOwner/Customer tables still intact
5. **Downtime:** ~15-30 minutes expected

**Rollback Command:**
```bash
# Restore database backup
pg_restore -d massava_production backup.sql

# Revert code
git revert HEAD~7  # Revert last 7 commits

# Redeploy
npm run build && npm run start
```

---

## GDPR Compliance

**Audit Logging:**
- All user actions logged (BOOKING_CREATED, STUDIO_UPDATED, etc.)
- IP addresses anonymized (last octet zeroed)
- 3-year retention policy
- Exportable for data subject requests

**Data Subject Rights:**
- Art. 15 (Right to Access): `GET /api/user/export`
- Art. 17 (Right to Erasure): `DELETE /api/user/delete`
- Art. 9 (Health Data): Explicit consent checkbox for booking messages

**Security:**
- Passwords hashed with bcrypt (12 rounds)
- Magic links expire in 15 minutes
- One-time use enforcement
- Session timeout: 30 days

---

## Performance Considerations

**Database:**
- Indexes on email, role, studioId
- Efficient joins via relations
- N+1 query prevention with `include`

**Caching:**
- User sessions cached in JWT
- Role assignments fetched once per session
- Studio ownerships cached client-side

**Scaling:**
- User table partitionable by primaryRole
- Audit logs can be moved to separate DB
- Magic link tokens can use Redis

---

## Next Steps (Post-Migration)

1. **Week 1:** Monitor error logs, performance metrics
2. **Week 2:** Collect user feedback, fix issues
3. **Week 3:** Drop old tables if stable
4. **Week 4:** Implement Phase 4 (Security hardening)

---

## Support

**Issues?**
- Check audit logs: `SELECT * FROM audit_logs WHERE action = 'USER_LOGIN' ORDER BY created_at DESC LIMIT 50`
- Check migration script logs
- Contact: roman@rnlt.de

**Documentation:**
- STRATEGY.md - Overall strategy
- PHASE3-IMPLEMENTATION.md - This file
- /lib/auth/rbac.ts - Permission definitions
- /scripts/migrate-to-unified-user.ts - Migration logic

---

**Last Updated:** 2025-10-27
**Author:** Claude Code (Roman Reinelt / RNLT Labs)
