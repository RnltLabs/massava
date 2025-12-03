# Mobile App (Capacitor)

## Overview

This document covers:
1. Capacitor installation and setup
2. iOS configuration (Xcode)
3. Android configuration (Android Studio)
4. Native plugins for push notifications
5. Simulator testing instructions

**Note:** App Store/Play Store deployment is NOT part of this implementation. Focus is on simulator testing.

## 1. Capacitor Installation

### Install Dependencies

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/push-notifications
npm install @capacitor/haptics
npm install @capacitor/app
npm install @capacitor/badge
```

### Initialize Capacitor

```bash
npx cap init massava com.massava.app --web-dir=out
```

### Capacitor Configuration

```typescript
// capacitor.config.ts

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.massava.app',
  appName: 'Massava',
  webDir: 'out',
  server: {
    // For development, connect to local Next.js dev server
    // Comment out for production builds
    url: 'http://localhost:3000',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Badge: {
      persist: true,
      autoClear: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Massava',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
```

### Update package.json Scripts

```json
{
  "scripts": {
    "cap:build": "next build && next export && npx cap sync",
    "cap:ios": "npx cap open ios",
    "cap:android": "npx cap open android",
    "cap:sync": "npx cap sync"
  }
}
```

### Next.js Export Configuration

```typescript
// next.config.ts

const nextConfig = {
  // ... existing config
  output: 'export', // Enable static export for Capacitor
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
```

**Note:** For development, you can skip the export and use `server.url` in capacitor.config.ts to connect to your dev server.

## 2. Add Native Platforms

```bash
npx cap add ios
npx cap add android
```

## 3. iOS Configuration

### Open in Xcode

```bash
npx cap open ios
```

### Configure Push Notifications in Xcode

1. **Select the project** in the navigator
2. **Select the target** "App"
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Push Notifications**
6. Add **Background Modes** → Check "Remote notifications"

### Info.plist Additions

The following should be added to `ios/App/App/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
<key>NSCameraUsageDescription</key>
<string>Massava benötigt Zugriff auf die Kamera für Profilbilder</string>
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

### AppDelegate.swift Modifications

Update `ios/App/App/AppDelegate.swift`:

```swift
import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure Firebase
        FirebaseApp.configure()

        // Set messaging delegate
        Messaging.messaging().delegate = self

        // Request notification authorization
        UNUserNotificationCenter.current().delegate = self

        return true
    }

    // Handle device token registration
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token: \(String(describing: fcmToken))")

        // Post token to be picked up by Capacitor plugin
        let dataDict: [String: String] = ["token": fcmToken ?? ""]
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: dataDict
        )
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    // Handle foreground notifications
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.badge, .sound, .banner])
    }

    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        print("Notification tapped with userInfo: \(userInfo)")
        completionHandler()
    }
}
```

### Add Firebase iOS SDK via CocoaPods

Update `ios/App/Podfile`:

```ruby
platform :ios, '14.0'
use_frameworks!

target 'App' do
  capacitor_pods

  # Firebase
  pod 'Firebase/Core'
  pod 'Firebase/Messaging'
end
```

Then install pods:

```bash
cd ios/App
pod install
cd ../..
```

### Add GoogleService-Info.plist

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to `ios/App/App/` directory
3. In Xcode, drag the file into the project navigator under "App"

## 4. Android Configuration

### Open in Android Studio

```bash
npx cap open android
```

### Add Firebase to Android

1. Download `google-services.json` from Firebase Console
2. Place in `android/app/` directory

### Update android/build.gradle

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.0'
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### Update android/app/build.gradle

```gradle
plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'
}

android {
    // ... existing config
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
    // ... existing dependencies
}
```

### AndroidManifest.xml

Update `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-permission android:name="android.permission.VIBRATE"/>

    <application>
        <!-- ... existing content -->

        <!-- FCM Default Channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="default_notifications" />

        <!-- Default notification icon -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />

        <!-- Default notification color -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
    </application>
</manifest>
```

### Create Notification Channels

Create `android/app/src/main/java/com/massava/app/MainApplication.java`:

```java
package com.massava.app;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            // Urgent notifications
            NotificationChannel urgent = new NotificationChannel(
                "urgent_notifications",
                "Dringende Benachrichtigungen",
                NotificationManager.IMPORTANCE_HIGH
            );
            urgent.setDescription("Neue Buchungsanfragen und wichtige Updates");
            urgent.enableVibration(true);
            manager.createNotificationChannel(urgent);

            // High priority
            NotificationChannel high = new NotificationChannel(
                "high_priority_notifications",
                "Wichtige Benachrichtigungen",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            high.setDescription("Stornierungen und Bestätigungen");
            manager.createNotificationChannel(high);

            // Default
            NotificationChannel defaultChannel = new NotificationChannel(
                "default_notifications",
                "Allgemeine Benachrichtigungen",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            defaultChannel.setDescription("Erinnerungen und Updates");
            manager.createNotificationChannel(defaultChannel);
        }
    }
}
```

## 5. Capacitor Push Plugin Integration

### Push Service for Capacitor

```typescript
// lib/capacitor/push-service.ts

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Badge } from '@capacitor/badge';

class CapacitorPushService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.isInitialized) {
      return;
    }

    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      console.log('Push permission denied');
      return;
    }

    // Register with APNS/FCM
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success:', token.value);
      await this.registerToken(token.value);
    });

    // Listen for errors
    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err.error);
    });

    // Listen for incoming notifications (foreground)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received:', notification);

      // Haptic feedback
      await this.triggerHaptic(notification.data?.priority);

      // Update badge
      await this.updateBadge();
    });

    // Listen for notification taps
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action:', action);
      this.handleNotificationAction(action);
    });

    this.isInitialized = true;
  }

  private async registerToken(token: string): Promise<void> {
    try {
      await fetch('/api/notifications/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: Capacitor.getPlatform().toUpperCase(), // 'IOS' or 'ANDROID'
          deviceName: await this.getDeviceName(),
          appVersion: '1.0.0', // Get from app config
        }),
      });
    } catch (error) {
      console.error('Failed to register token:', error);
    }
  }

  private async triggerHaptic(priority?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    switch (priority) {
      case 'URGENT':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise(r => setTimeout(r, 100));
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'HIGH':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
    }
  }

  private async updateBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const response = await fetch('/api/notifications/unread-count');
      const data = await response.json();
      await Badge.set({ count: data.count });
    } catch (error) {
      console.error('Failed to update badge:', error);
    }
  }

  async clearBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await Badge.clear();
  }

  private handleNotificationAction(action: any): void {
    const data = action.notification.data;

    if (data?.actionUrl) {
      // Navigate to action URL
      window.location.href = data.actionUrl;
    }
  }

  private async getDeviceName(): Promise<string> {
    // Basic device info - can be enhanced with Device plugin
    return `${Capacitor.getPlatform()} Device`;
  }
}

export const capacitorPushService = new CapacitorPushService();
```

### Initialize in App

```typescript
// components/CapacitorInitializer.tsx

'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { capacitorPushService } from '@/lib/capacitor/push-service';
import { App } from '@capacitor/app';

export function CapacitorInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Initialize push notifications
    capacitorPushService.initialize();

    // Handle app state changes
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        // App came to foreground - refresh badge
        // This is handled by the push service
      }
    });

    // Handle deep links
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('Deep link:', url);
      // Handle URL routing
    });

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return <>{children}</>;
}
```

## 6. Simulator Testing

### iOS Simulator

**Note:** Push notifications do NOT work in iOS Simulator. You can only test:
- UI components
- SSE real-time updates
- Local notification appearance

To run on simulator:

```bash
# Build the web app
npm run build

# If using static export
npm run cap:build

# Open Xcode
npx cap open ios

# In Xcode:
# 1. Select a simulator (e.g., iPhone 15)
# 2. Click the Play button (⌘R)
```

For push testing, you need:
- Apple Developer Account ($99/year)
- Physical iOS device
- Provisioning profile with push capability

### Android Emulator

Android Emulator DOES support push notifications!

```bash
# Build the web app
npm run build

# Open Android Studio
npx cap open android

# In Android Studio:
# 1. Select an emulator or create one (AVD Manager)
# 2. Click the Run button (Shift+F10)
```

### Development Workflow

For faster development without rebuilding:

1. **Update capacitor.config.ts:**
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:3000', // Use your machine's IP, not localhost
  cleartext: true,
}
```

2. **Start Next.js dev server:**
```bash
npm run dev
```

3. **Run app on simulator:**
The app will connect to your dev server for live reload.

4. **For production testing:**
```typescript
// capacitor.config.ts
server: {
  // Comment out the url to use embedded web assets
  // url: 'http://localhost:3000',
}
```

Then run `npx cap sync` and rebuild.

## 7. App Icons and Splash Screen

### iOS

Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro @2x)
- 152x152 (iPad @2x)
- etc.

### Android

Place icons in `android/app/src/main/res/`:
- `mipmap-xxxhdpi/` (192x192)
- `mipmap-xxhdpi/` (144x144)
- `mipmap-xhdpi/` (96x96)
- `mipmap-hdpi/` (72x72)
- `mipmap-mdpi/` (48x48)

### Generate Icons

Use a tool like https://icon.kitchen or:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#6366f1'
```

## Verification Checklist

- [ ] Capacitor initializes correctly
- [ ] iOS project opens in Xcode
- [ ] Android project opens in Android Studio
- [ ] iOS Simulator runs the app
- [ ] Android Emulator runs the app
- [ ] Firebase SDK is configured
- [ ] Push notifications work on Android Emulator
- [ ] Haptic feedback works
- [ ] Badge count updates
- [ ] Deep links navigate correctly

## Troubleshooting

### iOS Build Errors

```bash
cd ios/App
pod deintegrate
pod install
```

### Android Build Errors

```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Push Not Working on Android Emulator

1. Make sure Google Play Services is available on the emulator
2. Use an emulator with "Google APIs" (not just "AOSP")
3. Sign into a Google account on the emulator
