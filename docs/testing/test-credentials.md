# Test Credentials - Karlsruhe Studios

**Created**: 2025-11-04
**Source**: `prisma/seed-test-karlsruhe.ts`
**Environment File**: `.env.test` (git-ignored)

---

## ⚠️ Security Warning

**These are TEST credentials only. NEVER use in production!**

All test accounts use the same password: `Test1234!`

---

## Studio Owners

### 1. Siam Spa Karlsruhe (Innenstadt-West)

| Field | Value |
|-------|-------|
| **Owner Name** | Maria Schmidt |
| **Email** | maria.schmidt@siamspa-ka.de |
| **Password** | Test1234! |
| **Phone** | +49 151 11111111 |
| **Studio Name** | Siam Spa Karlsruhe |
| **Address** | Kaiserstraße 134, 76133 Karlsruhe |
| **Services** | Thai Massage Klassisch (90min, €60)<br>Ölmassage (60min, €50)<br>Fußreflexzonenmassage (45min, €35) |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000/business (Business Portal Dashboard)

---

### 2. Wellness Oase Durlach

| Field | Value |
|-------|-------|
| **Owner Name** | Thomas Weber |
| **Email** | thomas.weber@wellness-oase.de |
| **Password** | Test1234! |
| **Phone** | +49 152 22222222 |
| **Studio Name** | Wellness Oase Durlach |
| **Address** | Pfinztalstraße 67, 76227 Karlsruhe |
| **Services** | Hot Stone Massage (90min, €75)<br>Aromatherapie Massage (75min, €60)<br>Deep Tissue Massage (60min, €65) |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000/business

---

### 3. Thai Massage Mühlburg

| Field | Value |
|-------|-------|
| **Owner Name** | Sabine Fischer |
| **Email** | sabine.fischer@thaimassage-ka.de |
| **Password** | Test1234! |
| **Phone** | +49 153 33333333 |
| **Studio Name** | Thai Massage Mühlburg |
| **Address** | Rheinstraße 45, 76185 Karlsruhe |
| **Services** | Traditional Thai Massage (120min, €70)<br>Paarmassage (90min, €140)<br>Sport-Massage (60min, €55) |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000/business

---

## Customers

### 1. Anna Müller

| Field | Value |
|-------|-------|
| **Name** | Anna Müller |
| **Email** | anna.mueller@example.com |
| **Password** | Test1234! |
| **Phone** | +49 151 12345678 |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000 (Customer Portal Homepage)

---

### 2. Max Schmidt

| Field | Value |
|-------|-------|
| **Name** | Max Schmidt |
| **Email** | max.schmidt@example.com |
| **Password** | Test1234! |
| **Phone** | +49 152 23456789 |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000

---

### 3. Lisa Wagner

| Field | Value |
|-------|-------|
| **Name** | Lisa Wagner |
| **Email** | lisa.wagner@example.com |
| **Password** | Test1234! |
| **Phone** | +49 153 34567890 |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000

---

### 4. Tom Becker

| Field | Value |
|-------|-------|
| **Name** | Tom Becker |
| **Email** | tom.becker@example.com |
| **Password** | Test1234! |
| **Phone** | +49 154 45678901 |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000

---

### 5. Sarah Hoffmann

| Field | Value |
|-------|-------|
| **Name** | Sarah Hoffmann |
| **Email** | sarah.hoffmann@example.com |
| **Password** | Test1234! |
| **Phone** | +49 155 56789012 |

**Login URL**: http://localhost:3000/auth/signin
**Expected Redirect**: http://localhost:3000

---

## Quick Test Scenarios

### Test 1: Customer Booking Flow

1. **Logout** (if logged in)
2. Visit http://localhost:3000
3. Search for "massage" in "Karlsruhe"
4. Select one of the 3 studios
5. Choose available time slot
6. Select service
7. Click "Book Now"
8. **Auth Modal** should appear (frictionless booking)
9. Option 1: Login with customer email (e.g., anna.mueller@example.com / Test1234!)
10. Option 2: Continue as guest (fill in details)
11. Complete booking
12. Should see success screen with booking number

**Expected**: Booking created, email sent (if SMTP configured)

---

### Test 2: Studio Owner Login → Business Portal

1. **Logout** (if logged in)
2. Visit http://localhost:3000/auth/signin
3. Login with studio owner email (e.g., maria.schmidt@siamspa-ka.de / Test1234!)
4. **Should redirect** to http://localhost:3000/business (Business Portal Dashboard)
5. Should see:
   - Dashboard with stats
   - Sidebar navigation (Bookings, Calendar, Settings)
   - Recent bookings list
   - Calendar link

**Expected**: Business portal accessible, customer features hidden

---

### Test 3: Access Control (Customer tries Business Portal)

1. **Logout**
2. Login as customer (e.g., anna.mueller@example.com / Test1234!)
3. Try to navigate to http://localhost:3000/business
4. **Should redirect** to /unauthorized or homepage
5. Should NOT see business portal

