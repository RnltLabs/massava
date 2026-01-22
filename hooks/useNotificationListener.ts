/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Listener Hook
 *
 * Listens for foreground Firebase push notifications and updates the store.
 * Also refreshes unread count on page visibility change.
 *
 * Note: On native Capacitor platforms (iOS/Android), Firebase Web Messaging
 * is skipped since Capacitor's PushNotifications plugin handles push.
 *
 * @module hooks/useNotificationListener
 */

'use client';

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { onForegroundMessage } from '@/lib/firebase/firebase-client';
import { useNotificationStore, type Notification } from '@/stores/notification-store';

// ============================================
// Type Guards for Runtime Validation
// ============================================

/**
 * Valid notification priority levels
 */
const VALID_PRIORITIES = ['URGENT', 'HIGH', 'NORMAL', 'LOW'] as const;

/**
 * Type guard to validate notification priority at runtime
 *
 * @param value - Unknown value to validate
 * @returns True if value is a valid priority
 *
 * @example
 * ```typescript
 * const priority = isValidPriority(data.priority) ? data.priority : 'NORMAL';
 * ```
 */
export function isValidPriority(value: unknown): value is Notification['priority'] {
  return typeof value === 'string' && VALID_PRIORITIES.includes(value as Notification['priority']);
}

/**
 * Type guard to validate string values at runtime
 *
 * @param value - Unknown value to validate
 * @returns True if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to validate Record<string, unknown> at runtime
 *
 * @param value - Unknown value to validate
 * @returns True if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely parse JSON metadata from notification payload
 *
 * @param value - Unknown value that might be JSON string or object
 * @returns Parsed object or empty object on failure
 */
export function parseMetadata(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (isPlainObject(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid JSON, return empty object
    }
  }

  return {};
}

/**
 * Firebase message payload data structure
 */
interface FirebasePayloadData {
  title: string;
  body: string;
  data: Record<string, string>;
}

/**
 * Parse and validate notification payload from Firebase message
 *
 * Safely extracts and validates all fields from the Firebase payload,
 * providing sensible defaults for missing or invalid values.
 *
 * @param payload - Firebase message payload
 * @returns Validated Notification object
 */
export function parseNotificationPayload(payload: FirebasePayloadData): Notification {
  const data = payload.data || {};

  return {
    id: isNonEmptyString(data.notificationId)
      ? data.notificationId
      : crypto.randomUUID(),
    type: isNonEmptyString(data.type)
      ? data.type
      : 'PUSH_NOTIFICATION',
    title: isNonEmptyString(payload.title)
      ? payload.title
      : 'Neue Benachrichtigung',
    body: isNonEmptyString(payload.body)
      ? payload.body
      : '',
    priority: isValidPriority(data.priority)
      ? data.priority
      : 'NORMAL',
    status: 'DELIVERED',
    actionUrl: isNonEmptyString(data.actionUrl)
      ? data.actionUrl
      : undefined,
    metadata: parseMetadata(data.metadata || data),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Hook to listen for foreground push notifications
 *
 * Sets up a listener for Firebase Cloud Messaging foreground notifications
 * and updates the notification store when new notifications arrive.
 * Also refreshes the unread count when the page becomes visible.
 *
 * On native Capacitor platforms (iOS/Android), Firebase Web Messaging is
 * skipped since push notifications are handled by the Capacitor push service.
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

  // Set up foreground message listener (web only)
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Skip Firebase Web Messaging on native Capacitor platforms
    // Native platforms use Capacitor PushNotifications plugin instead
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // Set up foreground message listener (web browsers only)
    const unsubscribe = onForegroundMessage((payload) => {
      // Build notification object from payload with runtime type validation
      const notification = parseNotificationPayload(payload);

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
