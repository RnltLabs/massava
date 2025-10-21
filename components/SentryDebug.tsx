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
    };
  }
}

/**
 * Export Sentry globally for debugging in browser console
 * This component runs on the client side and makes Sentry available
 * for manual testing via console: Sentry.captureMessage("test")
 */
export default function SentryDebug() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || 'production';
      const isStaging = vercelEnv === 'preview' || vercelEnv === 'staging';
      const environment = isStaging ? 'staging' : 'production';

      window.Sentry = Sentry;
      window.sentryDebug = {
        environment,
        enabled: process.env.NODE_ENV === 'production',
      };

      console.log('[SentryDebug] Sentry exported globally', window.sentryDebug);
    }
  }, []);

  return null; // This component doesn't render anything
}
