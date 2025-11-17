# Phase 3: Studio Owner Notifications - Quick Reference

**Last Updated**: 2025-11-17

---

## Sending Studio Owner Emails

### 1. New Booking Notification (TASK 3.1)

**When**: Customer creates a booking
**Status**: ✅ Fully integrated

```typescript
import { sendNewBookingNotificationToOwner } from '@/lib/email/send';

await sendNewBookingNotificationToOwner(
  ownerEmail,
  {
    studioName: 'Massage Studio Berlin',
    ownerName: 'Max Mustermann',
    bookingId: 'bk_12345',
    customerName: 'Anna Schmidt',
    customerEmail: 'anna@example.com',
    customerPhone: '+49 123 456789', // optional
    serviceName: 'Thai Massage',
    bookingDate: '15. November 2025',
    bookingTime: '14:00',
    message: 'Bitte leise klopfen', // optional
    dashboardUrl: 'https://massava.app/de/business/calendar',
  },
  'de' // locale
);
```

**Integration**: `/app/actions/createBooking.ts` (lines 182-237)

---

### 2. Booking Cancelled by Customer (TASK 3.2)

**When**: Customer cancels their booking
**Status**: ⚠️ Template ready, awaiting implementation

```typescript
import { sendBookingCancelledByCustomerToOwner } from '@/lib/email/send';

await sendBookingCancelledByCustomerToOwner(
  ownerEmail,
  {
    studioName: 'Massage Studio Berlin',
    ownerName: 'Max Mustermann',
    bookingId: 'bk_12345',
    customerName: 'Anna Schmidt',
    serviceName: 'Thai Massage',
    bookingDate: '15. November 2025',
    bookingTime: '14:00',
    cancellationReason: 'Terminverschiebung', // optional
    dashboardUrl: 'https://massava.app/de/business/calendar',
  },
  'de'
);
```

**TODO**: See `/app/actions/cancelBooking.ts` for integration instructions

---

### 3. Studio Registration Welcome (TASK 3.3)

**When**: New studio is registered
**Status**: ✅ Fully integrated

```typescript
import { sendStudioRegistrationWelcomeEmail } from '@/lib/email/send';

await sendStudioRegistrationWelcomeEmail(
  ownerEmail,
  {
    studioName: 'Massage Studio Berlin',
    ownerName: 'Max Mustermann',
    studioId: 'studio_abc123',
    dashboardUrl: 'https://massava.app/de/business/studios',
    onboardingUrl: 'https://massava.app/de/business/studios/studio_abc123/onboarding',
  },
  'de'
);
```

**Integration**: `/app/actions/studio/registerStudio.ts` (lines 149-183)

---

### 4. Studio Deletion Warning (TASK 3.4a)

**When**: Studio scheduled for deletion (30-day grace period)
**Status**: ⚠️ Template ready, awaiting scheduling system

```typescript
import { sendStudioDeletionWarningEmail } from '@/lib/email/send';

await sendStudioDeletionWarningEmail(
  ownerEmail,
  {
    studioName: 'Massage Studio Berlin',
    ownerName: 'Max Mustermann',
    deletionDate: '15. Dezember 2025',
    cancelUrl: 'https://massava.app/de/business/studios/studio_abc123/cancel-deletion',
  },
  'de'
);
```

**TODO**: See `/app/actions/studio/scheduleStudioDeletion.ts` for implementation guide

---

### 5. Studio Deletion Confirmed (TASK 3.4b)

**When**: Studio is permanently deleted
**Status**: ✅ Fully integrated

```typescript
import { sendStudioDeletionConfirmedEmail } from '@/lib/email/send';

await sendStudioDeletionConfirmedEmail(
  ownerEmail,
  {
    studioName: 'Massage Studio Berlin',
    ownerName: 'Max Mustermann',
  },
  'de'
);
```

**Integration**: `/app/actions/studio/deleteStudio.ts` (lines 173-193)

---

## Getting All Studio Owners

To send notifications to all owners of a studio:

```typescript
import { prisma } from '@/lib/prisma';

const studioOwnerships = await prisma.studioOwnership.findMany({
  where: { studioId: 'studio_abc123' },
  include: {
    user: {
      select: {
        email: true,
        name: true,
      },
    },
  },
});

// Send to all owners
for (const ownership of studioOwnerships) {
  if (ownership.user.email) {
    await sendNewBookingNotificationToOwner(
      ownership.user.email,
      { /* ... */ },
      'de'
    );
  }
}
```

---

## Email Response Handling

All email functions return `SendEmailResult`:

```typescript
interface SendEmailResult {
  success: boolean;
  messageId?: string; // Resend message ID
  error?: string;     // Error message if failed
}
```

**Best Practice**: Don't fail the main operation if email fails

