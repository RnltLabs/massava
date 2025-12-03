# Massava Notifications Feature - Comprehensive Technical Plan

**Feature Branch**: `feature/notifications`
**Created**: 2025-11-20
**Status**: Planning Complete - Ready for Implementation Review

---

## 📋 Executive Summary

This document outlines the complete technical plan for implementing a comprehensive notification system in Massava. The system will support:

- **In-app notifications** (banner + notification center)
- **Email notifications** (enhanced from existing system)
- **Push notifications** (via Firebase Cloud Messaging)
- **Mobile app presence** (iOS App Store + Google Play Store via Capacitor)
- **User-controlled preferences** (granular per-type, per-channel settings)

**Timeline**: 12 weeks to full production deployment
**Approach**: Phased implementation with validation at each milestone

---

## 🎯 Requirements Overview

### Studio Owner Notifications
- New booking requests (URGENT priority)
- Booking cancellations by customer
- Booking reminders (upcoming appointments)
- Payment confirmations
- Review notifications
- Customer messages
- Low availability alerts (future)
- Campaign results (future)

### Customer Notifications
- Booking confirmation (owner accepted)
- Booking rejection (owner declined)
- Booking reminder (15 minutes before appointment)
- Booking cancellation (by studio)
- Studio messages/updates
- Review requests (post-appointment)
- Studio promotions (future)
- Loyalty rewards (future)

### Security & System Notifications (Both Roles)
- Account security alerts
- System maintenance notifications
- Feature announcements
- Terms of service updates

---

## 🏗️ Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│              Delivery Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Email   │  │   Push   │  │  In-App  │         │
│  │ (Resend) │  │  (FCM)   │  │(WebSocket)│         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────────────────────────────────────┐
│          Notification Service Layer                 │
│  • Channel abstraction                              │
│  • User preference checking                         │
│  • Template rendering                               │
│  • Delivery status tracking                         │
└─────────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────────────────────────────────────┐
│            Message Queue (RabbitMQ)                 │
│  • Async processing                                 │
│  • Retry with exponential backoff                   │
│  • Priority queuing (URGENT → LOW)                  │
│  • Dead letter queue for failures                   │
└─────────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────────────────────────────────────┐
│            Business Logic                           │
│  • Booking confirmation                             │
│  • Payment processing                               │
│  • Review posting                                   │
│  • Account management                               │
└─────────────────────────────────────────────────────┘
```

### Database Schema

Three new tables added to PostgreSQL:

1. **`Notification`** - Stores all notification history
   - Supports multiple channels (email, push, in-app)
   - Tracks delivery status and read state
   - Links to related entities (booking, studio)
   - Retry logic with error tracking

2. **`NotificationPreference`** - User settings
   - Per-type channel toggles
   - Frequency settings (instant, daily digest, off)
   - Quiet hours configuration
   - Language preference

3. **`DeviceToken`** - FCM registration tokens
   - Platform differentiation (iOS, Android, Web)
   - Token validation and expiration
   - Multi-device support per user

**See**: `/Users/roman/Development/massava/docs/notifications-feature-plan.md` (this file) and separate schema document for full Prisma definitions.

---

## 📱 Mobile App Strategy

### Decision: **Capacitor.js Wrapper**

**Rationale**:
- ✅ Leverages existing Next.js codebase (100% code reuse)
- ✅ Fast time to market (weeks vs months for native rewrite)
- ✅ Native push notifications via FCM plugin
- ✅ App Store + Play Store presence
- ✅ Minimal additional maintenance burden
- ✅ Can upgrade to full native later if performance requires

### Alternative Options Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **PWA Only** | Fastest, single codebase | Limited iOS push support, no app store | ❌ Rejected |
| **React Native** | Best performance, full native APIs | Separate codebase, higher cost | ❌ Rejected |
| **Capacitor** | Balance of speed + capabilities | Slight performance overhead | ✅ **Selected** |

### Push Notification Technology

**Firebase Cloud Messaging (FCM)**:
- Single API for both iOS (APNS) and Android
- Free tier: 10M messages/month
- Integrates seamlessly with Capacitor
- Production-ready with excellent documentation

---

## 🎨 UX/UI Design

### Three-Tier Notification UI

1. **Toasts** (Existing, Enhanced)
   - Non-critical feedback (success, error)
   - Auto-dismiss after 3-5 seconds
   - Bottom-right corner (desktop), bottom center (mobile)

2. **Banner Notifications** (NEW)
   - Urgent, actionable items (booking requests)
   - Top of screen, persistent until dismissed
   - Action buttons (Confirm/Decline) inline
   - Max 1 banner visible at a time (queue others)

3. **Notification Center** (NEW)
   - Full notification history
   - Bell icon in header with badge count
   - Drawer/Sheet pattern (right side desktop, bottom sheet mobile)
   - Filters: All, Unread, By Type
   - Paginated list (20 per page)

### Component Architecture

Using **shadcn/ui** components:

```tsx
NotificationSystem/
├── NotificationBanner
│   └── Uses: Alert, Button, X icon
├── NotificationCenter
│   └── Uses: Sheet (desktop), Drawer (mobile), Tabs, ScrollArea
├── NotificationCard
│   └── Uses: Card, Avatar, Badge, Button
└── NotificationSettings
    └── Uses: Form, Switch, Select, Input
