import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Badge } from '@capawesome/capacitor-badge';
import { logger } from '@/lib/logger';

export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

interface PushServiceConfig {
  onTokenReceived?: (token: string) => void;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationAction?: (action: ActionPerformed) => void;
  onError?: (error: Error) => void;
}

class CapacitorPushService {
  private isInitialized = false;
  private config: PushServiceConfig = {};

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

  private getPlatform(): DevicePlatform {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') return 'IOS';
    if (platform === 'android') return 'ANDROID';
    return 'WEB';
  }

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

  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data;

    if (data?.['actionUrl']) {
      // Navigate to action URL
      window.location.href = data['actionUrl'] as string;
    }
  }

  private async getDeviceName(): Promise<string> {
    // Basic device info - can be enhanced with Device plugin
    const platform = Capacitor.getPlatform();
    return `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device`;
  }

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

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getInitialized(): boolean {
    return this.isInitialized;
  }
}

export const capacitorPushService = new CapacitorPushService();
