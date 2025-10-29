# Massava Authentication & RBAC Strategy

**Version:** 1.0
**Date:** 2025-10-27
**Status:** Approved for Implementation
**Timeline:** 6 weeks to production-ready

---

## Executive Summary

This document outlines the comprehensive authentication and authorization strategy for Massava, a multilingual booking platform connecting customers with massage studios across 7 languages (DE, EN, TH, ZH, VI, PL, RU).

### Current State
- **Security Score:** 3.5/10 ⚠️ NOT production-ready
- **GDPR Compliance:** 2/10 🚨 Critical violations
- **Architecture:** Separate `StudioOwner` and `Customer` tables
- **Auth:** NextAuth.js v5 (beta) with basic credentials + Google OAuth

### Target State
- **Security Score:** 8/10 ✅ Production-ready
- **GDPR Compliance:** 9/10 ✅ Fully compliant
- **Architecture:** Unified User Model with RBAC
- **Auth:** Passwordless guest booking + optional password upgrade

---

## 1. Core Strategy: "Passwordless Guest Booking"

### 1.1 The Concept

**User Experience:** Guest checkout with automatic account creation
**Backend Reality:** Passwordless accounts with email-based magic links
**Progressive Profiling:** Optional password and phone number collected over time

### 1.2 Key Principles

1. **Low Friction:** No registration wall, book immediately
2. **GDPR Compliant:** Transparent account creation with user consent
3. **Secure:** Magic links with industry-standard security practices
4. **Scalable:** Foundation for future features (favorites, reviews, team management)

---

## 2. Booking Flow

### 2.1 First-Time User Journey

```
1. User browses studios (unauthenticated - GUEST role)
   ↓
2. Clicks "Termin buchen" on studio page
   ↓
3. Booking form appears (NO registration wall):
   ┌─────────────────────────────────────────┐
   │ 📝 Terminbuchung                        │
   │                                         │
   │ Name *          [________________]      │
   │ E-Mail *        [________________]      │
   │ Telefon         [________________]      │
   │                 (Optional: Für SMS-     │
   │                  Erinnerungen)          │
   │                                         │
   │ Datum/Uhrzeit * [________________]      │
   │ Service *       [Thai Massage 60min ▼] │
   │                                         │
   │ Nachricht       [________________]      │
   │ (Optional)      [________________]      │
   │                                         │
   │ {IF message filled:}                    │
   │ ☐ Ich willige ausdrücklich ein, dass   │
   │   meine Gesundheitsdaten... (Art. 9)   │
   │                                         │
   │ 💡 Hinweis: Wir erstellen für Sie ein  │
   │    Konto, damit Sie Ihre Buchung       │
   │    verwalten können. Sie erhalten      │
   │    einen Link per E-Mail.              │
   │                                         │
   │ ☐ Ich akzeptiere die Datenschutz-      │
   │   erklärung und AGB                    │
   │                                         │
   │ [Jetzt buchen]                          │
   └─────────────────────────────────────────┘
   ↓
4. Backend creates passwordless User account:
   - email (required)
   - name (required)
   - phone (optional)
   - password: NULL
   - role: CUSTOMER
   - emailVerified: NULL (pending)
   ↓
5. Booking created and linked to User
   ↓
6. Confirmation email sent:
   ┌─────────────────────────────────────────┐
   │ ✅ Buchung bestätigt!                   │
   │                                         │
   │ Thai Massage 60min                      │
   │ Studio: Wellness Oase                   │
   │ Datum: 15.11.2025, 14:00               │
   │                                         │
   │ [Termin verwalten] ← Magic Link        │
   │ (Gültig für 15 Minuten)                │
   │                                         │
   │ ─────────────────────────────────────  │
   │                                         │
   │ 💡 Tipp: Passwort setzen für           │
   │    schnelleren Zugriff                 │
   │                                         │
   │ Mit einem Passwort können Sie:         │
   │ • Schneller nachbuchen                 │
   │ • Favoriten-Studios speichern          │
   │ • Buchungshistorie einsehen            │
   │                                         │
   │ [Passwort erstellen]                    │
   │                                         │
   │ ─────────────────────────────────────  │
   │                                         │
   │ 📱 SMS-Erinnerungen aktivieren?        │
   │                                         │
   │ Fügen Sie Ihre Telefonnummer hinzu     │
   │ für SMS-Erinnerungen (98% Öffnungs-    │
   │ rate vs. 20% E-Mail)                   │
   │                                         │
   │ [Telefon hinzufügen]                    │
   └─────────────────────────────────────────┘
   ↓
7. User clicks magic link → booking management page
   - View booking details
   - Cancel booking
   - Add phone number
   - Set password (optional)
```

