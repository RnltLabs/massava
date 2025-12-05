/**
 * Firebase Messaging Service Worker Template
 *
 * This is a TEMPLATE file. The actual service worker is generated at build time
 * by scripts/build-service-worker.ts which injects the Firebase config.
 *
 * DO NOT rename this file to firebase-messaging-sw.js - that file is auto-generated.
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// __FIREBASE_CONFIG_PLACEHOLDER__ - This line will be replaced by the build script

// Initialize Firebase only if config is available
if (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.apiKey) {
  firebase.initializeApp(FIREBASE_CONFIG);
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
} else {
  console.warn('[SW] Firebase config not available - push notifications disabled');
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
