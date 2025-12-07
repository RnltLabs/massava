import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Multi-Environment Capacitor Configuration
 *
 * Supports dynamic configuration based on APP_ENV environment variable:
 * - development: Local development with hot reload from localhost:3000
 * - staging: Testing environment pointing to staging.massava.app
 * - production: Production build loading from webDir
 *
 * Usage:
 * - Development: APP_ENV=development npx cap sync
 * - Staging: APP_ENV=staging npx cap sync
 * - Production: APP_ENV=production npx cap sync (default)
 *
 * Android Flavors:
 * - dev: com.massava.app.dev
 * - staging: com.massava.app.staging
 * - production: com.massava.app
 */

type Environment = 'development' | 'staging' | 'production';

const APP_ENV = (process.env.APP_ENV || 'production') as Environment;

/**
 * Environment-specific configuration
 */
const environmentConfig: Record<Environment, {
  appId: string;
  appName: string;
  serverUrl?: string;
  cleartext?: boolean;
}> = {
  development: {
    appId: 'com.massava.app.dev',
    appName: 'Massava (Dev)',
    serverUrl: 'http://localhost:3000',
    cleartext: true, // Allow HTTP for local development
  },
  staging: {
    appId: 'com.massava.app.staging',
    appName: 'Massava (Staging)',
    serverUrl: 'https://staging.massava.app',
    cleartext: false,
  },
  production: {
    appId: 'com.massava.app',
    appName: 'Massava',
    // No serverUrl - load from webDir
    cleartext: false,
  },
};

const envConfig = environmentConfig[APP_ENV];

const config: CapacitorConfig = {
  appId: envConfig.appId,
  appName: envConfig.appName,
  webDir: 'out',

  // Server configuration (only for dev/staging)
  ...(envConfig.serverUrl && {
    server: {
      url: envConfig.serverUrl,
      cleartext: envConfig.cleartext,
    },
  }),

  // Plugin configuration (shared across all environments)
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Badge: {
      persist: true,
      autoClear: false,
    },
  },

  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    scheme: 'Massava',
  },

  // Android-specific configuration
  android: {
    allowMixedContent: APP_ENV === 'development', // Only allow mixed content in dev
    // Android flavors support different package names per environment
    // Configure in android/app/build.gradle:
    // productFlavors {
    //   dev { applicationIdSuffix ".dev" }
    //   staging { applicationIdSuffix ".staging" }
    //   production { }
    // }
  },
};

// Log configuration on build (for debugging)
console.log(`Capacitor Config - Environment: ${APP_ENV}`);
console.log(`  App ID: ${config.appId}`);
console.log(`  App Name: ${config.appName}`);
if (config.server?.url) {
  console.log(`  Server URL: ${config.server.url}`);
}

export default config;