### 2.2 Returning User Journey

**Option A: User with Password (Upgraded Account)**
```
1. Click "Termin buchen"
   ↓
2. See "Bereits registriert? [Einloggen]"
   ↓
3. Login with email + password (or Google OAuth)
   ↓
4. Booking form pre-filled with saved data
   ↓
5. One-click booking
```

**Option B: Passwordless User (Email-Based)**
```
1. Click "Termin buchen"
   ↓
2. Enter email
   ↓
3. System detects existing account
   ↓
4. "Magic Link per E-Mail gesendet"
   ↓
5. Click magic link → authenticated
   ↓
6. Booking form pre-filled
```

---

## 3. Role-Based Access Control (RBAC)

### 3.1 Role Hierarchy (MVP)

```typescript
enum UserRole {
  SUPER_ADMIN      // Platform owner (Roman) - full access
  STUDIO_OWNER     // Studio owners - manage own studios
  CUSTOMER         // End users - book massages
  GUEST            // Unauthenticated - browse only
}
```

### 3.2 Permission Matrix

| Feature | SUPER_ADMIN | STUDIO_OWNER | CUSTOMER | GUEST |
|---------|-------------|--------------|----------|-------|
| **Platform Management** |
| View all studios | ✅ | ❌ | ❌ | ❌ |
| Suspend/delete any studio | ✅ | ❌ | ❌ | ❌ |
| View all users | ✅ | ❌ | ❌ | ❌ |
| Platform analytics | ✅ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |
| **Studio Management** |
| Create studio | ✅ | ✅ | ❌ | ❌ |
| Edit own studio | ✅ | ✅ | ❌ | ❌ |
| Delete own studio | ✅ | ✅ | ❌ | ❌ |
| View any studio (public) | ✅ | ✅ | ✅ | ✅ |
| **Bookings** |
| View all bookings | ✅ | ❌ | ❌ | ❌ |
| View studio bookings | ✅ | ✅ (own) | ❌ | ❌ |
| Create booking | ✅ | ✅ | ✅ | ❌ |
| View own bookings | ✅ | ✅ | ✅ | ❌ |
| Cancel own booking | ✅ | ✅ | ✅ | ❌ |
| Confirm booking | ✅ | ✅ (own studios) | ❌ | ❌ |
| **Services** |
| Create service | ✅ | ✅ (own studio) | ❌ | ❌ |
| View services | ✅ | ✅ | ✅ | ✅ |
| **User Management** |
| Export own data | ✅ | ✅ | ✅ | ❌ |
| Delete own account | ✅ | ✅ | ✅ | ❌ |

### 3.3 Post-MVP Roles (Future)

```typescript
enum UserRole {
  // ... MVP roles
  PLATFORM_MODERATOR  // Customer support team (view-only access)
  STUDIO_MANAGER      // Secondary owner/manager (invited by owner)
  STUDIO_EMPLOYEE     // Staff members (limited access)
}
```

---

## 4. Database Architecture

### 4.1 Unified User Model

**Current Problem:**
- Separate `StudioOwner` and `Customer` tables
- User cannot be both customer AND owner
- OAuth only for StudioOwners
- No team management possible

**Solution: Unified User Model**

