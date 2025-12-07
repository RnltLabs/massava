'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { capacitorPushService } from '@/lib/capacitor/push-service';
import { logger } from '@/lib/logger';
import { isInternalUrl } from '@/lib/utils/url-validation';

interface CapacitorInitializerProps {
  children: ReactNode;
}

/**
 * Capacitor Platform Initializer
 *
 * Initializes Capacitor-specific functionality for native iOS/Android apps:
 * - Push notification service setup (if not already initialized by usePushRegistration)
 * - App state change handling (foreground/background)
 * - Deep link handling
 * - Android back button handling
 *
 * Note: Push notifications are now primarily managed by the usePushRegistration hook.
 * This component only initializes push if the hook hasn't done so already.
 *
 * @param {CapacitorInitializerProps} props - Component props
 * @returns {ReactNode} Children wrapped with Capacitor initialization
 */
export function CapacitorInitializer({ children }: CapacitorInitializerProps): ReactNode {
  const initializationAttemptedRef = useRef(false);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) return;

    // Prevent duplicate initialization attempts
    if (initializationAttemptedRef.current) return;
    initializationAttemptedRef.current = true;

    /**
     * Initialize push notifications if permission is granted
     *
     * The push service uses an initialization lock pattern internally,
     * so calling initialize() is safe even if called concurrently from
     * multiple places (e.g., usePushRegistration hook and this component).
     *
     * This method checks permission first to avoid prompting the user
     * before they explicitly request push notifications.
     */
    const initializePushIfNeeded = async (): Promise<void> => {
      // Check if permission was already granted before attempting initialization
      // This avoids triggering permission prompts from this component
      const status = await capacitorPushService.getPermissionStatus();
      if (status !== 'granted') {
        // Don't auto-initialize if permission not granted
        // The usePushRegistration hook will handle permission request
        logger.debug('[CapacitorInitializer] Push permission not granted, skipping auto-init');
        return;
      }

      // Permission granted - initialize push service
      // The service handles deduplication internally via initialization lock pattern
      logger.info('[CapacitorInitializer] Auto-initializing push service');
      const initialized = await capacitorPushService.initialize({
        onNotificationReceived: () => {
          void capacitorPushService.updateBadge();
          logger.info('[CapacitorInitializer] Notification received');
        },
        onNotificationAction: (action) => {
          const actionUrl = action.notification.data?.['actionUrl'] as string | undefined;
          if (actionUrl && isInternalUrl(actionUrl)) {
            window.location.href = actionUrl;
          } else if (actionUrl) {
            logger.warn('[CapacitorInitializer] Blocked navigation to external URL', {
              url: actionUrl,
            });
          }
        },
        onError: (error) => {
          logger.error('[CapacitorInitializer] Push notification error', { error });
        },
      });

      if (initialized) {
        logger.debug('[CapacitorInitializer] Push service initialized successfully');
      } else {
        logger.debug('[CapacitorInitializer] Push service already initialized or initialization skipped');
      }
    };

    // Initialize push if needed
    void initializePushIfNeeded();

    // Handle app state changes (foreground/background)
    const stateChangeListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground - refresh badge
        void capacitorPushService.updateBadge();
      }
    });

    // Handle deep links
    const urlOpenListener = App.addListener('appUrlOpen', ({ url }) => {
      logger.info('[CapacitorInitializer] Deep link received');
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;

        if (pathname && pathname !== '/' && isInternalUrl(pathname)) {
          window.location.href = pathname;
        }
      } catch (error) {
        logger.error('[CapacitorInitializer] Failed to parse deep link', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });

    // Handle Android back button
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        void App.minimizeApp();
      }
    });

    // Cleanup listeners on unmount
    return () => {
      void stateChangeListener.then((listener) => listener.remove());
      void urlOpenListener.then((listener) => listener.remove());
      void backButtonListener.then((listener) => listener.remove());
    };
  }, []);

  return <>{children}</>;
}
