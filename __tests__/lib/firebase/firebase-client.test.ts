/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Firebase Client Tests
 * Tests for foreground message handling with data-only messages
 */

// ============================================
// Mocks
// ============================================

const mockOnMessage = jest.fn();
const mockFirebaseMessaging = { instance: 'messaging' };

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => mockFirebaseMessaging),
  getToken: jest.fn(),
  onMessage: mockOnMessage,
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ instance: 'app' })),
  getApps: jest.fn(() => []),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Import mocked modules after mocks are defined
import { onMessage, getMessaging } from 'firebase/messaging';
import { onForegroundMessage } from '@/lib/firebase/firebase-client';

// ============================================
// Test Data
// ============================================

describe('Firebase Client - Foreground Message Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window object (needed for browser-only code)
    global.window = {} as Window & typeof globalThis;

    // Set up environment variables for client initialization
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-domain';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
  });

  afterEach(() => {
    // Clean up window mock
    delete (global as { window?: unknown }).window;
  });

  describe('onForegroundMessage() - Data-Only Messages', () => {
    it('should read title from data.title (new format)', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        // Simulate receiving a data-only message
        callback({
          data: {
            title: 'Data Title',
            body: 'Data Body',
            type: 'BOOKING_CONFIRMED',
            notificationId: 'notif-123',
          },
        });
        return mockUnsubscribe;
      });

      const unsubscribe = onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Data Title',
        body: 'Data Body',
        data: expect.objectContaining({
          title: 'Data Title',
          body: 'Data Body',
          type: 'BOOKING_CONFIRMED',
        }),
      });
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should read body from data.body (new format)', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            title: 'Test Title',
            body: 'Test Body from Data',
            type: 'BOOKING_CONFIRMED',
          },
        });
        return mockUnsubscribe;
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Test Body from Data',
        })
      );
    });

    it('should include all data fields in callback', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            title: 'Test',
            body: 'Test body',
            type: 'BOOKING_CONFIRMED',
            notificationId: 'notif-123',
            actionUrl: '/bookings/123',
            metadata: JSON.stringify({ bookingId: 'booking-123' }),
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Test',
        body: 'Test body',
        data: {
          title: 'Test',
          body: 'Test body',
          type: 'BOOKING_CONFIRMED',
          notificationId: 'notif-123',
          actionUrl: '/bookings/123',
          metadata: JSON.stringify({ bookingId: 'booking-123' }),
        },
      });
    });
  });

  describe('onForegroundMessage() - Backwards Compatibility', () => {
    it('should fallback to notification.title if data.title missing', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        // Legacy format: notification object without data.title/body
        callback({
          notification: {
            title: 'Legacy Title',
            body: 'Legacy Body',
          },
          data: {
            type: 'BOOKING_CONFIRMED',
            notificationId: 'notif-123',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Legacy Title',
        body: 'Legacy Body',
        data: expect.objectContaining({
          type: 'BOOKING_CONFIRMED',
        }),
      });
    });

    it('should fallback to notification.body if data.body missing', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          notification: {
            title: 'Notification Title',
            body: 'Notification Body',
          },
          data: {
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Notification Body',
        })
      );
    });

    it('should prefer data.title over notification.title', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          notification: {
            title: 'Old Title',
            body: 'Old Body',
          },
          data: {
            title: 'New Title',
            body: 'New Body',
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'New Title', // Should use data.title, not notification.title
        body: 'New Body', // Should use data.body, not notification.body
        data: expect.any(Object),
      });
    });

    it('should prefer data.body over notification.body', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          notification: {
            title: 'Old Title',
            body: 'Old Body',
          },
          data: {
            title: 'Data Title',
            body: 'Data Body',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Data Body',
        })
      );
    });

    it('should handle missing title gracefully', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            body: 'Body only',
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: '', // Now guaranteed to be string (empty if missing)
        body: 'Body only',
        data: expect.any(Object),
      });
    });

    it('should handle missing body gracefully', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            title: 'Title only',
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Title only',
        body: '', // Now guaranteed to be string (empty if missing)
        data: expect.any(Object),
      });
    });

    it('should skip completely empty payload and log warning', () => {
      const mockCallback = jest.fn();
      const { logger } = require('@/lib/logger');

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({});
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      // Callback should NOT be called for empty payload
      expect(mockCallback).not.toHaveBeenCalled();
      // Should log warning about missing content
      expect(logger.warn).toHaveBeenCalledWith(
        '[Firebase Client] Message has no title or body, skipping',
        expect.objectContaining({
          hasData: false,
          hasNotification: false,
        })
      );
    });

    it('should handle payload with only notification object', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          notification: {
            title: 'Only Notification',
            body: 'Only Notification Body',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Only Notification',
        body: 'Only Notification Body',
        data: {}, // Now guaranteed to be empty object (not undefined)
      });
    });
  });

  describe('onForegroundMessage() - Edge Cases', () => {
    it('should return null when messaging is not available', () => {
      // Delete window to simulate server-side or messaging unavailable
      delete (global as { window?: unknown }).window;

      const mockCallback = jest.fn();
      const result = onForegroundMessage(mockCallback);

      expect(result).toBeNull();
      expect(mockOnMessage).not.toHaveBeenCalled();
    });

    it('should skip null/undefined payload and log warning', () => {
      const mockCallback = jest.fn();
      const { logger } = require('@/lib/logger');

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback(null);
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      // Callback should NOT be called for null payload
      expect(mockCallback).not.toHaveBeenCalled();
      // Should log warning about empty payload
      expect(logger.warn).toHaveBeenCalledWith(
        '[Firebase Client] Received empty payload, skipping'
      );
    });

    it('should skip empty string values and log warning', () => {
      const mockCallback = jest.fn();
      const { logger } = require('@/lib/logger');

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            title: '',
            body: '',
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      // Empty strings are falsy, so both title and body are missing
      // Callback should NOT be called
      expect(mockCallback).not.toHaveBeenCalled();
      // Should log warning about missing content
      expect(logger.warn).toHaveBeenCalledWith(
        '[Firebase Client] Message has no title or body, skipping',
        expect.objectContaining({
          hasData: true,
          hasNotification: false,
        })
      );
    });

    it('should handle special characters in title and body', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            title: 'Title with "quotes" & <symbols>',
            body: "Body with 'apostrophes' & special chars: €£¥",
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Title with "quotes" & <symbols>',
        body: "Body with 'apostrophes' & special chars: €£¥",
        data: expect.any(Object),
      });
    });

    it('should handle very long title and body', () => {
      const mockCallback = jest.fn();
      const longTitle = 'A'.repeat(1000);
      const longBody = 'B'.repeat(5000);

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            title: longTitle,
            body: longBody,
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: longTitle,
        body: longBody,
        data: expect.any(Object),
      });
    });

    it('should handle unicode characters', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            title: '🎉 Booking Confirmed! 🎊',
            body: 'Your session at 스튜디오 is ready! 感謝します! 🙏',
            type: 'BOOKING_CONFIRMED',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: '🎉 Booking Confirmed! 🎊',
        body: 'Your session at 스튜디오 is ready! 感謝します! 🙏',
        data: expect.any(Object),
      });
    });

    it('should handle multiple rapid messages', () => {
      const mockCallback = jest.fn();
      let messageHandler: (payload: unknown) => void = () => {};

      mockOnMessage.mockImplementation((messaging, callback) => {
        messageHandler = callback;
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      // Send multiple messages rapidly
      messageHandler({ data: { title: 'Message 1', body: 'Body 1' } });
      messageHandler({ data: { title: 'Message 2', body: 'Body 2' } });
      messageHandler({ data: { title: 'Message 3', body: 'Body 3' } });

      expect(mockCallback).toHaveBeenCalledTimes(3);
      expect(mockCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ title: 'Message 1' }));
      expect(mockCallback).toHaveBeenNthCalledWith(2, expect.objectContaining({ title: 'Message 2' }));
      expect(mockCallback).toHaveBeenNthCalledWith(3, expect.objectContaining({ title: 'Message 3' }));
    });
  });

  describe('onForegroundMessage() - Data Payload Variations', () => {
    it('should handle data payload with only metadata', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          data: {
            metadata: JSON.stringify({ bookingId: 'booking-123', studioName: 'Studio ABC' }),
            type: 'BOOKING_CONFIRMED',
          },
          notification: {
            title: 'Fallback Title',
            body: 'Fallback Body',
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Fallback Title',
        body: 'Fallback Body',
        data: expect.objectContaining({
          metadata: expect.any(String),
          type: 'BOOKING_CONFIRMED',
        }),
      });
    });

    it('should preserve all data fields when both data and notification present', () => {
      const mockCallback = jest.fn();

      mockOnMessage.mockImplementation((messaging, callback) => {
        callback({
          notification: {
            title: 'Notification Title',
            body: 'Notification Body',
          },
          data: {
            title: 'Data Title',
            body: 'Data Body',
            type: 'BOOKING_CONFIRMED',
            notificationId: 'notif-123',
            actionUrl: '/bookings/123',
            priority: 'HIGH',
            metadata: JSON.stringify({ bookingId: 'booking-123' }),
          },
        });
        return jest.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Data Title',
        body: 'Data Body',
        data: {
          title: 'Data Title',
          body: 'Data Body',
          type: 'BOOKING_CONFIRMED',
          notificationId: 'notif-123',
          actionUrl: '/bookings/123',
          priority: 'HIGH',
          metadata: JSON.stringify({ bookingId: 'booking-123' }),
        },
      });
    });
  });
});
