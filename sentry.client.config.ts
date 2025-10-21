/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 */

import * as Sentry from '@sentry/nextjs';

// Detect environment based on Vercel environment variable
const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || 'production';
const isStaging = vercelEnv === 'preview' || vercelEnv === 'staging';
const environment = isStaging ? 'staging' : 'production';

// Use different DSN for staging vs production
const dsn = isStaging
  ? 'https://c62cdd99551a414f91a6bde0f4e2044e@errors.rnltlabs.de/6' // staging project
  : 'https://02d6100bfb5c4c53b806e97f2125dba7@errors.rnltlabs.de/3'; // production project

Sentry.init({
  dsn,
  environment,
  release: 'massava@0.1.0',

  // Error tracking
  sampleRate: 1.0, // 100% of errors
  tracesSampleRate: 0.0, // No performance tracking

  // Only track errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Privacy
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
});
