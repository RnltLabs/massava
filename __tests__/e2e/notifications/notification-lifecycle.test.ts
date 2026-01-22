/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * E2E Test: Full Notification Lifecycle
 *
 * Tests the complete notification flow from creation to deletion:
 * - Create notification via service
 * - Verify it appears in user's notification list
 * - Mark as read
 * - Verify status change
 * - Delete notification
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { logger } from '@/lib/logger';
import type { NotificationType, NotificationStatus, UserRole } from '@/app/generated/prisma';

// Mock QStash publisher to avoid actual queue operations
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

// Test user for e2e flows
const E2E_USER_ID = 'e2e-notification-lifecycle-user';
const E2E_USER_EMAIL = 'e2e-lifecycle@example.com';
const E2E_USER_ROLE: UserRole = 'CUSTOMER';

describe('E2E: Full Notification Lifecycle', () => {
  // Setup test user before all tests
  beforeEach(async () => {
    // Clean up existing data
    await prisma.notification.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.notificationPreference.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.user.deleteMany({
      where: { id: E2E_USER_ID },
    });

    // Create test user
    await prisma.user.create({
      data: {
        id: E2E_USER_ID,
        email: E2E_USER_EMAIL,
        name: 'E2E Lifecycle Test User',
        primaryRole: E2E_USER_ROLE,
        emailVerified: new Date(),
      },
    });

    // Create notification preferences
    await prisma.notificationPreference.create({
      data: {
        userId: E2E_USER_ID,
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
      },
    });
  });

  // Cleanup after all tests
  afterEach(async () => {
    await prisma.notification.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.notificationPreference.deleteMany({
      where: { userId: E2E_USER_ID },
    });

    await prisma.user.deleteMany({
      where: { id: E2E_USER_ID },
    });
  });

  test('Complete lifecycle: create -> list -> read -> verify -> delete', async () => {
    // Step 1: Create a notification
    const createResult = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'BOOKING_CONFIRMED' as NotificationType,
      title: 'Your booking is confirmed',
      body: 'Your tattoo session at Studio X is confirmed for tomorrow at 2pm',
      metadata: {
        bookingId: 'booking-123',
        customerName: 'Test User',
        serviceName: 'Tattoo Session',
        appointmentTime: new Date(Date.now() + 86400000).toISOString(),
        studioName: 'Studio X',
        studioId: 'studio-123',
      },
      priority: 'HIGH',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) throw new Error('Failed to create notification');

    const notificationId = createResult.value.id;
    expect(notificationId).toBeDefined();
    expect(createResult.value.status).toBe('QUEUED');

    logger.info('Step 1 passed: Notification created', { notificationId });

    // Step 2: Verify it appears in user's notification list
    const listResult = await notificationService.getUserNotifications(E2E_USER_ID, {
      limit: 20,
    });

    expect(listResult.items).toHaveLength(1);
    expect(listResult.items[0]?.id).toBe(notificationId);
    expect(listResult.items[0]?.title).toBe('Your booking is confirmed');
    expect(listResult.items[0]?.type).toBe('BOOKING_CONFIRMED');
    expect(listResult.items[0]?.priority).toBe('HIGH');
    expect(listResult.hasMore).toBe(false);

    logger.info('Step 2 passed: Notification appears in list');

    // Step 3: Verify unread count
    const unreadCount = await notificationService.getUnreadCount(E2E_USER_ID);
    expect(unreadCount).toBe(0); // QUEUED notifications are not counted as unread

    logger.info('Step 3 passed: Unread count is correct');

    // Step 3b: Simulate notification delivery (update status to DELIVERED)
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'DELIVERED' },
    });

    const unreadCountAfterDelivery = await notificationService.getUnreadCount(E2E_USER_ID);
    expect(unreadCountAfterDelivery).toBe(1);

    logger.info('Step 3b passed: Unread count after delivery is correct');

    // Step 4: Mark notification as read
    const readResult = await notificationService.markAsRead(notificationId, E2E_USER_ID);

    expect(readResult.ok).toBe(true);

    logger.info('Step 4 passed: Notification marked as read');

    // Step 5: Verify status changed to READ
    const notificationAfterRead = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    expect(notificationAfterRead?.status).toBe('READ');
    expect(notificationAfterRead?.inAppSeenAt).toBeDefined();
    expect(notificationAfterRead?.inAppSeenAt).toBeInstanceOf(Date);

    logger.info('Step 5 passed: Status changed to READ');

    // Step 6: Verify unread count decreased
    const unreadCountAfterRead = await notificationService.getUnreadCount(E2E_USER_ID);
    expect(unreadCountAfterRead).toBe(0);

    logger.info('Step 6 passed: Unread count decreased to 0');

    // Step 7: Delete notification
    const deleteResult = await notificationService.deleteNotification(
      notificationId,
      E2E_USER_ID
    );

    expect(deleteResult.ok).toBe(true);

    logger.info('Step 7 passed: Notification deleted');

    // Step 8: Verify notification is gone
    const notificationAfterDelete = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    expect(notificationAfterDelete).toBeNull();

    logger.info('Step 8 passed: Notification no longer exists');

    // Step 9: Verify it doesn't appear in list anymore
    const listResultAfterDelete = await notificationService.getUserNotifications(E2E_USER_ID, {
      limit: 20,
    });

    expect(listResultAfterDelete.items).toHaveLength(0);

    logger.info('Step 9 passed: Notification removed from list');
  });

  test('Multiple notifications lifecycle with filtering', async () => {
    // Create multiple notifications of different types
    const notifications = [
      {
        type: 'WELCOME' as NotificationType,
        title: 'Welcome to our platform',
        priority: 'NORMAL',
      },
      {
        type: 'FEATURE_ANNOUNCEMENT' as NotificationType,
        title: 'New feature available',
        priority: 'NORMAL',
      },
      {
        type: 'SYSTEM_MAINTENANCE' as NotificationType,
        title: 'Scheduled maintenance',
        priority: 'HIGH',
      },
    ];

    const createdIds: string[] = [];

    for (const notif of notifications) {
      const result = await notificationService.create({
        userId: E2E_USER_ID,
        type: notif.type,
        title: notif.title,
        body: 'Test body',
        priority: notif.priority as any,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        createdIds.push(result.value.id);
      }
    }

    expect(createdIds).toHaveLength(3);

    // Test 1: List all notifications
    const allNotifications = await notificationService.getUserNotifications(E2E_USER_ID);
    expect(allNotifications.items).toHaveLength(3);

    // Test 2: Filter by type
    const systemNotifications = await notificationService.getUserNotifications(E2E_USER_ID, {
      type: ['SYSTEM_MAINTENANCE', 'FEATURE_ANNOUNCEMENT'],
    });
    expect(systemNotifications.items).toHaveLength(2);

    // Test 3: Mark all as delivered then check unread count
    await prisma.notification.updateMany({
      where: { userId: E2E_USER_ID },
      data: { status: 'DELIVERED' },
    });

    const unreadCount = await notificationService.getUnreadCount(E2E_USER_ID);
    expect(unreadCount).toBe(3);

    // Test 4: Mark all as read
    const markAllResult = await notificationService.markAllAsRead(E2E_USER_ID);
    expect(markAllResult.ok).toBe(true);
    if (markAllResult.ok) {
      expect(markAllResult.value.count).toBe(3);
    }

    // Test 5: Verify all marked as read
    const unreadCountAfter = await notificationService.getUnreadCount(E2E_USER_ID);
    expect(unreadCountAfter).toBe(0);

    // Test 6: Filter by status
    const readNotifications = await notificationService.getUserNotifications(E2E_USER_ID, {
      status: ['READ'] as NotificationStatus[],
    });
    expect(readNotifications.items).toHaveLength(3);

    // Test 7: Delete all notifications
    for (const id of createdIds) {
      const result = await notificationService.deleteNotification(id, E2E_USER_ID);
      expect(result.ok).toBe(true);
    }

    // Test 8: Verify all deleted
    const finalList = await notificationService.getUserNotifications(E2E_USER_ID);
    expect(finalList.items).toHaveLength(0);
  });

  test('Pagination works correctly', async () => {
    // Create 25 notifications
    const notificationIds: string[] = [];

    for (let i = 0; i < 25; i++) {
      const result = await notificationService.create({
        userId: E2E_USER_ID,
        type: 'WELCOME' as NotificationType,
        title: `Notification ${i + 1}`,
        body: 'Test body',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        notificationIds.push(result.value.id);
      }
    }

    // First page: limit 10
    const page1 = await notificationService.getUserNotifications(E2E_USER_ID, {
      limit: 10,
    });

    expect(page1.items).toHaveLength(10);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeDefined();

    // Second page: use cursor
    const page2 = await notificationService.getUserNotifications(E2E_USER_ID, {
      limit: 10,
      cursor: page1.nextCursor,
    });

    expect(page2.items).toHaveLength(10);
    expect(page2.hasMore).toBe(true);
    expect(page2.nextCursor).toBeDefined();

    // Verify no duplicate notifications between pages
    const page1Ids = page1.items.map((n) => n.id);
    const page2Ids = page2.items.map((n) => n.id);
    const intersection = page1Ids.filter((id) => page2Ids.includes(id));
    expect(intersection).toHaveLength(0);

    // Third page: remaining 5
    const page3 = await notificationService.getUserNotifications(E2E_USER_ID, {
      limit: 10,
      cursor: page2.nextCursor,
    });

    expect(page3.items).toHaveLength(5);
    expect(page3.hasMore).toBe(false);
    expect(page3.nextCursor).toBeUndefined();
  });

  test('Cannot mark another user\'s notification as read', async () => {
    // Create another user
    const otherUserId = 'e2e-other-user';
    await prisma.user.create({
      data: {
        id: otherUserId,
        email: 'other@example.com',
        name: 'Other User',
        primaryRole: 'CUSTOMER' as UserRole,
      },
    });

    // Create notification for main user
    const createResult = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome notification',
      body: 'Test body',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) throw new Error('Failed to create notification');

    const notificationId = createResult.value.id;

    // Try to mark as read with wrong user ID
    const readResult = await notificationService.markAsRead(notificationId, otherUserId);

    expect(readResult.ok).toBe(false);
    if (!readResult.ok) {
      expect(readResult.error.code).toBe('NOTIFICATION_NOT_FOUND');
    }

    // Verify notification was not marked as read
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    expect(notification?.status).toBe('QUEUED');
    expect(notification?.inAppSeenAt).toBeNull();

    // Cleanup
    await prisma.user.delete({ where: { id: otherUserId } });
  });

  test('Cannot delete another user\'s notification', async () => {
    // Create another user
    const otherUserId = 'e2e-other-user-2';
    await prisma.user.create({
      data: {
        id: otherUserId,
        email: 'other2@example.com',
        name: 'Other User 2',
        primaryRole: 'CUSTOMER' as UserRole,
      },
    });

    // Create notification for main user
    const createResult = await notificationService.create({
      userId: E2E_USER_ID,
      type: 'WELCOME' as NotificationType,
      title: 'Welcome notification',
      body: 'Test body',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) throw new Error('Failed to create notification');

    const notificationId = createResult.value.id;

    // Try to delete with wrong user ID
    const deleteResult = await notificationService.deleteNotification(
      notificationId,
      otherUserId
    );

    expect(deleteResult.ok).toBe(false);
    if (!deleteResult.ok) {
      expect(deleteResult.error.code).toBe('NOTIFICATION_NOT_FOUND');
    }

    // Verify notification still exists
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    expect(notification).toBeDefined();

    // Cleanup
    await prisma.user.delete({ where: { id: otherUserId } });
  });
});
