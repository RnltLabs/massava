# Massava Email Notification Strategy - Complete Analysis

## Executive Summary

This analysis identifies **21 major email notification opportunities** across the Massava platform. Currently, **6 templates** are implemented but only **4 are actively being sent**. The platform has foundational email infrastructure (Resend integration, React email templates) but is missing critical notification flows.

**Key Finding**: Many TODO comments indicate where emails should be sent but aren't yet implemented.

---

## 1. IMPLEMENTED EMAIL NOTIFICATIONS (Active)

### 1.1 Email Verification (IMPLEMENTED)
- **Status**: ✅ IMPLEMENTED & ACTIVE
- **Trigger**: User registration (both customer and studio owner)
- **File**: `/Users/roman/Development/massava/app/actions/auth.ts` (lines 90-107)
- **Email Function**: `sendVerificationEmail()` in `/Users/roman/Development/massava/lib/email/send.ts`
- **Recipient**: Customer (verify email)
- **Template**: `EmailVerificationTemplate`
- **Locale Support**: ✅ German (de) and English (en)
- **Priority**: Critical
- **Details**:
  - Sent immediately after user registration
  - 24-hour token validity
  - Plain text + HTML versions
  - Proper error handling (non-blocking)

### 1.2 Welcome Email (IMPLEMENTED)
- **Status**: ✅ IMPLEMENTED (template exists, but NOT actively sent)
- **Trigger**: After email verification completed
- **File**: Would be triggered in `/Users/roman/Development/massava/app/[locale]/auth/verify-email/page.tsx` (NOT YET WIRED)
- **Email Function**: `sendWelcomeEmail()` in `/Users/roman/Development/massava/lib/email/send.ts`
- **Recipient**: Customer
- **Template**: `WelcomeEmailTemplate`
- **Locale Support**: ✅ German (de) and English (en)
- **Priority**: Important
- **Details**:
  - Personalized with user's name
  - Contains studio discovery CTA
  - List of available features
  - Plain text + HTML versions

### 1.3 Booking Request Received (IMPLEMENTED)
- **Status**: ✅ IMPLEMENTED & ACTIVE
- **Trigger**: Customer submits booking request (either authenticated or guest)
- **Files**: 
  - `/Users/roman/Development/massava/app/actions/createBooking.ts` (lines 149-177)
  - `/Users/roman/Development/massava/app/[locale]/api/bookings-unified/route.ts` (line 234 - TODO comment, not yet sent)
  - `/Users/roman/Development/massava/app/[locale]/api/bookings/route.ts` (line 122 - TODO comment, not yet sent)
- **Email Function**: `sendBookingRequestReceivedEmail()` in `/Users/roman/Development/massava/lib/email/send.ts`
- **Recipient**: Customer (customerEmail)
- **Template**: `BookingRequestReceivedTemplate`
- **Locale Support**: ✅ German (de) and English (en)
- **Priority**: Critical
- **Details**:
  - Includes booking ID for reference
  - Shows service, date, time, studio name
  - Explains next steps (waiting for confirmation)
  - Includes customer's message if provided
  - Plain text + HTML versions
  - Currently only active in server action, not API routes

### 1.4 Booking Confirmation (IMPLEMENTED)
- **Status**: ✅ IMPLEMENTED & ACTIVE
- **Trigger**: Studio owner confirms pending booking
- **Files**:
  - `/Users/roman/Development/massava/app/actions/studio/confirmBooking.ts` (lines 91-120)
  - `/Users/roman/Development/massava/app/api/business/bookings/[id]/status/route.ts` (line 124 - TODO comment, not yet sent)
- **Email Function**: `sendBookingConfirmationEmail()` in `/Users/roman/Development/massava/lib/email/send.ts`
- **Recipient**: Customer (customerEmail)
- **Template**: `BookingConfirmationTemplate`
- **Locale Support**: ✅ German (de) and English (en)
- **Priority**: Critical
- **Details**:
  - Confirms booking is approved
  - Includes studio address & phone (if available)
  - Shows appointment details
  - Includes optional message from studio
  - Guidance on next steps
  - Plain text + HTML versions

