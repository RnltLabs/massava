# GDPR Compliance Audit Report
## Proposed `business.massava.app` Subdomain Architecture

**Date:** November 4, 2025  
**Audited By:** Security & Privacy Auditor Agent  
**Scope:** Full GDPR compliance assessment for proposed subdomain separation architecture  
**Product:** Massava (Massage Booking Platform)  
**Critical:** Art. 9 GDPR Health Data Processing  

---

## EXECUTIVE SUMMARY

### Overall GDPR Compliance Rating: **6.5/10** ⚠️

**Status:** **AMBER - SIGNIFICANT GAPS REQUIRING REMEDIATION BEFORE LAUNCH**

The proposed subdomain architecture (`massava.app` for customers, `business.massava.app` for studios) provides **basic technical separation** but has **critical GDPR compliance gaps**, particularly for Art. 9 special category health data processing. While the architecture demonstrates some privacy-by-design principles, it **requires substantial improvements** before being audit-ready.

### Critical Findings

**🔴 RED FLAGS (Blockers):**
1. **No encryption for Art. 9 health data** (message field in bookings)
2. **No cookie consent implementation** (ePrivacy Directive violation)
3. **No data export/deletion endpoints** (Art. 15-17 GDPR)
4. **Missing Hetzner AVV documentation** (Art. 28 GDPR)
5. **No IP anonymization for audit logs** (Art. 25 GDPR)
6. **Subdomain cookie isolation NOT sufficient** for Art. 9 compliance alone

**🟡 AMBER FLAGS (Risks):**
1. **Health consent implementation incomplete** (checkbox exists, but encryption missing)
2. **Privacy policy references non-existent endpoints** (`/api/user/export`, `/api/user/delete`)
3. **No breach notification procedure documented** (Art. 33-34 GDPR)
4. **Rate limiting exists but not on all critical endpoints**
5. **Session cookies lack explicit domain configuration** (browser defaults may not suffice)
6. **No data retention automation** (3-month booking deletion policy mentioned but not implemented)

**🟢 GREEN FLAGS (Strengths):**
1. ✅ **bcrypt with 12 rounds** (Art. 32 compliant password hashing)
2. ✅ **Comprehensive security headers** (CSP, HSTS, X-Frame-Options)
3. ✅ **Rate limiting on authentication** (5 attempts/15min)
4. ✅ **Audit logging schema exists** (AuditLog model)
5. ✅ **Privacy policy comprehensive** (covers Art. 13-14 requirements)
6. ✅ **No npm vulnerabilities** (clean audit)
7. ✅ **Role-based access control** (RBAC with UserRole enum)
8. ✅ **JWT session strategy** (30-day expiration)

---

## SUBDOMAIN ARCHITECTURE ANALYSIS

### Proposed Architecture

```
Customer Portal: massava.app
├── Public routes: /, /search, /studios
├── Booking flow: /booking/[studioId]/[slotId]
└── NextAuth cookie: domain=massava.app

Business Portal: business.massava.app
├── Dashboard: /dashboard
├── Calendar: /dashboard/calendar
├── Bookings: /dashboard/bookings (sees customer health data)
└── NextAuth cookie: domain=business.massava.app

Shared:
├── Authentication: /api/auth (NextAuth endpoint)
├── Database: Single PostgreSQL (Hetzner Germany)
└── User Model: Unified with primaryRole field
```

### Technical Isolation Mechanisms

| Mechanism | Implementation | GDPR Compliance | Rating |
|-----------|----------------|-----------------|--------|
| **Cookie Domain Scoping** | Browser-enforced (massava.app vs business.massava.app) | ⚠️ Partial (Not sufficient alone for Art. 9) | 3/5 |
| **Database Isolation** | None (shared User table, role-based filtering) | ⚠️ Risk (No physical separation) | 2/5 |
| **Network Isolation** | None (same Next.js app, same container) | ❌ None | 1/5 |
| **Access Control** | Role-based (UserRole enum + middleware checks) | ✅ Good (Clear role separation) | 4/5 |
| **Audit Trail** | AuditLog model (user, action, resource) | ⚠️ Partial (IP not anonymized) | 3/5 |
| **Encryption** | ❌ Health data NOT encrypted at rest | ❌ Critical Gap | 0/5 |

**Overall Technical Isolation Score: 2.2/5 (44%)** ⚠️

### GDPR Art. 9 Assessment: Is Subdomain Separation Sufficient?

**Question:** Are separate domains sufficient for processing Art. 9 special category health data (customer health information shared with massage therapists)?

**Answer:** **NO - Subdomain separation alone is NOT sufficient for Art. 9 compliance.**

#### Why Subdomain Separation is Insufficient

1. **Art. 9(2)(a) requires "explicit consent"** (checkbox exists ✅)
2. **Art. 32 requires "appropriate technical measures"** including:
   - ❌ Encryption at rest (NOT IMPLEMENTED - critical gap)
   - ✅ Encryption in transit (HTTPS enforced)
   - ⚠️ Access controls (role-based, but no field-level encryption)
   - ❌ Pseudonymization (NOT IMPLEMENTED for health data)

3. **Art. 25 "Privacy by Design" requires:**
   - ⚠️ Data minimization (message field is free-text, potential over-collection)
   - ❌ Encryption (NOT IMPLEMENTED)
   - ⚠️ Access logging (exists but IP not anonymized)

