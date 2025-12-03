import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.massava.app',
  appName: 'Massava',
  webDir: 'out',
  server: {
    // For development, connect to local Next.js dev server
    // Comment out for production builds
    // url: 'http://localhost:3000',
    // cleartext: true,
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
