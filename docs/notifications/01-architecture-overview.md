# Architecture Overview

## Executive Summary

This document describes the notification system architecture for Massava. The system supports:
- **In-App Notifications** (Banner + Notification Center)
- **Push Notifications** (FCM for iOS/Android/Web)
- **Email Notifications** (via existing Resend integration)
- **Mobile Apps** (iOS/Android via Capacitor)

## Tech Stack Decision

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Message Queue | Upstash QStash | Serverless, Vercel-compatible, built-in retry/scheduling |
| Real-time | Server-Sent Events (SSE) | Simpler than WebSocket for unidirectional notifications |
| Pub/Sub | Upstash Redis | Already in use, multi-instance SSE support |
| Push Service | Firebase Cloud Messaging | Free tier sufficient, single API for iOS/Android/Web |
| State Management | Zustand | Lightweight, TypeScript-first |
| Mobile Wrapper | Capacitor.js | Code reuse, native plugin access |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web Browser   │   iOS App       │   Android App               │
│   (Next.js)     │   (Capacitor)   │   (Capacitor)               │
│                 │                 │                             │
│   SSE Client    │   FCM + SSE     │   FCM + SSE                 │
└────────┬────────┴────────┬────────┴────────┬────────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  /api/notifications/stream     → SSE Endpoint                    │
│  /api/notifications            → CRUD Operations                 │
│  /api/notifications/devices    → Device Token Management         │
│  /api/notifications/preferences→ User Settings                   │
│  /api/qstash/webhook           → QStash Worker Endpoint          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  NotificationService                                             │
│  ├── createNotification()      → Validate + Queue                │
│  ├── processNotification()     → Check prefs, send channels      │
│  ├── markAsRead()              → Update status                   │
│  └── getUserNotifications()    → Fetch with pagination           │
│                                                                  │
│  QueueService (QStash)                                           │
│  ├── publishNotification()     → Add to queue with priority      │
│  ├── scheduleNotification()    → Delayed delivery                │
│  └── handleWebhook()           → Process queued messages         │
│                                                                  │
│  PushService (FCM)                                               │
│  ├── sendPush()                → Send via FCM                    │
│  ├── sendMulticast()           → Batch send                      │
│  └── validateToken()           → Check token validity            │
│                                                                  │
│  SSEService                                                      │
│  ├── subscribe()               → Add client to channel           │
│  ├── publish()                 → Send to user's clients          │
│  └── broadcast()               → Send to multiple users          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                     │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PostgreSQL    │   Upstash Redis │   Upstash QStash            │
│   (Prisma)      │   (Pub/Sub)     │   (Queue)                   │
│                 │                 │                             │
│   Notifications │   SSE Channels  │   Async Processing          │
│   Preferences   │   Session State │   Retry Logic               │
│   DeviceTokens  │                 │   Scheduled Jobs            │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## Notification Flow

### Example: New Booking Request

```
1. Customer creates booking
   └── BookingService.create()

2. Business logic triggers notification
   └── NotificationService.create({
         userId: studioOwnerId,
         type: 'BOOKING_REQUEST_RECEIVED',
         priority: 'URGENT',
         metadata: { bookingId, customerName, ... }
       })

3. Notification queued via QStash
   └── QueueService.publish(notification)
   └── QStash adds to queue with priority

4. QStash calls webhook endpoint
   └── /api/qstash/webhook receives message

5. NotificationService processes
   ├── Check user preferences
   ├── Check quiet hours
   ├── Determine channels (push, email, in-app)
   └── Send via each enabled channel

6. Delivery
   ├── FCM → Push to mobile/web
   ├── Resend → Email
   ├── Redis Pub/Sub → SSE to open clients
   └── Database → Store for history

7. Client receives
   ├── SSE event → Show banner/toast
   ├── Push notification → System notification
   └── Badge count updated
```

## Notification Types (25 Total)

### Studio Owner (6 types)
| Type | Priority | Channels |
|------|----------|----------|
| BOOKING_REQUEST_RECEIVED | URGENT | Push, Email, In-App |
| BOOKING_CANCELLED_BY_CUSTOMER | HIGH | Push, Email, In-App |
| BOOKING_REMINDER_STUDIO | NORMAL | Push, In-App |
| PAYMENT_RECEIVED | NORMAL | Push, Email, In-App |
| REVIEW_POSTED | LOW | Push, In-App |
| LOW_AVAILABILITY_ALERT | NORMAL | Email, In-App |