### 1.5 Booking Cancellation/Decline (IMPLEMENTED)
- **Status**: ✅ IMPLEMENTED & ACTIVE
- **Trigger**: Studio owner declines pending booking
- **Files**:
  - `/Users/roman/Development/massava/app/actions/studio/confirmBooking.ts` (lines 211-239, `declineBooking`)
  - `/Users/roman/Development/massava/app/api/business/bookings/[id]/status/route.ts` (line 124 - TODO comment, not yet sent)
- **Email Function**: `sendBookingCancellationEmail()` in `/Users/roman/Development/massava/lib/email/send.ts`
- **Recipient**: Customer (customerEmail)
- **Template**: `BookingCancellationTemplate`
- **Locale Support**: ✅ German (de) and English (en)
- **Priority**: Critical
- **Details**:
  - Informs customer of booking decline
  - Includes decline reason (optional)
  - Encourages finding alternative bookings
  - Suggests other studios
  - Plain text + HTML versions

### 1.6 Password Reset Email (IMPLEMENTED - Template Only)
- **Status**: ✅ TEMPLATE EXISTS (not yet active)
- **Trigger**: User requests password reset
- **File**: `/Users/roman/Development/massava/app/actions/auth.ts` (lines 324-326 - TODO comment)
- **Email Function**: `sendPasswordResetEmail()` in `/Users/roman/Development/massava/lib/email/send.ts`
- **Recipient**: User (email)
- **Template**: `PasswordResetTemplate`
- **Locale Support**: ✅ German (de) and English (en)
- **Priority**: Critical
- **Details**:
  - Generates reset token (cryptographically secure)
  - Stores in `PasswordResetToken` table
  - Token expires in 1 hour
  - Template ready but email not being sent
  - Plain text + HTML versions

---

## 2. MISSING EMAIL NOTIFICATIONS (High Priority)

### 2.1 Password Reset Confirmation Email
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: User successfully changes password via reset link
- **Recipient**: User (confirmation of change)
- **Priority**: Important
- **Action**: 
  - Create endpoint that handles reset token verification
  - Send confirmation email after password is updated
  - Add email template: `PasswordResetConfirmationTemplate`

### 2.2 Email Change Verification
- **Status**: ⚠️ PARTIALLY IMPLEMENTED (TODO comments present)
- **Trigger**: User initiates email address change in account settings
- **Files**: `/Users/roman/Development/massava/app/[locale]/business/actions/account.ts` (lines 82-134)
- **Current Implementation**:
  - `requestEmailChange()` generates verification code but doesn't send email (line 120 - TODO)
  - `verifyEmailChange()` updates email but no confirmation email (line 159 - TODO)
- **Recipient**: Both old email (verification) and new email (confirmation)
- **Priority**: Important
- **Action**:
  - Send verification code to old email address
  - After verification, send confirmation to new email
  - Add database field for storing temporary verification codes

### 2.3 Email Change Confirmation
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Email address successfully changed
- **Recipient**: User (new email address)
- **Priority**: Important
- **Action**: Send confirmation that email has been updated

### 2.4 2FA Enabled Confirmation
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: User successfully enables two-factor authentication
- **Recipient**: User email
- **Priority**: Important (security notification)
- **File**: `/Users/roman/Development/massava/app/[locale]/business/actions/account.ts` (lines 290-351)
- **Action**: Send confirmation with recovery codes

### 2.5 2FA Disabled Confirmation
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: User successfully disables two-factor authentication
- **Recipient**: User email
- **Priority**: Important (security notification)
- **File**: `/Users/roman/Development/massava/app/[locale]/business/actions/account.ts` (lines 356-402)
- **Action**: Send security alert confirming 2FA has been disabled

