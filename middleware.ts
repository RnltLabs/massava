/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Internationalization Middleware
 * Since migration to massava.app domain, no basePath is used
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use prefix (e.g., /de/studios instead of /studios)
  localePrefix: 'always',

  // Enable locale detection from cookies
  localeDetection: true,
});

// Since migration to massava.app, we run at root level (no basePath)
// Simply export the next-intl middleware
export default intlMiddleware;

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