```

### Mobile-First Considerations

- **Swipe gestures**: Swipe to dismiss, swipe to mark as read
- **Larger touch targets**: Minimum 44x44px for all buttons
- **Bottom sheet**: Better thumb reachability on mobile
- **Simplified actions**: Max 2 action buttons per notification
- **Haptic feedback**: Vibration on important notifications (native)

**Full UX Design Specification**: `/Users/roman/Development/massava/design-specs/notification-system.md`

---

## 🔔 Notification Types & Metadata

### Type Definitions

**27 Notification Types** across 3 categories:

1. **Studio Owner (8 types)**:
   - `BOOKING_REQUEST_RECEIVED` - URGENT priority
   - `BOOKING_CANCELLED_BY_CUSTOMER` - HIGH priority
   - `BOOKING_REMINDER_STUDIO` - NORMAL priority
   - `PAYMENT_RECEIVED` - NORMAL priority
   - `REVIEW_POSTED` - LOW priority
   - `CUSTOMER_MESSAGE` - HIGH priority
   - `LOW_AVAILABILITY_ALERT` - NORMAL priority (future)
   - `CAMPAIGN_RESULTS` - LOW priority (future)

2. **Customer (8 types)**:
   - `BOOKING_CONFIRMED` - HIGH priority
   - `BOOKING_REJECTED` - HIGH priority
   - `BOOKING_REMINDER_CUSTOMER` - URGENT priority (15 min before)
   - `BOOKING_CANCELLED_BY_STUDIO` - HIGH priority
   - `STUDIO_MESSAGE` - NORMAL priority
   - `REVIEW_REQUEST` - LOW priority
   - `STUDIO_PROMOTION` - LOW priority (future)
   - `LOYALTY_REWARD` - NORMAL priority (future)

3. **Security & System (7 types)**:
   - `ACCOUNT_LOGIN_NEW_DEVICE` - HIGH priority
   - `ACCOUNT_PASSWORD_CHANGED` - HIGH priority
   - `ACCOUNT_EMAIL_CHANGED` - HIGH priority
   - `ACCOUNT_TWO_FACTOR_ENABLED` - NORMAL priority
   - `SYSTEM_MAINTENANCE` - NORMAL priority
   - `FEATURE_ANNOUNCEMENT` - LOW priority
   - `TERMS_UPDATE` - NORMAL priority

### Metadata Structure

Each notification type has type-safe metadata:

```typescript
// Example: Booking notification
interface BookingNotificationMetadata {
  bookingId: string;
  customerName: string;
  serviceName: string;
  appointmentTime: string; // ISO 8601
  studioName: string;
  studioId: string;
}

