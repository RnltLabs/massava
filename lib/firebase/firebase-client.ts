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
 */
export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  return onMessage(messaging, (payload) => {
    logger.info('[Firebase Client] Foreground message received');
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data,
    });
  });
}

/**
 * Check if push notifications are available
 */
export function isPushAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get current push permission status
 */
export function getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unavailable' {
  if (!isPushAvailable()) {
    return 'unavailable';
  }
  return Notification.permission;
}
