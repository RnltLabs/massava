/**
 * Notification Store
 *
 * Zustand store for managing client-side notification state.
 * Handles notifications list, unread count, banner queue, and UI state.
 * Persists unread count to localStorage for faster loads.
 *
 * @module stores/notification-store
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

/**
 * Notification data for display in UI
 *
 * @interface Notification
 * @property {string} id - Unique notification ID
 * @property {string} type - Notification type identifier
 * @property {string} title - Display title in user's language
 * @property {string} body - Display body text in user's language
 * @property {'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'} priority - Notification priority
 * @property {string} status - Current status (DELIVERED, READ, etc.)
 * @property {string} [actionUrl] - URL to navigate to on click
 * @property {Record<string, unknown>} [metadata] - Additional data for rendering
 * @property {string} createdAt - ISO 8601 creation timestamp
 * @property {string | null} [inAppSeenAt] - When user viewed in notification center
 */
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  inAppSeenAt?: string | null;
}

/**
 * Complete notification store state
 *
 * Manages all notification-related client state including data, UI state,
 * and actions for reading, deleting, and displaying notifications.
 *
 * @interface NotificationState
 */
interface NotificationState {
  // ============================================
  // Data
  // ============================================

  /** List of fetched notifications */
  notifications: Notification[];

  /** Count of unread notifications (persisted to localStorage) */
  unreadCount: number;

  /** Whether notifications are currently being fetched */
  isLoading: boolean;

  /** Error message if fetch failed */
  error: string | null;

  // ============================================
  // Banner Queue (for showing high-priority notifications)
  // ============================================

  /** Queue of notifications waiting to be displayed as banners */
  bannerQueue: Notification[];

  /** Currently displayed banner notification (or null if none) */
  currentBanner: Notification | null;

  // ============================================
  // UI State
  // ============================================

  /** Whether notification center modal/panel is open */
  isNotificationCenterOpen: boolean;

  // ============================================
  // Synchronous Actions
  // ============================================

  /**
   * Replace all notifications with new list
   *
   * @param {Notification[]} notifications - New notifications list
   */
  setNotifications: (notifications: Notification[]) => void;

  /**
   * Add new notification to list and possibly show banner
   *
   * HIGH/URGENT priority notifications trigger banner display.
   *
   * @param {Notification} notification - Notification to add
   */
  addNotification: (notification: Notification) => void;

  /**
   * Mark single notification as read with optimistic update
   *
   * Makes API call to persist change, reverts on error.
   *
   * @param {string} id - Notification ID to mark as read
   */
  markAsRead: (id: string) => void;

  /**
   * Mark all notifications as read with optimistic update
   *
   * Makes API call to persist change, reverts on error.
   */
  markAllAsRead: () => void;

  /**
   * Remove notification from list
   *
   * @param {string} id - Notification ID to remove
   */
  removeNotification: (id: string) => void;

  // ============================================
  // Banner Actions
  // ============================================

  /**
   * Show notification as banner (or queue if one already showing)
   *
   * @param {Notification} notification - Notification to show
   */
  showBanner: (notification: Notification) => void;

  /**
   * Dismiss current banner and show next from queue
   */
  dismissBanner: () => void;

  // ============================================
  // UI Actions
  // ============================================

  /**
   * Toggle notification center visibility
   *
   * @param {boolean} open - Whether to open or close
   */
  setNotificationCenterOpen: (open: boolean) => void;

  /**
   * Set unread count
   *
   * @param {number} count - New unread count
   */
  setUnreadCount: (count: number) => void;

  /**
   * Set loading state
   *
   * @param {boolean} loading - Whether loading
   */
  setLoading: (loading: boolean) => void;

  /**
   * Set error message
   *
   * @param {string | null} error - Error message or null
   */
  setError: (error: string | null) => void;

  // ============================================
  // Async Actions
  // ============================================

  /**
   * Fetch notifications from backend API
   *
   * Sets loading state, fetches paginated notifications, handles errors.
   *
   * @returns {Promise<void>}
   */
  fetchNotifications: () => Promise<void>;

