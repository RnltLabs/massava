# Notification API - Implementation Examples

This document provides real-world code examples for common notification scenarios.

## Table of Contents

1. [Client-Side Implementation](#client-side-implementation)
2. [Server-Side Implementation](#server-side-implementation)
3. [Real-Time Streaming](#real-time-streaming)
4. [Device Management](#device-management)
5. [Preference Management](#preference-management)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## Client-Side Implementation

### React Hook for Notifications

```typescript
// hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/types/notification';

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, pushReadAt: new Date().toISOString() }
              : n
          )
        );
        await fetchUnreadCount();
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [fetchUnreadCount]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        await fetchUnreadCount();
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [fetchUnreadCount]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    deleteNotification
  };
}
```

### React Component - Notification Center

```typescript
// components/NotificationCenter.tsx
'use client';

import React, { useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Bell, X, CheckCheck } from 'lucide-react';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    deleteNotification
  } = useNotifications();

  const handleNotificationClick = useCallback((notification: any) => {
    if (!notification.pushReadAt) {
      markAsRead(notification.id);
    }
  }, [markAsRead]);

  const notificationTypeColors: Record<string, string> = {
    BOOKING_CONFIRMED: 'bg-green-100 text-green-800',
    BOOKING_REMINDER_CUSTOMER: 'bg-blue-100 text-blue-800',
    PAYMENT_RECEIVED: 'bg-emerald-100 text-emerald-800',
    REVIEW_REQUEST: 'bg-purple-100 text-purple-800',
    ACCOUNT_LOGIN_NEW_DEVICE: 'bg-orange-100 text-orange-800',
    SYSTEM_MAINTENANCE: 'bg-red-100 text-red-800'
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center text-gray-500">
          <p>Loading notifications...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && notifications.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No notifications yet</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="divide-y max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                !notification.pushReadAt ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Type Badge */}
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    notificationTypeColors[notification.type] ||
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {notification.type.replace(/_/g, ' ')}
                </span>

                {notification.pushReadAt && (
                  <CheckCheck className="w-4 h-4 text-green-600" />
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm mb-1">
                {notification.title}
              </h3>

              {/* Body */}
              <p className="text-sm text-gray-600 mb-2">
                {notification.body}
              </p>

              {/* Timestamp */}
              <p className="text-xs text-gray-500 mb-3">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true
                })}
              </p>

              {/* Channels */}
              <div className="flex gap-1 mb-3">
                {notification.channels.map((channel) => (
                  <span
                    key={channel}
                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                  >
                    {channel}
                  </span>
                ))}
              </div>

              {/* Action - Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Server-Side Implementation

### Create Notification Service

```typescript
// lib/services/notification-service.ts
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import type { NotificationType, NotificationChannel, NotificationPriority } from '@prisma/client';

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  scheduledFor?: Date;
  expiresAt?: Date;
  idempotencyKey?: string;
}

export async function createBookingConfirmationNotification(
  userId: string,
  bookingData: {
    bookingId: string;
    customerName: string;
    serviceName: string;
    appointmentTime: Date;
    studioName: string;
    studioId: string;
  }
) {
  return notificationService.create({
    userId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed',
    body: `Your booking with ${bookingData.studioName} on ${bookingData.appointmentTime.toLocaleDateString()} has been confirmed.`,
    channels: ['PUSH', 'EMAIL', 'IN_APP'],
    priority: 'HIGH',
    metadata: {
      bookingId: bookingData.bookingId,
      customerName: bookingData.customerName,
      serviceName: bookingData.serviceName,
      appointmentTime: bookingData.appointmentTime.toISOString(),
      studioName: bookingData.studioName,
      studioId: bookingData.studioId
    },
    idempotencyKey: `booking-confirmed-${bookingData.bookingId}`
  });
}

export async function createBookingReminderNotification(
  userId: string,
  bookingData: {
    bookingId: string;
    appointmentTime: Date;
    studioName: string;
  }
) {
  return notificationService.create({
    userId,
    type: 'BOOKING_REMINDER_CUSTOMER',
    title: 'Booking Reminder',
    body: `Reminder: You have a booking with ${bookingData.studioName} today at ${bookingData.appointmentTime.toLocaleTimeString()}.`,
    channels: ['PUSH', 'IN_APP'],
    priority: 'URGENT',
    metadata: {
      bookingId: bookingData.bookingId,
      appointmentTime: bookingData.appointmentTime.toISOString(),
      studioName: bookingData.studioName
    },
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours before
  });
}

export async function createPaymentReceivedNotification(
  userId: string,
  paymentData: {
    bookingId: string;
    amount: number;
    currency: string;
    customerName: string;
  }
) {
  return notificationService.create({
    userId,
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    body: `Payment of ${paymentData.currency} ${paymentData.amount.toFixed(2)} from ${paymentData.customerName} received.`,
    channels: ['PUSH', 'EMAIL', 'IN_APP'],
    priority: 'NORMAL',
    metadata: {
      bookingId: paymentData.bookingId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      customerName: paymentData.customerName
    }
  });
}

export async function createSecurityNotification(
  userId: string,
  type: 'LOGIN_NEW_DEVICE' | 'PASSWORD_CHANGED' | 'EMAIL_CHANGED',
  data: {
    ipAddress?: string;
    location?: string;
    device?: string;
    browser?: string;
  }
) {
  const typeMap = {
    LOGIN_NEW_DEVICE: 'ACCOUNT_LOGIN_NEW_DEVICE',
    PASSWORD_CHANGED: 'ACCOUNT_PASSWORD_CHANGED',
    EMAIL_CHANGED: 'ACCOUNT_EMAIL_CHANGED'
  };

  const titleMap = {
    LOGIN_NEW_DEVICE: 'New Device Login',
    PASSWORD_CHANGED: 'Password Changed',
    EMAIL_CHANGED: 'Email Address Changed'
  };

  const bodyMap = {
    LOGIN_NEW_DEVICE: `New login detected from ${data.location || 'unknown location'} using ${data.device || 'unknown device'}.`,
    PASSWORD_CHANGED: 'Your password has been successfully changed.',
    EMAIL_CHANGED: 'Your email address has been successfully changed.'
  };

  return notificationService.create({
    userId,
    type: typeMap[type] as NotificationType,
    title: titleMap[type],
    body: bodyMap[type],
    channels: ['EMAIL', 'PUSH'],
    priority: 'HIGH',
    metadata: {
      ipAddress: data.ipAddress,
      location: data.location,
      device: data.device,
      browser: data.browser,
      timestamp: new Date().toISOString()
    }
  });
}
```

### Bulk Notification Sender

```typescript
// lib/services/bulk-notification-sender.ts
import { notificationService } from '@/lib/notifications/notification-service';
import type { NotificationType } from '@prisma/client';

interface BulkNotificationRequest {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  batchSize?: number;
}

export async function sendBulkNotification({
  userIds,
  type,
  title,
  body,
  metadata,
  batchSize = 100
}: BulkNotificationRequest) {
  const results = {
    total: userIds.length,
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ userId: string; error: string }>
  };

  // Process in batches
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const promises = batch.map(async (userId) => {
      try {
        const result = await notificationService.create({
          userId,
          type,
          title,
          body,
          metadata,
          idempotencyKey: `bulk-${type}-${Date.now()}-${userId}`
        });

        if (result.ok) {
          results.succeeded++;
          return { success: true };
        } else {
          results.failed++;
          results.errors.push({
            userId,
            error: result.error.message
          });
          return { success: false };
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return { success: false };
      }
    });

    await Promise.all(promises);

    // Log progress
    console.log(
      `Processed ${Math.min(i + batchSize, userIds.length)} of ${userIds.length}`
    );
  }

  return results;
}

// Example: Send announcement to all users
export async function sendAnnouncement(
  title: string,
  body: string,
  targetRoles?: string[]
) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const query = targetRoles
      ? { role: { in: targetRoles } }
      : {};

    const users = await prisma.user.findMany({
      where: query,
      select: { id: true }
    });

    const userIds = users.map(u => u.id);

    return sendBulkNotification({
      userIds,
      type: 'FEATURE_ANNOUNCEMENT',
      title,
      body,
      batchSize: 100
    });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## Real-Time Streaming

### Vue 3 Composition API - Real-time Notifications

```typescript
// composables/useNotificationStream.ts
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { Notification } from '@/types/notification';

export function useNotificationStream() {
  const notifications = ref<Notification[]>([]);
  const isConnected = ref(false);
  const eventSource = ref<EventSource | null>(null);

  const connect = () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.error('No authentication token found');
      return;
    }

    eventSource.value = new EventSource('/api/notifications/stream', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Handle notification events
    eventSource.value.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        notifications.value.unshift(notification);

        // Show toast notification
        showNotificationToast(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    });

    // Handle heartbeat
    eventSource.value.addEventListener('heartbeat', () => {
      isConnected.value = true;
    });

    // Handle connection errors
    eventSource.value.onerror = () => {
      isConnected.value = false;
      console.warn('SSE connection error, will retry...');

      // Attempt reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    isConnected.value = true;
  };

  const disconnect = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
    isConnected.value = false;
  };

  const showNotificationToast = (notification: Notification) => {
    // Implement toast notification
    console.log('New notification:', notification.title);
  };

  onMounted(connect);
  onBeforeUnmount(disconnect);

  return {
    notifications,
    isConnected,
    connect,
    disconnect
  };
}
```

### Vue 3 Component

```vue
<!-- components/NotificationStream.vue -->
<template>
  <div class="notification-stream">
    <!-- Status Indicator -->
    <div :class="['status-indicator', { connected: isConnected }]">
      <span class="dot"></span>
      {{ isConnected ? 'Connected' : 'Disconnected' }}
    </div>

    <!-- Notifications List -->
    <transition-group name="slide" tag="div" class="notifications-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
      >
        <div class="notification-header">
          <h4>{{ notification.title }}</h4>
          <span class="type-badge">{{ notification.type }}</span>
        </div>
        <p class="notification-body">{{ notification.body }}</p>
        <div class="notification-meta">
          <span class="timestamp">
            {{ formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true
            }) }}
          </span>
          <div class="channels">
            <span v-for="channel in notification.channels" :key="channel" class="channel">
              {{ channel }}
            </span>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStream } from '@/composables/useNotificationStream';
import { formatDistanceToNow } from 'date-fns';

const { notifications, isConnected } = useNotificationStream();
</script>

<style scoped>
.notification-stream {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.status-indicator {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.status-indicator.connected {
  background-color: #f0fdf4;
  color: #166534;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #dc2626;
}

.status-indicator.connected .dot {
  background-color: #16a34a;
}

.notifications-list {
  divide-y divide-gray-100;
}

.notification-item {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.type-badge {
  font-size: 11px;
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.notification-body {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #666;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.channels {
  display: flex;
  gap: 4px;
}

.channel {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
```

---

## Device Management

### Device Registration Hook (React)

```typescript
// hooks/useDeviceRegistration.ts
import { useState, useCallback } from 'react';
import type { DeviceToken } from '@/types/notification';

export function useDeviceRegistration() {
  const [devices, setDevices] = useState<DeviceToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/devices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      setDevices(data.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register device
  const registerDevice = useCallback(
    async (token: string, platform: 'IOS' | 'ANDROID' | 'WEB') => {
      setError(null);

      try {
        const response = await fetch('/api/notifications/devices', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token,
            platform,
            deviceName: getDeviceInfo().name,
            deviceModel: getDeviceInfo().model,
            osVersion: getDeviceInfo().osVersion,
            appVersion: getAppVersion()
          })
        });

        if (!response.ok) {
          if (response.status === 422) {
            throw new Error('Invalid device token format');
          }
          throw new Error('Failed to register device');
        }

        const data = await response.json();
        setDevices(prev => [data.device, ...prev]);
        return data.device;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete device
  const deleteDevice = useCallback(async (deviceId: string) => {
    try {
      const response = await fetch(`/api/notifications/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
      }
    } catch (err) {
      console.error('Failed to delete device:', err);
    }
  }, []);

  return {
    devices,
    isLoading,
    error,
    fetchDevices,
    registerDevice,
    deleteDevice
  };
}

