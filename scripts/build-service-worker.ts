/**
 * Build Service Worker Script
 *
 * Reads the service worker template and injects Firebase config at build time.
 * The generated file (firebase-messaging-sw.js) is in .gitignore.
 *
 * Usage: npm run build:sw (automatically called in prebuild)
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file (for local development)
dotenv.config();

const templatePath = path.join(process.cwd(), 'public/firebase-messaging-sw.template.js');
const outputPath = path.join(process.cwd(), 'public/firebase-messaging-sw.js');

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('[Build SW] ERROR: Missing required environment variables:');
  missingVars.forEach((varName) => console.error(`  - ${varName}`));
  console.error('[Build SW] Service worker will not work without Firebase config!');
  // Don't exit - still generate the file so the app can start (just without push)
}

// Read the template
if (!fs.existsSync(templatePath)) {
  console.error('[Build SW] ERROR: Template file not found:', templatePath);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf-8');

// Helper to strip surrounding quotes from env values (in case secrets were stored with quotes)
function stripQuotes(value: string | undefined): string {
  if (!value) return '';
  // Remove surrounding double or single quotes
  return value.replace(/^["']|["']$/g, '');
}

// Create the config injection
const firebaseConfig = {
  apiKey: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const configCode = `// Firebase config - injected at build time (${new Date().toISOString()})
const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 2)};
`;

// Replace the placeholder with the actual config
const output = template.replace(
  '// __FIREBASE_CONFIG_PLACEHOLDER__ - This line will be replaced by the build script',
  configCode
);

// Write the generated service worker
fs.writeFileSync(outputPath, output);

// Log success with config summary (without exposing full values)
console.log('[Build SW] Service worker generated successfully');
console.log('[Build SW] Firebase config status:');
console.log(`  - apiKey: ${firebaseConfig.apiKey ? '✓ set' : '✗ missing'}`);
console.log(`  - projectId: ${firebaseConfig.projectId ? '✓ set' : '✗ missing'}`);
console.log(`  - messagingSenderId: ${firebaseConfig.messagingSenderId ? '✓ set' : '✗ missing'}`);
console.log(`  - appId: ${firebaseConfig.appId ? '✓ set' : '✗ missing'}`);
console.log(`[Build SW] Output: ${outputPath}`);