```prisma
// ============================================
// Core User Model
// ============================================

enum UserRole {
  SUPER_ADMIN
  STUDIO_OWNER
  CUSTOMER
  GUEST
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime? // NULL until magic link clicked
  password      String?   // NULL = passwordless account
  name          String?
  phone         String?   // Optional, collected progressively
  image         String?

  // Primary role (users can have multiple via UserRoleAssignment)
  primaryRole   UserRole  @default(CUSTOMER)

  // Account status
  isActive      Boolean   @default(true)
  isSuspended   Boolean   @default(false)

  // Relations
  accounts      Account[]           // OAuth accounts
  sessions      Session[]           // Active sessions
  roles         UserRoleAssignment[] // Multiple roles possible
  ownedStudios  StudioOwnership[]   // Studio ownership records
  bookings      Booking[]           // All bookings
  favorites     Studio[]   @relation("CustomerFavorites")

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([primaryRole])
  @@map("users")
}

// ============================================
// RBAC - Multiple Roles per User
// ============================================

model UserRoleAssignment {
  id        String   @id @default(cuid())
  userId    String
  role      UserRole

  // Optional: Role can be scoped to specific resource
  studioId  String?  // If role is scoped to a studio

  // Audit trail
  grantedBy String?  // Who granted this role
  grantedAt DateTime @default(now())
  expiresAt DateTime? // Optional: time-limited roles

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  studio    Studio?  @relation(fields: [studioId], references: [id], onDelete: Cascade)

  @@unique([userId, role, studioId])
  @@index([userId])
  @@index([studioId])
  @@map("user_role_assignments")
}

// ============================================
// Studio Ownership - Multiple Owners per Studio
// ============================================

model StudioOwnership {
  id        String   @id @default(cuid())
  userId    String
  studioId  String

  // Ownership details
  isPrimary Boolean  @default(false) // Primary owner has special privileges
  canTransfer Boolean @default(false) // Can transfer ownership

  // Team invitation (future)
  invitedBy String?
  invitedAt DateTime @default(now())
  acceptedAt DateTime?

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  studio    Studio   @relation(fields: [studioId], references: [id], onDelete: Cascade)

  @@unique([userId, studioId])
  @@index([userId])
  @@index([studioId])
  @@map("studio_ownership")
}

// ============================================
// Magic Link Tokens (Passwordless Auth)
// ============================================

model MagicLinkToken {
  id        String   @id @default(cuid())
  token     String   @unique // 64 hex chars (32 bytes)
  email     String
  expiresAt DateTime // 15 minutes from creation
  used      Boolean  @default(false) // One-time use

  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
  @@index([expiresAt])
  @@map("magic_link_tokens")
}

// ============================================
// Booking Model (Updated)
// ============================================

model Booking {
  id                      String        @id @default(cuid())
  studioId                String
  serviceId               String?
  customerId              String        // ✅ Always references User now

  // Customer info (denormalized for studio convenience)
  customerName            String
  customerEmail           String
  customerPhone           String?       // ✅ Optional

  // Booking details
  preferredDate           String
  preferredTime           String
  message                 String?       @db.Text

  // GDPR Art. 9 Compliance (Health Data)
  explicitHealthConsent   Boolean?      @default(false)
  healthConsentGivenAt    DateTime?
  healthConsentText       String?       @db.Text
  healthConsentWithdrawnAt DateTime?

  // Status
  status                  BookingStatus @default(PENDING)

  // Confirmation audit
  confirmedBy             String?
  confirmedAt             DateTime?
  cancelledBy             String?
  cancelledAt             DateTime?

  // Relations
  studio                  Studio        @relation(fields: [studioId], references: [id], onDelete: Cascade)
  service                 Service?      @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  customer                User          @relation(fields: [customerId], references: [id], onDelete: SetNull)

  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  @@index([studioId])
  @@index([customerId])
  @@index([customerEmail])
  @@index([status])
  @@index([createdAt])
  @@map("bookings")
}

// ============================================
// Audit Log (GDPR Compliance)
// ============================================

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?  // Who performed the action
  action      String   // e.g., "BOOKING_CREATE", "STUDIO_UPDATE"
  resource    String   // e.g., "booking", "studio"
  resourceId  String   // ID of affected resource
  metadata    Json?    // Additional context
  ipAddress   String?  // Anonymized (hash last octet)
  userAgent   String?

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 5. Security Implementation

### 5.1 Password Security

**Current Issues:**
- bcrypt cost factor = 10 (too low)
- Weak password policy (min 6 chars)
- No complexity requirements

**Solution:**

```typescript
// lib/validation.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Passwort muss mindestens 12 Zeichen lang sein')
  .regex(/[A-Z]/, 'Passwort muss Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss Zahlen enthalten')
  .regex(/[^A-Za-z0-9]/, 'Passwort muss Sonderzeichen enthalten');

