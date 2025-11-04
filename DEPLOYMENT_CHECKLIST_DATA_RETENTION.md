# Data Retention System - Deployment Checklist

**Task**: MASTER_ORCHESTRATION_PLAN.md Task 1.4: Data Retention & Deletion
**Implementation Date**: 2025-11-04
**Deployment Status**: Ready for staging/production

## Pre-Deployment Checklist

### 1. Environment Variables

#### Local Development (.env)
```bash
# Generate CRON_SECRET first
npm run generate:cron-secret

# Add to .env:
CRON_SECRET=<generated-secret>
RESEND_API_KEY=<your-resend-key>
RESEND_FROM_EMAIL=noreply@massava.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Vercel Production
```bash
# Set in Vercel Dashboard > Settings > Environment Variables
CRON_SECRET=<same-as-local>
RESEND_API_KEY=<your-resend-key>
RESEND_FROM_EMAIL=noreply@massava.app
NEXT_PUBLIC_APP_URL=https://massava.app
```

**Important**: Make sure CRON_SECRET is the same in all environments!

### 2. Database Migration

```bash
# Review the migration
cat prisma/migrations/20251104203646_add_data_retention_fields/migration.sql

# Apply to local database
npx prisma migrate dev

# Deploy to production database (when ready)
npx prisma migrate deploy
```

**Migration adds**:
- `deletedAt` column to users table
- `deletionScheduledAt` column to users table
- Indexes for both fields

### 3. Testing

#### Run Unit Tests
```bash
npm run test:retention
```
Expected: All 15 tests passing ✅

#### Test Dry Run Locally
```bash
npm run data-retention:dry-run
```
Expected: Console output showing what would be deleted (no actual deletion)

#### Test Email Sending (if RESEND_API_KEY configured)
```bash
# Test in development
npm run dev
# Trigger a test email via your test endpoint
```

### 4. Code Review

- [ ] Review `/lib/data-retention/retention-policy.ts`
- [ ] Review `/lib/cron/data-retention-job.ts`
- [ ] Review `/app/api/gdpr/export-data/route.ts`
- [ ] Review `/app/api/gdpr/delete-data/route.ts`
- [ ] Verify all email templates in `/lib/notifications/deletion-notifier.ts`
- [ ] Check Prisma schema changes in `/prisma/schema.prisma`

## Staging Deployment

### 1. Deploy to Staging

```bash
# Push to staging branch
git add .
git commit -m "feat: implement data retention and deletion system (GDPR compliance)"
git push origin feature/data-retention

# Or deploy directly to Vercel staging
vercel --prod=false
```

### 2. Verify Staging Environment

- [ ] Environment variables are set correctly
- [ ] Database migration applied successfully
- [ ] Cron job appears in Vercel Cron Jobs list
- [ ] API endpoints are accessible

### 3. Test on Staging

#### Test Data Export API
```bash
curl -X POST https://staging.massava.app/api/gdpr/export-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{"userId":"<test-user-id>","format":"json"}'
```

#### Test Data Deletion API
```bash
curl -X POST https://staging.massava.app/api/gdpr/delete-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{"userId":"<test-user-id>","confirmEmail":"test@example.com"}'
```

#### Test Cancel Deletion
```bash
curl -X PUT https://staging.massava.app/api/gdpr/delete-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{"userId":"<test-user-id>"}'
```

#### Test Cron Job Manually
```bash
curl -X GET https://staging.massava.app/api/cron/data-retention \
  -H "Authorization: Bearer <CRON_SECRET>"
```

### 4. Staging Test Scenarios

- [ ] Create test user with old `updatedAt` timestamp
- [ ] Run dry-run mode and verify warnings would be sent
- [ ] Manually trigger deletion warning for test user
- [ ] Verify email delivery (check Resend dashboard)
- [ ] Test cancellation flow via email link
- [ ] Soft delete test user and verify grace period
- [ ] Test permanent deletion after grace period

## Production Deployment

### 1. Final Pre-Production Checks

- [ ] All staging tests passed
- [ ] Code reviewed and approved
- [ ] Database migration tested on staging
- [ ] Email templates reviewed (German and English)
- [ ] Rate limiting tested (export API)
- [ ] Audit logging verified
- [ ] Error handling tested

### 2. Production Database Migration

```bash
# Backup production database first!
npm run db:backup

# Apply migration to production
npx prisma migrate deploy
```

### 3. Deploy to Production

```bash
# Merge to main branch
git checkout main
git merge feature/data-retention

# Push to production
git push origin main

