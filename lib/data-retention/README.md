# Data Retention & Deletion System

**GDPR Compliance Implementation**
- Article 5(1)(e): Storage Limitation
- Article 17: Right to Erasure
- Article 15: Right of Access

This system implements automated data retention policies and GDPR data subject rights for Massava.

## Overview

The data retention system automatically manages the lifecycle of user data according to legal requirements and GDPR regulations. It includes:

1. **Automated Retention Policies**: Scheduled deletion of old data
2. **Deletion Warnings**: Email notifications before deletion
3. **Soft Delete**: 30-day grace period before permanent deletion
4. **GDPR APIs**: Data export and deletion endpoints

## Retention Periods

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| User Account | 3 years after last activity | GDPR Art. 5(1)(e) |
| Health Data (Booking Messages) | 1 year OR consent revocation | GDPR Art. 9 |
| Bookings (Non-Health) | 3 years | Business requirement |
| Invoices | 10 years | Legal tax requirement |
| Audit Logs | 90 days | Security requirement |

### Soft Delete Grace Period
- **Duration**: 30 days
- **Purpose**: Allow users to recover accidentally deleted accounts
- **Implementation**: `deletedAt` timestamp marks soft deletion

### Warning Period
- **First Warning**: 7 days before deletion
- **Final Warning**: 24 hours before deletion
- **Cancellation**: Users can cancel via email link

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Data Retention System                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ Retention Policy │      │  Deletion        │        │
│  │     Engine       │──────│  Notifier        │        │
│  └──────────────────┘      └──────────────────┘        │
│           │                         │                    │
│           │                         │                    │
│           ▼                         ▼                    │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   Cron Job       │      │  Email Service   │        │
│  │  (Daily 2 AM)    │      │    (Resend)      │        │
│  └──────────────────┘      └──────────────────┘        │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   GDPR APIs      │      │   Audit Logs     │        │
│  │ (Export/Delete)  │──────│                  │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Files

### Core System
- `retention-policy.ts` - Retention policy engine
- `retention-policy.test.ts` - Unit tests
- `../cron/data-retention-job.ts` - Scheduled cron job
- `../notifications/deletion-notifier.ts` - Email notifications

### API Endpoints
- `app/api/gdpr/export-data/route.ts` - GDPR Art. 15 (Data Export)
- `app/api/gdpr/delete-data/route.ts` - GDPR Art. 17 (Data Deletion)

### Database
- `prisma/migrations/.../add_data_retention_fields/` - Schema migration

## Usage

### Running the Cron Job

#### Dry Run (Test Mode)
```bash
npm run data-retention:dry-run
```

This will:
- Simulate all retention policies
- Show what would be deleted
- NOT actually delete anything
- Log results

#### Production Run
```bash
npm run data-retention:execute
```

This will:
- Execute all retention policies
- Send deletion warnings
- Soft delete expired data
- Permanently delete after grace period

### Scheduling with Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/data-retention",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Create `/app/api/cron/data-retention/route.ts`:
```typescript
import { scheduledDataRetentionJob } from '@/lib/cron/data-retention-job';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  return scheduledDataRetentionJob();
}
```

### Manual Data Retention Check

```typescript
import { shouldDelete, shouldWarn } from '@/lib/data-retention/retention-policy';

// Check if user should be deleted
const user = await prisma.user.findUnique({ where: { id: userId } });
const result = shouldDelete(user, 'USER_ACCOUNT');

if (result.shouldDelete) {
  console.log('User should be deleted');
} else {
  console.log(`Days until deletion: ${result.daysUntilDeletion}`);
}

// Check if user needs warning
if (shouldWarn(user, 'USER_ACCOUNT')) {
  console.log('User needs deletion warning');
}
```

### GDPR Data Export

```bash
curl -X POST https://massava.app/api/gdpr/export-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "clxxx123",
    "format": "json"
  }'
```

Response:
```json
{
  "exportDate": "2025-11-04T20:36:00Z",
  "exportFormat": "json",
  "gdprArticle": "Article 15 - Right of Access",
  "userData": { ... },
  "bookings": [ ... ],
  "auditLogs": [ ... ]
}
```

### GDPR Data Deletion

```bash
curl -X POST https://massava.app/api/gdpr/delete-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "clxxx123",
    "confirmEmail": "user@example.com",
    "reason": "No longer using service"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Your account has been scheduled for deletion",
  "details": {
    "deletedAt": "2025-11-04T20:36:00Z",
    "gracePeriodEnds": "2025-12-04T20:36:00Z",
    "permanentDeletionIn": "30 days"
  },
  "gdprInfo": {
    "article": "GDPR Article 17 - Right to Erasure",
    "cancelDeletion": {
      "url": "/account/cancel-deletion"
    }
  }
}
```