// All password hashing (registration, password change)
const BCRYPT_ROUNDS = 12; // GDPR Art. 32 compliant
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

### 5.2 Magic Link Security

**Best Practices:**

```typescript
// lib/magic-link.ts
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes

export async function generateMagicLink(email: string): Promise<string> {
  // 1. Generate cryptographically secure token
  const token = randomBytes(32).toString('hex'); // 64 hex chars

  // 2. Set expiration
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

  // 3. Store in database
  await prisma.magicLinkToken.create({
    data: {
      token,
      email,
      expiresAt,
      used: false,
    }
  });

  // 4. Generate URL
  const baseUrl = process.env.NEXTAUTH_URL;
  return `${baseUrl}/auth/magic-link?token=${token}`;
}

export async function verifyMagicLink(token: string): Promise<string | null> {
  const record = await prisma.magicLinkToken.findUnique({
    where: { token }
  });

  // Validation
  if (!record) return null;  // Token doesn't exist
  if (record.used) return null;  // Already used (replay attack prevention)
  if (record.expiresAt < new Date()) return null;  // Expired

  // Mark as used (one-time use enforcement)
  await prisma.magicLinkToken.update({
    where: { token },
    data: { used: true }
  });

  // Verify email on first magic link use
  const user = await prisma.user.findUnique({
    where: { email: record.email }
  });

  if (user && !user.emailVerified) {
    await prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() }
    });
  }

  return record.email;
}
```

### 5.3 Rate Limiting

**Implementation:**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Auth endpoints: 5 attempts per 15 minutes
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
});

// Magic link generation: 3 per 15 minutes per email
export const magicLinkRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '15 m'),
  analytics: true,
});

// Usage in API route:
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success, remaining } = await authRateLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte versuchen Sie es in 15 Minuten erneut.' },
      { status: 429 }
    );
  }

  // ... proceed with auth ...
}
```

### 5.4 Security Headers

**Configuration:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains', // HSTS
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

---

## 6. GDPR/DSGVO Compliance

### 6.1 Legal Bases

**Art. 6 GDPR - General Data Processing**

| Data | Legal Basis | Purpose |
|------|-------------|---------|
| Name, Email | Art. 6(1)(b) - Contract | Booking confirmation & management |
| Phone (optional) | Art. 6(1)(a) - Consent | SMS reminders (if user opts in) |
| Booking history | Art. 6(1)(b) - Contract | Service delivery & rebooking |
| OAuth data (Google) | Art. 6(1)(a) - Consent | Simplified login |

**Art. 9 GDPR - Special Category Data (Health)**

| Data | Legal Basis | Requirement |
|------|-------------|-------------|
| Message field (may contain health info) | Art. 9(2)(a) - Explicit Consent | Separate checkbox, withdrawable |

### 6.2 Art. 9 Implementation (Health Data)

**Conditional Consent:**

```typescript
// components/BookingForm.tsx
const [showHealthConsent, setShowHealthConsent] = useState(false);

useEffect(() => {
  // Show health consent only if message field has content
  if (formData.message && formData.message.length > 0) {
    setShowHealthConsent(true);
  } else {
    setShowHealthConsent(false);
  }
}, [formData.message]);

