/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Listener Hook
 *
 * Listens for foreground Firebase push notifications and updates the store.
 * Also refreshes unread count on page visibility change.
 *
 * @module hooks/useNotificationListener
 */

'use client';

import { useEffect, useRef } from 'react';
import { onForegroundMessage } from '@/lib/firebase/firebase-client';
import { useNotificationStore, type Notification } from '@/stores/notification-store';

/**
 * Hook to listen for foreground push notifications
 *
 * Sets up a listener for Firebase Cloud Messaging foreground notifications
 * and updates the notification store when new notifications arrive.
 * Also refreshes the unread count when the page becomes visible.
 *
 * @example
 * ```tsx
 * function NotificationProvider({ children }) {
 *   useNotificationListener();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useNotificationListener(): void {
  const { addNotification, fetchUnreadCount } = useNotificationStore();
  const listenerRef = useRef<(() => void) | null>(null);

  // Set up foreground message listener
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Set up foreground message listener
    const unsubscribe = onForegroundMessage((payload) => {
      // Build notification object from payload
      const notification: Notification = {
        id: payload.data?.notificationId || crypto.randomUUID(),
        type: payload.data?.type || 'PUSH_NOTIFICATION',
        title: payload.title || 'Neue Benachrichtigung',
        body: payload.body || '',
        priority: (payload.data?.priority as Notification['priority']) || 'NORMAL',
        status: 'DELIVERED',
        actionUrl: payload.data?.actionUrl,
        metadata: payload.data as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };

      // Add to store (this will also trigger banner for HIGH/URGENT)
      addNotification(notification);
    });

    listenerRef.current = unsubscribe;

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, [addNotification]);

  // Refresh unread count on page visibility change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh unread count when user returns to the tab
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial fetch on mount
    fetchUnreadCount();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount]);
}

export default useNotificationListener;
