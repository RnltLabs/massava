# Push Notifications (Firebase Cloud Messaging)

## Overview

This document covers:
1. Firebase Admin SDK setup
2. FCM service implementation
3. Device token management
4. Web Push (VAPID) for browsers
5. Platform-specific handling

## 1. Firebase Admin SDK Setup

### Installation

```bash
npm install firebase-admin
```

### Admin Initialization

```typescript
// lib/firebase/firebase-admin.ts

import admin from 'firebase-admin';

// Singleton pattern to prevent multiple initializations
let firebaseAdmin: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  // Initialize from service account JSON
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_ADMIN_SDK_JSON ?? '{}'
  );

  if (!serviceAccount.project_id) {
    throw new Error('Firebase Admin SDK not configured');
  }

  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return firebaseAdmin;
}

export function getMessaging(): admin.messaging.Messaging {
  return getFirebaseAdmin().messaging();
}
```

## 2. FCM Service

### Main Service

```typescript
// lib/firebase/fcm-service.ts

import { getMessaging } from './firebase-admin';
import { prisma } from '@/lib/prisma';
import { DevicePlatform, NotificationPriority } from '@/app/generated/prisma';

interface PushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  actionUrl?: string;
  priority: NotificationPriority;
  badge?: number;
}

interface SendResult {
  success: boolean;
  token: string;
  error?: string;
  shouldRemoveToken?: boolean;
}

class PushService {
  private messaging = getMessaging();

  /**
   * Send push notification to a single user
   */
  async sendToUser(notification: {
    userId: string;
    id: string;
    title: string;
    body: string;
    type: string;
    priority: NotificationPriority;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    // Get user's active device tokens
    const tokens = await prisma.deviceToken.findMany({
      where: {
        userId: notification.userId,
        isActive: true,
      },
    });

    if (tokens.length === 0) {
      console.log(`No active tokens for user ${notification.userId}`);
      return;
    }

    // Calculate badge count
    const badgeCount = await prisma.notification.count({
      where: {
        userId: notification.userId,
        status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
        inAppSeenAt: null,
      },
    });

    const payload: PushPayload = {
      title: notification.title,
      body: notification.body,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      badge: badgeCount,
      data: {
        notificationId: notification.id,
        type: notification.type,
        actionUrl: notification.actionUrl ?? '',
        ...(notification.metadata as Record<string, string>),
      },
    };

    // Send to all tokens
    const results = await Promise.all(
      tokens.map(token => this.sendToToken(token.token, token.platform, payload))
    );

    // Handle failed tokens
    await this.handleFailedTokens(results);

    // Update notification delivery status
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { pushDeliveredAt: new Date() },
      });
    }
  }

  /**
   * Send to a specific token
   */
  private async sendToToken(
    token: string,
    platform: DevicePlatform,
    payload: PushPayload
  ): Promise<SendResult> {
    try {
      const message = this.buildMessage(token, platform, payload);
      await this.messaging.send(message);

      // Update last used
      await prisma.deviceToken.update({
        where: { token },
        data: { lastUsedAt: new Date(), failureCount: 0 },
      });

      return { success: true, token };
    } catch (error: any) {
      console.error(`Push send failed for token ${token}:`, error.code);

      const shouldRemove = this.shouldRemoveToken(error.code);

      return {
        success: false,
        token,
        error: error.code,
        shouldRemoveToken: shouldRemove,
      };
    }
  }

  /**
   * Build platform-specific message
   */
  private buildMessage(
    token: string,
    platform: DevicePlatform,
    payload: PushPayload
  ): admin.messaging.Message {
    const baseMessage: admin.messaging.Message = {
      token,
      data: payload.data,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
    };

    // Platform-specific options
    switch (platform) {
      case 'IOS':
        return {
          ...baseMessage,
          apns: {
            headers: {
              'apns-priority': payload.priority === 'URGENT' ? '10' : '5',
            },
            payload: {
              aps: {
                badge: payload.badge,
                sound: payload.priority === 'URGENT' ? 'default' : undefined,
                'content-available': 1,
                'mutable-content': 1,
                category: this.getCategoryForType(payload.data?.type ?? ''),
              },
            },
          },
        };

      case 'ANDROID':
        return {
          ...baseMessage,
          android: {
            priority: payload.priority === 'URGENT' ? 'high' : 'normal',
            notification: {
              channelId: this.getChannelForPriority(payload.priority),
              icon: 'ic_notification',
              color: '#6366f1', // Primary color
              sound: payload.priority === 'URGENT' ? 'default' : undefined,
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
            data: payload.data,
          },
        };

      case 'WEB':
        return {
          ...baseMessage,
          webpush: {
            headers: {
              Urgency: payload.priority === 'URGENT' ? 'high' : 'normal',
            },
            notification: {
              title: payload.title,
              body: payload.body,
              icon: '/icons/notification-icon.png',
              badge: '/icons/badge-icon.png',
              requireInteraction: payload.priority === 'URGENT',
              actions: this.getActionsForType(payload.data?.type ?? ''),
            },
            fcmOptions: {
              link: payload.actionUrl,
            },
          },
        };

      default:
        return baseMessage;
    }
  }

  /**
   * Get iOS category for action buttons
   */
  private getCategoryForType(type: string): string {
    switch (type) {
      case 'BOOKING_REQUEST_RECEIVED':
        return 'BOOKING_REQUEST';
      case 'BOOKING_REMINDER_CUSTOMER':
      case 'BOOKING_REMINDER_STUDIO':
        return 'BOOKING_REMINDER';
      case 'REVIEW_REQUEST':
        return 'REVIEW_REQUEST';
      default:
        return 'DEFAULT';
    }
  }

  /**
   * Get Android notification channel
   */
  private getChannelForPriority(priority: NotificationPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'urgent_notifications';
      case 'HIGH':
        return 'high_priority_notifications';
      default:
        return 'default_notifications';
    }
  }

  /**
   * Get web push actions
   */
  private getActionsForType(type: string): admin.messaging.WebpushNotificationAction[] {
    switch (type) {
      case 'BOOKING_REQUEST_RECEIVED':
        return [
          { action: 'confirm', title: 'Bestätigen' },
          { action: 'view', title: 'Details' },
        ];
      case 'BOOKING_REMINDER_CUSTOMER':
        return [
          { action: 'view', title: 'Termin anzeigen' },
          { action: 'directions', title: 'Route' },
        ];
      default:
        return [{ action: 'view', title: 'Öffnen' }];
    }
  }

  /**
   * Determine if token should be removed based on error
   */
  private shouldRemoveToken(errorCode: string): boolean {
    const invalidTokenErrors = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument',
    ];
    return invalidTokenErrors.includes(errorCode);
  }

  /**
   * Handle failed tokens (remove invalid, increment failure count)
   */
  private async handleFailedTokens(results: SendResult[]): Promise<void> {
    const tokensToRemove = results
      .filter(r => !r.success && r.shouldRemoveToken)
      .map(r => r.token);

    const tokensToIncrement = results
      .filter(r => !r.success && !r.shouldRemoveToken)
      .map(r => r.token);

    if (tokensToRemove.length > 0) {
      await prisma.deviceToken.updateMany({
        where: { token: { in: tokensToRemove } },
        data: { isActive: false },
      });
    }

    if (tokensToIncrement.length > 0) {
      for (const token of tokensToIncrement) {
        await prisma.deviceToken.update({
          where: { token },
          data: {
            failureCount: { increment: 1 },
            lastFailureAt: new Date(),
          },
        });
      }

      // Deactivate tokens with too many failures
      await prisma.deviceToken.updateMany({
        where: {
          token: { in: tokensToIncrement },
          failureCount: { gte: 5 },
        },
        data: { isActive: false },
      });
    }
  }

  /**
   * Send to multiple users (batch)
   */
  async sendMulticast(
    userIds: string[],
    payload: Omit<PushPayload, 'badge'>
  ): Promise<void> {
    // Get all active tokens for these users
    const tokens = await prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
    });

    if (tokens.length === 0) return;

    // Group by platform for optimal batching
    const byPlatform = tokens.reduce((acc, token) => {
      if (!acc[token.platform]) acc[token.platform] = [];
      acc[token.platform].push(token.token);
      return acc;
    }, {} as Record<DevicePlatform, string[]>);

    // Send to each platform
    for (const [platform, platformTokens] of Object.entries(byPlatform)) {
      const message = this.buildMessage(
        platformTokens[0], // Template token
        platform as DevicePlatform,
        { ...payload, badge: 0 }
      );

      // FCM supports up to 500 tokens per multicast
      const chunks = this.chunkArray(platformTokens, 500);

      for (const chunk of chunks) {
        try {
          await this.messaging.sendEachForMulticast({
            tokens: chunk,
            notification: message.notification,
            data: message.data,
            android: message.android,
            apns: message.apns,
            webpush: message.webpush,
          });
        } catch (error) {
          console.error('Multicast send failed:', error);
        }
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const pushService = new PushService();

// Type for firebase-admin
import type admin from 'firebase-admin';
```