### Customer (6 types)
| Type | Priority | Channels |
|------|----------|----------|
| BOOKING_CONFIRMED | HIGH | Push, Email, In-App |
| BOOKING_REJECTED | HIGH | Push, Email, In-App |
| BOOKING_REMINDER_CUSTOMER | URGENT | Push, In-App |
| BOOKING_CANCELLED_BY_STUDIO | HIGH | Push, Email, In-App |
| REVIEW_REQUEST | LOW | Push, Email |
| STUDIO_PROMOTION | LOW | Push, Email |

### Security (6 types)
| Type | Priority | Channels |
|------|----------|----------|
| ACCOUNT_LOGIN_NEW_DEVICE | HIGH | Push, Email |
| ACCOUNT_PASSWORD_CHANGED | HIGH | Email |
| ACCOUNT_EMAIL_CHANGED | HIGH | Email (both addresses) |
| ACCOUNT_TWO_FACTOR_ENABLED | NORMAL | Email |
| ACCOUNT_DELETION_SCHEDULED | HIGH | Email |
| ACCOUNT_DELETION_CANCELLED | NORMAL | Email |

### System (7 types)
| Type | Priority | Channels |
|------|----------|----------|
| SYSTEM_MAINTENANCE | NORMAL | Push, Email, In-App |
| FEATURE_ANNOUNCEMENT | LOW | In-App |
| TERMS_UPDATE | NORMAL | Email, In-App |
| WELCOME | LOW | Email |
| ONBOARDING_REMINDER | LOW | Email, Push |
| SUBSCRIPTION_EXPIRING | HIGH | Email, Push |
| SUBSCRIPTION_EXPIRED | URGENT | Email, Push |

## Priority System

| Priority | QStash Delay | Auto-dismiss | Quiet Hours |
|----------|--------------|--------------|-------------|
| URGENT | 0ms | Never | Ignored |
| HIGH | 0ms | Never | Respected |
| NORMAL | 0-1000ms | 10 seconds | Respected |
| LOW | 0-5000ms | 5 seconds | Respected |

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Per User | 100 notifications | 1 hour |
| Per Type per User | 10 notifications | 1 hour |
| URGENT bypass | Unlimited | - |

## Data Retention

- Notifications older than 90 days: Deleted (GDPR)
- Read notifications: Can be deleted by user
- Unread notifications: Kept until read or 90 days

## File Structure

```
lib/
├── notifications/
│   ├── notification-service.ts      # Main service
│   ├── notification-types.ts        # Type definitions
│   ├── notification-templates.ts    # Message templates
│   ├── channels/
│   │   ├── push-channel.ts          # FCM integration
│   │   ├── email-channel.ts         # Resend integration
│   │   └── inapp-channel.ts         # SSE + Database
│   └── utils/
│       ├── preference-checker.ts    # Check user prefs
│       ├── quiet-hours.ts           # Quiet hours logic
│       └── rate-limiter.ts          # Rate limiting
├── queue/
│   ├── qstash-client.ts             # QStash SDK wrapper
│   ├── qstash-publisher.ts          # Publish to queue
│   └── qstash-handlers.ts           # Webhook handlers
├── sse/
│   ├── sse-manager.ts               # SSE connection manager
│   └── redis-pubsub.ts              # Redis Pub/Sub adapter
└── firebase/
    ├── firebase-admin.ts            # Admin SDK init
    └── fcm-service.ts               # FCM operations

app/api/
├── notifications/
│   ├── route.ts                     # GET (list), POST (create)
│   ├── [id]/route.ts                # GET, PATCH, DELETE
│   ├── stream/route.ts              # SSE endpoint
│   ├── read/route.ts                # Mark as read
│   ├── read-all/route.ts            # Mark all as read
│   ├── devices/route.ts             # Device token CRUD
│   └── preferences/route.ts         # User preferences
└── qstash/
    └── webhook/route.ts             # QStash webhook

components/notifications/
├── NotificationBanner.tsx           # Top banner for urgent
├── NotificationCenter.tsx           # Bell icon + drawer
├── NotificationCard.tsx             # Individual notification
├── NotificationBell.tsx             # Bell with badge
├── NotificationSettings.tsx         # Preferences form
└── NotificationToast.tsx            # Toast wrapper

stores/
└── notification-store.ts            # Zustand store

hooks/
├── useNotifications.ts              # Fetch + SSE hook
├── useNotificationPreferences.ts    # Preferences hook
└── usePushRegistration.ts           # Push token hook
```

## Security Considerations

1. **Authentication**: All endpoints require valid session
2. **Authorization**: Users can only access their own notifications
3. **Rate Limiting**: Prevent notification spam
4. **Input Validation**: Zod schemas for all inputs
5. **CSRF Protection**: QStash webhook signature verification
6. **PII Protection**: No sensitive data in notification content
