/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Since migration to massava.app, no basePath is needed (runs at domain root)
  // Previously: basePath was '/massava' for staging.rnltlabs.de/massava
  // Now: massava.app and staging.massava.app run without basePath
  basePath: '',
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable source maps for production (needed for GlitchTip)
  productionBrowserSourceMaps: true,

  // Note: instrumentation.ts is automatically enabled in Next.js 15+
  // No experimental flag needed

  // Security Headers (STRATEGY.md Section 8.2 - Phase 2)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains', // HSTS
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline for dev
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: https:", // Allow external images (studio photos)
              "font-src 'self' data:",
              "connect-src 'self' https://errors.rnltlabs.de https://glitchtip.rnltlabs.de https://photon.komoot.io", // Allow Sentry/GlitchTip + Photon Geocoding API
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

// Apply Next Intl plugin first, then Sentry
export default withSentryConfig(withNextIntl(nextConfig), {
  // Sentry Webpack Plugin Options
  org: 'rnlt-labs',
  project: 'massava',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,

  // Source maps configuration
  sourcemaps: {
    disable: false, // Enable source maps for GlitchTip
  },
});