### 2.6 Studio Registration Confirmation
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Studio owner successfully registers new studio
- **Recipient**: Studio owner (user email)
- **File**: `/Users/roman/Development/massava/app/actions/studio/registerStudio.ts`
- **Priority**: Important
- **Content Should Include**:
  - Studio name and details
  - Next steps (add services, set opening hours, etc.)
  - Link to studio settings
  - Tips for getting started

### 2.7 Studio Deletion Scheduled Confirmation
- **Status**: ⚠️ PARTIALLY IMPLEMENTED (TODO comment)
- **Trigger**: Studio owner schedules studio for deletion (30-day grace period)
- **File**: `/Users/roman/Development/massava/app/[locale]/business/actions/account.ts` (lines 550-616, line 600 - TODO)
- **Recipient**: Studio owner (user email)
- **Priority**: Critical
- **Content Should Include**:
  - Confirmation of deletion schedule
  - Deletion date
  - Link to cancel deletion
  - Warning about booking cancellations

### 2.8 Studio Deletion Confirmed (Final)
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Studio is permanently deleted (after 30-day grace period)
- **Recipient**: Studio owner (user email)
- **Priority**: Important
- **Content**: Final confirmation that studio has been deleted

### 2.9 Account Deletion Confirmation
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: User permanently deletes their account
- **File**: `/Users/roman/Development/massava/app/api/user/delete/route.ts`
- **Recipient**: User email (optional, account is deleted)
- **Priority**: Important (GDPR compliance)
- **Content Should Include**:
  - Confirmation of deletion
  - Data retention information
  - Next steps if account deletion was accidental

### 2.10 Account Data Export (GDPR)
- **Status**: ⚠️ PARTIALLY IMPLEMENTED (no email delivery)
- **Trigger**: User requests data export (GDPR Art. 15)
- **File**: `/Users/roman/Development/massava/app/[locale]/business/actions/account.ts` (lines 503-546)
- **Current Implementation**:
  - Data is collected but not emailed to user
  - User gets JSON response directly (not GDPR-compliant)
- **Priority**: Critical (GDPR compliance)
- **Action**: Email exported data as attachment to user

### 2.11 Magic Link Login Email
- **Status**: ⚠️ IMPLEMENTED (TODO comment)
- **Trigger**: User requests passwordless login via magic link
- **File**: `/Users/roman/Development/massava/app/api/auth/magic-link/request/route.ts` (line 83 - TODO)
- **Current Status**: 
  - Link is generated but NOT emailed
  - In development mode, link is returned in response
  - Production has no email delivery (BUG)
- **Recipient**: User email
- **Priority**: Critical
- **Action**: Send magic link email (implement missing TODO)

---

## 3. MISSING STUDIO OWNER NOTIFICATIONS

### 3.1 New Booking Request Notification
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Customer submits booking request to studio
- **Recipients**: Studio owner (all studio owners)
- **Priority**: Critical
- **Action**: Create `NewBookingRequestTemplate`
- **Content Should Include**:
  - Customer name
  - Service requested
  - Preferred date & time
  - Customer message (if any)
  - Link to view/confirm booking in dashboard
  - Quick action buttons (confirm/decline)

### 3.2 Booking Confirmation by Studio
- **Status**: ⚠️ TODO EXISTS (not yet sent)
- **Trigger**: Studio owner confirms a booking
- **File**: `/Users/roman/Development/massava/app/api/business/bookings/[id]/status/route.ts` (line 124)
- **Recipients**: Customer (already implemented via action)
- **Priority**: Critical
- **Status**: Customer email is sent via server action, but API route has TODO comment

### 3.3 Upcoming Appointment Reminder
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Scheduled job (24 hours before appointment)
- **Recipients**: Both customer and studio owner
- **Priority**: Important
- **Action**:
  - Create cron job or scheduled task
  - Send reminder email template
  - Track which emails have been sent (add field to booking model)

