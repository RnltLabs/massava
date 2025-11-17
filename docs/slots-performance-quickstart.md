# Dynamic Slots Performance - Quick Start Guide

**Last Updated**: 2025-11-17

This is a quick reference for optimizing and monitoring the Dynamic Slots system. For full details, see `/docs/slots-performance-optimization.md`.

---

## Performance Targets

| Metric | Target | Good | Needs Work |
|--------|--------|------|------------|
| Database Query | < 50ms | < 100ms | > 100ms |
| Slot Calculation | < 100ms | < 200ms | > 200ms |
| API Response (E2E) | < 200ms | < 300ms | > 300ms |

---

## Quick Commands

### Run Performance Benchmark
```bash
npx tsx scripts/benchmark-slots.ts
```

### Run Performance Tests
```bash
npm test __tests__/lib/slots/performance.test.ts
```

### Check Database Indexes
```bash
# Connect to PostgreSQL
docker exec -it massava-postgres psql -U postgres -d massava

# List NewBooking indexes
\d+ new_bookings

# Test query performance
EXPLAIN ANALYZE
SELECT "preferredTime"
FROM "new_bookings"
WHERE "studioId" = 'YOUR_STUDIO_ID'
  AND "preferredDate" = '2025-11-18'
  AND "status" IN ('CONFIRMED', 'PENDING');
```

### Monitor in Production
```bash
# Check GlitchTip dashboard
open https://glitchtip.rnltlabs.de

# View slow query alerts
# Navigate to: Performance > Transactions > slot.calculation
```

---

## Database Indexes (Already Optimized)

Current composite indexes on `NewBooking`:

```sql
-- OPTIMAL for slot queries
CREATE INDEX "NewBooking_studioId_preferredDate_preferredTime_status_idx"
ON "new_bookings"("studioId", "preferredDate", "preferredTime", "status");

-- Additional supporting indexes
CREATE INDEX "NewBooking_studioId_idx" ON "new_bookings"("studioId");
CREATE INDEX "NewBooking_studioId_status_idx" ON "new_bookings"("studioId", "status");
CREATE INDEX "NewBooking_studioId_preferredDate_idx" ON "new_bookings"("studioId", "preferredDate");
```

Status: ✅ Already optimal. No changes needed.

---

## When to Implement Caching

Implement Redis caching when ANY of these conditions are met:

1. Studios count > 500
2. Average requests per studio per day > 1000
3. P95 response time > 150ms
4. User complaints about slow loading

**Current Recommendation**: Design ready, but **don't implement yet**. Wait for scale.

---

## Caching Strategy (Future)

### Cache Key Pattern
```typescript
const cacheKey = `slots:${studioId}:${date}:${serviceId || 'all'}`;
```

### TTL Strategy
- Far future (>7 days): 1 hour
- Medium future (2-7 days): 15 minutes
- Near future (today, tomorrow): 5 minutes
- Past dates: Don't cache

### Invalidation Triggers
- New booking created
- Booking status changed
- Booking deleted
- Blocked time created/updated/deleted
- Studio capacity changed
- Studio opening hours changed

### Implementation Files (to be created)
- `/lib/cache/slots-cache.ts` - Cache layer
- `/lib/cache/invalidation-hooks.ts` - Invalidation logic

---

## GlitchTip Instrumentation (Optional)

To add full performance monitoring, use the instrumented version:

### Option 1: Quick (Add Basic Logging)
Add timing logs to `/lib/slots/dynamic-availability.ts`:

```typescript
const startTime = performance.now();
// ... existing code ...
const totalTime = performance.now() - startTime;

logger.info('Slot calculation completed', {
  correlationId,
  totalTime: Math.round(totalTime),
  bookingCount: bookings.length,
  availableSlots: slots.filter(s => s.available).length,
});

// Alert if slow
if (totalTime > 200) {
  logger.warn('Slow slot calculation', { correlationId, totalTime });
}
```

### Option 2: Full (Use Instrumented Version)
1. Back up current file:
   ```bash
   cp lib/slots/dynamic-availability.ts lib/slots/dynamic-availability.backup.ts
   ```

2. Copy instrumented version:
   ```bash
   cp lib/slots/dynamic-availability-instrumented.ts lib/slots/dynamic-availability.ts
   ```

3. Test thoroughly:
   ```bash
   npm test __tests__/lib/slots/
   npx tsx scripts/benchmark-slots.ts
   ```

4. Deploy and monitor GlitchTip dashboard

---

## Common Performance Issues

