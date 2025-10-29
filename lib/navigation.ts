/**
 * Navigation utilities for handling basePath in different environments
 *
 * Since migration to massava.app domain, the app runs at root level (no basePath)
 * Previously: staging.rnltlabs.de/massava (with /massava basePath)
 * Now: massava.app and staging.massava.app (no basePath)
 *
 * These utilities are kept for backwards compatibility but now return empty basePath
 */

/**
 * Get the basePath for the current environment
 * @returns The basePath string (empty '' since we moved to dedicated domain)
 */
export function getBasePath(): string {
  // Since migration to massava.app, no basePath is used
  // Legacy support: Check if URL still contains /massava for backwards compatibility
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/massava')) {
      return '/massava';
    }
  }

  // Default: no basePath for massava.app
  return '';
}

/**
 * Get a route with the correct basePath prepended
 * @param path - The path without basePath (e.g., '/dashboard', '/auth/signin')
 * @returns The full path with basePath (e.g., '/massava/dashboard' in production)
 */
export function getRouteWithBasePath(path: string): string {
  const basePath = getBasePath();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return basePath + normalizedPath;
}

/**
 * Get a URL with basePath for server-side redirects using NextResponse.redirect()
 * @param path - The path without basePath (e.g., '/dashboard', '/auth/signin')
 * @param baseUrl - The base URL (e.g., from request.url)
 * @returns A complete URL object with basePath included
 */
export function getRedirectUrl(path: string, baseUrl: string | URL): URL {
  const fullPath = getRouteWithBasePath(path);
  return new URL(fullPath, baseUrl);
}

/**
 * Get a callbackUrl for NextAuth with basePath
 * Useful for signIn(), signOut(), etc.
 * @param path - The path without basePath (e.g., '/dashboard')
 * @returns The full path with basePath
 */
export function getAuthCallbackUrl(path: string): string {
  return getRouteWithBasePath(path);
}