## 3. Device Token Management

### Registration API

```typescript
// app/api/notifications/devices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
});

// Register or update device token
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = registerSchema.parse(body);

  // Upsert token
  const token = await prisma.deviceToken.upsert({
    where: { token: data.token },
    update: {
      userId: session.user.id,
      platform: data.platform,
      deviceName: data.deviceName,
      deviceModel: data.deviceModel,
      appVersion: data.appVersion,
      osVersion: data.osVersion,
      isActive: true,
      failureCount: 0,
      lastUsedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      token: data.token,
      platform: data.platform,
      deviceName: data.deviceName,
      deviceModel: data.deviceModel,
      appVersion: data.appVersion,
      osVersion: data.osVersion,
    },
  });

  return NextResponse.json({ id: token.id });
}

// Get user's registered devices
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokens = await prisma.deviceToken.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    select: {
      id: true,
      platform: true,
      deviceName: true,
      deviceModel: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ devices: tokens });
}

// Unregister device
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('id');

  if (!tokenId) {
    return NextResponse.json({ error: 'Missing token id' }, { status: 400 });
  }

  await prisma.deviceToken.updateMany({
    where: {
      id: tokenId,
      userId: session.user.id,
    },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
```

## 4. Web Push (VAPID)

### Service Worker

```typescript
// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title ?? 'Massava';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    data: payload.data,
    actions: getActionsForType(payload.data?.type),
    requireInteraction: payload.data?.priority === 'URGENT',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl ?? '/';

  if (event.action === 'confirm') {
    // Handle confirm action
    event.waitUntil(
      clients.openWindow(`${actionUrl}?action=confirm`)
    );
  } else if (event.action === 'view') {
    event.waitUntil(clients.openWindow(actionUrl));
  } else {
    event.waitUntil(clients.openWindow(actionUrl));
  }
});

function getActionsForType(type) {
  switch (type) {
    case 'BOOKING_REQUEST_RECEIVED':
      return [
        { action: 'confirm', title: 'Bestätigen' },
        { action: 'view', title: 'Details' },
      ];
    default:
      return [{ action: 'view', title: 'Öffnen' }];
  }
}
```