// Discriminated union for type safety
type NotificationMetadata =
  | { type: 'BOOKING_CONFIRMED'; data: BookingNotificationMetadata }
  | { type: 'PAYMENT_RECEIVED'; data: PaymentNotificationMetadata }
  | ...
```

**Full Type Definitions**: See schema document attached to this plan.

---

## 🔧 Technical Implementation Details

### Technology Stack

| Component | Technology | Status |
|-----------|------------|--------|
| Database | PostgreSQL + Prisma | ✅ Existing |
| Message Queue | RabbitMQ (amqplib) | 🆕 New (library already installed) |
| Push Service | Firebase Cloud Messaging | 🆕 New |
| Email Service | Resend | ✅ Existing |
| Real-time | WebSocket/SSE | 🆕 New |
| Mobile Wrapper | Capacitor.js | 🆕 New |
| State Management | Zustand | 🆕 New |

### Key Libraries to Add

```json
{
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "@capacitor/android": "^6.0.0",
    "@capacitor/push-notifications": "^6.0.0",
    "firebase-admin": "^12.0.0",
    "zustand": "^4.5.0",
    "ws": "^8.16.0"
  }
}
```

### Notification Flow (Example: New Booking)

```typescript
// 1. Business logic creates booking
const booking = await createBooking(data);

// 2. Publish to message queue
await publishNotification({
  correlationId: generateId(),
  userId: booking.studio.ownerId,
  type: 'BOOKING_REQUEST_RECEIVED',
  channels: ['EMAIL', 'PUSH', 'IN_APP'],
  priority: 'URGENT',
  title: 'New Booking Request',
  body: `${booking.customerName} wants to book ${booking.serviceName}`,
  metadata: {
    type: 'BOOKING_REQUEST_RECEIVED',
    data: {
      bookingId: booking.id,
      customerName: booking.customerName,
      serviceName: booking.service.name,
      appointmentTime: booking.preferredDateTime.toISOString(),
      studioName: booking.studio.name,
      studioId: booking.studioId,
    },
  },
  bookingId: booking.id,
  studioId: booking.studioId,
});

