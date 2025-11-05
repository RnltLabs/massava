# Database Optimization Guide

**Status**: Ready for Implementation
**Priority**: HIGH
**Estimated Impact**: 60-80% performance improvement
**Risk**: Low to Medium (depending on phase)

---

## Quick Links

- **Main Report**: [`/DATABASE_OPTIMIZATION_REPORT.md`](/DATABASE_OPTIMIZATION_REPORT.md) - Complete analysis and recommendations
- **Quick Wins**: [`QUICK_WINS.md`](QUICK_WINS.md) - Immediate optimizations (no schema changes)
- **Index Migration**: [`ADD_PERFORMANCE_INDEXES.sql`](ADD_PERFORMANCE_INDEXES.sql) - SQL for index creation

---

## Executive Summary

This optimization project addresses critical performance bottlenecks in the Massava booking platform database:

### Current Issues

1. **Dual User Model**: Customer and User tables coexist, causing FK conflicts
2. **N+1 Queries**: Missing eager loading in 3 critical paths
3. **Missing Indexes**: Filtered queries lack composite indexes
4. **Inefficient Aggregations**: Revenue calculations done in JavaScript
5. **Unoptimized Search**: Geolocation queries fetch all studios then filter

### Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Customer Dashboard | 2500ms | 80ms | **31x faster** |
| Revenue Calculation | 1500ms | 8ms | **188x faster** |
| Studio Search | 2000ms | 15ms | **133x faster** |
| Bookings List | 800ms | 25ms | **32x faster** |
| **Average** | **1700ms** | **32ms** | **53x faster** |
| **Data Transfer** | 17.5MB | 0.35MB | **98% reduction** |

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1) - LOW RISK

**Impact**: 20-30x performance improvement
**Downtime**: Zero
**Files to modify**: 4 files
**Estimated time**: 4-8 hours

**What to do**:
1. Optimize customer dashboard query (fix N+1)
2. Replace revenue calculation with SQL aggregation
3. Optimize bookings list (single query + pagination)
4. Add field selection to studio search

**See**: [`QUICK_WINS.md`](QUICK_WINS.md)

**Checklist**:
- [ ] Review optimized queries
- [ ] Test on staging with realistic data
- [ ] Deploy to production
- [ ] Monitor slow query log (should see 70% reduction)

---

### Phase 2: Index Optimization (Week 2) - LOW RISK

**Impact**: 100-250x faster on filtered queries
**Downtime**: Zero (using CONCURRENTLY)
**Estimated time**: 5-15 minutes execution + 2 hours testing

**What to do**:
1. Run index creation SQL
2. Update query planner statistics
3. Verify query plans improved

**See**: [`ADD_PERFORMANCE_INDEXES.sql`](ADD_PERFORMANCE_INDEXES.sql)

**Checklist**:
- [ ] Backup database
- [ ] Run SQL during off-peak hours
- [ ] Verify all indexes created
- [ ] Run ANALYZE on tables
- [ ] Test query performance (EXPLAIN ANALYZE)
- [ ] Monitor index usage for 1 week

---

### Phase 3: User Model Migration (Weeks 4-6) - MEDIUM RISK

**Impact**: Eliminates FK conflicts, enables RBAC
**Downtime**: Zero (dual-write strategy)
**Estimated time**: 2-3 weeks

**What to do**:
1. Deploy dual-write code (write to both Customer and User)
2. Backfill historical data (run migration script)
3. Switch reads to User model
4. Drop old Customer/StudioOwner tables

**See**: `/PHASE3-IMPLEMENTATION.md` and `/scripts/migrate-to-unified-user.ts`

**Checklist**:
- [ ] Review Phase 3 implementation guide
- [ ] Deploy dual-write code
- [ ] Monitor for 1 week
- [ ] Create production backup
- [ ] Run migration script
- [ ] Verify data integrity
- [ ] Switch reads to new model
- [ ] Monitor for 1 week
- [ ] Drop old tables

---

### Phase 4: PostGIS Implementation (Week 7) - LOW RISK

**Impact**: 133x faster geolocation search
**Downtime**: Minimal (extension + column addition)
**Estimated time**: 2-4 hours

**What to do**:
1. Install PostGIS extension
2. Add `location` geography column to studios
3. Create spatial index
4. Update search queries

**See**: Main report Section 4.3

