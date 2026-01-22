# E2E Notification Tests

Comprehensive end-to-end tests for the complete notification system flow.

## Test Suites

### 1. Notification Lifecycle (`notification-lifecycle.test.ts`)

Tests the complete lifecycle of a notification from creation to deletion.

**Coverage:**
- Create notification via service
- List user notifications with pagination
- Mark notification as read
- Verify status changes
- Delete notification
- Multiple notifications with filtering
- Cross-user authorization checks

**Key Scenarios:**
- Single notification full lifecycle
- Multiple notifications with type filtering
- Pagination with cursor-based navigation
- Mark all as read functionality
- Authorization: users cannot access other users' notifications

**Test Count:** 6 tests

### 2. Push Notification Flow (`push-notification-flow.test.ts`)

Tests push notification device registration and delivery flow.

**Coverage:**
- Device token registration
- Multiple device support (Android, iOS, Web)
- Push notification creation and delivery
- Device failure tracking
- Device re-registration
- Device cleanup

**Key Scenarios:**
- Complete push flow: register → notify → deliver → unregister
- Multiple devices per user
- Failed push updates failure count
- Re-registering device resets failures
- Push disabled preference is respected
- Device ownership transfer
- Old inactive device cleanup

**Test Count:** 8 tests

### 3. User Preference Flow (`user-preference-flow.test.ts`)

Tests notification preferences and quiet hours functionality.

**Coverage:**
- Default preferences (all channels enabled)
- Channel enable/disable
- Quiet hours configuration
- Quiet hours calculation
- Type-specific preferences
- Email digest preferences
- Timezone handling
- Preference updates

**Key Scenarios:**
- Default preferences allow all channels
- Disabled channels excluded from notifications
- Quiet hours blocking logic
- Type-specific preferences override global
- Email digest configuration
- Preference updates take immediate effect
- Timezone affects quiet hours calculation
- Overnight quiet hours (22:00-08:00)
- Explicit channels override preferences

**Test Count:** 12 tests

### 4. Admin Flow (`admin-flow.test.ts`)

Tests admin-specific notification operations and bulk operations.

**Coverage:**
- Admin creates notifications for users
- Studio owner notifications
- Bulk notification sending
- Broadcast notifications
- Scheduled notifications
- Notifications with expiration
- Action URLs
- Booking and studio context
- Cross-user queries
- Idempotency
- Statistics and counts

**Key Scenarios:**
- Admin sends system maintenance notification
- Studio owner sends promotional notification
- Bulk notifications to multiple users
- Urgent broadcast to all users
- Scheduled future notifications
- Notifications with expiration dates
- Notifications with action URLs
- Booking-related context
- Studio-related context
- Admin queries across all users
- Idempotency prevents duplicates
- Notification statistics aggregation

**Test Count:** 13 tests

### 5. Rate Limiting Flow (`rate-limiting-flow.test.ts`)

Tests rate limiting enforcement and bypass mechanisms.

**Coverage:**
- Per-user rate limits (100/hour)
- Per-type-per-user limits (10/hour per type)
- URGENT priority bypass
- Rate limit recovery
- Independent user limits
- Retry information
- Idempotency with rate limiting

**Key Scenarios:**
- Rate limit kicks in after threshold
- URGENT priority bypasses limits
- Per-type rate limiting
- Different types have independent limits
- Rate limit recovery after window expiration
- Multiple users have independent limits
- Rate limit provides retry-after information
- HIGH priority respects limits (only URGENT bypasses)
- Duplicates don't count against limit
- Scheduled notifications count against limit
- Rate limit error includes helpful context
- Burst of notifications within limit succeeds

**Test Count:** 12 tests

## Total Coverage

- **Total Tests:** 51 E2E tests
- **Lines of Test Code:** ~2,500 lines
- **Test Scenarios:** Complete notification system flows
- **Coverage Target:** 100% of notification flow paths

## Running Tests

### Run all E2E notification tests
```bash
npm test -- __tests__/e2e/notifications
```

### Run specific test suite
```bash
npm test -- __tests__/e2e/notifications/notification-lifecycle.test.ts
npm test -- __tests__/e2e/notifications/push-notification-flow.test.ts
npm test -- __tests__/e2e/notifications/user-preference-flow.test.ts
npm test -- __tests__/e2e/notifications/admin-flow.test.ts
npm test -- __tests__/e2e/notifications/rate-limiting-flow.test.ts
```