// 3. Worker processes message
// - Check user preferences
// - Respect quiet hours
// - Send via enabled channels
// - Track delivery status
```

### User Preference Management

```typescript
// User can configure:
{
  globalSettings: {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  },
  quietHours: {
    start: "22:00",
    end: "08:00",
    timezone: "Europe/Berlin",
  },
  typePreferences: {
    BOOKING_REQUEST_RECEIVED: {
      email: true,
      push: true,
      inApp: true,
    },
    REVIEW_POSTED: {
      email: false,  // User opts out of email for reviews
      push: true,
      inApp: true,
    },
    // ... all types
  },
  frequencySettings: {
    REVIEW_POSTED: 'DAILY_DIGEST',  // Batch reviews into daily summary
    BOOKING_REQUEST_RECEIVED: 'INSTANT',  // Always instant for bookings
    // ... all types
  },
  emailDigestEnabled: false,
  digestFrequency: 'DAILY',
}
```

---

## 📅 Implementation Timeline

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Basic notification infrastructure and user settings

**Tasks**:
- [ ] Database migration (add 3 new tables)
- [ ] Notification service layer (Result<T, E> pattern)
- [ ] User preference CRUD API
- [ ] Settings UI page (shadcn/ui components)
- [ ] In-app notification center (read-only, no real-time yet)
- [ ] Default preferences backfill for existing users
- [ ] Unit tests (100% coverage)

**Deliverables**:
- Users can view notification history
- Users can configure preferences per type
- Database schema ready for all features

### Phase 2: Real-time In-App (Weeks 4-5)
**Goal**: Live notifications without page refresh

**Tasks**:
- [ ] WebSocket server implementation
- [ ] Toast notification component enhancement
- [ ] Banner notification component (with actions)
- [ ] Zustand store for notification state
- [ ] Badge counts on bell icon and navigation
- [ ] Mark as read/unread functionality
- [ ] Integration tests

**Deliverables**:
- Studio owners see booking requests instantly
- Customers see confirmations in real-time
- No page refresh needed

### Phase 3: Message Queue (Week 6)
**Goal**: Reliable async notification delivery

**Tasks**:
- [ ] RabbitMQ Docker container setup
- [ ] Notification queue publisher
- [ ] Notification worker service
- [ ] Retry logic (exponential backoff, max 3 attempts)
- [ ] Dead letter queue for failures
- [ ] Migrate email sending to queue
- [ ] Monitoring and alerting

**Deliverables**:
- All notifications processed asynchronously
- Automatic retries on failures
- No blocking in business logic

### Phase 4: Push Notifications (Weeks 7-9)
**Goal**: Native push notifications via FCM

**Tasks**:
- [ ] Firebase project setup
- [ ] FCM server integration (firebase-admin)
- [ ] Device token registration API
- [ ] Push notification channel implementation
- [ ] Token validation and expiration handling
- [ ] Multi-device support
- [ ] Test on iOS and Android devices

**Deliverables**:
- Push notifications working on all platforms
- Token management working
- Delivery tracking functional

### Phase 5: Mobile App (Weeks 10-12)
**Goal**: Apps in App Store and Play Store

**Tasks**:
- [ ] Capacitor project initialization
- [ ] iOS configuration (Xcode, certificates)
- [ ] Android configuration (Android Studio, signing)
- [ ] Capacitor Push Plugin integration
- [ ] App icons and splash screens
- [ ] App store metadata and screenshots
- [ ] TestFlight beta testing (iOS)
- [ ] Internal testing (Android)
- [ ] App Store submission
- [ ] Play Store submission

**Deliverables**:
- Massava iOS app in App Store
- Massava Android app in Play Store
- Push notifications working in native apps

### Phase 6: Polish & Optimization (Ongoing)
**Goal**: Production hardening

**Tasks**:
- [ ] Performance optimization (caching, indexes)
- [ ] Analytics tracking (notification engagement)
- [ ] A/B testing framework (future)
- [ ] Documentation (API, runbooks)
- [ ] Support team training
- [ ] Monitoring dashboards

**Deliverables**:
- System performing at scale
- Complete documentation
- Team trained on new system

---

## 🔒 Security & Privacy Considerations

### Data Protection
- **Encryption**: Sensitive metadata encrypted at rest
- **Retention**: Notifications deleted after 90 days (GDPR compliant)
- **PII Handling**: Phone numbers and emails redacted in logs
- **Audit Trail**: All preference changes logged

### Rate Limiting
- **Per User**: 100 notifications/hour (prevent spam)
- **Per Type**: 20 notifications/hour (prevent noise)
- **Digest Mode**: High-volume types batched into digests
- **Circuit Breaker**: External service failures handled gracefully

### Permission Model
- **RBAC Integration**: Use existing role system
- **Studio Owner**: Can only send to their studio's customers
- **Admin**: Can send system-wide notifications
- **Customer**: Cannot trigger notifications (only receive)

---

## 📊 Success Metrics

### Technical Metrics
- **Delivery Rate**: >99% of notifications delivered successfully
- **Latency**: <5 seconds from trigger to delivery (URGENT priority)
- **Uptime**: 99.9% availability
- **Error Rate**: <0.1% unrecoverable failures

### Business Metrics
- **Open Rate**: >60% for push notifications
- **Action Rate**: >40% for actionable notifications (confirm/decline)
- **Opt-out Rate**: <5% users disabling notifications
- **Engagement**: 30% increase in booking confirmations within 1 hour

### User Experience Metrics
- **Settings Discovery**: >80% of users visit notification settings
- **Preference Customization**: >50% of users customize at least 1 setting
- **Complaint Rate**: <1% support tickets about notification spam

---

## 🚨 Risks & Mitigation

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| FCM quota exceeded | HIGH | LOW | Monitor usage, implement rate limiting, add SMS fallback |
| RabbitMQ downtime | HIGH | LOW | Implement circuit breaker, fallback to synchronous email |
| WebSocket scaling issues | MEDIUM | MEDIUM | Use Redis adapter for multi-instance support |
| Push token invalidation | MEDIUM | HIGH | Regular token validation, graceful failure handling |
| App store rejection | HIGH | LOW | Follow guidelines strictly, have backup plan |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Notification fatigue | HIGH | MEDIUM | Default to conservative settings, easy opt-out |
| Privacy concerns | HIGH | LOW | Clear privacy policy, GDPR compliance, audit trail |
| Support burden | MEDIUM | MEDIUM | Comprehensive documentation, self-service settings |

---

## 🔄 Migration from Existing System

### Current State
- Email notifications via Resend (production)
- Boolean flags: `reminderSent`, `reviewRequestSent`
- No user preferences
- No notification history

### Migration Strategy

1. **Expand** (Week 1): Add new tables, keep old system running
2. **Migrate** (Week 2): Start using new system for new notifications, backfill preferences
3. **Contract** (Week 3): Remove old boolean flags after validation

### Backwards Compatibility
- Existing email notifications continue working
- New system reads old flags to prevent duplicates
- Gradual migration over 2 weeks

---

## 📚 References

### Documentation Created
1. **UX Design Specification**: `/Users/roman/Development/massava/design-specs/notification-system.md`
2. **Database Schema & Types**: See schema document attached to this plan
3. **Architecture Analysis**: Generated by Explore agent (stored in conversation)

### External Resources
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Next.js WebSocket Example](https://github.com/vercel/next.js/tree/canary/examples/with-websockets)

---

## ✅ Next Steps

### Immediate Actions (This Week)
1. **Review this plan** with stakeholders
2. **Approve budget** for Firebase (if needed), app store fees ($99/year iOS, $25 one-time Android)
3. **Create Linear tickets** from Phase 1 tasks
4. **Set up Firebase project** (can be done in parallel)
5. **Schedule kick-off meeting** with development team

### Before Implementation Starts
- [ ] All stakeholders have reviewed and approved this plan
- [ ] Budget approved
- [ ] Firebase project created
- [ ] Apple Developer account ready ($99/year)
- [ ] Google Play Console account ready ($25 one-time)
- [ ] Phase 1 tickets created in Linear

### Decision Points Needed
1. **Email Digest Default**: Should digest mode be opt-in or opt-out?
2. **Quiet Hours Default**: Should we enable quiet hours (22:00-08:00) by default?
3. **App Name**: Confirm app name for stores (currently: "Massava")
4. **Notification Sound**: Custom sound or system default?

---

## 👥 Team & Resources

### Required Expertise
- **Backend**: Prisma migrations, RabbitMQ, FCM integration (1 developer, full-time)
- **Frontend**: React components, WebSocket, Zustand (1 developer, full-time)
- **Mobile**: Capacitor setup, iOS/Android builds (1 developer, part-time weeks 10-12)
- **DevOps**: RabbitMQ deployment, monitoring (1 engineer, part-time)
- **Design**: App icons, screenshots, store assets (1 designer, part-time weeks 10-12)

### External Dependencies
- **Apple Developer Account**: $99/year
- **Google Play Console**: $25 one-time
- **Firebase**: Free tier (10M messages/month) likely sufficient initially

---

**Document Status**: ✅ Planning Complete
**Next Phase**: Implementation (awaiting approval)
**Contact**: Development Team
**Last Updated**: 2025-11-20