**Checklist**:
- [ ] Test PostGIS in staging
- [ ] Backup production database
- [ ] Install extension
- [ ] Add geography column
- [ ] Backfill location data
- [ ] Create spatial index
- [ ] Update search API
- [ ] Load test (should handle 100x traffic)
- [ ] Deploy

---

## Risk Assessment

### Low Risk Optimizations (Phase 1-2)

✅ **Quick Wins** (Phase 1):
- Code-only changes
- No schema modifications
- Instant rollback (git revert)
- Zero downtime

✅ **Index Creation** (Phase 2):
- Read-only operation
- Uses CONCURRENTLY (no locks)
- Can be dropped if issues arise
- Zero downtime

### Medium Risk Optimizations (Phase 3)

⚠️ **User Model Migration**:
- Data migration involved
- Requires careful testing
- Dual-write period mitigates risk
- Rollback plan available

**Mitigation**:
- 2-week dual-write period
- Comprehensive data validation
- Incremental rollout (staging → production)
- Daily backups during migration

### Low Risk Advanced Features (Phase 4)

✅ **PostGIS**:
- Extension well-tested
- New column (old columns kept)
- Spatial queries optional
- Easy rollback

---

## Success Metrics

Track these metrics before and after each phase:

### Performance Metrics

```sql
-- Average query duration
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%bookings%'
  OR query LIKE '%studios%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Database Load

```sql
-- Connection pool usage
SELECT
  datname,
  numbackends as connections,
  xact_commit as commits,
  xact_rollback as rollbacks,
  tup_fetched as rows_fetched,
  tup_inserted + tup_updated + tup_deleted as rows_modified
FROM pg_stat_database
WHERE datname = 'massava';
```

### Index Effectiveness

```sql
-- Index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: Query still slow after optimization

**Diagnosis**:
```sql
-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE studioId = 'some-id'
  AND status = 'CONFIRMED'
  AND createdAt >= '2025-01-01';

-- Look for "Index Scan" (good) vs "Seq Scan" (bad)
```

**Solutions**:
1. Run `ANALYZE bookings;` to update statistics
2. Verify index exists: `\d bookings` (in psql)
3. Check if query conditions match index (left-to-right)
4. Consider index-only scan (add covering index)

---

### Issue: Index creation takes too long

**Diagnosis**:
```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('bookings'));

-- Check ongoing index creation
SELECT
  datname,
  pid,
  state,
  query,
  NOW() - query_start AS duration
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX%';
```

**Solutions**:
1. Use `CONCURRENTLY` (always)
2. Run during off-peak hours
3. Increase `maintenance_work_mem` temporarily:
   ```sql
   SET maintenance_work_mem = '2GB';
   CREATE INDEX CONCURRENTLY ...
   RESET maintenance_work_mem;
   ```

---

### Issue: Dual-write causes data inconsistency

**Diagnosis**:
```sql
-- Check if counts match
SELECT
  (SELECT COUNT(*) FROM bookings) as old_count,
  (SELECT COUNT(*) FROM new_bookings) as new_count;

-- Find orphaned records
SELECT * FROM new_bookings
WHERE customerId IS NOT NULL
  AND customerId NOT IN (SELECT id FROM users);
```

**Solutions**:
1. Run data integrity checks daily
2. Use database transactions for dual-write
3. Set up alerts for count mismatches
4. Rollback to single-write if issues persist

---

### Issue: Migration script fails

**Diagnosis**:
Check logs for:
- Unique constraint violations (duplicate emails)
- Foreign key violations (orphaned records)
- Out of memory errors

**Solutions**:
1. Restore from backup
2. Fix data issues (script has validation steps)
3. Run in batches (modify script to process 1000 records at a time)
4. Increase database memory temporarily

---

## Monitoring Setup

### Enable Slow Query Logging

**PostgreSQL config** (`postgresql.conf`):
```ini
# Log queries slower than 100ms
log_min_duration_statement = 100

# Log query plans for slow queries
auto_explain.log_min_duration = 100
auto_explain.log_analyze = on
auto_explain.log_buffers = on
```

**Restart PostgreSQL** after config change:
```bash
sudo systemctl restart postgresql
```

### Prisma Client Logging

**File**: `/lib/prisma.ts`

```typescript
import { PrismaClient } from '@/app/generated/prisma'

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
})

// Log slow queries (> 100ms)
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`Slow query (${e.duration}ms):`, {
      query: e.query,
      params: e.params,
      timestamp: new Date().toISOString(),
    })
  }
})
```

