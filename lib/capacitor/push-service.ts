/**
 * Capacitor Push Notification Service
 *
 * Manages native push notifications on iOS and Android via Capacitor framework.
 * Handles permission requests, token registration, foreground notifications, and user interactions.
 *
 * On web, registration is skipped silently. Use firebase-client for web push instead.
 *
 * @module lib/capacitor/push-service
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Badge } from '@capawesome/capacitor-badge';
import { logger } from '@/lib/logger';

/**
 * Device platform type
 *
 * @typedef {'IOS' | 'ANDROID' | 'WEB'} DevicePlatform
 */
export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

/**
 * Callback configuration for push notification events
 *
 * @interface PushServiceConfig
 * @property {(token: string) => void} [onTokenReceived] - Called when device token is obtained
 * @property {(notification: PushNotificationSchema) => void} [onNotificationReceived] - Called when push received in foreground
 * @property {(action: ActionPerformed) => void} [onNotificationAction] - Called when user taps notification
 * @property {(error: Error) => void} [onError] - Called on registration errors
 */
interface PushServiceConfig {
  onTokenReceived?: (token: string) => void;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationAction?: (action: ActionPerformed) => void;
  onError?: (error: Error) => void;
}

/**
 * Capacitor push notification service for native iOS/Android apps
 *
 * Manages the complete native push notification lifecycle:
 * - Requests user permission for notifications
 * - Registers device with APNS (iOS) or FCM (Android)
 * - Stores registration token on backend
 * - Handles foreground notifications with haptic feedback
 * - Triggers haptic feedback based on notification priority
 * - Updates app badge count
 * - Handles notification taps and navigation
 *
 * @class CapacitorPushService
 */
class CapacitorPushService {
  private isInitialized = false;
  private config: PushServiceConfig = {};

