/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Only use basePath in production (rnltlabs.de/massava)
  // In development, run on root (localhost:3000)
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