4. **Cookie isolation provides:**
   - ✅ Session separation (customers can't access business portal)
   - ✅ Prevents accidental cross-access
   - ❌ Does NOT encrypt sensitive data
   - ❌ Does NOT prevent database-level access by attackers

#### What IS Required for Art. 9 Compliance

**Mandatory Technical Measures (Currently Missing):**

1. **Field-Level Encryption** for health data:
   ```typescript
   // REQUIRED: Encrypt before storage
   model NewBooking {
     message String? @db.Text // ❌ CURRENT: Plain text
     // ✅ REQUIRED:
     messageEncrypted String? @db.Text // AES-256-GCM encrypted
   }
   ```

2. **Enhanced Access Controls:**
   - ✅ Already implemented: Only therapist + customer can see booking
   - ❌ Missing: Field-level access logging for health data views
   - ❌ Missing: Re-authentication for health data access (e.g., password prompt)

3. **Audit Trail for Health Data:**
   ```typescript
   // ✅ REQUIRED: Log every health data access
   await prisma.auditLog.create({
     data: {
       action: "HEALTH_DATA_ACCESSED",
       userId: therapistId,
       resourceId: bookingId,
       metadata: { field: "message", reason: "view_booking" }
     }
   })
   ```

4. **Consent Management:**
   - ✅ Checkbox exists: `explicitHealthConsent`
   - ✅ Timestamp exists: `healthConsentGivenAt`
   - ⚠️ Missing: Consent withdrawal mechanism (UI + backend)
   - ⚠️ Missing: Consent version tracking

**Recommendation:** Subdomain architecture is a **good foundation** but MUST be combined with encryption, enhanced auditing, and consent management.

---

## DETAILED GDPR COMPLIANCE ASSESSMENT

### 1. Art. 6 - Legal Basis for Data Processing ✅ PASS

**Rating: 8/10**

**What's Good:**
- ✅ Privacy policy clearly documents legal basis:
  - Art. 6(1)(b) for booking data (contract performance)
  - Art. 6(1)(a) for analytics (consent)
  - Art. 9(2)(a) for health data (explicit consent)
- ✅ Explicit consent checkbox implemented: `explicitHealthConsent`
- ✅ Consent timestamp stored: `healthConsentGivenAt`

**What's Missing:**
- ⚠️ No consent withdrawal UI (Art. 7(3) - "as easy to withdraw as to give")
- ⚠️ No consent version tracking (for policy updates)
- ⚠️ No re-consent mechanism after policy changes

**Code Evidence:**
```typescript
// lib/validations/booking.ts
explicitHealthConsent: z.boolean().optional()

// NewBooking schema
explicitHealthConsent    Boolean?  @default(false)
healthConsentGivenAt     DateTime?
healthConsentText        String?   @db.Text
```

**Recommendation:**
```typescript
// Add consent management
model ConsentLog {
  id            String   @id @default(cuid())
  userId        String
  consentType   String   // "health_data", "analytics", "marketing"
  version       String   // Privacy policy version
  granted       Boolean
  grantedAt     DateTime @default(now())
  withdrawnAt   DateTime?
  ipAddress     String?  // Anonymized
  userAgent     String?
}
```

---

### 2. Art. 9 - Special Categories of Personal Data ❌ FAIL

**Rating: 3/10** 🔴 **CRITICAL**

**What's Good:**
- ✅ Explicit consent checkbox exists
- ✅ Privacy policy explains Art. 9 requirements
- ✅ Consent timestamp logged
- ✅ Purpose clearly stated (massage treatment adaptation)

**Critical Gaps:**
- ❌ **NO ENCRYPTION FOR HEALTH DATA** (Art. 32 violation)
- ❌ No pseudonymization
- ❌ No enhanced access controls (e.g., therapist re-authentication)
- ❌ No field-level audit logging for health data access
- ❌ Message field allows unlimited free-text (over-collection risk)

**Current Implementation:**
```typescript
// app/actions/createBooking.ts (lines 89-96)
const booking = await prisma.booking.create({
  data: {
    // ...
    message: validated.message || null, // ❌ PLAIN TEXT health data!
    explicitHealthConsent: validated.explicitHealthConsent || false,
    healthConsentGivenAt: new Date(),
  }
})
```

**Required Implementation:**
```typescript
// 1. Create encryption utilities
// lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.HEALTH_DATA_ENCRYPTION_KEY! // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export function encryptHealthData(data: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Return: IV + AuthTag + Encrypted Data
  return iv.toString('hex') + authTag.toString('hex') + encrypted
}

export function decryptHealthData(encryptedData: string): string {
  const iv = Buffer.from(encryptedData.slice(0, 32), 'hex')
  const authTag = Buffer.from(encryptedData.slice(32, 64), 'hex')
  const encrypted = encryptedData.slice(64)
  
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// 2. Update booking creation
// app/actions/createBooking.ts
import { encryptHealthData } from '@/lib/encryption'

const booking = await prisma.booking.create({
  data: {
    // ...
    message: validated.message ? encryptHealthData(validated.message) : null, // ✅ ENCRYPTED
    explicitHealthConsent: validated.explicitHealthConsent || false,
    healthConsentGivenAt: new Date(),
  }
})

// 3. Audit health data access
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    action: "HEALTH_DATA_CREATED",
    resource: "booking",
    resourceId: booking.id,
    ipAddress: hashIp(request.ip), // Anonymized
    metadata: {
      consentGiven: validated.explicitHealthConsent,
      dataLength: validated.message?.length || 0
    }
  }
})

// 4. Limit message field length (data minimization)
// lib/validations/booking.ts
message: z
  .string()
  .max(500, "Gesundheitsinformationen dürfen maximal 500 Zeichen haben") // ✅ Reduced from 1000
  .optional()
```

**Comparison with Industry Standards:**

| Platform | Health Data Handling | Encryption | GDPR Compliant |
|----------|---------------------|------------|----------------|
| **Doctolib** (medical appointments) | End-to-end encryption, ISO 27001 certified | ✅ AES-256 | ✅ Yes |
| **Jameda** (doctor reviews) | Encrypted at rest, GDPR-certified | ✅ AES-256 | ✅ Yes |
| **Massava (Current)** | ❌ Plain text in database | ❌ None | ❌ No |
| **Massava (Required)** | ✅ Encrypted at rest | ✅ AES-256-GCM | ✅ Yes |

**Regulatory Risk:** **HIGH** - Art. 9 violations can result in fines up to €20M or 4% of global revenue (Art. 83(5) GDPR).

---

### 3. Art. 13-14 - Privacy Policy (Transparency) ✅ PASS

**Rating: 7/10**

**What's Good:**
- ✅ Comprehensive privacy policy at `/datenschutz`
- ✅ Lists all data processing activities
- ✅ Names sub-processors (Hetzner, Resend, GlitchTip)
- ✅ Explains data subject rights (Art. 15-22)
- ✅ Contact info provided (datenschutz@massava.com)
- ✅ Linked from footer (accessibility)

**What's Missing:**
- ⚠️ References non-existent endpoints (`/api/user/export`, `/api/user/delete`)
- ⚠️ Missing data retention automation details
- ⚠️ Missing supervisory authority contact (placeholder text)
- ⚠️ Missing DPA/AVV status (Hetzner + Stripe agreements)

**Code Evidence:**
```tsx
// app/[locale]/datenschutz/page.tsx (lines 106-118)
<a href="/api/user/export" target="_blank"> {/* ❌ Does not exist */}
  → Daten exportieren (JSON-Format)
</a>

<a href="/api/user/delete" target="_blank"> {/* ❌ Does not exist */}
  → Konto löschen
</a>
```

**Recommendation:** Implement data export/deletion endpoints (see Art. 15-17 section below).

---

### 4. ePrivacy Directive - Cookie Consent ❌ FAIL

**Rating: 0/10** 🔴 **BLOCKER**

**Critical Gap:**
- ❌ **NO COOKIE CONSENT BANNER IMPLEMENTED**
- ❌ NextAuth session cookie set without prior consent
- ❌ No opt-in mechanism before tracking
- ❌ No cookie settings page

**Current Violation:**
```typescript
// auth.ts - Session cookie set immediately on authentication
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
// ❌ No consent check before setting cookie
```

**Privacy Policy Claims (Not Implemented):**
```tsx
// app/[locale]/datenschutz/page.tsx (lines 269-281)
<p>Sie können Ihre Cookie-Einstellungen jederzeit über das Cookie-Banner 
   am Seitenende ändern.</p> {/* ❌ Cookie banner does not exist! */}
```

**Required Implementation:**

**1. Cookie Banner Component**
```tsx
// components/CookieBanner.tsx
"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CookieBanner() {
  const [consent, setConsent] = useState<{
    essential: boolean
    analytics: boolean
    marketing: boolean
  } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent')
    if (stored) {
      setConsent(JSON.parse(stored))
    }
  }, [])

  if (consent !== null) return null

  const acceptAll = () => {
    const newConsent = { essential: true, analytics: true, marketing: false }
    localStorage.setItem('cookie-consent', JSON.stringify(newConsent))
    document.cookie = `cookie-consent=${JSON.stringify(newConsent)}; path=/; max-age=31536000; SameSite=Lax`
    setConsent(newConsent)
  }

  const acceptEssential = () => {
    const newConsent = { essential: true, analytics: false, marketing: false }
    localStorage.setItem('cookie-consent', JSON.stringify(newConsent))
    document.cookie = `cookie-consent=${JSON.stringify(newConsent)}; path=/; max-age=31536000; SameSite=Lax`
    setConsent(newConsent)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50">
      <div className="container mx-auto max-w-4xl">
        <h3 className="font-semibold mb-2">Cookie-Einstellungen</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Wir nutzen Cookies, um Ihnen die Nutzung unserer Website zu ermöglichen (essenziell) 
          und um unsere Website zu verbessern (optional).
        </p>
        
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked disabled />
            <span className="text-sm">Essenziell (erforderlich für Buchungen)</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="analytics" 
              onChange={(e) => {/* handle analytics */}}
            />
            <span className="text-sm">Analyse-Cookies (optional)</span>
          </label>
        </div>

        <div className="flex gap-4">
          <Button onClick={acceptAll}>Alle akzeptieren</Button>
          <Button onClick={acceptEssential} variant="outline">
            Nur essenzielle
          </Button>
          <Link href="/datenschutz" className="text-sm underline self-center">
            Datenschutzerklärung
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**2. Cookie Check Before Tracking**
```tsx
// app/[locale]/layout.tsx
import { CookieBanner } from '@/components/CookieBanner'
import { cookies } from 'next/headers'

export default function RootLayout({ children }) {
  const cookieConsent = cookies().get('cookie-consent')?.value
  const consent = cookieConsent ? JSON.parse(cookieConsent) : null

  return (
    <html>
      <body>
        {children}
        <CookieBanner />
        
        {/* Only load analytics if consented */}
        {consent?.analytics && (
          <Script src="https://analytics.massava.app/script.js" />
        )}
      </body>
    </html>
  )
}
```

**3. NextAuth Cookie Configuration**
```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  // ...
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? '.massava.app'  // ✅ Shared across subdomains
          : undefined
      }
    }
  }
})
```

**Regulatory Risk:** **HIGH** - ePrivacy Directive violations can result in warnings from data protection authorities and user trust damage.

---

### 5. Art. 15-22 - Data Subject Rights ❌ FAIL

**Rating: 2/10** 🔴 **BLOCKER**

**Critical Gaps:**
- ❌ **NO DATA EXPORT ENDPOINT** (Art. 15 - Right to Access)
- ❌ **NO ACCOUNT DELETION ENDPOINT** (Art. 17 - Right to Erasure)
- ❌ No data portability (Art. 20 - CSV/JSON export)
- ❌ No consent withdrawal UI (Art. 21 - Right to Object)

**Privacy Policy Claims (Not Implemented):**
```tsx
// app/[locale]/datenschutz/page.tsx
<a href="/api/user/export"> {/* ❌ 404 Not Found */}
  → Daten exportieren (JSON-Format)
