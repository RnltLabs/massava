/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Provider Component
 *
 * Provides real-time notification updates via multiple channels:
 * - Firebase Cloud Messaging (push notifications, desktop/Android)
 * - Server-Sent Events (real-time updates, works on all platforms including iOS PWA)
 *
 * @module components/providers/NotificationProvider
 */

'use client';

import { useNotificationListener } from '@/hooks/useNotificationListener';
import { useNotificationSSE } from '@/hooks/useNotificationSSE';

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that enables real-time notification updates
 *
 * Wrap your app (or authenticated sections) with this provider to enable:
 * - Foreground push notification handling
 * - Automatic unread count refresh on tab focus
 * - Banner display for high-priority notifications
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * export default function Layout({ children }) {
 *   return (
 *     <NotificationProvider>
 *       {children}
 *     </NotificationProvider>
 *   );
 * }
 * ```
 */
export function NotificationProvider({ children }: NotificationProviderProps): React.JSX.Element {
  // Firebase push notifications (desktop, Android)
  useNotificationListener();

  // SSE for real-time updates (works on all platforms, including iOS PWA)
  useNotificationSSE();

  return <>{children}</>;
}

export default NotificationProvider;
