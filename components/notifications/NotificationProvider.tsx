/**
 * Notification Provider Component
 *
 * Wraps the app to provide notification functionality.
 * Handles initial data fetch, SSE connection, and banner display.
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNotificationStore } from '@/stores/notification-store';
import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import { NotificationBanner } from './NotificationBanner';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session, status } = useSession();
  const {
    fetchNotifications,
    fetchUnreadCount,
    currentBanner,
  } = useNotificationStore();

  // Connect to SSE for real-time updates
  useNotificationSSE();

  // Initial fetch when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [status, session?.user, fetchNotifications, fetchUnreadCount]);

  // Refetch on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        fetchUnreadCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, fetchUnreadCount]);

  return (
    <>
      {children}
      {currentBanner && <NotificationBanner notification={currentBanner} />}
    </>
  );
}
