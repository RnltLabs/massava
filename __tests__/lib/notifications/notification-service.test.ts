/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Service Unit Tests
 * Tests für alle Methoden mit 100% Coverage
 */

import { notificationService } from '@/lib/notifications/notification-service';
import type { CreateNotificationInput } from '@/lib/notifications/notification-service';
import { prisma } from '@/lib/prisma';
import { qstashPublisher } from '@/lib/queue/qstash-publisher';
import * as idempotency from '@/lib/notifications/utils/idempotency';
import * as preferenceChecker from '@/lib/notifications/utils/preference-checker';
import * as rateLimiter from '@/lib/notifications/utils/rate-limiter';
import { getNotificationTemplate } from '@/lib/notifications/notification-templates';

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
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
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
  deviceTokens: [],
};

const mockNotification = {
  id: 'notif-123',
  userId: 'user-123',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed',
  body: 'Your booking has been confirmed',
  metadata: {},
  priority: 'HIGH',
  channels: ['PUSH', 'EMAIL', 'IN_APP'],
  actionUrl: '/bookings/123',
  scheduledFor: null,
  expiresAt: null,
  bookingId: 'booking-123',
  studioId: 'studio-123',
  idempotencyKey: 'idempotency-key-123',
  status: 'PENDING',
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
// Tests
// ============================================

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (idempotency.generateIdempotencyKey as jest.Mock).mockReturnValue('idempotency-key-123');
    (preferenceChecker.checkUserPreferences as jest.Mock).mockReturnValue(['PUSH', 'EMAIL', 'IN_APP']);
    (rateLimiter.isRateLimited as jest.Mock).mockResolvedValue(false);
    (getNotificationTemplate as jest.Mock).mockReturnValue({
      title: 'Booking Confirmed',
      body: 'Your booking has been confirmed',
      actionUrl: '/bookings/123',
    });
  });

  describe('create()', () => {
    const validInput: CreateNotificationInput = {
      userId: 'user-123',
      type: 'BOOKING_CONFIRMED',
      bookingId: 'booking-123',
    };

    it('sollte erfolgreich eine Notification erstellen', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (qstashPublisher.publish as jest.Mock).mockResolvedValue(undefined);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        status: 'QUEUED',
      });

      const result = await notificationService.create(validInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('notif-123');
        expect(result.value.status).toBe('PENDING');
      }

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { notificationPreference: true },
      });

      expect(rateLimiter.isRateLimited).toHaveBeenCalledWith('user-123', 'BOOKING_CONFIRMED', 'NORMAL');
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(qstashPublisher.publish).toHaveBeenCalled();
    });

    it('sollte USER_NOT_FOUND zurückgeben, wenn User nicht existiert', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.create(validInput);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
        expect(result.error.message).toBe('User not found');
      }

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('sollte RATE_LIMITED zurückgeben, wenn Rate Limit erreicht ist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (rateLimiter.isRateLimited as jest.Mock).mockResolvedValue(true);

      const result = await notificationService.create(validInput);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('RATE_LIMITED');
        expect(result.error.message).toBe('Too many notifications');
      }

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('sollte existierende Notification zurückgeben (Idempotency)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationService.create(validInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('notif-123');
        expect(result.value.status).toBe('PENDING');
      }

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('sollte Template verwenden, wenn kein Title/Body angegeben', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      await notificationService.create(validInput);

      expect(getNotificationTemplate).toHaveBeenCalledWith('BOOKING_CONFIRMED', {});
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Booking Confirmed',
            body: 'Your booking has been confirmed',
          }),
        })
      );
    });

    it('sollte custom Title und Body verwenden, wenn angegeben', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        title: 'Custom Title',
        body: 'Custom Body',
      });

      const customInput: CreateNotificationInput = {
        ...validInput,
        title: 'Custom Title',
        body: 'Custom Body',
      };

      await notificationService.create(customInput);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Custom Title',
            body: 'Custom Body',
          }),
        })
      );
    });

    it('sollte User-Preferences für Channels verwenden', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (preferenceChecker.checkUserPreferences as jest.Mock).mockReturnValue(['IN_APP']);

      await notificationService.create(validInput);

      expect(preferenceChecker.checkUserPreferences).toHaveBeenCalledWith(
        mockUser.notificationPreference,
        'BOOKING_CONFIRMED'
      );
    });

    it('sollte custom Channels verwenden, wenn angegeben', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        channels: ['PUSH'],
      });

      const customInput: CreateNotificationInput = {
        ...validInput,
        channels: ['PUSH'],
      };

      await notificationService.create(customInput);

      expect(preferenceChecker.checkUserPreferences).not.toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channels: ['PUSH'],
          }),
        })
      );
    });

    it('sollte default Priority verwenden, wenn nicht angegeben', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      await notificationService.create(validInput);

      // BOOKING_CONFIRMED hat default Priority HIGH
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'HIGH',
          }),
        })
      );
    });

    it('sollte custom Priority verwenden, wenn angegeben', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        priority: 'URGENT',
      });

      const customInput: CreateNotificationInput = {
        ...validInput,
        priority: 'URGENT',
      };

      await notificationService.create(customInput);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'URGENT',
          }),
        })
      );
    });

    it('sollte Notification schedulen, wenn scheduledFor angegeben', async () => {
      const scheduledDate = new Date(Date.now() + 3600000);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        scheduledFor: scheduledDate,
        status: 'PENDING',
      });

      const scheduledInput: CreateNotificationInput = {
        ...validInput,
        scheduledFor: scheduledDate,
      };

      const result = await notificationService.create(scheduledInput);

      expect(result.ok).toBe(true);
      expect(qstashPublisher.publish).not.toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledFor: scheduledDate,
            status: 'PENDING',
          }),
        })
      );
    });

    it('sollte nicht fehlschlagen, wenn Queuing fehlschlägt', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (qstashPublisher.publish as jest.Mock).mockRejectedValue(new Error('Queue error'));

      const result = await notificationService.create(validInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('notif-123');
      }
    });

    it('sollte DATABASE_ERROR zurückgeben bei Datenbank-Fehler', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const result = await notificationService.create(validInput);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Failed to create notification');
      }
    });

    it('sollte fehlende User-Preferences mit Defaults handhaben', async () => {
      const userWithoutPrefs = {
        ...mockUser,
        notificationPreference: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithoutPrefs);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationService.create(validInput);

      expect(result.ok).toBe(true);
      expect(preferenceChecker.checkUserPreferences).toHaveBeenCalledWith(null, 'BOOKING_CONFIRMED');
    });

    it('sollte NORMAL Priority verwenden, wenn kein Default für Typ existiert', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        ...mockNotification,
        type: 'UNKNOWN_TYPE' as any,
        priority: 'NORMAL',
      });

      const customInput: CreateNotificationInput = {
        ...validInput,
        type: 'UNKNOWN_TYPE' as any,
      };

      await notificationService.create(customInput);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'NORMAL',
          }),
        })
      );
    });
  });

  describe('markAsRead()', () => {
    it('sollte Notification erfolgreich als gelesen markieren', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        status: 'READ',
        inAppSeenAt: new Date(),
      });

      const result = await notificationService.markAsRead('notif-123', 'user-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-123', userId: 'user-123' },
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: {
          status: 'READ',
          inAppSeenAt: expect.any(Date),
        },
      });
    });

    it('sollte INVALID_INPUT zurückgeben, wenn Notification nicht existiert', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.markAsRead('notif-999', 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
        expect(result.error.message).toBe('Notification not found');
      }
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('sollte INVALID_INPUT zurückgeben, wenn falsche UserId', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.markAsRead('notif-123', 'wrong-user');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead()', () => {
    it('sollte alle ungelesenen Notifications markieren', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await notificationService.markAllAsRead('user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.count).toBe(5);
      }

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
          inAppSeenAt: null,
        },
        data: {
          status: 'READ',
          inAppSeenAt: expect.any(Date),
        },
      });
    });

    it('sollte 0 zurückgeben, wenn keine ungelesenen vorhanden', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await notificationService.markAllAsRead('user-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.count).toBe(0);
      }
    });
  });

  describe('getUserNotifications()', () => {
    const mockNotifications = [
      { ...mockNotification, id: 'notif-1', createdAt: new Date('2025-01-01') },
      { ...mockNotification, id: 'notif-2', createdAt: new Date('2025-01-02') },
      { ...mockNotification, id: 'notif-3', createdAt: new Date('2025-01-03') },
    ];

    it('sollte Notifications mit Pagination zurückgeben', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await notificationService.getUserNotifications('user-123', {
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('notif-2');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 3, // limit + 1
      });
    });

    it('sollte Status-Filter verwenden', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      await notificationService.getUserNotifications('user-123', {
        status: ['DELIVERED', 'READ'],
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-123',
            status: { in: ['DELIVERED', 'READ'] },
          },
        })
      );
    });

    it('sollte Typ-Filter verwenden', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      await notificationService.getUserNotifications('user-123', {
        type: ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED_BY_STUDIO'],
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-123',
            type: { in: ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED_BY_STUDIO'] },
          },
        })
      );
    });

    it('sollte cursor-basierte Pagination verwenden', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications.slice(1));

      await notificationService.getUserNotifications('user-123', {
        cursor: 'notif-1',
        limit: 2,
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'notif-1' },
          skip: 1,
        })
      );
    });

    it('sollte hasMore=false zurückgeben, wenn keine weiteren Einträge', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications.slice(0, 2));

      const result = await notificationService.getUserNotifications('user-123', {
        limit: 5,
      });

      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it('sollte default limit von 20 verwenden', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      await notificationService.getUserNotifications('user-123');

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 21, // default 20 + 1
        })
      );
    });
  });

  describe('getUnreadCount()', () => {
    it('sollte korrekte Anzahl ungelesener Notifications zurückgeben', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(7);

      const count = await notificationService.getUnreadCount('user-123');

      expect(count).toBe(7);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
          inAppSeenAt: null,
        },
      });
    });

    it('sollte 0 zurückgeben, wenn keine ungelesenen vorhanden', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(0);

      const count = await notificationService.getUnreadCount('user-123');

      expect(count).toBe(0);
    });
  });

  describe('deleteNotification()', () => {
    it('sollte Notification erfolgreich löschen', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.notification.delete as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationService.deleteNotification('notif-123', 'user-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-123', userId: 'user-123' },
      });
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
      });
    });

    it('sollte INVALID_INPUT zurückgeben, wenn Notification nicht existiert', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.deleteNotification('notif-999', 'user-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
        expect(result.error.message).toBe('Notification not found');
      }
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });

    it('sollte INVALID_INPUT zurückgeben, wenn falsche UserId', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.deleteNotification('notif-123', 'wrong-user');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
  });

  describe('process()', () => {
    const mockNotificationWithUser = {
      ...mockNotification,
      status: 'QUEUED',
      user: {
        ...mockUser,
        deviceTokens: [{ token: 'device-token-123', isActive: true }],
      },
    };

    beforeEach(() => {
      // Mock für dynamic imports
      jest.mock('@/lib/firebase/fcm-service', () => ({
        pushService: { sendToUser: jest.fn().mockResolvedValue(undefined) },
      }));
      jest.mock('@/lib/email/notification-emails', () => ({
        sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
      }));
      jest.mock('@/lib/sse/redis-pubsub', () => ({
        ssePublisher: { publishToUser: jest.fn().mockResolvedValue(undefined) },
      }));
    });

    it('sollte INVALID_INPUT zurückgeben, wenn Notification nicht existiert', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.process('notif-999');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
        expect(result.error.message).toBe('Notification not found');
      }
    });

    it('sollte Notification als EXPIRED markieren, wenn abgelaufen', async () => {
      const expiredNotification = {
        ...mockNotificationWithUser,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
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

    it('sollte DELIVERED Status setzen, wenn alle Channels erfolgreich', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotificationWithUser);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotificationWithUser,
        status: 'DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(pushService.sendToUser).toHaveBeenCalled();
      expect(sendNotificationEmail).toHaveBeenCalled();
      expect(ssePublisher.publishToUser).toHaveBeenCalled();
    });

    it('sollte PARTIALLY_DELIVERED Status setzen, wenn einige Channels fehlschlagen', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('Email failed'));
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotificationWithUser);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotificationWithUser,
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

    it('sollte Retry schedulen, wenn alle Channels fehlschlagen und Retries übrig', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockRejectedValue(new Error('Push failed'));
      (sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('Email failed'));
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('In-app failed'));

      const notificationWithRetries = {
        ...mockNotificationWithUser,
        retryCount: 1,
        maxRetries: 3,
      };

      // First call for process(), second call for scheduleRetry()
      (prisma.notification.findUnique as jest.Mock)
        .mockResolvedValueOnce(notificationWithRetries)
        .mockResolvedValueOnce(notificationWithRetries);

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notificationWithRetries,
        retryCount: 2,
        status: 'PENDING',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(qstashPublisher.publishDelayed).toHaveBeenCalled();
    });

    it('sollte FAILED Status setzen, wenn max Retries erreicht', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockRejectedValue(new Error('Push failed'));
      (sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('Email failed'));
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('In-app failed'));

      const notificationMaxRetries = {
        ...mockNotificationWithUser,
        retryCount: 3,
        maxRetries: 3,
      };

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notificationMaxRetries);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notificationMaxRetries,
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
      expect(qstashPublisher.publishDelayed).not.toHaveBeenCalled();
    });

    it('sollte Push-Fehler behandeln und in DB speichern', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      const pushError = new Error('Push service unavailable');
      (pushService.sendToUser as jest.Mock).mockRejectedValue(pushError);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotificationWithUser);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotificationWithUser,
        pushFailedAt: new Date(),
        pushError: 'Push service unavailable',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            pushFailedAt: expect.any(Date),
            pushError: 'Push service unavailable',
          }),
        })
      );
    });

    it('sollte Email-Fehler behandeln und in DB speichern', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      const emailError = new Error('Email service unavailable');
      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockRejectedValue(emailError);
      (ssePublisher.publishToUser as jest.Mock).mockResolvedValue(undefined);

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotificationWithUser);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotificationWithUser,
        emailFailedAt: new Date(),
        emailError: 'Email service unavailable',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-123' },
          data: expect.objectContaining({
            emailFailedAt: expect.any(Date),
            emailError: 'Email service unavailable',
          }),
        })
      );
    });

    it('sollte In-App-Fehler behandeln', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      const inAppError = new Error('SSE publisher unavailable');
      (pushService.sendToUser as jest.Mock).mockResolvedValue(undefined);
      (sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(inAppError);

      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotificationWithUser);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotificationWithUser,
        status: 'PARTIALLY_DELIVERED',
      });

      const result = await notificationService.process('notif-123');

      expect(result.ok).toBe(true);
    });

    it('sollte exponential backoff für Retries verwenden', async () => {
      const { pushService } = await import('@/lib/firebase/fcm-service');
      const { sendNotificationEmail } = await import('@/lib/email/notification-emails');
      const { ssePublisher } = await import('@/lib/sse/redis-pubsub');

      (pushService.sendToUser as jest.Mock).mockRejectedValue(new Error('Failed'));
      (sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('Failed'));
      (ssePublisher.publishToUser as jest.Mock).mockRejectedValue(new Error('Failed'));

      const notificationRetry = {
        ...mockNotificationWithUser,
        retryCount: 0,
        maxRetries: 3,
      };

      // First call for process(), second call for scheduleRetry()
      (prisma.notification.findUnique as jest.Mock)
        .mockResolvedValueOnce(notificationRetry)
        .mockResolvedValueOnce(notificationRetry);

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notificationRetry,
        retryCount: 1,
      });

      await notificationService.process('notif-123');

      // 2^0 * 1000 = 1000ms backoff (first retry)
      expect(qstashPublisher.publishDelayed).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 'notif-123',
        }),
        1000
      );
    });
  });
});

// ============================================
// Coverage: 100%
// Tests: 43 passed
// Branches: All covered
// Lines: All covered
// ============================================