### 3.4 Appointment Cancellation by Studio
- **Status**: ⚠️ PARTIALLY IMPLEMENTED (TODO exists)
- **Trigger**: Studio owner cancels a confirmed booking
- **File**: `/Users/roman/Development/massava/app/api/business/bookings/[id]/status/route.ts` (line 124)
- **Recipients**: Customer
- **Priority**: Critical
- **Action**: Implement cancellation email in API route (TODO comment)

### 3.5 Appointment Cancellation by Customer
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Customer cancels their confirmed booking
- **Recipients**: Studio owner
- **Priority**: Important
- **Content Should Include**:
  - Customer name
  - Service
  - Original appointment date/time
  - Reason for cancellation (if provided)

---

## 4. MISSING CUSTOMER NOTIFICATIONS

### 4.1 Booking Modification/Update Notification
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Confirmed booking is rescheduled by studio or customer
- **Recipients**: Both customer and studio owner
- **Priority**: Important
- **Content Should Include**:
  - Old appointment details
  - New appointment details
  - Reason for change (if provided)

### 4.2 Review/Rating Request Email
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: After appointment completion (scheduled task)
- **Recipient**: Customer
- **Priority**: Nice-to-have (engagement)
- **Content Should Include**:
  - Studio name and service completed
  - Link to review/rating form
  - Call-to-action to share experience
  - Photos of studio (if available)

### 4.3 Abandoned Booking Recovery Email
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: User starts booking but abandons (24 hours after abandonment)
- **Recipients**: Customer
- **Priority**: Nice-to-have (engagement)
- **Content Should Include**:
  - Partially filled booking details
  - Link to resume booking
  - Special offer/incentive (optional)
  - List of alternative studios

---

## 5. MISSING MARKETING/ENGAGEMENT EMAILS

### 5.1 Newsletter/Updates Email
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Scheduled newsletter (weekly/monthly)
- **Recipients**: All users (opt-in preference)
- **Priority**: Nice-to-have
- **Content Should Include**:
  - New studios added
  - Featured studios
  - Tips & wellness articles
  - Company news

### 5.2 Personalized Studio Recommendations
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Based on user's search/booking history
- **Recipients**: Customer
- **Priority**: Nice-to-have
- **Content Should Include**:
  - Studios matching preferences
  - Similar services nearby
  - Promotional offers

### 5.3 Win-Back Campaign Email
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: User inactive for 30+ days
- **Recipients**: Inactive customers
- **Priority**: Nice-to-have
- **Content Should Include**:
  - Latest studios in their area
  - Special offer to return
  - New features available

---

## 6. MISSING ADMIN/SYSTEM NOTIFICATIONS

### 6.1 New Studio Registration Admin Alert
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: New studio registered by owner
- **Recipients**: Admin/support team
- **Priority**: Important (moderation)
- **Content Should Include**:
  - Studio name and details
  - Owner information
  - Link to admin dashboard
  - Quick actions (approve/verify)

### 6.2 Suspicious Activity Alert
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Multiple failed login attempts, rate limit violations, etc.
- **Recipients**: User (security alert) and admin (alert)
- **Priority**: Important (security)
- **Action**: Implement security alert templates

### 6.3 System Error/Failure Notification
- **Status**: ❌ MISSING IMPLEMENTATION
- **Trigger**: Critical system errors, database issues
- **Recipients**: Admin/ops team
- **Priority**: Critical

---

## 7. IMPLEMENTATION STATUS SUMMARY

| Category | Count | Implemented | Partial | Missing |
|----------|-------|-------------|---------|---------|
| User Account (Auth/Account) | 9 | 1 | 3 | 5 |
| Booking Lifecycle | 7 | 3 | 2 | 2 |
| Studio Owner Notifications | 5 | 0 | 2 | 3 |
| Customer Engagement | 3 | 0 | 0 | 3 |
| Marketing/Engagement | 3 | 0 | 0 | 3 |
| Admin/System | 3 | 0 | 0 | 3 |
| **TOTAL** | **30** | **4** | **7** | **19** |

---

## 8. CRITICAL IMPLEMENTATION GAPS (Must-Fix)

