# Testing Strategy

## Overview

This document covers:
1. Unit tests (100% coverage for business logic)
2. Integration tests (API routes, database)
3. E2E tests (critical user flows)
4. Test utilities and mocks

**Framework:** Jest (already configured in project)

## 1. Test Structure

```
__tests__/
├── unit/
│   ├── notifications/
│   │   ├── notification-service.test.ts
│   │   ├── preference-checker.test.ts
│   │   ├── quiet-hours.test.ts
│   │   ├── idempotency.test.ts
│   │   └── rate-limiter.test.ts
│   ├── queue/
│   │   └── qstash-publisher.test.ts
│   └── firebase/
│       └── fcm-service.test.ts
├── integration/
│   ├── api/
│   │   ├── notifications.test.ts
│   │   ├── devices.test.ts
│   │   └── preferences.test.ts
│   └── services/
│       └── notification-flow.test.ts
└── e2e/
    └── notification-flow.test.ts
```

## 2. Unit Tests

### Notification Service Tests

```typescript
// __tests__/unit/notifications/notification-service.test.ts

import { notificationService } from '@/lib/notifications/notification-service';
import { prisma } from '@/lib/prisma';
import { qstashPublisher } from '@/lib/queue/qstash-publisher';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    notificationPreference: { findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create notification and queue it', async () => {
      const mockUser = {
        id: 'user-1',
        notificationPreference: {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
        },
      };

      const mockNotification = {
        id: 'notif-1',
        status: 'QUEUED',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null); // No duplicate
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationService.create({
        userId: 'user-1',
        type: 'BOOKING_REQUEST_RECEIVED',
        title: 'New Booking',
        body: 'You have a new booking request',
        priority: 'URGENT',
      });

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: 'notif-1', status: 'QUEUED' });
      expect(qstashPublisher.publish).toHaveBeenCalledWith({
        notificationId: 'notif-1',
        priority: 'URGENT',
      });
    });

    it('should return existing notification if duplicate', async () => {
      const mockUser = { id: 'user-1', notificationPreference: null };
      const existingNotification = { id: 'existing-1', status: 'DELIVERED' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(existingNotification);

      const result = await notificationService.create({
        userId: 'user-1',
        type: 'BOOKING_REQUEST_RECEIVED',
        title: 'New Booking',
        body: 'Duplicate',
      });

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: 'existing-1', status: 'DELIVERED' });
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.create({
        userId: 'nonexistent',
        type: 'BOOKING_REQUEST_RECEIVED',
        title: 'Test',
        body: 'Test',
      });

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });

    it('should not queue scheduled notifications immediately', async () => {
      const mockUser = { id: 'user-1', notificationPreference: null };
      const scheduledDate = new Date(Date.now() + 3600000); // 1 hour later

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'scheduled-1',
        status: 'PENDING',
      });

      const result = await notificationService.create({
        userId: 'user-1',
        type: 'BOOKING_REMINDER_CUSTOMER',
        title: 'Reminder',
        body: 'Your appointment is soon',
        scheduledFor: scheduledDate,
      });

      expect(result.ok).toBe(true);
      expect(qstashPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
      });
      (prisma.notification.update as jest.Mock).mockResolvedValue({});

      const result = await notificationService.markAsRead('notif-1', 'user-1');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          status: 'READ',
          inAppSeenAt: expect.any(Date),
        },
      });
    });

    it('should fail if notification not found', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.markAsRead('nonexistent', 'user-1');

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(5);

      const count = await notificationService.getUnreadCount('user-1');

      expect(count).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
          inAppSeenAt: null,
        },
      });
    });
  });
});
```

### Preference Checker Tests

```typescript
// __tests__/unit/notifications/preference-checker.test.ts

import { checkUserPreferences } from '@/lib/notifications/utils/preference-checker';

describe('checkUserPreferences', () => {
  it('should return all channels when preferences are null', async () => {
    const channels = await checkUserPreferences(null, 'BOOKING_REQUEST_RECEIVED');
    expect(channels).toEqual(['PUSH', 'EMAIL', 'IN_APP']);
  });

  it('should respect global toggles', async () => {
    const prefs = {
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: true,
      typePreferences: {},
    };

    const channels = await checkUserPreferences(prefs, 'BOOKING_REQUEST_RECEIVED');
    expect(channels).not.toContain('PUSH');
    expect(channels).toContain('EMAIL');
    expect(channels).toContain('IN_APP');
  });

  it('should respect type-specific preferences', async () => {
    const prefs = {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
      typePreferences: {
        REVIEW_POSTED: { push: true, email: 'off', inApp: true },
      },
    };

    const channels = await checkUserPreferences(prefs, 'REVIEW_POSTED');
    expect(channels).toContain('PUSH');
    expect(channels).not.toContain('EMAIL');
    expect(channels).toContain('IN_APP');
  });
});
```

### Quiet Hours Tests