  /**
   * Fetch unread count from backend API
   *
   * Updates unreadCount state directly.
   *
   * @returns {Promise<void>}
   */
  fetchUnreadCount: () => Promise<void>;
}

// ============================================
// Store
// ============================================

/**
 * Zustand store hook for notification state management
 *
 * Provides centralized state for all notification-related functionality:
 * - Fetching and displaying notifications
 * - Marking notifications as read
 * - Showing notification banners for high-priority items
 * - Managing UI state (notification center open/closed)
 *
 * Persists unread count to localStorage for fast subsequent loads.
 *
 * @function useNotificationStore
 *
 * @returns {NotificationState} Full store state and actions
 *
 * @example
 * ```typescript
 * // In a React component
 * import { useNotificationStore } from '@/stores/notification-store';
 *
 * export function NotificationCenter() {
 *   const {
 *     notifications,
 *     unreadCount,
 *     isLoading,
 *     markAsRead,
 *     setNotificationCenterOpen,
 *     fetchNotifications,
 *   } = useNotificationStore();
 *
 *   useEffect(() => {
 *     fetchNotifications();
 *   }, [fetchNotifications]);
 *
 *   return (
 *     <div>
 *       <h2>Notifications ({unreadCount})</h2>
 *       {isLoading && <Spinner />}
 *       {notifications.map(notif => (
 *         <div key={notif.id} onClick={() => markAsRead(notif.id)}>
 *           {notif.title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      bannerQueue: [],
      currentBanner: null,
      isNotificationCenterOpen: false,

      // Setters
      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setNotificationCenterOpen: (open) => set({ isNotificationCenterOpen: open }),

      // Add new notification
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Show banner for high priority notifications
        if (['URGENT', 'HIGH'].includes(notification.priority)) {
          get().showBanner(notification);
        }
      },

      // Mark single notification as read
      markAsRead: async (id) => {
        const notification = get().notifications.find((n) => n.id === id);
        if (!notification || notification.inAppSeenAt) return;

        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id
              ? { ...n, status: 'READ', inAppSeenAt: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        // API call
        try {
          await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id }),
          });
        } catch (error) {
          console.error('Failed to mark as read:', error);
          // Revert on error
          get().fetchUnreadCount();
        }
      },

      // Mark all notifications as read
      markAllAsRead: async () => {
        const previousCount = get().unreadCount;
        if (previousCount === 0) return;

        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            status: 'READ',
            inAppSeenAt: n.inAppSeenAt ?? new Date().toISOString(),
          })),
          unreadCount: 0,
        }));

        // API call
        try {
          await fetch('/api/notifications/read-all', { method: 'POST' });
        } catch (error) {
          console.error('Failed to mark all as read:', error);
          set({ unreadCount: previousCount });
        }
      },

      // Remove notification
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      // Show banner
      showBanner: (notification) => {
        set((state) => {
          if (state.currentBanner) {
            // Queue if banner already showing
            return { bannerQueue: [...state.bannerQueue, notification] };
          }
          return { currentBanner: notification };
        });
      },

      // Dismiss banner and show next in queue
      dismissBanner: () => {
        set((state) => {
          const [next, ...rest] = state.bannerQueue;
          return {
            currentBanner: next ?? null,
            bannerQueue: rest,
          };
        });
      },

      // Fetch notifications from API
      fetchNotifications: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/notifications?limit=50');

          if (!response.ok) {
            throw new Error('Failed to fetch notifications');
          }

          const data = await response.json();
          set({
            notifications: data.items || [],
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          set({
            error: 'Benachrichtigungen konnten nicht geladen werden',
            isLoading: false,
          });
        }
      },

      // Fetch unread count from API
      fetchUnreadCount: async () => {
        try {
          const response = await fetch('/api/notifications/unread-count');

          if (!response.ok) {
            throw new Error('Failed to fetch unread count');
          }

          const data = await response.json();
          set({ unreadCount: data.count });
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        unreadCount: state.unreadCount,
      }),
    }
  )
);
