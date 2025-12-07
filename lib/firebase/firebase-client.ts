/**
 * Firebase Client SDK Configuration
 *
 * Browser-side Firebase initialization for web push notifications.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { logger } from '@/lib/logger';

// Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

/**
 * Initialize Firebase app (singleton)
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!firebaseConfig.apiKey) {
    logger.warn('[Firebase Client] Config not set');
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  const apps = getApps();
  firebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (messagingInstance) {
    return messagingInstance;
  }

  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    logger.error('[Firebase Client] Failed to get messaging:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function requestPushPermission(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if notifications are supported
  if (!('Notification' in window)) {
    logger.warn('[Firebase Client] Notifications not supported');
    return null;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    logger.info('[Firebase Client] Permission denied');
    return null;
  }

  // Get messaging instance
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  // Get FCM token
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    logger.error('[Firebase Client] VAPID key not set');
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

    // Wait for the service worker to be ready (active state)
    if (registration.installing) {
      logger.info('[Firebase Client] Service worker installing, waiting for activation...');
      await new Promise<void>((resolve) => {
        const sw = registration.installing;
        if (!sw) {
          resolve();
          return;
        }
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') {
            logger.info('[Firebase Client] Service worker activated');
            resolve();
          }
        });
      });
    } else if (registration.waiting) {
      logger.info('[Firebase Client] Service worker waiting, waiting for activation...');
      await new Promise<void>((resolve) => {
        const sw = registration.waiting;
        if (!sw) {
          resolve();
          return;
        }
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') {
            logger.info('[Firebase Client] Service worker activated');
            resolve();
          }
        });
      });
    }

    // Ensure service worker is active
    await navigator.serviceWorker.ready;
    logger.info('[Firebase Client] Service worker ready');

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    logger.info('[Firebase Client] Got FCM token');
    return token;
  } catch (error) {
    logger.error('[Firebase Client] Failed to get token:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
}

/**
 * Listen for foreground messages
 *
 * Validates and processes incoming Firebase messages:
 * - Ensures payload exists and contains valid data
 * - Supports data-only messages (title/body in payload.data)
 * - Falls back to payload.notification for backwards compatibility
 * - Skips messages with no title/body (logs warning)
 * - Guarantees callback always receives defined values
 */
export function onForegroundMessage(
  callback: (payload: { title: string; body: string; data: Record<string, string> }) => void
): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  return onMessage(messaging, (payload) => {
    logger.info('[Firebase Client] Foreground message received');

    // Validate payload exists
    if (!payload) {
      logger.warn('[Firebase Client] Received empty payload, skipping');
      return;
    }

    // Extract title and body from data-only or notification payloads
    const title = payload.data?.title || payload.notification?.title;
    const body = payload.data?.body || payload.notification?.body;

    // Skip messages with no content (both title and body missing)
    if (!title && !body) {
      logger.warn('[Firebase Client] Message has no title or body, skipping', {
        hasData: !!payload.data,
        hasNotification: !!payload.notification,
      });
      return;
    }

    // Call callback with validated, guaranteed-defined values
    callback({
      title: String(title || ''),
      body: String(body || ''),
      data: payload.data || {},
    });
  });
}

/**
 * Check if push notifications are available
 *
 * Returns true if:
 * - Running in a browser with Web Push support (Notification + ServiceWorker + PushManager)
 * - OR running as a native Capacitor app (iOS/Android)
 *
 * On native platforms, we use Capacitor's PushNotifications plugin instead of Web Push.
 */
export function isPushAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for native Capacitor platform first
  // Capacitor sets window.Capacitor when running as native app
  const isNativeApp = !!(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );

  if (isNativeApp) {
    // Native apps use Capacitor PushNotifications, always available
    return true;
  }

  // Web browser - check for Web Push API support
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get current push permission status
 *
 * On native platforms, returns 'default' since permission is managed by Capacitor
 * and checked asynchronously. The CapacitorInitializer handles native permissions.
 */
export function getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unavailable' {
  if (!isPushAvailable()) {
    return 'unavailable';
  }

  // Check for native Capacitor platform
  const isNativeApp = !!(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );

  if (isNativeApp) {
    // Native platforms manage permissions via Capacitor PushNotifications plugin
    // Return 'default' to indicate permission needs to be requested
    // The actual permission state is tracked by CapacitorInitializer
    return 'default';
  }

  // Web browser - use Notification API
  return Notification.permission;
}
