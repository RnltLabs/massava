'use client';

import { useEffect, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { capacitorPushService } from '@/lib/capacitor/push-service';
import { useNotificationStore } from '@/stores/notification-store';

interface CapacitorInitializerProps {
  children: ReactNode;
}

export function CapacitorInitializer({ children }: CapacitorInitializerProps): ReactNode {
  const { setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Initialize push notifications
    capacitorPushService.initialize({
      onNotificationReceived: (notification) => {
        // Update unread count when notification is received
        void capacitorPushService.updateBadge();
        // You can also trigger a refresh of notifications here
        console.log('Notification received in app:', notification);
      },
      onNotificationAction: (action) => {
        // Handle notification tap
        const actionUrl = action.notification.data?.['actionUrl'] as string | undefined;
        if (actionUrl) {
          window.location.href = actionUrl;
        }
      },
      onError: (error) => {
        console.error('Push notification error:', error);
      },
    });

    // Handle app state changes
    const stateChangeListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground - refresh badge and notifications
        void capacitorPushService.updateBadge();
      }
    });

    // Handle deep links
    const urlOpenListener = App.addListener('appUrlOpen', ({ url }) => {
      console.log('Deep link received:', url);
      // Handle URL routing - parse URL and navigate accordingly
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;

        // Navigate to the path
        if (pathname && pathname !== '/') {
          window.location.href = pathname;
        }
      } catch (error) {
        console.error('Failed to parse deep link:', error);
      }
    });

    // Handle back button (Android)
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Optionally minimize app or exit
        void App.minimizeApp();
      }
    });

    return () => {
      void stateChangeListener.then((listener) => listener.remove());
      void urlOpenListener.then((listener) => listener.remove());
      void backButtonListener.then((listener) => listener.remove());
    };
  }, [setUnreadCount]);

  return <>{children}</>;
}