```typescript
try {
  const emailResult = await sendStudioRegistrationWelcomeEmail(...);

  if (!emailResult.success) {
    console.error('Failed to send email:', emailResult.error);
    // Log but continue - don't throw
  } else {
    console.log('Email sent:', emailResult.messageId);
  }
} catch (emailError) {
  console.error('Email exception:', emailError);
  // Log but continue - don't throw
}
```

---

## Localization

All emails support `de` (German) and `en` (English):

```typescript
// German (default)
await sendNewBookingNotificationToOwner(email, data, 'de');

// English
await sendNewBookingNotificationToOwner(email, data, 'en');
```

**Future**: Get locale from user settings:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { locale: true },
});

await sendEmail(email, data, user.locale || 'de');
```

---

## Date Formatting

For consistent German date formatting:

```typescript
const bookingDate = new Date(booking.preferredDate).toLocaleDateString('de-DE', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
// Output: "Mittwoch, 15. November 2025"
```

---

## Dashboard URLs

Construct URLs from environment:

```typescript
const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Business dashboard (general)
const dashboardUrl = `${appUrl}/de/business`;

// Calendar view (bookings)
const calendarUrl = `${appUrl}/de/business/calendar`;

// Studio list
const studiosUrl = `${appUrl}/de/business/studios`;

// Studio onboarding
const onboardingUrl = `${appUrl}/de/business/studios/${studioId}/onboarding`;

// Cancel deletion
const cancelUrl = `${appUrl}/de/business/studios/${studioId}/cancel-deletion`;
```

---

## Logging

All email functions use structured logging:

```typescript
import { logger } from '@/lib/logger';

logger.info('Email sent successfully', {
  action: 'SEND_NEW_BOOKING_NOTIFICATION_TO_OWNER',
  ownerEmail: 'owner@example.com',
  bookingId: 'bk_12345',
  messageId: 'msg_abc123',
  locale: 'de',
});

logger.error('Email failed', {
  action: 'SEND_NEW_BOOKING_NOTIFICATION_TO_OWNER',
  ownerEmail: 'owner@example.com',
  error: 'SMTP connection failed',
  stack: error.stack,
});
```

**Log Actions**:
- `SEND_NEW_BOOKING_NOTIFICATION_TO_OWNER`
- `SEND_BOOKING_CANCELLED_BY_CUSTOMER_TO_OWNER`
- `SEND_STUDIO_REGISTRATION_WELCOME_EMAIL`
- `SEND_STUDIO_DELETION_WARNING_EMAIL`
- `SEND_STUDIO_DELETION_CONFIRMED_EMAIL`

---

## Testing

### Manual Testing (Development)

```bash
# Set up environment
export RESEND_API_KEY=your_key_here
export NEXTAUTH_URL=http://localhost:3000

# Start development server
npm run dev

# Create a booking or register a studio
# Check email in Resend dashboard
```

### Preview Templates

Templates are in `/lib/email/templates.tsx`:
- `NewBookingNotificationTemplate`
- `BookingCancelledByCustomerTemplate`
- `StudioRegistrationWelcomeTemplate`
- `StudioDeletionWarningTemplate`
- `StudioDeletionConfirmedTemplate`

---

## Troubleshooting

### Email not sending

1. **Check API key**: `echo $RESEND_API_KEY`
2. **Check logs**: Look for `Email sending failed` in console
3. **Verify email**: Ensure recipient email is valid
4. **Check Resend dashboard**: View sending status and errors

### Wrong locale

1. **Check function call**: Ensure locale parameter is set
2. **Default is 'de'**: If no locale specified, German is used
3. **Add user locale**: Fetch from user settings in future

### Missing data

1. **Check booking query**: Ensure all needed relations are included
2. **Verify studio ownership**: Check StudioOwnership table
3. **Fallback values**: Use `|| 'Default Value'` for optional fields

---

## Files Reference

### Email Templates
- `/lib/email/templates.tsx` (lines 2137-3089)

### Sending Functions
- `/lib/email/send.ts` (lines 1061-1609)

### Integrations
- `/app/actions/createBooking.ts` (TASK 3.1)
- `/app/actions/studio/registerStudio.ts` (TASK 3.3)
- `/app/actions/studio/deleteStudio.ts` (TASK 3.4b)

### TODO Placeholders
- `/app/actions/cancelBooking.ts` (TASK 3.2)
- `/app/actions/studio/scheduleStudioDeletion.ts` (TASK 3.4a)

### Documentation
- `/PHASE_3_STUDIO_OWNER_NOTIFICATIONS_SUMMARY.md` (comprehensive)
- `/PHASE_3_QUICK_REFERENCE.md` (this file)

---

## Support

For questions or issues:
1. Check comprehensive summary: `PHASE_3_STUDIO_OWNER_NOTIFICATIONS_SUMMARY.md`
2. Review TODO files for integration instructions
3. Check Resend dashboard for email delivery status
4. Review structured logs for debugging

---

**Last Updated**: 2025-11-17