</a>

<a href="/api/user/delete"> {/* ❌ 404 Not Found */}
  → Konto löschen
</a>
```

**Required Implementation:**

**1. Data Export Endpoint (Art. 15 + 20)**
```typescript
// app/api/user/export/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Gather all user data
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      newBookings: {
        select: {
          id: true,
          studioId: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          preferredDate: true,
          preferredTime: true,
          message: true, // Decrypted if encrypted
          status: true,
          createdAt: true,
        }
      },
      roles: true,
      ownedStudios: {
        include: {
          studio: {
            select: {
              id: true,
              name: true,
              address: true,
              createdAt: true,
            }
          }
        }
      },
      auditLogs: {
        select: {
          action: true,
          resource: true,
          resourceId: true,
          createdAt: true,
        }
      }
    }
  })

  // Remove password hash
  const { password, ...userDataWithoutPassword } = userData

  // Decrypt health data for export
  if (userData.newBookings) {
    userData.newBookings = userData.newBookings.map(booking => ({
      ...booking,
      message: booking.message ? decryptHealthData(booking.message) : null
    }))
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    dataSubject: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      primaryRole: userData.primaryRole,
      createdAt: userData.createdAt,
    },
    bookings: userData.newBookings,
    roles: userData.roles,
    ownedStudios: userData.ownedStudios,
    auditLogs: userData.auditLogs,
    gdprArticle: 'Art. 15 GDPR - Right to Access',
    format: 'JSON'
  }

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="massava-data-export-${userId}.json"`,
      'Content-Type': 'application/json'
    }
  })
}
```

