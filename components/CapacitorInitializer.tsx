'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { capacitorPushService } from '@/lib/capacitor/push-service';

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
     * Initialize push notifications only if not already initialized
     * The usePushRegistration hook may have already initialized push
     */
    const initializePushIfNeeded = async (): Promise<void> => {
      // Check if push service is already initialized (by usePushRegistration hook)
      if (capacitorPushService.getInitialized()) {
        console.log('[CapacitorInitializer] Push already initialized by hook');
        return;
      }

      // Check if permission was already granted
      const status = await capacitorPushService.getPermissionStatus();
      if (status !== 'granted') {
        // Don't auto-initialize if permission not granted
        // The usePushRegistration hook will handle permission request
        console.log('[CapacitorInitializer] Push permission not granted, skipping auto-init');
        return;
      }

      // Permission granted but not initialized - initialize now
      console.log('[CapacitorInitializer] Auto-initializing push service');
      await capacitorPushService.initialize({
        onNotificationReceived: (notification) => {
          void capacitorPushService.updateBadge();
          console.log('[CapacitorInitializer] Notification received:', notification);
        },
        onNotificationAction: (action) => {
          const actionUrl = action.notification.data?.['actionUrl'] as string | undefined;
          if (actionUrl) {
            window.location.href = actionUrl;
          }
        },
        onError: (error) => {
          console.error('[CapacitorInitializer] Push notification error:', error);
        },
      });
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
      console.log('[CapacitorInitializer] Deep link received:', url);
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;

        if (pathname && pathname !== '/') {
          window.location.href = pathname;
        }
      } catch (error) {
        console.error('[CapacitorInitializer] Failed to parse deep link:', error);
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
