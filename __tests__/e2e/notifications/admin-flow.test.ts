/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * E2E Test: Admin Notification Flow
 *
 * Tests admin-specific notification operations:
 * - Admin creates notification via service
 * - User receives notification
 * - Verify proper authorization
 * - Test admin-to-user notification flow
 * - Test bulk notification scenarios
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { logger } from '@/lib/logger';
import type { NotificationType, UserRole } from '@/app/generated/prisma';

// Mock QStash publisher
jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  },
}));

// Mock Redis for rate limiting
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
  })),
}));

const ADMIN_USER_ID = 'e2e-admin-user';
const ADMIN_EMAIL = 'admin@example.com';
const CUSTOMER_USER_ID = 'e2e-customer-user';
const CUSTOMER_EMAIL = 'customer@example.com';
const STUDIO_OWNER_ID = 'e2e-studio-owner';
const STUDIO_OWNER_EMAIL = 'owner@example.com';

describe('E2E: Admin Notification Flow', () => {
  beforeEach(async () => {
    // Clean up existing data
    await prisma.notification.deleteMany({
      where: {
        userId: {
          in: [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID],
        },
      },
    });

    await prisma.notificationPreference.deleteMany({
      where: {
        userId: {
          in: [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID],
        },
      },
    });

    // Create admin user
    await prisma.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: ADMIN_EMAIL,
        name: 'Admin User',
        primaryRole: 'SUPER_ADMIN' as UserRole,
        emailVerified: new Date(),
      },
    });

    // Create customer user
    await prisma.user.create({
      data: {
        id: CUSTOMER_USER_ID,
        email: CUSTOMER_EMAIL,
        name: 'Customer User',
        primaryRole: 'CUSTOMER' as UserRole,
        emailVerified: new Date(),
      },
    });

    // Create studio owner user
    await prisma.user.create({
      data: {
        id: STUDIO_OWNER_ID,
        email: STUDIO_OWNER_EMAIL,
        name: 'Studio Owner',
        primaryRole: 'STUDIO_OWNER' as UserRole,
        emailVerified: new Date(),
      },
    });

    // Create preferences for all users
    for (const userId of [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID]) {
      await prisma.notificationPreference.create({
        data: {
          userId,
        },
      });
    }
  });

  afterEach(async () => {
    await prisma.notification.deleteMany({
      where: {
        userId: {
          in: [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID],
        },
      },
    });

    await prisma.notificationPreference.deleteMany({
      where: {
        userId: {
          in: [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID],
        },
      },
    });
  });

  test('Admin creates notification for customer user', async () => {
    // Admin creates notification for customer
    const result = await notificationService.create({
      userId: CUSTOMER_USER_ID,
      type: 'SYSTEM_MAINTENANCE' as NotificationType,
      title: 'Scheduled Maintenance',
      body: 'The system will be under maintenance tonight from 2am to 4am',
      priority: 'HIGH',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notificationId = result.value.id;

    logger.info('Admin created notification', { notificationId });

    // Verify notification exists for customer
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    expect(notification?.userId).toBe(CUSTOMER_USER_ID);
    expect(notification?.type).toBe('SYSTEM_MAINTENANCE');
    expect(notification?.title).toBe('Scheduled Maintenance');

    // Verify customer can see the notification
    const customerNotifications = await notificationService.getUserNotifications(
      CUSTOMER_USER_ID
    );

    expect(customerNotifications.items).toHaveLength(1);
    expect(customerNotifications.items[0]?.id).toBe(notificationId);

    logger.info('Customer received admin notification');
  });

  test('Studio owner creates notification for their customers', async () => {
    // Studio owner creates notification for customer
    const result = await notificationService.create({
      userId: CUSTOMER_USER_ID,
      type: 'STUDIO_PROMOTION' as NotificationType,
      title: 'Special Offer',
      body: 'Get 20% off your next tattoo session this week!',
      metadata: { studioId: 'studio-123', promoCode: 'SPECIAL20' },
      priority: 'NORMAL',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification?.userId).toBe(CUSTOMER_USER_ID);
    expect(notification?.type).toBe('STUDIO_PROMOTION');

    const metadata = notification?.metadata as any;
    expect(metadata?.promoCode).toBe('SPECIAL20');

    logger.info('Studio owner created promotional notification');
  });

  test('Admin sends bulk notifications to multiple users', async () => {
    // Create additional test users
    const bulkUserIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const userId = `e2e-bulk-user-${i}`;
      bulkUserIds.push(userId);

      await prisma.user.create({
        data: {
          id: userId,
          email: `bulk-user-${i}@example.com`,
          name: `Bulk User ${i}`,
          primaryRole: 'CUSTOMER' as UserRole,
          emailVerified: new Date(),
        },
      });

      await prisma.notificationPreference.create({
        data: {
          userId,
        },
      });
    }

    // Admin sends notification to each user
    const notificationIds: string[] = [];

    for (const userId of bulkUserIds) {
      const result = await notificationService.create({
        userId,
        type: 'FEATURE_ANNOUNCEMENT' as NotificationType,
        title: 'New Feature Available',
        body: 'Check out our new booking calendar feature!',
        priority: 'NORMAL',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        notificationIds.push(result.value.id);
      }
    }

    expect(notificationIds).toHaveLength(5);

    // Verify each user received their notification
    for (const userId of bulkUserIds) {
      const notifications = await notificationService.getUserNotifications(userId);
      expect(notifications.items).toHaveLength(1);
      expect(notifications.items[0]?.type).toBe('FEATURE_ANNOUNCEMENT');
    }

    logger.info('Bulk notifications sent successfully', { count: bulkUserIds.length });

    // Cleanup bulk users
    await prisma.notification.deleteMany({
      where: { userId: { in: bulkUserIds } },
    });
    await prisma.notificationPreference.deleteMany({
      where: { userId: { in: bulkUserIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: bulkUserIds } },
    });
  });

  test('Admin broadcasts urgent notification to all users', async () => {
    // Create urgent system notification for all test users
    const userIds = [ADMIN_USER_ID, CUSTOMER_USER_ID, STUDIO_OWNER_ID];
    const notificationIds: string[] = [];

    for (const userId of userIds) {
      const result = await notificationService.create({
        userId,
        type: 'SYSTEM_MAINTENANCE' as NotificationType,
        title: 'URGENT: System Emergency Maintenance',
        body: 'The system will be taken offline in 15 minutes for emergency maintenance',
        priority: 'URGENT',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        notificationIds.push(result.value.id);
      }
    }

    expect(notificationIds).toHaveLength(3);

    // Verify all users received the urgent notification
    for (const userId of userIds) {
      const notifications = await notificationService.getUserNotifications(userId);
      const urgentNotif = notifications.items.find((n) => n.priority === 'URGENT');

      expect(urgentNotif).toBeDefined();
      expect(urgentNotif?.title).toContain('URGENT');
      expect(urgentNotif?.type).toBe('SYSTEM_MAINTENANCE');
    }

    logger.info('Urgent broadcast notification sent to all users');
  });

  test('Admin schedules future notification', async () => {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 2); // 2 hours from now

    // Admin schedules notification
    const result = await notificationService.create({
      userId: CUSTOMER_USER_ID,
      type: 'TERMS_UPDATE' as NotificationType,
      title: 'Terms of Service Updated',
      body: 'Our terms of service have been updated. Please review.',
      scheduledFor: scheduledTime,
      priority: 'NORMAL',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification?.status).toBe('PENDING');
    expect(notification?.scheduledFor).toBeDefined();
    expect(notification?.scheduledFor?.getTime()).toBeGreaterThan(Date.now());

    logger.info('Scheduled notification created', {
      scheduledFor: notification?.scheduledFor,
    });
  });

  test('Admin creates notification with expiration', async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Admin creates notification with expiration
    const result = await notificationService.create({
      userId: CUSTOMER_USER_ID,
      type: 'STUDIO_PROMOTION' as NotificationType,
      title: 'Limited Time Offer',
      body: 'Special discount available for the next 7 days',
      expiresAt,
      priority: 'NORMAL',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification?.expiresAt).toBeDefined();
    expect(notification?.expiresAt?.getTime()).toBeGreaterThan(Date.now());

    logger.info('Notification with expiration created', {
      expiresAt: notification?.expiresAt,
    });
  });

  test('Admin notification includes action URL', async () => {
    // Admin creates notification with action URL
    const result = await notificationService.create({
      userId: CUSTOMER_USER_ID,
      type: 'FEATURE_ANNOUNCEMENT' as NotificationType,
      title: 'New Feature Available',
      body: 'Check out our new booking feature',
      actionUrl: '/features/booking-calendar',
      priority: 'NORMAL',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification?.actionUrl).toBe('/features/booking-calendar');

    logger.info('Notification with action URL created');
  });

  test('Admin notification with booking context', async () => {
    const bookingId = 'booking-admin-123';

    // Admin creates booking-related notification
    const result = await notificationService.create({
      userId: CUSTOMER_USER_ID,
      type: 'BOOKING_REMINDER_CUSTOMER' as NotificationType,
      title: 'Appointment Reminder',
      body: 'Your tattoo appointment is tomorrow at 2pm',
      bookingId,
      metadata: { studioName: 'Ink Masters', artistName: 'John Doe' },
      priority: 'HIGH',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification?.bookingId).toBe(bookingId);

    const metadata = notification?.metadata as any;
    expect(metadata?.studioName).toBe('Ink Masters');
    expect(metadata?.artistName).toBe('John Doe');

    logger.info('Booking-related notification created with context');
  });

  test('Admin notification with studio context', async () => {
    const studioId = 'studio-admin-456';

    // Admin creates studio-related notification
    const result = await notificationService.create({
      userId: STUDIO_OWNER_ID,
      type: 'LOW_AVAILABILITY_ALERT' as NotificationType,
      title: 'Low Availability Alert',
      body: 'Your studio has less than 5 available slots this week',
      studioId,
      metadata: { availableSlots: 3, week: '2025-12-02' },
      priority: 'NORMAL',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Failed to create notification');

    const notification = await prisma.notification.findUnique({
      where: { id: result.value.id },
    });

    expect(notification?.studioId).toBe(studioId);
    expect(notification?.userId).toBe(STUDIO_OWNER_ID);

    const metadata = notification?.metadata as any;
    expect(metadata?.availableSlots).toBe(3);

    logger.info('Studio-related notification created with context');
  });

  test('Admin can query all notifications across users', async () => {
    // Create notifications for different users
    await notificationService.create({
      userId: CUSTOMER_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome Customer',
      body: 'Welcome to our platform',
    });

    await notificationService.create({
      userId: STUDIO_OWNER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome Studio Owner',
      body: 'Welcome to our platform',
    });

    // Admin queries all notifications (across all users)
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId: {
          in: [CUSTOMER_USER_ID, STUDIO_OWNER_ID],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(allNotifications.length).toBeGreaterThanOrEqual(2);

    // Verify different users
    const userIds = [...new Set(allNotifications.map((n) => n.userId))];
    expect(userIds.length).toBeGreaterThanOrEqual(2);

    logger.info('Admin queried notifications across multiple users', {
      totalNotifications: allNotifications.length,
      uniqueUsers: userIds.length,
    });
  });

  test('Admin notification respects idempotency', async () => {
    // Create notification twice with same parameters
    const input = {
      userId: CUSTOMER_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Booking Confirmed',
      body: 'Your booking is confirmed',
      bookingId: 'booking-duplicate-test',
    };

    const result1 = await notificationService.create(input);
    expect(result1.ok).toBe(true);
    if (!result1.ok) throw new Error('Failed to create notification');

    // Try to create duplicate (within idempotency window)
    const result2 = await notificationService.create(input);
    expect(result2.ok).toBe(true);
    if (!result2.ok) throw new Error('Failed to create notification');

    // Should return same notification ID
    expect(result1.value.id).toBe(result2.value.id);

    // Verify only one notification was created
    const notifications = await notificationService.getUserNotifications(CUSTOMER_USER_ID);
    const duplicateNotifs = notifications.items.filter(
      (n) => n.bookingId === 'booking-duplicate-test'
    );

    expect(duplicateNotifs).toHaveLength(1);

    logger.info('Idempotency prevented duplicate notification');
  });

  test('Admin notification statistics and counts', async () => {
    // Create multiple notifications
    const types: NotificationType[] = [
      'BOOKING_CONFIRMED',
      'BOOKING_REMINDER_CUSTOMER',
      'REVIEW_REQUEST',
    ];

    for (const type of types) {
      await notificationService.create({
        userId: CUSTOMER_USER_ID,
        type,
        title: `Test ${type}`,
        body: 'Test body',
      });
    }

    // Get notification counts by type
    const notificationsByType = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: CUSTOMER_USER_ID },
      _count: { type: true },
    });

    expect(notificationsByType.length).toBeGreaterThanOrEqual(3);

    // Get total unread count
    await prisma.notification.updateMany({
      where: { userId: CUSTOMER_USER_ID },
      data: { status: 'DELIVERED' },
    });

    const unreadCount = await notificationService.getUnreadCount(CUSTOMER_USER_ID);
    expect(unreadCount).toBeGreaterThanOrEqual(3);

    logger.info('Notification statistics retrieved', {
      byType: notificationsByType,
      unreadCount,
    });
  });
});
