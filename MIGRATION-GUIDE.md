# Phase 3 Migration Guide: Step-by-Step Instructions

**CRITICAL:** This is a major database migration. Follow these steps exactly.

---

## Pre-Migration Checklist

- [ ] Read STRATEGY.md Section 8.3 (Phase 3)
- [ ] Read PHASE3-IMPLEMENTATION.md
- [ ] All Phase 3 code committed to `feature/auth-rbac-security-overhaul`
- [ ] Database backup created
- [ ] Staging environment available
- [ ] Maintenance window scheduled (2-3 hours)
- [ ] Team notified
- [ ] Rollback plan reviewed

---

## Step 1: Database Backup (CRITICAL)

```bash
# Create backup with timestamp
BACKUP_FILE="massava_backup_$(date +%Y%m%d_%H%M%S).sql"

# PostgreSQL backup
pg_dump -h localhost -U massava_user -d massava_production > $BACKUP_FILE

# Verify backup
ls -lh $BACKUP_FILE

# Store backup securely
cp $BACKUP_FILE ~/backups/
```

**Verification:**
```bash
# Check backup size (should be > 1MB)
du -h $BACKUP_FILE

# Test restore on test database (IMPORTANT)
createdb massava_test_restore
pg_restore -d massava_test_restore $BACKUP_FILE
psql -d massava_test_restore -c "SELECT COUNT(*) FROM studio_owners;"
```

---

## Step 2: Generate Prisma Migration

```bash
# Switch to feature branch
git checkout feature/auth-rbac-security-overhaul

# Install dependencies
npm install

# Generate Prisma migration
npx prisma migrate dev --name add_unified_user_model

# This will:
# 1. Create new tables: users, user_role_assignments, studio_ownership, etc.
# 2. Keep old tables: studio_owners, customers, bookings, accounts, sessions
# 3. Create migration file in prisma/migrations/
```

**Expected Output:**
```
✔ Generated Prisma Client (v5.x.x)
✔ The following migration(s) have been created:
  migrations/
    └─ 20251027XXXXXX_add_unified_user_model/
       └─ migration.sql
```

---

## Step 3: Review Migration SQL

```bash
# Open migration file
cat prisma/migrations/*/add_unified_user_model/migration.sql

# Should contain:
# - CREATE TABLE "users" (...)
# - CREATE TABLE "user_role_assignments" (...)
# - CREATE TABLE "studio_ownership" (...)
# - CREATE TABLE "new_bookings" (...)
# - CREATE INDEX ... on "users"(email)
# - etc.
```

**Verify:**
- ✅ New tables created (not altered)
- ✅ Old tables NOT dropped
- ✅ Indexes created
- ✅ Foreign keys defined

---

## Step 4: Deploy Schema to Staging

```bash
# Set staging database URL
export DATABASE_URL="postgresql://user:pass@staging-db:5432/massava_staging"

# Deploy migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

**Expected Tables:**
```
users
user_role_assignments
studio_ownership
new_accounts
new_sessions
new_bookings
magic_link_tokens
audit_logs

(Old tables still present:)
studio_owners
customers
bookings
accounts
sessions
```

---

## Step 5: Run Data Migration (Staging)

```bash
# Run migration script
npx ts-node scripts/migrate-to-unified-user.ts
```

**Expected Output:**
```
🚀 Starting migration to unified User model...

📋 Step 1: Migrating StudioOwners to Users...
   Found 42 studio owners to migrate
   ✅ Migrated: owner1@example.com
   ✅ Migrated: owner2@example.com
   ...
   ✅ Step 1 complete: 42/42 migrated

📋 Step 2: Migrating Customers to Users...
   Found 158 customers to migrate
   ✅ Migrated: customer1@example.com
   ⚠️  User already exists: owner@example.com (adding CUSTOMER role)
   ...
   ✅ Step 2 complete: 158/158 migrated

📋 Step 3: Migrating Bookings to NewBooking...
   Found 312 bookings to migrate
   📦 Migrated 10 bookings...
   📦 Migrated 20 bookings...
   ...
   ✅ Step 3 complete: 312/312 migrated

🔍 Step 4: Running verification checks...
   Users created: 198
   Role assignments created: 200
   Studio ownerships created: 47
   New bookings created: 312
   ✅ All verification checks passed

✅ Migration completed successfully!
```

**If Errors Occur:**
- Transaction will rollback automatically
- Database remains unchanged
- Fix errors and retry

---

## Step 6: Verify Data Integrity

```bash
# Check user counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
# Should equal: studio_owners + customers (minus duplicates)

# Check role assignments
psql $DATABASE_URL -c "SELECT role, COUNT(*) FROM user_role_assignments GROUP BY role;"
# STUDIO_OWNER: ~42
# CUSTOMER: ~158

# Check studio ownerships
psql $DATABASE_URL -c "SELECT COUNT(*) FROM studio_ownership;"
# Should equal number of studios

# Check bookings migrated
psql $DATABASE_URL -c "SELECT COUNT(*) FROM new_bookings;"
# Should equal old bookings count

# Verify no orphaned bookings
psql $DATABASE_URL -c "
  SELECT COUNT(*)
  FROM new_bookings nb
  LEFT JOIN users u ON nb.customer_id = u.id
  WHERE u.id IS NULL;
"
# Should be 0
```

---

## Step 7: Test Unified Auth (Staging)

```bash
# Switch to unified auth
# Edit app/api/auth/[...nextauth]/route.ts
# Change: import { handlers } from '@/auth'
# To: import { handlers } from '@/auth-unified'

# Rebuild and deploy to staging
npm run build
npm run start

