/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Use basePath in production (both staging and production use /massava)
  // NODE_ENV is available at build time (set in Dockerfile)
  // IMPORTANT: basePath is evaluated at BUILD TIME, not RUNTIME
  basePath: process.env.NODE_ENV === 'production' ? '/massava' : '',
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
              "connect-src 'self' https://errors.rnltlabs.de https://glitchtip.rnltlabs.de", // Allow Sentry/GlitchTip
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