return (
  <form>
    {/* Message Field */}
    <textarea
      value={formData.message}
      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
      placeholder="Z.B. Wünsche, Allergien, gesundheitliche Hinweise"
    />

    {/* Art. 9 GDPR Consent - Only shown if message filled */}
    {showHealthConsent && (
      <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            checked={formData.explicitHealthConsent}
            onChange={(e) => setFormData({
              ...formData,
              explicitHealthConsent: e.target.checked
            })}
          />
          <div className="text-sm">
            <strong className="block mb-1">
              Einwilligung zur Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO)
            </strong>
            <p className="text-muted-foreground">
              Ich willige ausdrücklich ein, dass meine im Nachrichtenfeld angegebenen
              Informationen (die möglicherweise Gesundheitsdaten enthalten) zum Zweck
              der Massage-Behandlung an das Studio weitergegeben und verarbeitet werden.
              Diese Einwilligung kann ich jederzeit per E-Mail an datenschutz@massava.com
              widerrufen.
            </p>
            <a href="/datenschutz#gesundheitsdaten" className="text-xs underline">
              Mehr Informationen
            </a>
          </div>
        </label>
      </div>
    )}

    <button type="submit">Jetzt buchen</button>
  </form>
);
```

**Backend Validation:**

```typescript
// app/api/bookings/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate Art. 9 GDPR compliance
  if (body.message && body.message.trim().length > 0) {
    if (!body.explicitHealthConsent) {
      return NextResponse.json(
        { error: 'Explicit health data consent required (Art. 9 GDPR)' },
        { status: 400 }
      );
    }
  }

  const booking = await prisma.booking.create({
    data: {
      // ... other fields ...
      message: body.message || null,
      explicitHealthConsent: body.message ? body.explicitHealthConsent : null,
      healthConsentGivenAt: body.message ? new Date() : null,
      healthConsentText: body.message ?
        "Ich willige ausdrücklich ein, dass meine Gesundheitsdaten..." :
        null,
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'BOOKING_CREATED',
      resource: 'booking',
      resourceId: booking.id,
      metadata: {
        healthDataProvided: !!body.message,
        consentGiven: body.explicitHealthConsent || false,
      },
    }
  });

  return NextResponse.json(booking);
}
```

### 6.3 Data Subject Rights (Art. 15-22)

**Implementation:**

```typescript
// app/api/user/export/route.ts - Art. 15 (Right to Access)
export async function GET(request: NextRequest) {
  const session = await auth();

  // For passwordless users: verify magic link token
  const token = request.nextUrl.searchParams.get('token');
  const email = token ? await verifyMagicLink(token) : session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      bookings: {
        include: {
          studio: true,
          service: true,
        }
      },
      favorites: true,
    }
  });

  return NextResponse.json({
    exportDate: new Date().toISOString(),
    gdprArticle: 'Art. 15 GDPR - Right to Access',
    personalData: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      accountCreated: user.createdAt,
      emailVerified: user.emailVerified,
    },
    bookings: user.bookings,
    favorites: user.favorites,
    format: 'JSON'
  }, {
    headers: {
      'Content-Disposition': `attachment; filename="massava-datenexport-${new Date().toISOString()}.json"`
    }
  });
}

