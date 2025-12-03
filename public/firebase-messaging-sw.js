/**
 * Firebase Messaging Service Worker
 *
 * Handles background push notifications.
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - these are public values, safe to include
const firebaseConfig = {
  apiKey: self.FIREBASE_CONFIG?.apiKey || '',
  authDomain: self.FIREBASE_CONFIG?.authDomain || '',
  projectId: self.FIREBASE_CONFIG?.projectId || '',
  storageBucket: self.FIREBASE_CONFIG?.storageBucket || '',
  messagingSenderId: self.FIREBASE_CONFIG?.messagingSenderId || '',
  appId: self.FIREBASE_CONFIG?.appId || '',
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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const data = event.notification.data || {};
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
