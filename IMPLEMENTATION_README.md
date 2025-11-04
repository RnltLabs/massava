# Business Portal + GDPR Implementation - Execution Guide

**Project**: Massava Business Portal Separation
**Approach**: Plan A - Path-based routing (`/business/*`)
**Timeline**: 2-3 weeks
**Automation Level**: 95% (2 human actions required)

---

## 🚀 Quick Start (One-Click Execution)

```bash
# 1. Ensure you're on develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/business-portal-gdpr

# 3. Run one-click implementation
npm run orchestrate:implement
```

That's it! The script will:
- ✅ Implement all GDPR compliance measures
- ✅ Build complete business portal at `/business`
- ✅ Generate test data (Karlsruhe studios)
- ✅ Run all tests
- ✅ Create commit with changes
- ⚠️ Stop twice for human actions (AVV signatures)

**Estimated Time**: 10-12 days with parallel execution

---

## 📋 Table of Contents

1. [What Gets Implemented](#what-gets-implemented)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Execution](#step-by-step-execution)
4. [Human Intervention Required](#human-intervention-required)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 What Gets Implemented

### Phase 1: GDPR Compliance (P1 Priority)

| Feature | Status | Description |
|---------|--------|-------------|
| **Health Data Encryption** | Automated | AES-256-GCM encryption for booking messages (GDPR Art. 9) |
| **AVV Contracts** | Manual ⚠️ | Sign Hetzner + Stripe Data Processing Agreements |
| **Cookie Consent** | Automated | ePrivacy compliant cookie banner with granular consent |
| **Data Retention** | Automated | Automated deletion based on retention policies + GDPR API |
| **Privacy Policy Update** | Automated | Updated policy reflecting all GDPR measures |

### Phase 2: Business Portal Separation

| Feature | Status | Description |
|---------|--------|-------------|
| **Middleware Protection** | Automated | Route guard for `/business/*` (RBAC) |
| **Business Portal UI** | Automated | Complete dashboard, bookings, calendar, settings |
| **Feature Migration** | Automated | Move studio owner features to `/business/*` |
| **Business API** | Automated | Protected API endpoints for business operations |
| **Customer Portal Cleanup** | Automated | Remove studio owner features from customer portal |
| **NextAuth Update** | Automated | Role-based redirects after login |
| **Documentation** | Automated | Architecture docs, API docs, user guides |

### Phase 3: Testing & Deployment

| Feature | Status | Description |
|---------|--------|-------------|
| **Karlsruhe Test Data** | Automated | 3 studios, 5 customers, services, bookings |
| **Test Credentials** | Automated | Documented login credentials for all test accounts |
| **Integration Tests** | Automated | 100% coverage for GDPR + business portal features |
| **E2E Tests** | Automated | 5 critical user flows (booking, onboarding, GDPR, etc.) |
| **Deployment** | Semi-Manual ⚠️ | Staging auto-deploy, production requires approval |

---

## ✅ Prerequisites

### 1. Environment Setup

Create `.env.local` with required variables:

```bash
# Copy from example
cp .env.example .env.local

# Add these NEW variables:
HEALTH_DATA_ENCRYPTION_KEY="<generate-below>"
DATA_RETENTION_ENABLED="true"
COOKIE_CONSENT_ENABLED="true"
```

### 2. Generate Encryption Key

```bash
node -e "console.log('HEALTH_DATA_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy output to `.env.local`.

### 3. Database Backup

**IMPORTANT**: Backup your database before starting!

```bash
npm run db:backup
# Creates: ./backups/massava_YYYYMMDD_HHMMSS.sql
```

### 4. Verify Prerequisites

```bash
# Check Node.js version (>= 18 required)
node --version

# Install dependencies
npm install

# Verify database connection
npm run db:ping
```

---

## 🔨 Step-by-Step Execution

### Option 1: One-Click Automated Execution (Recommended)

```bash
# Run complete orchestration
npm run orchestrate:implement
```

The script will:
1. ✅ Check all prerequisites
2. ✅ Create database backup
3. ✅ Execute all tasks in parallel (based on DAG)
4. ⏸️ **PAUSE for human action #1**: AVV signing (~1 hour)
5. ✅ Continue with remaining tasks
6. ⏸️ **PAUSE for human action #2**: Production approval (30 seconds)
7. ✅ Deploy to production
8. ✅ Run smoke tests
9. ✅ Done!

**Progress Tracking**: Real-time progress bar and task status display

**Logging**: All output logged to `logs/orchestration.log`

### Option 2: Manual Phase-by-Phase Execution

If you prefer more control, execute each phase manually:

```bash
# Phase 1: GDPR Compliance
npm run implement:phase1

# Phase 2: Business Portal
npm run implement:phase2

# Phase 3: Testing & Deployment
npm run implement:phase3
```

### Option 3: Individual Task Execution

For debugging or step-by-step implementation:

```bash
# Task 1.1: Health Data Encryption
npm run implement:task -- 1.1

# Task 2.2: Business Portal File Structure
npm run implement:task -- 2.2

# etc.
```

---

## ⚠️ Human Intervention Required

**Total Human Actions**: 2

### Action 1: Sign AVV Contracts (~1 hour)

**When**: During Phase 1, Task 1.2

**What**: Sign Data Processing Agreements with Hetzner and Stripe

**The script will pause and show detailed instructions.**

Quick summary:

1. **Hetzner AVV** (~45 min):
   - Go to https://robot.hetzner.com
   - Navigate to your server → Contracts & Agreements → AVV
   - Fill out form (company details, processing details)
   - Sign agreement
   - Download PDF
   - Save to: `docs/legal/avv-contracts/hetzner-avv-signed.pdf`
   - Update `docs/legal/avv-registry.md`

2. **Stripe DPA** (~30 min):
   - Go to https://dashboard.stripe.com
   - Settings → Business settings → Data processing → DPA
   - Review and accept agreement
   - Download PDF
   - Save to: `docs/legal/avv-contracts/stripe-dpa-signed.pdf`
   - Update `docs/legal/avv-registry.md`

**Full Instructions**: See `MASTER_ORCHESTRATION_PLAN.md` section "Human Intervention Checklist"

**After Completion**: Press ENTER to continue orchestration

---

### Action 2: Production Deployment Approval (~30 seconds)

**When**: End of Phase 3, Task 3.5

**What**: Approve production deployment after all tests pass

**The script will pause and show:**
- Pre-deployment checklist (all tests passed, backup created, etc.)
- Warning about affecting live users
- Prompt: Type "DEPLOY" to proceed

**After Typing "DEPLOY"**: Production deployment begins automatically

---

## 🧪 Testing

### Automated Testing (Built-in)

All tests run automatically during orchestration:

```bash
# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm test
```

### Manual Testing

After implementation completes:

```bash
# 1. Start dev server
npm run dev

# 2. Test customer portal
open http://localhost:3000

# 3. Test business portal (login as studio owner)
open http://localhost:3000/business

# 4. Test cookie consent
# - Clear cookies
# - Visit homepage
# - Should see cookie consent banner

# 5. Test GDPR features
# - Login as customer
# - Request data export: http://localhost:3000/api/gdpr/export-data
# - Request deletion: http://localhost:3000/api/gdpr/delete-data
```

### Test Credentials

See `docs/testing/test-credentials.md` for complete list.

**Quick Access**:

| Role | Email | Password |
|------|-------|----------|
| Studio Owner | maria.schmidt@siamspa-ka.de | Test1234! |
| Customer | anna.mueller@example.com | Test1234! |

---

## 🚢 Deployment

### Staging Deployment (Automatic)

After orchestration completes, code is automatically deployed to staging:

```bash
# Manual staging deploy
npm run deploy:staging

# Verify staging
npm run smoke:staging
```

**Staging URL**: https://staging.massava.app (or your staging domain)

### Production Deployment (Requires Approval)

Production deployment requires human approval during orchestration.

**Manual production deploy** (if needed):

```bash
# Deploy to production
npm run deploy:production

# Verify production
npm run smoke:production
```

**Production URL**: https://massava.app

---

## 🔙 Rollback

If something goes wrong, rollback to previous state:

### Full Rollback (Recommended)

```bash
# 1. Restore database from backup
npm run db:restore -- --file=./backups/massava_before_orchestration_*.sql

# 2. Reset git to before implementation
git reset --hard origin/develop

# 3. Redeploy previous version
npm run deploy:staging
npm run deploy:production
```

### Partial Rollback (Phase-specific)

```bash
# Rollback Phase 3 only (deployment)
npm run deploy:rollback

# Rollback Phase 2 (business portal)
git revert <commit-hash>
npm run deploy:staging

# Rollback Phase 1 (GDPR)
# WARNING: This removes encryption!
npm run decrypt:emergency
npm run db:restore
```

---

## 🐛 Troubleshooting

### Issue: Orchestration Script Won't Start

**Symptoms**: Script exits immediately with error

**Solutions**:

1. Check prerequisites:
   ```bash
   npm run orchestrate:check-prereqs
   ```

2. Verify `.env.local` exists and has `HEALTH_DATA_ENCRYPTION_KEY`

3. Check Node.js version:
   ```bash
   node --version  # Should be >= 18
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

---

### Issue: Database Backup Failed

**Symptoms**: "Failed to create database backup" error

**Solutions**:

1. Check database connection:
   ```bash
   npm run db:ping
   ```

2. Ensure `backups/` directory exists:
   ```bash
   mkdir -p backups
   ```

3. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   # OR
   brew services list | grep postgres
   ```

---

### Issue: Task Failed During Execution

**Symptoms**: Orchestration stops with "Task X.X failed" error

**Solutions**:

1. Check logs:
   ```bash
   tail -f logs/orchestration.log
   ```

2. Retry specific task:
   ```bash
   npm run implement:task -- X.X
   ```

3. Skip task and continue (not recommended):
   ```bash
   npm run implement:skip-task -- X.X
   npm run orchestrate:resume
   ```

4. Full rollback and restart:
   ```bash
   npm run db:restore
   git reset --hard
   npm run orchestrate:implement
   ```

---

### Issue: AVV Verification Failed

**Symptoms**: Script says "Human action not completed" after AVV signing

**Solutions**:

1. Verify both PDFs exist:
   ```bash
   ls -la docs/legal/avv-contracts/
   # Should see:
   # - hetzner-avv-signed.pdf
   # - stripe-dpa-signed.pdf
   ```

2. Verify registry updated:
   ```bash
   cat docs/legal/avv-registry.md
   # Should contain both contracts with dates and numbers
   ```

3. If files missing, complete AVV signing and press ENTER again

---

### Issue: Tests Failing

**Symptoms**: Integration or E2E tests fail during orchestration

**Solutions**:

1. Check test output:
   ```bash
   npm run test:integration -- --verbose
   ```

2. Verify test data seeded:
   ```bash
   npm run db:seed:test
   ```

3. Check environment variables:
   ```bash
   cat .env.local | grep HEALTH_DATA_ENCRYPTION_KEY
   ```

4. Run specific failing test:
   ```bash
   npm test -- tests/integration/health-data-encryption.test.ts
   ```

---

### Issue: Business Portal Shows 401 Unauthorized

**Symptoms**: After login as studio owner, `/business` shows "Unauthorized"

**Solutions**:

1. Check middleware configuration:
   ```bash
   cat middleware.ts | grep business
   ```

2. Verify session includes `userType`:
   ```bash
   curl http://localhost:3000/api/auth/session -b cookies.txt
   # Should show: "userType": "STUDIO_OWNER"
   ```

3. Clear browser cache and cookies

4. Re-login with studio owner credentials

---

### Issue: Cookie Consent Not Appearing

**Symptoms**: No cookie consent banner on homepage

**Solutions**:

1. Check environment variable:
   ```bash
   cat .env.local | grep COOKIE_CONSENT_ENABLED
   # Should be: COOKIE_CONSENT_ENABLED="true"
   ```

2. Clear browser localStorage:
   ```javascript
   // In browser console:
   localStorage.removeItem('cookie-consent')
   ```

3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

---

### Issue: Health Data Not Encrypted

**Symptoms**: Booking messages stored as plaintext in database

**Solutions**:

1. Verify encryption key in `.env.local`:
   ```bash
   cat .env.local | grep HEALTH_DATA_ENCRYPTION_KEY
   ```

2. Check Prisma middleware loaded:
   ```bash
   cat lib/prisma/index.ts | grep encrypt
   ```

3. Re-run encryption migration:
   ```bash
   npm run prisma migrate deploy
   npm run encrypt:existing-data
   ```

---

## 📞 Getting Help

### Documentation

- **Master Plan**: `MASTER_ORCHESTRATION_PLAN.md` (complete implementation details)
- **Test Credentials**: `docs/testing/test-credentials.md`
- **Architecture**: `docs/architecture/business-portal-architecture.md`
- **API Docs**: `docs/api/business-portal-api.md`

### Logs

- **Orchestration Log**: `logs/orchestration.log`
- **Application Log**: `logs/app.log`
- **Database Log**: `logs/database.log`

### Support

1. Check troubleshooting section above
2. Review logs for error details
3. Search existing GitHub issues
4. Create new GitHub issue with:
   - Error message
   - Relevant logs
   - Steps to reproduce

---

## 📊 Progress Tracking

The orchestration script shows real-time progress:

```
═══════════════════════════════════════════════════════════════
                    TASK STATUS OVERVIEW
═══════════════════════════════════════════════════════════════

Overall Progress: [██████████████████░░░░░░] 75% (15/20)

  Completed:   15 / 20
  In Progress: 2
  Pending:     3
  Failed:      0
  Blocked:     0

───────────────────────────────────────────────────────────────
Task Details:
───────────────────────────────────────────────────────────────
✅ 1.1 Health Data Encryption - completed (45s)
✅ 1.2 AVV Contracts - completed (3600s)
✅ 1.3 Cookie Consent - completed (120s)
✅ 1.4 Data Retention & Deletion - completed (180s)
✅ 1.5 Privacy Policy Update - completed (30s)
🔄 2.1 Middleware Protection - in_progress
⏳ 2.2 Business Portal File Structure - pending
...
═══════════════════════════════════════════════════════════════
```

---

## ✅ Success Criteria

Implementation is considered successful when:

- ✅ All 20 tasks completed without errors
- ✅ All tests passing (integration + E2E)
- ✅ Both AVV contracts signed and archived
- ✅ Test data seeded (3 Karlsruhe studios)
- ✅ Business portal accessible at `/business` (studio owners only)
- ✅ Customer portal clean (no studio owner features)
- ✅ Cookie consent appearing on first visit
- ✅ Health data encrypted in database
- ✅ GDPR API endpoints functional (export/delete)
- ✅ Smoke tests passing on staging
- ✅ Production deployment approved and successful
- ✅ No errors in production logs (24h monitoring)

---

## 🎉 Post-Implementation

After successful implementation:

### 1. Create Pull Request

```bash
# Review changes
git diff develop

# Create commit (automated by orchestration)
git add .
git commit -m "feat: implement business portal + GDPR compliance"

# Push to remote
git push origin feature/business-portal-gdpr

# Create PR
gh pr create --title "Business Portal + GDPR Implementation" \
             --body "See MASTER_ORCHESTRATION_PLAN.md for details"
```

### 2. Request Code Review

Tag reviewers for:
- Security review (GDPR measures)
- Architecture review (business portal separation)
- UX review (customer vs studio owner flows)

### 3. Monitor Production

After merge and deployment:

```bash
# Monitor logs for 24h
tail -f logs/production.log

# Check error rates
npm run analytics:errors

# Monitor performance
npm run analytics:performance
```

### 4. Update Documentation

- ✅ README.md (updated automatically)
- ✅ Architecture docs (updated automatically)
- ✅ API docs (updated automatically)
- Manual: Update team wiki with deployment notes

---

## 📅 Timeline Summary

| Phase | Duration | Tasks | Human Actions |
|-------|----------|-------|---------------|
| **Phase 1: GDPR** | 3-5 days | 5 | 1 (AVV signing, ~1 hour) |
| **Phase 2: Business Portal** | 5-7 days | 7 | 0 |
| **Phase 3: Testing & Deployment** | 2-3 days | 5 | 1 (Production approval, 30s) |
| **TOTAL** | **10-12 days** | **17** | **2** |

**With Parallelization**: 10-12 days
**Without Parallelization**: 18-21 days
**Time Saved**: ~8 days (42% faster)

---

## 🔐 Security Notes

### Encryption Key Management

- **NEVER commit** `.env.local` to git
- **NEVER share** encryption keys in Slack/email
- **Store securely** in password manager (1Password, LastPass, etc.)
- **Rotate keys** annually

### Test Credentials

- **NEVER use** test credentials in production
- **Delete test data** before production launch
- **Generate new** production credentials via registration flow

### AVV Contracts

- **Store securely** in `docs/legal/avv-contracts/` (git-tracked)
- **Review annually** (set calendar reminder)
- **Update** if processors change

---

**Version**: 1.0.0
**Created**: 2025-11-04
**Author**: Development Team
**Related Files**:
- `MASTER_ORCHESTRATION_PLAN.md` (complete plan)
- `scripts/orchestrate.ts` (orchestration script)
- `prisma/seed-test-karlsruhe.ts` (test data seeder)
- `docs/testing/test-credentials.md` (test credentials)
- `.env.test` (test credentials for automation)
