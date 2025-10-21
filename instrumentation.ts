/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Next.js Instrumentation
 *
 * This file enables Sentry initialization in Next.js 13+ (App Router).
 * It automatically loads sentry.client.config.ts and sentry.server.config.ts.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime
    await import('./sentry.server.config');
  }
}
