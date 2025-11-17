# Email Notification Implementation Plan - Massava

**Version**: 1.0
**Date**: 2025-01-17
**Branch**: `fix/booking-request-actions` (current) → new branches for each phase
**Estimated Total Time**: 10-15 days

---

## 🎯 Executive Summary

This document provides a complete, step-by-step implementation plan for adding missing email notifications to Massava. The plan is designed to be executed by Claude Code with specialized subagents handling different aspects of the implementation.

**What's Already Done:**
- ✅ Email infrastructure with Resend is configured and working
- ✅ 6 email templates exist (verification, welcome, password reset, booking request, confirmation, cancellation)
- ✅ Booking request emails are implemented and working
- ✅ Massava corporate design system is defined (warm terracotta colors, organic shapes)

**What Needs to Be Done:**
- 🔴 **11 Email Templates** (missing)
- 🔴 **15 Email Sending Integrations** (missing)
- 🟡 **2 Email Templates** (exist but not integrated)

---

## 📐 Design System Reference

All email templates MUST follow the existing Massava corporate design defined in `lib/email/templates.tsx`:

### Color Palette (OKLCH)
```typescript
const COLORS = {
  // Primary brand colors - Warm Wellness Tones
  primary: '#a67c52',        // Warm terracotta (oklch(0.55 0.12 35))
  primaryLight: '#c39a76',   // Light terracotta
  primaryDark: '#8b6842',    // Dark terracotta

  // Accent color - Sage Green
  accent: '#93a08a',         // Sage green (oklch(0.62 0.08 140))
  accentLight: '#b0baa9',
  accentDark: '#7a8771',

  // Secondary - Warm Sand/Beige
  secondary: '#e0d7c8',      // Warm sand (oklch(0.88 0.03 80))
  secondaryDark: '#cfc6b7',

  // Neutral colors - Warm Earth Palette
  white: '#ffffff',
  background: '#f2f0ec',     // Warm cream (oklch(0.95 0.01 60))
  cardBg: '#faf9f7',

  textPrimary: '#3d3630',    // Warm dark brown
  textSecondary: '#6b5f52',
  textMuted: '#8c7e6f',

  // UI colors
  border: '#dfd9d0',
  success: '#6b9f7b',
  warning: '#d4a574',
  error: '#c97a6a',
};
```

### Typography & Spacing
- **Border Radius**: 24px for buttons, 16-20px for cards (organic, soft corners)
- **Font Family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- **Header Decoration**: Organic blob shape with `borderRadius: '50% 40% 60% 50%'`

### Template Structure
All templates follow this structure:
1. **Header** with terracotta gradient + organic blob decoration
2. **Logo**: "Massava" text
3. **Tagline**: "Ihre Wellness-Buchungsplattform"
4. **Content Area** with white background
5. **Info/Success/Warning Boxes** with appropriate colors
6. **CTA Buttons** with terracotta gradient or outlined sage green
7. **Footer Section** with warm cream background

### Reference Files
- **Design System**: `lib/email/templates.tsx` (lines 11-271)
- **Existing Templates**: Lines 303-894 (verification, welcome, password reset, booking templates)
- **Email Sending Functions**: `lib/email/send.ts`

---

## 🚀 Implementation Phases

### **PHASE 1: Critical Fixes** (2-3 days)

#### Task 1.1: Password Reset Email Integration
**Priority**: 🔴 CRITICAL
**Files to Modify**:
- Template already exists: `PasswordResetTemplate` in `lib/email/templates.tsx`
- Integration needed in: `app/api/auth/reset-password/route.ts` (create this file)

**Current Status**:
- Template exists ✅
- Email sending function `sendPasswordResetEmail` exists ✅
- NO API route exists to trigger password reset ❌
- NO integration in UI ❌

**Implementation Steps**:
1. **Create API route** `app/api/auth/reset-password/route.ts`:
   ```typescript
   // POST /api/auth/reset-password
   // Request body: { email: string }
   // 1. Validate email with Zod
   // 2. Check if user exists (don't reveal if they don't - security)
   // 3. Generate reset token (use crypto.randomBytes(32))
   // 4. Store in PasswordResetToken table with 1 hour expiry
   // 5. Call sendPasswordResetEmail() from lib/email/send.ts
   // 6. Return success (always, even if user doesn't exist)
   ```

