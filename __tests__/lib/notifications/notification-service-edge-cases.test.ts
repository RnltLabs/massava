/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Service Edge Cases Tests
 * Tests for branch coverage of critical edge cases
 */

import { notificationService } from '@/lib/notifications/notification-service';
import type { CreateNotificationInput } from '@/lib/notifications/notification-service';
import { prisma } from '@/lib/prisma';
import { qstashPublisher } from '@/lib/queue/qstash-publisher';

// ============================================
// Mocks
// ============================================

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/queue/qstash-publisher', () => ({
  qstashPublisher: {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    publishScheduled: jest.fn(),
  },
}));

jest.mock('@/lib/notifications/utils/idempotency');
jest.mock('@/lib/notifications/utils/preference-checker');
jest.mock('@/lib/notifications/utils/rate-limiter');
jest.mock('@/lib/notifications/notification-templates');

jest.mock('@/lib/firebase/fcm-service', () => ({
  pushService: {
    sendToUser: jest.fn(),
  },
}));

jest.mock('@/lib/email/notification-emails', () => ({
  sendNotificationEmail: jest.fn(),
}));

jest.mock('@/lib/sse/redis-pubsub', () => ({
  ssePublisher: {
    publishToUser: jest.fn(),
  },
}));

// ============================================
// Test Data
// ============================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  notificationPreference: {
    id: 'pref-123',
    userId: 'user-123',
    pushEnabled: true,
    emailEnabled: true,
    inAppEnabled: true,
    typePreferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  deviceTokens: [{ token: 'device-token-123', isActive: true }],
};

const mockNotification = {
  id: 'notif-123',
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed',
  body: 'Your booking has been confirmed',
  metadata: {},
  priority: 'NORMAL',
  channels: ['PUSH', 'EMAIL', 'IN_APP'],
  actionUrl: '/bookings/123',
  scheduledFor: null,
  expiresAt: null,
  bookingId: 'booking-123',
  studioId: 'studio-123',
  idempotencyKey: 'idempotency-key-123',
  status: 'QUEUED',
  statusHistory: [
    {
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      reason: 'Created',
    },
  ],
  retryCount: 0,
  maxRetries: 3,
  lastRetryAt: null,
  nextRetryAt: null,
  inAppSeenAt: null,
  pushDeliveredAt: null,
  pushFailedAt: null,
  pushError: null,
  emailSentAt: null,
  emailFailedAt: null,
  emailError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================
// Edge Case Tests
// ============================================

describe('NotificationService - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('process() - Notification Expired During Processing', () => {
    it('should mark notification as EXPIRED when expiresAt is in the past', async () => {
      const expiredNotification = {
        ...mockNotification,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        user: mockUser,
      };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(expiredNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...expiredNotification,
        status: 'EXPIRED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            status: 'EXPIRED',
          }),
        })
      );
    });

    it('should continue processing when expiresAt is null', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      const notificationWithoutExpiry = {
        ...mockNotification,
        expiresAt: null,
        user: mockUser,
      };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notificationWithoutExpiry);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notificationWithoutExpiry,
        status: 'DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(pushService.sendToUser).toHaveBeenCalled();
    });

    it('should continue processing when expiresAt is in the future', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      const notificationWithFutureExpiry = {
        ...mockNotification,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        user: mockUser,
      };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notificationWithFutureExpiry);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notificationWithFutureExpiry,
        status: 'DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(pushService.sendToUser).toHaveBeenCalled();
    });
  });

  describe('process() - All Channels Fail (Max Retries Exceeded)', () => {
    it('should mark as FAILED when all channels fail and max retries reached', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockRejectedValue(new Error('Push failed'));
      (sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('Email failed'));
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('In-app failed'));

      const notificationAtMaxRetries = {
        ...mockNotification,
        retryCount: 3,
        maxRetries: 3,
        user: mockUser,
      };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notificationAtMaxRetries);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notificationAtMaxRetries,
        status: 'FAILED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });

    it('should schedule retry when all channels fail but retries remaining', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockRejectedValue(new Error('Push failed'));
      (sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('Email failed'));
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('In-app failed'));

      const notificationWithRetriesRemaining = {
        ...mockNotification,
        retryCount: 1,
        maxRetries: 3,
        user: mockUser,
      };

      (prisma.notification.findUnique as jest.Mock)
        .mockResolvedValueOnce(notificationWithRetriesRemaining)
        .mockResolvedValueOnce(notificationWithRetriesRemaining);

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notificationWithRetriesRemaining,
        status: 'PENDING',
        retryCount: 2,
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            retryCount: { increment: 1 },
            status: 'PENDING',
          }),
        })
      );
      expect(qstashPublisher.publishDelayed).toHaveBeenCalled();
    });
  });

  describe('process() - Partial Delivery (Some Channels Succeed, Some Fail)', () => {
    it('should mark as PARTIALLY_DELIVERED when PUSH succeeds but EMAIL and IN_APP fail', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('Email failed'));
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('In-app failed'));

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        ...mockNotification,
        user: mockUser,
      });

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        status: 'PARTIALLY_DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            status: 'PARTIALLY_DELIVERED',
          }),
        })
      );
    });

    it('should mark as PARTIALLY_DELIVERED when EMAIL succeeds but PUSH and IN_APP fail', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockRejectedValue(new Error('Push failed'));
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('In-app failed'));

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        ...mockNotification,
        user: mockUser,
      });

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        status: 'PARTIALLY_DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            status: 'PARTIALLY_DELIVERED',
          }),
        })
      );
    });

    it('should mark as PARTIALLY_DELIVERED when 2 out of 3 channels succeed', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('In-app failed'));

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        ...mockNotification,
        user: mockUser,
      });

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        status: 'PARTIALLY_DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            status: 'PARTIALLY_DELIVERED',
          }),
        })
      );
    });
  });

  describe('process() - Scheduled Notification Handling', () => {
    it('should process notification with scheduledFor in the past', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      const scheduledNotification = {
        ...mockNotification,
        scheduledFor: new Date(Date.now() - 3600000), // 1 hour ago
        user: mockUser,
      };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(scheduledNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...scheduledNotification,
        status: 'DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(pushService.sendToUser).toHaveBeenCalled();
    });

    it('should process notification with scheduledFor exactly now', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      const scheduledNotification = {
        ...mockNotification,
        scheduledFor: new Date(), // exactly now
        user: mockUser,
      };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(scheduledNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...scheduledNotification,
        status: 'DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(pushService.sendToUser).toHaveBeenCalled();
    });
  });

});