```typescript
// __tests__/unit/notifications/quiet-hours.test.ts

import { isInQuietHours } from '@/lib/notifications/utils/quiet-hours';

describe('isInQuietHours', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return false when quiet hours disabled', () => {
    const prefs = {
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Europe/Berlin',
    };

    expect(isInQuietHours(prefs)).toBe(false);
  });

  it('should return true during quiet hours (same day)', () => {
    // Set time to 14:00
    jest.setSystemTime(new Date('2024-01-15T14:00:00'));

    const prefs = {
      quietHoursEnabled: true,
      quietHoursStart: '12:00',
      quietHoursEnd: '18:00',
      timezone: 'UTC',
    };

    expect(isInQuietHours(prefs)).toBe(true);
  });

  it('should return true during overnight quiet hours', () => {
    // Set time to 23:00
    jest.setSystemTime(new Date('2024-01-15T23:00:00'));

    const prefs = {
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC',
    };

    expect(isInQuietHours(prefs)).toBe(true);
  });

  it('should return false outside quiet hours', () => {
    // Set time to 10:00
    jest.setSystemTime(new Date('2024-01-15T10:00:00'));

    const prefs = {
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC',
    };

    expect(isInQuietHours(prefs)).toBe(false);
  });
});
```

### Idempotency Tests

```typescript
// __tests__/unit/notifications/idempotency.test.ts

import { generateIdempotencyKey } from '@/lib/notifications/utils/idempotency';

describe('generateIdempotencyKey', () => {
  it('should generate consistent keys for same input within time window', () => {
    const now = Date.now();
    const key1 = generateIdempotencyKey({
      userId: 'user-1',
      type: 'BOOKING_REQUEST_RECEIVED',
      bookingId: 'booking-1',
      timestamp: now,
    });

    const key2 = generateIdempotencyKey({
      userId: 'user-1',
      type: 'BOOKING_REQUEST_RECEIVED',
      bookingId: 'booking-1',
      timestamp: now + 30000, // 30 seconds later (same minute)
    });

    expect(key1).toBe(key2);
  });

  it('should generate different keys for different inputs', () => {
    const now = Date.now();

    const key1 = generateIdempotencyKey({
      userId: 'user-1',
      type: 'BOOKING_REQUEST_RECEIVED',
      bookingId: 'booking-1',
      timestamp: now,
    });

    const key2 = generateIdempotencyKey({
      userId: 'user-2', // Different user
      type: 'BOOKING_REQUEST_RECEIVED',
      bookingId: 'booking-1',
      timestamp: now,
    });

    expect(key1).not.toBe(key2);
  });

  it('should generate different keys after time window', () => {
    const now = Date.now();

    const key1 = generateIdempotencyKey({
      userId: 'user-1',
      type: 'BOOKING_REQUEST_RECEIVED',
      timestamp: now,
    });

    const key2 = generateIdempotencyKey({
      userId: 'user-1',
      type: 'BOOKING_REQUEST_RECEIVED',
      timestamp: now + 120000, // 2 minutes later (different minute)
    });

    expect(key1).not.toBe(key2);
  });
});
```

## 3. Integration Tests

### API Route Tests

```typescript
// __tests__/integration/api/notifications.test.ts

import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/notifications/route';
import { POST } from '@/app/api/notifications/read/route';
import { prisma } from '@/lib/prisma';

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id' },
  })),
}));

// Use test database
beforeAll(async () => {
  // Setup test data
  await prisma.user.create({
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        id: 'notif-1',
        userId: 'test-user-id',
        type: 'BOOKING_REQUEST_RECEIVED',
        title: 'Test 1',
        body: 'Test body 1',
        status: 'DELIVERED',
        priority: 'URGENT',
        channels: ['IN_APP'],
      },
      {
        id: 'notif-2',
        userId: 'test-user-id',
        type: 'BOOKING_CONFIRMED',
        title: 'Test 2',
        body: 'Test body 2',
        status: 'DELIVERED',
        priority: 'HIGH',
        channels: ['IN_APP'],
      },
    ],
  });
});

afterAll(async () => {
  await prisma.notification.deleteMany({
    where: { userId: 'test-user-id' },
  });
  await prisma.user.delete({
    where: { id: 'test-user-id' },
  });
  await prisma.$disconnect();
});

describe('GET /api/notifications', () => {
  it('should return paginated notifications', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/notifications?limit=10',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.items[0].title).toBe('Test 1');
  });

  it('should filter by status', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/notifications?status=DELIVERED',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(data.items.every((n: any) => n.status === 'DELIVERED')).toBe(true);
  });
});

describe('POST /api/notifications/read', () => {
  it('should mark notification as read', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { notificationId: 'notif-1' },
    });

    const response = await POST(req as any);

    expect(response.status).toBe(200);

    const notification = await prisma.notification.findUnique({
      where: { id: 'notif-1' },
    });
    expect(notification?.status).toBe('READ');
  });
});
```

### Notification Flow Integration Test

