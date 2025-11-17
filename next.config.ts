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
    ignoreDuringBuilds: true, // Temporarily ignore ESLint warnings during build (TODO: fix warnings)
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable source maps for production (needed for GlitchTip)
  productionBrowserSourceMaps: true,

  // Note: instrumentation.ts is automatically enabled in Next.js 15+
  // No experimental flag needed

  /**
   * PHASE 3: Image Optimization
   * - WebP/AVIF: -50% file size
   * - Lazy loading: Only load in viewport
   * - Core Web Vitals: LCP -40%, CLS 0
   */
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year (images are immutable)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  /**
   * PHASE 3: Compression (gzip + brotli)
   * - Brotli: -20% vs gzip
   * - Bandwidth savings: ~75%
   */
  compress: true,

  /**
   * PHASE 3: Experimental Features
   * - optimizePackageImports: Tree shake large packages
   * - serverActions: Reduce client bundle size
   */
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "date-fns",
      "lodash",
    ],
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // typedRoutes: true, // Disabled: Causes issues with NextAuth internal routes
  },

  // Security Headers (STRATEGY.md Section 8.2 - Phase 2) + Cache-Control (Phase 3)
  async headers() {
    return [
      /**
       * PHASE 3: Static Assets Caching (/_next/static/*)
       * Cache-Control: public, max-age=31536000, immutable
       * - 100% cache hit rate (zero origin requests)
       */
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      /**
       * PHASE 3: Image Optimization Caching (/_next/image/*)
       * Cache-Control: public, max-age=31536000, immutable
       * - Serves images from edge (1-5ms latency)
       */
      {
        source: "/_next/image/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      /**
       * PHASE 3: Public Assets Caching (/images/*, /fonts/*, etc.)
       * Cache-Control: public, max-age=31536000, immutable
       * - Zero origin requests for static assets
       */
      {
        source: "/:path(images|fonts|icons|videos)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      /**
       * PHASE 3: API Routes - No Caching
       * Cache-Control: no-store, must-revalidate
       * - Always fetch fresh (API data changes frequently)
       */
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },

      /**
       * SECURITY: Auth API Routes - Enhanced Security Headers
       * Applies to /api/auth/* endpoints for additional security
       * - X-Frame-Options: Prevents clickjacking attacks
       * - X-Content-Type-Options: Prevents MIME sniffing
       * - Referrer-Policy: Controls referrer information leakage
       * - X-XSS-Protection: Legacy XSS protection (defense in depth)
       */
      {
        source: "/api/auth/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },

      /**
       * PHASE 3: Auth Routes - No Caching (Security)
       * Cache-Control: no-store, must-revalidate
       * - Never cache sensitive auth data
       */
      {
        source: "/:path(api/auth|auth|login|register|logout)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },

      /**
       * Security Headers + Default Cache-Control for HTML
       */
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
              "img-src 'self' data: blob: https:", // Allow external images (studio photos) + blob for previews
              "font-src 'self' data:",
              "connect-src 'self' https://errors.rnltlabs.de https://glitchtip.rnltlabs.de https://photon.komoot.io", // Allow Sentry/GlitchTip + Photon Geocoding API
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          /**
           * PHASE 3: HTML Pages Default Caching
           * Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
           * - CDN caches for 1 hour
           * - Serve stale for 24h while revalidating
           */
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
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