function getDeviceInfo() {
  const ua = navigator.userAgent;

  return {
    name: 'Web Browser',
    model: 'Web Device',
    osVersion: navigator.appVersion
  };
}

function getAppVersion() {
  return process.env.REACT_APP_VERSION || '1.0.0';
}
```

### Firebase Cloud Messaging Integration

```typescript
// lib/firebase-messaging.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useDeviceRegistration } from '@/hooks/useDeviceRegistration';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function setupPushNotifications() {
  const { registerDevice } = useDeviceRegistration();

  try {
    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });

      // Register with our API
      await registerDevice(token, 'WEB');

      // Listen for messages
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);

        // Show notification
        new Notification(payload.notification?.title || 'New Notification', {
          body: payload.notification?.body,
          icon: payload.notification?.icon
        });
      });
    }
  } catch (error) {
    console.error('Failed to setup push notifications:', error);
  }
}
```

---

## Preference Management

### Preference Hook (React)

```typescript
// hooks/useNotificationPreferences.ts
import { useState, useEffect, useCallback } from 'react';
import type { NotificationPreferences } from '@/types/notification';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch preferences');
        }

        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!preferences) return;

      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch('/api/notifications/preferences', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        const updatedPreferences = await response.json();
        setPreferences(updatedPreferences);
        return updatedPreferences;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [preferences]
  );

  // Toggle channel
  const toggleChannel = useCallback(
    async (channel: 'pushEnabled' | 'emailEnabled' | 'inAppEnabled') => {
      if (!preferences) return;

      return updatePreferences({
        ...preferences,
        [channel]: !preferences[channel]
      });
    },
    [preferences, updatePreferences]
  );

  // Update quiet hours
  const setQuietHours = useCallback(
    async (start: string, end: string) => {
      if (!preferences) return;

      return updatePreferences({
        ...preferences,
        quietHoursEnabled: true,
        quietHoursStart: start,
        quietHoursEnd: end
      });
    },
    [preferences, updatePreferences]
  );

  return {
    preferences,
    isLoading,
    isSaving,
    error,
    updatePreferences,
    toggleChannel,
    setQuietHours
  };
}
```

### Preferences Settings Component (React)

```typescript
// components/NotificationSettings.tsx
'use client';