**2. CSV Export (Art. 20 - Data Portability)**
```typescript
// app/api/user/export/csv/route.ts
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bookings = await prisma.newBooking.findMany({
    where: { customerId: session.user.id },
    select: {
      id: true,
      studio: { select: { name: true } },
      preferredDate: true,
      preferredTime: true,
      status: true,
      createdAt: true,
    }
  })

  const csv = [
    'Booking ID,Studio,Date,Time,Status,Created',
    ...bookings.map(b => 
      `${b.id},${b.studio.name},${b.preferredDate},${b.preferredTime},${b.status},${b.createdAt}`
    )
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="massava-bookings-${session.user.id}.csv"`
    }
  })
}
```

**3. Account Deletion Endpoint (Art. 17)**
```typescript
// app/api/user/delete/route.ts
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { hashUserId } from '@/lib/anonymization'

export async function POST() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Cascade delete all user data (transaction for atomicity)
    await prisma.$transaction([
      // Delete bookings
      prisma.newBooking.deleteMany({ where: { customerId: userId } }),
      
      // Delete studio ownerships
      prisma.studioOwnership.deleteMany({ where: { userId } }),
      
      // Delete roles
      prisma.userRoleAssignment.deleteMany({ where: { userId } }),
      
      // Delete sessions
      prisma.newSession.deleteMany({ where: { userId } }),
      
      // Delete user
      prisma.user.delete({ where: { id: userId } })
    ])

    // Log deletion for compliance (anonymized)
    await prisma.deletionLog.create({
      data: {
        deletedAt: new Date(),
        userIdHash: hashUserId(userId), // One-way hash (can't reverse)
        reason: 'User requested deletion (Art. 17 GDPR)',
        dataCategories: ['profile', 'bookings', 'roles', 'sessions']
      }
    })

    // Sign out user
    await signOut()

    return NextResponse.json({ 
      success: true, 
      message: 'Ihr Konto wurde erfolgreich gelöscht.' 
    })
  } catch (error) {
    console.error('Account deletion failed:', error)
    return NextResponse.json(
      { error: 'Löschung fehlgeschlagen. Bitte kontaktieren Sie datenschutz@massava.com' },
      { status: 500 }
    )
  }
}
```

**4. Deletion Log Schema**
```prisma
// Add to schema.prisma
model DeletionLog {
  id             String   @id @default(cuid())
  deletedAt      DateTime @default(now())
  userIdHash     String   // SHA-256 hash (for audit trail)
  reason         String   // "User requested deletion (Art. 17 GDPR)"
  dataCategories String[] // ["profile", "bookings", "health_data"]
  
  @@index([deletedAt])
  @@map("deletion_logs")
}
```

**5. Consent Withdrawal UI (Art. 21)**
```tsx
// app/[locale]/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="container py-12">
      <h1>Datenschutzeinstellungen</h1>

      <section>
        <h2>Ihre Rechte gemäß DSGVO</h2>

        {/* Art. 15 - Access */}
        <div className="border p-4 rounded">
          <h3>Daten exportieren (Art. 15 DSGVO)</h3>
          <p>Laden Sie alle Ihre gespeicherten Daten herunter.</p>
          <Button asChild>
            <a href="/api/user/export" target="_blank">
              JSON herunterladen
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/user/export/csv" target="_blank">
              CSV herunterladen
            </a>
          </Button>
        </div>

        {/* Art. 17 - Erasure */}
        <div className="border p-4 rounded">
          <h3>Konto löschen (Art. 17 DSGVO)</h3>
          <p>Alle Ihre Daten werden unwiderruflich gelöscht.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Konto löschen</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. 
                  Alle Ihre Daten werden permanent gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Ja, Konto löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Art. 21 - Object (Health Data Consent Withdrawal) */}
        <div className="border p-4 rounded">
          <h3>Einwilligung widerrufen (Art. 21 DSGVO)</h3>
          <p>Widerrufen Sie die Verarbeitung Ihrer Gesundheitsdaten.</p>
          <Switch
            checked={healthConsentActive}
            onCheckedChange={handleWithdrawHealthConsent}
          >
            Gesundheitsdaten-Verarbeitung aktiv
          </Switch>
          <p className="text-sm text-muted-foreground">
            Wenn Sie die Einwilligung widerrufen, werden Ihre Gesundheitsdaten 
            aus allen zukünftigen Buchungen entfernt. Bestehende Buchungen bleiben 
            bis zum Ablauf gespeichert.
          </p>
        </div>
      </section>
    </div>
  )
}
```

**Regulatory Risk:** **CRITICAL** - Failure to provide data subject rights can result in complaints to supervisory authorities.

---

### 6. Art. 25 - Privacy by Design ⚠️ PARTIAL

**Rating: 5/10**

**What's Good:**
- ✅ Role-based access control (RBAC)
- ✅ Audit logging schema exists
- ✅ JWT session strategy (no server-side state)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Rate limiting on authentication

**What's Missing:**
- ❌ **IP anonymization not implemented** (audit logs store full IP)
- ❌ No pseudonymization for health data
- ❌ No default privacy-friendly settings (e.g., analytics opt-out by default)
- ❌ No data retention automation (3-month deletion policy not enforced)

**Current Implementation:**
```typescript
// lib/logger.ts - IP stored without anonymization
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  ) // ❌ Full IP address stored
}

// AuditLog schema
model AuditLog {
  ipAddress  String? // ❌ NOT anonymized
}
```

**Required Implementation:**

**1. IP Anonymization**
```typescript
// lib/anonymization.ts
import { createHash } from 'crypto'

/**
 * Anonymize IP address by removing last octet (IPv4) or last 80 bits (IPv6)
 * Art. 25 GDPR - Privacy by Design
 */
export function anonymizeIp(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown'

  // IPv4: Remove last octet (e.g., 192.168.1.100 -> 192.168.1.0)
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.')
    parts[3] = '0'
    return parts.join('.')
  }

  // IPv6: Remove last 80 bits (keep first 48 bits)
  if (ip.includes(':')) {
    const parts = ip.split(':')
    return parts.slice(0, 3).join(':') + '::0'
  }

  return 'unknown'
}

/**
 * One-way hash for user IDs in deletion logs
 * Can't reverse, but can verify if needed
 */
export function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex')
}
```

**2. Update Audit Logging**
```typescript
// lib/logger.ts
import { anonymizeIp } from './anonymization'

export function getClientIP(request: NextRequest): string {
  const fullIp = (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
  return anonymizeIp(fullIp) // ✅ Anonymized before storage
}
```

**3. Data Retention Automation**
```typescript
// lib/cron/data-retention.ts
import { prisma } from '@/lib/prisma'

/**
 * Delete bookings older than 3 months (GDPR Art. 5(1)(e) - Storage Limitation)
 * Run daily via cron job
 */
export async function cleanupOldBookings() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const deleted = await prisma.newBooking.deleteMany({
    where: {
      createdAt: { lt: threeMonthsAgo },
      status: { in: ['CONFIRMED', 'CANCELLED'] }
    }
  })

  console.log(`[GDPR] Deleted ${deleted.count} old bookings (>3 months)`)
  
  return deleted.count
}