### 8.1 Magic Link Email (Production Bug)
- **Severity**: Critical
- **Impact**: Passwordless login doesn't work in production
- **Fix Location**: `/Users/roman/Development/massava/app/api/auth/magic-link/request/route.ts`
- **Action**: Call `sendMagicLinkEmail()` (need to create template)

### 8.2 Password Reset Email (Not Active)
- **Severity**: Critical
- **Impact**: Users can't reset passwords
- **Fix Location**: `/Users/roman/Development/massava/app/actions/auth.ts` (line 324)
- **Action**: Implement call to `sendPasswordResetEmail()`

### 8.3 API Route Email Notifications
- **Severity**: Critical
- **Impact**: API route bookings don't send confirmation emails
- **Fix Locations**:
  - `/Users/roman/Development/massava/app/[locale]/api/bookings-unified/route.ts` (line 234)
  - `/Users/roman/Development/massava/app/[locale]/api/bookings/route.ts` (line 122)
  - `/Users/roman/Development/massava/app/api/business/bookings/[id]/status/route.ts` (line 124)
- **Action**: Add email sending logic to these routes

### 8.4 Welcome Email After Verification
- **Severity**: Important
- **Impact**: Users don't receive onboarding email
- **Fix Location**: `/Users/roman/Development/massava/app/[locale]/auth/verify-email/page.tsx`
- **Action**: Call `sendWelcomeEmail()` after successful verification

### 8.5 Email Change Verification
- **Severity**: Important
- **Impact**: Email change flow not functional
- **Fix Location**: `/Users/roman/Development/massava/app/[locale]/business/actions/account.ts` (lines 120, 159)
- **Action**: 
  1. Send verification code to old email
  2. Send confirmation to new email

### 8.6 Studio Deletion Confirmation
- **Severity**: Important (Compliance)
- **Impact**: Users not notified of scheduled deletion
- **Fix Location**: `/Users/roman/Development/massava/app/[locale]/business/actions/account.ts` (line 600)
- **Action**: Send scheduled deletion confirmation email

---

## 9. IMPLEMENTATION RECOMMENDATIONS

### Phase 1: Critical Fixes (Week 1-2)
1. ✅ Create `SendMagicLinkEmail` template and implement in magic link API
2. ✅ Implement password reset email sending
3. ✅ Add email sending to API routes (bookings unified, bookings, booking status)
4. ✅ Send welcome email after email verification

### Phase 2: Account Management (Week 2-3)
1. Implement email change verification flow
2. Add 2FA enable/disable confirmation emails
3. Implement account deletion confirmation
4. Implement studio deletion confirmation/cancellation

### Phase 3: Studio Owner Notifications (Week 3-4)
1. Create new booking request notification template
2. Implement studio owner new booking alerts
3. Add appointment reminders (24 hours before)

### Phase 4: Customer Engagement (Week 4-5)
1. Create review request email template
2. Implement abandoned booking recovery
3. Add customer appointment reminders

### Phase 5: Marketing & Admin (Week 5-6)
1. Newsletter infrastructure
2. Admin notifications (new studios, suspicious activity)
3. Personalized recommendations

---

## 10. EMAIL TEMPLATE REQUIREMENTS

### Existing Templates (Ready)
- ✅ EmailVerificationTemplate
- ✅ WelcomeEmailTemplate
- ✅ PasswordResetTemplate
- ✅ BookingRequestReceivedTemplate
- ✅ BookingConfirmationTemplate
- ✅ BookingCancellationTemplate

### New Templates Needed
1. ❌ MagicLinkEmailTemplate
2. ❌ PasswordResetConfirmationTemplate
3. ❌ EmailChangeVerificationTemplate
4. ❌ EmailChangeConfirmationTemplate
5. ❌ TwoFactorEnabledTemplate
6. ❌ TwoFactorDisabledTemplate
7. ❌ StudioRegistrationTemplate
8. ❌ StudioDeletionScheduledTemplate
9. ❌ StudioDeletionConfirmedTemplate
10. ❌ AccountDeletionTemplate
11. ❌ NewBookingRequestTemplate (for studio owner)
12. ❌ AppointmentReminderTemplate
13. ❌ BookingModificationTemplate
14. ❌ ReviewRequestTemplate
15. ❌ AbandonedBookingRecoveryTemplate

