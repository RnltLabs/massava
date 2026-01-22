/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * FCM Service Edge Cases Tests
 * Tests for branch coverage of critical edge cases
 */

import { pushService } from '@/lib/firebase/fcm-service';
import type { PushNotificationPayload } from '@/lib/firebase/fcm-service';
import { getMessaging, isFirebaseAdminAvailable } from '@/lib/firebase/firebase-admin';
import { prisma } from '@/lib/prisma';
import type { messaging } from 'firebase-admin';

// ============================================
// Mocks
// ============================================

jest.mock('@/lib/firebase/firebase-admin', () => ({
  getMessaging: jest.fn(),
  isFirebaseAdminAvailable: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    deviceToken: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

// ============================================
// Test Data
// ============================================

const mockPayload: PushNotificationPayload = {
  userId: 'user-123',
  id: 'notif-123',
  title: 'Test Notification',
  body: 'Test body',
  type: 'BOOKING_CONFIRMED',
  priority: 'HIGH',
  actionUrl: '/bookings/123',
  metadata: { bookingId: 'booking-123' },
};

const mockDevices = [
  { id: 'device-1', token: 'token-1', platform: 'IOS' },
  { id: 'device-2', token: 'token-2', platform: 'ANDROID' },
  { id: 'device-3', token: 'token-3', platform: 'WEB' },
];

const mockMessaging = {
  sendEachForMulticast: jest.fn(),
} as unknown as messaging.Messaging;

// ============================================
// Edge Case Tests
// ============================================

describe('FCMService - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isFirebaseAdminAvailable as jest.Mock).mockReturnValue(true);
    (getMessaging as jest.Mock).mockReturnValue(mockMessaging);
  });

  describe('sendToUser() - Invalid Token Cleanup', () => {
    it('should deactivate tokens with invalid-registration-token error', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 2,
        failureCount: 1,
        responses: [
          { success: true },
          { success: true },
          {
            success: false,
            error: {
              code: 'messaging/invalid-registration-token',
              message: 'Invalid token',
            },
          },
        ],
      });

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.invalidTokens).toEqual(['token-3']);

      // Should mark invalid token as inactive
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { token: { in: ['token-3'] } },
        data: {
          isActive: false,
          failureCount: { increment: 1 },
          lastFailureAt: expect.any(Date),
          lastFailureReason: 'Token no longer valid',
        },
      });
    });

    it('should deactivate tokens with registration-token-not-registered error', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 2,
        responses: [
          { success: true },
          {
            success: false,
            error: {
              code: 'messaging/registration-token-not-registered',
              message: 'Token not registered',
            },
          },
          {
            success: false,
            error: {
              code: 'messaging/registration-token-not-registered',
              message: 'Token not registered',
            },
          },
        ],
      });

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(2);
      expect(result.invalidTokens).toEqual(['token-2', 'token-3']);

      // Should mark both invalid tokens as inactive
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { token: { in: ['token-2', 'token-3'] } },
        data: {
          isActive: false,
          failureCount: { increment: 1 },
          lastFailureAt: expect.any(Date),
          lastFailureReason: 'Token no longer valid',
        },
      });
    });

    it('should not deactivate tokens with other error codes', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 2,
        failureCount: 1,
        responses: [
          { success: true },
          { success: true },
          {
            success: false,
            error: {
              code: 'messaging/server-unavailable',
              message: 'Server unavailable',
            },
          },
        ],
      });

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.invalidTokens).toEqual([]);

      // Should update lastUsedAt for successful tokens, but NOT deactivate any
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: {
          token: { in: ['token-1', 'token-2', 'token-3'] },
        },
        data: { lastUsedAt: expect.any(Date) },
      });
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledTimes(1); // Only for lastUsedAt
    });

    it('should handle mix of invalid tokens and temporary errors', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 2,
        responses: [
          { success: true },
          {
            success: false,
            error: {
              code: 'messaging/invalid-registration-token',
              message: 'Invalid token',
            },
          },
          {
            success: false,
            error: {
              code: 'messaging/server-unavailable',
              message: 'Server error',
            },
          },
        ],
      });

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(2);
      expect(result.invalidTokens).toEqual(['token-2']); // Only the invalid token

      // Should only deactivate the invalid token
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { token: { in: ['token-2'] } },
        data: expect.any(Object),
      });
    });

    it('should not crash when no invalid tokens found', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 3,
        failureCount: 0,
        responses: [{ success: true }, { success: true }, { success: true }],
      });

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.invalidTokens).toEqual([]);

      // Should only update lastUsedAt, not deactivate any tokens
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: {
          token: { in: ['token-1', 'token-2', 'token-3'] },
        },
        data: { lastUsedAt: expect.any(Date) },
      });
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledTimes(1); // Only for lastUsedAt
    });
  });

  describe('sendToUser() - Batch Send Failures', () => {
    it('should handle complete send failure', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockRejectedValue(
        new Error('FCM service unavailable')
      );

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(3); // All tokens failed
      expect(result.invalidTokens).toEqual([]);
    });

    it('should handle partial failure with exception', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(mockDevices.length);
    });

    it('should return zero results when user has no devices', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([]);

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.invalidTokens).toEqual([]);
      expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
    });

    it('should handle Firebase Admin not available', async () => {
      (isFirebaseAdminAvailable as jest.Mock).mockReturnValue(false);
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.invalidTokens).toEqual([]);
      expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
    });

    it('should handle getMessaging returning null', async () => {
      (isFirebaseAdminAvailable as jest.Mock).mockReturnValue(true);
      (getMessaging as jest.Mock).mockReturnValue(null);
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const result = await pushService.sendToUser(mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(mockDevices.length);
      expect(result.invalidTokens).toEqual([]);
    });
  });

  describe('sendToUser() - Platform-Specific Message Building', () => {
    it('should build correct message for URGENT priority', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const urgentPayload: PushNotificationPayload = {
        ...mockPayload,
        priority: 'URGENT',
      };

      await pushService.sendToUser(urgentPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            priority: 'high',
            notification: expect.objectContaining({
              channelId: 'urgent_notifications',
              priority: 'high',
            }),
          }),
          apns: expect.objectContaining({
            headers: { 'apns-priority': '10' },
          }),
        })
      );
    });

    it('should build correct message for HIGH priority', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const highPayload: PushNotificationPayload = {
        ...mockPayload,
        priority: 'HIGH',
      };

      await pushService.sendToUser(highPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            priority: 'high',
            notification: expect.objectContaining({
              channelId: 'high_priority_notifications',
              priority: 'high',
            }),
          }),
          apns: expect.objectContaining({
            headers: { 'apns-priority': '10' },
          }),
        })
      );
    });

    it('should build correct message for NORMAL priority', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const normalPayload: PushNotificationPayload = {
        ...mockPayload,
        priority: 'NORMAL',
      };

      await pushService.sendToUser(normalPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            priority: 'normal',
            notification: expect.objectContaining({
              channelId: 'default_notifications',
              priority: 'default',
            }),
          }),
          apns: expect.objectContaining({
            headers: { 'apns-priority': '5' },
          }),
        })
      );
    });

    it('should build correct message for LOW priority', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const lowPayload: PushNotificationPayload = {
        ...mockPayload,
        priority: 'LOW',
      };

      await pushService.sendToUser(lowPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            priority: 'normal',
            notification: expect.objectContaining({
              channelId: 'default_notifications',
            }),
          }),
          apns: expect.objectContaining({
            headers: { 'apns-priority': '5' },
          }),
        })
      );
    });

    it('should include actionUrl in data when provided', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionUrl: '/bookings/123',
          }),
        })
      );
    });

    it('should omit actionUrl from data when not provided', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const payloadWithoutActionUrl: PushNotificationPayload = {
        ...mockPayload,
        actionUrl: undefined,
      };

      await pushService.sendToUser(payloadWithoutActionUrl);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            actionUrl: expect.anything(),
          }),
        })
      );
    });

    it('should include metadata in data when provided', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: JSON.stringify({ bookingId: 'booking-123' }),
          }),
        })
      );
    });

    it('should omit metadata from data when not provided', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const payloadWithoutMetadata: PushNotificationPayload = {
        ...mockPayload,
        metadata: undefined,
      };

      await pushService.sendToUser(payloadWithoutMetadata);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            metadata: expect.anything(),
          }),
        })
      );
    });

    it('should set correct webpush link', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[2]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          webpush: expect.objectContaining({
            fcmOptions: {
              link: '/bookings/123',
            },
          }),
        })
      );
    });

    it('should use default link when actionUrl not provided', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[2]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const payloadWithoutActionUrl: PushNotificationPayload = {
        ...mockPayload,
        actionUrl: undefined,
      };

      await pushService.sendToUser(payloadWithoutActionUrl);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          webpush: expect.objectContaining({
            fcmOptions: {
              link: '/',
            },
          }),
        })
      );
    });
  });

  describe('sendToTokens() - Direct Token Sending', () => {
    it('should send to specific tokens successfully', async () => {
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [{ success: true }, { success: true }],
      });

      const tokens = ['token-1', 'token-2'];
      const result = await pushService.sendToTokens(tokens, {
        id: 'notif-123',
        title: 'Test',
        body: 'Test body',
        type: 'BOOKING_CONFIRMED',
        priority: 'HIGH',
      });

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['token-1', 'token-2'],
        })
      );
    });

    it('should return zero when Firebase Admin not available', async () => {
      (isFirebaseAdminAvailable as jest.Mock).mockReturnValue(false);

      const result = await pushService.sendToTokens(['token-1'], {
        id: 'notif-123',
        title: 'Test',
        body: 'Test body',
        type: 'BOOKING_CONFIRMED',
        priority: 'HIGH',
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
    });
  });

  describe('Device Token Updates', () => {
    it('should update lastUsedAt for successfully sent tokens', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 3,
        failureCount: 0,
        responses: [{ success: true }, { success: true }, { success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: {
          token: { in: ['token-1', 'token-2', 'token-3'] },
        },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should exclude invalid tokens from lastUsedAt update', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue(mockDevices);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 2,
        failureCount: 1,
        responses: [
          { success: true },
          { success: true },
          {
            success: false,
            error: {
              code: 'messaging/invalid-registration-token',
              message: 'Invalid token',
            },
          },
        ],
      });

      await pushService.sendToUser(mockPayload);

      // Should only update successful tokens
      expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            token: { in: ['token-1', 'token-2'] }, // Excludes token-3
          },
        })
      );
    });
  });

  describe('buildMessage() - Data-Only Message Structure', () => {
    it('should NOT include top-level notification object', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      const sentMessage = (mockMessaging.sendEachForMulticast as jest.Mock).mock.calls[0][0];
      expect(sentMessage).not.toHaveProperty('notification');
    });

    it('should include title in data object', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test Notification',
          }),
        })
      );
    });

    it('should include body in data object', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            body: 'Test body',
          }),
        })
      );
    });

    it('should include notificationId in data object', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notificationId: 'notif-123',
            type: 'BOOKING_CONFIRMED',
            priority: 'HIGH',
          }),
        })
      );
    });

    it('should NOT include notification object in webpush config', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[2]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      const sentMessage = (mockMessaging.sendEachForMulticast as jest.Mock).mock.calls[0][0];
      expect(sentMessage.webpush).not.toHaveProperty('notification');
      expect(sentMessage.webpush).toHaveProperty('fcmOptions');
      expect(sentMessage.webpush.fcmOptions).toHaveProperty('link');
    });

    it('should include notification object in android config (native platform)', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[1]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            notification: expect.objectContaining({
              channelId: expect.any(String),
              priority: expect.any(String),
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            }),
          }),
        })
      );
    });

    it('should include alert in apns.payload.aps (native platform)', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          apns: expect.objectContaining({
            payload: expect.objectContaining({
              aps: expect.objectContaining({
                alert: {
                  title: 'Test Notification',
                  body: 'Test body',
                },
                sound: 'default',
                badge: 1,
                'mutable-content': 1,
              }),
            }),
          }),
        })
      );
    });

    it('should stringify metadata in data object', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      const payloadWithComplexMetadata: PushNotificationPayload = {
        ...mockPayload,
        metadata: {
          bookingId: 'booking-123',
          studioName: 'Studio ABC',
          nested: { value: 42 },
        },
      };

      await pushService.sendToUser(payloadWithComplexMetadata);

      const sentMessage = (mockMessaging.sendEachForMulticast as jest.Mock).mock.calls[0][0];
      expect(sentMessage.data.metadata).toBe(
        JSON.stringify({
          bookingId: 'booking-123',
          studioName: 'Studio ABC',
          nested: { value: 42 },
        })
      );
    });

    it('should build complete data-only message structure', async () => {
      (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([mockDevices[0]]);
      (mockMessaging.sendEachForMulticast as jest.Mock).mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true }],
      });

      await pushService.sendToUser(mockPayload);

      const sentMessage = (mockMessaging.sendEachForMulticast as jest.Mock).mock.calls[0][0];

      // Verify complete structure
      expect(sentMessage).toMatchObject({
        data: {
          notificationId: 'notif-123',
          type: 'BOOKING_CONFIRMED',
          priority: 'HIGH',
          title: 'Test Notification',
          body: 'Test body',
          actionUrl: '/bookings/123',
          metadata: JSON.stringify({ bookingId: 'booking-123' }),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'high_priority_notifications',
            priority: 'high',
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: {
                title: 'Test Notification',
                body: 'Test body',
              },
              sound: 'default',
              badge: 1,
              'mutable-content': 1,
            },
          },
        },
        webpush: {
          fcmOptions: {
            link: '/bookings/123',
          },
        },
        tokens: ['token-1'],
      });

      // Explicitly verify no top-level notification
      expect(sentMessage.notification).toBeUndefined();
      // Explicitly verify no webpush notification
      expect(sentMessage.webpush.notification).toBeUndefined();
    });
  });
});
