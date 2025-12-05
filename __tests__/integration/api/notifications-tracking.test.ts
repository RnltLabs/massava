/**
 * Integration tests for notification click tracking API
 * POST /api/notifications/track
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { NotificationType, NotificationStatus } from '@/app/generated/prisma';

describe('POST /api/notifications/track', () => {
  let testUserId: string;
  let testNotificationId: string;

  beforeEach(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `tracking-test-${Date.now()}@test.com`,
        name: 'Track Test User',
        primaryRole: 'CUSTOMER',
      },
    });
    testUserId = user.id;

    // Create test notification
    const notification = await db.notification.create({
      data: {
        userId: testUserId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Test Notification',
        body: 'Test notification body',
        status: NotificationStatus.DELIVERED,
        channels: ['PUSH'],
        pushDeliveredAt: new Date(),
      },
    });
    testNotificationId = notification.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.notification.deleteMany({
      where: { userId: testUserId },
    });
    await db.user.delete({
      where: { id: testUserId },
    });
  });

  describe('Click Tracking', () => {
    it('should track notification click', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'click',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify database update
      const notification = await db.notification.findUnique({
        where: { id: testNotificationId },
      });

      expect(notification?.pushClickedAt).toBeTruthy();
      expect(notification?.pushClickedAt).toBeInstanceOf(Date);
      expect(notification?.clickAction).toBeNull();
    });

    it('should track notification click with action button', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'click',
          clickAction: 'confirm',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify database update
      const notification = await db.notification.findUnique({
        where: { id: testNotificationId },
      });

      expect(notification?.pushClickedAt).toBeTruthy();
      expect(notification?.clickAction).toBe('confirm');
    });

    it('should be idempotent for multiple clicks', async () => {
      // First click
      const firstResponse = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'click',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(firstResponse.status).toBe(200);

      const firstNotification = await db.notification.findUnique({
        where: { id: testNotificationId },
      });
      const firstClickedAt = firstNotification?.pushClickedAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second click (should not update)
      const secondResponse = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'click',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(secondResponse.status).toBe(200);

      const secondNotification = await db.notification.findUnique({
        where: { id: testNotificationId },
      });

      // Timestamp should remain the same
      expect(secondNotification?.pushClickedAt).toEqual(firstClickedAt);
    });
  });

  describe('Dismiss Tracking', () => {
    it('should track notification dismiss', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'dismiss',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify database update
      const notification = await db.notification.findUnique({
        where: { id: testNotificationId },
      });

      expect(notification?.pushDismissedAt).toBeTruthy();
      expect(notification?.pushDismissedAt).toBeInstanceOf(Date);
    });

    it('should be idempotent for multiple dismissals', async () => {
      // First dismiss
      const firstResponse = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'dismiss',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(firstResponse.status).toBe(200);

      const firstNotification = await db.notification.findUnique({
        where: { id: testNotificationId },
      });
      const firstDismissedAt = firstNotification?.pushDismissedAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second dismiss (should not update)
      const secondResponse = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'dismiss',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(secondResponse.status).toBe(200);

      const secondNotification = await db.notification.findUnique({
        where: { id: testNotificationId },
      });

      // Timestamp should remain the same
      expect(secondNotification?.pushDismissedAt).toEqual(firstDismissedAt);
    });
  });

  describe('Validation', () => {
    it('should reject invalid notification ID', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: 'invalid-id',
          action: 'click',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it('should reject non-existent notification', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: 'clwxyz1234567890abcdef12', // Valid CUID format but doesn't exist
          action: 'click',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject invalid action', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'invalid-action',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.details?.action).toBeTruthy();
    });

    it('should reject invalid timestamp', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          action: 'click',
          timestamp: 'not-a-date',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.details?.timestamp).toBeTruthy();
    });

    it('should reject missing required fields', async () => {
      const response = await fetch('http://localhost:3000/api/notifications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: testNotificationId,
          // Missing action and timestamp
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});
