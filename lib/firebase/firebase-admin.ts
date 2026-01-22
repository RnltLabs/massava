/**
 * Firebase Admin SDK Configuration
 *
 * Server-side Firebase initialization for push notifications.
 * Uses service account credentials from environment variable.
 */

import admin from 'firebase-admin';
import { logger } from '@/lib/logger';

// Parse service account from environment variable
function getServiceAccount(): admin.ServiceAccount | null {
  const jsonString = process.env.FIREBASE_ADMIN_SDK_JSON;

  if (!jsonString) {
    logger.warn('[Firebase Admin] FIREBASE_ADMIN_SDK_JSON not set. Push notifications disabled.');
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
    };
  } catch (error) {
    logger.error('[Firebase Admin] Failed to parse service account JSON:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
}

// Initialize Firebase Admin (singleton)
let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    return null;
  }

  try {
    // Check if already initialized
    try {
      firebaseApp = admin.app();
      return firebaseApp;
    } catch {
      // Not initialized, proceed with initialization
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('[Firebase Admin] Initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('[Firebase Admin] Initialization failed:', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging | null {
  const app = getFirebaseAdmin();
  if (!app) {
    return null;
  }
  return admin.messaging(app);
}

/**
 * Check if Firebase Admin is available
 */
export function isFirebaseAdminAvailable(): boolean {
  return getFirebaseAdmin() !== null;
}
