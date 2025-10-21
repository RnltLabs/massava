/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Extend Window interface to include Sentry types
declare global {
  interface Window {
    Sentry: typeof Sentry;
    sentryDebug: {
      environment: string;
      enabled: boolean;
      dsn: string;
    };
  }
}

/**
 * Initialize and export Sentry for debugging
 * In Next.js standalone mode, we need to manually initialize Sentry client-side
 */
export default function SentryDebug() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detect environment
      const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || 'production';
      const isStaging = vercelEnv === 'preview' || vercelEnv === 'staging';
      const environment = isStaging ? 'staging' : 'production';

      // Select DSN based on environment
      const dsn = isStaging
        ? 'https://c62cdd99551a414f91a6bde0f4e2044e@errors.rnltlabs.de/6' // staging
        : 'https://02d6100bfb5c4c53b806e97f2125dba7@errors.rnltlabs.de/3'; // production

      // Initialize Sentry if not already initialized
      if (!Sentry.getClient()) {
        Sentry.init({
          dsn,
          environment,
          release: 'massava@0.1.0',
          sampleRate: 1.0,
          tracesSampleRate: 0.0,
          enabled: true,
          replaysSessionSampleRate: 0.0,
          replaysOnErrorSampleRate: 0.0,
        });

        console.log('[SentryDebug] Sentry initialized:', { dsn, environment });
      }

      // Export globally for debugging
      window.Sentry = Sentry;
      window.sentryDebug = {
        environment,
        enabled: true,
        dsn,
      };
    }
  }, []);

  return null;
}
