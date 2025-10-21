'use client';

/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { logger } from '../utils/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send to GlitchTip for tracking
    Sentry.captureException(error);

    // Send to critical-alerts Discord channel
    logger.fatal('Next.js Error Boundary caught error', error, {
      digest: error.digest,
      errorBoundary: true,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
        <div className="mb-4 text-5xl">💀</div>
        <h2 className="text-2xl font-semibold mb-3">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          An unexpected error occurred. The error has been logged and we&apos;ll look into it.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded text-left">
            <p className="text-xs font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}
        <button
          onClick={reset}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded hover:bg-primary/90 transition-colors font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