# Test scenarios:
# 1. Login with Google OAuth (studio owner)
# 2. Login with password (studio owner)
# 3. Login with password (customer)
# 4. Create guest booking (passwordless user)
# 5. Magic link login
```

**Test Checklist:**
- [ ] Google OAuth login works
- [ ] Password login works (studio owner)
- [ ] Password login works (customer)
- [ ] Guest booking creates passwordless user
- [ ] Magic link sent and works
- [ ] Studio creation creates ownership
- [ ] Booking shows in dashboard
- [ ] Role-based permissions work
- [ ] Audit logs created

---

## Step 8: Switch API Routes (Staging)

```bash
# Rename API routes to use unified versions
# bookings-unified → bookings
# studios-unified → studios
# etc.

# Option A: Rename files
mv app/[locale]/api/bookings/route.ts app/[locale]/api/bookings-old/route.ts
mv app/[locale]/api/bookings-unified/route.ts app/[locale]/api/bookings/route.ts

# Option B: Update imports in files
# Change: import from 'bookings-unified'
# To: import from 'bookings'

# Rebuild and deploy
npm run build
npm run start
```

---

## Step 9: Deploy to Production

**Prerequisites:**
- ✅ Staging tested for 24 hours
- ✅ No critical errors
- ✅ All features working
- ✅ Team approval

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@prod-db:5432/massava_production"

# Deploy schema migration
npx prisma migrate deploy

# Run data migration
npx ts-node scripts/migrate-to-unified-user.ts

# Deploy application
npm run build
npm run start
```

**Monitoring:**
- Check error logs: `tail -f logs/error.log`
- Monitor CPU/memory
- Check response times
- Monitor login success rate

---

## Step 10: Monitor (First 48 Hours)

**Metrics to Watch:**
- Login success rate (should be > 95%)
- API error rate (should be < 1%)
- Database query time (should be < 100ms)
- User registrations (should match baseline)
- Booking creation rate (should match baseline)

**Queries:**
```sql
-- Check recent logins
SELECT action, COUNT(*)
FROM audit_logs
WHERE action = 'USER_LOGIN'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY action;

-- Check errors
SELECT * FROM audit_logs
WHERE metadata->>'error' IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;

-- Check booking creation
SELECT COUNT(*)
FROM new_bookings
WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## Step 11: Drop Old Tables (After 2 Weeks)

**ONLY after 2 weeks of stable operation:**

```prisma
// Remove from prisma/schema.prisma:
model StudioOwner { ... }  // DELETE
model Customer { ... }     // DELETE
model Booking { ... }      // DELETE
model Account { ... }      // DELETE
model Session { ... }      // DELETE
```

```bash
# Generate migration
npx prisma migrate dev --name remove_old_user_tables

# Review SQL
cat prisma/migrations/*/remove_old_user_tables/migration.sql

# Deploy to production
npx prisma migrate deploy
```

**Final Verification:**
```bash
psql $DATABASE_URL -c "\dt"
# Should NOT show:
# - studio_owners
# - customers
# - bookings
# - accounts
# - sessions
```

---

## Rollback Procedure (If Needed)

### Immediate Rollback (During Migration)

```bash
# Stop application
pm2 stop massava

# Restore database
pg_restore -d massava_production $BACKUP_FILE

# Revert code
git revert HEAD~7

# Rebuild and restart
npm run build
npm run start
```

### Partial Rollback (After Migration)

```bash
# Keep new schema, revert application code
git revert HEAD~3

# Switch back to old auth
# Edit app/api/auth/[...nextauth]/route.ts
# Change: import { handlers } from '@/auth-unified'
# To: import { handlers } from '@/auth'

# Switch back to old API routes
mv app/[locale]/api/bookings/route.ts app/[locale]/api/bookings-new/route.ts
mv app/[locale]/api/bookings-old/route.ts app/[locale]/api/bookings/route.ts

# Rebuild
npm run build
npm run start
```

---

## Common Issues

### Issue: "Foreign key constraint violation"
**Cause:** Booking references non-existent user
**Fix:** Ensure all users migrated before bookings
```bash
npx ts-node scripts/migrate-to-unified-user.ts
```

### Issue: "Duplicate email" error during migration
**Expected:** Users who are both customer and studio owner
**Handled:** Script automatically adds CUSTOMER role to existing user

### Issue: Magic links not working
**Cause:** Email service not configured
**Fix:** Configure email service or test with development mode
```bash
NODE_ENV=development npm run start
# Magic link URLs logged to console
```

### Issue: OAuth login fails
**Cause:** Session adapter mismatch
**Fix:** Ensure using UnifiedUserAdapter in auth-unified.ts
```typescript
adapter: UnifiedUserAdapter(prisma)
```

---

## Success Criteria

- ✅ All users migrated (0 errors)
- ✅ All bookings migrated (0 orphans)
- ✅ All studio ownerships created
- ✅ Login success rate > 95%
- ✅ Booking creation rate matches baseline
- ✅ No critical errors for 48 hours
- ✅ RBAC permissions working correctly
- ✅ Audit logs capturing all actions

---

## Post-Migration Tasks

- [ ] Update documentation
- [ ] Train support team on new user model
- [ ] Update monitoring dashboards
- [ ] Review and optimize queries
- [ ] Plan Phase 4 (Security hardening)
- [ ] Archive old code (auth.ts, old routes)

---

## Questions?

**Contact:** roman@rnlt.de
**Documentation:** STRATEGY.md, PHASE3-IMPLEMENTATION.md
**Branch:** feature/auth-rbac-security-overhaul

---

**Last Updated:** 2025-10-27
**Version:** 1.0
