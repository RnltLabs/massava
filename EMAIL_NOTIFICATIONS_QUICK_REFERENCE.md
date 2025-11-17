# Email Notifications Quick Reference

## Critical Bugs (Fix First)

| Issue | Location | Action |
|-------|----------|--------|
| Magic Link not emailed | `/app/api/auth/magic-link/request/route.ts:83` | Create `MagicLinkTemplate`, call `sendMagicLinkEmail()` |
| Password reset not emailed | `/app/actions/auth.ts:324` | Call `sendPasswordResetEmail()` |
| API bookings no email | `/app/[locale]/api/bookings-unified/route.ts:234` | Call `sendBookingRequestReceivedEmail()` |
| API bookings no email | `/app/[locale]/api/bookings/route.ts:122` | Call `sendBookingRequestReceivedEmail()` |
| API status update no email | `/app/api/business/bookings/[id]/status/route.ts:124` | Call `sendBookingConfirmationEmail()` |

## Partially Implemented (Complete)

| Feature | Location | Status |
|---------|----------|--------|
| Email Change | `/app/[locale]/business/actions/account.ts:120` | Send verification code email |
| Email Change | `/app/[locale]/business/actions/account.ts:159` | Send confirmation email |
| Studio Deletion | `/app/[locale]/business/actions/account.ts:600` | Send scheduled deletion email |
| Welcome Email | `/app/[locale]/auth/verify-email/page.tsx` | Wire up `sendWelcomeEmail()` |

## Email Sending Functions (Ready to Use)

```typescript
// Location: /lib/email/send.ts

sendVerificationEmail(email, verificationUrl, locale) // ✅ Used
sendWelcomeEmail(email, name, locale) // ⚠️ Template ready, not called
sendPasswordResetEmail(email, resetUrl, locale) // ⚠️ Template ready, not called
sendBookingRequestReceivedEmail(email, bookingDetails, locale) // ✅ Used
sendBookingConfirmationEmail(email, bookingDetails, locale) // ✅ Used
sendBookingCancellationEmail(email, bookingDetails, locale) // ✅ Used
```

## Missing Email Templates Needed

### Phase 1 (Critical)
1. `MagicLinkEmailTemplate` - For passwordless login
2. `PasswordResetConfirmationTemplate` - After password change

### Phase 2 (Account Management)
3. `EmailChangeVerificationTemplate`
4. `EmailChangeConfirmationTemplate`
5. `TwoFactorEnabledTemplate`
6. `TwoFactorDisabledTemplate`

### Phase 3 (Studio Owner)
7. `NewBookingRequestTemplate` - Alert studio of new request
8. `StudioRegistrationTemplate` - Welcome email after registration
9. `StudioDeletionScheduledTemplate` - Alert of pending deletion

### Phase 4+ (Nice-to-have)
10-15. Review requests, abandoned booking recovery, admin alerts, etc.

## File Locations Summary

### Email Infrastructure
- Templates: `/lib/email/templates.tsx`
- Sending function: `/lib/email/send.ts`
- Email verification flow: `/lib/email-verification.ts`

### Where Emails Are Triggered
- Auth: `/app/actions/auth.ts`
- Bookings (server action): `/app/actions/createBooking.ts`
- Bookings (confirm/decline): `/app/actions/studio/confirmBooking.ts`
- Account settings: `/app/[locale]/business/actions/account.ts`

### TODO Comments to Implement
- `/app/actions/auth.ts:324` - Password reset email
- `/app/[locale]/business/actions/account.ts:120` - Email change verification
- `/app/[locale]/business/actions/account.ts:159` - Email change confirmation
- `/app/[locale]/business/actions/account.ts:600` - Studio deletion confirmation
- `/app/api/auth/magic-link/request/route.ts:83` - Magic link email
- `/app/[locale]/api/bookings-unified/route.ts:234` - Booking confirmation
- `/app/[locale]/api/bookings/route.ts:122` - Studio notification
- `/app/api/business/bookings/[id]/status/route.ts:124` - Status change notification

## Database Enhancements Needed

### EmailChangeToken Table
```prisma
model EmailChangeToken {
  id        String   @id @default(cuid())
  token     String   @unique
  email     String
  newEmail  String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@index([email])
  @@index([token])
}
```

### NewBooking Model Updates
```prisma
reminderSentAt DateTime?
reviewRequestSentAt DateTime?
customerCancelledAt DateTime?
customerCancelReason String?
```

## Testing Checklist

- [ ] Email verification (signup)
- [ ] Welcome email (after verification)
- [ ] Booking request received (customer)
- [ ] Booking confirmation (studio owner confirms)
- [ ] Booking cancellation (studio owner declines)
- [ ] Password reset email (forgot password)
- [ ] Magic link email (passwordless login)
- [ ] Email change verification
- [ ] Email change confirmation
- [ ] Studio registration confirmation
- [ ] Studio deletion scheduled
- [ ] 2FA enabled notification
- [ ] 2FA disabled notification

## Resend Configuration

- API Key: `process.env.RESEND_API_KEY`
- From Email: `process.env.RESEND_FROM_EMAIL` or default `noreply@massava.app`
- Status: ✅ Configured and working

## Locale Support

All functions accept `locale` parameter:
- `de` - German (default)
- `en` - English

All templates have bilingual content prepared.

## Implementation Order (Recommended)

1. **Week 1**: Fix critical bugs (magic link, password reset, API routes)
2. **Week 2**: Complete account management (email change, 2FA, studio deletion)
3. **Week 3**: Add studio owner notifications (new bookings, reminders)
4. **Week 4**: Add customer engagement (reviews, abandoned booking recovery)
5. **Week 5+**: Marketing & admin notifications

---

**Total Missing**: 19 notifications across 6 categories
**Currently Active**: 4 out of 6 templates
**Infrastructure Ready**: ✅ Resend, templates, email sending functions