```typescript
// __tests__/integration/services/notification-flow.test.ts

import { notificationService } from '@/lib/notifications/notification-service';
import { prisma } from '@/lib/prisma';

describe('Notification Flow Integration', () => {
  const testUserId = 'integration-test-user';

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'integration@test.com',
      },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: testUserId } });
    await prisma.notificationPreference.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it('should create, deliver, and mark notification as read', async () => {
    // Create
    const createResult = await notificationService.create({
      userId: testUserId,
      type: 'BOOKING_REQUEST_RECEIVED',
      title: 'Integration Test',
      body: 'Testing the full flow',
      priority: 'HIGH',
    });

    expect(createResult.ok).toBe(true);
    const notificationId = createResult.value!.id;

    // Verify created
    const created = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    expect(created).not.toBeNull();
    expect(created?.status).toBe('QUEUED');

    // Mark as read
    const readResult = await notificationService.markAsRead(notificationId, testUserId);
    expect(readResult.ok).toBe(true);

    // Verify read
    const read = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    expect(read?.status).toBe('READ');
    expect(read?.inAppSeenAt).not.toBeNull();
  });

  it('should respect user preferences', async () => {
    // Create preferences with email disabled
    await prisma.notificationPreference.create({
      data: {
        userId: testUserId,
        emailEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
      },
    });

    const result = await notificationService.create({
      userId: testUserId,
      type: 'BOOKING_CONFIRMED',
      title: 'Preference Test',
      body: 'Should not send email',
    });

    expect(result.ok).toBe(true);

    const notification = await prisma.notification.findUnique({
      where: { id: result.value!.id },
    });

    expect(notification?.channels).not.toContain('EMAIL');
    expect(notification?.channels).toContain('PUSH');
    expect(notification?.channels).toContain('IN_APP');
  });
});
```

## 4. E2E Tests

```typescript
// __tests__/e2e/notification-flow.test.ts

import { test, expect } from '@playwright/test';

test.describe('Notification System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[name="email"]', 'e2e-test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('notification bell shows unread count', async ({ page }) => {
    // Create a notification via API
    await page.evaluate(async () => {
      await fetch('/api/test/create-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BOOKING_REQUEST_RECEIVED',
          title: 'E2E Test Notification',
          body: 'Testing notification display',
        }),
      });
    });

    // Wait for SSE to deliver
    await page.waitForTimeout(2000);

    // Check bell badge
    const badge = page.locator('[data-testid="notification-badge"]');
    await expect(badge).toBeVisible();
    const count = await badge.textContent();
    expect(parseInt(count || '0')).toBeGreaterThan(0);
  });

  test('notification center opens and displays notifications', async ({ page }) => {
    // Click notification bell
    await page.click('[data-testid="notification-bell"]');

    // Wait for center to open
    await expect(page.locator('[data-testid="notification-center"]')).toBeVisible();

    // Check notification cards
    const cards = page.locator('[data-testid="notification-card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('clicking notification marks it as read', async ({ page }) => {
    // Open notification center
    await page.click('[data-testid="notification-bell"]');

    // Get unread notification
    const unreadCard = page.locator('[data-testid="notification-card"].unread').first();
    await expect(unreadCard).toBeVisible();

    // Click it
    await unreadCard.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Should no longer be unread
    await expect(unreadCard).not.toHaveClass(/unread/);
  });

  test('mark all as read works', async ({ page }) => {
    // Open notification center
    await page.click('[data-testid="notification-bell"]');

    // Click mark all read
    await page.click('button:has-text("Alle gelesen")');

    // Wait for update
    await page.waitForTimeout(500);

    // No unread notifications
    const unreadCards = page.locator('[data-testid="notification-card"].unread');
    await expect(unreadCards).toHaveCount(0);

    // Badge should be gone
    const badge = page.locator('[data-testid="notification-badge"]');
    await expect(badge).not.toBeVisible();
  });

  test('banner appears for urgent notifications', async ({ page }) => {
    // Trigger urgent notification
    await page.evaluate(async () => {
      await fetch('/api/test/create-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BOOKING_REQUEST_RECEIVED',
          title: 'Urgent: New Booking',
          body: 'Action required',
          priority: 'URGENT',
        }),
      });
    });

    // Wait for banner
    const banner = page.locator('[data-testid="notification-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText('Urgent: New Booking');
  });
});
```

## 5. Test Utilities

### Mock Factories

```typescript
// __tests__/utils/factories.ts

import { faker } from '@faker-js/faker';

export function createMockUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    ...overrides,
  };
}

export function createMockNotification(overrides = {}) {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    type: 'BOOKING_REQUEST_RECEIVED',
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
    status: 'PENDING',
    priority: 'NORMAL',
    channels: ['IN_APP'],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockPreferences(overrides = {}) {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    pushEnabled: true,
    emailEnabled: true,
    inAppEnabled: true,
    quietHoursEnabled: false,
    ...overrides,
  };
}
```

### Test Database Setup

```typescript
// __tests__/setup.ts

import { prisma } from '@/lib/prisma';

beforeAll(async () => {
  // Clear test data
  await prisma.$executeRaw`TRUNCATE TABLE notifications CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE notification_preferences CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE device_tokens CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## 6. Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration

# E2E tests
npx playwright test

# Coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Verification Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass
- [ ] Coverage > 80% overall
- [ ] Coverage 100% for business logic (notification-service, utils)
- [ ] No flaky tests
- [ ] CI pipeline configured