  /**
   * Initialize the push notification service
   *
   * Sets up all listeners and handlers for Capacitor push notifications.
   * On non-native platforms (web), returns false silently.
   *
   * Steps:
   * 1. Requests notification permission from user
   * 2. Registers device with APNS/FCM
   * 3. Sets up listeners for token reception
   * 4. Sets up listeners for incoming notifications (foreground)
   * 5. Sets up listeners for notification taps
   * 6. Sets up error handling
   *
   * @param {PushServiceConfig} [config={}] - Event callback handlers
   *
   * @returns {Promise<boolean>} True if initialized successfully, false if web platform or permission denied
   *
   * @example
   * ```typescript
   * const success = await capacitorPushService.initialize({
   *   onTokenReceived: (token) => console.log('Token:', token),
   *   onNotificationReceived: (notif) => console.log('Received:', notif),
   *   onNotificationAction: (action) => {
   *     console.log('User tapped notification');
   *     navigateTo(action.notification.data.actionUrl);
   *   },
   *   onError: (error) => console.error('Push error:', error),
   * });
   * ```
   */
  async initialize(config: PushServiceConfig = {}): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || this.isInitialized) {
      return false;
    }

    this.config = config;

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== 'granted') {
        logger.info('Push permission denied');
        return false;
      }

      // Register with APNS/FCM
      await PushNotifications.register();

      // Listen for registration
      await PushNotifications.addListener('registration', async (token: Token) => {
        logger.info('Push registration success:', { token: token.value });
        await this.registerToken(token.value);
        this.config.onTokenReceived?.(token.value);
      });

      // Listen for errors
      await PushNotifications.addListener('registrationError', (err) => {
        logger.error('Push registration error:', { error: err.error });
        this.config.onError?.(new Error(err.error));
      });

      // Listen for incoming notifications (foreground)
      await PushNotifications.addListener(
        'pushNotificationReceived',
        async (notification: PushNotificationSchema) => {
          logger.info('Push received:', { notification });

          // Haptic feedback based on priority
          const priority = notification.data?.['priority'] as string | undefined;
          await this.triggerHaptic(priority);

          // Update badge
          await this.updateBadge();

          this.config.onNotificationReceived?.(notification);
        }
      );

      // Listen for notification taps
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          logger.info('Push action received');
          this.handleNotificationAction(action);
          this.config.onNotificationAction?.(action);
        }
      );

      this.isInitialized = true;
      return true;
    } catch (error) {
      logger.error('Push service initialization failed:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Register device token with backend server
   *
   * Sends the device's push token to the backend API so notifications can be routed to this device.
   * Called automatically when APNS/FCM registration succeeds.
   *
   * @param {string} token - Push notification token from APNS/FCM
   *
   * @returns {Promise<void>}
   *
   * @throws {Error} If registration API call fails
   *
   * @private
   */
  private async registerToken(token: string): Promise<void> {
    try {
      const platform = this.getPlatform();
      const deviceName = await this.getDeviceName();

      const response = await fetch('/api/notifications/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform,
          deviceName,
          appVersion: '1.0.0',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register token: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Failed to register token:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Detect current platform (iOS, Android, or web)
   *
   * @returns {DevicePlatform} The current platform
   * @private
   */
  private getPlatform(): DevicePlatform {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') return 'IOS';
    if (platform === 'android') return 'ANDROID';
    return 'WEB';
  }

  /**
   * Trigger haptic feedback based on notification priority
   *
   * Provides tactile feedback to users when notifications arrive in foreground:
   * - URGENT: Double heavy impact (high attention)
   * - HIGH: Single medium impact
   * - NORMAL/LOW: Single light impact
   *
   * On non-native platforms, does nothing silently.
   *
   * @param {string} [priority] - Notification priority level
   *
   * @returns {Promise<void>}
   *
   * @private
   */
  private async triggerHaptic(priority?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      switch (priority) {
        case 'URGENT':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          await new Promise((r) => setTimeout(r, 100));
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'HIGH':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      logger.error('Haptic feedback failed:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Update app badge count to show unread notification count
   *
   * Fetches current unread count from backend and updates the native app badge.
   * On non-native platforms, does nothing silently.
   *
   * @returns {Promise<void>}
   */
  async updateBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        await Badge.set({ count: data.count });
      }
    } catch (error) {
      logger.error('Failed to update badge:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Clear app badge count (set to 0)
   *
   * On non-native platforms, does nothing silently.
   *
   * @returns {Promise<void>}
   */
  async clearBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Badge.clear();
    } catch (error) {
      logger.error('Failed to clear badge:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Set app badge count to specific number
   *
   * @param {number} count - Badge count to display
   *
   * @returns {Promise<void>}
   */
  async setBadge(count: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Badge.set({ count });
    } catch (error) {
      logger.error('Failed to set badge:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Handle notification tap/action
   *
   * Navigates to the action URL if provided in notification data.
   * Called when user taps a notification.
   *
   * @param {ActionPerformed} action - The action that was performed
   *
   * @private
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data;

    if (data?.['actionUrl']) {
      // Navigate to action URL
      window.location.href = data['actionUrl'] as string;
    }
  }

  /**
   * Get device name/identifier
   *
   * Returns a user-friendly name for the device. Can be enhanced with
   * the @capacitor/device plugin for more detailed info.
   *
   * @returns {Promise<string>} Device name
   *
   * @private
   */
  private async getDeviceName(): Promise<string> {
    // Basic device info - can be enhanced with Device plugin
    const platform = Capacitor.getPlatform();
    return `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device`;
  }

  /**
   * Unregister and cleanup push notification service
   *
   * Removes all listeners and resets initialization state.
   * Call when user logs out or uninstalls the app.
   *
   * @returns {Promise<void>}
   */
  async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await PushNotifications.removeAllListeners();
      this.isInitialized = false;
    } catch (error) {
      logger.error('Failed to unregister push service:', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Check if running on native platform (iOS/Android)
   *
   * @returns {boolean} True if native app, false if web
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check if push service is initialized
   *
   * @returns {boolean} True if initialization completed successfully
   */
  getInitialized(): boolean {
    return this.isInitialized;
  }
}

export const capacitorPushService = new CapacitorPushService();