### Issue: Slow Booking Query (> 50ms)

**Diagnosis**:
```sql
EXPLAIN ANALYZE
SELECT "preferredTime" FROM "new_bookings"
WHERE "studioId" = 'xxx' AND "preferredDate" = 'YYYY-MM-DD' AND "status" IN ('CONFIRMED', 'PENDING');
```

**Expected**: Index Scan using `NewBooking_studioId_preferredDate_preferredTime_status_idx`

**Fix**: If not using index, run:
```bash
# Reanalyze table statistics
docker exec -it massava-postgres psql -U postgres -d massava -c "ANALYZE new_bookings;"
```

### Issue: Slow Total Calculation (> 200ms)

**Possible Causes**:
1. Too many bookings (> 1000 per day per studio)
   - Solution: Implement Redis caching
2. Too many blocked times (> 50 per day)
   - Solution: Pre-build blocked times Set
3. High database latency
   - Solution: Check database connection pool, consider read replica

**Debugging**:
```bash
# Run benchmark to isolate issue
npx tsx scripts/benchmark-slots.ts

# Check which part is slow:
# - Studio Query: Check connection pool
# - Booking Query: Check indexes
# - Blocked Query: Check indexes
# - Calculation: Optimize algorithm
```

### Issue: High Memory Usage

**Diagnosis**:
```bash
# Run memory test
npm test __tests__/lib/slots/performance.test.ts -- --grep "Memory Usage"
```

**Fix**: If memory increase > 50MB for 100 calculations:
1. Check for memory leaks in Prisma queries
2. Ensure no global state accumulation
3. Force garbage collection after heavy operations

---

## Monitoring Checklist

### Daily (Automated via GlitchTip)
- [ ] P95 response time < 200ms
- [ ] Error rate < 0.1%
- [ ] No slow query alerts (> 200ms)

### Weekly (Manual Review)
- [ ] Review GlitchTip performance dashboard
- [ ] Check slow query log
- [ ] Verify cache hit rate (if caching enabled)

### Monthly (Performance Review)
- [ ] Run benchmark script
- [ ] Compare with baseline metrics
- [ ] Review capacity planning
- [ ] Update performance documentation

---

## Performance Optimization Roadmap

### Phase 1: Monitoring (Current)
- [x] Database indexes optimized
- [x] Benchmark script created
- [x] Performance tests written
- [ ] GlitchTip instrumentation added
- [ ] Baseline metrics documented

### Phase 2: Optimization (As Needed)
- [ ] HTTP cache headers (2 hours)
- [ ] Batch query endpoint (4 hours)
- [ ] Pre-build blocked times map (1 hour)

### Phase 3: Caching (When Scale Requires)
- [ ] Redis cache layer (2 days)
- [ ] Cache invalidation hooks (1 day)
- [ ] Cache monitoring dashboard (1 day)

### Phase 4: Infrastructure (High Scale)
- [ ] PostgreSQL read replicas (1 week)
- [ ] Edge runtime deployment (2 days)
- [ ] Global CDN for edge caching (1 week)

---

## Key Files

| File | Purpose |
|------|---------|
| `/lib/slots/dynamic-availability.ts` | Core slot calculation logic |
| `/lib/slots/capacity-validator.ts` | Booking creation with capacity check |
| `/lib/slots/slot-utils.ts` | Time utilities |
| `/app/api/studios/[studioId]/availability/route.ts` | API endpoint |
| `/scripts/benchmark-slots.ts` | Performance benchmark |
| `/__tests__/lib/slots/performance.test.ts` | Performance tests |
| `/lib/slots/dynamic-availability-instrumented.ts` | Reference implementation with monitoring |
| `/docs/slots-performance-optimization.md` | Full optimization guide |

---

## Getting Help

**Slow queries?**
1. Run `EXPLAIN ANALYZE` to check index usage
2. Check database connection pool size
3. Review GlitchTip slow query log

**High memory usage?**
1. Run memory performance test
2. Check for Prisma query leaks
3. Monitor production memory usage

**Need caching?**
1. Confirm scale requirements (> 500 studios)
2. Review caching strategy in full doc
3. Implement Redis layer with invalidation

**Questions?**
- Review: `/docs/slots-performance-optimization.md`
- Check: GlitchTip dashboard at `https://glitchtip.rnltlabs.de`
- Contact: Development Team

---

**Next Steps**:
1. Run benchmark script to establish baseline
2. Add basic timing logs to track production performance
3. Monitor for 1 week to understand patterns
4. Implement caching when scale requires it
