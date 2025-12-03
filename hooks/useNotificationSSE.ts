/**
 * Server-Sent Events Hook for Real-time Notifications
 *
 * Establishes and maintains a persistent connection to the backend notification stream.
 * Handles connection management, automatic reconnection, and real-time notification delivery.
 *
 * @module hooks/useNotificationSSE
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { useSession } from 'next-auth/react';

// Client-side logger wrapper (console is acceptable in client components)
const clientLogger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[SSE] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[SSE] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[SSE] ${message}`, ...args);
  },
};

/**
 * Hook to establish real-time notification connection via Server-Sent Events
 *
 * Opens an EventSource connection to `/api/notifications/stream` and listens for
 * real-time updates. Automatically reconnects if connection drops, and cleans up
 * on unmount or when user logs out.
 *
 * Event types handled:
 * - 'notification': New notification to add to store
 * - 'badge_update': Update unread count for badge display
 * - 'connected': Connection established (logging only)
 *
 * Features:
 * - Auto-reconnects with 5s delay on connection error
 * - Respects visibility changes (tabs going to/from background)
 * - Cleans up listeners on unmount
 * - Only connects when authenticated
 * - Graceful error handling with logging
 *
 * @returns {void}
 *
 * @example
 * // In app root or layout component
 * // import { useNotificationSSE } from '@/hooks/useNotificationSSE';
 * //
 * // export function App() {
 * //   useNotificationSSE();
 * //   return <div>App content</div>;
 * // }
 *
 * @remarks
 * - Requires user to be authenticated (checks session status)
 * - Connection is maintained across page navigation (uses EventSource)
 * - Automatic reconnect happens after 5 second delay on error
 * - Visibility API integration reconnects when tab becomes visible
 * - All errors are logged but not thrown (fail-open design)
 *
 * @see {@link usePushRegistration} - Browser push notifications
 * @see {@link useNotificationStore} - State management for notifications
 */
export function useNotificationSSE() {
  const { data: session, status } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addNotification, setUnreadCount } = useNotificationStore();

  const connect = useCallback(() => {
    // Don't connect if not authenticated or already connected
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        clientLogger.info('Connected');
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'notification':
              addNotification(data.data);
              break;
            case 'badge_update':
              setUnreadCount(data.data.count);
              break;
            case 'connected':
              clientLogger.info('Stream ready');
              break;
            default:
              clientLogger.warn('Unknown message type:', data.type);
          }
        } catch (error) {
          clientLogger.error('Message parse error:', error);
        }
      };

      eventSource.onerror = (error) => {
        clientLogger.error('Connection error:', error);
        eventSource.close();
        eventSourceRef.current = null;

        // Reconnect after delay (exponential backoff could be added)
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 5000);
        }
      };
    } catch (error) {
      clientLogger.error('Failed to connect:', error);
    }
  }, [session?.user, status, addNotification, setUnreadCount]);

  // Connect when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [status, connect]);

  // Reconnect on visibility change (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated') {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, connect]);
}
