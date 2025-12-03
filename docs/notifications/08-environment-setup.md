# Environment Setup

## Overview

This document covers:
1. Environment variables
2. Firebase configuration files
3. Vercel deployment configuration
4. Local development setup

## 1. Environment Variables

### Add to `.env.local`

```bash
# ============================================
# NOTIFICATION SYSTEM
# ============================================

# Upstash QStash (Message Queue)
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="your_qstash_token"
QSTASH_CURRENT_SIGNING_KEY="sig_xxx"
QSTASH_NEXT_SIGNING_KEY="sig_xxx"

# Upstash Redis (already exists, used for SSE)
# UPSTASH_REDIS_REST_URL="..."
# UPSTASH_REDIS_REST_TOKEN="..."

# Firebase Admin SDK (Server-side)
FIREBASE_ADMIN_SDK_JSON='{"type":"service_account","project_id":"massava-xxx","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@massava-xxx.iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40massava-xxx.iam.gserviceaccount.com"}'

# Firebase Client SDK (Public - used in browser)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyXXX"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="massava-xxx.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="massava-xxx"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="massava-xxx.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:xxx"

# Firebase VAPID Key (Web Push)
NEXT_PUBLIC_FIREBASE_VAPID_KEY="BA5yt4hDb0KL97W8j3OBSKB0RZDbfRMEFKvaO3Lr197Tv-pUlylKqNnlYG5zrI9iSL00BhumtbDjNIwVJEyqg4k"

# Vercel Cron Secret (for scheduled notifications)
CRON_SECRET="your_random_secret_here"
```

### Add to `.env.example`

```bash
# ============================================
# NOTIFICATION SYSTEM
# ============================================

# Upstash QStash
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN=""
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""

# Firebase Admin SDK (paste full JSON as single line)
FIREBASE_ADMIN_SDK_JSON=''

# Firebase Client SDK (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# Firebase VAPID Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=""

# Vercel Cron Secret
CRON_SECRET=""
```

## 2. Firebase Configuration Files

### Download from Firebase Console

1. **Admin SDK JSON:**
   - Firebase Console → Project Settings → Service Accounts
   - "Generate new private key"
   - Save as `massava-firebase-adminsdk.json`
   - **DO NOT commit this file!**

2. **GoogleService-Info.plist (iOS):**
   - Firebase Console → Project Settings → Your apps → iOS
   - Download and place in `ios/App/App/`

3. **google-services.json (Android):**
   - Firebase Console → Project Settings → Your apps → Android
   - Download and place in `android/app/`

### .gitignore Additions

```gitignore
# Firebase
*-firebase-adminsdk*.json
GoogleService-Info.plist
google-services.json
```

## 3. Vercel Configuration

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/notification-cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### Vercel Environment Variables

Add all variables from `.env.local` to Vercel:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable for Production, Preview, and Development

**Important:** For `FIREBASE_ADMIN_SDK_JSON`, the JSON must be on a single line with escaped newlines in the private key.

### Generate CRON_SECRET

```bash
openssl rand -base64 32
```

## 4. Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud)
- Xcode 15+ (for iOS simulator)
- Android Studio (for Android emulator)

### First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local
# Then fill in values

# 3. Run database migration
npx prisma migrate dev

# 4. Generate Prisma client
npx prisma generate

# 5. Start development server
npm run dev
```

### Mobile Development Setup

```bash
# Install Capacitor platforms
npx cap add ios
npx cap add android

# For iOS (requires Xcode)
npx cap open ios