import React from 'react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Bell, Mail, MessageSquare, Clock } from 'lucide-react';

export function NotificationSettings() {
  const {
    preferences,
    isLoading,
    isSaving,
    error,
    toggleChannel,
    setQuietHours
  } = useNotificationPreferences();

  if (isLoading) {
    return <div className="p-4 text-center">Loading preferences...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700">{error}</div>;
  }

  if (!preferences) {
    return <div className="p-4 text-center">No preferences found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>

      {/* Global Channel Controls */}
      <div className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold">Notification Channels</h2>

        {/* Push Notifications */}
        <label className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.pushEnabled}
            onChange={() => toggleChannel('pushEnabled')}
            disabled={isSaving}
          />
          <Bell className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium">Push Notifications</div>
            <div className="text-sm text-gray-600">iOS, Android, Web</div>
          </div>
        </label>

        {/* Email Notifications */}
        <label className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.emailEnabled}
            onChange={() => toggleChannel('emailEnabled')}
            disabled={isSaving}
          />
          <Mail className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-medium">Email Notifications</div>
            <div className="text-sm text-gray-600">Instant and digest</div>
          </div>
        </label>

        {/* In-App Notifications */}
        <label className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.inAppEnabled}
            onChange={() => toggleChannel('inAppEnabled')}
            disabled={isSaving}
          />
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <div>
            <div className="font-medium">In-App Notifications</div>
            <div className="text-sm text-gray-600">Notification center</div>
          </div>
        </label>
      </div>

      {/* Quiet Hours */}
      <div className="mb-8 p-4 border rounded">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Quiet Hours</h2>
        </div>

        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={preferences.quietHoursEnabled}
            onChange={async () => {
              if (preferences.quietHoursEnabled) {
                // Disable
                await setQuietHours('', '');
              }
            }}
            disabled={isSaving}
          />
          <span>Enable quiet hours</span>
        </label>

        {preferences.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 ml-6">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="time"
                value={preferences.quietHoursStart || '22:00'}
                onChange={(e) => {
                  setQuietHours(
                    e.target.value,
                    preferences.quietHoursEnd || '08:00'
                  );
                }}
                disabled={isSaving}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="time"
                value={preferences.quietHoursEnd || '08:00'}
                onChange={(e) => {
                  setQuietHours(
                    preferences.quietHoursStart || '22:00',
                    e.target.value
                  );
                }}
                disabled={isSaving}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        )}
      </div>

      {isSaving && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded">
          Saving changes...
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

### Error Handling Utilities

```typescript
// lib/api-errors.ts
export enum NotificationErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_TOKEN_FORMAT = 'INVALID_TOKEN_FORMAT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class NotificationAPIError extends Error {
  constructor(
    public code: NotificationErrorCode,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NotificationAPIError';
  }
}

export async function handleNotificationAPIResponse(response: Response) {
  if (response.ok) {
    return response.json();
  }

  const data = await response.json();

  const errorMap: Record<number, NotificationErrorCode> = {
    401: NotificationErrorCode.UNAUTHORIZED,
    403: NotificationErrorCode.FORBIDDEN,
    404: NotificationErrorCode.NOT_FOUND,
    422: NotificationErrorCode.INVALID_TOKEN_FORMAT,
    429: NotificationErrorCode.RATE_LIMITED,
    500: NotificationErrorCode.INTERNAL_ERROR
  };

  const code = errorMap[response.status] || NotificationErrorCode.INTERNAL_ERROR;

  throw new NotificationAPIError(
    code,
    response.status,
    data.error || 'Unknown error',
    data.details
  );
}

// Usage in hooks
export async function safeFetch(
  url: string,
  options?: RequestInit
) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        ...options?.headers
      },
      ...options
    });

    return await handleNotificationAPIResponse(response);
  } catch (error) {
    if (error instanceof NotificationAPIError) {
      // Handle specific error codes
      if (error.code === NotificationErrorCode.UNAUTHORIZED) {
        // Redirect to login
        window.location.href = '/login';
      } else if (error.code === NotificationErrorCode.RATE_LIMITED) {
        // Show rate limit warning
        console.warn('Rate limited, please try again later');
      }
    }
    throw error;
  }
}
```

---

## Testing

### Jest Tests

```typescript
// __tests__/api/notifications.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST, GET, DELETE, PATCH } from '@/app/api/notifications/route';
import { NextRequest } from 'next/server';

describe('Notification API', () => {
  let mockSession: any;

  beforeEach(() => {
    mockSession = {
      user: { id: 'user123', role: 'CUSTOMER' }
    };
  });

  describe('POST /api/notifications', () => {
    it('should create notification for admin user', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user456',
          type: 'BOOKING_CONFIRMED',
          title: 'Test',
          body: 'Test message'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user456',
          type: 'BOOKING_CONFIRMED',
          title: 'Test',
          body: 'Test message'
        })
      });

      // Mock auth to return null
      vi.mock('@/auth', () => ({
        auth: vi.fn(() => null)
      }));

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notifications', () => {
    it('should list user notifications', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/notifications?limit=20'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/notifications?status=DELIVERED'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.forEach(notification => {
        expect(notification.status).toBe('DELIVERED');
      });
    });
  });
});
```

---

## Summary

These examples cover:
- Client-side hooks and components
- Server-side services and bulk operations
- Real-time streaming with SSE
- Device management and FCM integration
- Preference management
- Error handling strategies
- Unit testing approaches

For more information, see the full OpenAPI specification in `openapi.yaml`.