**Expected**: Customer blocked from business portal

---

### Test 4: Access Control (Studio Owner tries Customer Portal)

1. **Logout**
2. Login as studio owner (e.g., maria.schmidt@siamspa-ka.de / Test1234!)
3. Navigate to http://localhost:3000 (customer homepage)
4. Should see different navigation (no customer-specific features)
5. Try to book appointment
6. Booking should work BUT customerId should be null (guest booking)

**Expected**: Studio owners can use customer portal but treated as guests for bookings

---

## Testing with cURL

### Login as Studio Owner

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=maria.schmidt@siamspa-ka.de" \
  -d "password=Test1234!" \
  -c cookies.txt

# Check session
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

### Login as Customer

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=anna.mueller@example.com" \
  -d "password=Test1234!" \
  -c cookies.txt

# Check session
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

### Test Business Portal API (Studio Owner Only)

```bash
# Get studio stats (requires studio owner session)
curl -X GET http://localhost:3000/api/business/stats \
  -b cookies.txt

# Get bookings
curl -X GET http://localhost:3000/api/business/bookings \
  -b cookies.txt

# Update booking status
curl -X PATCH http://localhost:3000/api/business/bookings/[id]/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}' \
  -b cookies.txt
```

---

## Database Verification

### Check Created Data

```bash
# Open Prisma Studio
npm run db:studio

# Should see:
# - 3 Studios (Karlsruhe)
# - 3 Studio Owners
# - 5 Customers
# - ~9 Services (3 per studio)
# - ~600 Time Slots (200 per studio for 30 days)
# - 10 Bookings (5 confirmed, 3 pending, 2 cancelled)
```

### SQL Queries

```sql
-- Count studios in Karlsruhe
SELECT COUNT(*) FROM Studio WHERE city = 'Karlsruhe';
-- Expected: 3

-- Count studio owners
SELECT COUNT(*) FROM User WHERE userType = 'STUDIO_OWNER';
-- Expected: 3

-- Count customers
SELECT COUNT(*) FROM User WHERE userType = 'CUSTOMER';
-- Expected: 5

-- Count bookings by status
SELECT status, COUNT(*) FROM Booking GROUP BY status;
-- Expected:
--   CONFIRMED: 5
--   PENDING: 3
--   CANCELLED: 2

-- Check bookings with health data
SELECT COUNT(*) FROM Booking WHERE message IS NOT NULL;
-- Expected: ~5 (50% have health data)
```

---

## Troubleshooting

### Issue: Can't login with test credentials

**Solution**:
1. Ensure database was seeded: `npm run db:seed:test`
2. Check user exists: `SELECT * FROM User WHERE email = 'maria.schmidt@siamspa-ka.de'`
3. Verify password hashed correctly (should be bcrypt hash)

### Issue: Studio owner redirects to wrong page

**Solution**:
1. Check `userType` in database: `SELECT userType FROM User WHERE email = 'maria.schmidt@siamspa-ka.de'`
2. Should be `STUDIO_OWNER`, not `CUSTOMER`
3. Check NextAuth redirect callback in `/lib/auth.ts`

### Issue: Business portal shows 401 Unauthorized

**Solution**:
1. Check middleware is configured: `/middleware.ts`
2. Verify session includes userType: Check `/api/auth/session`
3. Ensure middleware matcher includes `/business/*`

### Issue: No studios showing in search

**Solution**:
1. Verify studios created: `SELECT * FROM Studio WHERE city = 'Karlsruhe'`
2. Should see 3 studios
3. Check `verified = true` (required for search)
4. Check lat/lng coordinates are set

---

## Environment Variables

### Required for Testing

Ensure these are set in `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..." # Your secret

# GDPR Features (for testing)
HEALTH_DATA_ENCRYPTION_KEY="<32-byte-hex-key>"
DATA_RETENTION_ENABLED="true"
COOKIE_CONSENT_ENABLED="true"
```

### Optional (for full testing)

```bash
# Email (for booking confirmations)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@massava.app"
SMTP_PASSWORD="..."

# Google Analytics (for cookie consent testing)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## Resetting Test Data

To completely reset and recreate test data:

```bash
# 1. Reset database (deletes ALL data)
npm run db:reset

# 2. Run migrations
npm run db:migrate

# 3. Seed test data
npm run db:seed:test

# 4. Verify data
npm run db:studio
```

**WARNING**: This will delete ALL existing data including any real data!

---

## Production Credentials

**NEVER use these test credentials in production!**

For production:
1. Create real users via registration flow
2. Use strong, unique passwords
3. Enable email verification
4. Implement rate limiting on login
5. Monitor for suspicious activity
6. Rotate credentials regularly

---

**Last Updated**: 2025-11-04
**Maintained By**: Development Team
**Related Files**:
- `prisma/seed-test-karlsruhe.ts` (seeder script)
- `.env.test` (credentials for automation)
- `MASTER_ORCHESTRATION_PLAN.md` (implementation plan)