### Client-side Registration

```typescript
// lib/firebase/firebase-client.ts

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function requestPushPermission(): Promise<string | null> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  return token;
}

export function onForegroundMessage(callback: (payload: any) => void): () => void {
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}
```

## 5. User Preferences API

```typescript
// app/api/notifications/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  typePreferences: z.record(z.object({
    push: z.boolean(),
    email: z.enum(['instant', 'digest', 'off']),
    inApp: z.boolean(),
  })).optional(),
  emailDigestEnabled: z.boolean().optional(),
  digestFrequency: z.enum(['DAILY', 'WEEKLY']).optional(),
  digestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  language: z.string().optional(),
});

// Get preferences
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  // Create defaults if not exists
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: { userId: session.user.id },
    });
  }

  return NextResponse.json(preferences);
}

// Update preferences
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = preferencesSchema.parse(body);

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  return NextResponse.json(preferences);
}
```

## 6. Scheduled Notifications (Vercel Cron)

```typescript
// app/api/cron/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { qstashPublisher } from '@/lib/queue/qstash-publisher';

// Vercel Cron: runs every minute
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find scheduled notifications ready to send
  const scheduledNotifications = await prisma.notification.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    take: 100, // Process in batches
  });

  // Queue each notification
  for (const notification of scheduledNotifications) {
    await qstashPublisher.publish({
      notificationId: notification.id,
      priority: notification.priority,
    });

    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'QUEUED' },
    });
  }

  // Find notifications to retry
  const retryNotifications = await prisma.notification.findMany({
    where: {
      status: 'PENDING',
      nextRetryAt: { lte: now },
      retryCount: { lt: 3 },
    },
    take: 50,
  });

  for (const notification of retryNotifications) {
    await qstashPublisher.publish({
      notificationId: notification.id,
      priority: notification.priority,
    });

    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'QUEUED' },
    });
  }

  return NextResponse.json({
    processed: scheduledNotifications.length,
    retried: retryNotifications.length,
  });
}
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "* * * * *"
    }
  ]
}
```

## Verification Checklist

- [ ] Firebase Admin SDK initializes correctly
- [ ] Can send push to iOS token
- [ ] Can send push to Android token
- [ ] Can send web push
- [ ] Device token registration works
- [ ] Invalid tokens are deactivated
- [ ] Badge count updates correctly
- [ ] Action buttons appear on notifications
- [ ] Cron job processes scheduled notifications