// app/api/user/delete/route.ts - Art. 17 (Right to Erasure)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  const token = request.nextUrl.searchParams.get('token');
  const email = token ? await verifyMagicLink(token) : session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete all user data (GDPR Art. 17)
  await prisma.$transaction([
    // Delete bookings
    prisma.booking.deleteMany({ where: { customerEmail: email } }),
    // Delete magic link tokens
    prisma.magicLinkToken.deleteMany({ where: { email } }),
    // Delete user
    prisma.user.delete({ where: { email } })
  ]);

  // Anonymized deletion log (for compliance)
  await prisma.auditLog.create({
    data: {
      action: 'ACCOUNT_DELETED',
      resource: 'user',
      resourceId: 'DELETED',
      metadata: {
        deletedAt: new Date().toISOString(),
        reason: 'User requested deletion (Art. 17 GDPR)',
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Account successfully deleted'
  });
}
```

### 6.4 Privacy Policy (Art. 13-14)

**Required Content** (`/app/[locale]/datenschutz/page.tsx`):

```markdown
# Datenschutzerklärung

## 1. Verantwortlicher
RNLT Labs / Massava
[Address]
E-Mail: datenschutz@massava.com

## 2. Datenverarbeitung

### 2.1 Buchungsdaten
**Rechtsgrundlage:** Art. 6(1)(b) DSGVO (Vertragserfüllung)
**Daten:** Name, E-Mail, optionale Telefonnummer
**Zweck:** Buchungsbestätigung und -verwaltung
**Speicherdauer:** 3 Monate nach Terminende

### 2.2 Gesundheitsdaten (Art. 9 DSGVO)
**Rechtsgrundlage:** Art. 9(2)(a) DSGVO (Ausdrückliche Einwilligung)
**Daten:** Nachrichtenfeld (optional, kann Gesundheitsinfos enthalten)
**Zweck:** Massage-Behandlungsanpassung
**Speicherdauer:** Bis Widerruf der Einwilligung

### 2.3 Konto-Verwaltung
**Funktion:** Automatische Kontoerstellung für Buchungsverwaltung
**Zugriff:** Per Magic Link (E-Mail) oder optionales Passwort

## 3. Ihre Rechte (Art. 15-22 DSGVO)
- **Auskunftsrecht (Art. 15):** [Daten exportieren](/api/user/export)
- **Recht auf Löschung (Art. 17):** [Konto löschen](/api/user/delete)
- **Widerspruchsrecht (Art. 21):** datenschutz@massava.com

## 4. Auftragsverarbeiter
- **Hetzner Online GmbH:** Server-Hosting (Deutschland, AVV vorhanden)
- **Massage-Studios:** Buchungsabwicklung

## 5. Speicherdauer
- Buchungsdaten: 3 Monate nach Termin
- Konto-Daten: Bis zur Löschung durch Nutzer
- Inaktive Konten: Löschung nach 3 Jahren Inaktivität

## 6. Beschwerderecht
Landesbeauftragter für Datenschutz und Informationsfreiheit
```

---

## 7. Progressive Profiling Strategy

### 7.1 Phone Number Collection

**Phase 1: First Booking**
- Phone field: OPTIONAL
- Value proposition: "Optional: Für SMS-Erinnerungen (98% Öffnungsrate)"
- Expected: 10-15% add phone initially

**Phase 2: Post-Booking Email**
```
Subject: ✅ Buchung bestätigt + Tipp für SMS-Erinnerungen

Hallo [Name],

Ihre Buchung ist bestätigt!

📱 Möchten Sie SMS-Erinnerungen erhalten?

Fügen Sie Ihre Telefonnummer hinzu für:
• SMS-Erinnerung 24h vor Termin (98% Öffnungsrate)
• Keine verpassten Termine mehr
• Direkte Kommunikation mit dem Studio

[Telefon hinzufügen]

Diese Funktion ist optional und kann jederzeit deaktiviert werden.
```

**Phase 3: Second Booking**
- If phone not added: Remind with incentive
- "5% Rabatt auf 3. Buchung wenn Telefonnummer hinzugefügt"

**Expected Results:**
- After 1 booking: 10-15% have phone
- After 2 bookings: 30-40% have phone
- After 3 months: 50-60% have phone

### 7.2 Password Upgrade

**When to Prompt:**
- Post-booking email (non-intrusive)
- After 2nd booking attempt (value demonstrated)
- Dashboard banner (dismissible)

**Incentives:**
- "Schnellerer Zugriff (kein Magic Link nötig)"
- "Favoriten-Studios speichern"
- "Buchungshistorie übersichtlich"

---

## 8. Implementation Roadmap

### Phase 1: Critical Security Fixes (Week 1) 🚨
- [ ] Implement password validation (Zod schema, min 12 chars)
- [ ] Fix bcrypt cost factor (12 everywhere)
- [ ] Fix account enumeration (generic error messages)
- [ ] Add Art. 9 health data consent checkbox
- [ ] Create `/datenschutz` privacy policy page
- [ ] Implement cookie consent banner (if analytics)
- [ ] Add rate limiting (auth endpoints)

**Deliverable:** Security Score 3.5 → 5.5, GDPR 2 → 5

### Phase 2: Security Hardening (Week 2)
- [ ] Add security headers (CSP, HSTS, X-Frame-Options)
- [ ] Implement email verification flow
- [ ] Add session timeout (30 days)
- [ ] Replace console.error with structured logger
- [ ] Implement GDPR data export (Art. 15)
- [ ] Implement account deletion (Art. 17)
- [ ] Sign Hetzner AVV

**Deliverable:** Security Score 5.5 → 7.5, GDPR 5 → 8

### Phase 3: Unified User Model + RBAC (Week 3-4)
- [ ] Add new models: User, UserRoleAssignment, StudioOwnership, MagicLinkToken, AuditLog
- [ ] Create data migration script
- [ ] Update auth.ts to use unified User model
- [ ] Create authorization utilities (requirePermission, canAccessStudio)
- [ ] Implement magic link system (generation, verification, email)
- [ ] Update all API routes with new authorization
- [ ] Add audit logging

**Deliverable:** Unified User Model deployed, RBAC functional

### Phase 4: Dashboard & UI Updates (Week 5)
- [ ] Create SUPER_ADMIN dashboard (/admin)
- [ ] Update STUDIO_OWNER dashboard
- [ ] Update CUSTOMER dashboard
- [ ] Update middleware for role-based routing
- [ ] Add progressive profiling prompts (phone, password)

**Deliverable:** Role-based dashboards functional

### Phase 5: Testing & Deployment (Week 6)
- [ ] Unit tests (100% coverage for auth)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Security audit (OWASP ZAP)
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor for 24h

**Deliverable:** Security Score 8/10, GDPR 9/10, **PRODUCTION READY** ✅

---

## 9. Success Metrics

### 9.1 Conversion Metrics
- **Booking Conversion Rate:** Target 22-24% (vs. 14% with forced registration)
- **Phone Collection Rate:** Target 50-60% after 3 months
- **Password Upgrade Rate:** Target 30-40% after first month
- **Abandonment Rate:** Target <5% (vs. 39% with required phone)

### 9.2 Security Metrics
- **Failed Login Attempts:** Monitor for brute force
- **Magic Link Generation Rate:** Detect abuse
- **Account Creation Rate:** Detect bot activity
- **GDPR Requests:** Track export/delete requests

### 9.3 Business Metrics
- **Customer Lifetime Value:** Target €150-200/year
- **Return Booking Rate:** Target 40-50%
- **Studio Satisfaction:** Target 8/10 (phone contact available)

---

## 10. Risk Assessment

### High-Risk Areas
| Risk | Mitigation |
|------|-----------|
| Art. 9 GDPR violation (health data) | Explicit consent checkbox (mandatory) |
| Email account compromise (passwordless) | Email verification + security alerts |
| Brute force attacks | Rate limiting (5 attempts / 15 min) |
| Missing privacy policy | Create /datenschutz (mandatory) |
| Magic link token theft | HTTPS + 15-min expiration + one-time use |

### Low-Risk Areas
- SQL Injection: Prisma ORM protects ✅
- XSS: React escapes by default ✅
- Dependency vulnerabilities: 0 found ✅
- CSRF: Next.js API routes protected ✅

---

## 11. Approval & Sign-Off

### Strategy Approved By
- [x] Roman Reinelt (Product Owner)
- [x] Security Auditor Agent (Conditional approval with mandatory fixes)
- [x] Competitor Research Agent (Phone optional validated)
- [x] Development Team AI Assistant (Implementation strategy)

### Implementation Authorization
- **Start Date:** 2025-10-27
- **Target Launch:** 2025-12-08 (6 weeks)
- **Status:** APPROVED FOR IMPLEMENTATION

### Conditions for Production Launch
1. ✅ All Phase 1 critical security fixes implemented
2. ✅ Privacy policy published (/datenschutz)
3. ✅ Art. 9 health data consent functional
4. ✅ Magic link system implemented and tested
5. ✅ Rate limiting active
6. ✅ Security headers configured
7. ✅ GDPR data subject rights endpoints working
8. ✅ Security score ≥ 8/10
9. ✅ GDPR compliance score ≥ 9/10

---

## 12. Related Documents

- **Security Audit Report:** (Generated by security-auditor agent)
- **RBAC Architecture Document:** (Design details for permission system)
- **Competitor Research Report:** `/research-passwordless-guest-booking.md`
- **Linear Issues:**
  - RNLT-37: Main epic (6-week implementation)
  - RNLT-38: Phase 1 - Critical Security Fixes
  - RNLT-39: Phase 3 - Unified User Model + RBAC

---

## 13. Contact

**Strategy Owner:** Roman Reinelt / RNLT Labs
**Technical Implementation:** Development Team AI Assistant
**Security Review:** security-auditor agent
**Questions:** Create issue in Linear or contact team

---

**Version History:**
- v1.0 (2025-10-27): Initial strategy document, approved for implementation

**Next Review:** After Phase 1 completion (estimated Week 2)