### Cancel Scheduled Deletion

```bash
curl -X PUT https://massava.app/api/gdpr/delete-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "clxxx123"
  }'
```

## Database Schema

### User Model (Added Fields)

```prisma
model User {
  // ... existing fields ...

  // GDPR Data Retention
  deletedAt           DateTime? // Soft delete timestamp
  deletionScheduledAt DateTime? // Warning sent timestamp

  @@index([deletedAt])
  @@index([deletionScheduledAt])
}
```

## Testing

Run tests:
```bash
npm test lib/data-retention/retention-policy.test.ts
```

Test coverage:
- ✅ Retention period calculations
- ✅ Soft delete grace period
- ✅ Warning period logic
- ✅ Edge cases (boundary conditions)
- ✅ Data type specific retention

## Email Templates

### 7-Day Warning Email
- **Subject**: "Important: Your Massava account will be deleted in X days"
- **Content**: Explanation, what will be deleted, cancellation link
- **CTA**: "Keep My Account" button
- **Languages**: DE, EN

### 24-Hour Final Warning
- **Subject**: "FINAL WARNING: Your account will be deleted in 24 hours"
- **Content**: Urgent notice, last chance to cancel
- **CTA**: "KEEP MY ACCOUNT NOW" button (red theme)
- **Languages**: DE, EN

### Deletion Confirmation
- **Subject**: "Your Massava account has been deleted"
- **Content**: Confirmation of deletion, data removed notice
- **Languages**: DE, EN

## Monitoring & Logging

All retention operations are logged with:
- Action type
- User ID (if applicable)
- Timestamp
- Results (deleted count, warnings sent)
- Errors

Example log entry:
```json
{
  "timestamp": "2025-11-04T02:00:00Z",
  "level": "info",
  "message": "Data retention job completed",
  "action": "DATA_RETENTION_JOB",
  "results": {
    "USER_ACCOUNT": { "deletedCount": 5, "warnings": 12 },
    "HEALTH_DATA": { "deletedCount": 23 },
    "BOOKINGS": { "deletedCount": 145 },
    "AUDIT_LOGS": { "deletedCount": 8234 }
  },
  "executionTime": 1234,
  "errors": []
}
```

## Security Considerations

1. **Rate Limiting**: Data export limited to 3 per hour per user
2. **Authentication**: All APIs require valid authentication
3. **Audit Trail**: All deletions logged to audit log
4. **Irreversibility**: Permanent deletion after 30 days cannot be undone
5. **Legal Preservation**: Invoices retained for 10 years (tax law)

## GDPR Compliance Checklist

- ✅ Storage limitation (Art. 5(1)(e))
- ✅ Right of access (Art. 15) - Data export API
- ✅ Right to erasure (Art. 17) - Data deletion API
- ✅ Right to data portability (Art. 20) - JSON/CSV export
- ✅ Security of processing (Art. 32) - Audit logs, soft delete
- ✅ Data minimization (Art. 5(1)(c)) - Automated deletion
- ✅ Transparency (Art. 12-14) - Clear notification emails

## Troubleshooting

### Issue: Cron job not running
**Solution**: Check Vercel cron configuration and CRON_SECRET environment variable

### Issue: Emails not sending
**Solution**: Verify RESEND_API_KEY is set and valid

### Issue: Migration conflicts
**Solution**: Run `npx prisma migrate resolve --applied <migration_name>`

### Issue: Users complaining about deletion warnings
**Solution**: Check `updatedAt` timestamp - any activity should reset retention timer

## Future Enhancements

- [ ] Add ZIP export format with all data
- [ ] Implement CSV download for bookings
- [ ] Add user dashboard for deletion management
- [ ] Support for partial data deletion (selective)
- [ ] Implement data anonymization (instead of deletion)
- [ ] Add retention policy override for legal holds
- [ ] Multi-language support for all emails
- [ ] Add SMS notifications for final warnings

## Related Documentation

- [GDPR Compliance Audit](../../GDPR_COMPLIANCE_AUDIT_SUBDOMAIN_ARCHITECTURE.md)
- [Master Orchestration Plan](../../MASTER_ORCHESTRATION_PLAN.md)
- [Audit Logging](../audit.ts)
- [Email Service](../email/send.ts)

---

**Last Updated**: 2025-11-04
**Maintained By**: Roman Reinelt / RNLT Labs
**License**: All rights reserved