/**
 * Delete inactive accounts after 3 years
 * Send email notification 30 days before deletion
 */
export async function cleanupInactiveAccounts() {
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Find users notified 30 days ago
  const usersToDelete = await prisma.user.findMany({
    where: {
      lastLoginAt: { lt: threeYearsAgo },
      deletionNoticeSentAt: { lt: thirtyDaysAgo }
    }
  })

  // Delete users
  for (const user of usersToDelete) {
    await prisma.$transaction([
      prisma.newBooking.deleteMany({ where: { customerId: user.id } }),
      prisma.user.delete({ where: { id: user.id } })
    ])
    console.log(`[GDPR] Deleted inactive user: ${user.email}`)
  }

  return usersToDelete.length
}
```

**4. Cron Job Configuration**
```typescript
// app/api/cron/data-retention/route.ts
import { cleanupOldBookings, cleanupInactiveAccounts } from '@/lib/cron/data-retention'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bookingsDeleted = await cleanupOldBookings()
    const accountsDeleted = await cleanupInactiveAccounts()

    return NextResponse.json({
      success: true,
      bookingsDeleted,
      accountsDeleted,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[GDPR Cron] Error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
```

**5. Vercel Cron Configuration**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/data-retention",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

### 7. Art. 28 - Data Processing Agreements (AVV/DPA) ⚠️ PARTIAL

**Rating: 5/10**

**What's Good:**
- ✅ Privacy policy lists all sub-processors (Hetzner, Resend, GlitchTip)
- ✅ EU-based hosting (Hetzner Germany)
- ✅ Self-hosted analytics (Umami) - no DPA needed

**What's Missing:**
- ⚠️ **No documentation of signed Hetzner AVV**
- ⚠️ Resend DPA mentioned but not confirmed as signed
- ⚠️ No AVV status tracker

**Required Sub-Processors:**

| Sub-Processor | Service | Location | AVV/DPA Required | Status | Evidence |
|---------------|---------|----------|------------------|--------|----------|
| **Hetzner Online GmbH** | Hosting | Germany (EU) | ✅ Yes | ⚠️ Unknown | [Download AVV](https://www.hetzner.com/assets/Uploads/downloads/AVV-Auftragsverarbeitung-MIT-Konzernklausel.pdf) |
| **Resend Inc.** | Email | USA (EU processing) | ✅ Yes | ⚠️ Unknown | [Resend DPA](https://resend.com/legal/dpa) |
| **GlitchTip** | Error Tracking | Self-hosted (Hetzner) | ❌ No | ✅ N/A | Covered by Hetzner AVV |
| **Umami Analytics** | Analytics | Self-hosted (Hetzner) | ❌ No | ✅ N/A | Covered by Hetzner AVV |

**Action Items:**

1. **Sign Hetzner AVV:**
   - Download: https://www.hetzner.com/legal/avv
   - Fill out company details
   - Sign and send to Hetzner
   - Store signed copy in `/docs/gdpr/avv/hetzner-avv-signed.pdf`

2. **Accept Resend DPA:**
   - Login to Resend Dashboard
   - Navigate to Settings > Data Processing Addendum
   - Review and accept
   - Screenshot confirmation, store in `/docs/gdpr/dpa/resend-dpa-accepted.png`

3. **Document in Privacy Policy:**
```tsx
// Update app/[locale]/datenschutz/page.tsx
<div className="border p-4 rounded-lg">
  <h3 className="font-semibold">Hetzner Online GmbH</h3>
  <p><strong>AVV:</strong> Geschlossen am 04.11.2025 ✅</p>
  <a href="/gdpr/avv/hetzner-avv-signed.pdf" target="_blank">
    → AVV-Dokumentation einsehen
  </a>
</div>
```

4. **Create AVV/DPA Tracker:**
```typescript
// lib/gdpr/sub-processors.ts
export const subProcessors = [
  {
    name: 'Hetzner Online GmbH',
    service: 'Server-Hosting',
    location: 'Deutschland (Falkenstein/Nürnberg)',
    avvRequired: true,
    avvStatus: 'signed',
    avvDate: '2025-11-04',
    avvDocument: '/docs/gdpr/avv/hetzner-avv-signed.pdf',
    contact: 'support@hetzner.com',
    privacyPolicy: 'https://www.hetzner.com/rechtliches/datenschutz'
  },
  {
    name: 'Resend Inc.',
    service: 'E-Mail-Versand',
    location: 'USA (EU-Datenverarbeitung)',
    avvRequired: true,
    avvStatus: 'accepted',
    avvDate: '2025-11-04',
    avvDocument: 'https://resend.com/legal/dpa',
    standardContractualClauses: true,
    contact: 'support@resend.com',
    privacyPolicy: 'https://resend.com/legal/privacy-policy'
  }
]
```

---

### 8. Art. 32 - Security of Processing ✅ PASS

**Rating: 7/10**

**What's Good:**
- ✅ **bcrypt with 12 rounds** (strong password hashing)
- ✅ **Comprehensive security headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- ✅ **Rate limiting** on authentication (5 attempts/15min)
- ✅ **JWT session strategy** (no server-side session storage risk)
- ✅ **TLS/HTTPS enforced** (HSTS header)
- ✅ **No npm vulnerabilities** (clean audit)

**What's Missing:**
- ❌ **No encryption for health data** (Art. 9 violation)
- ⚠️ Database connection SSL not explicitly configured
- ⚠️ No automated security scanning in CI/CD
- ⚠️ No penetration testing schedule

**Code Evidence:**

**1. Password Hashing (✅ Compliant)**
```typescript
// app/[locale]/api/auth/register/route.ts
const BCRYPT_ROUNDS = 12; // ✅ Art. 32 compliant

const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

**2. Security Headers (✅ Compliant)**
```typescript
// next.config.ts (lines 33-66)
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://errors.rnltlabs.de https://glitchtip.rnltlabs.de https://photon.komoot.io",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ]
}
```

**3. Rate Limiting (✅ Compliant)**
```typescript
// lib/rate-limit.ts
export function authRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
}

export function bookingRateLimit(identifier: string): RateLimitResult {
  return rateLimit(identifier, 10, 60 * 60 * 1000); // 10 requests per hour
}
```

**Required Improvements:**

**1. Database SSL/TLS**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  sslmode  = "require" // ✅ Enforce SSL/TLS for database connection
}
```

**2. Environment Variable for SSL**
```env
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

**3. Automated Security Scanning (GitHub Actions)**
```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 1' # Weekly Monday 2am

jobs:
  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm audit --audit-level=moderate
      
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/dependency-review-action@v3
```

---

### 9. Art. 33-34 - Breach Notification ⚠️ PARTIAL

**Rating: 3/10**

**What's Good:**
- ✅ Error tracking configured (GlitchTip)
- ✅ Audit logging exists

**What's Missing:**
- ❌ **No documented incident response plan**
- ❌ No breach notification procedure
- ❌ No supervisory authority contact documented
- ❌ No breach notification templates
- ❌ No breach register/log

**Required Implementation:**

**1. Incident Response Plan Document**
```markdown
# Data Breach Response Plan (Art. 33-34 GDPR)

## 1. Detection
- GlitchTip monitors application errors
- Database audit logs reviewed weekly
- Security headers prevent common attacks

## 2. Assessment (within 24 hours)
- Determine if breach affects personal data
- Assess risk to user rights and freedoms
- Document breach details:
  - Nature of breach (unauthorized access, data leak, etc.)
  - Affected data categories (emails, passwords, health data)
  - Number of affected users
  - Potential consequences (identity theft, discrimination, etc.)

## 3. Notification to Supervisory Authority (within 72 hours)

**Contact:**
Landesbeauftragter für Datenschutz und Informationsfreiheit Baden-Württemberg
Email: poststelle@lfdi.bwl.de
Phone: +49 711 615541-0

**Report must include (Art. 33(3)):**
- Nature of breach
- Data protection officer contact: datenschutz@massava.com
- Likely consequences
- Measures taken/proposed

## 4. Notification to Data Subjects (if high risk)

**Method:** Email notification

**Template:**
Subject: Wichtige Sicherheitsinformation zu Ihrem Massava-Konto

Sehr geehrte/r [Name],

wir informieren Sie über einen Sicherheitsvorfall vom [Datum],
der möglicherweise Ihre personenbezogenen Daten betroffen hat.

Art des Vorfalls: [Description]
Betroffene Daten: [Data categories]
Betroffene Nutzer: [Number]

Maßnahmen: [What we did]
Ihre Handlung: [What user should do]

Kontakt: datenschutz@massava.com

Mit freundlichen Grüßen,
RNLT Labs Datenschutzbeauftragter
```

**2. Breach Register Schema**
```prisma
// Add to schema.prisma
model BreachLog {
  id                String   @id @default(cuid())
  detectedAt        DateTime @default(now())
  reportedAt        DateTime? // When reported to authority

  // Breach details
  description       String   @db.Text
  affectedUsers     Int
  dataCategories    String[] // ["email", "health_data"]

  // Risk assessment
  riskLevel         String   // "low" | "medium" | "high"
  notificationSent  Boolean  @default(false)

  // Authority notification
  authorityNotified Boolean  @default(false)
  authorityResponse String?  @db.Text

  // Resolution
  resolvedAt        DateTime?
  measures          String   @db.Text
  
  @@map("breach_logs")
}
```

---

### 10. Subdomain Cookie Configuration ⚠️ PARTIAL

**Rating: 4/10**

**Current Implementation:**
- ❌ No explicit cookie domain configuration in NextAuth
- ❌ Relies on browser default behavior
- ❌ No testing of cookie isolation between subdomains

**Required Configuration:**

```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  // ...existing config
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // ✅ CRITICAL: Explicit domain configuration
        domain: process.env.NODE_ENV === 'production' 
          ? getDomainForCookie() // Returns 'massava.app' or 'business.massava.app'
          : undefined // localhost doesn't support domain
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? getDomainForCookie()
          : undefined
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Note: __Host- prefix requires NO domain attribute
      }
    }
  }
})

/**
 * Get domain for cookie based on current request
 * Customer portal: massava.app
 * Business portal: business.massava.app
 */
function getDomainForCookie(): string {
  const url = process.env.NEXTAUTH_URL || ''
  
  if (url.includes('business.massava.app')) {
    return 'business.massava.app'
  }
  
  return 'massava.app'
}
```

**Environment Variables:**
```env
# Customer portal
NEXTAUTH_URL=https://massava.app
NEXTAUTH_COOKIE_DOMAIN=massava.app

# Business portal
NEXTAUTH_URL=https://business.massava.app
NEXTAUTH_COOKIE_DOMAIN=business.massava.app
```

**Testing Checklist:**
- [ ] Customer logs in on `massava.app` → cookie domain = `massava.app`
- [ ] Customer cannot access `business.massava.app` with customer session
- [ ] Studio owner logs in on `business.massava.app` → cookie domain = `business.massava.app`
- [ ] Studio owner cannot access customer bookings on `massava.app`
- [ ] Cookies are NOT shared between subdomains
- [ ] Browser dev tools confirm separate cookie domains

---

## OWASP TOP 10 COMPLIANCE

### A01:2021 - Broken Access Control ✅ PASS

**Rating: 8/10**

- ✅ Role-based access control (RBAC) implemented
- ✅ Server-side checks on all protected routes
- ✅ UserRole enum (CUSTOMER, STUDIO_OWNER, SUPER_ADMIN, GUEST)
- ⚠️ No middleware-level route protection (manual per-route)

### A02:2021 - Cryptographic Failures ⚠️ PARTIAL

**Rating: 5/10**

- ✅ bcrypt with 12 rounds
- ✅ HTTPS enforced (HSTS)
- ✅ JWT session strategy
- ❌ **Health data not encrypted at rest** (critical gap)

### A03:2021 - Injection ✅ PASS

**Rating: 9/10**

- ✅ Prisma ORM (prevents SQL injection)
- ✅ No raw SQL queries (`$queryRaw` not used)
- ✅ Zod validation on all inputs

### A04:2021 - Insecure Design ✅ PASS

**Rating: 7/10**

- ✅ Rate limiting on authentication
- ✅ Rate limiting on bookings
- ⚠️ No account lockout after failed attempts
- ⚠️ No CAPTCHA on public forms

### A05:2021 - Security Misconfiguration ✅ PASS

**Rating: 8/10**

- ✅ Comprehensive security headers
- ✅ CSP configured
- ✅ HSTS enabled
- ⚠️ CSP allows `unsafe-inline` (Next.js limitation)

### A06:2021 - Vulnerable Components ✅ PASS

**Rating: 10/10**

- ✅ **No npm vulnerabilities** (clean audit)
- ✅ NextAuth.js v5 (latest beta)
- ✅ Next.js 15.5.6 (latest)

### A07:2021 - Authentication Failures ✅ PASS

**Rating: 7/10**

- ✅ Strong password requirements (Zod validation)
- ✅ Session timeout (30 days)
- ✅ Rate limiting on login
- ⚠️ No MFA support

### A08:2021 - Data Integrity Failures ✅ PASS

**Rating: 8/10**

- ✅ Dependencies from npm registry (trusted source)
- ✅ package-lock.json committed
- ⚠️ No SRI for CDN resources (none used)

### A09:2021 - Security Logging Failures ⚠️ PARTIAL

**Rating: 6/10**

- ✅ Audit logging schema exists
- ✅ GlitchTip error tracking
- ❌ IP addresses not anonymized
- ⚠️ Incomplete audit logging coverage

### A10:2021 - SSRF ✅ PASS

**Rating: 9/10**

- ✅ No user-controlled URL fetching
- ✅ External API calls limited (Photon geocoding)

**Overall OWASP Top 10 Compliance: 7.7/10 (77%)** ✅

---

## COMPARISON WITH INDUSTRY STANDARDS

### Doctolib (Medical Appointments)

| Feature | Doctolib | Massava (Current) | Massava (Required) |
|---------|----------|-------------------|--------------------|
| **Health Data Encryption** | ✅ End-to-end | ❌ Plain text | ✅ AES-256-GCM |
| **ISO 27001 Certified** | ✅ Yes | ❌ No | ⚠️ Consider |
| **Cookie Consent** | ✅ GDPR-compliant banner | ❌ None | ✅ Required |
| **Data Export** | ✅ JSON + PDF | ❌ Not implemented | ✅ JSON + CSV |
| **MFA Support** | ✅ SMS + Authenticator | ❌ None | ⚠️ Optional |
| **Breach Notification** | ✅ Documented plan | ❌ None | ✅ Required |

### Jameda (Doctor Reviews)

| Feature | Jameda | Massava (Current) | Massava (Required) |
|---------|--------|-------------------|--------------------|
| **AVV Documentation** | ✅ Public | ⚠️ Not confirmed | ✅ Required |
| **Privacy Policy** | ✅ Comprehensive | ✅ Comprehensive | ✅ Already good |
| **Cookie Consent** | ✅ Granular opt-in | ❌ None | ✅ Required |
| **Data Retention** | ✅ Automated | ❌ Manual | ✅ Automated |
| **Audit Trail** | ✅ IP anonymized | ❌ Full IP | ✅ Anonymized |

**Massava's Competitive Position:** Currently **below industry standard** for health data platforms. With required improvements, would be **on par** with industry leaders.

---

## CERTIFICATION READINESS

### Is This Architecture Audit-Ready?

**Answer: NO** ❌

**Blocking Issues Before Audit:**

1. 🔴 **Encrypt Art. 9 health data** (AES-256-GCM)
2. 🔴 **Implement cookie consent** (ePrivacy Directive)
3. 🔴 **Implement data export endpoints** (Art. 15 GDPR)
4. 🔴 **Implement account deletion endpoint** (Art. 17 GDPR)
5. 🔴 **Sign and document Hetzner AVV** (Art. 28 GDPR)
6. 🔴 **Anonymize IP addresses** (Art. 25 GDPR)

**Time to Audit-Ready:** **2-3 weeks** (full-time development)

### Certification Options

**1. GDPR Compliance Audit (€5,000-15,000)**
- External audit by certified data protection officer
- Compliance report + recommendations
- **Recommended for:** Pre-launch validation

**2. ISO 27001 Certification (€20,000-50,000)**
- Information security management system
- Annual recertification required
- **Recommended for:** Scaling to enterprise clients

**3. German Cloud Computing Compliance (C5)**
- BSI (German Federal Office for Information Security) standard
- Required for public sector clients
- **Recommended for:** Government/healthcare clients

---

## REQUIRED IMPROVEMENTS FOR 10/10 RATING

### Immediate (Before Launch) 🔴

**Priority 1: Art. 9 Health Data Encryption**
- [ ] Implement AES-256-GCM encryption for `message` field
- [ ] Add `HEALTH_DATA_ENCRYPTION_KEY` to environment variables
- [ ] Decrypt only for authorized users (customer + therapist)
- [ ] Audit log every health data access
- **Effort:** 2-3 days
- **Risk if skipped:** CRITICAL - Art. 9 violation, up to €20M fine

**Priority 2: Cookie Consent Banner**
- [ ] Implement cookie consent UI component
- [ ] Store consent in cookie + localStorage
- [ ] Only load analytics after consent
- [ ] Provide `/cookie-einstellungen` settings page
- **Effort:** 1-2 days
- **Risk if skipped:** HIGH - ePrivacy violation, user trust damage

**Priority 3: Data Subject Rights**
- [ ] Implement `/api/user/export` (JSON)
- [ ] Implement `/api/user/export/csv` (CSV)
- [ ] Implement `/api/user/delete` (account deletion)
- [ ] Add consent withdrawal UI
- **Effort:** 2-3 days
- **Risk if skipped:** HIGH - Art. 15-17 violation, complaints to authority

**Priority 4: IP Anonymization**
- [ ] Create `anonymizeIp()` function
- [ ] Update audit logging to anonymize IPs
- [ ] Update rate limiting to use anonymized IPs
- **Effort:** 0.5 days
- **Risk if skipped:** MEDIUM - Art. 25 violation

**Priority 5: AVV Documentation**
- [ ] Sign Hetzner AVV
- [ ] Accept Resend DPA
- [ ] Document in `/docs/gdpr/avv/`
- [ ] Update privacy policy with AVV status
- **Effort:** 0.5 days (admin work)
- **Risk if skipped:** MEDIUM - Art. 28 violation

**Total Effort: 6-9 days**

### Short-Term (Within 1 Month) 🟡

**Priority 6: Data Retention Automation**
- [ ] Implement cron job for 3-month booking deletion
- [ ] Implement 3-year inactive account cleanup
- [ ] Add email notification 30 days before deletion
- **Effort:** 1-2 days

**Priority 7: Breach Notification Plan**
- [ ] Document incident response procedure
- [ ] Create breach register schema
- [ ] Add breach notification templates
- **Effort:** 1 day

**Priority 8: Enhanced Audit Logging**
- [ ] Log all health data accesses
- [ ] Log consent withdrawals
- [ ] Log data exports/deletions
- **Effort:** 1 day

**Priority 9: Cookie Domain Configuration**
- [ ] Explicitly configure NextAuth cookie domains
- [ ] Test cookie isolation between subdomains
- [ ] Document cookie behavior in security docs
- **Effort:** 1 day

**Total Effort: 4-5 days**

### Long-Term (Nice-to-Have) 🟢

**Priority 10: MFA Support**
- [ ] Implement 2FA with authenticator apps
- [ ] SMS-based OTP (optional)
- **Effort:** 3-5 days

**Priority 11: Security Audits**
- [ ] Automated security scanning in CI/CD
- [ ] Quarterly penetration testing
- **Effort:** Ongoing

**Priority 12: ISO 27001 Certification**
- [ ] Engage certification body
- [ ] Implement ISMS (Information Security Management System)
- **Effort:** 3-6 months

---

## SUBDOMAIN ARCHITECTURE: FINAL VERDICT

### Does Subdomain Separation Solve GDPR Compliance?

**Answer: NO - But it's a good foundation.**

**What Subdomain Separation Provides:**
- ✅ Clear role separation (customers vs business)
- ✅ Session isolation (customers can't access business portal)
- ✅ Reduced attack surface (separate entry points)
- ✅ Easier to audit (clear data flows)

**What Subdomain Separation DOES NOT Provide:**
- ❌ Encryption for sensitive data (must be implemented separately)
- ❌ Cookie consent compliance (must be implemented separately)
- ❌ Data subject rights (export/deletion endpoints needed)
- ❌ IP anonymization (must be implemented separately)
- ❌ AVV/DPA documentation (administrative work needed)

**Is Subdomain Architecture REQUIRED for GDPR Compliance?**

**Answer: NO** - Single domain with role-based access would also be compliant IF:
- Health data is encrypted ✅
- Cookie consent implemented ✅
- Data subject rights implemented ✅
- Proper access controls ✅

**Benefits of Subdomain Architecture:**
- ✅ **Defense in Depth** (multiple layers of isolation)
- ✅ **Clear Separation of Concerns** (easier to audit)
- ✅ **Reduced Risk** (breach in customer portal doesn't expose business portal)
- ✅ **Better UX** (business users get dedicated portal)

**Recommendation:** **PROCEED with subdomain architecture** but understand it's a **UX and security enhancement**, not a GDPR compliance silver bullet. The critical compliance work (encryption, consent, data rights) is still required regardless of domain structure.

---

## RECOMMENDATIONS

### Immediate Actions (Before Launch)

1. **Encrypt health data** (AES-256-GCM) - CRITICAL
2. **Implement cookie consent banner** - CRITICAL
3. **Implement data export/deletion endpoints** - CRITICAL
4. **Anonymize IP addresses** - HIGH
5. **Sign Hetzner AVV** - HIGH

### Architecture Recommendations

1. **Keep subdomain architecture** - Good for security and UX
2. **Add field-level encryption** for Art. 9 data
3. **Implement middleware-level route guards** (currently manual per-route)
4. **Add re-authentication for health data access** (extra security layer)

### Process Recommendations

1. **Engage a certified data protection officer** for external audit
2. **Create GDPR compliance checklist** for all new features
3. **Implement automated compliance checks** in CI/CD
4. **Schedule quarterly security reviews**

### Documentation Recommendations

1. **Create `/docs/gdpr/` directory** with all compliance docs
2. **Document all AVV/DPA agreements** with signed PDFs
3. **Create incident response runbook**
4. **Maintain sub-processor list** (update on every new service)

---

## CONCLUSION

### GDPR Compliance Rating: **6.5/10** ⚠️

**Status:** **AMBER - SIGNIFICANT GAPS REQUIRING REMEDIATION**

The proposed subdomain architecture (`massava.app` vs `business.massava.app`) is a **good security and UX enhancement** but **NOT sufficient for GDPR compliance on its own**. The architecture provides session isolation and clear role separation, but **critical compliance measures are missing**:

**CRITICAL BLOCKERS (Must Fix Before Launch):**
1. 🔴 **Art. 9 health data not encrypted** (AES-256-GCM required)
2. 🔴 **No cookie consent implementation** (ePrivacy Directive violation)
3. 🔴 **No data export/deletion endpoints** (Art. 15-17 GDPR)
4. 🔴 **IP addresses not anonymized** (Art. 25 GDPR)
5. 🔴 **Hetzner AVV not documented** (Art. 28 GDPR)

**Effort to 10/10 Compliance:** **10-14 days** (full-time development + admin work)

**Audit Readiness:** **NO** - Requires 2-3 weeks of focused compliance work before external audit

**Comparison to Industry Standards (Doctolib, Jameda):** Currently **below standard** for health data platforms. With required improvements, would be **on par** with industry leaders.

**Recommended Path Forward:**
1. ✅ **PROCEED with subdomain architecture** (good foundation)
2. 🔴 **Immediately implement critical blockers** (health data encryption, cookie consent, data rights)
3. 🟡 **Schedule external GDPR audit** after implementing blockers
4. 🟢 **Consider ISO 27001 certification** for enterprise credibility

**Final Verdict on Subdomain Architecture:** **APPROVED with conditions**. The architecture is sound from a security perspective, but must be combined with proper encryption, consent management, and data subject rights implementation to achieve full GDPR compliance.

---

**Report Generated:** November 4, 2025  
**Next Review:** After implementing critical blockers (estimated 2-3 weeks)  
**Auditor:** Security & Privacy Auditor Agent  
**Classification:** Internal Use Only  

---

**Appendix A: Compliance Checklist**

- [ ] Art. 9 health data encrypted (AES-256-GCM)
- [ ] Cookie consent banner implemented
- [ ] Data export endpoint (`/api/user/export`)
- [ ] Account deletion endpoint (`/api/user/delete`)
- [ ] IP anonymization in audit logs
- [ ] Hetzner AVV signed and documented
- [ ] Resend DPA accepted
- [ ] Data retention automation (cron jobs)
- [ ] Breach notification plan documented
- [ ] Cookie domains explicitly configured
- [ ] External GDPR audit completed
- [ ] Privacy policy updated with AVV status
- [ ] `/docs/gdpr/` documentation complete

**Compliance Score After Implementing Checklist:** **9.5/10** ✅

