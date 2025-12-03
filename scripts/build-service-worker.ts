/**
 * Build Service Worker Script
 *
 * Injects Firebase config into the service worker at build time.
 */

import fs from 'fs';
import path from 'path';

const swPath = path.join(process.cwd(), 'public/firebase-messaging-sw.js');

// Read the service worker template
let swContent = fs.readFileSync(swPath, 'utf-8');

// Create the config injection
const configInjection = `
// Firebase config injected at build time
self.FIREBASE_CONFIG = {
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}",
};
`;

// Check if config is already injected
if (!swContent.includes('self.FIREBASE_CONFIG')) {
  // Prepend config to the file
  swContent = configInjection + swContent;
  fs.writeFileSync(swPath, swContent);
  console.log('[Build] Firebase config injected into service worker');
} else {
  console.log('[Build] Service worker already has config');
}