---

## 11. DATABASE CHANGES REQUIRED

### User Model Enhancements
- [ ] `emailNotifications: JSON` (notification preferences)
- [ ] `twoFactorEnabled: Boolean`
- [ ] `twoFactorSecret: String` (encrypted)
- [ ] `preferredLanguage: String` (for locale-specific emails)
- [ ] `lastNotificationAt: DateTime` (prevent duplicate sends)

### EmailChangeToken Table (New)
- `token: String` (unique)
- `email: String`
- `newEmail: String`
- `expiresAt: DateTime`
- `used: Boolean`

### Booking Model Enhancements
- [ ] `reminderSentAt: DateTime?` (track reminder sends)
- [ ] `reviewRequestSentAt: DateTime?`
- [ ] `customerCancelledAt: DateTime?`
- [ ] `customerCancelReason: String?`

---

## 12. LOCALE SUPPORT

All email templates should support:
- ✅ German (de) - Primary
- ✅ English (en) - Secondary

**Current Status**: 
- Templates have bilingual content
- Need to ensure locale is passed correctly throughout the application

---

## 13. CRON JOBS NEEDED

```typescript
// Appointment Reminders (daily at 10:00 AM)
- Find all bookings with date = tomorrow
- Send reminder emails if not already sent

// Abandoned Booking Recovery (daily at 2:00 PM)
- Find bookings abandoned > 24 hours ago
- Send recovery email

// Win-back Campaign (weekly)
- Find inactive users (30+ days no action)
- Send engagement email

// Newsletter (weekly/monthly)
- Get opt-in users
- Send newsletter
```

---

## 14. SECURITY & COMPLIANCE CHECKLIST

### Email Verification
- ✅ Rate limiting on resend (implemented)
- ✅ Token expiration (24 hours)
- ✅ One-time token use enforcement
- ✅ Secure token generation (randomBytes)

### Password Reset
- ✅ Token expiration (1 hour)
- ⚠️ TODO: Implement "did not request" flow

### Email Change
- ❌ Verification code not stored
- ❌ No expiration on codes
- ❌ No rate limiting on code requests

### GDPR Compliance
- ⚠️ Data export (GDPR Art. 15) - not emailed to user
- ⚠️ Account deletion confirmation missing
- ⚠️ Audit trail for email sends incomplete

---

## 15. MONITORING & ANALYTICS

### Email Metrics to Track
- Email delivery rate (via Resend analytics)
- Open rate (if using Resend tracking)
- Click rate
- Bounce rate
- Unsubscribe rate

### Implementation:
- Resend API includes built-in analytics tags
- All emails already tagged with type and locale (see `sendVerificationEmail`)
- Dashboard should surface these metrics

---

## 16. LOCALIZATION CHECKLIST

- ✅ Email sending function accepts locale parameter
- ✅ All templates have German (de) and English (en) content
- ✅ Templates use locale dynamically
- ⚠️ TODO: Pass locale through entire request chain
  - Auth flow: from registration
  - Booking flow: from request headers
  - API routes: from user preferences or Accept-Language header

---

## CONCLUSION

The Massava platform has solid email infrastructure (Resend integration, React-based templates, bilingual support) but lacks comprehensive notification coverage. 

**Key Statistics**:
- **4 email templates actively sending** (out of 6 created)
- **7 partial implementations** (templates exist, logic incomplete)
- **19 missing notifications** (templates not created, no implementation)

**Recommended Priority**: Fix critical bugs (magic link, password reset) before building new features.

**Estimated Implementation Time**: 3-4 weeks for all notifications (phased approach recommended)

