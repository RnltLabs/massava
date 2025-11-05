# Migration Rollback Test

**Migration**: `20251101211916_add_newbooking_foreign_keys`

## Rollback SQL (Manual)

If you need to manually rollback this migration, execute the following SQL:

```sql
-- Step 1: Drop the CASCADE foreign key constraint
ALTER TABLE "public"."new_bookings" DROP CONSTRAINT "new_bookings_customerId_fkey";

-- Step 2: Drop the serviceId index
DROP INDEX "public"."new_bookings_serviceId_idx";

-- Step 3: Re-add the foreign key with SET NULL behavior
ALTER TABLE "public"."new_bookings" ADD CONSTRAINT "new_bookings_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "public"."users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

## Automated Rollback (Prisma)

Prisma doesn't directly support migration rollback, but you can:

### Option 1: Mark Migration as Rolled Back

```bash
npx prisma migrate resolve --rolled-back 20251101211916_add_newbooking_foreign_keys
```

Then manually apply the rollback SQL above.

### Option 2: Reset to Previous Migration

**WARNING**: This will delete all data!

```bash
# Reset database to a specific migration
npx prisma migrate reset --to 20251101201942_add_studio_images

# Or reset completely and re-apply all migrations
npx prisma migrate reset
```

## Testing Rollback (Without Data Loss)

### 1. Create Test Database

```bash
# Create a separate test database
createdb massava_rollback_test

# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://user:password@localhost:5432/massava_rollback_test"

# Apply all migrations up to current
npx prisma migrate deploy
```

### 2. Apply Rollback SQL

```bash
psql massava_rollback_test -f rollback.sql
```

### 3. Verify Rollback

```sql
-- Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'new_bookings'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Expected: new_bookings_customerId_fkey with delete_rule = 'SET NULL'

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'new_bookings';

-- Expected: No index on serviceId
```

### 4. Cleanup Test Database

```bash
dropdb massava_rollback_test
unset DATABASE_URL
```

## Production Rollback Checklist

- [ ] Create database backup
- [ ] Test rollback SQL in staging environment
- [ ] Verify application still works after rollback
- [ ] Document reason for rollback
- [ ] Schedule maintenance window
- [ ] Apply rollback SQL
- [ ] Verify foreign key constraints
- [ ] Run smoke tests
- [ ] Monitor error logs

## Why You Might Need to Rollback

1. **Application Compatibility**: New code expecting CASCADE behavior not yet deployed
2. **Data Loss Concerns**: Cascade deletion removing more data than expected
3. **Performance Issues**: Foreign key constraint checks causing slowdowns
4. **Database Lock**: Migration causes long-running lock on production

## Post-Rollback Actions

1. **Update Prisma Schema**: Revert changes in `schema.prisma`
2. **Regenerate Prisma Client**: Run `npx prisma generate`
3. **Mark Migration as Rolled Back**: Use `npx prisma migrate resolve --rolled-back`
4. **Document Incident**: Add notes to migration history
5. **Plan Re-Application**: Address issues and re-test before reapplying

## Contact

For rollback assistance, contact:
- DevOps Team
- Database Administrator
- Development Team Lead