2. **Create password reset form page** `app/[locale]/auth/reset-password/page.tsx`:
   - Email input field
   - Submit button
   - Success message
   - Calls `/api/auth/reset-password`

3. **Create password reset verification page** `app/[locale]/auth/reset-password/[token]/page.tsx`:
   - Takes token from URL
   - Verifies token is valid and not expired
   - Shows new password form
   - Updates user password
   - Marks token as used

4. **Add link to login form** in `components/auth/LoginForm.tsx`:
   - Already has "Passwort vergessen?" link (line 260-266)
   - Update href to `/auth/reset-password`

**Testing**:
- Request password reset for existing user
- Verify email is sent with correct reset URL
- Click reset link and set new password
- Verify old password no longer works
- Verify new password works
- Verify token can't be reused
- Verify expired tokens are rejected

**Subagent**: `feature-builder` (full-stack implementation)

---

#### Task 1.2: Welcome Email Integration
**Priority**: 🟡 IMPORTANT
**Files to Modify**:
- Template already exists: `WelcomeEmailTemplate` in `lib/email/templates.tsx`
- Integration needed in: `app/api/auth/verify-email/route.ts` (or wherever email verification happens)

**Current Status**:
- Template exists ✅
- Email sending function `sendWelcomeEmail` exists ✅
- NOT called after email verification ❌

**Implementation Steps**:
1. Find where email verification happens:
   ```bash
   grep -r "emailVerified" app/
   grep -r "verify.*email" app/
   ```

2. Add welcome email call after successful verification:
   ```typescript
   // After marking email as verified
   await sendWelcomeEmail(
     user.email,
     user.name || 'Nutzer',
     'de'
   );
   ```

3. Test by:
   - Creating new user account
   - Verifying email
   - Checking that welcome email is sent

**Subagent**: `feature-builder`

---

### **PHASE 2: Account Management** (3-5 days)

#### Task 2.1: Email Change Verification
**Priority**: 🟡 IMPORTANT
**Files to Create/Modify**:
- Create template: `EmailChangeVerificationTemplate` in `lib/email/templates.tsx`
- Create function: `sendEmailChangeVerification` in `lib/email/send.ts`
- Modify: User settings page (find with `grep -r "email.*change" app/`)

**Email Template Design**:
```typescript
interface EmailChangeVerificationTemplateProps {
  userName: string;
  newEmail: string;
  verificationUrl: string;
  oldEmail: string;
  locale?: string;
}

// Template content (German):
Subject: "E-Mail-Adresse bestätigen - Massava"
Greeting: "Hallo {userName}! 📧"
Intro: "Sie haben eine Änderung Ihrer E-Mail-Adresse angefordert."
Details:
  - "Aktuelle E-Mail: {oldEmail}"
  - "Neue E-Mail: {newEmail}"
Info Box: "⚠️ Wichtig: Bestätigen Sie Ihre neue E-Mail-Adresse innerhalb von 24 Stunden."
CTA: Primary button "E-Mail bestätigen" → verificationUrl
Security Notice: "Falls Sie diese Änderung nicht vorgenommen haben, ignorieren Sie diese E-Mail und kontaktieren Sie uns umgehend."
```

**Database Schema**:
Check if `EmailChangeToken` table exists. If not, create migration:
```prisma
model EmailChangeToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  oldEmail  String
  newEmail  String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@map("email_change_tokens")
}
```

**Implementation Steps**:
1. Create email template (follow design system)
2. Create plain text version
3. Create email sending function
4. Create API route for email change request
5. Create API route for email change verification
6. Integrate into user settings page
7. Test flow end-to-end

**Subagent**: `feature-builder`

---

#### Task 2.2: Two-Factor Authentication (2FA) Emails
**Priority**: 🟢 NICE-TO-HAVE
**Files to Create**:
- Template: `TwoFactorCodeTemplate` in `lib/email/templates.tsx`
- Function: `sendTwoFactorCode` in `lib/email/send.ts`