### Application Metrics

Track in production:
- P50, P95, P99 response times
- Database connection pool usage
- Cache hit rate (if Redis implemented)
- Error rate by endpoint

**Recommended tools**:
- **Monitoring**: Sentry, Datadog, New Relic
- **Database**: pganalyze, pgHero
- **Profiling**: @prisma/instrumentation

---

## Rollback Procedures

### Phase 1 (Quick Wins)

**Rollback**: `git revert <commit-hash>`

No data loss, instant rollback.

---

### Phase 2 (Indexes)

**Rollback**: Drop indexes

```sql
-- Drop specific index
DROP INDEX CONCURRENTLY IF EXISTS "bookings_studioId_status_createdAt_idx";

-- Or drop all new indexes (see ADD_PERFORMANCE_INDEXES.sql section 13)
```

No data loss, minimal impact.

---

### Phase 3 (User Migration)

**Rollback Plan**:

1. **If dual-write fails**: Revert to single write
   ```bash
   git revert <dual-write-commit>
   npm run deploy
   ```

2. **If backfill fails**: Restore from backup
   ```bash
   pg_restore -d massava_production backup-YYYYMMDD.sql
   ```

3. **If read switch fails**: Switch back to old model
   ```bash
   git revert <read-switch-commit>
   npm run deploy
   ```

**Keep old tables for 30 days** after successful migration.

---

### Phase 4 (PostGIS)

**Rollback**: Revert search queries, keep PostGIS

```bash
# Revert API changes
git revert <postgis-commit>

# Keep extension and column (no harm)
# They'll be useful for future geolocation features
```

---

## Support Resources

### Documentation

- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Manual**: https://www.postgresql.org/docs/current/
- **PostGIS Docs**: https://postgis.net/documentation/

### Internal Resources

- Phase 3 Guide: `/PHASE3-IMPLEMENTATION.md`
- Migration Script: `/scripts/migrate-to-unified-user.ts`
- Schema: `/prisma/schema.prisma`

### Getting Help

1. Review troubleshooting section above
2. Check PostgreSQL logs: `/var/log/postgresql/postgresql.log`
3. Check application logs: `heroku logs --tail` (or similar)
4. Run diagnostic queries (see Success Metrics section)
5. Contact team lead if issues persist

---

## Timeline Summary

| Week | Phase | Risk | Impact | Downtime |
|------|-------|------|--------|----------|
| 1 | Quick Wins (Code) | Low | 20-30x | Zero |
| 2 | Add Indexes | Low | 100-250x | Zero |
| 3 | Testing & Monitoring | - | - | - |
| 4-6 | User Migration | Medium | Enables RBAC | Zero |
| 7 | PostGIS | Low | 133x search | Minimal |
| 8 | Cleanup & Verification | Low | - | Zero |

**Total Duration**: 8 weeks
**Total Downtime**: Zero (with careful execution)
**Expected Performance Improvement**: 60-80% overall

---

## Approval Checklist

Before starting implementation:

- [ ] **Technical Review**: Database team approved
- [ ] **Risk Assessment**: Rollback plans documented
- [ ] **Backup Strategy**: Daily backups configured
- [ ] **Monitoring**: Slow query logging enabled
- [ ] **Staging Environment**: All phases tested
- [ ] **Maintenance Window**: Scheduled for index creation
- [ ] **Team Notification**: All stakeholders informed
- [ ] **Go/No-Go Decision**: Final approval received

---

## Post-Implementation Review

After completion:

- [ ] Performance benchmarks collected
- [ ] Database load reduced (verify CPU/memory usage)
- [ ] User feedback positive (faster page loads)
- [ ] No increase in error rates
- [ ] Index usage verified (no unused indexes)
- [ ] Slow query log shows improvement
- [ ] Documentation updated
- [ ] Lessons learned documented

---

## Next Steps

1. **Read**: [`DATABASE_OPTIMIZATION_REPORT.md`](/DATABASE_OPTIMIZATION_REPORT.md)
2. **Start**: [`QUICK_WINS.md`](QUICK_WINS.md) (Phase 1)
3. **Deploy**: Test on staging first
4. **Monitor**: Watch metrics closely
5. **Iterate**: Proceed to next phase

---

**Created by**: Development Team
**Last Updated**: 2025-11-05
**Version**: 1.0