# For Android (requires Android Studio)
npx cap open android
```

### Testing Push Notifications Locally

**Web Push:**
1. Start dev server: `npm run dev`
2. Open browser, allow notifications
3. Register device via UI
4. Trigger notification via API/dashboard

**Android Emulator:**
1. Create emulator with Google APIs (not AOSP)
2. Run `npx cap open android`
3. Build and run on emulator
4. Push notifications work!

**iOS Simulator:**
Push notifications do NOT work in iOS Simulator. Options:
- Test on real device with Apple Developer Account
- Use local notifications for UI testing
- Mock push service in development

## 5. Notification Cleanup Cron

```typescript
// app/api/cron/notification-cleanup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Delete old notifications (GDPR compliance)
  const deleted = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: ninetyDaysAgo },
    },
  });

  // Cleanup inactive device tokens
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deactivated = await prisma.deviceToken.updateMany({
    where: {
      lastUsedAt: { lt: thirtyDaysAgo },
      isActive: true,
    },
    data: { isActive: false },
  });

  return NextResponse.json({
    deletedNotifications: deleted.count,
    deactivatedTokens: deactivated.count,
  });
}
```

## 6. Service Worker for Web Push

Create `public/firebase-messaging-sw.js` with Firebase config injected at build time:

```javascript
// public/firebase-messaging-sw.js

// These will be replaced at build time
const FIREBASE_CONFIG = {
  apiKey: "{{NEXT_PUBLIC_FIREBASE_API_KEY}}",
  authDomain: "{{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}}",
  projectId: "{{NEXT_PUBLIC_FIREBASE_PROJECT_ID}}",
  storageBucket: "{{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}}",
  messagingSenderId: "{{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}}",
  appId: "{{NEXT_PUBLIC_FIREBASE_APP_ID}}",
};

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp(FIREBASE_CONFIG);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const options = {
    body,
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    data: payload.data,
  };
  self.registration.showNotification(title || 'Massava', options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.actionUrl || '/';
  event.waitUntil(clients.openWindow(url));
});
```

### Build Script to Inject Config

```typescript
// scripts/build-service-worker.ts

import fs from 'fs';
import path from 'path';

const template = fs.readFileSync(
  path.join(process.cwd(), 'public/firebase-messaging-sw.template.js'),
  'utf-8'
);

const output = template
  .replace('{{NEXT_PUBLIC_FIREBASE_API_KEY}}', process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '')
  .replace('{{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}}', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '')
  .replace('{{NEXT_PUBLIC_FIREBASE_PROJECT_ID}}', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '')
  .replace('{{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}}', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '')
  .replace('{{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}}', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '')
  .replace('{{NEXT_PUBLIC_FIREBASE_APP_ID}}', process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '');

fs.writeFileSync(
  path.join(process.cwd(), 'public/firebase-messaging-sw.js'),
  output
);

console.log('Service worker built successfully');
```

Add to package.json:
```json
{
  "scripts": {
    "build:sw": "tsx scripts/build-service-worker.ts",
    "build": "npm run build:sw && next build"
  }
}
```

## 7. TypeScript Configuration

Ensure these types are included in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@capacitor/core"]
  }
}
```

## 8. Dependencies Summary

Install all new dependencies:

```bash
# Queue & Real-time
npm install @upstash/qstash

# Firebase
npm install firebase firebase-admin

# State Management
npm install zustand

# Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/push-notifications @capacitor/haptics @capacitor/app @capacitor/badge

# Dev dependencies
npm install -D @types/firebase
```

## Verification Checklist

- [ ] All environment variables set in `.env.local`
- [ ] Firebase Admin SDK JSON configured
- [ ] Firebase client config (NEXT_PUBLIC_*) configured
- [ ] VAPID key configured
- [ ] QStash credentials configured
- [ ] CRON_SECRET generated
- [ ] vercel.json created with cron jobs
- [ ] .gitignore updated for Firebase files
- [ ] Service worker template created
- [ ] All dependencies installed
- [ ] `npm run build` succeeds
- [ ] `npx prisma generate` succeeds

## Troubleshooting

### Firebase Admin SDK Error

If you get "Invalid service account", ensure:
1. JSON is valid (use a JSON validator)
2. Private key newlines are escaped (`\n`)
3. JSON is on a single line in env var

### QStash Signature Error

If webhook fails signature verification:
1. Check both signing keys are set
2. Ensure webhook URL matches exactly
3. Check clock skew on server

### Capacitor Build Errors

```bash
# iOS
cd ios/App && pod deintegrate && pod install && cd ../..

# Android
cd android && ./gradlew clean && cd ..
npx cap sync
```