**Email Template Design**:
```typescript
interface TwoFactorCodeTemplateProps {
  userName: string;
  code: string; // 6-digit code
  expiresInMinutes: number; // e.g., 10
  locale?: string;
}

// Template content (German):
Subject: "Ihr Sicherheitscode - Massava"
Greeting: "Hallo {userName}! 🔐"
Intro: "Hier ist Ihr Sicherheitscode für die Anmeldung:"
Code Display: Large, prominent display of 6-digit code in highlightBox
Expiry: "⏱ Dieser Code ist {expiresInMinutes} Minuten gültig."
Security: "Falls Sie sich nicht anmelden wollten, ignorieren Sie diese E-Mail."
```

**Implementation Steps**:
1. Create email template with prominent code display
2. Create plain text version
3. Create email sending function
4. Find 2FA implementation (search for "2fa" or "two.?factor")
5. Integrate email sending when 2FA code is generated
6. Test 2FA flow

**Subagent**: `feature-builder`

---

#### Task 2.3: Account Deletion Notifications
**Priority**: 🟡 IMPORTANT (GDPR Compliance)
**Files to Create**:
- Template 1: `AccountDeletionScheduledTemplate` (warning email)
- Template 2: `AccountDeletionConfirmedTemplate` (confirmation email)
- Functions in `lib/email/send.ts`

**Email Template 1: Deletion Scheduled**:
```typescript
interface AccountDeletionScheduledTemplateProps {
  userName: string;
  deletionDate: string; // formatted date
  cancelUrl: string;
  locale?: string;
}

// Content (German):
Subject: "Konto-Löschung geplant - Massava"
Greeting: "Hallo {userName}"
Warning: "⚠️ Ihr Konto wird am {deletionDate} gelöscht."
Info: "Sie haben die Löschung Ihres Kontos beantragt. Diese wird in 30 Tagen durchgeführt."
Details in warningBox:
  - "Alle Ihre Daten werden unwiderruflich gelöscht"
  - "Buchungen werden storniert"
  - "Studio-Zugriffe werden entfernt"
CTA: Primary button "Löschung abbrechen" → cancelUrl
Footer: "Falls Sie die Löschung durchführen möchten, müssen Sie nichts tun."
```

**Email Template 2: Deletion Confirmed**:
```typescript
interface AccountDeletionConfirmedTemplateProps {
  userName: string;
  locale?: string;
}

// Content (German):
Subject: "Konto gelöscht - Massava"
Greeting: "Hallo {userName}"
Confirmation: "✓ Ihr Massava-Konto wurde erfolgreich gelöscht."
Info: "Alle Ihre Daten wurden gemäß DSGVO unwiderruflich gelöscht."
Reactivation: "Falls Sie in Zukunft wieder bei Massava buchen möchten, können Sie jederzeit ein neues Konto erstellen."
CTA: Secondary button "Neues Konto erstellen"
```

**Implementation Steps**:
1. Find account deletion logic (search for "delete.*account" or "user.*delete")
2. Create both email templates
3. Create sending functions
4. Integrate "scheduled" email when deletion is requested
5. Integrate "confirmed" email when deletion is executed
6. Test deletion flow

**Subagent**: `feature-builder`

---

### **PHASE 3: Studio Owner Notifications** (4-6 days)

#### Task 3.1: New Booking Notification for Studio Owners
**Priority**: 🔴 CRITICAL
**Files to Create/Modify**:
- Template: `NewBookingNotificationTemplate` in `lib/email/templates.tsx`
- Function: `sendNewBookingNotification` in `lib/email/send.ts`
- Modify: `app/actions/createBooking.ts` (add studio owner notification)

**Email Template Design**:
```typescript
interface NewBookingNotificationTemplateProps {
  studioName: string;
  ownerName: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  message?: string;
  dashboardUrl: string; // Link to business dashboard
  locale?: string;
}

// Content (German):
Subject: "Neue Buchungsanfrage - {studioName}"
Greeting: "Hallo {ownerName}! 📅"
Intro: "Sie haben eine neue Buchungsanfrage für {studioName} erhalten."
Success Box: "✓ Neue Buchungsanfrage eingegangen"
Booking Details Card:
  - Buchungsnummer: {bookingId}
  - Kunde: {customerName}
  - E-Mail: {customerEmail}
  - Telefon: {customerPhone}
  - Service: {serviceName}
  - Datum: {bookingDate}
  - Uhrzeit: {bookingTime}
  - Nachricht: {message} (if provided)
Action Required Box:
  "⏰ Bitte bestätigen oder lehnen Sie die Buchung ab."
CTA: Primary button "Buchung verwalten" → dashboardUrl
```