# Or deploy via Vercel CLI
vercel --prod
```

### 4. Post-Deployment Verification

#### Verify Cron Job
- [ ] Go to Vercel Dashboard > Cron Jobs
- [ ] Verify "data-retention" job is listed
- [ ] Check schedule: "0 2 * * *" (daily at 2 AM UTC)
- [ ] Status should be "Active"

#### Verify Environment Variables
- [ ] CRON_SECRET is set
- [ ] RESEND_API_KEY is set
- [ ] RESEND_FROM_EMAIL is set
- [ ] NEXT_PUBLIC_APP_URL is set

#### Test Production APIs (Non-Destructive)
```bash
# Test export endpoint (with real user token)
curl -X POST https://massava.app/api/gdpr/export-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <real-token>" \
  -d '{"userId":"<your-user-id>","format":"json"}'
```

#### Monitor First Cron Execution
- [ ] Wait for first scheduled run (2 AM UTC next day)
- [ ] Check Vercel function logs
- [ ] Verify no errors in logs
- [ ] Check Sentry/GlitchTip for any exceptions
- [ ] Verify emails sent (check Resend dashboard)

## Monitoring Setup

### 1. Vercel Logs
- [ ] Enable log retention in Vercel
- [ ] Set up log drain (if needed)
- [ ] Configure log alerts for errors

### 2. Email Monitoring
- [ ] Monitor Resend dashboard for delivery rates
- [ ] Set up bounce/complaint alerts
- [ ] Track email open rates (optional)

### 3. Database Monitoring
- [ ] Monitor query performance on new indexes
- [ ] Track deletion metrics
- [ ] Set up alerts for failed transactions

### 4. Alerts Configuration
```javascript
// Recommended alerts:
- Failed cron job execution
- Email delivery failure rate > 5%
- Database transaction errors
- Rate limit exceeded (many users hitting export limit)
- Permanent deletion count spike
```

## Post-Deployment Tasks

### 1. User Communication

Update documentation:
- [ ] Privacy Policy - add retention periods
- [ ] Terms of Service - mention automatic deletion
- [ ] FAQ - add data retention questions
- [ ] Help Center - document GDPR rights

Email to existing users:
- [ ] Draft email about new data retention policy
- [ ] Explain automatic deletion after 3 years inactivity
- [ ] Link to privacy policy
- [ ] Send via Resend broadcast

### 2. Legal Compliance

- [ ] Update Data Protection Impact Assessment (DPIA)
- [ ] Document retention policy in GDPR records
- [ ] Update Data Processing Agreement (if applicable)
- [ ] Notify Data Protection Officer (if applicable)

### 3. Internal Documentation

- [ ] Add runbook for handling deletion requests
- [ ] Document manual intervention procedures
- [ ] Create troubleshooting guide
- [ ] Train support team on new features

## Rollback Plan

If issues occur in production:

### 1. Disable Cron Job
```bash
# Method 1: Remove from vercel.json and redeploy
# Method 2: Disable in Vercel Dashboard

# Emergency: Change CRON_SECRET to break authentication
vercel env rm CRON_SECRET production
```

### 2. Rollback Database Migration
```sql
-- Manual rollback (if needed)
DROP INDEX "users_deletedAt_idx";
DROP INDEX "users_deletionScheduledAt_idx";
ALTER TABLE "users" DROP COLUMN "deletionScheduledAt";
ALTER TABLE "users" DROP COLUMN "deletedAt";
```

### 3. Restore from Backup
```bash
npm run db:restore
```

## Success Criteria

- [ ] Cron job executes successfully daily
- [ ] Zero email delivery failures
- [ ] No database errors in logs
- [ ] All tests passing
- [ ] User data exported successfully
- [ ] Deletion flow works end-to-end
- [ ] Grace period cancellation works
- [ ] Audit logs capture all operations
- [ ] No performance degradation

## Emergency Contacts

- **System Admin**: [Your email]
- **DPO (Data Protection Officer)**: [DPO email]
- **DevOps**: [DevOps contact]
- **Legal**: [Legal contact]

## Support Resources

- **Documentation**: `/lib/data-retention/README.md`
- **Implementation Summary**: `/DATA_RETENTION_IMPLEMENTATION_SUMMARY.md`
- **Vercel Docs**: https://vercel.com/docs/cron-jobs
- **Prisma Migrations**: https://www.prisma.io/docs/orm/prisma-migrate
- **GDPR Guidelines**: https://gdpr.eu/

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Verified By**: _________________

**Checklist Completed**: [ ] Yes [ ] No
**Production Status**: [ ] Deployed [ ] Rolled Back [ ] Issues

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________
