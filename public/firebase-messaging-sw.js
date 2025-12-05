/**
 * Firebase Messaging Service Worker
 *
 * Handles background push notifications.
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - these are public values, safe to include
// Hardcoded because service workers don't have access to environment variables
const firebaseConfig = {
  apiKey: 'AIzaSyAxAT2gMLipjI0O_BZKY5RArPBahUfZ3gA',
  authDomain: 'massava-a3292.firebaseapp.com',
  projectId: 'massava-a3292',
  storageBucket: 'massava-a3292.firebasestorage.app',
  messagingSenderId: '10834115260',
  appId: '1:10834115260:web:fc0467406937ba2561eeb9',
};

// Initialize Firebase only if config is available
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message:', payload);

    const notificationTitle = payload.notification?.title || 'Massava';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      tag: payload.data?.notificationId || 'default',
      data: payload.data,
      actions: getNotificationActions(payload.data?.type),
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Get notification actions based on type
function getNotificationActions(type) {
  if (!type) return [];

  switch (type) {
    case 'BOOKING_REQUEST_RECEIVED':
      return [
        { action: 'confirm', title: 'Bestätigen' },
        { action: 'view', title: 'Details' },
      ];
    case 'BOOKING_REMINDER_CUSTOMER':
    case 'BOOKING_REMINDER_STUDIO':
      return [
        { action: 'view', title: 'Termin anzeigen' },
      ];
    case 'REVIEW_REQUEST':
      return [
        { action: 'review', title: 'Bewerten' },
      ];
    default:
      return [
        { action: 'view', title: 'Anzeigen' },
      ];
  }
}

// Track notification interaction
async function trackNotificationInteraction(notificationId, action, clickAction = null) {
  if (!notificationId) {
    console.warn('[SW] Cannot track: notificationId missing');
    return;
  }

  try {
    const trackingData = {
      notificationId,
      action,
      timestamp: new Date().toISOString(),
    };

    if (clickAction) {
      trackingData.clickAction = clickAction;
    }

    const response = await fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });

    if (!response.ok) {
      console.warn('[SW] Tracking failed:', response.status, response.statusText);
    } else {
      console.log('[SW] Interaction tracked:', action, clickAction || '(main)');
    }
  } catch (error) {
    // Fail silently - tracking shouldn't block navigation
    // Queue for retry if offline
    console.error('[SW] Tracking error:', error);

    // Store in IndexedDB for retry when online (if needed)
    try {
      if ('indexedDB' in self) {
        const dbRequest = indexedDB.open('NotificationTracking', 1);

        dbRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('pendingTracking')) {
            db.createObjectStore('pendingTracking', { keyPath: 'id', autoIncrement: true });
          }
        };

        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['pendingTracking'], 'readwrite');
          const store = transaction.objectStore('pendingTracking');

          store.add({
            notificationId,
            action,
            clickAction,
            timestamp: new Date().toISOString(),
            retryCount: 0,
          });
        };
      }
    } catch (dbError) {
      console.error('[SW] Failed to queue tracking for retry:', dbError);
    }
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  const data = event.notification.data || {};
  const notificationId = data.notificationId;
  const clickAction = event.action || null; // Action button clicked, or null for main notification

  // Track the click
  event.waitUntil(
    trackNotificationInteraction(notificationId, 'click', clickAction)
  );

  event.notification.close();

  let url = '/';

  // Handle action buttons
  if (event.action === 'confirm' && data.actionUrl) {
    url = data.actionUrl + '?action=confirm';
  } else if (event.action === 'view' && data.actionUrl) {
    url = data.actionUrl;
  } else if (event.action === 'review' && data.actionUrl) {
    url = data.actionUrl;
  } else if (data.actionUrl) {
    url = data.actionUrl;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            notificationId: data.notificationId,
            url,
          });
          return client.focus();
        }
      }
      // Open new window if not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close (dismiss)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event);

  const data = event.notification.data || {};
  const notificationId = data.notificationId;

  // Track the dismissal
  event.waitUntil(
    trackNotificationInteraction(notificationId, 'dismiss')
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(clients.claim());
});