**Implementation Steps**:
1. Create email template following design system
2. Create plain text version
3. Create email sending function
4. Modify `app/actions/createBooking.ts`:
   ```typescript
   // After creating booking (around line 147)

   // Get studio owners
   const studioOwners = await prisma.studioOwnership.findMany({
     where: { studioId: booking.studioId },
     include: { user: true },
   });

   // Send notification to all studio owners
   for (const ownership of studioOwners) {
     await sendNewBookingNotification(
       ownership.user.email,
       {
         studioName: booking.studio.name,
         ownerName: ownership.user.name || 'Studio-Inhaber',
         bookingId: booking.id,
         customerName: booking.customerName,
         // ... other details
         dashboardUrl: `${process.env.NEXTAUTH_URL}/de/business/calendar`,
       },
       'de'
     );
   }
   ```
5. Test by creating a booking and verifying studio owner receives email

**Subagent**: `feature-builder`

---

#### Task 3.2: Booking Update Notifications for Studio Owners
**Priority**: 🟡 IMPORTANT
**Files to Create/Modify**:
- Template: `BookingCancelledByCustomerTemplate`
- Function: `sendBookingCancelledByCustomerNotification`
- Create customer cancellation flow (if doesn't exist)

**Email Template Design**:
```typescript
interface BookingCancelledByCustomerTemplateProps {
  studioName: string;
  ownerName: string;
  bookingId: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  cancellationReason?: string;
  dashboardUrl: string;
  locale?: string;
}

// Content (German):
Subject: "Buchung storniert - {studioName}"
Greeting: "Hallo {ownerName}"
Intro: "Ein Kunde hat seine Buchung storniert."
Warning Box: "⚠️ Buchung storniert"
Details:
  - Buchungsnummer: {bookingId}
  - Kunde: {customerName}
  - Service: {serviceName}
  - Datum: {bookingDate}
  - Uhrzeit: {bookingTime}
  - Grund: {cancellationReason} (if provided)
CTA: "Dashboard öffnen" → dashboardUrl
```

**Implementation Steps**:
1. Create email template
2. Create sending function
3. Find or create customer cancellation logic
4. Integrate email notification
5. Test cancellation flow

**Subagent**: `feature-builder`

---

#### Task 3.3: Studio Registration Confirmation
**Priority**: 🟢 NICE-TO-HAVE
**Files to Create**:
- Template: `StudioRegistrationWelcomeTemplate`
- Function: `sendStudioRegistrationWelcome`

**Email Template Design**:
```typescript
interface StudioRegistrationWelcomeTemplateProps {
  studioName: string;
  ownerName: string;
  studioId: string;
  dashboardUrl: string;
  onboardingUrl: string;
  locale?: string;
}

// Content (German):
Subject: "Willkommen bei Massava - {studioName}"
Greeting: "Hallo {ownerName}! 🎉"
Intro: "Herzlich willkommen! Ihr Studio {studioName} wurde erfolgreich registriert."
Success Box: "✓ Studio-Registrierung abgeschlossen"
Next Steps:
  - "📋 Studio-Profil vervollständigen"
  - "💆 Services hinzufügen"
  - "📅 Öffnungszeiten eintragen"
  - "🖼️ Galerie-Bilder hochladen"
CTAs:
  - Primary: "Onboarding starten" → onboardingUrl
  - Secondary: "Dashboard öffnen" → dashboardUrl
```

**Implementation Steps**:
1. Create email template
2. Create sending function
3. Find studio registration flow
4. Integrate email after successful registration
5. Test registration

**Subagent**: `feature-builder`

---

#### Task 3.4: Studio Deletion Workflow
**Priority**: 🟡 IMPORTANT
**Files to Create**:
- Template: `StudioDeletionWarningTemplate`
- Template: `StudioDeletionConfirmedTemplate`
- Functions for both

**Similar to account deletion but for studios. Include:**
- Warning to all studio owners
- 30-day grace period
- Cancellation option
- Confirmation email after deletion

**Subagent**: `feature-builder`

---

### **PHASE 4: Customer Engagement** (3-5 days)

#### Task 4.1: Booking Reminders (24h before appointment)
**Priority**: 🟢 NICE-TO-HAVE
**Files to Create**:
- Template: `BookingReminderTemplate`
- Function: `sendBookingReminder`
- Cron job or scheduled task

**Email Template Design**:
```typescript
interface BookingReminderTemplateProps {
  customerName: string;
  bookingId: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  studioAddress?: string;
  studioPhone?: string;
  locale?: string;
}

// Content (German):
Subject: "Erinnerung: Ihr Termin morgen - Massava"
Greeting: "Hallo {customerName}! 📅"
Intro: "Dies ist eine Erinnerung an Ihren Termin morgen."
Info Box: "⏰ Termin in 24 Stunden"
Details: [booking details]
Reminder:
  - "Bitte erscheinen Sie pünktlich"
  - "Bei Verspätung oder Absage kontaktieren Sie das Studio"
Studio Contact: Phone and address
```

**Implementation Steps**:
1. Create email template
2. Create sending function
3. Create scheduled task (cron job or Next.js API route with cron trigger):
   ```typescript
   // app/api/cron/booking-reminders/route.ts
   export async function GET() {
     // Find all confirmed bookings for tomorrow
     const tomorrow = new Date();
     tomorrow.setDate(tomorrow.getDate() + 1);

     const bookings = await prisma.newBooking.findMany({
       where: {
         status: 'CONFIRMED',
         preferredDate: formatDate(tomorrow),
         // Add flag to track if reminder was sent
       },
       include: { studio: true, service: true },
     });

     // Send reminders
     for (const booking of bookings) {
       await sendBookingReminder(...);
     }
   }
   ```
4. Add `reminderSent` field to NewBooking model
5. Set up Vercel cron job or similar
6. Test scheduling

**Subagent**: `feature-builder`

---

#### Task 4.2: Review Requests (after appointment)
**Priority**: 🟢 NICE-TO-HAVE
**Files to Create**:
- Template: `ReviewRequestTemplate`
- Function: `sendReviewRequest`
- Scheduled task

**Email Template Design**:
```typescript
interface ReviewRequestTemplateProps {
  customerName: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  reviewUrl: string; // Link to review page
  locale?: string;
}

// Content (German):
Subject: "Wie war Ihr Termin? - Massava"
Greeting: "Hallo {customerName}! ⭐"
Intro: "Wir hoffen, Sie hatten einen entspannenden Termin bei {studioName}."
Question: "Wie zufrieden waren Sie mit Ihrer {serviceName}?"
CTA: Primary button "Jetzt bewerten" → reviewUrl
Incentive: "Ihre Bewertung hilft anderen Kunden und unterstützt lokale Studios."
```

**Implementation Steps**:
1. Create email template
2. Create sending function
3. Create review page (if doesn't exist)
4. Create scheduled task for sending reviews 24h after appointment
5. Test flow

**Subagent**: `feature-builder`

---

#### Task 4.3: Customer Cancellation Confirmation
**Priority**: 🟡 IMPORTANT
**Files to Create**:
- Template: `CustomerCancellationConfirmationTemplate`
- Function: `sendCustomerCancellationConfirmation`

**Email Template Design**:
```typescript
interface CustomerCancellationConfirmationTemplateProps {
  customerName: string;
  bookingId: string;
  studioName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  rebookUrl: string;
  locale?: string;
}

// Content (German):
Subject: "Buchung storniert - Massava"
Greeting: "Hallo {customerName}"
Confirmation: "✓ Ihre Buchung wurde erfolgreich storniert."
Details: [cancelled booking details]
Info: "Sie können jederzeit einen neuen Termin buchen."
CTA: "Neuen Termin buchen" → rebookUrl
```

**Implementation Steps**:
1. Create email template
2. Create sending function
3. Find customer cancellation flow
4. Integrate email
5. Also notify studio owner (Task 3.2)
6. Test

**Subagent**: `feature-builder`

---

## 🧪 Testing Strategy

After each phase, run comprehensive tests:

### Automated Tests
```typescript
// __tests__/email-notifications/phase1.test.ts
describe('Phase 1: Critical Fixes', () => {
  it('should send password reset email', async () => {
    // Test password reset flow
  });

  it('should send welcome email after verification', async () => {
    // Test welcome email
  });
});
```

### Manual Testing Checklist
- [ ] All emails render correctly in email clients (Gmail, Outlook, Apple Mail)
- [ ] All links work and point to correct URLs
- [ ] All templates match Massava design system
- [ ] German and English translations are correct
- [ ] Plain text versions are readable
- [ ] All emails log properly (Winston logger)
- [ ] Resend dashboard shows all sent emails
- [ ] No PII is logged in console/logs

---

## 📊 Progress Tracking

Use TodoWrite tool to track progress:

```typescript
TodoWrite({
  todos: [
    { content: "Phase 1.1: Password Reset Email", status: "in_progress", activeForm: "..." },
    { content: "Phase 1.2: Welcome Email Integration", status: "pending", activeForm: "..." },
    // ... etc
  ]
});
```

---

## 🚨 Common Pitfalls to Avoid

1. **Forgetting to add bookingId/userId to existing functions**: Always check function signatures
2. **Not following design system**: Copy color constants from existing templates
3. **Hardcoding URLs**: Always use `process.env.NEXTAUTH_URL`
4. **Not handling email failures gracefully**: Wrap in try-catch, log errors, don't fail operations
5. **Missing plain text versions**: Every HTML template needs plain text
6. **Not testing in production email clients**: Use Resend's preview or send test emails
7. **Logging PII**: Never log email content, only metadata
8. **Missing locale support**: All templates support 'de' and 'en'

---

## 📝 Commit Message Format

Follow existing convention:

```
feat(email): Add password reset email notification

Implements password reset flow with email notification including:
- Password reset request API route
- Token generation and storage
- Email template with reset link
- Password update verification page

Templates follow Massava corporate design with warm terracotta colors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🎯 Execution Command for Claude Code

**To execute this entire plan in a new Claude Code session, use this prompt:**

```
Execute the complete Email Notification Implementation Plan from EMAIL_IMPLEMENTATION_PLAN.md.

Start with Phase 1 and proceed through all 4 phases sequentially. Use appropriate subagents:
- feature-builder for full-stack implementations
- code-reviewer for quality checks after each phase
- test-generator for creating tests

For each task:
1. Read the design system from lib/email/templates.tsx
2. Create email templates matching the Massava corporate design exactly
3. Implement email sending functions
4. Integrate into the appropriate API routes/actions
5. Create comprehensive tests
6. Commit changes with proper message format

After each phase, run:
- npm run build (verify no errors)
- Run relevant tests
- Review code quality

Track progress using TodoWrite. Mark tasks as completed only when:
- Template created and follows design system
- Plain text version created
- Email sending function implemented
- Integration tested and working
- Tests passing
- Code committed

Do NOT skip any tasks. Do NOT deviate from the design system. Do NOT proceed to next phase until current phase is fully tested and committed.

Begin with Phase 1, Task 1.1: Password Reset Email Integration.
```

---

## ✅ Definition of Done

Each task is considered complete when:

- [x] Email template created following Massava design system
- [x] Plain text version created
- [x] Email sending function implemented in `lib/email/send.ts`
- [x] Function integrated into appropriate API route/action
- [x] Template supports German and English locales
- [x] Errors are logged with Winston
- [x] Email sending doesn't block main operations (graceful degradation)
- [x] Manual testing completed in real email client
- [x] Automated tests created and passing
- [x] Code committed with proper message format
- [x] npm run build succeeds

---

## 📞 Support & Questions

If you encounter issues during implementation:

1. **Check existing templates**: `lib/email/templates.tsx` lines 303-894
2. **Check email sending functions**: `lib/email/send.ts`
3. **Check Resend configuration**: `.env` file should have `RESEND_API_KEY`
4. **Review recent commits**: `git log --oneline -20` to see recent email work
5. **Check Resend dashboard**: https://resend.com/emails

---

**END OF IMPLEMENTATION PLAN**

Good luck! 🚀