### Run with coverage
```bash
npm run test:coverage -- __tests__/e2e/notifications
```

### Watch mode
```bash
npm run test:watch -- __tests__/e2e/notifications
```

## Test Data

All tests use isolated test users with predictable IDs:
- `e2e-notification-lifecycle-user`
- `e2e-push-notification-user`
- `e2e-preference-user`
- `e2e-admin-user`, `e2e-customer-user`, `e2e-studio-owner`
- `e2e-rate-limit-user`

Each test suite:
1. **beforeEach:** Creates clean test user and preferences
2. **Test execution:** Performs operations
3. **afterEach:** Cleans up all test data

## Mocked Services

The E2E tests mock external services to test internal flow:

### QStash Publisher
```typescript
jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  },
}));
```

### Firebase Push Notifications
```typescript
jest.mock('@/lib/notifications/channels/push', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true }),
}));
```

### Redis (Rate Limiting)
```typescript
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  })),
}));
```

## Test Patterns

### 1. Result Pattern Validation
```typescript
const result = await notificationService.create({ ... });

expect(result.ok).toBe(true);
if (!result.ok) throw new Error('Failed to create notification');

const notificationId = result.value.id;
```

### 2. Database Verification
```typescript
const notification = await prisma.notification.findUnique({
  where: { id: notificationId },
});

expect(notification?.status).toBe('READ');
expect(notification?.inAppSeenAt).toBeDefined();
```

### 3. Step-by-Step Flow
```typescript
// Step 1: Create
const createResult = await notificationService.create({ ... });
logger.info('Step 1 passed: Notification created');

// Step 2: List
const listResult = await notificationService.getUserNotifications(userId);
logger.info('Step 2 passed: Notification appears in list');

// Step 3: Mark as read
const readResult = await notificationService.markAsRead(id, userId);
logger.info('Step 3 passed: Notification marked as read');
```

### 4. Error Case Testing
```typescript
const result = await notificationService.markAsRead(notificationId, wrongUserId);

expect(result.ok).toBe(false);
if (!result.ok) {
  expect(result.error.code).toBe('NOTIFICATION_NOT_FOUND');
}
```

## Assertions

### Success Cases
- `expect(result.ok).toBe(true)`
- `expect(notification?.status).toBe('QUEUED')`
- `expect(notifications.items).toHaveLength(3)`
- `expect(notification?.channels).toContain('PUSH')`

### Error Cases
- `expect(result.ok).toBe(false)`
- `expect(result.error.code).toBe('RATE_LIMITED')`
- `expect(result.error.context?.retryAfter).toBeDefined()`

### Database State
- `expect(notification).toBeDefined()`
- `expect(notification).toBeNull()`
- `expect(device.isActive).toBe(true)`

## Debugging

### Enable debug logging
```typescript
logger.info('Step X passed: Description', { data });
```

### View database state during test
```typescript
const notifications = await prisma.notification.findMany({
  where: { userId: E2E_USER_ID },
});
console.log('Current notifications:', notifications);
```

### Run single test
```bash
npm test -- __tests__/e2e/notifications/notification-lifecycle.test.ts -t "Complete lifecycle"
```

## Integration with CI/CD

These E2E tests are designed to run in CI/CD pipelines:

1. **Fast execution:** Mocked external services
2. **Isolated:** Each test cleans up after itself
3. **Deterministic:** No flaky tests from timing issues
4. **Comprehensive:** Cover all critical paths

## Next Steps

For true HTTP E2E tests:
1. Use Playwright or Supertest
2. Test against running API server
3. Test actual HTTP endpoints
4. Include authentication flow
5. Test rate limiting middleware

## Contributing

When adding new notification features:
1. Add corresponding E2E test
2. Follow existing test patterns
3. Ensure cleanup in afterEach
4. Document new scenarios in README
5. Maintain 100% coverage

## Related Documentation

- [Notification System Architecture](../../../docs/notifications/architecture.md)
- [Rate Limiting Implementation](../../../docs/notifications/RATE_LIMITING_IMPLEMENTATION.md)
- [API Documentation](../../../docs/notifications/api.md)
- [Type Safety Examples](../../../docs/notifications/TYPE_SAFETY_EXAMPLES.md)
